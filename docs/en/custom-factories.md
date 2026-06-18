# Custom s.xxx() factories

> **Last updated**: 2026-06-18

Use a custom factory when you want a reusable type to be discoverable from the namespace object:

```ts
s.tenantId().label('Tenant').require()
```

Factories are different from DSL literals. The literal gives you compact configuration (`'tenant-id!'`); the factory gives you editor discovery and a typed builder.

## Register a factory with one extension definition

```ts
import { s } from 'schema-dsl/pure';

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

const schema = s({
  tenant: s.tenantId().label('Tenant').require(),
  owner: 'tenant-id!'
});
```

`literal` controls the DSL string form. `factoryName` controls the `s.xxx()` method. Both forms share the same JSON Schema fragment.

## TypeScript declaration

Runtime registration makes the factory available at runtime. TypeScript also needs a module augmentation so the method appears in editor hints:

```ts
import type { IDslBuilder } from 'schema-dsl/pure';

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder;
  }
}
```

If your extension package exports an installer, place this declaration in the same package so downstream users get the factory type when they import your setup module.

## Naming and conflict rules

- `factoryName` must be a valid JavaScript/TypeScript identifier.
- Use lower camel case, such as `tenantId`, `orderCode`, or `currencyCode`.
- Do not reuse built-in factory names such as `string`, `number`, `email`, `array`, `enum`, or `type`.
- Do not use reserved namespace helpers such as `config`, `if`, `match`, `error`, `defineExtension`, or `registerExtension`.

## Runtime-scoped factory

Frameworks, tenants, plugin hosts, and isolated tests can attach factories to a runtime instance:

```ts
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime();

runtime.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
});

const schema = runtime.s({
  tenant: runtime.s.tenantId().require()
});
```

This keeps the factory on `runtime.s` and does not mutate the process-global namespace.

## Relationship with chain methods

`s.tenantId()` creates a builder from a custom type. It does not automatically add `.tenantId()` as a method on every string builder. If you want `s('string!').tenantId()`, read [Custom Chain Methods](custom-chain-methods.md).

---

## Corresponding sample file

**Example entry**: [custom-factories.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/custom-factories.ts)
**Note**: Registers a custom factory on `s`, uses the same DSL literal, and shows a runtime-scoped factory.
