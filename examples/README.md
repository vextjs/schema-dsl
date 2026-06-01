# schema-dsl examples

This directory contains TypeScript examples referenced in the documentation. Examples are built against the current TypeScript build output or the published package `schema-dsl`.

- `examples/docs/*.ts`: Documentation example entry points. Most files map to `docs/*.md`; a few standalone scenario examples, such as `object-dsl-builder.ts` and `real-world.ts`, exercise public APIs that are referenced across multiple docs.

Type-check all examples:

```powershell
npm run examples:typecheck
```

Build and run a single example:

```powershell
npm run examples:build
node .tmp/docs/quick-start.js
```

