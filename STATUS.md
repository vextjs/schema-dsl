# schema-dsl Status

This repository is the TypeScript-rewritten version, aiming to maintain v1 public API compatibility and provide ESM/CJS dual-format builds.

Current plugin compatibility status: v1 official plugin sub-paths `schema-dsl/plugins/*` (`custom-format` / `custom-validator` / `custom-type-example`) have been restored. Confirmed that `custom-validator` no longer emits AJV `addKeyword` deprecated warnings during installation.

## Current Verification

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:version`
- CJS subpath smoke (`require('schema-dsl/plugins/*')`)
- ESM subpath smoke (`import 'schema-dsl/plugins/*'`)

