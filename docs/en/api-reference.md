# schema-dsl API Reference

Use this as the complete public API reference after you understand the task-oriented guides. For a shorter route into the API surface, see [API Overview](api.md).

## `dsl` / `s` Namespace

### Description

The main DSL namespace. `s` and `dsl` are the same function object: `s === dsl`. The callable form accepts string definitions and object definitions, while namespace factories provide a discoverable chain entry without maintaining a second grammar. Public examples use `schema-dsl/pure` + `s` as the default no-prototype-mutation entry.

### Syntax

```typescript
s(definition: string | object): IDslBuilder | JSONSchema

s.email(): IDslBuilder
s.string(): IDslBuilder
s.number(): IDslBuilder
```

Because `s === dsl`, calling the shared object through either name remains compatible. The recommended documentation style is `s({ ... })` for schema objects, `s('...')` for DSL seed builders, and `s.xxx()` for discoverable factory entry points. The `dsl` name remains a compatibility and semantic alias.

### Parameters

- `definition` (**string** | **object**) - DSL definition.
  - String input returns a `DslBuilder` instance for chainable calls.
  - Object input returns a JSON Schema object.

### Return Value

- **DslBuilder / IDslBuilder** - returned when the input is a string or namespace factory is used.
- **Object** - returned when the input is an object, as a JSON Schema.

### Example

```javascript
import { s } from 'schema-dsl/pure';

// Plain DSL strings: shortest schema object
const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});

// DSL seed: compact DSL plus builder chain methods
s('email!').label('email').pattern(/custom/);

// Factory form: strongest TypeScript method discovery
s.email().label('email').pattern(/custom/).require();
```

### Namespace Factories

Built-in factories are available on the shared `s` / `dsl` namespace:

| Factory group | Methods |
|---------------|---------|
| Primitive and common types | `s.string()`, `s.number()`, `s.integer()`, `s.int()`, `s.boolean()`, `s.object()`, `s.array(item?)`, `s.any()`, `s.mixed()` |
| Formats and presets | `s.email()`, `s.url()`, `s.uri()`, `s.uuid()`, `s.ip()`, `s.ipv4()`, `s.ipv6()`, `s.date()`, `s.datetime()`, `s.time()`, `s.slug()`, `s.phone(country?)`, `s.username(preset?)`, `s.password(preset?)` |
| Enum and custom type bridge | `s.enum(...values)`, `s.enum(values)`, `s.type(name)` |
| Extension helpers | `registerExtensions(definitions)`, `s.defineExtension(definition)`, `s.registerExtension(definition)` |

Examples:

```typescript
s('email!').label('Email')
s.email().label('Email').require()
s.array(s.string().require()).min(1)
s.enum('admin', 'user', 'guest')
s.type('tenant-id').require()
```

---

## DslBuilder Class

### Description

Schema builder class. It supports chainable methods for adding validation rules.

### Constructor

```javascript
new DslBuilder(dslString: string)
```

**Parameters**:

- `dslString` (**string**) - DSL string, for example `'string:3-32!'`.

### Methods

#### Complete chain method surface

`s('...')`, callable namespace aliases, and namespace factories such as `s.email()` return a `DslBuilder` typed with the public `IDslBuilder` chain contract. Use `s('email!')` when you want compact DSL plus builder hints without relying on String prototype authoring, and use `s.email()` when you want the strongest TypeScript method discovery. Direct String chaining remains supported through String Extensions or transform, but it is no longer the default documentation entry. See [Chain Method List](chain-methods.md) for the complete method table and entry support.

| Category | Methods | Applies to | Notes |
|----------|---------|------------|-------|
| Common metadata and messages | `.label(text)`, `.description(text)`, `.messages(map)`, `.error(map)` | All builders | Error labels, descriptions, and custom messages. |
| Common constraints | `.pattern(regex, message?)`, `.format(fmt)`, `.enum(...values)`, `.default(value)`, `.custom(fn)`, `.require()`, `.required()`, `.optional()` | Mostly string/all builders depending on method | `.require()` is the field-required alias. Conditional `s.if(...).require(field)` remains a different API. |
| Length/range rules | `.min(n)`, `.max(n)`, `.length(n)` | String, number/integer, array depending on base type | String maps to `minLength`/`maxLength`; number maps to `minimum`/`maximum`; array maps to `minItems`/`maxItems`. `.length(n)` is builder-only. |
| String text rules | `.alphanum()`, `.trim()`, `.lowercase()`, `.uppercase()` | String builders | Text normalization and pattern helpers. |
| String formats and patterns | `.slug()`, `.domain()`, `.ip()`, `.base64()`, `.jwt()`, `.json()`, `.dateFormat(fmt)`, `.after(date)`, `.before(date)`, `.dateGreater(date)`, `.dateLess(date)` | String builders | Adds JSON Schema formats, patterns, or schema-dsl custom keywords. |
| Identity presets | `.username(preset?)`, `.password(strength?)`, `.phone(country?)`, `.phoneNumber(country?)`, `.idCard(country?)`, `.creditCard(type?)`, `.licensePlate(country?)`, `.postalCode(country?)`, `.passport(country?)` | String builders | Presets combine length, pattern, and localized pattern messages. |
| Number helpers | `.precision(n)`, `.multiple(n)`, `.port()` | Number/integer builders | `.multiple(n)` maps to standard JSON Schema `multipleOf`. |
| Object helpers | `.requireAll()`, `.strict()` | Object builders | Adds schema-dsl object custom keywords consumed by the validator. |
| Array helpers | `.items(item)`, `.noSparse()`, `.includesRequired(items)` | Array builders | `items()` accepts a DSL string, builder, DSL object, or JSON Schema and strips nested `_required` for array item schemas. |
| Output and validation | `.toSchema()`, `.toJsonSchema()`, `.toString()`, `.validate(data)` | `DslBuilder` | Direct String chaining exposes `.toSchema()` and `.toJsonSchema()` only. |

