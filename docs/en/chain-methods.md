# schema-dsl chain method list

Use this page when a field needs more than a plain DSL string. In the current source and the next v2.1.0 release, the recommended path is:

```ts
import { s } from 'schema-dsl/pure';

const schema = s({
  email: 'email!',
  username: s('string:3-32!').label('Username'),
  age: s.number().min(18).max(120).require()
});
```

## Entry support

| Entry | Example | TypeScript hints | Runtime side effect |
|------|---------|------------------|---------------------|
| Plain DSL string | `email: 'email!'` | DSL literal value inference only | none |
| `s('...')` seed | `s('email!').label('Email')` | full `IDslBuilder` methods | none |
| `s.xxx()` factory | `s.email().label('Email')` | full `IDslBuilder` methods plus discoverable factory names | none |
| `runtime.s` | `runtime.s.email().require()` | runtime-scoped builder methods | isolated runtime instance |
| Direct String chain | `'email!'.label('Email')` | requires `schema-dsl/string-types` opt-in | requires `schema-dsl/register-string`, compat/root, or compile-time transform |

Direct String chaining is still supported, but it is no longer the default documentation entry. Use it intentionally, or use the transform path when you want direct-string source without runtime prototype mutation.

## Common methods

| Method | Applies to | Result |
|--------|------------|--------|
| `.label(text)` | all builders | Sets the field label used by error messages. |
| `.description(text)` | all builders | Adds JSON Schema `description`. |
| `.messages(map)` / `.error(map)` | all builders | Adds custom validation messages. |
| `.default(value)` | all builders | Adds JSON Schema `default`. |
| `.optional()` | all builders | Marks the field optional. |
| `.require()` / `.required()` | all builders | Marks the field required. `.require()` does not accept arguments on field builders. |
| `.enum(...values)` | compatible primitive builders | Restricts allowed values. |
| `.format(name)` | string-like builders | Sets JSON Schema `format`. |
| `.pattern(regex, message?)` | string builders | Adds a safe regex pattern. |
| `.custom(fn)` | all builders | Adds a synchronous or async custom validator. |

## String methods

| Method | Result |
|--------|--------|
| `.min(n)` / `.max(n)` | Sets `minLength` / `maxLength` on strings. |
| `.length(n)` | Exact string length. Builder only; direct String chains cannot use it because native strings already have `.length`. |
| `.alphanum()` | Allows only letters and digits. |
| `.trim()` | Rejects leading/trailing whitespace. Builder only; direct String chains cannot use it because native strings already have `.trim()`. |
| `.lowercase()` / `.uppercase()` | Requires lowercase or uppercase input. |
| `.json()` | Requires a valid JSON string. |
| `.dateFormat(fmt)` | Validates a string date format. |
| `.after(date)` / `.dateGreater(date)` | Requires a date string after the given value. |
| `.before(date)` / `.dateLess(date)` | Requires a date string before the given value. |
| `.slug()` | URL slug pattern. |
| `.domain()` | Domain pattern. |
| `.ip()` | IP address pattern. |
| `.base64()` | Base64 string pattern. |
| `.jwt()` | JWT pattern. |
| `.username(preset)` | Username preset or options. |
| `.password(strength)` | Password strength preset: `weak`, `medium`, `strong`, `veryStrong`. |
| `.phone(country)` / `.phoneNumber(country)` | Phone number pattern. |
| `.idCard(country)` | National ID pattern. |
| `.creditCard(type)` | Credit card pattern. |
| `.licensePlate(country)` | License plate pattern. |
| `.postalCode(country)` | Postal code pattern. |
| `.passport(country)` | Passport pattern. |

## Number methods

| Method | Result |
|--------|--------|
| `.min(n)` / `.max(n)` | Sets numeric minimum / maximum. |
| `.precision(n)` | Limits decimal precision. |
| `.multiple(n)` | Sets JSON Schema `multipleOf`. |
| `.port()` | Validates an integer port range. |

## Array methods

| Method | Result |
|--------|--------|
| `.min(n)` / `.max(n)` | Sets `minItems` / `maxItems`. |
| `.items(item)` | Sets item schema from a DSL string, builder or JSON Schema. |
| `.noSparse()` | Rejects sparse arrays. |
| `.includesRequired(items)` | Requires the array to contain specified values. |

## Object methods

| Method | Result |
|--------|--------|
| `.requireAll()` | Marks all defined object properties as required. |
| `.strict()` | Rejects additional properties. |

## Output methods

| Method | Result |
|--------|--------|
| `.toSchema()` | Returns schema-dsl internal schema, including metadata used by the validator. |
| `.toJsonSchema()` | Returns clean JSON Schema suitable for export and OpenAPI embedding. |
| `.toString()` | Serializes `.toJsonSchema()`. Builder only. |
| `.validate(data)` | Validates with a builder-owned validator. Builder only. |

## Custom methods

This page lists built-in field builder methods. For user-defined methods, first decide which layer you need:

- Use [Custom Extensions](custom-extensions.md) for reusable business types such as `tenant-id!`, `s('tenant-id!')`, and `s.tenantId()`.
- Use [String Extensions](string-extensions.md) plus transform configuration if the source code must remain `'string!'.tenantId()`.

## Related documents

- [Quick Start](./quick-start.md)
- [Complete Type List](./type-reference.md)
- [TypeScript Guide](./typescript-guide.md)
- [String Extensions](./string-extensions.md)
- [Runtime Isolation](./runtime-isolation.md)
- [Custom Extensions](./custom-extensions.md)

---

## Corresponding example file

**Example entry**: [chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/chain-methods.ts)
**Description**: Exercises common, string, number, array, object, output and runtime-scoped chain methods.
