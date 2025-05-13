import type {ChangeObject, AllDiffOptions, AbortableDiffOptions, DiffCallbackNonabortable, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackAbortable, TimeoutOption, MaxEditLengthOption} from '../types.js';

/**
 * Like a ChangeObject, but with no value and an extra `previousComponent` property.
 * A linked list of these (linked via `.previousComponent`) is used internally in the code below to
 * keep track of the state of the diffing algorithm, but gets converted to an array of
 * ChangeObjects before being returned to the caller.
 */
interface DraftChangeObject {
    added: boolean;
    removed: boolean;
    count: number;
    previousComponent?: DraftChangeObject;

    // Only added in buildValues:
    value?: any;
}

interface Path {
  oldPos: number;
  lastComponent: DraftChangeObject | undefined
}

export default class Diff<
  TokenT,
  ValueT extends Iterable<TokenT> = Iterable<TokenT>,
  InputValueT = ValueT
> {
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options: DiffCallbackNonabortable<ValueT>
  ): undefined;
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options: AllDiffOptions & AbortableDiffOptions & CallbackOptionAbortable<ValueT>
  ): undefined
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options: AllDiffOptions & CallbackOptionNonabortable<ValueT>
  ): undefined
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options: AllDiffOptions & AbortableDiffOptions
  ): ChangeObject<ValueT>[] | undefined
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    options?: AllDiffOptions
  ): ChangeObject<ValueT>[]
  diff(
    oldStr: InputValueT,
    newStr: InputValueT,
    // Type below is not accurate/complete - see above for full possibilities - but it compiles
    options: DiffCallbackNonabortable<ValueT> | AllDiffOptions & Partial<CallbackOptionNonabortable<ValueT>> = {}
  ): ChangeObject<ValueT>[] | undefined {
    let callback: DiffCallbackAbortable<ValueT> | DiffCallbackNonabortable<ValueT> | undefined;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if ('callback' in options) {
      callback = options.callback;
    }
    // Allow subclasses to massage the input prior to running
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);

    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));

    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }

  private diffWithOptionsObj(
    oldTokens: TokenT[],
    newTokens: TokenT[],
    options: AllDiffOptions & Partial<TimeoutOption> & Partial<MaxEditLengthOption>,
    callback: DiffCallbackAbortable<ValueT> | DiffCallbackNonabortable<ValueT> | undefined
  ): ChangeObject<ValueT>[] | undefined {
    const done = (value: ChangeObject<ValueT>[]) => {
      value = this.postProcess(value, options);
      if (callback) {
        setTimeout(function() { callback(value); }, 0);
        return undefined;
      } else {
        return value;
      }
    };

    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if(options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = options.timeout ?? Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;

    const bestPath: Path[] = [{ oldPos: -1, lastComponent: undefined }];

    // Seed editLength = 0, i.e. the content starts with the same values
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      // Identity per the equality and tokenizer
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }

    // Once we hit the right edge of the edit graph on some diagonal k, we can
    // definitely reach the end of the edit graph in no more than k edits, so
    // there's no point in considering any moves to diagonal k+1 any more (from
    // which we're guaranteed to need at least k+1 more edits).
    // Similarly, once we've reached the bottom of the edit graph, there's no
    // point considering moves to lower diagonals.
    // We record this fact by setting minDiagonalToConsider and
    // maxDiagonalToConsider to some finite value once we've hit the edge of
    // the edit graph.
    // This optimization is not faithful to the original algorithm presented in
    // Myers's paper, which instead pointlessly extends D-paths off the end of
    // the edit graph - see page 7 of Myers's paper which notes this point
    // explicitly and illustrates it with a diagram. This has major performance
    // implications for some common scenarios. For instance, to compute a diff
    // where the new text simply appends d characters on the end of the
    // original text of length n, the true Myers algorithm will take O(n+d^2)
    // time while this optimization needs only O(n+d) time.
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;

    // Main worker method. checks all permutations of a given edit length for acceptance.
    const execEditLength = () => {
      for (
        let diagonalPath = Math.max(minDiagonalToConsider, -editLength);
        diagonalPath <= Math.min(maxDiagonalToConsider, editLength);
        diagonalPath += 2
      ) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1],
              addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          // No one else is going to attempt to use this value, clear it
          // @ts-expect-error - perf optimisation. This type-violating value will never be read.
          bestPath[diagonalPath - 1] = undefined;
        }

        let canAdd = false;
        if (addPath) {
          // what newPos will be after we do an insertion:
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }

        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          // @ts-expect-error - perf optimisation. This type-violating value will never be read.
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the old string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canRemove || (canAdd && removePath.oldPos < addPath.oldPos)) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }

        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);

        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          // If we have hit the end of both strings, then we are done
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }

      editLength++;
    };

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced, or until the edit length exceeds options.maxEditLength (if given),
    // in which case it will return undefined.
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return (callback as DiffCallbackAbortable<ValueT>)(undefined);
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      }());
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret as ChangeObject<ValueT>[];
        }
      }
    }
  }

  private addToPath(
    path: Path,
    added: boolean,
    removed: boolean,
    oldPosInc: number,
    options: AllDiffOptions
  ): Path {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: {count: last.count + 1, added: added, removed: removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: {count: 1, added: added, removed: removed, previousComponent: last }
      };
    }
  }

  private extractCommon(
    basePath: Path,
    newTokens: TokenT[],
    oldTokens: TokenT[],
    diagonalPath: number,
    options: AllDiffOptions
  ): number {
    const newLen = newTokens.length,
          oldLen = oldTokens.length;
    let oldPos = basePath.oldPos,
        newPos = oldPos - diagonalPath,
        commonCount = 0;

    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = {count: 1, previousComponent: basePath.lastComponent, added: false, removed: false};
      }
    }

    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = {count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false};
    }

    basePath.oldPos = oldPos;
    return newPos;
  }

  equals(left: TokenT, right: TokenT, options: AllDiffOptions): boolean {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right
        || (!!options.ignoreCase && (left as string).toLowerCase() === (right as string).toLowerCase());
    }
  }

  removeEmpty(array: TokenT[]): TokenT[] {
    const ret: TokenT[] = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  castInput(value: InputValueT, options: AllDiffOptions): ValueT {
    return value as unknown as ValueT;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokenize(value: ValueT, options: AllDiffOptions): TokenT[] {
    return Array.from(value);
  }

  join(chars: TokenT[]): ValueT {
    // Assumes ValueT is string, which is the case for most subclasses.
    // When it's false, e.g. in diffArrays, this method needs to be overridden (e.g. with a no-op)
    // Yes, the casts are verbose and ugly, because this pattern - of having the base class SORT OF
    // assume tokens and values are strings, but not completely - is weird and janky.
    return (chars as string[]).join('') as unknown as ValueT;
  }

  postProcess(
    changeObjects: ChangeObject<ValueT>[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    options: AllDiffOptions
  ): ChangeObject<ValueT>[] {
    return changeObjects;
  }

  get useLongestToken(): boolean {
    return false;
  }

  private buildValues(
    lastComponent: DraftChangeObject | undefined,
    newTokens: TokenT[],
    oldTokens: TokenT[]
  ): ChangeObject<ValueT>[] {
    // First we convert our linked list of components in reverse order to an
    // array in the right order:
    const components: DraftChangeObject[] = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();

    const componentLen = components.length;
    let componentPos = 0,
        newPos = 0,
        oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value, i) {
            const oldValue = oldTokens[oldPos + i];
            return (oldValue as string).length > (value as string).length ? oldValue : value;
          });

          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;

        // Common case
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }

    return components as ChangeObject<ValueT>[];
  }
}

