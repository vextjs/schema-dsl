# validate method detailed documentation

## 📑 Table of Contents

### basic concepts
- [Overview](#overview) - Introduction to validate method
- [Method signature](#method-signature) - API definition

### Detailed explanation of parameters
- [Detailed explanation of parameters](#detailed-explanation-of-parameters-1)
  - [schema parameter](#schema-parameters)
  - [options object properties](#options-object-properties)
- [Detailed explanation of return value](#detailed-explanation-of-return-value)
  - [valid (Boolean)](#valid-boolean)
  - [errors (Array)](#errors-array)
  - [data (Any)](#data-any)

### Usage example
- [Basic example](#basic-example)
  - [Example 1: Validating simple objects](#example-1-validating-simple-objects)
  - [Example 2: Handling validation failures](#example-2-handling-validation-failures)
- [Advanced examples](#advanced-examples)
  - [Example 3: Validating string constraints](#example-3-validating-string-constraints)
  - [Example 4: Validating number ranges](#example-4-validate-number-range)
  - [Example 5: Validating email format](#example-5-verify-email-format)
  - [Example 6: Validating enum values](#example-6-validating-enumeration-values)
  - [Example 7: Validating nested objects](#example-7-validate-nested-objects)
  - [Example 8: Validating arrays](#example-8-validating-an-array)

### Advanced features
- [Use default values](#use-default-value)
- [Use compiled validation functions](#use-compiled-validation-functions)
- [Error handling best practices](#error-handling-best-practices)
  - [Performance optimization](#performance-optimization-suggestions)
- [FAQ](#faq)

### References
- [Related documents](#related-documents)
- [External references](#external-reference)

---

## Overview

`validate` is the core method of the Validator class, used to verify whether the data conforms to the JSON Schema definition. Based on high performance ajv validator implementation.

---

## method signature

```javascript
validator.validate(schema, data, options = {})
```

**Parameter Description**:
- `schema` (Object|Function): JSON Schema object or compiled validation function
- `data` (Any): Data to be validated
- `options` (Object): Validation options (optional)

**Return Value**:
```javascript
{
  valid: Boolean, // Is it valid?
  errors: Array, // Empty array on success, error list on failure
  data: Any // The current implementation will return this validation data (may be modified by useDefaults)
}
```

In the current implementation, `data` and `errors` will be returned together with the result: when successful, `errors` is an empty array, and when validation fails, `data` will still be retained for troubleshooting input.

---

## Detailed explanation of parameters

### schema parameters

JSON Schema object, supporting JSON Schema Draft 7 standard.

| Parameter type | Description | source |
|---------|------|------|
| Object | JSON Schema object | JSON Schema Standard ✅ |
| Function | Compiled validation function (generated via `compile()`) | ajv ✅ |

### options object properties

`validator.validate(schema, data, options)` Currently, the following parameters are actually read according to this call:

| Parameter | type | Required | default value | Description |
|------|------|------|--------|------|
| `format` | Boolean | no | `true` | Whether to format error messages |
| `locale` | String | no | — | Dynamically specify the language, such as `'zh-CN'`, `'en-US'`, `'ja-JP'` |
| `messages` | Object | no | — | Custom error message override |

### Related configuration entry

The following capabilities are **not part of** the sequential call parameters of `validator.validate(schema, data, options)`:

| ability | Correct entrance | Description |
|------|----------|------|
| `allErrors` / `useDefaults` / `coerceTypes` / `removeAdditional` / `cache` | `new Validator(options)` | These configurations are injected into the underlying AJV/caching layer when creating the `Validator` instance |
| `strict` | Schema itself | If you need to prohibit additional fields, please use `DslBuilder.strict()` or equivalent schema-level constraints at the schema level |
| `coerce` | Top-level `validate()` / `validateAsync()` convenience functions | By default, the top-level helper will perform convenient conversion of string → number/boolean value. Pass `{ coerce: false }` to turn it off. |

If you need to override error output in a single call, please use `format`, `locale`, `messages` in the above table; if you need to adjust the validator behavior, please configure it in the `Validator` construction phase first.

---

## Detailed explanation of return value

### valid (Boolean)

Indicates whether the data passes validation.

```javascript
result.valid === true // Validation passed
result.valid === false // Validation failed
```

### errors (Array)

Validation error list. The current implementation returns an empty array when successful and contains detailed error information when validation fails.

**Error object structure**:
```javascript
{
  path: String, // Error field path, such as 'user.email'
  message: String, // error description information
  keyword: String, // Triggered Schema keyword
  params: Object // Error related parameters
}
```

### data (Any)

Validated data. The current implementation will retain this validation data even when validation fails to facilitate input troubleshooting; if the Validator is configured with `useDefaults: true`, it may also reflect the default value after application in the Schema.

---

## Basic example

### Example 1: Validating simple objects

```javascript
const { Validator } = require('schema-dsl');

const validator = new Validator();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name']
};

const result = validator.validate(schema, {
  name: 'John',
  age: 25
});

console.log(result.valid);  // true
console.log(result.errors); // []
```

### Example 2: Handling validation failures

```javascript
const result = validator.validate(schema, {
  age: 'invalid'
});

console.log(result.valid);  // false
console.log(result.errors);
// The current implementation returns a formatted error list:
// [
// { path: 'name', message: 'name cannot be empty' },
// { path: 'age', message: 'age should be of type number' }
// ]
```

---

## Advanced examples

### Example 3: Validating string constraints

```javascript
const schema = {
  type: 'string',
  minLength: 3,
  maxLength: 32,
  pattern: '^[a-zA-Z0-9]+$'
};

//valid data
console.log(validator.validate(schema, 'john123').valid);  // true

// too short
console.log(validator.validate(schema, 'ab').valid);       // false

// Contains illegal characters
console.log(validator.validate(schema, 'john-123').valid); // false
```

### Example 4: Validate number range

```javascript
const schema = {
  type: 'number',
  minimum: 0,
  maximum: 100
};

console.log(validator.validate(schema, 50).valid);   // true
console.log(validator.validate(schema, -1).valid);   // false
console.log(validator.validate(schema, 101).valid);  // false
```

### Example 5: Verify email format

```javascript
const schema = {
  type: 'string',
  format: 'email'
};

console.log(validator.validate(schema, 'test@example.com').valid); // true
console.log(validator.validate(schema, 'invalid-email').valid);     // false
```

### Example 6: Validating enumeration values

```javascript
const schema = {
  type: 'string',
  enum: ['active', 'inactive', 'pending']
};

console.log(validator.validate(schema, 'active').valid);  // true
console.log(validator.validate(schema, 'invalid').valid); // false
```

### Example 7: Validate nested objects

```javascript
const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      required: ['name', 'email']
    }
  }
};

const data = {
  user: {
    name: 'John',
    email: 'john@example.com'
  }
};

const result = validator.validate(schema, data);
console.log(result.valid); // true
```

### Example 8: Validating an array

```javascript
const schema = {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
};

console.log(validator.validate(schema, ['a', 'b', 'c']).valid); // true
console.log(validator.validate(schema, []).valid);              // false (minItems)
console.log(validator.validate(schema, [1, 2, 3]).valid);       // false (type)
```

---

## Use default value

When the Validator is configured with `useDefaults: true`, the default value in the Schema is automatically applied.

```javascript
const validator = new Validator({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    status: { type: 'string', default: 'active' }
  }
};

const result = validator.validate(schema, { name: 'John' });

console.log(result.valid);        // true
console.log(result.data);         // { name: 'John', status: 'active' }
console.log(result.data.status); // 'active' (default value automatically applied)
```

---

## Use compiled validation functions

To improve performance, you can compile the schema first and then reuse the compiled validation functions.

```javascript
//Compile Schema
const validateFn = validator.compile(schema);

// Reuse (better performance)
const result1 = validator.validate(validateFn, data1);
const result2 = validator.validate(validateFn, data2);
const result3 = validator.validate(validateFn, data3);
```

---

## Error handling best practices

### Practice 1: Display user-friendly error messages

```javascript
const result = validator.validate(schema, data);

if (!result.valid) {
  //Format error message
  result.errors.forEach(err => {
    console.log(`Field "${err.path}": ${err.message}`);
  });

  // Or overall prompt
  console.log(`Validation failed with ${result.errors.length} errors`);
}
```

### Practice 2: Returning errors in API responses

```javascript
const result = validator.validate(schema, req.body);

if (!result.valid) {
  return res.status(400).json({
    success: false,
    message: 'Data validation failed',
    errors: result.errors.map(err => ({
      field: err.path,
      message: err.message
    }))
  });
}

// Validation passed, continue processing
processData(result.data);
```

### Practice 3: Throw an exception

```javascript
const result = validator.validate(schema, data);

if (!result.valid) {
  const error = new ValidationError(result.errors, data);
  throw error;
}
```

---

## Performance optimization suggestions

### Tip 1: Reuse Validator instances

```javascript
// ✅ Good: Reuse instances
const validator = new Validator();

app.post('/api/users', (req, res) => {
  const result = validator.validate(userSchema, req.body);
  // ...
});

// ❌ Bad: Create new instance every time
app.post('/api/users', (req, res) => {
  const validator = new Validator(); // Not recommended
  const result = validator.validate(userSchema, req.body);
  // ...
});
```

### Tip 2: Precompile Schema

```javascript
// Precompile when the application starts
const validateUser = validator.compile(userSchema);
const validateProduct = validator.compile(productSchema);

// Verify directly when using (faster)
app.post('/api/users', (req, res) => {
  const result = validator.validate(validateUser, req.body);
  // ...
});
```

### Tip 3: Use caching

```javascript
// Explicitly compile and reuse cache keys
const validateUser = validator.compile(schema, 'user-schema');

console.log(validateUser(data));
```

---

## FAQ

---

## Corresponding sample file

**Example entry**: [validate.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate.ts)
**Description**: Override the success/failure path, default type conversion, and behavior difference after turning off `coerce` at the top level.

### Q1: How to validate optional fields?

Fields not in the `required` array are automatically optional:

```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' } // age is optional
  },
  required: ['name'] // Only name is required
};
```

### Q2: How to allow additional fields?

JSON Schema allows additional fields by default. If you want to disable extra fields:

```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  additionalProperties: false // disable additional fields
};
```

### Q3: How to verify multiple types?

Use `anyOf` or `oneOf`:

```javascript
const schema = {
  type: 'object',
  properties: {
    value: {
      anyOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    }
  }
};
```

### Q4: How is the performance?

Based on ajv, the industry's fastest JSON Schema validator:
- Validation speed >15,000 ops/s
- Built-in compilation cache
- Support batch validation optimization

---

## Related documents

- [Validator class overview](./validator.md)
- [compile method](./compile.md) - Compile Schema to improve performance
- [validateBatch method](./validate-batch.md) - Batch validation
- [addKeyword method](./add-keyword.md) - Add custom validation
- [JSON Schema Basics](./json-schema-basics.md)

---

## external reference

- [JSON Schema official document](https://json-schema.org/)
- [ajv document](https://ajv.js.org/)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/) - Online testing tool

---


**Last updated**: 2025-12-24
