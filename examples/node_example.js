require('colors');
const {diffChars} = require('diff');

const one = 'beep boop';
const other = 'beep boob blah';

const diff = diffChars(one, other);

diff.forEach((part) => {
  // green for additions, red for deletions
  let text = part.added ? part.value.bgGreen :
             part.removed ? part.value.bgRed :
                            part.value;
  process.stderr.write(text);
});

console.log();
