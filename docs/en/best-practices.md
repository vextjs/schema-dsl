# schema-dsl best practices

> **Purpose**: Help you write high-quality, high-performance Schema code
> **Update**: 2026-05-08

---

## 📑 Table of Contents

- [Schema design principles](#schema-design-principles)
- [Performance optimization](#performance-optimization)
- [Safety considerations](#security-considerations)
- [Error handling](#error-handling)
- [Code Organization](#code-organization)
- [Production environment suggestions](#production-environment-recommendations)

---

## Schema design principles

### 1. Use pure DSL for simple fields

**recommend**:
```javascript
const schema = dsl({
  username: 'string:3-32!',
  age: 'number:18-120',
  email: 'email!',
  role: 'admin|user|guest'
});
```

**Not recommended** (overly complex):
```javascript
const schema = dsl({
  username: dsl('string').min(3).max(32).required(),
  // Too verbose!
});
```

**Principle**: If it can be expressed using DSL strings, do not use chained calls.

---

### 2. Chain calls for complex validation

**Scenarios suitable for chain calls**:
- Regular validation is required
- Need custom error message
- Requires custom validator
- label required

**Example**:
```javascript
const schema = dsl({
  // Simple fields: pure DSL
  age: 'number:18-120',

  // Complex fields: chain calls
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .messages({
      'pattern': 'can only contain letters, numbers and underscores',
      'min': 'At least 3 characters',
      'max': 'Maximum 32 characters'
    }),

  email: 'email!'
    .custom((value) => {
      if (value.endsWith('@blocked.example')) return 'This email domain name is not allowed to be registered';
    })
    .label('email address')
});
```

---

### 3. Use a default validator

schema-dsl provides commonly used preset validators, available out of the box:

```javascript
const schema = dsl({
  // ✅ Use the default validator (recommended)
  username: dsl('string!').username(), // Automatically set 3-32 length + regular
  password: dsl('string!').password('strong'), // Strong password validation
  phone: dsl('string!').phone('cn'), // China mobile phone number

  // ❌ Manual implementation (not recommended)
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
});
```

**Available Presets**:
- `username(preset?)` - ​​Username validation
- `password(strength?)` - ​​Password strength validation
- `phone(country?)` - ​​Mobile phone number validation
- `slug()` - ​​URL slug validation

---

### 4. Avoid too deep nesting

**Not recommended** (nested too deeply):
```javascript
const schema = dsl({
  user: {
    profile: {
      personal: {
        address: {
          detail: {
            street: 'string' // Nested 5 levels
          }
        }
      }
    }
  }
});
```

**Recommended** (Split or Flatten):
```javascript
// Option 1: Split into multiple Schema
const addressSchema = dsl({
  street: 'string!',
  city: 'string!',
  zipCode: 'string'
});

const userSchema = dsl({
  name: 'string!',
  email: 'email!',
  address: addressSchema
});

// Option 2: Flatten
const schema = dsl({
  'user_name': 'string!',
  'user_email': 'email!',
  'address_street': 'string!',
  'address_city': 'string!'
});
```

**Principle**: It is recommended that the nesting depth should not exceed 3-4 levels.

---

## Performance optimization

### 1. Precompile Schema

**Not recommended** (compile every time):
```javascript
app.post('/api/user', (req, res) => {
  const schema = dsl({ username: 'string!' });
  const result = validate(schema, req.body); // Compile every time
});
```

**Recommended** (pre-compiled):
```javascript
// Compile once when the application starts
const validator = new Validator();
const userSchema = dsl({ username: 'string!' });
const validateUser = validator.compile(userSchema);

app.post('/api/user', (req, res) => {
  const result = validateUser(req.body); // Use directly
});
```

**Benefits**: Reusing compiled results can significantly reduce repeated compilation costs, especially suitable for hotspot routing and high-frequency validation paths.

---

### 2. Enable caching

```javascript
const validator = new Validator({
  cache: true // ✅ Abbreviation: enable default compilation cache configuration
});

// When finer granularity is required, use object configuration
const tunedValidator = new Validator({
  cache: {
    enabled: true,
    maxSize: 500,
    ttl: 60 * 60 * 1000
  }
});

// Or use a global singleton (caching is enabled by default)
const { validate } = require('schema-dsl');
validate(schema, data); // automatic caching
```

---

### 3. Batch validation

**Not recommended** (loop validation):
```javascript
const errors = [];
records.forEach(record => {
  const result = validate(schema, record);
  if (!result.valid) {
    errors.push(result.errors);
  }
});
```

**Recommended** (batch validation):
```javascript
const { SchemaUtils, Validator } = require('schema-dsl');

const validator = new Validator();
const result = SchemaUtils.validateBatch(schema, records, validator.getAjv());
// When you have reused the underlying Ajv instance of Validator, this path is suitable for batch validation
```

> ℹ️ If you really want to directly pass in the Ajv instance you created, please first ensure that it has registered the format and keywords that match the schema generated by schema-dsl; for most projects, it is safer to reuse `validator.getAjv()` directly.

---

### 4. Optimize regular expressions

**Not recommended** (may cause ReDoS):
```javascript
// Dangerous regex: catastrophic backtracking
.pattern(/^(a+)+$/)
.pattern(/^(a*)*$/)
.pattern(/^(a|a)*$/)
```

**Recommended** (safe and efficient):
```javascript
// Simple and clear regular rules
.pattern(/^[a-zA-Z0-9_]+$/)
.pattern(/^[a-z]{3,10}$/)
```

**Tool**: Use [safe-regex2](https://github.com/fastify/safe-regex2) to detect dangerous regexes.

---

### 5. Avoid creating Schemas in loops

**Not recommended**:
```javascript
records.forEach(record => {
  const schema = dsl({ name: 'string!' }); // Create every time
  validate(schema, record);
});
```

**recommend**:
```javascript
const schema = dsl({ name: 'string!' }); // Create once
records.forEach(record => {
  validate(schema, record); //reuse
});
```

---

## security considerations

### 1. Regular rules to limit user input

**Danger**:
```javascript
// ❌ User-controlled regular expression
app.post('/api/validate', (req, res) => {
  const pattern = req.body.pattern; // User input
  const schema = dsl('string').pattern(new RegExp(pattern)); // Danger!
});
```

**Cause**: Users may enter malicious regular expressions to cause ReDoS attacks.

**SAFE PRACTICE**:
```javascript
// ✅ Use predefined regular expressions
const ALLOWED_PATTERNS = {
  username: /^[a-zA-Z0-9_]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

app.post('/api/validate', (req, res) => {
  const patternName = req.body.pattern;
  const pattern = ALLOWED_PATTERNS[patternName];
  if (!pattern) {
    return res.status(400).json({ error: 'Invalid pattern' });
  }
  const schema = dsl('string').pattern(pattern);
});
```

---

### 2. Clean up error messages

Do not expose sensitive information in the production environment:

```javascript
// development environment
if (process.env.NODE_ENV === 'development') {
  return res.status(400).json({
    valid: false,
    errors: result.errors // Detailed errors
  });
}

// production environment
return res.status(400).json({
  valid: false,
  message: 'Input data validation failed' // Simplified message
});
```

---

### 3. Limit Schema complexity

```javascript
const MAX_SCHEMA_SIZE = 10000;

if (JSON.stringify(schema).length > MAX_SCHEMA_SIZE) {
  throw new Error('Schema is too large, it is recommended to split');
}

// Check before validate
const depthCheck = DslBuilder.validateNestingDepth(schema, 10);
if (!depthCheck.valid) {
  throw new Error(depthCheck.message);
}
```

---

### 4. Prevent prototype contamination

```javascript
// Avoid prototype pollution when validating data
const validator = new Validator({
  removeAdditional: true, // Remove additional attributes
  useDefaults: false // Do not automatically fill in default values ​​(if not needed)
});
```

---

## Error handling

### 1. Unify error format

**Recommended error handling middleware**:
```javascript
// Express middleware
function validateMiddleware(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);

    if (!result.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Request data validation failed',
        errors: result.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    next();
  };
}

// use
app.post('/api/user',
  validateMiddleware(userSchema),
  userController.create
);
```

---

### 2. Friendly error messages

**Use labels and custom messages**:
```javascript
const schema = dsl({
  username: 'string:3-32!'
    .label('username')
    .messages({
      'required': '{{#label}} cannot be empty',
      'min': '{{#label}} requires at least {{#limit}} characters',
      'max': '{{#label}} is at most {{#limit}} characters',
      'pattern': '{{#label}} format is incorrect'
    }),

  email: 'email!'
    .label('email address')
    .messages({
      'required': 'Please fill in {{#label}}',
      'format': '{{#label}} format is incorrect'
    })
});
```

**Effect**:
```text
❌ Username cannot be empty
❌ Username must be at least 3 characters
✅ Clear and user-friendly
```

---

### 3. Handle external asynchronous validation errors

> `.custom()` supports synchronous functions; when asynchronous checks such as database, RPC, HTTP, etc. are involved, `Promise` can be returned and executed through `validateAsync()`, or it can be executed separately in the business layer after the basic validation is passed.

```javascript
const schema = dsl({
  email: 'email!'.label('email address')
});

async function validateUser(data) {
  const result = validate(schema, data);
  if (!result.valid) return result;

  try {
    const exists = await checkEmailExists(data.email);
    if (exists) {
      return {
        valid: false,
        errors: [{ field: 'email', keyword: 'business', message: 'Email has been occupied' }]
      };
    }
  } catch (error) {
    console.error('Email check failed:', error);
  }

  return result;
}
```

---

## code organization

### 1. Centrally manage Schema

**Recommended Project Structure**:
```text
src/
├── schemas/
│ ├── index.js # Export all Schemas
│ ├── user.schema.js # User related Schema
│ ├── post.schema.js # Article related Schema
│ └── common.schema.js # Common Schema
├── routes/
│   ├── user.routes.js
│   └── post.routes.js
└── controllers/
```

**schemas/user.schema.js**:
```javascript
const { dsl } = require('schema-dsl');

//Reusable fields
const commonFields = {
  username: dsl('string!').username().label('username'),
  email: 'email!',
  password: dsl('string!').password('strong').label('password')
};

//Register Schema
exports.registerSchema = dsl({
  ...commonFields,
  confirmPassword: 'string!',
  agreeTerms: 'boolean!'
});

// Login Schema
exports.loginSchema = dsl({
  email: commonFields.email,
  password: commonFields.password
});

//Update Schema
exports.updateSchema = dsl({
  username: commonFields.username,
  email: commonFields.email
  // Does not contain password
});
```

**schemas/index.js**:
```javascript
const userSchemas = require('./user.schema');
const postSchemas = require('./post.schema');

module.exports = {
  user: userSchemas,
  post: postSchemas
};
```

**routes/user.routes.js**:
```javascript
const schemas = require('../schemas');
const { validate } = require('schema-dsl');

router.post('/register', (req, res) => {
  const result = validate(schemas.user.registerSchema, req.body);
  // ...
});
```

---

### 2. Schema reuse

**Using SchemaUtils**:
```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

//Create a reusable field library
const fields = SchemaUtils.createLibrary({
  email: () => 'email!',
  phone: () => dsl('string!').phone('cn'),
  password: () => dsl('string!').password('strong')
});

//Reuse in multiple Schema
const registerSchema = dsl({
  email: fields.email(),
  password: fields.password(),
  username: 'string:3-32!'
});

const profileSchema = dsl({
  email: fields.email(),
  phone: fields.phone(),
  bio: 'string:500'
});
```

---

## Production environment recommendations

### 1. Environment configuration

```javascript
// config/validator.js
const { Validator } = require('schema-dsl');

const config = {
  development: {
    verbose: true,
    allErrors: true,
    cache: false // ✅ Abbreviation: turn off cache for easy debugging
  },
  production: {
    verbose: false,
    allErrors: false, //Only return the first error
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 60 * 60 * 1000
    }
  }
};

module.exports = new Validator(
  config[process.env.NODE_ENV || 'development']
);
```

---

### 2. Monitoring and logging

```javascript
const validator = new Validator();

//Wrap the validate method and add monitoring
const originalValidate = validator.validate.bind(validator);
validator.validate = function(schema, data, options) {
  const startTime = Date.now();
  const result = originalValidate(schema, data, options);
  const duration = Date.now() - startTime;

  //Record slow queries
  if (duration > 100) {
    console.warn(`Slow validation: ${duration}ms`);
  }

  //Record validation failure
  if (!result.valid) {
    logger.info('Validation failed', {
      errors: result.errors.length,
      paths: result.errors.map(e => e.path)
    });
  }

  return result;
};
```

---

### 3. Health Checkup

```javascript
// routes/health.js
app.get('/health', (req, res) => {
  const { validator } = require('../config/validator');

  // Check if the validator is normal
  try {
    const testSchema = dsl({ test: 'string!' });
    const result = validator.validate(testSchema, { test: 'ok' });

    if (!result.valid) {
      throw new Error('Validator test failed');
    }

    res.json({
      status: 'ok',
      validator: 'operational',
      cacheStats: validator.getCacheStats()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});
```

---

### 4. Regular maintenance

```javascript
// Clean the cache regularly
const cron = require('node-cron');

// Clean up once every morning
cron.schedule('0 0 * * *', () => {
  validator.clearCache();
  console.log('Validator cache cleared');
});

// Or clean up based on memory usage
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // More than 500MB
    validator.clearCache();
  }
}, 60000); // Check every minute
```

---

## Performance Benchmark Reference

Cache hits before and after can usually significantly reduce the cost of repeated compilation, but the absolute time-consuming will be affected by machine performance, Node version, schema complexity, data size and hit rate. It is not recommended to use a fixed set of milliseconds as a universal benchmark.

**More stable conclusion**:

- Reusing the same schema object or `Validator` instance is usually faster than recompiling for each request
- The more complex the schema and the more times it is re-validated, the more obvious the cache benefits are.
- The total time required for batch validation mainly depends on the complexity of a single schema and the size of the data. A fixed number of milliseconds should not be used to make capacity commitments.

If you need current reviewable throughput comparison, please refer to the benchmark results under maintenance and the performance data synchronized in the FAQ.

---

## Summarize

Following these best practices, your schema-dsl code will have:

✅ **HIGH PERFORMANCE** - via pre-compilation and caching
✅ **HIGH SECURITY** - Avoid common security pitfalls
✅ **High Maintainability** - Clear code organization
✅ **High Availability** - Perfect error handling

---

## Further reading

- [Performance Optimization Guide](performance-guide.md)
- [Safety Checklist](security-checklist.md)
- [Troubleshooting Guide](troubleshooting.md)

---

## Corresponding sample file

**Example entry**: [best-practices.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/best-practices.ts)
**Description**: Shows the recommended combination of "using pure DSL for simple fields, partially using Builder for complex fields, and reusing field libraries", as well as the two validation paths of success/failure.
