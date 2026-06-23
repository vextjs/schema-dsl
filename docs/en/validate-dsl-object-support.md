# validate() with DSL objects

`validate()` and `validateAsync()` can receive a DSL object directly. This is useful for small, one-off schemas where wrapping the object with `s()` first would not add much value.

For reusable schemas, build the schema once with `s(...)` and reuse it. For interoperability, standard JSON Schema is also supported.

---

## Three supported methods

### Method 1: Pass in a DSL object

```javascript
import { validate } from 'schema-dsl/pure';

// ✅ Pass in the DSL object directly without s() wrapping
const result = validate(
  { email: 'email!', age: 'number:18-120' }, // DSL object
  { email: 'test@example.com', age: 25 }
);

console.log(result.valid);  // true
```

**Advantages**:
- Simplest form for small schemas.
- No separate `s()` wrapping step is required.

DSL objects can also contain DslBuilder instances:

```javascript
import { s, validate } from 'schema-dsl/pure';

// ✅ Mixed use: DslBuilder + DSL string
const result = validate(
  {
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': 'Can only contain letters, numbers and underscores' }),
    email: 'email!', // Pure DSL string
    age: 'number:18-'
  },
  data
);
```

### Way 2: Use s() wrapper (recommended)

```javascript
import { s, validate } from 'schema-dsl/pure';

// ✅ Convert to JSON Schema first, then verify
const schema = s({
  email: 'email!',
  age: 'number:18-120'
});

const result = validate(schema, { email: 'test@example.com', age: 25 });
```

**Advantages**:
- Clearer when the schema is reused.
- Supports builder chains before validation.
- Avoids rebuilding the same schema for every request.

### Method 3: Pass in standard JSON Schema

```javascript
import { validate } from 'schema-dsl/pure';

// ✅ Pass in standard JSON Schema
const result = validate(
  {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 18, maximum: 120 }
    },
    required: ['email']
  },
  { email: 'test@example.com', age: 25 }
);
```

**Advantages**:
- Compatible with standard JSON Schema.
- Interoperates with other JSON Schema tools.

---

## Implementation principle

### Automatic detection logic

The top-level `validate()` / `validateAsync()` will first normalize the incoming schema:

```javascript
function validate(schema, data, options = {}) {
  const normalizedSchema = _normalizeSchemaInput(schema);
  const validator = getDefaultValidator();
  return validator.validate(normalizedSchema, data, options);
}
```

### Detection rules

Logic to determine whether it is a DSL object (`_isDslObject()`):

1. **Exclude non-objects**: Return false if they are not ordinary objects
2. **Exclude DslBuilder**: There is `toSchema()` method that returns false
3. **Exclude ConditionalBuilder**: Return false if `_isConditional` tag is present
4. **Exclusion Criteria JSON Schema**:
   - There is `type` field and the value is a standard type (string/number/object, etc.)
   - All values ​​of `properties` contain the `type` field
5. **Identify DSL objects**:
   - The attribute value contains a DSL string (e.g. `'email!'`, `'string:3-32'`)
   - Property value contains nested DSL object

---

## Why does it have to be schema before?

### background

In earlier implementations, the top-level `validate()` did not automatically convert DSL objects:

```javascript
// ❌ v1.1.6 and earlier versions will fail
const result = validate(
  { email: 'email!', age: 'number!' }, // treated as JSON Schema
  { email: 'test@example.com', age: 25 }
);
// Error: Schema compilation failed: unknown keyword: "email"
```

**Cause**: `validate()` treats the DSL object as a standard JSON Schema, and `"email!"` is not a valid JSON Schema keyword.

### Current plan

The current version has completed automatic detection and conversion logic:

1. **Detect DSL Objects**: Identify DSL strings in objects
2. **Automatic Conversion**: Converted to JSON Schema via internal DSL object normalization process
3. **Transparent processing**: users don’t need to care about internal conversions

---

## Usage suggestions

### Simple scenario: use DSL objects directly

Suitable for: scripts, prototype development, test code, one-time validation

```javascript
// ✅ Simple validation, directly transfer DSL object
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number:18-' },
    req.body
  );

  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  // Process data...
});
```

### Complex scenario: configure schema when starting the project (recommended)

Applicable to: production environments, high-concurrency services, and scenarios that require reuse

```javascript
// ✅ Best practice: define all schemas in separate files

// schemas/user.js - loaded when the project starts, converted once
import { s } from 'schema-dsl/pure';

export default {
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': 'Can only contain letters, numbers and underscores' }),
    email: 'email!',
    password: s('string!').password('strong'),
    age: 'number:18-120'
  }),

  login: s({
    username: 'string!',
    password: 'string!'
  }),

  updateProfile: s({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500'
  })
};

// routes/user.js - used directly in routing without conversion
import userSchemas from '../schemas/user.js';
import { validate } from 'schema-dsl/pure';

app.post('/api/register', (req, res) => {
  const result = validate(userSchemas.register, req.body); // ✅ Use directly
  // ...
});

app.post('/api/login', (req, res) => {
  const result = validate(userSchemas.login, req.body); // ✅ Use directly
  // ...
});

app.put('/api/user/profile', (req, res) => {
  const result = validate(userSchemas.updateProfile, req.body); // ✅ Use directly
  // ...
});
```

