import babel from 'rollup-plugin-babel';
import pkg from './package.json' with { type: 'json' };

export default [
  // browser-friendly UMD build
  {
    input: 'libesm/index.js',
    output: [
      {
        name: 'Diff',
        format: 'umd',
        file: "./dist/diff.js"
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
