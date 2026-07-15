# Migrating to schema-dsl v3

schema-dsl v3 makes one deliberate breaking change: importing or requiring the package root no longer mutates `String.prototype`.

## Root imports

The root and `schema-dsl/pure` expose the same side-effect-free core API. Existing code that already uses `s(...)`, `dsl(...)`, `validate(...)`, builders, exporters, or `schema-dsl/runtime` can keep its API calls.

```typescript
import { s, validate } from 'schema-dsl';

const schema = s({ email: 'email!' });
const result = validate(schema, { email: 'user@example.com' });
```

## Direct String chains

Code that calls methods directly on string literals must opt in at application startup:

```typescript
import 'schema-dsl/register-string';
import 'schema-dsl/string-types'; // TypeScript only
import { s } from 'schema-dsl';

const schema = s({ email: 'email!'.description('Login email') });
```

Use `schema-dsl/compat` as a single import when preserving the v1/v2 runtime behavior is clearer. Libraries should normally prefer builders such as `s('email!').description(...)` and avoid changing host prototypes.

## Required, optional, and null

- `!` marks a property as required. Compile the complete object and read standard JSON Schema `required[]`.
- `?` marks a property as optional. It does not allow `null`.
- Allow `null` explicitly with a null union such as `types:string|null` or raw JSON Schema `{ type: ['string', 'null'] }`.
- v3 does not add `isRequired()` or `isOptional()` getters; `_required` and `_optional` are internal compatibility details.

## Validation results

`valid` and normalized `data` remain stable. Canonical errors use `path`, `message`, and `keyword`; legacy `field`, `type`, and `expected` aliases remain for v3.0 compatibility but are deprecated. New integrations should map from canonical fields at their own public boundary.

## Entry matrix

| Entry | Import-time String mutation |
|---|:---:|
| `schema-dsl` | No |
| `schema-dsl/pure` | No |
| `schema-dsl/runtime` | No |
| `schema-dsl/string-types` | No runtime code |
| `schema-dsl/compat` | Yes, explicit |
| `schema-dsl/register-string` | Yes, explicit |