Examples:

```javascript
s('string').default('active')
s.string().default('active')
s.string().username('5-20').label('username').require()
s.number().min(18).max(120).precision(2).multiple(0.5)
s.object().strict().requireAll()
s.array(s.string().require()).min(1).noSparse().includesRequired(['admin'])
s.array({ name: 'string!', quantity: 'number:1-999!' }).min(1)

// Direct String chain compatibility path:
// runtime requires schema-dsl/register-string, compat/root, or compile-time transform;
// TypeScript declarations require schema-dsl/string-types.
'string'.default('active')
```

#### `.pattern(regex, message?)`

Adds regular expression validation.

**Parameters**:

- `regex` (**RegExp** | **string**) - regular expression.
- `message` (**string**, optional) - custom error message.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores are allowed')
```

---

#### `.label(text)`

Sets the field label used in error messages.

**Parameters**:

- `text` (**string**) - label text.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('email!').label('email address')
```

---

#### `.messages(messages)`

Sets custom error messages.

**Parameters**:

- `messages` (**Object**) - error message map.
  - Key: error code, such as `'string.min'`.
  - Value: error message template.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('string:3-32!')
  .messages({
    min: 'At least {{#limit}} characters',
    max: 'At most {{#limit}} characters'
  })
```

---

#### `.description(text)`

Sets a field description.

**Parameters**:

- `text` (**string**) - description text.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('url').description('Personal website URL')
```

---

#### `.custom(validator)`

Adds a custom validator.

**Parameters**:

- `validator` (**Function**) - validation function.
  - Signature: `(value) => boolean | string | { error, message } | void`
  - Return `true` to pass.
  - Return `false`, an error message string, or an error object to fail.
  - Synchronous validators are executed by both `validate()` and `validateAsync()`. Async validators that return `Promise` are executed only by `validateAsync()`. Calling `validate()` with a Promise-returning custom validator returns an explicit sync error.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('string:3-32!')
  .custom((value) => {
    if (value === 'admin') {
      return { error: 'username.exists', message: 'Username already exists' };
    }
  })
```

---

#### `.default(value)`

Sets a default value.

**Parameters**:

- `value` (**any**) - default value.

**Returns**: **DslBuilder**

**Example**:

```javascript
s('string').default('guest')
```

---

#### `.username(preset?)`

Username validation. It automatically sets length and regular expression rules.

**Parameters**:

- `preset` (**string** | **Object**, optional) - preset config.
  - String: `'short'` | `'medium'` | `'long'` | `'5-20'`
  - Object: `{ minLength, maxLength, allowUnderscore, allowNumber }`
  - Default: `'medium'`, meaning 3-32 characters.

**Returns**: **DslBuilder**

**Example**:

```javascript
// Default medium, 3-32 chars
s('string!').username()

// Custom range
s('string!').username('5-20')

// Preset
s('string!').username('short')  // 3-16 chars
```

---

#### `.password(strength?)`

Password strength validation. It automatically sets length and regular expression rules.

**Parameters**:

- `strength` (**string**, optional) - strength level.
  - `'weak'` - at least 6 characters
  - `'medium'` - 8 characters, letters plus numbers, default
  - `'strong'` - 8 characters, uppercase, lowercase, and numbers
  - `'veryStrong'` - 10 characters, uppercase, lowercase, numbers, and special characters

**Returns**: **DslBuilder**

**Example**:

```javascript
s('string!').password('strong')
```

---

#### `.phone(country?)`

Phone number validation. It automatically sets length and regular expression rules.

**Parameters**:

- `country` (**string**, optional) - country code.
  - `'cn'` - China, default
  - `'us'` - United States
  - `'uk'` - United Kingdom
  - `'hk'` - Hong Kong
  - `'tw'` - Taiwan
  - `'international'` - international format

**Returns**: **DslBuilder**

**Note**: `phone()` only applies to `string` schemas. Use `s('string!').phone('cn')`; number schemas throw to avoid mixed numeric and string constraints.

**Example**:

```javascript
// Recommended
s('string!').phone('cn')
```

---

#### `.toSchema()`

Converts the builder to a JSON Schema object with internal schema-dsl markers.

**Returns**: **Object** - JSON Schema object including `_required`, `_customMessages`, `_label`, and other internal fields.

**Example**:

```javascript
const schema = s('email!').label('email').toSchema();
// { type: 'string', format: 'email', _label: 'email', _required: true }
```

---

#### `.toJsonSchema()` <sup>v1.2.5+</sup>

Converts the builder to a clean JSON Schema object without internal markers.

Unlike `toSchema()`, `toJsonSchema()` removes all schema-dsl internal markers:

- Underscore-prefixed fields: `_required`, `_customMessages`, `_label`, `_customValidators`, `_whenConditions`
- Custom validation keywords, which are removed directly: `alphanum`, `lowercase`, `uppercase`, `trim`, `jsonString`, `port`, `requiredAll`, `strictSchema`, `noSparse`, `includesRequired`, `dateFormat`, `dateGreater`, `dateLess`, `precision`
- `exactLength` special translation: it is not removed directly. It is converted to standard JSON Schema `{ minLength: N, maxLength: N }`, matching the v1-compatible `string:N` behavior.

> `multipleOf` is a standard JSON Schema field and is **not** removed. v2 fixed the incorrect v1 behavior here.

The returned object can be embedded directly in OpenAPI or standard JSON Schema documents without extra downstream cleanup.

**Returns**: **Object** - clean JSON Schema object.

**Use cases**:

- Generate OpenAPI documents
- Export to external systems
- Any scenario that needs standard JSON Schema

**Example**:

```javascript
// Compare toSchema() and toJsonSchema()
const builder = s('string:3-32!').label('username').messages({ min: 'At least 3 chars' });

