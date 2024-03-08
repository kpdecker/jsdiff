require('colors');
let Diff = require('../');

let one = 'beep boop';
let other = 'beep boob blah';

let diff = Diff.diffChars(one, other);

diff.forEach(function(part) {
  // green for additions, red for deletions
  let text = part.added ? part.value.bgGreen :
             part.removed ? part.value.bgRed :
                            part.value;
  process.stderr.write(text);
});

console.log();
