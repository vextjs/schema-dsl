import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    pure: 'src/pure.ts',
    compat: 'src/compat.ts',
    'register-string': 'src/register-string.ts',
    'string-types': 'src/string-types.ts',
    transform: 'src/transform.ts',
    esbuild: 'src/esbuild.ts',
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