builder.toSchema();
// { type: 'string', minLength: 3, maxLength: 32, _required: true, _label: 'username', _customMessages: { min: 'At least 3 chars' } }

builder.toJsonSchema();
// { type: 'string', minLength: 3, maxLength: 32 }
// No _required, _label, _customMessages, or other internal fields.

// string:N syntax, exactLength -> minLength + maxLength
const exact = s('string:6!');
exact.toSchema();
// { type: 'string', exactLength: 6, _required: true }
exact.toJsonSchema();
// { type: 'string', minLength: 6, maxLength: 6 }
// exactLength is translated to standard JSON Schema minLength + maxLength.

// enum example
const enumBuilder = s('enum:admin,user,guest!');
enumBuilder.toJsonSchema();
// { type: 'string', enum: ['admin', 'user', 'guest'] }

// OpenAPI generation
const schema = s({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:0-120'
});
// Iterate fields and call toJsonSchema() to get standard JSON Schema.
```

---

#### `.validate(data)`

Validates data with the builder convenience method.

**Parameters**:

- `data` (**any**) - data to validate.

**Returns**: **Promise<Object>** - validation result.
  - `valid` (**boolean**) - whether validation passed.
  - `errors` (**Array**, optional) - error list.
  - `data` (**any**, optional) - validated data.

**Example**:

```javascript
const result = await s('email!').validate('user@example.com');
console.log(result.valid); // true
```

---

### Static Methods

#### `s.match(field, map)`

Creates a conditional validation rule similar to switch-case.

**Parameters**:

- `field` (**string**) - dependent field name.
- `map` (**Object**) - value-to-schema mapping.
  - `[value: string]` - schema for that value.
  - `_default` (**optional**) - default schema.

**Returns**: **Object** - internal match structure.

**Example**:

```javascript
s.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

#### `s.if(condition, thenSchema, elseSchema)`

Creates a simple conditional validation rule.

**Parameters**:

- `condition` (**string**) - condition field name.
- `thenSchema` (**string|Object**) - schema when the condition is satisfied.
- `elseSchema` (**string|Object**, optional) - schema when the condition is not satisfied.

**Returns**: **Object** - internal if structure.

**Example**:

```javascript
s.if('isVip', 'number:0-50', 'number:0-10')
```

---

## Runtime Helper Functions

### `VERSION`

Current package version exported from the root module. It is read from `package.json`, so it stays aligned with the published package version.

```javascript
import { VERSION } from 'schema-dsl/pure';

console.log(VERSION);
```

---

### `s.config(options)`

Global configuration entry. Call it once during application startup to configure i18n, cache, custom patterns, and strict type parsing.

```javascript
import { s } from 'schema-dsl/pure';

s.config({
  // i18n: built-in locale path, inline locale bundle, { localesPath }, or { locales }
  i18n: './locales',

  // Directory i18n loading keeps .js/.cjs enabled by default for compatibility.
  // Use 'deny' when the locale directory is not a trusted code source.
  codeLocaleFiles: 'deny',

  // Default locale, default is 'en-US'
  defaultLocale: 'zh-CN',

  // Compile cache config
  cache: { maxSize: 2000, ttl: 0, enabled: true },

  // strict: true -> unknown DSL types throw Error
  // default false: warn and fall back to string
  strict: true,

  // Add custom regex patterns
  patterns: {
    phone: { us: /^\+1\d{10}$/ }
  }
});
```

**Parameters** (`DslConfigOptions`):

| Field | Type | Default | Description |
|------|------|------|------|
| `i18n` | `string | object` | - | locale directory or inline locale object |
| `codeLocaleFiles` | `'allow' | 'deny'` | `'allow'` | whether directory loading may execute `.js` / `.cjs` locale files |
| `defaultLocale` | `string` | `'en-US'` | default locale |
| `cache` | `CacheOptions` | - | `maxSize` / `ttl` / `enabled` / `statsEnabled` |
| `strict` | `boolean` | `false` | when `true`, unknown DSL types throw `Error` |
| `patterns` | `object` | - | custom format regexes, such as phone/idCard/creditCard |

---

### `getDefaultValidator()`

Returns the default `Validator` singleton reused by top-level `validate()` / `validateAsync()`.

```javascript
import { getDefaultValidator } from 'schema-dsl/pure';

const validator = getDefaultValidator();
console.log(validator.getCacheStats());
```

---

### `resetDefaultValidator()`

Resets the default `Validator` singleton used by top-level `validate()` / `validateAsync()`.

```javascript
import { resetDefaultValidator } from 'schema-dsl/pure';

resetDefaultValidator();
```

