/* eslint-env node */
module.exports = function(config) {
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
      devtool: 'inline-source-map',
      module: {
        loaders: [
          {
            test: /\.jsx?$/,
            exclude: /node_modules/,
            loader: 'babel-loader?loose=es6.modules'
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    reporters: ['progress'],


    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,

    browsers: ['PhantomJS']
  });
};
