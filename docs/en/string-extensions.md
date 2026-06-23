# String extension documentation

This page documents the explicit String extension path. For ordinary application code, prefer `schema-dsl/pure` + `s`. Use this page when you intentionally want direct string-chain authoring, or when you need to maintain compatibility with code that already uses it.

## Core features

**After explicitly enabling String extensions, strings can directly call chain methods**

```javascript
import 'schema-dsl/register-string';
import { s } from 'schema-dsl/pure';

const schema = s({
  // ✅ Direct String chain is intentionally enabled
  email: 'email!'.pattern(/custom/).label('email'),

  // ✅ Pure DSL still works
  age: 'number:18-120'
});
```

**Advantages**:
- ✅ More concise and natural
- ✅ Reduce the amount of code
- ✅ Can coexist with `s('...')` seeds and `s.xxx()` factories

## Default alternative: no prototype mutation

If you do not want to modify `String.prototype`, import from `schema-dsl/pure` and use `s('...')` or `s.xxx()` factories from the start:

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  // Use s() or s.xxx() instead of direct String chaining
  email: s.email().pattern(/custom/).label('mailbox').require(),

  // Pure DSL is not affected
  age: 'number:18-120'
});
```

---

## Side-effect-controlled entries

The root `schema-dsl` entry still installs String extensions for v1 compatibility. New code should usually start from `schema-dsl/pure`; use the explicit entries below only when you intentionally want direct string-chain authoring.

| Entry | Behavior | Recommended use |
|------|------|------|
| `schema-dsl` | v1-compatible root entry; installs String extensions on import | Existing apps that already rely on direct `'email!'.description(...)` chains |
| `schema-dsl/pure` | Core API only; does not install String extensions | Libraries, workers, tests, SSR, or isolated runtimes |
| `schema-dsl/compat` | Compatibility entry with the same String-extension side effect as the root entry | Code that wants to make compatibility explicit |
| `schema-dsl/register-string` | Explicit side-effect entry that installs String extensions | Application startup after importing from `schema-dsl/pure` |
| `schema-dsl/string-types` | TypeScript declarations for String-chain authoring only; no runtime installation | TS projects that use compile-time transform and want IDE hints |
| `schema-dsl/transform` | Compile-time transform for static String-chain DSL calls | Build tools and custom adapters |
| `schema-dsl/esbuild` | Optional esbuild adapter around the transform | esbuild build/context flows |

```javascript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = s({
  email: 'email!'.description('Login email')
});
```

For builds that want String-chain authoring without runtime prototype mutation, use `transformSchemaDsl()` or `schemaDslEsbuildPlugin()` to rewrite static chains into `s('...')` calls that import from `schema-dsl/pure`. The default transform covers the full built-in String extension method set and naked pipe enums; add user-defined methods with `additionalMethods`, and add registered custom DSL type literals with `additionalTypes` or `additionalTypePatterns`.

---

## Available direct String methods

The following methods are installed on `String.prototype` by the root entry or `schema-dsl/register-string`. This list mirrors the runtime `STRING_EXTENSION_METHODS` list. `DslBuilder.length(n)` and `DslBuilder.trim()` are intentionally not installed because JavaScript strings already have native `.length` and `.trim()` members.

| Category | Methods |
|----------|---------|
| Metadata and messages | `.label(text)`, `.description(text)`, `.messages(obj)`, `.error(obj)` |
| Required and defaults | `.require()`, `.required()`, `.optional()`, `.default(value)` |
| Common constraints | `.pattern(regex, msg?)`, `.format(name)`, `.enum(...values)`, `.custom(fn)` |
| String rules | `.min(n)`, `.max(n)`, `.alphanum()`, `.lowercase()`, `.uppercase()`, `.json()` |
| String formats | `.slug()`, `.domain()`, `.ip()`, `.base64()`, `.jwt()`, `.dateFormat(fmt)`, `.after(date)`, `.before(date)`, `.dateGreater(date)`, `.dateLess(date)` |
| Presets | `.username(range?)`, `.password(strength?)`, `.phone(country?)`, `.phoneNumber(country?)`, `.idCard(country?)`, `.creditCard(type?)`, `.licensePlate(country?)`, `.postalCode(country?)`, `.passport(country?)` |
| Number helpers | `.precision(n)`, `.multiple(n)`, `.port()` |
| Object helpers | `.requireAll()`, `.strict()` |
| Array helpers | `.items(item)`, `.noSparse()`, `.includesRequired(items)` |
| Output | `.toSchema()`, `.toJsonSchema()` |

Examples:

```javascript
'email!'.label('Email').require().pattern(/custom/).toSchema()
'string'.default('guest')
'number'.min(18).max(120).precision(2)
'array'.items('string').noSparse().includesRequired(['admin'])
```

---

## quick start

```javascript
import 'schema-dsl/register-string';
import { s } from 'schema-dsl/pure';