---

### `resetRuntimeState()`

Resets global runtime state used by tests, workers, or tenant-isolated processes: the default validator singleton, registered custom types, locale state, strict parser mode, and runtime-added pattern keys.

```javascript
import { resetRuntimeState } from 'schema-dsl/pure';

resetRuntimeState();
```

---

<a id="string-extensions"></a>

### `installStringExtensions(dslFunction?)`

Installs or reinstalls String extensions for projects that intentionally use direct `'string!'.description(...)` chaining. Ordinary documentation examples do not need this API because they start from `schema-dsl/pure` + `s`.

```javascript
import { installStringExtensions } from 'schema-dsl/pure';

installStringExtensions();
```

---

### `uninstallStringExtensions()`

Uninstalls extension methods attached to `String.prototype`. This is mainly useful for tests, cleanup, or legacy compatibility checks. Ordinary code that does not want prototype mutation should import from `schema-dsl/pure` in the first place and use `s('...')` or `s.xxx()` for chainable calls.

```javascript
import { uninstallStringExtensions } from 'schema-dsl/pure';

uninstallStringExtensions();
```

---

## Package Entry Points and Compile-Time Transform

### `schema-dsl/pure`

Stable compatibility alias for the side-effect-free root core API. Neither `schema-dsl` nor `schema-dsl/pure` installs `String.prototype` extensions. This does not isolate Locale, TypeRegistry, PATTERNS or Validator state; use `schema-dsl/runtime` for runtime-state isolation.

```javascript
import { s, validate } from 'schema-dsl/pure';

const schema = s({
  email: s.email().description('Login email').require()
});

const result = validate(schema, { email: 'user@example.com' });
```

---

### `schema-dsl/compat` and `schema-dsl/register-string`

`schema-dsl/compat` keeps the v1/v2 direct String-chain compatibility behavior and installs String extensions on import. `schema-dsl/register-string` is the explicit side-effect entry for registering the same API during application startup. The root entry remains side-effect-free.

```javascript
import 'schema-dsl/register-string';
import { s } from 'schema-dsl/pure';

const schema = s({
  email: 'email!'.description('Login email')
});
```

---

### `schema-dsl/string-types`

Opt-in TypeScript declaration entry for String-chain authoring. Importing this entry only augments TypeScript's `String` interface; it does not install runtime `String.prototype` extensions.

```typescript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/string-types';

const field = 'email!'.label('Email').require();
const schema = s({ email: field });
```

---

### `transformSchemaDsl(source, options?)`

Rewrites static String-chain DSL calls at compile time and injects imports from `schema-dsl/pure`. By default, it transforms the complete built-in String-chain API on schema-dsl literals, including methods such as `.label()`, `.pattern()`, `.require()`, `.required()`, `.toJsonSchema()`, and naked pipe enums such as `"admin|user|guest".label("Role")`. Use `additionalMethods` for user-defined chain methods, and `additionalTypes` / `additionalTypePatterns` for registered custom DSL type literals such as `"tenant-id!".label("Tenant")`; `methods` remains a legacy replacement set when you intentionally need to override the built-in default list.

This entry loads Babel AST packages lazily. Install `@babel/parser`, `@babel/traverse`, `@babel/generator`, and `@babel/types` in projects that call `transformSchemaDsl()`. If any peer is missing, the first transform call throws the exported `BabelPeerDependencyError` with code `SCHEMA_DSL_BABEL_PEER_MISSING`; source parse failures still use the normal warning or strict-mode error contract.

```javascript
import { transformSchemaDsl } from 'schema-dsl/transform';

const result = transformSchemaDsl(
  'export const field = "admin|user|guest".label("Role")',
  { filename: 'schema.ts' }
);

console.log(result.changed);
console.log(result.code);
```

**Options**:

| Field | Type | Default | Description |
|------|------|------|------|
| `filename` | `string` | `'<unknown>'` | File name used for parser mode, source maps, and warnings |
| `sourceMap` | `boolean | 'inline'` | `false` | Generates a source map when enabled |
| `importFrom` | `string` | `'schema-dsl/pure'` | Import source used for the injected `dsl` helper |
| `methods` | `readonly string[]` | Full built-in String extension list | Legacy replacement set for chain method names eligible for compile-time rewriting |
| `additionalMethods` | `readonly string[]` | `[]` | User-defined chain methods appended to the configured method set |
| `additionalTypes` | `readonly string[]` | `[]` | Registered custom DSL type names eligible for literal rewriting |
| `additionalTypePatterns` | `readonly (RegExp \| string)[]` | `[]` | Patterns for custom DSL type literals when names are generated or follow a convention |
| `include` | `(filename) => boolean` | - | Optional file filter |
| `strict` | `boolean | object` | `false` | Throws `TransformSchemaDslError` for parse errors, root-entry imports, or unconfigured DSL extension methods when enabled |
| `onWarning` | `(warning) => void` | - | Receives parse, non-DSL-literal, and unconfigured-extension warnings. The legacy `root-import` code is not emitted in v3. |

**Return value**:

```javascript
{
  code: string,
  changed: boolean,
  warnings: Array<{ code: string, message: string, filename?: string, loc?: object }>,
  map?: object
}
```

---

### `schemaDslEsbuildPlugin(options?)`

Applies `transformSchemaDsl()` from an esbuild plugin. `esbuild` is an optional peer dependency, so install it only in projects that use the adapter.

