var semver = require('semver');

module.exports = function(grunt) {
  grunt.registerTask('version', 'Updates the current release version', function() {
    var done = this.async(),
        pkg = grunt.config('pkg'),
        version = grunt.option('ver');

    if (!semver.valid(version)) {
      throw new Error('Must provide a version number (Ex: --ver=1.0.0):\n\t' + version + '\n\n');
    }

    pkg.version = version;
    grunt.config('pkg', pkg);

    grunt.log.writeln('Updating to version ' + version);

    grunt.task.run(['release']);
    done();
  });
};