const schema = s({
  // Direct string chain calls are available after explicit registration
  email: 'email!'.label('email address'),

  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username'),

  // Use pure DSL for simple fields
  age: 'number:18-120',
  role: 'user|admin'
});
```

---

## Detailed example

The following examples assume direct String extensions have been explicitly registered. If you do not want runtime prototype mutation, use `s('...')` or `s.xxx()` instead.

### 1. Regularity validation

```javascript
const schema = s({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': 'can only contain letters, numbers and underscores'
    })
    .label('username'),

  phone: 'string:11!'
    .pattern(/^1[3-9]\d{9}$/)
    .messages({
      'pattern': 'Please enter a valid mobile phone number'
    })
    .label('Mobile phone number'),

  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .messages({
      'pattern': 'Password must contain uppercase and lowercase letters and numbers'
    })
    .label('password')
});
```

**Correct error code**:
- `'required'` - ​​required field
- `'min'` - ​​minimum length/value
- `'max'` - ​​maximum length/value
- `'pattern'` - ​​Regular validation
- `'format'` - ​​Format validation (email/url, etc.)
- `'enum'` - ​​enumeration value

---

### 2. Customize error messages

```javascript
const schema = s({
  email: 'email!'
    .label('email address')
    .messages({
      'format': 'Please enter a valid email address',
      'required': 'Email address cannot be empty'
    }),

  bio: 'string:500'
    .label('personal profile')
    .messages({
      'max': 'Personal profile cannot exceed {{#limit}} characters'
    }),

  age: 'number:18-120'
    .messages({
      'min': 'Age cannot be less than {{#limit}}',
      'max': 'Age cannot be greater than {{#limit}}'
    })
});
```

**Message template variables**:
- `{{#label}}` - ​​field label
- `{{#limit}}` - ​​constraint value (min/max)
- `{{#value}}` - ​​current value
- `{{#pattern}}` - ​​regular expression

---

### 3. Custom validator

```javascript
const schema = s({
  // Most elegant: only return an error message on failure
  username: 'string:3-32!'
    .custom((value) => {
      if (value === 'admin') return 'Username has been occupied';
      // No need to return on success
    })
    .label('username'),

  //Support synchronous validation
  password: 'string:8-64!'
    .custom((value) => {
      if (!/[A-Z]/.test(value)) return 'Must contain uppercase letters';
      if (!/[a-z]/.test(value)) return 'Must contain lowercase letters';
      if (!/\d/.test(value)) return 'Must contain numbers';
    })
    .label('password')
});
```

⚠️ `.custom()` supports synchronous functions; when asynchronous library checking or remote calling is required, you can return `Promise` and use `validateAsync()`. Synchronous `validate()` will return an explicit error when encountering a Promise-returning custom validator.

**Supported return values**:
- Do not return/`undefined` → Validation passed ✅
- return string → validation failed (error message)
- Return `{ error, message }` → Custom error code
- throw exception → validation failed
- Return `true` → Validation passed
- Return `false` → Authentication failed (default message)

**Notice**:
- The current version supports returning `Promise` in `.custom()`, but must be performed through `validateAsync()`.
- If you want to leave the database/RPC/HTTP check in the business layer, you can also use `schema-dsl` to do structure validation first, and then perform asynchronous checking in the business layer.


---

### 5. Default validator

```javascript
const schema = s({
  // Username validation (automatic regularization + length)
  username: 'string!'.username('5-20'), // 5-20 characters

  //Mobile phone number validation
  phone: 'string!'.phone('cn'), // China mobile phone number

  // Password strength
  password: 'string!'.password('strong'), // Strong password

  //ID card validation
  idCard: 'string!'.idCard('cn'),

  // URL alias validation
  slug: 'string!'.slug()
});
```

**username default**:
- `'short'` - 2-16
- `'medium'` - ​​3-32 (default)
- `'long'` - 5-64
- `'3-32'` - ​​Custom scope

**phone supported countries**:
- `'cn'` - ​​China (11th place)
- `'us'` - ​​United States
- `'uk'` - ​​United Kingdom

**password strength**:
- `'weak'` - 6-64
- `'medium'` - ​​8-64 (default)
- `'strong'` - ​​8-64 (uppercase and lowercase + numbers)

---

### 6. Complete form example

```javascript
import 'schema-dsl/register-string';
import { s, validate } from 'schema-dsl/pure';

const formSchema = s({
  email: 'email!'
    .label('email address')
    .description('Used to log in and receive notifications')
    .messages({
      'format': 'Please enter a valid email address'
    }),

  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': 'can only contain letters, numbers and underscores',
      'min': 'Username must be at least 3 characters',
      'max': 'Username can be up to 32 characters'
    })
    .label('username'),

  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    .messages({
      'pattern': 'Password must contain uppercase and lowercase letters, numbers and special characters'
    })
    .label('password'),

  // simple fields
  age: 'number:18-120',
  gender: 'male|female|other'
});

// verify
const result = validate(formSchema, {
  email: 'user@example.com',
  username: 'john_doe',
  password: 'Password123!',
  age: 25,
  gender: 'male'
});

console.log(result.valid); // true
```

---

## Multi-language support

### Solution 1: Global multi-language configuration (recommended)

```javascript
import 'schema-dsl/register-string';
import { Locale, s } from 'schema-dsl/pure';

//Set language
Locale.setLocale('zh-CN');

//Add custom language pack
Locale.addLocale('zh-CN', {
  'required': '{{#label}} cannot be empty',
  'min': '{{#label}}at least {{#limit}} characters',
  'max': '{{#label}} is at most {{#limit}} characters',
  'pattern': '{{#label}} format is incorrect',
  'format': 'Please enter a valid {{#label}}'
});

// Use label in Schema
const schema = s({
  email: 'email!'
    .label('email address'), // The error message will automatically use "email address"

  username: 'string:3-32!'
    .label('username')
});

// switch language
Locale.setLocale('en-US'); // Automatically switch to English message
```

### Option 2: Field-level multilingualism

```javascript
const schema = s({
  email: 'email!'
    .label('email address')
    .messages({
      'format': 'Please enter a valid email address',
      'required': 'Email address cannot be empty'
    })
});
```

### Option 3: Dynamic switching at runtime

```javascript
import 'schema-dsl/register-string';
import { Locale, s } from 'schema-dsl/pure';

//Switch based on user language preference
function getSchema(locale) {
  Locale.setLocale(locale);

  return s({
    email: 'email!'.label(
      locale === 'zh-CN'? 'Email Address': 'Email Address'
    )
  });
}

const zhSchema = getSchema('zh-CN');
const enSchema = getSchema('en-US');
```

**Recommended solution**: Solution 1 (global configuration) + Solution 2 (special field coverage)

---

## Compatibility installation and cleanup

### Compatibility installation

The root compatibility entry and `schema-dsl/compat` install String extensions on import. New code should prefer `schema-dsl/pure` unless direct String chains are intentional.

```javascript
import 'schema-dsl/compat';
import { s } from 'schema-dsl/pure';

const schema = s({
  email: 'email!'.label('email address')
});
```

The extension is mounted to `String.prototype` with non-enumerable attributes, and detects external methods with the same name during installation; if it is found that the method is not installed by schema-dsl itself, it will refuse to overwrite it.

If your running environment has extended a method with the same name (such as `String.prototype.label`) before importing `schema-dsl`, the root entry will throw a conflict error during the import phase to avoid silently overwriting the external implementation. The solution is to first remove or rename the conflicting external extension, and then import `schema-dsl`; ordinary projects usually do not encounter this scenario.

### Disable after an explicit install

```javascript
import { uninstallStringExtensions } from 'schema-dsl/pure';

uninstallStringExtensions();

// Direct String chains are no longer available after cleanup.
'email!'.pattern(/custom/) // ❌ Report error
```

### Re-enable or customize the installation

```javascript
import { installStringExtensions } from 'schema-dsl/pure';

installStringExtensions();

// String extension recovery
'email!'.pattern(/custom/) // ✅ Normal
```

---

## best practices

### 1. Use pure DSL for simple fields

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  name: 'string:1-50!',
  age: 'number:18-120',
  role: 'user|admin'
});
```

### 2. Use chain calls for complex fields

```javascript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = s({
  email: 'email!'
    .pattern(/custom/)
    .messages({...})
    .label('mailbox'),

  username: 'string:3-32!'
    .pattern(/^\w+$/)
    .custom(checkExists)
});
```

### 3. Follow the 80/20 rule

**Use pure DSL strings for simple fields. Use direct string chains only when that authoring style is intentional; otherwise use `s('...')` for explicit DSL seeds with builder hints or `s.xxx()` factories for the strongest method discovery. In TypeScript, direct string chain hints require `schema-dsl/string-types`.**

---

## FAQ

### Q1: Will String expansion pollute the global situation?

**A**: Direct String chains modify `String.prototype`, so they are opt-in for new code. For no import-time prototype mutation, import from `schema-dsl/pure` and use `s('...')` or `s.xxx()`. When you intentionally want direct string chains, import `schema-dsl/register-string` during application startup. `uninstallStringExtensions()` is mainly for test cleanup or legacy compatibility checks.

### Q2: How is the performance?

**A**: Treat String extension overhead as an ergonomics concern rather than a permanent performance claim. For hot paths, reuse schema objects and validators, then verify with the benchmark route described in [Performance Optimization Guide](performance-guide.md).

### Q3: Is TypeScript supported?

**A**: Fully supported. Use `s('...')` or `s.xxx()` for the default no-global-type path, or import `schema-dsl/string-types` when a TypeScript project intentionally wants String-chain IDE hints for code that is compiled through the transform.

### Q4: What is the correct error code?

**A**:
- `'required'` - ​​required
- `'min'` / `'max'` - length/value range
- `'pattern'` - ​​Regular
- `'format'` - ​​format (email/url)
- `'enum'` - ​​enumeration

### Q5: How to support multiple languages?

**A**: Use `Locale` global configuration (recommended) or field-level `.messages()` override.

---

## Related documents

- [DSL syntax](./dsl-syntax.md)
- [API Reference](./api-reference.md)
- [Multi-language support](./multi-language.md)
- [Sample code](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts)

---

## Corresponding sample file

**Example entry**: [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts)
**Description**: Covers the installation/uninstallation of String.prototype extension, chained `.label()` / `.messages()` / `.pattern()` calls, and validation success/failure paths.

---
