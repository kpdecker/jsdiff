/* eslint-env node */
/* eslint-disable no-var, camelcase */
module.exports = function(config) {
  var customLaunchers = {
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

    reporters: ['mocha'],

    customLaunchers: customLaunchers,
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,

    browsers: ['HeadlessChrome']
  });
};
