# Frequently Asked Questions (FAQ)

> **Update time**: 2026-06-18


---


## Basic questions

### Q: What is schema-dsl designed for?

**A**: schema-dsl is designed for validation rules that need to stay compact, serializable, and easy to share between configuration, APIs, front-end forms, and back-end services.

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});
```

**Main Differences**:
- More concise DSL syntax
- Optional builder chains when a field needs metadata or custom constraints
- Database Schema export support
- Built-in common validators such as username, password, phone, and email
- Based on JSON Schema standard

---

### Q: How to install schema-dsl?

```bash
npm install schema-dsl
```

**Node.js version requirement**: `>=18.0.0`

The current version uses `Node.js >=18.0.0` as the runtime baseline and no longer promises compatibility with older Node versions.

---

### Q: Are ES Modules supported?

**A**: Supported.

```javascript
// Recommended public entry since v2.1.0
import { s, validate } from 'schema-dsl/pure';

const schema = s({ email: 'email!' });
const result = validate(schema, { email: 'test@example.com' });
```

### Q: What language pack file formats are supported by i18n directory loading?

**A**: Under **Node.js >= 18.0.0**, `s.config({ i18n: '/path/to/locales' })` supports:

- `.js` (CommonJS language pack)
- `.cjs`
- `.json`
- `.jsonc`
- `.json5`

**Recommendation**: If your project is `type: module` / ESM, give priority to using `.cjs`, `.json`, `.jsonc`, `.json5`, as the compatibility is the most stable.

---

## DSL syntax issues

### Q: `'string:3-32!'` What does it mean?

**A**: This is the DSL syntax:
- `string` - ​​Type
- `3-32` - ​​length range (minimum 3, maximum 32)
- `!` - ​​required

More examples:
```javascript
'string:10' // Maximum length 10
'string:3-' // Minimum length 3
'number:0-100' //Number range 0-100
'email!' // Required email address
'a|b|c' // enumeration value
```

---

### Q: How to define an array?

**A**: Use `array` type:

```javascript
// simple array
tags: 'array'

//With length constraints
tags: 'array:1-10' // 1-10 elements
tags: 'array!1-10' // Required, 1-10 elements

//With element type
tags: 'array<string>' // String array
tags: 'array<number>' // array of numbers
tags: 'array<string:1-20>' // Constrained string array
```

---

### Q: How to define nested objects?

**A**: Just nest directly:

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  user: {
    name: 'string!',
    address: {
      city: 'string!',
      zip: 'string:5-10!'
    }
  }
});
```

---

### Q: How to use String extension?

**A**: String extension is an explicit compatibility/ergonomics path. New public examples use `schema-dsl/pure` + `s` by default, because it supports pure DSL strings, `s('...')`, and `s.xxx()` without installing methods on `String.prototype`.

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  email: s('email!')
    .label('email address')
    .messages({
      'required': '{{#label}} cannot be empty',
      'format': 'Please enter a valid {{#label}}'
    }),

  username: s('string:3-32!')
    .pattern(/^[a-z0-9_]+$/)
    .label('username')
    .username('medium')
});
```

If you intentionally want direct String chains, import the explicit String runtime/type entries described in [String Extensions](string-extensions.md).

---

## Validation issues

### Q: How to verify data?

**A**: Use `validate()` function or `Validator` class:

```javascript
// Method 1: Convenience function
import { s, validate } from 'schema-dsl/pure';

const schema = s({ email: 'email!' });
const result = validate(schema, data);

// Method 2: Validator instance
import { Validator } from 'schema-dsl/pure';

const validator = new Validator();
const result = validator.validate(schema, data);
```

---

### Q: What is the format of the validation results?

**A**: The returned object contains:

```javascript
{
  valid: true/false, // whether to pass
  data: {}, // The current implementation will return this validation data, which is also convenient for locating input when it fails.
  errors: [] // Empty array on success, detailed errors on failure
}
```

---

### Q: How to get all errors instead of just the first one?

**A**: All errors will be returned by default. If you only want to keep the first error, you can explicitly turn off `allErrors`:

```javascript
const validator = new Validator({ allErrors: false });
```

`allErrors` needs to be configured when creating the `Validator` instance. `validator.validate(schema, data, options)` cannot override this switch one by one.

---

### Q: How to use default values?

**A**: Use `.default()` method:

```javascript
import { s, validate } from 'schema-dsl/pure';

const schema = s({
  status: s('string').default('active'),
  count: s('integer').default(0)
});

