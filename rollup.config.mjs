import babel from 'rollup-plugin-babel';
import pkg from './package.json' with { type: 'json' };

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: [
      {
        name: 'Diff',
        format: 'umd',
        file: pkg.browser
      },
      {
        format: 'esm',
        file: pkg.module
      }, {
        format: 'esm',
        file: pkg.exports['.']['import']
      }
    ],
    plugins: [
      babel({
        babelrc: false,
        presets: [['@babel/preset-env', { targets: {ie: '11'}, modules: false }]]
      })
    ]
  }
];
