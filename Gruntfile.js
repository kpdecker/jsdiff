/* eslint-env node */
/* eslint-disable no-process-env, camelcase */
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    eslint: {
      options: {
      },
      files: [
        'src/**/*.js',
        'test/**/*.js'
      ]
    },

    clean: ['dist'],

    babel: {
      options: {
        loose: ['es6.modules'],
        auxiliaryCommentBefore: 'istanbul ignore next'
      },
      cjs: {
        options: {
          modules: 'common'
        },
        files: [{
          cwd: 'src/',
          expand: true,
          src: '**/*.js',
          dest: 'dist/cjs/'
        }]
      }
    },
    webpack: {
      options: {
        context: 'dist/cjs/',
        output: {
          path: 'dist/',
          library: 'JsDiff',
          libraryTarget: 'umd'
        }
      },
      dist: {
        entry: './diff.js',
        output: {
          filename: 'diff.js'
        }
      }
    },

    mocha_istanbul: {
      coverage: {
        src: 'test'
      }
    },
    istanbul_check_coverage: {
      'default': {
        options: {
          coverageFolder: 'coverage*', // will check both coverage folders and merge the coverage results
          check: {
            statements: 100,
            functions: 100,
            branches: 100,
            lines: 100
          }
        }
      }
    },

    watch: {
      scripts: {
        options: {
          atBegin: true
        },

        files: ['src/**/*.js', 'test/**/*.js'],
        tasks: ['test', 'cover']
      }
    }
  });

  // Build a new version of the library
  this.registerTask('build', 'Builds a distributable version of the current project', ['eslint', 'babel', 'webpack']);
  this.registerTask('cover', ['build', 'mocha_istanbul:coverage', 'istanbul_check_coverage']);

  // Load tasks from npm
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.registerTask('travis', 'default');

  grunt.registerTask('dev', ['clean', 'watch']);
  grunt.registerTask('default', ['clean', 'build', 'cover']);
};
