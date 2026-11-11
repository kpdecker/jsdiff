import type {ChangeObject, AllDiffOptions, AbortableDiffOptions, DiffCallbackNonabortable, CallbackOptionAbortable, CallbackOptionNonabortable, DiffCallbackAbortable, TimeoutOption, MaxEditLengthOption} from '../types.js';
import {enqueueTask} from '../util/yield.js';

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

/**
 * Bookkeeping for the "discard unique tokens" optimisation (see buildDiscardPlan). Tokens that
 * occur (after normalization) on only one side of the diff can never be matched, so they are
 * dropped before the Myers loop runs and the loop is executed only upon the remaining skeleton.
 * This records the skeleton plus everything needed to reinstate the dropped tokens afterwards.
 */
interface DiscardPlan<TokenT> {
  /** Skeleton token arrays (original, un-normalized tokens; buildValues slices these). */
  oldSk: TokenT[];
  newSk: TokenT[];
  /** Normalized forms of the skeleton tokens; the diff loop compares these. All strings - see
   * the string-only guard in buildDiscardPlan. */
  oldSkNorm: TokenT[];
  newSkNorm: TokenT[];
  /** Skeleton index -> index in the original token array. Strictly increasing. */
  oldSkToOrig: number[];
  newSkToOrig: number[];
  /** How many tokens were dropped from each side. */
  discardedOld: number;
  discardedNew: number;
  /** Original token array lengths (== discarded* + skeleton length). */
  oldLen: number;
  newLen: number;
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
    const done = (lastComponent: DraftChangeObject | undefined) => {
      // Dropping/reinstating tokens happens at the component-list level, before buildValues
      // (which slices the *original* token arrays by component count).
      if (plan) {
        lastComponent = this.expandDiscarded(lastComponent, plan, options);
      }
      let value = this.buildValues(lastComponent, newTokens, oldTokens);
      value = this.postProcess(value, options);
      if (callback) {
        enqueueTask(function() { callback(value); });
        return undefined;
      } else {
        return value;
      }
    };

