# Framework extension setup

Framework integrations should treat schema-dsl extensions as reusable application assets, similar to locale packs. Keep the extension definition, type declarations, runtime setup, and optional transform options in one predictable directory.

## Recommended directory

```text
src/schema-dsl/
  index.ts              # Exports the configured s / runtime
  extensions.ts         # Custom extension definition array, the single source of truth
  types.d.ts            # Optional, only for dynamic registration or compatibility
  runtime.ts            # createRuntime() wrapper for isolation
  transform.ts          # Optional, only for direct String-chain authoring
  locales/
    en-US.ts
    zh-CN.ts
```

This structure makes custom types reusable across services, tests, workers, OpenAPI generation, and validation.

## Application-level setup

Use this when the app has one extension set loaded during startup:

```ts
import { registerExtensions, resetRuntimeState } from 'schema-dsl/pure';

export const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
      };
    }
  }
] as const);

export function resetSchemaDslExtensionsForTests() {
  resetRuntimeState();
}
```

Application code imports this configured `s` from `src/schema-dsl/index.ts`. Isolated tests can call `resetSchemaDslExtensionsForTests()` when they need to clear global extension state.

## Runtime-scoped setup

Use runtime-scoped setup when each app, tenant, plugin, worker, or test fixture needs isolated extension state:

```ts
import { createRuntime } from 'schema-dsl/runtime';

export function createAppSchemaRuntime() {
  const runtime = createRuntime();

  const s = runtime.registerExtensions([
    {
      literal: 'tenant-id',
      factoryName: 'tenantId',
      segmentMode: 'params',
      params: {
        scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' }
      },
      schema({ scope }) {
        return {
          type: 'string',
          pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$'
        };
      }
    }
  ] as const);

  return { runtime, s };
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

Prefer the `s` exported by `registerExtensions([... ] as const)` for `s.xxx()` hints. Maintain a `.d.ts` file only when you still use dynamic `registerExtension()`, legacy module augmentation, or need to add types for a third-party extension package:

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }
}
```

Only augment `schema-dsl/string-types` when direct String-chain source is part of your framework authoring model.

## Recommended setup

- Export a configured application-level `s`; do not dynamically register extensions per request.
- Use `createRuntime()` for framework, tenant, worker, and isolated test boundaries.
- Keep the extension definition as the single source of truth for DSL, `s('...')`, and `s.xxx()` entries.
- Keep transform options only when direct String-chain source is supported.
- Prefer `registerExtensions([... ] as const)` for TypeScript hints; keep `.d.ts` only for dynamic or compatibility paths.
- Clean global extension state in isolated tests with `resetRuntimeState()`.
- Dispose runtime instances in plugin or app teardown.

---

## Corresponding sample file

**Example entry**: [framework-extension-setup.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/framework-extension-setup.ts)
**Note**: Demonstrates an app-level installer, runtime-scoped installer, transform options, validation, and cleanup.