```javascript
import { build } from 'esbuild';
import { schemaDslEsbuildPlugin } from 'schema-dsl/esbuild';

await build({
  entryPoints: ['src/schema.ts'],
  bundle: true,
  outfile: 'dist/schema.js',
  plugins: [schemaDslEsbuildPlugin()]
});
```

The adapter transforms only `file` namespace JavaScript and TypeScript source files, skips `node_modules`, and leaves virtual modules to their owning plugins.

---

## Runtime Adapter

`schema-dsl/runtime` provides an explicit adapter for frameworks and multi-tenant applications that need isolated runtime state. It does not install `String.prototype` extensions and it does not mutate the root `Locale`, `TypeRegistry`, `PATTERNS`, default `Validator`, or default validator-engine instances.

The entry exports `createRuntime()` as the primary factory. `createSchemaDslRuntime()` and `createSchemaDslAdapter()` are equivalent aliases for integrations that prefer an explicit adapter name.

```typescript
import { createRuntime } from 'schema-dsl/runtime';

const runtime = createRuntime({
  locale: 'tenant-a',
  messages: {
    'tenant.user.missing': {
      code: 'TENANT_USER_MISSING',
      message: 'Tenant user {{#id}} is missing'
    }
  },
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' }
  },
  patterns: {
    phone: {
      zz: { pattern: /^ZZ-\d{2}$/, min: 5, max: 5, key: 'pattern.phone.zz' }
    }
  },
  messageProvider: ({ key, locale, fallback }) =>
    key === 'number.min' ? `[${locale}] {{#label}} must be >= {{#limit}}` : fallback
});

const schema = runtime.s({
  id: 'tenantId!',
  phone: 'phone:zz',
  age: 'number:18-120'
});

const chainSchema = runtime.s.email().label('Login email').require().toSchema();

