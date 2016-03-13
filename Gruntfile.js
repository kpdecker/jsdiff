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

    clean: ['lib', 'dist'],

    babel: {
      cjs: {
        files: [{
          cwd: 'src/',
          expand: true,
          src: '**/*.js',
          dest: 'lib/'
        }]
      }
    },
    webpack: {
      options: {
        context: 'lib/',
        output: {
          path: 'dist/',
          library: 'JsDiff',
          libraryTarget: 'umd'
        }
      },
      dist: {
        entry: './index.js',
        output: {
          filename: 'diff.js'
        }
      }
    },

    mochaTest: {
      test: {
        options: {
          require: ['babel-core/register'],
          reporter: 'dot'
        },
        src: ['test/**/*.js']
      }
    },

    mocha_istanbul: {
      coverage: {
        src: 'test/**/*.js'
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

    karma: {
      options: {
        configFile: 'karma.conf.js',
        autoWatch: false
      },
      unit: {
        singleRun: true
      },
      sauce: {
        singleRun: true,
        browsers: ['sl_chrome', 'sl_firefox', 'sl_safari', 'sl_ie_11', 'sl_ie_9']
      }
    },

    uglify: {
      options: {
        mangle: true,
        compress: true,
        preserveComments: 'some'
      },
      dist: {
        files: [{
          cwd: 'dist/',
          expand: true,
          src: ['*.js', '!*.min.js'],
          dest: 'dist/',
          rename: function(dest, src) {
            return dest + src.replace(/\.js$/, '.min.js');
          }
        }]
      }
    },

    copy: {
      dist: {
        options: {
          processContent: function(content) {
            return grunt.template.process('/*!\n\n <%= pkg.name %> v<%= pkg.version %>\n\n<%= grunt.file.read("LICENSE") %>\n@license\n*/\n')
                + content;
          }
        },
        files: [
          {expand: true, cwd: 'dist/', src: ['*.js'], dest: 'dist/'}
        ]
      },
      components: {
        files: [
          {expand: true, cwd: 'components/', src: ['**'], dest: 'dist/components'},
          {expand: true, cwd: 'dist/', src: ['*.js'], dest: 'dist/components'}
        ]
      }
    },

    watch: {
      scripts: {
        options: {
          atBegin: true
        },

        files: ['src/**/*.js', 'test/**/*.js'],
        tasks: ['build', 'mochaTest', 'cover']
      }
    }
  });

  // Build a new version of the library
  this.registerTask('build', 'Builds a distributable version of the current project', ['eslint', 'babel', 'webpack']);
  this.registerTask('test', ['build', 'mochaTest', 'karma:unit']);
  this.registerTask('cover', ['mocha_istanbul:coverage', 'istanbul_check_coverage']);

  this.registerTask('release', ['clean', 'test', 'uglify', 'copy:dist', 'copy:components']);

  // Load tasks from npm
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-babel');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-webpack');

  grunt.task.loadTasks('tasks');

  grunt.registerTask('travis',
    !process.env.KARMA && process.env.SAUCE_USERNAME
      ? ['clean', 'build', 'karma:unit', 'karma:sauce', 'cover']
      : ['clean', 'build', 'cover']);

  grunt.registerTask('dev', ['clean', 'watch']);
  grunt.registerTask('default', ['clean', 'build', 'cover']);
};
