var childProcess = require('child_process');

module.exports = {
  add: function(path, callback) {
    childProcess.exec('git add -f ' + path, {}, function(err) {
      if (err) {
        throw new Error('git.add: ' + err.message);
      }

      callback();
    });
  }
};