const result = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'ZZ-12',
  age: 16
});
```

| Method | Description |
|--------|-------------|
| `runtime.s(string)` | Returns an isolated `DslBuilder` with normal chain-method TypeScript hints. |
| `runtime.s(object)` | Compiles an object DSL definition using the runtime's type and pattern scope. |
| `runtime.s` | Alias of `runtime.dsl`; `runtime.s === runtime.dsl` is true. Namespace factories such as `runtime.s.email()` use the same runtime scope. |
| `runtime.compile(definition)` | Compiles a string or object DSL definition using the runtime scope. |
| `runtime.compileField(string)` | Returns an isolated chainable field builder. |
| `runtime.configure(options, control?)` | Updates runtime messages, type scope, patterns, strict mode or validator options. `merge` is incremental; `replace` swaps the full runtime-local profile; `reset` clears it before applying `options`. |
| `runtime.registerExtensions(definitions)` | Batch-registers runtime-scoped extensions from one definition set and returns a runtime namespace with typed factories. |
| `runtime.registerExtension(definition)` | Registers a runtime-scoped custom DSL extension and optional namespace factory; useful for dynamic registration or static-extension compatibility. |
| `runtime.registerType(name, schema)` | Adds or replaces a runtime-local custom type. |
| `runtime.registerDynamicType(name, factory)` | Adds or replaces a runtime-local dynamic type factory. |
| `runtime.unregisterType(name)` | Removes a runtime-local custom or dynamic type. |
| `runtime.clearCache()` | Clears runtime-owned validator caches. |
| `runtime.getStats()` | Returns lifecycle, message, type, pattern and validator cache counts. |
| `runtime.dispose()` | Idempotently releases runtime-owned maps and caches; use-after-dispose throws a clear error. |
| `runtime.validate(schema, data, options?)` | Validates with runtime-local messages, `messageProvider`, validator instances and custom keyword messages. |
| `runtime.validateAsync(schema, data, options?)` | Async validation with the same runtime-local state. |
| `runtime.createI18nError(key, params?, statusCode?, localeOrOptions?)` | Creates an `I18nError` without reading global `Locale` state. |

`messageProvider` receives `{ key, params, locale, source, fallback }`, where `source` is one of `ajv`, `customKeyword`, `conditional`, `customValidator`, `i18nError` or `runtime`. It covers standard validator messages, custom keyword messages, conditional validation messages, async custom validator fallback messages and runtime-created `I18nError` instances. Explicit `messages` still have priority over provider fallbacks.

`runtime.validate()` and `runtime.validateAsync()` accept the same per-call error options as the root helpers. Pass `{ coerce: false }`, `{ smartCoerce: false }`, or `{ coerceTypes: false }` when a runtime call must reject numeric or boolean strings instead of using schema-dsl smart coercion.

Create runtimes at app, plugin or worker lifecycle boundaries. Request-level differences should use `validate(..., { locale, messages, messageProvider })`; do not create a new runtime per request.

### Boundary with `schema-dsl/pure`

`schema-dsl/pure` only avoids automatic `String.prototype` installation. It keeps the same global runtime state as the root API. For isolated Locale, TypeRegistry, PATTERNS and validator state, use `schema-dsl/runtime`.

---

## Validator Class

**Parameters**:

- `options` (**Object**, optional) - validator configuration.

The validator uses Draft 7 as its JSON Schema baseline and additionally executes selected newer applicator keywords, including `minContains` / `maxContains`. This is a targeted runtime extension, not a claim of complete Draft 2019-09 or 2020-12 support.

### Methods

#### `.compile(schema, cacheKey?)`

Compiles a schema into a reusable validation function.

**Parameters**:

- `schema` (**Object**) - JSON Schema.
- `cacheKey` (**string** | **null**, optional) - cache key.

**Returns**: **Function** - reusable validation function.

**Example**:

```javascript
const validator = new Validator();
const validate = validator.compile(schema, 'user-schema');
const ok = validate(data);
```

---

#### `.validate(schema, data, options?)`

Synchronous validation.

**Parameters**:

- `schema` (**Object** | **Function**) - JSON Schema or precompiled validation function.
- `data` (**any**) - data to validate.
- `options` (**Object**, optional) - validation options.

**Returns**: **Object**

- `valid` (**boolean**) - whether validation passed.
- `errors` (**Array**, optional) - error list.
- `data` (**any**, optional) - processed data.

**Example**:

```javascript
const validator = new Validator();
const result = validator.validate(schema, payload);
console.log(result.valid);
```

---

#### `.validateAsync(schema, data, options?)`

Asynchronous validation. Throws `ValidationError` when validation fails.

**Parameters**:

- `schema` (**Object** | **Function**) - JSON Schema or precompiled validation function.
- `data` (**any**) - data to validate.
- `options` (**Object**, optional) - validation options.

**Returns**: **Promise<any>** - validated data.

**Example**:

```javascript
const validator = new Validator();
await validator.validateAsync(schema, payload);
```

---

#### `.validateBatch(schema, dataArray)`

Batch validation. The schema is compiled once and reused for all items.

**Parameters**:

- `schema` (**Object**) - JSON Schema.
- `dataArray` (**Array**) - array of data items.

**Returns**: **Array<Object>** - validation result for each item.

**Example**:

```javascript
const validator = new Validator();
const results = validator.validateBatch(schema, records);
```

---

#### `.addKeyword(keyword, definition)`

Adds a custom validator keyword.

**Parameters**:

- `keyword` (**string**) - keyword name.
- `definition` (**Object**) - validator keyword definition.

**Returns**: **Validator**

**Example**:

```javascript
const validator = new Validator();
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema, data) => data % 2 === 0
});
```

---

#### `.addFormat(name, validator)`

Adds a custom validator format.

**Parameters**:

- `name` (**string**) - format name.
- `validator` (**Function** | **Object**) - format definition.

**Returns**: **Validator**

**Example**:

```javascript
const validator = new Validator();
validator.addFormat('phone-cn', /^1[3-9]\d{9}$/);
```

---

#### `.addSchema(uri, schema)`

Adds a schema reference.

**Parameters**:

- `uri` (**string**) - schema identifier.
- `schema` (**Object**) - JSON Schema.

**Returns**: **Validator**

**Example**:

```javascript
const validator = new Validator();
validator.addSchema('user.schema.json', schema);
```

---

#### `.removeSchema(uri)`

Removes a schema reference.

**Parameters**:

- `uri` (**string**) - schema identifier.

**Returns**: **Validator**

**Example**:

```javascript
const validator = new Validator();
validator.removeSchema('user.schema.json');
```

---

#### `.getAjv()`

Returns the underlying AJV instance.

**Returns**: **Ajv**

**Example**:

```javascript
const validator = new Validator();
const ajv = validator.getAjv();
```

---

#### `.clearCache()`

Clears the compile cache.

**Returns**: `void`

**Example**:

```javascript
const validator = new Validator();
validator.clearCache();
```

---

#### `.getCacheStats()`

Returns cache statistics.

**Returns**: **Object**

**Example**:

```javascript
const validator = new Validator();
console.log(validator.getCacheStats());
```

---

### Static Methods

#### `Validator.create(options?)`

Creates a `Validator` instance.

**Returns**: **Validator**

**Example**:

```javascript
const validator = Validator.create();
```

---

#### `Validator.quickValidate(schema, data)`

Quick validation.

**Parameters**:

- `schema` (**Object**) - JSON Schema.
- `data` (**any**) - data to validate.

**Returns**: **boolean**

**Example**:

```javascript
const ok = Validator.quickValidate(schema, data);
```

#### `Validator.clearQuickValidateCache()`

Clears the static `quickValidate()` AJV schema cache and releases its singleton AJV instance. The next `quickValidate()` call recreates the validator lazily.

#### `Validator.getQuickValidateCacheStats()`

Returns `{ size, maxSize }` for the static `quickValidate()` schema cache.

---

## Exporters

### BaseExporter

Abstract base class exported for custom exporter subclasses. Built-in exporters inherit its shared option storage and schema assertion helpers; application code usually uses `MongoDBExporter`, `MySQLExporter`, `PostgreSQLExporter`, or `MarkdownExporter` directly.

```javascript
import { BaseExporter } from 'schema-dsl/pure';

console.log(typeof BaseExporter); // 'function'
```

---

### MongoDBExporter

Exports to MongoDB validation schema.

```javascript
import { MongoDBExporter } from 'schema-dsl/pure';

const exporter = new MongoDBExporter({ strict: true });
const mongoSchema = exporter.export(jsonSchema);
const command = exporter.generateCommand('users', jsonSchema);
```

**Methods**:

- `export(schema)` - exports MongoDB schema.
- `exportWithReport(schema, options?)` - exports MongoDB schema and reports JSON Schema keywords that are not represented by the target format.
- `generateCommand(collection, schema)` - generates a `createCollection` command.

`exportWithReport()` returns `{ output, losses }`; each loss includes `path`, `keyword`, `severity`, and `message`. Pass `{ strict: true }` to throw instead of returning lossy output.

Boolean JSON Schemas are target-aware in the report: Markdown represents both values, MongoDB represents `true` but reports `false`, and SQL exporters report both `true` and `false` as `$booleanSchema` losses.

---

### MySQLExporter

Exports to MySQL DDL.

```javascript
import { MySQLExporter } from 'schema-dsl/pure';

