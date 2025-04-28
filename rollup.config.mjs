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
    ]
  }
];
