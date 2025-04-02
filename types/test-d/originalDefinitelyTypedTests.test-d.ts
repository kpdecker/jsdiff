/**
 * This file was copied from
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/diff/diff-tests.ts
 * then tweaked to work with tsd.
 */

import {expectType} from 'tsd';
import Diff, { Change } from "..";

const one = "beep boop";
const other = "beep boob blah";

let changes = Diff.diffChars(one, other);
examineChanges(changes);

expectType<undefined>(Diff.diffChars(one, other, {
    callback: (value) => {
        expectType<Change[]>(value);
    },
}));
expectType<undefined>(Diff.diffChars(one, other, (value) => {
    expectType<Change[]>(value);
}));
Diff.diffWords("吾輩は猫である。名前はまだ無い。", "吾輩は猫である。名前はたぬき。", {
    intlSegmenter: new Intl.Segmenter("ja-JP", { granularity: "word" }),
});
expectType<Change[] | undefined>(
    Diff.diffLines(
        "line\nold value\nline",
        "line\nnew value\nline",
        {
            stripTrailingCr: true,
            ignoreNewlineAtEof: true,
            maxEditLength: 1,
            oneChangePerToken: true,
        },
    )
);
expectType<undefined>(
    Diff.createPatch("filename", "A", "a", undefined, undefined, {
        callback: (value) => {
            expectType<string>(value);
        },
    })
);

const diffArraysResult = Diff.diffArrays(["a", "b", "c"], ["a", "c", "d"]);
diffArraysResult.forEach(result => {
    expectType<boolean>(result.added);
    expectType<boolean>(result.removed);
    expectType<string[]>(result.value); // TODO: Looks like DT handles this generically instead of using any[]. Can I do the same?
    expectType<number>(result.count);
});

interface DiffObj {
    value: number;
}
const a: DiffObj = { value: 0 };
const b: DiffObj = { value: 1 };
const c: DiffObj = { value: 2 };
const d: DiffObj = { value: 3 };
const arrayOptions: Diff.DiffArraysOptionsNonabortable<DiffObj> = { // TODO: Update name
    comparator: (left, right) => { // TODO: Should array options be generic?
        return left.value === right.value;
    },
};
const arrayChanges = Diff.diffArrays([a, b, c], [a, b, d], arrayOptions);
arrayChanges.forEach(result => {
    expectType<boolean>(result.added)
    expectType<boolean>(result.removed)
    expectType<DiffObj[]>(result.value) // TODO: Looks like DT handles this generically instead of using any[]. Can I do the same?
    expectType<number>(result.count)
});

// --------------------------

class LineDiffWithoutWhitespace extends Diff.Diff { // TODO: Pass generic arguments to reflect change from DT types
    tokenize(value: string): any {
        return value.split(/^/m);
    }

    equals(left: string, right: string): boolean {
        return left.trim() === right.trim();
    }
}

const obj = new LineDiffWithoutWhitespace();
changes = obj.diff(one, other);
examineChanges(changes);

function examineChanges(diff: Diff.Change[]) {
    diff.forEach(part => {
        expectType<boolean>(part.added);
        expectType<boolean>(part.removed);
        expectType<string>(part.value);
        expectType<number>(part.count);
    });
}

function verifyPatchMethods(oldStr: string, newStr: string, uniDiff: Diff.ParsedDiff) { // TODO: Name change
    const verifyPatch = Diff.parsePatch(
        Diff.createTwoFilesPatch("oldFile.ts", "newFile.ts", oldStr, newStr, "old", "new", {
            context: 1,
            stripTrailingCr: true,
        }),
    );

    if (
        JSON.stringify(verifyPatch[0], Object.keys(verifyPatch[0]).sort())
            !== JSON.stringify(uniDiff, Object.keys(uniDiff).sort())
    ) {
        throw new Error("Patch did not match uniDiff");
    }
}
function verifyApplyMethods(oldStr: string, newStr: string, uniDiffStr: string) {
    const uniDiff = Diff.parsePatch(uniDiffStr)[0];
    const verifyApply = [Diff.applyPatch(oldStr, uniDiff), Diff.applyPatch(oldStr, [uniDiff])];
    const options: Diff.ApplyPatchesOptions = { // TODO: Name change
        loadFile(index, callback) {
            expectType<ParsedDiff>(index);
            callback(undefined, one);
        },
        patched(index, content) {
            expectType<ParsedDiff>(index); 
            verifyApply.push(content);
        },
        complete(err) {
            if (err) {
                throw err;
            }

            verifyApply.forEach(result => {
                if (result !== newStr) {
                    throw new Error("Result did not match newStr");
                }
            });
        },
        compareLine(_, line, operator, patchContent) {
            if (operator === " ") {
                return true;
            }
            return line === patchContent;
        },
        fuzzFactor: 0,
    };
    Diff.applyPatches([uniDiff], options);
    Diff.applyPatches(uniDiffStr, options);
}

const uniDiffPatch = Diff.structuredPatch("oldFile.ts", "newFile.ts", one, other, "old", "new", {
    context: 1,
});
verifyPatchMethods(one, other, uniDiffPatch);

const formatted: string = Diff.formatPatch(uniDiffPatch);

const uniDiffStr = Diff.createPatch("file.ts", one, other, "old", "new", { context: 1 });
verifyApplyMethods(one, other, uniDiffStr);

const file1 = "line1\nline2\nline3\nline4\n";
const file2 = "line1\nline2\nline5\nline4\n";
const patch = Diff.structuredPatch("file1", "file2", file1, file2);
expectType<ParsedDiff>(patch); // TODO: Name change
const reversedPatch = Diff.reversePatch(patch);
expectType<ParsedDiff>(reversedPatch) // TODO: Name change
const verifyPatch = Diff.parsePatch(
    Diff.createTwoFilesPatch("oldFile.ts", "newFile.ts", "old content", "new content", "old", "new", {
        context: 1,
    }),
);
expectType<ParsedDiff[]>(verifyPatch) // TODO: Name change

const wordDiff = new Diff.Diff();
wordDiff.equals = function(left, right, options) { // TODO: Just make everything public to allow this?
    if (options.ignoreWhitespace) {
        if (!options.newlineIsToken || !left.includes("\n")) {
            left = left.trim();
        }
        if (!options.newlineIsToken || !right.includes("\n")) {
            right = right.trim();
        }
    }
    return Diff.Diff.prototype.equals.call(this, left, right, options);
};