**Performance Advantages**:
- ✅ Avoid converting DSL objects on every request
- ✅ schema is only created once when the project is started
- ✅ Suitable for high concurrency scenarios

### Requires chained calls: mixed use of DslBuilder

Applicable to: Need to customize error messages, complex validation rules

```javascript
// ✅Need custom message
const schema = s({
  email: s('email!')
    .label('email address')
    .messages({ 'string.email': 'Please enter a valid email' }),

  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'string.pattern': 'Can only contain letters, numbers and underscores' })
});

const result = validate(schema, data);
```

---

## Comparison summary

| Way | Simplicity | flexibility | Reusability | Applicable scenarios |
|------|-------|-------|-------|---------|
| DSL object | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | Simple validation, one-time use |
| s() package | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Complex validation, need to be reused |
| JSON Schema | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Interoperate with other tools |

---

## Things to note

### 1. Performance considerations

The DSL object is converted on each `validate()` call, if high performance is required:

```javascript
// ❌ Not recommended: convert every request
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number!' }, // Convert every time
    req.body
  );
});

// ✅ Recommendation: Convert in advance and reuse schema
const userSchema = s({ email: 'email!', age: 'number!' });

app.post('/api/user', (req, res) => {
  const result = validate(userSchema, req.body); // Use directly
});
```

### 2. Type confusion

Ensure that DSL objects are not mistakenly recognized as JSON Schema:

```javascript
// ✅ Explicit DSL object
{ email: 'email!', age: 'number!' } // Automatic recognition

// ⚠️ Potentially confusing
{
  type: 'object', // There is a type field
  email: 'email!' // But there is also a DSL string
}
// Will be recognized as JSON Schema (type has high priority)
```

### 3. Nested objects

Nested DSL objects are handled correctly:

```javascript
// ✅ Support nesting
const result = validate(
  {
    user: {
      profile: {
        name: 'string!',
        age: 'number!'
      }
    }
  },
  data
);
```

---

## Complete example

```javascript
import { s, validate, validateAsync } from 'schema-dsl/pure';

// Example 1: Synchronous validation
const result = validate(
  {
    email: 'email!',
    password: s('string!').password('strong'),
    age: 'number:18-120',
    username: 'string:3-32!'
  },
  {
    email: 'test@example.com',
    password: 'MyP@ssw0rd!',
    age: 25,
    username: 'john_doe'
  }
);

if (result.valid) {
  console.log('Validation passed');
} else {
  console.log('Validation failed:', result.errors);
}

//Example 2: Asynchronous validation
(async () => {
  try {
    const data = await validateAsync(
      { email: 'email!', age: 'number!' },
      { email: 'test@example.com', age: 25 }
    );
    console.log('Validation passed:', data);
  } catch (error) {
    console.error('Validation failed:', error.errors);
  }
})();
```

---

## Summarize

**Q: Why does it have to be schema? **

**A: No need now! **

- ✅The current version supports passing in DSL objects directly
- ✅ Automatically detect and convert, no manual wrapping required
- ✅ Fully backward compatible and does not affect original functions
- ✅ Supports JSON Schema, DslBuilder, and DSL objects at the same time

**Recommended use**:
- Simple scenario: use DSL objects directly
- Complex scenarios: Use `s()` for conversion first to facilitate reuse and expansion.

---

## FAQ

### Q1: Can chained calls be used in DSL objects?

**A: Yes! ** Supports mixing DslBuilder instances and DSL strings:

```javascript
const result = validate(
  {
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': 'Can only contain letters, numbers and underscores' }),
    email: 'email!', // Pure DSL string
    age: 'number:18-'
  },
  data
);
```

Also supported in nested objects:

```javascript
const result = validate(
  {
    user: {
      name: s('string:3-32!').messages({ 'string.min': 'The name is too short' }),
      email: 'email!'
    }
  },
  data
);
```

### Q2: What will be the impact of using objects directly?

**Performance Impact**:

Each time `validate()` is called, the DSL object is converted to JSON Schema:

```javascript
// ❌ Poor performance: conversion is repeated on every request
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number!' }, // ❌ DSL → JSON Schema conversion will be performed on every request
    req.body
  );
});

// ✅ Optimum performance: convert once when starting the project and reuse the schema
const userSchema = s({ email: 'email!', age: 'number!' }); // ✅ Convert once at startup

app.post('/api/user', (req, res) => {
  const result = validate(userSchema, req.body); // ✅ Use it directly without conversion
});
```

> ℹ️ The specific time consumption depends on machine performance, Node version, schema complexity and hit rate; what is emphasized here is the relative conclusion that "pre-conversion and then reuse are usually significantly faster than re-conversion for each request", rather than a fixed number of seconds.

