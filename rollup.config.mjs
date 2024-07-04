import typescript from 'rollup-plugin-typescript2';
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: './src/script/script.ts',
  output: { file: './dist/script.js', format: 'iife', sourcemap: 'inline' },
  plugins: [typescript({ tsconfig: './src/script/tsconfig.json' })],
};

export default config;
