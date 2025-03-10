import {ChangeObject} from '../types';

export type DiffCallback<ValueT> = (result?: ChangeObject<ValueT>[]) => void;

/**
 * Note that this contains the union of ALL options accepted by any of the built-in diffing
 * functions. The README notes which options are usable which functions. Using an option with a
 * diffing function that doesn't support it might yield unreasonable results.
 */
export interface DiffOptions<ValueT> {
  // Universal:
  callback?: DiffCallback<ValueT>,
  maxEditLength?: number,
  timeout?: number,
  oneChangePerToken?: boolean,

  // diffArrays only:
  comparator?: (a: any, b: any) => boolean,

  // diffChars or diffWords only:
  ignoreCase?: boolean,

  // diffJson only:
  undefinedReplacement?: any,
  stringifyReplacer?: (k: string, v: any) => any,

  // diffWords only:
  intlSegmenter?: Intl.Segmenter,
}

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
    previousComponent: DraftChangeObject;
}

interface Path {
  oldPos: number;
  lastComponent: DraftChangeObject
}

export default class Diff<
  TokenT,
  ValueT extends Iterable<TokenT> = Iterable<TokenT>
> {
  diff(
    oldString: ValueT,
    newString: ValueT,
    options: DiffCallback<TokenT> | DiffOptions<TokenT> = {}
  ): ChangeObject<ValueT>[] {
    let callback;
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else {
      callback = options.callback;
    }
    // Allow subclasses to massage the input prior to running
    oldString = this.castInput(oldString, options);
    newString = this.castInput(newString, options);

    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));

    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }

  private diffWithOptionsObj(oldTokens: TokenT[], newTokens: TokenT[], options: DiffOptions<TokenT>, callback: DiffCallback<TokenT>) {
    const self = this;
    function done(value) {
      value = self.postProcess(value, options);
      if (callback) {
        setTimeout(function() { callback(value); }, 0);
        return true;
      } else {
        return value;
      }
    }

    let newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if(options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = options.timeout ?? Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;

    let bestPath = [{ oldPos: -1, lastComponent: undefined }];

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
    function execEditLength() {
      for (
        let diagonalPath = Math.max(minDiagonalToConsider, -editLength);
        diagonalPath <= Math.min(maxDiagonalToConsider, editLength);
        diagonalPath += 2
      ) {
        let basePath;
        let removePath = bestPath[diagonalPath - 1],
            addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          // No one else is going to attempt to use this value, clear it
          bestPath[diagonalPath - 1] = undefined;
        }

        let canAdd = false;
        if (addPath) {
          // what newPos will be after we do an insertion:
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }

        let canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          bestPath[diagonalPath] = undefined;
          continue;
        }

        // Select the diagonal that we want to branch from. We select the prior
        // path whose position in the old string is the farthest from the origin
        // and does not pass the bounds of the diff graph
        if (!canRemove || (canAdd && removePath.oldPos < addPath.oldPos)) {
          basePath = self.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = self.addToPath(removePath, false, true, 1, options);
        }

        newPos = self.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);

        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          // If we have hit the end of both strings, then we are done
          return done(self.buildValues(basePath.lastComponent, newTokens, oldTokens));
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
    }

    // Performs the length of edit iteration. Is a bit fugly as this has to support the
    // sync and async mode which is never fun. Loops over execEditLength until a value
    // is produced, or until the edit length exceeds options.maxEditLength (if given),
    // in which case it will return undefined.
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback();
          }

          if (!execEditLength()) {
            exec();
          }
        }, 0);
      }());
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        let ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }

  private addToPath(
    path: Path,
    added: boolean,
    removed: boolean,
    oldPosInc: number,
    options: DiffOptions<TokenT>
  ): Path {
    let last = path.lastComponent;
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
    options: DiffOptions<TokenT>
  ): number {
    let newLen = newTokens.length,
        oldLen = oldTokens.length,
        oldPos = basePath.oldPos,
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

  protected equals(left: TokenT, right: TokenT, options: DiffOptions<TokenT>): boolean {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right
        || (options.ignoreCase && (left as string).toLowerCase() === (right as string).toLowerCase());
    }
  }

  protected removeEmpty(array: TokenT[]): TokenT[] {
    let ret = [];
    for (let i = 0; i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }

  protected castInput(value: ValueT, options: DiffOptions<TokenT>): ValueT {
    return value;
  }

  protected tokenize(value: ValueT, options: DiffOptions<TokenT>): TokenT[] {
    return Array.from(value);
  }

  protected join(chars: TokenT[]): ValueT {
    // Assumes ValueT is string, which is the case for most subclasses.
    // When it's false, e.g. in diffArrays, this method needs to be overridden (e.g. with a no-op)
    // Yes, the casts are verbose and ugly, because this pattern - of having the base class SORT OF
    // assume tokens and values are strings, but not completely - is weird and janky.
    return (chars as string[]).join('') as unknown as ValueT;
  }

  protected postProcess(changeObjects: ChangeObject<ValueT>[], options: DiffOptions<TokenT>): ChangeObject<ValueT>[] {
    return changeObjects;
  }

  protected get useLongestToken() {
    return false;
  }
  
  private buildValues(lastComponent, newTokens: TokenT[], oldTokens: TokenT[]) {
    // First we convert our linked list of components in reverse order to an
    // array in the right order:
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();

    let componentPos = 0,
        componentLen = components.length,
        newPos = 0,
        oldPos = 0;

    for (; componentPos < componentLen; componentPos++) {
      let component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value, i) {
            let oldValue = oldTokens[oldPos + i];
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

    return components;
  }
};

