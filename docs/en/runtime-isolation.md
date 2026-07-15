# Runtime State Isolation

Use `schema-dsl/runtime` when a framework, worker, plugin host or multi-tenant process needs independent schema-dsl runtime state without mutating the root API.

The root and `schema-dsl/pure` entries both avoid automatic `String.prototype` installation. They still use the same global Locale, TypeRegistry, PATTERNS and default Validator state.

`schema-dsl/runtime` does not export a top-level `s`. Create a runtime first, then use `runtime.s(...)`, `runtime.s.email()`, or `runtime.s(...)` from that isolated instance.

## Quick start

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  locale: 'tenant-a',
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  },
  messages: {
    'tenant.user.missing': {
      code: 'TENANT_USER_MISSING',
      message: 'Tenant user {{#id}} is missing'
    }
  },
  messageProvider: ({ key, locale, fallback }) =>
    key === 'number.min' ? `[${locale}] {{#label}} must be >= {{#limit}}` : fallback
});

const schema = runtime.s({
  id: 'tenantId!',
  age: 'number:18-120'
});

const field = runtime.s.email().label('Login email').require().toSchema();

const result = runtime.validate(schema, { id: 'tenant_demo', age: 16 });
```

`createSchemaDslRuntime()` and `createSchemaDslAdapter()` are equivalent aliases of `createRuntime()`.
`runtime.s` and `runtime.dsl` are the same namespace object. Factories such as `runtime.s.email()` compile with the runtime's own type, pattern, message and validator scope.

## What is isolated

| Runtime state | Isolated by `createRuntime()` |
|---------------|:-----------------------------:|
| Default locale and per-call `locale` | Yes |
| Inline `messages` and `messageProvider` | Yes |
| Custom extensions and `typeResolver` | Yes |
| Pattern overrides for `phone`, `idCard`, `creditCard`, `licensePlate`, `postalCode`, `passport`, `common` | Yes |
| Validator instances and caches | Yes |
| Custom keyword messages | Yes |
| Conditional branch parsing and messages | Yes |
| Async custom validator fallback messages | Yes |
| Runtime-created `I18nError` | Yes |
| Runtime cache lifecycle and stats | Yes |
| `runtime.s` / `runtime.dsl` namespace custom factories | Yes |
| `String.prototype` installation | Not installed by this entry |

## Lifecycle API

Create a runtime at an app, plugin or worker lifecycle boundary. Request-level differences should be passed through `validate(..., { locale, messages, messageProvider })`, not by creating a new runtime per request.

Use `configure(options, { mode })` for hot reload:

- `merge` adds new messages, types and patterns to the current runtime.
- `replace` replaces the full runtime-local profile with `options` while preserving built-in pattern defaults.
- `reset` clears runtime-local messages, types, patterns and strict/type resolver state, then applies `options`.

Use `clearCache()` to drop runtime-owned validator caches, `getStats()` to inspect message/type/pattern/cache counts, and `dispose()` during app shutdown, plugin unload or test teardown. `dispose()` is idempotent; using a disposed runtime throws `[schema-dsl/runtime] Runtime has been disposed`.

Per-call validation options follow the root helper conventions. Use `{ coerce: false }`, `{ smartCoerce: false }`, or `{ coerceTypes: false }` when a runtime validation call must reject numeric or boolean strings instead of using schema-dsl smart coercion.

## TypeScript hints

`runtime.s.email()`, `runtime.s('string')`, `runtime.dsl('string')`, and `runtime.compileField('string')` return the same chainable builder shape as the normal namespace path, so built-in chain methods keep their existing TypeScript hints.

For custom runtime extensions, pass `types`, `dynamicTypes`, or `typeResolver` to `createRuntime()`. Prefer `runtime.registerExtensions([...])` when one definition should power pure DSL, `s('...')`, and `s.xxx()` entries. `runtime.registerExtension({ literal, factoryName, schema })` remains useful for dynamic registration or static-extension compatibility.

## Message provider contract

`messageProvider` receives:

```typescript
{
  key: string;
  params: Record<string, unknown>;
  locale: string;
  source: 'ajv' | 'customKeyword' | 'conditional' | 'customValidator' | 'i18nError' | 'runtime';
  fallback?: string | { code?: string | number; message: string };
}
```

The provider covers standard validation message tables, custom keywords, conditional validation, async custom validator fallback messages and runtime-created `I18nError` instances. Explicit `messages` still have priority over provider fallbacks.

## When not to use it

Use the root `schema-dsl` entry or the stable `schema-dsl/pure` alias when you only need to avoid prototype mutation and do not need runtime-state isolation. Use `schema-dsl/compat` or `schema-dsl/register-string` only for explicit String-chain installation.

---

## Corresponding sample file

**Example entry**: [runtime-isolation.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-isolation.ts)
**Description**: Covers isolated `createRuntime()` state, runtime-scoped `s` factories, custom runtime extensions, message providers, cache lifecycle and validation behavior.
