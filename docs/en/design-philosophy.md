# schema-dsl design philosophy

## Core Idea

schema-dsl is built around one idea: validation rules should be easy to write, easy to store, and easy to move across runtime boundaries.

That is why the DSL stays as plain data until it is compiled for validation:

```typescript
import { s, validate } from 'schema-dsl/pure';

const userSchema = s({
  email: 'email!',
  username: s('string:3-32!').label('Username'),
  age: s.number().min(18).max(120).require()
});

const result = validate(userSchema, {
  email: 'test@example.com',
  username: 'rocky',
  age: 30
});
```

The recommended public entry is `schema-dsl/pure` + `s`:

| Entry | Best for |
|------|----------|
| `s({ email: 'email!' })` | shortest pure DSL configuration |
| `s('email!').label('Email')` | DSL seed plus builder metadata or custom constraints |
| `s.email().label('Email').require()` | strongest TypeScript method discovery |

The compatibility `dsl` export remains available, but new public examples use `s` as the short namespace.

---

## Why Runtime Parsing

Runtime parsing is intentional. It keeps validation rules usable outside source code.

### Dynamic configuration

```typescript
import { s } from 'schema-dsl/pure';

const config = await loadValidationConfig();

const schema = s({
  username: `string:${config.username.min}-${config.username.max}!`,
  email: 'email!'
});
```

The same pattern works when rules come from a database, a tenant profile, a remote API, or an admin UI.

### Serialization and transport

```typescript
const schemaConfig = {
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
};

await saveSchemaConfig(JSON.stringify(schemaConfig));

const schema = s(schemaConfig);
```

Because the concise rules are data, they can be stored in JSON, sent through APIs, cached, inspected, and reused by different services.

### Multi-tenant rules

```typescript
function getTenantSchema(tenantId: string) {
  const rules = tenantRules[tenantId];

  return s({
    username: `string:${rules.username.min}-${rules.username.max}!`,
    email: 'email!'
  });
}
```

Adding a tenant can be a configuration change instead of a source-code change.

---

## TypeScript Boundary

schema-dsl separates authoring hints from runtime constraints:

- Pure DSL strings keep source compact and support lightweight value inference such as `InferDslString<'email!'>`.
- `s('...')` returns the public builder type, so methods after the seed get complete editor hints.
- `s.xxx()` factories provide the strongest method discovery because each field starts from a typed factory.
- Length ranges, patterns, custom validators, localized messages, and tenant-specific rules are runtime schema constraints, not exact TypeScript value refinements.

Direct String chains remain an explicit opt-in path for projects that choose String extension ergonomics. They are not the default public authoring path.

---

## Runtime Boundaries

Use the entry that matches the isolation level you need:

| Entry | Installs String extensions | Runtime state |
|------|-----------------------------|---------------|
| `schema-dsl/pure` | No | shared package-level state |
| `schema-dsl/runtime` | No | isolated state created by `createRuntime()` |
| root `schema-dsl` | compatibility behavior | shared package-level state |

`schema-dsl/runtime` does not export a top-level `s`. Create a runtime first:

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  }
});

const schema = runtime.s({
  id: 'tenantId!',
  email: runtime.s.email().require()
});
```

---

## Architecture

```text
DSL string or builder
  -> normalized DSL definition
  -> JSON Schema-compatible schema
  -> compiled validator
  -> ValidationResult
```

The parser and compiler are runtime components, so the same schema definition can be loaded from static source, configuration, database records, or API responses.

---

## Performance Positioning

Performance is important, but it is not mixed into the design philosophy page as a permanent comparison claim. The current local benchmark should be treated as a regression baseline:

| Scenario | schema-dsl throughput |
|------|-----------|
| S1 simple valid object | ~1.672M ops/s |
| S2 invalid object without i18n formatting | ~169K ops/s |
| S3 nested valid object | ~1.443M ops/s |

Environment: Node.js v20.20.2, Windows x64, run time 2026-07-07T03:20:24.821Z.

For tuning guidance, see [Performance Optimization Guide](performance-guide.md).

---

## Suitable Scenarios

schema-dsl is a good fit when validation rules need to be:

- compact enough to write and review quickly
- serializable and transportable
- generated from configuration or tenant data
- shared between front-end and back-end layers
- exported or documented alongside data models

It is less suitable when every validation rule must be represented as an exact static TypeScript value type, or when a project only cares about a hand-tuned, non-DSL hot path.

---

## Corresponding sample file

**Example entry**: [design-philosophy.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/design-philosophy.ts)
**Description**: Demonstrates the design loop of configuration rules, serialization, deserialization, and validation.
