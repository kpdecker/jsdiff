import Diff, { DiffOptions } from './base';

class SentenceDiff extends Diff<string, string> {
  protected tokenize(value: string) {
    return value.split(/(?<=[.!?])(\s+|$)/);
  }
}

export const sentenceDiff = new SentenceDiff();

export function diffSentences(oldStr: string, newStr: string, options: DiffOptions<string>) {
  return sentenceDiff.diff(oldStr, newStr, options);
}