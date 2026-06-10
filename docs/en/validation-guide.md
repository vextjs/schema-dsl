# Data Validation Best Practices Guide

> **Purpose**: Complete guide to using data validation
> **Reading time**: 15 minutes

---

## 📑 Table of Contents

- [Quick Start](#quick-start)
- [DSL syntax quick check](#dsl-syntax-quick-check)
- [Authentication Mode](#authentication-mode)
- [Error handling](#error-handling)
- [Performance optimization](#performance-optimization)
- [Common scenarios](#common-scenarios)
- [Best Practice](#best-practices)

---

## Quick Start

### Basic validation process

```javascript
const { dsl, validate } = require('schema-dsl');

// 1. Define Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 2. Verify data
const result = validate(schema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

// 3. Process the results
if (result.valid) {
  console.log('Validation passed', result.data);
} else {
  console.log('Validation failed', result.errors);
}
```

---

## DSL syntax quick check

### basic type

| DSL | Description |
|-----|------|
| `'string'` | string |
| `'number'` | number |
| `'integer'` | integer |
| `'boolean'` | Boolean value |
| `'object'` | object |
| `'array'` | array |

### format type

| DSL | Description |
|-----|------|
| `'email'` | Email format |
| `'url'` | URL format |
| `'uuid'` | UUID format |
| `'date'` | date format |
| `'datetime'` | Date time format |
| `'time'` | time format |
| `'ipv4'` | IPv4 address |
| `'ipv6'` | IPv6 address |

### constraint syntax

| DSL | Description |
|-----|------|
| `'string:10'` | Maximum length 10 |
| `'string:3-32'` | Length 3-32 |
| `'string:3-'` | Minimum length 3 |
| `'number:18-120'` | Value range 18-120 |
| `'array:1-10'` | Array length 1-10 |

### special mark

| DSL | Description |
|-----|------|
| `'string!'` | Required string |
| `'email!'` | Required email |
| `'a\|b\|c'` | enumeration value |
| `'array<string>'` | string array |

---

## Authentication mode

### 1. Convenient function validation (recommended)

The simplest way to verify, use the built-in singleton Validator:

```javascript
const { dsl, validate } = require('schema-dsl');

const result = validate(schema, data);
```

### 2. Validator instance validation (advanced)

Use when custom configuration (such as type conversion, custom keywords) is needed:

```javascript
const { dsl, Validator } = require('schema-dsl');

//Create a custom configured Validator
const validator = new Validator({
  allErrors: true, // Return all errors
  useDefaults: true, // use default values
  coerceTypes: true // ✨ Enable type conversion
});

const result = validator.validate(schema, data);
```

> **Note**: `new Validator()` will create a new Ajv instance, which has a certain initialization overhead. It is recommended to create and reuse when the application starts to avoid creating it in every request.

### 3. Precompilation validation (high performance)

Use when validating the same Schema frequently:

```javascript
const validator = new Validator();

// Precompile Schema
const validateUser = validator.compile(userSchema);

//Multiple verifications (no need to recompile)
const result1 = validateUser(data1);
const result2 = validateUser(data2);
const result3 = validateUser(data3);
```

### 4. Batch validation

Use when verifying multiple pieces of data:

```javascript
const { Validator } = require('schema-dsl');
const validator = new Validator();

const dataList = [
  { username: 'user1', email: 'user1@example.com' },
  { username: 'user2', email: 'invalid' },
  { username: 'u', email: 'user3@example.com' }
];

const results = validator.validateBatch(schema, dataList);
// [
//   { valid: true, data: {...}, errors: [] },
//   { valid: false, data: {...}, errors: [...] },
//   { valid: false, data: {...}, errors: [...] }
// ]
```

---

## Error handling

### error object structure

```javascript
{
  message: 'Username cannot be less than 3 characters in length',
  path: '/username',
  keyword: 'minLength',
  params: { limit: 3 }
}
```

### Custom error message

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .label('username')
    .messages({
      'min': '{{#label}} is too short, at least {{#limit}} characters',
      'max': '{{#label}} is too long, at most {{#limit}} characters',
      'required': 'Please enter {{#label}}'
    })
});
```

### Multilingual error messages

```javascript
const { Locale, Validator } = require('schema-dsl');

//Add language pack
Locale.addLocale('zh-CN', {
  'required': '{{#label}} cannot be empty',
  'min': '{{#label}} cannot be less than {{#limit}}',
  'email': 'Please enter a valid {{#label}}'
});

//Specify language when validating
const validator = new Validator();
const result = validator.validate(schema, data, { locale: 'zh-CN' });
```

### Error formatting

```javascript
function formatErrors(errors) {
  return errors.map(err => {
    const field = err.path.replace(/^\//, '').replace(/\//g, '.');
    return `[${field}] ${err.message}`;
  }).join('\n');
}

if (!result.valid) {
  console.log(formatErrors(result.errors));
  // [username] The username cannot be less than 3 characters in length
  // [email] Please enter a valid email address
}
```

---

## Performance optimization

### 1. Use precompilation

```javascript
// ❌ Compile every time (slow)
function validateUser(data) {
  return validate(userSchema, data);
}

// ✅ Precompile once and use many times (fast)
const validator = new Validator();
const validateUser = validator.compile(userSchema);
```

### 2. Caching Schema

```javascript
// ❌ Create Schema every time
function getSchema() {
  return dsl({
    username: 'string:3-32!',
    email: 'email!'
  });
}

// ✅ Cache Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

### 3. Use allErrors appropriately

```javascript
// Only the first error is needed
const validator = new Validator({ allErrors: false });

// When all errors are required (default)
const validator = new Validator({ allErrors: true });
```

### 4. Monitor performance

```javascript
console.time('schema-dsl.validate');
const result = validate(schema, data);
console.timeEnd('schema-dsl.validate');
```

---

## Common scenarios

### User registration form

```javascript
const registerSchema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .messages({
      'pattern': '{{#label}} can only contain letters, numbers and underscores'
    }),

  email: 'email!'
    .label('email address'),

  password: 'string:8-64!'
    .password('strong')
    .label('password'),

  age: 'number:18-120'
    .label('age'),

  gender: 'male|female|other',

  terms: 'boolean!'
    .label('Terms of Service')
    .messages({
      'required': 'Please agree{{#label}}'
    })
});
```

### API request validation

```javascript
const createOrderSchema = dsl({
  userId: 'string!',
  items: 'array!1-100',
  shippingAddress: {
    street: 'string:5-200!',
    city: 'string:2-100!',
    zipCode: 'string:5-10!',
    country: 'string:2!'
  },
  paymentMethod: 'credit_card|paypal|bank_transfer',
  notes: 'string:500'
});

// Express middleware
function validateRequest(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);
    if (!result.valid) {
      return res.status(400).json({ errors: result.errors });
    }
    req.validatedData = result.data;
    next();
  };
}

app.post('/orders', validateRequest(createOrderSchema), createOrder);
```

### Profile validation

```javascript
const configSchema = dsl({
  server: {
    host: 'string!',
    port: 'integer:1-65535!',
    ssl: 'boolean'
  },
  database: {
    url: 'url!',
    poolSize: 'integer:1-100',
    timeout: 'integer:1000-60000'
  },
  logging: {
    level: 'debug|info|warn|error',
    format: 'json|text'
  }
});

function loadConfig(configPath) {
  const config = require(configPath);
  const result = validate(configSchema, config);

  if (!result.valid) {
    throw new Error(`Configuration file error:\n${formatErrors(result.errors)}`);
  }

  return result.data;
}
```

---

## best practices

### 1. Use label to improve error message quality

```javascript
// ❌ Default error message
email: 'email!'
// Error: "email is required"

// ✅ Use label
email: 'email!'.label('email address')
// Error: "Email address cannot be empty"
```

### 2. Centrally manage Schema

```javascript
// schemas/index.js
const { dsl } = require('schema-dsl');

exports.userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

exports.orderSchema = dsl({
  userId: 'string!',
  items: 'array!1-100'
});
```

### 3. Use SchemaUtils to reuse fields

```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

//Create reusable fields
const emailField = SchemaUtils.reusable(() =>
  dsl('email!').label('email address')
);

//Reuse in multiple Schema
const loginSchema = dsl({ email: emailField() });
const registerSchema = dsl({ email: emailField(), name: 'string!' });
```

### 4. Layered validation

```javascript
//Basic validation (fast)
const quickSchema = dsl({
  username: 'string!',
  email: 'string!'
});

// Complete validation (detailed)
const fullSchema = dsl({
  username: 'string:3-32!'.pattern(/^[a-z]+$/),
  email: 'email!'
});

// Quick validation first, then complete validation
async function validateWithFallback(data) {
  const quick = validate(quickSchema, data);
  if (!quick.valid) return quick;

  const full = validate(fullSchema, data);
  if (!full.valid) return full;

  if (await checkEmailUnique(data.email)) {
    return {
      valid: false,
      errors: [{ field: 'email', keyword: 'business', message: 'Email has been occupied' }]
    };
  }

  return full;
}
```

---

## Corresponding sample file

**Example entry**: [validation-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validation-guide.ts)
**Description**: Covers the recommended validation process: defining reusable schema, formatting errors, precompilation reuse, and batch validation.

### 5. Test validation logic

```javascript
describe('User Schema', () => {
  it('A valid user should be validated', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.true;
  });

  it('Short usernames should be rejected', () => {
    const result = validate(userSchema, {
      username: 'ab',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.false;
    expect(result.errors[0].keyword).to.equal('minLength');
  });
});
```

---

## Related documents

- [Complete Guide to DSL Syntax](dsl-syntax.md)
- [Detailed explanation of validate method](validate.md)
- [Error Handling Guide](error-handling.md)
- [Multi-language support](dynamic-locale.md)
- [String extension](string-extensions.md)