const result = validate(schema, {});
console.log(result.data);
// { status: 'active', count: 0 }
```

---

## Performance issues

### Q: What is the performance of schema-dsl?

**A**: The current benchmark should be read as project-local throughput evidence, not as a permanent marketing claim. The latest local run recorded:

| Scenario | schema-dsl throughput |
|------|-----------|
| S1 simple valid object | ~1.185M ops/s |
| S2 invalid object without i18n formatting | ~1.178M ops/s |
| S3 nested valid object | ~941K ops/s |

**Environment**: Node.js v20.20.2, Windows x64, run time 2026-06-18T08:49:22.365Z.

**Conclusion**:
- ✅ Hot-path validation is already in the million-ops/sec range on this local machine.
- ✅ Built-in caching avoids repeated schema parsing on reused schema objects.
- ✅ Treat these numbers as a regression baseline; rerun the benchmark when runtime, dependency, or schema complexity changes.

---

### Q: Why is the performance difference between valid/invalid data scenarios so big?

**A**: Invalid-data throughput depends heavily on how errors are collected and formatted. schema-dsl keeps the hot validation path separate from localized message rendering, so the raw invalid-data benchmark can stay close to the valid-data benchmark. Once you enable custom formatting, i18n, or large nested error payloads, measure with your real schema and error output.

---

### Q: When will performance become a bottleneck?

**A**: The following scenarios may become a bottleneck:

1. **API Gateway** (>500,000 verifications per second)
2. **High concurrency service** (>500,000 requests per second)
3. **Real-time data processing** (millisecond-level latency requirements)

**Most applications** (<100,000 verifications per second) will not encounter performance bottlenecks.

---

### Q: What should I do if the validation speed is slow?

**A**: Use precompilation and caching:

```javascript
// 1. Use precompilation
const validator = new Validator();
const validateUser = validator.compile(userSchema);

// 2. Enable caching

const validator = new Validator({
  cache: {
    maxSize: 5000, // Cache 5000 Schemas
    ttl: 0 // No time-based expiration; LRU controls lifecycle
  }
});

// 3. Reuse Validator instance
// ❌ Error: Create new instance every time
app.post('/api/users', (req, res) => {
  const validator = new Validator(); // slow
  // ...
});

// ✅ Correct: reuse instance
const validator = new Validator();
app.post('/api/users', (req, res) => {
  const result = validator.validate(schema, req.body); // Fast
  // ...
});
```

---

### Q: How does caching work?

**A**: schema-dsl currently implements compilation caching through `CacheManager` entrusting `cache-hub`’s `MemoryCache`:

```javascript
const validator = new Validator({
  cache: {
    maxSize: 5000, // Maximum cache 5000 items
    ttl: 0 // No time-based expiration; LRU controls lifecycle
  }
});

// cache statistics
const stats = validator.getCacheStats();
console.log(stats);
// {
//   hits: 8500,
//   misses: 150,
//   hitRate: '98.27',
//   size: 150,
//   maxSize: 5000,
//   enabled: true
// }
```

---

### Q: How to verify in batches?

**A**: Use `SchemaUtils.validateBatch()`:

```javascript
import { SchemaUtils, Validator } from 'schema-dsl/pure';

const validator = new Validator();
const batch = SchemaUtils.validateBatch(schema, [data1, data2, data3], validator.getAjv());

console.log(batch.summary.valid);
console.log(batch.results[0].valid);
```

---

## design concept

### Q: Why choose run-time parsing instead of compile-time building?

**A**: This is an intentional design choice that prioritizes **flexibility** over **extreme performance**.

**Advantages of runtime parsing**:
1. ✅ **Fully Dynamic** - Rules can be generated dynamically from configuration/database
2. ✅ **Multi-tenant support** - different rules for each tenant, zero code modification
3. ✅ **Serializable** - can be stored, transmitted and shared
4. ✅ **Front-end and back-end sharing** - one set of rules, used by both ends
5. ✅ **Low Code Basics** - Visual configuration form validation

**Compile-time build limitations**:
- ❌ Schema is fixed and cannot be dynamically adjusted
- ❌ Unable to serialize and transmit
- ❌ Difficulties with multi-tenancy
- ❌ Unable to read rules from database

**Detailed description**: [Design concept document](design-philosophy.md)

---

### Q: What scenarios is schema-dsl suitable for?

**A**: ✅ **Most suitable scenario**:

1. **Multi-tenant SaaS system** - different validation rules for each tenant
2. **Backstage Management System** - Administrator configures form validation
3. **Configuration Driven Development** - Validation rules are stored in config/database
4. **Low-Code/No-Code Platform** - Visual form builder
5. **Rapid Prototyping** - Get started in 5 minutes with minimal code
6. **Front-end and back-end shared validation** - a set of rules, used by both ends

⚠️ **Unsuitable scene**:
1. Absolute throughput is the only goal and DSL dynamic capabilities are not required
2. You need a schema API that models every value constraint as static TypeScript types
3. Validation rules are fully static and never need to be serialized, stored, or edited as configuration

---

### Q: Why not make schema-dsl purely compile-time?

**A**: Because the core value will be lost:

**Loss of Abilities**:
```javascript
// ❌ Unable to read rules from database
const rules = await db.findOne({ entity: 'user' });
const schema = s(rules);

