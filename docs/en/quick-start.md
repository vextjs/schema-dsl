# schema-dsl Quick Start

> **Reading time**: 5 minutes
> **Goal**: Quickly understand the core `schema-dsl` workflow

---

## Table of Contents

### Getting Started

- [Installation](#installation)
- [5-minute Quick Start](#5-minute-quick-start)
  - [1. Hello World in 30 seconds](#1-hello-world-in-30-seconds)
  - [2. DSL syntax cheat sheet in 1 minute](#2-dsl-syntax-cheat-sheet-in-1-minute)
  - [3. Chainable fields in 2 minutes](#3-chainable-fields-in-2-minutes)
  - [4. Complete example in 2 minutes](#4-complete-example-in-2-minutes)

### Advanced Features

- [Custom Validation](#custom-validation)
- [Database Export](#database-export)
- [Next Steps](#next-steps)

---

## Installation

```bash
npm install schema-dsl
```

> **Node.js requirement**: `>=18.0.0`
>
> The current TypeScript rewrite uses `Node.js >=18.0.0` as the only runtime baseline and no longer promises compatibility with older Node versions.

---

## 5-minute Quick Start

### 1. Hello World in 30 seconds

```javascript
const { dsl, validate } = require('schema-dsl');

// Define a schema
const schema = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

// Validate data with the convenience helper
const result = validate(schema, {
  name: 'John',
  email: 'john@example.com'
});

console.log(result.valid); // true
```

**Explanation**:

- `'string:1-50!'` means a required string with length 1 to 50.
- `'email!'` means a required email field.
- `!` marks a field as required.

---

### 2. DSL syntax cheat sheet in 1 minute

```javascript
// Basic types
'string'           // string
'number'           // number
'integer'          // integer
'boolean'          // boolean
'email'            // email
'url'              // URL
'date'             // date

// Constraints
'string:3-32'      // length 3-32
'string:100'       // max length 100, shorthand
'string:-100'      // max length 100, explicit form
'string:10-'       // min length 10, no maximum
'number:18-120'    // range 18-120

// Required
'string!'          // required string
'email!'           // required email

// Enum
'active|inactive|pending'    // one of three values

// Arrays
'array<string>'              // string array
'array:1-10<string>'         // 1 to 10 strings
'array<string:1-50>'         // array items with constraints
```

**Syntax rules**:

- `type:max` -> maximum value or length, shorthand
- `type:min-max` -> range
- `type:min-` -> minimum only
- `type:-max` -> maximum only

---

### 3. Chainable fields in 2 minutes

After importing `schema-dsl` in JavaScript, string literals can call `.label()` / `.pattern()` directly by default. If you do not want global String extensions, call `uninstallStringExtensions()` and wrap fields with `dsl()`. See [String Extensions](./string-extensions.md) for details.

```javascript
const schema = dsl({
  // Default: chain directly on DSL strings
  email: 'email!'
    .pattern(/custom/)
    .label('email address'),

  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      pattern: 'Only letters, numbers, and underscores are allowed'
    })
    .label('username'),

  // Simple fields can still use plain DSL
  age: 'number:18-120',
  role: 'user|admin'
});
```

**Available methods**:

- `.pattern(regex)` - regular expression validation
- `.label(text)` - field label
- `.messages(obj)` - custom messages
- `.description(text)` - description
- `.custom(fn)` - custom validator

---

### 4. Complete example in 2 minutes

```javascript
const { dsl, validate } = require('schema-dsl');

// Define a user registration schema
const registerSchema = dsl({
  // Username: regex validation
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .error({
      pattern: 'Only letters, numbers, and underscores are allowed'
    }),

  // Email: label
  email: dsl('email!').label('email address'),

  // Password: complex regex
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('password')
    .error({
      pattern: 'Must include uppercase letters, lowercase letters, and numbers'
    }),

  // Simple fields
  age: 'number:18-120',
  role: 'user|admin'
});

// Validate data
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user'
};

const result = validate(registerSchema, testData);

if (result.valid) {
  console.log('Validation passed!');
} else {
  console.log('Validation failed:', result.errors);
}
```

---

## Best Practices

### 1. Use plain DSL for simple fields

```javascript
const schema = dsl({
  name: 'string:1-50!',     // concise
  age: 'number:18-120',     // clear
  role: 'user|admin'        // direct
});
```

### 2. Use the `dsl()` chain API for complex fields

```javascript
const schema = dsl({
  email: dsl('email!')
    .pattern(/custom/)
    .messages({...})
    .label('email'),

  username: dsl('string:3-32!')
    .pattern(/^\w+$/)
    .custom(checkExists)
});
```

### 3. The 80/20 rule

**In JavaScript, use plain DSL for 80% of fields and direct string chaining for the more complex 20%. In TypeScript, wrap complex fields with `dsl()` first to get better type hints.**

---

## Common Scenarios

### Form validation

```javascript
const formSchema = dsl({
  email: dsl('email!').label('email address'),
  password: dsl('string:8-64!').label('password'),
  nickname: dsl('string:2-20').label('nickname'),
  bio: 'string:500',
  website: 'url',
  age: 'number:18-120',
  gender: 'male|female|other'
});
```

### Custom validation

> `.custom()` supports synchronous functions. If it returns a `Promise`, use `validateAsync()`. Synchronous `validate()` returns an explicit error when it sees a Promise-returning custom validator.

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      if (value === 'admin') {
        return 'Username already exists';
      }
    })
});
```

### Nested objects

```javascript
const schema = dsl({
  user: {
    profile: {
      name: dsl('string:1-50!').label('name'),
      avatar: dsl('url').label('avatar'),
      social: {
        twitter: dsl('url').pattern(/twitter\.com/),
        github: dsl('url').pattern(/github\.com/)
      }
    }
  }
});
```

---

## Next Steps

### Learn more

- [Complete DSL Syntax Guide](./dsl-syntax.md)
- [API Reference](./api-reference.md)
- [String Extensions](./string-extensions.md)

### Example code

- [Complete Quick Start example](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts)

Other topic examples are linked from the bottom of their own documents and use stable GitHub example links.

<a id="database-export"></a>

### Advanced features

- [Custom validators](./api-reference.md#customvalidator)
- [Conditional validation](./conditional-api.md)
- [Database schema export](./api-reference.md#exporters)

---

## Design Philosophy and Performance

### Why runtime parsing?

Schema-DSL uses **runtime DSL parsing** rather than compile-time construction, as libraries such as Zod do. This is an intentional design choice.

#### Runtime parsing advantages

1. **Fully dynamic** - validation rules can be loaded dynamically from config files or a database.

   ```javascript
   // Read rules from config
   const rules = await db.findOne({ entity: 'user' });
   const schema = dsl({
     username: `string:${rules.min}-${rules.max}!`
   });
   ```

2. **Multi-tenant support** - each tenant can use different validation rules.

   ```javascript
   // Tenant A: username 3-32 chars
   // Tenant B: username 5-50 chars
   function getTenantSchema(tenantId) {
     const rules = tenantConfig[tenantId];
     return dsl({
       username: `string:${rules.min}-${rules.max}!`
     });
   }
   ```

3. **Serializable** - DSL strings can be stored, transported, and shared.

   ```javascript
   // Store in a database
   await db.insert({
     formId: 'register',
     rules: { username: 'string:3-32!', email: 'email!' }
   });

   // Send through an API
   res.json({ validationRules: rules });

   // Share rules between frontend and backend
   ```

4. **Low-code foundation** - useful for visual form builders.

   ```javascript
   // Admin configures validation rules in the UI
   const formBuilder = {
     fields: [
       { name: 'username', validation: 'string:3-32!' }
     ]
   };
   ```

#### Performance trade-offs

S1 valid-data throughput is on par with Zod. S3 nested valid-data throughput is about 28% faster. Invalid-data fair comparison is about 89x faster:

| Library | Performance | Scenario |
|------|-----------|------|
| Ajv (raw) | 4.732M ops/s | underlying engine, no DSL layer |
| **Schema-DSL** | **1.301M ops/s** (S1 valid) | full feature set (DSL + i18n + coerce) |
| **Schema-DSL** | **1.205M ops/s** (S2 invalid, both without i18n) | fair comparison, both without i18n |
| Zod | 1.305M ops/s (S1 valid) / 13.49K (S2 invalid) | compile-time construction, exception-driven error path |
| Joi | 154K ops/s | feature rich |

**Conclusion**:

- In S3 nested valid-data scenarios, Schema-DSL is about **28% faster** than Zod.
- In simple S1 valid-data scenarios, it is essentially tied with Zod, with less than 1% difference.
- In invalid-data fair comparison, both without i18n, it is about **89x faster** than Zod.
- Built-in caching keeps hot paths from repeatedly parsing the DSL.

### When to use Schema-DSL

**Choose Schema-DSL when**:

- You need dynamic validation rules, such as config-driven or multi-tenant rules.
- You need database schema export.
- You want to prototype quickly.
- You are building a multilingual SaaS system.

**Consider another library when**:

- A TypeScript project needs strong static type inference -> **Zod**
- Performance is the only top priority -> **Ajv** or **Zod**
- Validation rules are fully static -> **Zod**

---

## FAQ

### Q: What is the difference between String extensions and plain DSL?

**A**:

- **Plain DSL**: best for simple fields, concise syntax.
- **`dsl()` chain API**: best for complex validation without relying on global prototype changes.
- **String extensions**: good for JavaScript projects that want direct string literal chaining. The root entry enables it by default.

```javascript
// Plain DSL, simple
name: 'string:1-50!'

// dsl() chain API, complex and recommended
email: dsl('email!')
  .pattern(/custom/)
  .messages({...})

// String extensions, available by default after importing schema-dsl
const { dsl } = require('schema-dsl');
const schemaWithStringExtension = dsl({
  email: 'email!'.pattern(/custom/).messages({...})
});
```

### Q: How do I enable or uninstall String extensions?

**A**:

```javascript
const { installStringExtensions, uninstallStringExtensions } = require('schema-dsl');
uninstallStringExtensions(); // actively disable
installStringExtensions();   // enable again
```

### Q: Does schema-dsl support TypeScript?

**A**: Yes. `schema-dsl` ships complete TypeScript type definitions.

---

## Congratulations

You now know the core `schema-dsl` workflow.

**Key takeaways**:

1. DSL syntax is concise and readable.
2. The `dsl()` chain API is powerful and flexible.
3. Use plain DSL for 80% of fields and chain APIs for the complex 20%.
4. JavaScript can use direct string chaining; TypeScript should wrap complex fields with `dsl()` first.

**Start using it**: `npm install schema-dsl`

---

## Corresponding Example File

**Example entry**: [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts)
**Description**: Covers the Hello World flow, String extensions, a user registration example, and the basic `validate()` plus `Validator.compile()` reuse path from the quick start. It can be run directly as a reference.

---

**Last updated**: 2026-06-10
