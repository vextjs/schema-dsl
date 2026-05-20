<div align="center">

# 🎯 schema-dsl

**Declare field rules with the simplest DSL — let one schema drive validation, derivation, export, and documentation.**

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Native-3178C6.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[Quick Start](#-quick-start) · [Documentation](https://vextjs.github.io/schema-dsl) · [Feature Overview](#-feature-overview) · [Examples](./examples)

```bash
npm install schema-dsl
```

</div>

---

## ⚡ TL;DR (30-second intro)

**What is schema-dsl?**

Write field rules like this:

```typescript
import { dsl, validate } from 'schema-dsl';

const userSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  role:     'admin|user|guest',
  contact:  'types:email|phone'
});

const result = validate(userSchema, req.body);
```

Then that **same set of rules** continues to power:

- ✅ **Sync / async validation** — `validate()` / `validateAsync()`
- ✅ **Schema derivation** — `pick / omit / partial` to tailor schemas per endpoint
- ✅ **Database schemas** — export directly to MongoDB / MySQL / PostgreSQL
- ✅ **Field documentation** — auto-generate Markdown
- ✅ **Unified error model** — `ValidationError` + `I18nError`
- ✅ **Internationalization** — 5 built-in locales (zh-CN / en-US / ja-JP / es-ES / fr-FR), switchable at runtime

**5-minute tutorial**: [Quick Start](https://vextjs.github.io/schema-dsl/quick-start) | **Full docs**: [Online Documentation](https://vextjs.github.io/schema-dsl)

---

## 🗺️ Documentation

**Getting started**:
- [Quick Start](https://vextjs.github.io/schema-dsl/quick-start) — up and running in 5 minutes
- [DSL Syntax Reference](#-dsl-syntax-reference) — syntax cheatsheet
- [FAQ](https://vextjs.github.io/schema-dsl/faq) — common questions

**Core features**:
- [Validation Guide](https://vextjs.github.io/schema-dsl/validation-guide) — all validation scenarios
- [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) — schema reuse
- [Conditional Validation API](https://vextjs.github.io/schema-dsl/conditional-api) — dsl.if / dsl.match
- [Async Validation & Framework Integration](https://vextjs.github.io/schema-dsl/validate-async) — Express / Koa / Fastify
- [Error Handling & i18n](https://vextjs.github.io/schema-dsl/error-handling) — error model

**Export & integration**:
- [Export Guide](https://vextjs.github.io/schema-dsl/export-guide) — MongoDB / MySQL / PostgreSQL
- [TypeScript Guide](https://vextjs.github.io/schema-dsl/typescript-guide) — type inference and usage
- [Plugin System](https://vextjs.github.io/schema-dsl/plugin-system) — custom extensions

**Full docs**: [Online Documentation](https://vextjs.github.io/schema-dsl) · [Feature Index](https://vextjs.github.io/schema-dsl/FEATURE-INDEX)

---

## ✨ Why schema-dsl?

### 🎯 Minimal DSL — 65% less code

<table>
<tr>
<td width="50%" valign="top">

**❌ Traditional approach** — verbose

```javascript
// Joi — requires 8 lines
const schema = Joi.object({
  username: Joi.string()
    .min(3).max(32).required(),
  email: Joi.string()
    .email().required(),
  age: Joi.number()
    .min(18).max(120)
});
```

</td>
<td width="50%" valign="top">

**✅ schema-dsl** — concise and clean

```typescript
// just 3 lines
const schema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'number:18-120'
});
```

</td>
</tr>
</table>

### 💪 Full-featured

| Feature | schema-dsl | Notes |
|---------|:----------:|-------|
| **Basic validation** | ✅ | string, number, boolean, date, email, url, phone… |
| **Advanced validation** | ✅ | regex, custom functions, conditional branches, nested objects, arrays… |
| **Cross-type union** | ✅ | `types:email\|phone` — one field accepts multiple types |
| **Error messages** | ✅ | auto-translated + custom messages + field labels |
| **i18n business errors** | ✅ | `I18nError` with numeric error codes |
| **Database export** | ✅ | MongoDB / MySQL / PostgreSQL schema generation |
| **Documentation generation** | ✅ | Markdown field docs auto-generated |
| **TypeScript** | ✅ | Written in native TypeScript with full type inference |
| **Plugin system** | ✅ | Custom types / formats / validators |
| **Schema reuse** | ✅ | pick / omit / partial / extend |

### 🎨 One schema, many uses (unique capability)

```typescript
import { dsl, exporters, SchemaUtils } from 'schema-dsl';

const userSchema = dsl({
  id:        'uuid!',
  username:  'string:3-32!',
  email:     'email!',
  password:  'string:8-64!',
  age:       'number:18-120',
  createdAt: 'string!'
});

// 📋 derive scenario-specific schemas
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);
const updateSchema = SchemaUtils.partial(SchemaUtils.pick(userSchema, ['username', 'email']));
const publicSchema = SchemaUtils.omit(userSchema, ['password']);

// 🗄️ export the same schema to any database
const mongoSchema = new exporters.MongoDBExporter().export(userSchema);
const mysqlDDL    = new exporters.MySQLExporter().export('users', userSchema);
const pgDDL       = new exporters.PostgreSQLExporter().export('users', userSchema);

// 📝 generate field documentation from the same schema
const markdown = exporters.MarkdownExporter.export(userSchema, { title: 'User Field Reference' });
```

---

## 📦 Installation

```bash
npm install schema-dsl
```

**Runtime requirement**: Node.js >= 18.0.0

---

## 🚀 Quick Start

### 1. Basic validation

```typescript
import { dsl, validate } from 'schema-dsl';

const userSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'number:18-120',
  role:     'admin|user|guest',
  tags:     'array<string>'
});

// ✅ validation passed
const result = validate(userSchema, {
  username: 'john_doe',
  email:    'john@example.com',
  age:      25,
  role:     'user',
  tags:     ['verified']
});

console.log(result.valid);   // true
console.log(result.data);    // validated data

// ❌ validation failed
const bad = validate(userSchema, { username: 'ab', email: 'not-email' });
console.log(bad.errors);
// [
//   { path: 'username', message: 'username must be at least 3 characters' },
//   { path: 'email',    message: 'email must be a valid email address' }
// ]
```

### 2. Async validation + Express integration

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

const createUserSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  password: 'string:8-32!'
});

app.post('/api/users', async (req, res, next) => {
  try {
    // throws ValidationError automatically on failure
    const validData = await validateAsync(createUserSchema, req.body);
    const user = await db.users.create(validData);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// global error handler
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ success: false, errors: error.errors });
  }
  next(error);
});
```

### 3. Schema reuse (create / update / public)

```typescript
import { dsl, SchemaUtils } from 'schema-dsl';

const userSchema = dsl({
  id:        'uuid!',
  username:  'string:3-32!',
  email:     'email!',
  password:  'string:8-64!',
  createdAt: 'string!'
});

// create endpoint: remove server-generated fields
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);

// update endpoint: pick editable fields, all optional
const updateSchema = SchemaUtils.partial(
  SchemaUtils.pick(userSchema, ['username', 'email'])
);

// public response: hide sensitive fields
const publicSchema = SchemaUtils.omit(userSchema, ['password']);
```

### 4. Database schema export

```typescript
import { dsl, exporters } from 'schema-dsl';

const productSchema = dsl({
  name:      'string:1-100!',
  price:     'number:>0!',
  stock:     'integer:0-!',
  category:  'string!',
  createdAt: 'datetime!'
});

// MongoDB $jsonSchema (for db.createCollection() document validation; not a Mongoose model schema)
const mongoSchema = new exporters.MongoDBExporter().export(productSchema);
/*
{
  $jsonSchema: {
    bsonType: 'object',
    properties: {
      name:      { bsonType: 'string', minLength: 1, maxLength: 100 },
      price:     { bsonType: 'double', minimum: 0 },
      stock:     { bsonType: 'int',    minimum: 0 },
      category:  { bsonType: 'string' },
      createdAt: { bsonType: 'string' }
    },
    required: ['name', 'price', 'stock', 'category', 'createdAt']
  }
}
*/

// MySQL DDL
const mysqlDDL = new exporters.MySQLExporter().export('products', productSchema);
/*
CREATE TABLE `products` (
  `name`      VARCHAR(100) NOT NULL,
  `price`     DECIMAL(10, 2) NOT NULL,
  `stock`     INT NOT NULL,
  `category`  VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
*/

// Markdown field documentation
const markdown = exporters.MarkdownExporter.export(productSchema, { title: 'Product Field Reference' });
```

---

## 🗒️ Feature Overview

### Common use cases

| Use case | API | Docs |
|----------|-----|------|
| API parameter validation | `validateAsync` + `ValidationError` | [Async Validation](https://vextjs.github.io/schema-dsl/validate-async) |
| Form / script validation | `validate()` | [Validation Guide](https://vextjs.github.io/schema-dsl/validation-guide) |
| Batch data validation | `SchemaUtils.validateBatch()` | [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) |
| create / update derivation | `pick / omit / partial` | [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) |
| Database table creation | `MongoDBExporter / MySQLExporter` | [Export Guide](https://vextjs.github.io/schema-dsl/export-guide) |
| Field documentation | `MarkdownExporter` | [Export Guide](https://vextjs.github.io/schema-dsl/export-guide) |
| Multilingual API errors | `I18nError` | [Error Handling](https://vextjs.github.io/schema-dsl/error-handling) |
| Conditional / dynamic rules | `dsl.if()` / `dsl.match()` | [Conditional API](https://vextjs.github.io/schema-dsl/conditional-api) |
| Custom type extensions | `PluginManager` | [Plugin System](https://vextjs.github.io/schema-dsl/plugin-system) |

---

## 📖 DSL Syntax Reference

### Basic types

```typescript
dsl({
  // string
  name:     'string!',         // required
  code:     'string:6',        // exact length 6
  bio:      'string:-500',     // max length 500
  username: 'string:3-32',     // length range 3–32

  // number
  age:   'number:18-120',      // range 18–120
  score: 'integer:0-100',      // integer 0–100
  price: 'number:>0',          // strictly greater than 0
  level: 'number:>=1',         // greater than or equal to 1

  // enum
  status: 'active|inactive|pending',  // string enum
  tier:   'enum:number:1|2|3',        // numeric enum

  // array
  tags:  'array<string>',             // string array
  items: 'array:1-10<number>',        // 1–10 numeric elements

  // boolean
  active: 'boolean!',

  // union type
  contact: 'types:email|phone!',      // email or phone, required
  price2:  'types:number:0-|string',  // number or string
})
```

### Built-in formats

```typescript
dsl({
  email:     'email!',          // email address
  website:   'url!',            // URL
  birthday:  'date!',           // YYYY-MM-DD
  createdAt: 'datetime!',       // ISO 8601
  userId:    'uuid!',           // UUID
  phone:     'phone:cn!',       // Chinese mobile number
  idCard:    'idCard:cn!',      // Chinese national ID
  slug:      'slug:3-100!',     // URL-friendly string
})
```

### Fluent chain API (recommended for TypeScript)

```typescript
import { dsl } from 'schema-dsl';

const schema = dsl({
  username: dsl('string:3-32!')
    .username()
    .label('username')
    .messages({ required: 'Username is required' }),

  email: dsl('email!').label('email address'),

  phone: dsl('string:11!')
    .pattern(/^1[3-9]\d{9}$/)
    .label('phone number'),
});
```

### Conditional validation

```typescript
// dsl.match — route to different rules based on a field value
const contactSchema = dsl({
  type:    'email|phone|wechat',
  contact: dsl.match('type', {
    email:  'email!',
    phone:  'string:11!',
    wechat: 'string:6-20!',
  })
});

// dsl.if — simple conditional branch
const orderSchema = dsl({
  isVip:    'boolean!',
  discount: dsl.if('isVip', 'number:10-50!', 'number:0-10')
});

// dsl.if chain assertion
dsl.if(d => !d.account)
  .message('Account not found')
  .and(d => d.account.balance < amount)
  .message('Insufficient balance')
  .assert(data);
```

---

## 🌍 Internationalization

```typescript
import { dsl, validate, Locale, I18nError } from 'schema-dsl';

// built-in locales: zh-CN / en-US / ja-JP / es-ES / fr-FR (auto-loaded, no configuration needed)
const result = validate(schema, data, { locale: 'en-US' });
// error messages automatically use the specified locale

// register a custom locale
Locale.addLocale('zh-CN', {
  'user.notFound':    'User not found',
  'user.forbidden':   { code: 40003, message: 'Access forbidden' },
});

// throw i18n business errors
I18nError.assert(user, 'user.notFound');                    // auto-throw when user is falsy
I18nError.throw('user.forbidden', {}, 403);                 // throw directly
I18nError.assert(ok, 'user.notFound', {}, 404, locale);     // specify locale at runtime

// errors carry a numeric code; frontend can branch on it
try {
  await api.getUser(id);
} catch (error) {
  switch (error.code) {
    case 40003: showForbiddenPage(); break;
  }
}
```

---

## 🔌 Plugin System

```typescript
import { PluginManager, Validator, dsl } from 'schema-dsl';

const pluginManager = new PluginManager();

// register a custom format plugin (must provide an install function)
pluginManager.register({
  name: 'extra-formats',
  install(core) {
    const validator = core as Validator;
    // register custom formats on the Validator instance via addFormat
    validator.addFormat('hex-color', {
      validate: (v: string) => /^#[0-9A-F]{6}$/i.test(v)
    });
    validator.addFormat('mac-address', {
      validate: (v: string) => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(v)
    });
  }
});

// create a Validator and install plugins
const validator = new Validator();
pluginManager.install(validator);

// use the custom formats in a schema
const schema = dsl({ color: 'hex-color!', mac: 'mac-address' });
const result = validator.validate(schema, { color: '#FF5733', mac: '00:1A:2B:3C:4D:5E' });
```

---

## 🔧 Core API Reference

| API | Purpose | Returns | Docs |
|-----|---------|---------|------|
| `dsl(schema)` | Create a schema | Schema object | [DSL Syntax](https://vextjs.github.io/schema-dsl/dsl-syntax) |
| `validate(schema, data)` | Synchronous validation | `{ valid, errors, data }` | [Validation Guide](https://vextjs.github.io/schema-dsl/validation-guide) |
| `validateAsync(schema, data)` | Asynchronous validation | Promise (throws on failure) | [Async Validation](https://vextjs.github.io/schema-dsl/validate-async) |
| `SchemaUtils.pick()` | Select fields | New schema | [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) |
| `SchemaUtils.omit()` | Exclude fields | New schema | [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) |
| `SchemaUtils.partial()` | Make all fields optional | New schema | [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils) |
| `dsl.if(condition)` | Conditional validation | ConditionalBuilder | [Conditional API](https://vextjs.github.io/schema-dsl/conditional-api) |
| `dsl.match(field, map)` | Branch validation | ConditionalBuilder | [Conditional API](https://vextjs.github.io/schema-dsl/conditional-api) |
| `I18nError.throw()` | Throw an i18n error | never | [Error Handling](https://vextjs.github.io/schema-dsl/error-handling) |
| `I18nError.assert()` | Assert then throw | void | [Error Handling](https://vextjs.github.io/schema-dsl/error-handling) |

---

## 📝 TypeScript Usage

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

// ✅ wrap strings with dsl() in TypeScript for full type inference
const userSchema = dsl({
  username: dsl('string:3-32!').label('username'),
  email:    dsl('email!').label('email'),
  age:      dsl('number:18-100').label('age')
});

try {
  const validData = await validateAsync(userSchema, payload);
  // validData has full type inference
} catch (error) {
  if (error instanceof ValidationError) {
    error.errors.forEach(e => console.log(`${e.path}: ${e.message}`));
  }
}
```

> **Note**: In TypeScript projects, wrap strings with `dsl('...')` to get type inference. In JavaScript projects you can pass strings directly.
> See the [TypeScript Guide](https://vextjs.github.io/schema-dsl/typescript-guide) for details.

---

## 🛠️ Development

```bash
npm run build      # compile TypeScript
npm run test       # run tests
npm run typecheck  # type check
```

Local documentation preview:

```bash
cd website
npm run dev
```

---

## 🤝 Contributing

```bash
git clone https://github.com/vextjs/schema-dsl.git
cd schema-dsl
npm install
npm test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 🔗 Links

### 📖 Core documentation
- [Quick Start](https://vextjs.github.io/schema-dsl/quick-start) — up and running in 5 minutes
- [DSL Syntax Guide](https://vextjs.github.io/schema-dsl/dsl-syntax) — complete syntax reference
- [Validation Guide](https://vextjs.github.io/schema-dsl/validation-guide) — advanced validation techniques
- [API Reference](https://vextjs.github.io/schema-dsl/api-reference) — complete API docs
- [TypeScript Guide](https://vextjs.github.io/schema-dsl/typescript-guide) — required reading for TS users
- [Best Practices](https://vextjs.github.io/schema-dsl/best-practices) — avoid common pitfalls
- [Troubleshooting](https://vextjs.github.io/schema-dsl/troubleshooting) — diagnosing issues

### 🎯 Feature documentation
- [SchemaUtils](https://vextjs.github.io/schema-dsl/schema-utils)
- [Conditional Validation API](https://vextjs.github.io/schema-dsl/conditional-api)
- [Async Validation](https://vextjs.github.io/schema-dsl/validate-async)
- [Error Handling & i18n](https://vextjs.github.io/schema-dsl/error-handling)
- [Union Types](https://vextjs.github.io/schema-dsl/union-types)
- [Enum Types](https://vextjs.github.io/schema-dsl/enum)

### 🗄️ Export & integration
- [Export Guide](https://vextjs.github.io/schema-dsl/export-guide)
- [MongoDB Exporter](https://vextjs.github.io/schema-dsl/mongodb-exporter)
- [MySQL Exporter](https://vextjs.github.io/schema-dsl/mysql-exporter)
- [PostgreSQL Exporter](https://vextjs.github.io/schema-dsl/postgresql-exporter)
- [Markdown Exporter](https://vextjs.github.io/schema-dsl/markdown-exporter)
- [⚠️ Export Limitations](https://vextjs.github.io/schema-dsl/export-limitations)

### 💻 Examples
- [quick-start.ts](./examples/docs/quick-start.ts) — basic usage and registration form
- [validate-async.ts](./examples/docs/validate-async.ts) — async validation and `ValidationError` handling
- [export-guide.ts](./examples/docs/export-guide.ts) — database export overview
- [error-handling.ts](./examples/docs/error-handling.ts) — field errors and business error handling
- [plugin-system.ts](./examples/docs/plugin-system.ts) — plugin system and hooks

### 📝 Changelog & contributing
- [Changelog](./CHANGELOG.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)

---

## 📄 License

[MIT](./LICENSE)

---

<div align="center">

If this project is useful to you, please consider giving it a Star ⭐

Made with ❤️ by the schema-dsl team

</div>




