import {Buffer} from 'buffer';
import Diff from './base';

export const bufferDiff = new Diff();
export function diffBytes(oldBuffer, newBuffer, options) { return bufferDiff.diff(oldBuffer, newBuffer, options); }

/* Buffer itself can be accessed with array index syntax */
bufferDiff.tokenize = (input) => input;
bufferDiff.castInput = (input) => input;

/* Simply create a buffer from the bytes */
bufferDiff.join = (bytes) => {
    return Buffer.from(bytes);
};

/* There is no notion of "empty" in buffer */
bufferDiff.removeEmpty = (input) => input;
