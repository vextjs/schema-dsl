# Framework extension setup

> **Last updated**: 2026-06-18

Framework integrations should treat schema-dsl extensions as reusable application assets, similar to locale packs. Keep custom types, factories, chain methods, runtime setup, and transform options in one predictable directory.

## Recommended directory

```text
src/schema-dsl/
  index.ts              # Public setup entry
  types.ts              # Custom DSL literals and type registration
  factories.ts          # s.xxx() / runtime.s.xxx() factories
  chain-methods.ts      # Builder method implementations
  transform.ts          # additionalMethods / additionalTypes for build tools
  runtime.ts            # createRuntime() wrapper for isolation
  locales/
    en-US.ts
    zh-CN.ts
```

This structure makes custom types reusable across services, tests, workers, OpenAPI generation, and validation.

## Application-level setup

Use this when the app has one extension set loaded during startup:

```ts
import { s, resetRuntimeState } from 'schema-dsl/pure';

export function installSchemaDslExtensions() {
  s.registerExtension({
    literal: 'tenant-id',
    factoryName: 'tenantId',
    schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  });
}

export function resetSchemaDslExtensionsForTests() {
  resetRuntimeState();
}
```

Call the installer once from your app bootstrap or framework plugin.

## Runtime-scoped setup

Use runtime-scoped setup when each app, tenant, plugin, worker, or test fixture needs isolated extension state:

```ts
import { createRuntime } from 'schema-dsl/runtime';

export function createAppSchemaRuntime() {
  const runtime = createRuntime({
    types: {
      tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
    }
  });

  runtime.registerExtension({
    literal: 'tenant-id',
    factoryName: 'tenantId',
    schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  });

  return runtime;
}
```

Dispose the runtime when the host instance is unloaded.

## Transform setup

If the framework compiles direct String-chain source, export the transform options next to the extension setup:

```ts
export const schemaDslTransformOptions = {
  additionalMethods: ['tenantId'],
  additionalTypes: ['tenant-id']
} as const;
```

Framework adapters can pass these options into `transformSchemaDsl()` or `schemaDslEsbuildPlugin()`.

## TypeScript setup

Place module augmentations in a `.d.ts` file that is included by the framework or application tsconfig:

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }

  interface IDslBuilder {
    tenantId(): this;
  }
}
```

Only augment `schema-dsl/string-types` when direct String-chain source is part of your framework authoring model.

## Checklist

- Register global extensions during startup, not per request.
- Use `createRuntime()` for framework, tenant, worker, and isolated test boundaries.
- Keep transform options next to the extension package.
- Keep TypeScript declarations in the extension package or setup module.
- Clean global extension state in isolated tests with `resetRuntimeState()`.
- Dispose runtime instances in plugin or app teardown.

---

## Corresponding sample file

**Example entry**: [framework-extension-setup.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/framework-extension-setup.ts)
**Note**: Demonstrates an app-level installer, runtime-scoped installer, transform options, validation, and cleanup.