// ❌ Unable to multi-tenant dynamic rules
function getTenantSchema(tenantId) {
  return s(tenantConfig[tenantId]);
}

// ❌ Cannot be transferred via API
res.json({ validationRules: rules });

// ❌ Unable to configure form validation in the background
```

**RESERVED ABILITIES**:
```javascript
// ✅ Fully dynamic
const schema = s({
  username: `string:${config.min}-${config.max}!`
});

// ✅ Serializable
JSON.stringify({ username: 'string:3-32!' });

// ✅ Front-end and back-end sharing
// Backend definition → API transmission → Front-end usage
```

---

### Q: How to balance performance and flexibility?

**A**: schema-dsl design priorities:

```text
Flexibility > Ease of use > Performance
```

**Weigh the results**:
- Gain: compact, serializable rules that can be stored, transmitted, edited, and shared across runtime boundaries
- Cost: TypeScript cannot refine every DSL constraint into exact static value types

---

## Error handling

### Q: How to customize error messages?

**A**: Use `.messages()` method:

```javascript
username: s('string:3-32!').label('username')
  .messages({
    'min': '{{#label}} is too short',
    'max': '{{#label}} is too long',
    'required': 'Please enter {{#label}}'
  })
```

---

### Q: How to support multiple languages?

**A**: Use `Locale` class:

```javascript
import { Locale } from 'schema-dsl/pure';

//Add language pack
Locale.addLocale('zh-CN', {
  'required': '{{#label}} cannot be empty',
  'min': '{{#label}} cannot be less than {{#limit}}'
});

//Specify language when validating
validator.validate(schema, data, { locale: 'zh-CN' });
```

---

### Q: What is the error path format?

**A**: Currently the slash path is returned:

```javascript
'username' // Top-level field
'user/name' // Nested fields
'items/0/name' // array elements
```

---

## Database export

### Q: How to export to MongoDB Schema?

```javascript
import { exporters } from 'schema-dsl/pure';

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(schema);
```

---

### Q: How to export to MySQL DDL?

```javascript
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('table_name', schema);
```

---

### Q: How to export to PostgreSQL DDL?

```javascript
const exporter = new exporters.PostgreSQLExporter({ schema: 'public' });
const ddl = exporter.export('table_name', schema);
```

---

### Q: How to add comments when exporting?

**A**: Use `.description()`:

```javascript
username: s('string:3-32!').description('User login name, can only contain letters and numbers')
```

MySQL will generate `COMMENT` and PostgreSQL will generate `COMMENT ON COLUMN`.

---

## TypeScript support

### Q: Does schema-dsl support TypeScript?

**A**: Supported. Since v2.1.0, public TypeScript examples prefer `schema-dsl/pure` + `s`: pure DSL strings for simple fields, `s('...')` for DSL seeds with builder hints, and `s.xxx()` factories for the strongest method discovery.

```typescript
import { s, validate, Validator } from 'schema-dsl/pure';

const schema = s({
  username: 'string:3-32!',
  email: s('email!').label('Email address').error({
    required: 'Please enter your email address'
  })
});

const validator = new Validator({ allErrors: true });
const result = validate(schema, data);
if (result.valid) {
  console.log(result.data);
}
```

---

### Q: How to write a more reliable chain prompt in TypeScript?

**A**: Start the chain call from `s('...')` when you want to keep DSL syntax and still get builder-method hints:

```typescript
const schema = s({
  email: s('email!')
    .label('mailbox')
    .error({ format: 'Please enter a valid email address' })
});
```

---

## more questions

If you have further questions:

1. View [Full Document](doc-index.md)
2. Check out the [DSL Syntax Guide](dsl-syntax.md)
3. View [API Reference](api-reference.md)
4. Submit [GitHub Issue](https://github.com/vextjs/schema-dsl/issues)

---

## Related documents

- [Quick Start](quick-start.md)
- [DSL syntax](dsl-syntax.md)
- [Validation Guide](validation-guide.md)
- [Export Guide](export-guide.md)
- [Error handling](error-handling.md)

---

## Corresponding sample file

**Example entry**: [faq.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/faq.ts)
**Instructions**: Put the 4 most commonly copied scenarios in the FAQ into a runnable example: single validation, multi-language errors, batch validation, and cache statistics.
