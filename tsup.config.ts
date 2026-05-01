import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/custom-format': 'src/plugins/custom-format.ts',
    'plugins/custom-validator': 'src/plugins/custom-validator.ts',
    'plugins/custom-type-example': 'src/plugins/custom-type-example.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
  target: 'node18',
})
