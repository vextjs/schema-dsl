# Extension overview

Use this page when you want to extend schema-dsl but are not sure whether you need a custom extension, a validation keyword, runtime isolation, or plugin packaging.

The extension system has several layers. They can be combined, but they solve different jobs.

## Which extension should I use?

| Goal | Recommended document | Typical result |
|------|----------------------|----------------|
| Define a reusable business type once | [Custom Extensions](custom-extensions.md) | `'tenant-id:corp!'`, `s('tenant-id:corp!')`, `s.tenantId('corp')` |
| Keep direct String-chain authoring | [String Extensions](string-extensions.md) | Transform or explicit String support |
| Add a validation keyword | [Custom Validation Keywords](add-keyword.md) | `{ type: 'number', isEven: true }` |
| Isolate extensions per app, tenant, plugin, or worker | [Framework Integration](framework-extension-setup.md), [Runtime Isolation](runtime-isolation.md) | `const runtime = createRuntime({ types })` |
| Coordinate install/uninstall and hooks | [Plugin Manager (Advanced)](plugin-system.md) | `pluginManager.install(schemaDsl, 'plugin')` |

## Custom Extension Entries

The custom extension chapter now owns DSL literals, `s('...')` seed builders, `s.xxx()` factories, parameters, and the decision not to expose custom base-builder methods for ordinary business types:

```ts
const schema = s({
  compact: 'tenant-id:corp!',
  named: s('tenant-id:corp!').label('Tenant'),
  typed: s.tenantId('corp').label('Tenant').require()
});
```

## Global and runtime-scoped extensions

Use the global `schema-dsl/pure` entry when an application has one extension set loaded at startup:

```ts
import { registerExtensions } from 'schema-dsl/pure';

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
```

Use `schema-dsl/runtime` when a framework, plugin host, tenant, test suite, or worker needs isolated extension state:

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

runtime.registerExtensions([
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
```

## Recommended reading path

1. Read [Custom Extensions](custom-extensions.md) for reusable business types, parameters, and `s.xxx()` factories.
2. Read [Custom Validation Keywords](add-keyword.md) when the validator needs a new keyword.
3. Read [Framework Integration](framework-extension-setup.md) before wiring extensions into a real application or framework.
4. Read [Plugin Manager (Advanced)](plugin-system.md) only when you need plugin lifecycle and hooks.

---

## Corresponding sample file

**Example entry**: [extensions-overview.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/extensions-overview.ts)
**Note**: Shows custom extension, runtime-scoped type, and validation keyword paths side by side.
