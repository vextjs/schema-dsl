# String extension documentation

> **Update time**: 2026-06-17

---

## 📑 Table of Contents

- [Core Features](#core-features)
- [Side-effect-controlled entries](#side-effect-controlled-entries)
- [Available methods](#available-methods)
- [Quick Start](#quick-start)
- [Detailed example](#detailed-example)
- [Multi-language support](#multi-language-support)
- [Default installation and uninstallation](#default-installation-and-uninstallation)
- [Best Practice](#best-practices)
- [FAQ](#faq)

---

## Core features

**After importing schema-dsl, strings can directly call the chain method**

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  // ✅ Root entry has String extension installed by default
  email: 'email!'.pattern(/custom/).label('email'),

  // ✅ Pure DSL still works
  age: 'number:18-120'
});
```

**Advantages**:
- ✅ More concise and natural
- ✅ Reduce the amount of code
- ✅ Can coexist with `dsl()` package writing method

## Alternative (non-intrusive after active uninstallation)

If you mind modifying `String.prototype`, you can actively uninstall the extension and then use `dsl()` to wrap the string:

```javascript
const { dsl, uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();

const schema = dsl({
  // Use dsl() to wrap the string
  email: dsl('email!').pattern(/custom/).label('mailbox'),

  // Pure DSL is not affected
  age: 'number:18-120'
});
```

---

## Side-effect-controlled entries

The root `schema-dsl` entry still installs String extensions by default for v1 compatibility. Use the explicit entries below when you need to control that global side effect.

| Entry | Behavior | Recommended use |
|------|------|------|
| `schema-dsl` | v1-compatible root entry; installs String extensions on import | Existing apps that already rely on direct `'email!'.description(...)` chains |
| `schema-dsl/pure` | Core API only; does not install String extensions | Libraries, workers, tests, SSR, or isolated runtimes |
| `schema-dsl/compat` | Compatibility entry with the same String-extension side effect as the root entry | Code that wants to make compatibility explicit |
| `schema-dsl/register-string` | Explicit side-effect entry that installs String extensions | Application startup after importing from `schema-dsl/pure` |
| `schema-dsl/transform` | Compile-time transform for static String-chain DSL calls | Build tools and custom adapters |
| `schema-dsl/esbuild` | Optional esbuild adapter around the transform | esbuild build/context flows |

```javascript
import { dsl } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = dsl({
  email: 'email!'.description('Login email')
});
```

For builds that want String-chain authoring without runtime prototype mutation, use `transformSchemaDsl()` or `schemaDslEsbuildPlugin()` to rewrite supported static chains into `dsl('...')` calls that import from `schema-dsl/pure`.

---

## Available methods

The following examples are available by default after importing `schema-dsl`.

| method | Description | Example |
|------|------|------|
| `.pattern(regex, msg?)` | Regular validation | `'string!'.pattern(/^\w+$/)` |
| `.label(text)` | Field labels | `'email!'.label('Email address')` |
| `.messages(obj)` | Custom message | `'string!'.messages({...})` |
| `.description(text)` | describe | `'url'.description('Homepage')` |
| `.custom(fn)` | Custom validation; `validateAsync()` is required when returning a Promise | `'string!'.custom(value => value !== "admin")` |
| `.default(value)` | default value | `'string'.default('guest')` |
| `.username(range?)` | Username validation | `'string!'.username('5-20')` |
| `.phone(country)` | Mobile phone number validation | `'string!'.phone('cn')` |
| `.phoneNumber(country)` | Mobile phone number validation (alias) | `'string!'.phoneNumber('cn')` |
| `.idCard(country)` | ID validation | `'string!'.idCard('cn')` |
| `.slug()` | URL alias validation | `'string!'.slug()` |
| `.password(strength)` | Password validation | `'string!'.password('strong')` |
| `.format(name)` | Format | `'string'.format('email')` |
| `.toSchema()` | Convert to Schema | `'string!'.toSchema()` |
| `.creditCard(type)` | Credit card validation | `'string!'.creditCard('visa')` |
| `.licensePlate(country)` | License plate validation | `'string!'.licensePlate('cn')` |
| `.postalCode(country)` | Postcode validation | `'string!'.postalCode('cn')` |
| `.passport(country)` | Passport validation | `'string!'.passport('cn')` |

---

## quick start

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  // By default, direct string chain calls can be made
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

The following examples are available by default after importing `schema-dsl`. If you don’t want to keep the `String.prototype` extension, you can call `uninstallStringExtensions()` first, and then rewrite each complex field into a `dsl('...')` package.

### 1. Regularity validation

```javascript
const schema = dsl({
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
const schema = dsl({
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
const schema = dsl({
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
const schema = dsl({
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
const { dsl, Validator } = require('schema-dsl');

const formSchema = dsl({
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
const { validate } = require('schema-dsl');
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
const { Locale } = require('schema-dsl');

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
const schema = dsl({
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
const schema = dsl({
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
const { Locale } = require('schema-dsl');

//Switch based on user language preference
function getSchema(locale) {
  Locale.setLocale(locale);

  return dsl({
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

## Default installation and uninstallation

### Default installation

The root entry installs the String extension by default, which is used to be compatible with v1.1.x direct string chain writing:

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  email: 'email!'.label('email address')
});
```

The extension is mounted to `String.prototype` with non-enumerable attributes, and detects external methods with the same name during installation; if it is found that the method is not installed by schema-dsl itself, it will refuse to overwrite it.

If your running environment has extended a method with the same name (such as `String.prototype.label`) before importing `schema-dsl`, the root entry will throw a conflict error during the import phase to avoid silently overwriting the external implementation. The solution is to first remove or rename the conflicting external extension, and then import `schema-dsl`; ordinary projects usually do not encounter this scenario.

### Manually disable

```javascript
const { uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();

// Only pure DSL can be used later
'email!'.pattern(/custom/) // ❌ Report error
```

### Re-enable or customize the installation

```javascript
const { installStringExtensions } = require('schema-dsl');

installStringExtensions();

// String extension recovery
'email!'.pattern(/custom/) // ✅ Normal
```

---

## best practices

### 1. Use pure DSL for simple fields

```javascript
const schema = dsl({
  name: 'string:1-50!',
  age: 'number:18-120',
  role: 'user|admin'
});
```

### 2. Use chain calls for complex fields

```javascript
const schema = dsl({
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

**80% of the fields in JavaScript use pure DSL, and 20% of the complex fields can be called directly through string chaining; in TypeScript, for type hints, complex fields are wrapped with `dsl()` first. **

---

## FAQ

### Q1: Will String expansion pollute the global situation?

**A**: The root `schema-dsl` entry extends `String.prototype` by default for v1.1.x compatibility. Side effects have been reduced to a minimum: extension methods are not enumerable, conflicts with the same name are detected before installation, and they can be uninstalled through `uninstallStringExtensions()`. For no import-time prototype mutation, import from `schema-dsl/pure`; when you want the side effect explicitly, import `schema-dsl/register-string` during application startup.

### Q2: How is the performance?

**A**: The performance overhead is minimal (<5%), and tests show that it is faster (fewer function calls).

### Q3: Is TypeScript supported?

**A**: Fully supported, via type definition file.

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

**Last updated**: 2026-06-17