**Performance difference**: ~3-5% (for simple schema)

**Cache and memory boundary**:

- A stable raw DSL object shape is normally not a memory leak. The object is normalized again, but the validator can still reuse the compilation cache for the same resulting schema structure.
- A request path that produces unbounded unique schema structures can keep missing the cache. schema-dsl's managed cache is bounded, but each miss still pays conversion and AJV compilation cost.
- Do not create `new Validator()` for every normal request. If the instance is not retained it usually will not leak permanently, but it resets AJV and the per-instance cache, increasing allocation and GC pressure.

**✅ Your understanding is completely correct! **

**Best Practice**: Configure all schemas at project startup

```javascript
// ✅ Recommended: Define all schemas in separate files (schemas/user.js)
import { s } from 'schema-dsl/pure';

// Convert once when the project starts and reuse directly later.
const userSchemas = {
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': 'Can only contain letters, numbers and underscores' }),
    email: 'email!',
    password: s('string!').password('strong'),
    age: 'number:18-120'
  }),

  login: s({
    username: 'string!',
    password: 'string!'
  }),

  updateProfile: s({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500'
  })
};

export default userSchemas;

// Used in routing (routes/user.js)
import userSchemas from '../schemas/user.js';

app.post('/api/register', (req, res) => {
  const result = validate(userSchemas.register, req.body); // ✅ Use directly
  // ...
});

app.post('/api/login', (req, res) => {
  const result = validate(userSchemas.login, req.body); // ✅ Use directly
  // ...
});
```

**Scenario Suggestions**:

| scene | Recommended method | reason |
|------|---------|------|
| **Production API** | ✅ Configure schema when starting the project | Avoid conversion for every request and optimize performance |
| **High concurrency service** | ✅ Configure schema when starting the project | 3-5% performance loss will be magnified |
| **Single shot script** | ✅ Use DSL objects directly | Only executed once, performance impact is negligible |
| **Prototype Development** | ✅ Use DSL objects directly | Iterate quickly without worrying about performance |
| **Test code** | ✅ Use DSL objects directly | Simple, clear and easy to maintain |

### Q3: Why is it still recommended to use `s()` to convert complex scenes first?

**Historical reasons**:

1. **Clear Separation of Duties** (Design Philosophy)
   ```javascript
   // Conversion stage: DSL → JSON Schema
   const schema = s({ email: 'email!', age: 'number!' });

   // Validation phase: JSON Schema + data → result
   const result = validate(schema, data);
   ```
This design makes the responsibilities of each step clearer.

2. **Avoid abuse of implicit conversions in high-frequency paths** (Least Surprise Principle)
   ```javascript
   //Whatever the user passes in is what
   validate(jsonSchema, data);  // JSON Schema
   validate(dslBuilder, data);  // DslBuilder

    // ⚠️ Although implicit conversion is currently supported, it is still recommended to convert in advance and then reuse in high-frequency scenarios.
    validate({ email: 'email!' }, data);
   ```

3. **Type Safety Considerations** (TypeScript)
   ```typescript
   // Explicit type definition
   function validate(
     schema: JSONSchema | DslBuilder, // explicit type
     data: any
   ): ValidationResult;

   // Type inference becomes complicated if arbitrary objects are supported
   function validate(
     schema: JSONSchema | DslBuilder | Record<string, any>, // too broad
     data: any
   ): ValidationResult;
   ```

4. **Performance Considerations** (Avoid repeated conversions)
   ```javascript
   // Prevent users from inadvertently writing code with poor performance
   for (let i = 0; i < 10000; i++) {
     validate({ email: 'email!' }, data); // Convert every time
   }
   ```

**Why does the current version need to complete this ability? **

1. **User Feedback**: Many users want a simpler API
2. **Smart Detection**: Accurately distinguish between DSL objects and JSON Schema via `_isDslObject()`
3. **Acceptable performance**: conversion overhead is small (~3-5%)
4. **Backwards Compatible**: No impact on existing code
5. **Using experience first**: Simplify the use of common scenarios

**Design Tradeoffs**:

| design plan | advantage | shortcoming |
|---------|------|------|
| **Explicit Conversion** | Clear responsibilities, type safety, optimal performance | The code is slightly longer |
| **Automatic conversion** (current top-level convenience function) | Simple and intuitive, low learning cost | There is additional conversion overhead in the high-frequency path |

**Final Choice**: Both are supported, allowing users to choose freely!

```javascript
// ✅ Simple scenario: use DSL objects directly
validate({ email: 'email!' }, data);

// ✅ Complex scenarios: explicit conversion
const schema = s({ email: 'email!' });
validate(schema, data);
```

---

## Corresponding sample file

**Example entry**: [validate-dsl-object-support.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate-dsl-object-support.ts)
**DESCRIPTION**: Overrides passing in DSL objects directly, mixing `DslBuilder` with DSL strings, `validateAsync<T>()` typed returns, and the true support boundaries for top-level `validate()` / `validateAsync()`.
