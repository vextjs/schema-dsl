# Custom type registration

The current version provides type registration capabilities through `TypeRegistry`; if you prefer DSL side entry, you can also use `DslBuilder.registerType()`, which will be delegated internally to `TypeRegistry`.

```javascript
const { TypeRegistry, dsl } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

const schema = dsl({ value: 'evenNumber!' });
```

If you want to uniformly manage custom types from the Builder side, you can also write like this:

```javascript
const { DslBuilder } = require('schema-dsl');

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$'
});
```

Use `DslBuilder.unregisterType('orderCode')` when a plugin or test needs to remove one Builder-side custom type. Use `DslBuilder.clearCustomTypes()` only when you intentionally want to clear all custom types, such as after isolated tests.

Plug-in extensions can be used in conjunction with [plugin-system.md](./plugin-system.md).

---

## Corresponding sample file

**Example entry**: [plugin-type-registration.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/plugin-type-registration.ts)
**Note**: Covers `TypeRegistry.register()`, `DslBuilder.registerType()`, and cleanup with `DslBuilder.unregisterType()` / `DslBuilder.clearCustomTypes()`.
