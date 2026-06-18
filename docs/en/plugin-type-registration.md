# Custom DSL types

Use a custom DSL type when you want a reusable literal such as `tenant-id!`, `orderCode`, or `evenNumber!`.

The current version provides type registration through `TypeRegistry`. If you prefer a builder-side entry, you can also use `DslBuilder.registerType()`, which delegates to the same registry.

## When to create a custom DSL type

| Use case | Example |
|----------|---------|
| Shared business identifier | `tenant-id!`, `orderCode!` |
| Organization-wide format | `employee-id`, `sku`, `currency-code` |
| Reusable numeric rule | `evenNumber!`, `positiveAmount` |
| Framework-level schema convention | `entity-id!`, `resource-key` |

Custom DSL types are reusable assets. Register them during application, framework, or plugin startup, then use them anywhere a DSL string is accepted.

## Register with TypeRegistry

```javascript
import { TypeRegistry, s } from 'schema-dsl/pure';

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = s({ value: 'evenNumber!' });
```

## Register with DslBuilder

If you want to uniformly manage custom types from the builder side, you can also write like this:

```javascript
import { DslBuilder } from 'schema-dsl/pure';

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
});
```

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  id: 'orderCode!',
  optionalSku: 'sku'
});
```

## Add a factory when discoverability matters

If you want both `tenant-id!` and `s.tenantId()` to exist, use `s.registerExtension()`:

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});
```

The factory path is explained in [Custom s.xxx() Factories](custom-factories.md). TypeScript users should add a `DslNamespaceFactories` module augmentation for editor hints.

## Runtime-scoped custom types

Use `schema-dsl/runtime` when custom types must be isolated per application, tenant, plugin, worker, or test fixture:

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});

const schema = runtime.s({ tenant: 'tenantId!' });
```

This keeps custom types in the runtime instance instead of the process-global registry.

## Cleanup and lifecycle

Use `DslBuilder.unregisterType('orderCode')` when a plugin or test needs to remove one Builder-side custom type. Use `DslBuilder.clearCustomTypes()` only when you intentionally want to clear all custom types, such as after isolated tests.

Since `2.0.11`, the custom type registry is shared across the package's ESM and CJS entrypoints in the same Node.js process. A type registered through `import { DslBuilder } from 'schema-dsl/pure';` can be resolved through `import * as schemaDsl from 'schema-dsl/pure'`, and the reverse works as well. This supports frameworks that compile user code to CJS while their own OpenAPI or validation pipeline imports schema-dsl from ESM.

The registry is process-global by design. Register custom types during application or plugin startup, avoid redefining the same name from multiple dependency branches, and call `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()` only for explicit plugin teardown or isolated tests. If two registrations use the same name, the latest registration wins in that process.

Use [Framework Extension Setup](framework-extension-setup.md) for reusable project layout, or [Plugin Manager (Advanced)](plugin-system.md) when you also need plugin lifecycle hooks.

---

## Corresponding sample file

**Example entry**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-type-registration.ts)
**Note**: Covers `TypeRegistry.register()`, `DslBuilder.registerType()`, custom type usage, and cleanup with `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()`.