    let editLength = 1;
    let maxEditLength = oldTokens.length + newTokens.length;
    if(options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = options.timeout ?? Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;

    // Tokens are compared in normalized form, but the returned change objects are built from the
    // original tokens.
    const oldNormalizedAll = oldTokens.map(token => this.normalizeToken(token, options)),
          newNormalizedAll = newTokens.map(token => this.normalizeToken(token, options));

    // A token that occurs (post-normalization) on only one side can never be matched, since a
    // common subsequence consists solely of tokens occurring on both sides. Dropping such tokens
    // before diffing leaves every possible match intact while shrinking the N and the D of the
    // O(ND) Myers loop to the shared tokens; dropped tokens are reinstated as pure
    // deletions/insertions afterwards. This is the discard optimisation used by GNU diff and by
    // git's xdiff.
    const plan = this.buildDiscardPlan(
      oldTokens, newTokens, oldNormalizedAll, newNormalizedAll, options);

    // The diff loop below runs on the skeleton; all lengths from here on are skeleton lengths.
    const runOld = plan ? plan.oldSk : oldTokens;
    const runNew = plan ? plan.newSk : newTokens;
    const oldNormalized = plan ? plan.oldSkNorm : oldNormalizedAll;
    const newNormalized = plan ? plan.newSkNorm : newNormalizedAll;
    const newLen = runNew.length, oldLen = runOld.length;

    // Total edit distance = skeleton edit distance + the fixed cost of the dropped tokens, so the
    // skeleton loop must hit its maxEditLength abort one discardedTotal earlier than the caller's
    // maxEditLength, preserving the documented abort semantics.
    const editLengthCap = maxEditLength - (plan ? plan.discardedOld + plan.discardedNew : 0);

    // Seed editLength = 0, i.e. the content starts with the same values
    const initialPath: Path = { oldPos: -1, lastComponent: undefined };
    let newPos = this.extractCommon(initialPath, newNormalized, oldNormalized, 0, options);
    if (initialPath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      // The skeletons are identical (per the definition of "identical" implied by
      // tokenize, normalizeToken, and equals). The full inputs may still differ by the dropped
      // tokens, whose total edit cost is fixed; if that cost alone already exceeds maxEditLength,
      // abort exactly as the unoptimised loop would have.
      if (plan && plan.discardedOld + plan.discardedNew > maxEditLength) {
        if (callback) {
          enqueueTask(function() { (callback as DiffCallbackAbortable<ValueT>)(undefined); });
        }
        return undefined;
      }
      return done(initialPath.lastComponent);
    }

    // bestPath[offset + k] holds the furthest-reaching path on diagonal k = oldPos - newPos.
    // Positions range over -1 <= oldPos < oldLen and -1 <= newPos < newLen, so the edit graph has
    // the oldLen + newLen + 1 diagonals -newLen..oldLen, and the loop below never leaves them: a
    // path that reaches an edge of the graph stops the exploration beyond it (see
    // minDiagonalToConsider and maxDiagonalToConsider). The loop also reads k - 1 and k + 1, hence
    // one spare slot on each side. Diagonals go negative, and JavaScript engines store negative
    // array indices as ordinary named properties rather than as array elements, which would make
    // every lookup in the loop a slow dictionary access; the offset keeps every index within
    // [0, oldLen + newLen + 2].
    const offset = newLen + 1;
    const bestPath: Path[] = new Array(oldLen + newLen + 3);
    bestPath[offset] = initialPath;

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

    // The seed path may already sit on an edge of the graph (one text empty, or a prefix of the
    // other). Apply the same rule as the loop below; otherwise the first iteration would read one
    // slot before the start of bestPath when the new text is empty.
    if (initialPath.oldPos + 1 >= oldLen) {
      maxDiagonalToConsider = -1;
    }
    if (newPos + 1 >= newLen) {
      minDiagonalToConsider = 1;
    }

    // Main worker method. checks all permutations of a given edit length for acceptance.
    const execEditLength = () => {
      // k here represents the number of a diagonal in the edit graph
      // (The variable name k is chosen to match the Myers diff paper)
      for (
        let k = Math.max(minDiagonalToConsider, -editLength);
        k <= Math.min(maxDiagonalToConsider, editLength);
        k += 2
      ) {
        let basePath;
        const removePath = bestPath[offset + k - 1],
              addPath = bestPath[offset + k + 1];
        if (removePath) {
          // No one else is going to attempt to use this value, clear it
          // @ts-expect-error - perf optimisation. This type-violating value will never be read.
          bestPath[offset + k - 1] = undefined;
        }

        const canAdd = addPath && addPath.oldPos - k < newLen;
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          // If this path is a terminal then prune
          // @ts-expect-error - perf optimisation. This type-violating value will never be read.
          bestPath[offset + k] = undefined;
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

        newPos = this.extractCommon(basePath, newNormalized, oldNormalized, k, options);

        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          // If we have hit the end of both strings, then we are done
          return done(basePath.lastComponent) || true;
        } else {
          bestPath[offset + k] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, k - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, k + 1);
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
        enqueueTask(function() {
          if (editLength > editLengthCap || Date.now() > abortAfterTimestamp) {
            return (callback as DiffCallbackAbortable<ValueT>)(undefined);
          }

          if (!execEditLength()) {
            exec();
          }
        });
      }());
    } else {
      while (editLength <= editLengthCap && Date.now() <= abortAfterTimestamp) {
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
    k: number,
    options: AllDiffOptions
  ): number {
    const newLen = newTokens.length,
          oldLen = oldTokens.length;
    let oldPos = basePath.oldPos,
        newPos = oldPos - k,
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

  // Receives tokens that have already been through normalizeToken().
  equals(left: TokenT, right: TokenT, options: AllDiffOptions): boolean {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right;
    }
  }

  // Maps a token to the form it should be compared in (e.g. lowercased). Called once per token up
  // front, rather than on every call to equals(), which the diff loop makes many times per token.
  // Subclasses that override this should build on super.normalizeToken() so that ignoreCase keeps
  // working.
  normalizeToken(token: TokenT, options: AllDiffOptions): TokenT {
    // Only strings have a case. Tokens can be any value in diffArrays, which has no ignoreCase
    // option but may still be passed one, so leave other tokens alone rather than throwing.
    if (options.ignoreCase && typeof token === 'string') {
      return token.toLowerCase() as TokenT;
    }
    return token;
  }

  /**
   * Builds a DiscardPlan by counting (normalized) token occurrences on both sides and dropping
   * every token that has zero occurrences on the other side. Returns undefined - and leaves the
   * caller running the plain, unoptimised algorithm - whenever the optimisation cannot safely be
   * applied, or would achieve nothing:
   *
   * - a custom `comparator` was passed (its equality semantics are unknown, so tokens can't be
   *   counted on the assumption that equal tokens compare equal);
   * - `equals` is overridden by a subclass (same problem; note no built-in subclass overrides it,
   *   and subclasses that want this optimisation should override `normalizeToken` instead so that
   *   equal tokens normalize to the same string);
   * - any token is not a string (Map keys compare by SameValueZero, so e.g. NaN would wrongly be
   *   treated as matching itself, unlike the `===` used by the base `equals`);
   * - nothing would be dropped anyway.
   */
  private buildDiscardPlan(
    oldTokens: TokenT[],
    newTokens: TokenT[],
    oldNormalized: TokenT[],
    newNormalized: TokenT[],
    options: AllDiffOptions
  ): DiscardPlan<TokenT> | undefined {
    if (options.comparator) return undefined;
    if (this.equals !== Diff.prototype.equals) return undefined;
    for (let i = 0; i < oldNormalized.length; i++) {
      if (typeof oldNormalized[i] !== 'string') return undefined;
    }
    for (let i = 0; i < newNormalized.length; i++) {
      if (typeof newNormalized[i] !== 'string') return undefined;
    }

    const countTokens = (tokens: TokenT[]): Map<string, number> => {
      const counts = new Map<string, number>();
      for (const token of tokens) {
        counts.set(token as string, (counts.get(token as string) ?? 0) + 1);
      }
      return counts;
    };

    const oldCounts = countTokens(oldNormalized);
    const newCounts = countTokens(newNormalized);

    // Decide whether the optimisation is worth it at all: count tokens whose *value* occurs only
    // on one side (those, and only those, get discarded). On mostly-shared inputs (the common
    // case) running on the skeleton would be pure overhead, so bail out unless a substantial
    // fraction of tokens gets discarded.
    let discardedByOld = 0, discardedNew = 0;
    for (const [value, count] of oldCounts) {
      if (!newCounts.has(value)) discardedByOld += count;
    }
    for (const [value, count] of newCounts) {
      if (!oldCounts.has(value)) discardedNew += count;
    }
    const discarded = discardedByOld + discardedNew;
    if (discarded < (oldTokens.length + newTokens.length) * 0.2) return undefined;

    const buildSkeleton = (
      tokens: TokenT[],
      normalized: TokenT[],
      otherCounts: Map<string, number>
    ) => {
      const sk: TokenT[] = [];
      const skNorm: TokenT[] = [];
      const skToOrig: number[] = [];
      for (let i = 0; i < tokens.length; i++) {
        if ((otherCounts.get(normalized[i] as string) ?? 0) > 0) {
          sk.push(tokens[i]);
          skNorm.push(normalized[i]);
          skToOrig.push(i);
        }
      }
      return {sk, skNorm, skToOrig};
    };
    const oldS = buildSkeleton(oldTokens, oldNormalized, newCounts);
    const newS = buildSkeleton(newTokens, newNormalized, oldCounts);

    return {
      oldSk: oldS.sk,
      newSk: newS.sk,
      oldSkNorm: oldS.skNorm,
      newSkNorm: newS.skNorm,
      oldSkToOrig: oldS.skToOrig,
      newSkToOrig: newS.skToOrig,
      discardedOld: discardedByOld,
      discardedNew,
      oldLen: oldTokens.length,
      newLen: newTokens.length
    };
  }

  /**
   * Reinstates the tokens dropped by buildDiscardPlan into a finished skeleton component list,
   * transforming the list of skeleton components into the list of components the unoptimised
   * algorithm produces for the full inputs.
   *
   * Components come in two kinds: equal components, and runs of edits (removals/insertions)
   * between them. Two facts make the reinstatement simple:
   *
   * - Within one run of edits, the unoptimised algorithm always emits all removals before all
   *   insertions, merged into at most one removal and one insertion component (the loop's
   *   addToPath merges consecutive edits of the same kind, and its tie-breaking never places an
   *   insertion before a removal within a run - verified empirically across all diff functions
   *   and option combinations). A run is therefore fully described by two counts: how many old
   *   and how many new tokens it consumes.
   * - Every run of edits corresponds to one contiguous slice of the old token array and one of
   *   the new token array (the equal components and the runs partition both arrays in order), so
   *   buildValues can reconstruct the values from the counts alone.
   *
   * The skeleton's own edit runs (and the dropped tokens that belong to them, plus dropped tokens
   * wedged *inside* a skeleton equal component's span, which split it) therefore just accumulate
   * into the counts of the run they fall in.
   */
  private expandDiscarded(
    lastComponent: DraftChangeObject | undefined,
    plan: DiscardPlan<TokenT>,
    options: AllDiffOptions
  ): DraftChangeObject | undefined {
    // The component list is built back-to-front (head = last component); reverse into walking order.
    const components: DraftChangeObject[] = [];
    for (let component = lastComponent; component; component = component.previousComponent) {
      components.push(component);
    }
    components.reverse();

    const out: DraftChangeObject[] = [];
    const oneChangePerToken = !!options.oneChangePerToken;
    const pushEqual = (count: number) => {
      if (oneChangePerToken) {
        for (let i = 0; i < count; i++) out.push({added: false, removed: false, count: 1});
      } else {
        out.push({added: false, removed: false, count});
      }
    };
    // Counts of old/new tokens consumed by the run of edits since the last equal component.
    let gapRemoved = 0, gapAdded = 0;
    const flushGap = () => {
      if (oneChangePerToken) {
        for (let i = 0; i < gapRemoved; i++) out.push({added: false, removed: true, count: 1});
        for (let i = 0; i < gapAdded; i++) out.push({added: true, removed: false, count: 1});
      } else {
        if (gapRemoved) out.push({added: false, removed: true, count: gapRemoved});
        if (gapAdded) out.push({added: true, removed: false, count: gapAdded});
      }
      gapRemoved = 0; gapAdded = 0;
    };

    let skOld = 0, skNew = 0; // Next skeleton index unconsumed on each side.
    let oldPtr = 0, newPtr = 0; // Next original-array index not yet consumed on each side.
    for (const component of components) {
      if (component.added) {
        // The whole slice of the new array this run of insertions covers - leading dropped tokens,
        // the inserted skeleton tokens, and dropped tokens wedged between them - is one insertion
        // run in the output (the unoptimised algorithm, too, deletes/inserts whole slices).
        const last = plan.newSkToOrig[skNew + component.count - 1];
        gapAdded += last + 1 - newPtr;
        newPtr = last + 1;
        skNew += component.count;
      } else if (component.removed) {
        const last = plan.oldSkToOrig[skOld + component.count - 1];
        gapRemoved += last + 1 - oldPtr;
        oldPtr = last + 1;
        skOld += component.count;
      } else {
        // Equal component. Dropped tokens before it belong to the run that is now over; dropped
        // tokens wedged between its own skeleton tokens split it, each split ending a run.
        const enterOld = plan.oldSkToOrig[skOld];
        if (enterOld > oldPtr) gapRemoved += enterOld - oldPtr;
        const enterNew = plan.newSkToOrig[skNew];
        if (enterNew > newPtr) gapAdded += enterNew - newPtr;
        flushGap();
        // Walk the component's tokens (offset j from its start on each side), splitting at every
        // point where either side's original-array indices are not contiguous - i.e. where dropped
        // tokens are wedged between two matched tokens. Note the two sides start at different
        // skeleton indices (skOld vs skNew) when earlier components consumed different counts.
        let segmentStart = 0;
        for (let j = 1; j <= component.count; j++) {
          const atEnd = j === component.count;
          const oldGap = !atEnd && plan.oldSkToOrig[skOld + j] > plan.oldSkToOrig[skOld + j - 1] + 1;
          const newGap = !atEnd && plan.newSkToOrig[skNew + j] > plan.newSkToOrig[skNew + j - 1] + 1;
          if (atEnd || oldGap || newGap) {
            pushEqual(j - segmentStart);
            if (!atEnd) {
              if (oldGap) gapRemoved += plan.oldSkToOrig[skOld + j] - plan.oldSkToOrig[skOld + j - 1] - 1;
              if (newGap) gapAdded += plan.newSkToOrig[skNew + j] - plan.newSkToOrig[skNew + j - 1] - 1;
              flushGap();
              segmentStart = j;
            }
          }
        }
        oldPtr = plan.oldSkToOrig[skOld + component.count - 1] + 1;
        newPtr = plan.newSkToOrig[skNew + component.count - 1] + 1;
        skOld += component.count;
        skNew += component.count;
      }
    }
    // Trailing dropped tokens form the final run.
    gapRemoved += plan.oldLen - oldPtr;
    gapAdded += plan.newLen - newPtr;
    flushGap();

    // Rebuild the back-to-front linked list buildValues expects: the head is the LAST component in
    // output order, and previousComponent links towards earlier components.
    let head: DraftChangeObject | undefined = undefined;
    for (let i = 0; i < out.length; i++) {
      out[i].previousComponent = head;
      head = out[i];
    }
    return head;
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