const exporter = new MySQLExporter();
const ddl = exporter.export('users', jsonSchema);
```

**Methods**:

- `export(tableName, schema)` - exports MySQL DDL.
- `exportWithReport(tableName, schema, options?)` - exports DDL and returns `{ output, losses }`; set `strict: true` to throw when unsupported keywords would be omitted.

Each loss includes `path`, `keyword`, `severity`, and `message`.

---

### PostgreSQLExporter

Exports to PostgreSQL DDL.

```javascript
import { PostgreSQLExporter } from 'schema-dsl/pure';

const exporter = new PostgreSQLExporter();
const ddl = exporter.export('users', jsonSchema);
```

**Methods**:

- `export(tableName, schema)` - exports PostgreSQL DDL.
- `exportWithReport(tableName, schema, options?)` - exports DDL and returns `{ output, losses }`; set `strict: true` to throw when unsupported keywords would be omitted.

Each loss includes `path`, `keyword`, `severity`, and `message`.

---

## Utility Functions

### TypeConverter

Type conversion utility.

```javascript
import { TypeConverter } from 'schema-dsl/pure';

TypeConverter.toJSONSchemaType('string');
TypeConverter.toMongoDBType('integer');
```

---

### SchemaHelper

Schema helper utility.

```javascript
import { SchemaHelper } from 'schema-dsl/pure';

SchemaHelper.merge(schema1, schema2);
SchemaHelper.clone(schema);
```

---

### ErrorFormatter

Validation error formatting utility. It converts raw validator errors or simplified error objects into unified error item structures or message text.

```javascript
import { ErrorFormatter } from 'schema-dsl/pure';

const formatter = new ErrorFormatter('en-US');
const errors = formatter.formatDetailed(ajvValidate.errors);
console.log(errors[0].message);
```

**Methods**:

- `new ErrorFormatter(locale?, messages?)` - creates an error formatter.
- `format(error, locale?)` - formats a single error as a message string.
- `formatDetailed(errors, locale?, customMessages?, alreadyMerged?)` - formats an error array as standard error items.

---

### MessageTemplate

Error message template wrapper. It delegates placeholder replacement to `renderTemplate()`.

```javascript
import { MessageTemplate } from 'schema-dsl/pure';

