/* eslint-env node */
/* eslint-disable no-var, camelcase */
module.exports = function(config) {
  var customLaunchers = {
    sl_chrome: {
      base: 'SauceLabs',
      browserName: 'chrome'
    },
    sl_firefox: {
      base: 'SauceLabs',
      browserName: 'firefox'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      version: '11'
    },
    HeadlessChrome: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox']
    }
  };

  config.set({
    basePath: '',

    frameworks: ['mocha'],

    files: [
      'test/**/*.js'
    ],
    preprocessors: {
      'test/**/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'eval',
      module: {
        rules: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel-loader'
          }
        ]
      }
    },
    webpackMiddleware: {
      noInfo: true
    },

    sauceLabs: {
      testName: 'jsdiff'
    },

    reporters: ['mocha', 'saucelabs'],

    customLaunchers: customLaunchers,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,

    browsers: ['HeadlessChrome'],
  });
};
