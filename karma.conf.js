export default function(config) {
  config.set({
    basePath: '',

    frameworks: ['mocha'],

    files: [
      'test/**/*.js'
    ],
    exclude: [
      // The code being tested by this suite heavily involves Node.js
      // filesystem operations, so doesn't make sense to run in a browser:
      'test/patch/readme-rename-example.js'
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