const template = new MessageTemplate('{{#label}} is required');
console.log(template.render({ label: 'Email' }));
```

**Methods**:

- `new MessageTemplate(template)` - creates a template instance.
- `render(context)` - renders the current template.
- `MessageTemplate.render(template, context)` - static quick render.
- `MessageTemplate.renderBatch(templates, context)` - batch-renders multiple templates.

---

### renderTemplate(template, params)

Low-level template rendering function. It supports both `{{#key}}` and `{key}` placeholder formats.

```javascript
import { renderTemplate } from 'schema-dsl/pure';

const msg = renderTemplate('{field} must be {min}~{max}', {
  field: 'age',
  min: 18,
  max: 65,
});

console.log(msg); // age must be 18~65
```

---

### JSONSchemaCore

`JSONSchemaCore` is a v1-compatible facade class for building JSON Schema with a chainable API and running quick validation.

```javascript
import { JSONSchemaCore } from 'schema-dsl/pure';

const schema = new JSONSchemaCore()
  .type('object')
  .property('email', { type: 'string', format: 'email' })
  .required('email')
  .getSchema();
```

**Common methods**:

- `type(typeName)`
- `property(name, schema)`
- `properties(properties)`
- `required(fields)`
- `format(formatName)`
- `pattern(pattern)`
- `items(schema)`
- `toSchema()` / `getSchema()`
- `validate(data)`

---

### Type Registration and Internal Parsing Boundaries

The root API keeps only stable business-facing entries. DSL parser, constraint parser, schema compiler, and adapter modules are implementation details and are no longer documented as root API exports. Business code should prefer `s()`, `DslBuilder`, `Validator`, and `validate()`.

#### TypeRegistry

Unified type registry. It is the public entry for custom type extension. If you only need to register a DSL type, you can also prefer the higher-level `DslBuilder.registerType()`.

- `TypeRegistry.resolve(typeName)`
- `TypeRegistry.register(name, def)`
- `TypeRegistry.registerDynamic(name, factory)`
- `TypeRegistry.unregister(name)`
- `DslBuilder.unregisterType(name)` - removes one custom type from both the Builder-side custom type table and `TypeRegistry`.
- `TypeRegistry.has(typeName)`
- `TypeRegistry.getInternalKeys()`
- `TypeRegistry.toJsonSchema(schema)`
- `TypeRegistry.clearCustomTypes()` - clears all custom types, including those registered through `TypeRegistry.register()` / `DslBuilder.registerType()`. Useful after tests.
- `TypeRegistry.setStrict(flag)` - sets strict mode, equivalent to `s.config({ strict: flag })`.

---

## DSL Syntax Quick Reference

### Basic Types

```text
string, number, integer, boolean
email, url, uuid, date, datetime
```

### Constraints

```text
string:N            # exact length, exactLength = N, equivalent to minLength: N, maxLength: N
string:min-max      # string length range
number:min-max      # number range
value1|value2       # enum
!                   # required
```

### Arrays

```text
array<type>         # array
array<string:1-50>  # constrained array items
```

### Examples

```javascript
'string:3-32!'              // required string, length 3-32
'email!'                    // required email
'number:18-120'             // optional number, range 18-120
'active|inactive|pending'   // enum
'array<string:1-20>'        // string array
```

---

## Constants

### `VERSION`

String export matching `package.json` version.

```javascript
import { VERSION } from 'schema-dsl/pure';

console.log(VERSION);
```

---

### `VALIDATION`, `CACHE`, `FORMATS`, `CONSTANTS`

Named constants and the aggregate `CONSTANTS` namespace. Use named exports for common access; use `CONSTANTS` when iterating over all constant groups.

```javascript
import { VALIDATION, CACHE, FORMATS, CONSTANTS } from 'schema-dsl/pure';

console.log(VALIDATION.MAX_RECURSION_DEPTH);
console.log(CACHE.ENABLED);
console.log(FORMATS.BUILT_IN.includes('email'));
console.log(CONSTANTS.FORMATS === FORMATS);
```

---

### `PATTERNS`, `PATTERN_IPV4`, `PATTERN_IPV6`

Reusable regular expression groups and IPv4/IPv6 helpers used by built-in formats and custom validation scenarios.

```javascript
import { PATTERNS, PATTERN_IPV4, PATTERN_IPV6 } from 'schema-dsl/pure';

console.log(Object.keys(PATTERNS.phone));
console.log(PATTERN_IPV4.test('127.0.0.1'));
console.log(PATTERN_IPV6.test('::1'));
```

---

### ErrorCodes

Error code constants.

```javascript
import { ErrorCodes } from 'schema-dsl/pure';

console.log(ErrorCodes.STRING_MIN);     // 'string.min'
console.log(ErrorCodes.NUMBER_RANGE);   // 'number.range'
```

---

### Locale

Internationalization support.

```javascript
import { Locale } from 'schema-dsl/pure';

Locale.setLocale('zh-CN');  // set Chinese
Locale.setLocale('en-US');  // set English
```

---

### ConditionalBuilder

`s.if(conditionFn)` returns a chainable conditional builder for runtime dynamic conditional validation.

**Common methods**:

- `if(condition)`
- `and(condition)`
- `or(condition)`
- `elseIf(condition)`
- `message(msg)`
- `then(schema)`
- `else(schema)`
- `toSchema()`
- `build()` - alias of `toSchema()`
- `validate(data, options?)`
- `validateAsync(data, options?)`
- `assert(data, options?)`
- `check(data)`

For complete examples and behavior details, see [conditional-api.md](./conditional-api.md).

---

## v1-Compatible Root Exports

v2 is a TypeScript refactor of the v1 JavaScript line. These root exports remain part of the compatibility surface, even when most users reach them through higher-level APIs.

| Export | Purpose | More detail |
|--------|---------|-------------|
| `VERSION` | Runtime package version string aligned with `package.json`. | This page |
| `CONSTANTS` | Namespace for validation, cache, format and plugin constants; named constants such as `VALIDATION`, `CACHE`, `FORMATS`, `PATTERNS`, `PATTERN_IPV4` and `PATTERN_IPV6` are also exported. | This page |
| `BaseExporter` | Abstract base class for custom exporter subclasses. | This page |
| `CacheManager` | LRU/TTL cache used by `Validator` and available for manual cache scenarios. | [cache-manager.md](./cache-manager.md) |
| `CustomKeywords` | Registers schema-dsl custom validator keywords. Most applications use it indirectly through `Validator`. | [add-keyword.md](./add-keyword.md) |
| `I18nError` | Internationalized application error helper with `create()`, `throw()`, `assert()`, `is()` and `toJSON()`. | [error-handling.md](./error-handling.md) |
| `PluginManager` | Plugin registry and hook manager for v1-compatible plugin workflows. | [plugin-system.md](./plugin-system.md) |
| `resetRuntimeState` | Test and worker cleanup helper for global runtime state. | This page |

The companion example [api-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts) exercises these exports so API reference drift is caught by `npm run examples:run`.

---

## Complete Example

```javascript
import { s, Validator } from 'schema-dsl/pure';

// Define schema with pure DSL plus s(...) builders
const userSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern': 'Only letters, numbers, and underscores are allowed'
    })
    .label('username'),

  email: s('email!')
    .label('email address'),

  password: s('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('password'),

  age: 'number:18-120',
  role: 'user|admin|moderator'
});

// Validate data
const validator = new Validator();
const result = validator.validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user'
});

console.log(result.valid); // true
```

---

## More Resources

- [Complete DSL Syntax Guide](./dsl-syntax.md)
- [Error Handling](./error-handling.md)
- [Example code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts)
- [GitHub](https://github.com/vextjs/schema-dsl)

---

## Corresponding Example File

**Example entry**: [api-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/api-reference.ts)
**Description**: Covers runnable call chains for `s()`, `validate()`, `validateAsync()`, the default `Validator` singleton, `CacheManager`, `CustomKeywords`, `I18nError`, `PluginManager`, `CONSTANTS`, template rendering, `JSONSchemaCore`, `ErrorFormatter`, `ObjectDslBuilder`, `TypeRegistry`, and other public APIs.

---
