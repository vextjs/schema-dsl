# Extension overview

> **Last updated**: 2026-06-18

Use this page when you want to extend schema-dsl but are not sure whether you need a custom type, a factory, a chain method, a validation keyword, or a plugin manager.

The extension system has several layers. They can be combined, but they solve different jobs.

## Which extension should I use?

| Goal | Recommended document | Typical result |
|------|----------------------|----------------|
| Reuse a DSL literal such as `tenantId!` | [Custom DSL Types](plugin-type-registration.md) | `s({ tenant: 'tenantId!' })` |
| Expose a discoverable factory | [Custom s.xxx() Factories](custom-factories.md) | `s.tenantId().require()` |
| Add a builder method | [Custom Chain Methods](custom-chain-methods.md) | `s('string!').tenantId()` |
| Keep direct String-chain authoring | [Custom Chain Methods](custom-chain-methods.md), [String Extensions](string-extensions.md) | `'string!'.tenantId()` after transform or explicit String support |
| Add a validation keyword | [Custom Validation Keywords](add-keyword.md) | `{ type: 'number', isEven: true }` |
| Isolate extensions per app, tenant, plugin, or worker | [Framework Integration](framework-extension-setup.md), [Runtime Isolation](runtime-isolation.md) | `const runtime = createRuntime({ types })` |
| Coordinate install/uninstall and hooks | [Plugin Manager (Advanced)](plugin-system.md) | `pluginManager.install(schemaDsl, 'plugin')` |
| Combine several extension types in one package | [Advanced Extension Recipes](custom-extensions-guide.md) | type + factory + keyword + locale |

## The three schema authoring layers

Custom extension work is easiest to reason about when you separate these layers:

| Layer | What it controls | Example |
|-------|------------------|---------|
| DSL type | A reusable literal parsed by the DSL parser | `tenantId!` |
| Namespace factory | A discoverable function on `s` / `dsl` | `s.tenantId()` |
| Chain method | A method on an existing builder | `s('string!').tenantId()` |

A single extension definition can expose the first two layers with `registerExtension({ literal, factoryName, schema })`. A custom chain method is a separate concern because it needs a runtime builder method and TypeScript interface augmentation.

## Global and runtime-scoped extensions

Use the global `schema-dsl/pure` entry when an application has one extension set loaded at startup:

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});
```

Use `schema-dsl/runtime` when a framework, plugin host, tenant, test suite, or worker needs isolated extension state:

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});
```

## Recommended reading path

1. Read [Custom DSL Types](plugin-type-registration.md) if you want reusable literals.
2. Read [Custom s.xxx() Factories](custom-factories.md) if you want editor-discoverable factories.
3. Read [Custom Chain Methods](custom-chain-methods.md) if you want new builder methods.
4. Read [Framework Integration](framework-extension-setup.md) before wiring extensions into a real application or framework.
5. Read [Plugin Manager (Advanced)](plugin-system.md) only when you need plugin lifecycle and hooks.

---

## Corresponding sample file

**Example entry**: [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts)
**Note**: Shows the custom DSL type, namespace factory, runtime-scoped type, and validation keyword paths side by side.
