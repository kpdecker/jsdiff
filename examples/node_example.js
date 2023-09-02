require('colors')
let Diff = require('../');

let one = 'beep boop';
let other = 'beep boob blah';

let diff = Diff.diffChars(one, other);

diff.forEach(function(part){
  // green for additions, red for deletions
  // grey for common parts
  let color = part.added ? 'green' :
    part.removed ? 'red' : 'grey';
  process.stderr.write(part.value[color]);
});

console.log();
