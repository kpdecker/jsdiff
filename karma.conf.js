export default function(config) {
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

    reporters: ['mocha'],

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    singleRun: false,
  });
};
