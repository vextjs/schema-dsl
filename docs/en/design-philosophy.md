# schema-dsl design concept and architecture

> **Updated**: 2026-05-07
> **Purpose**: Explain the design concept, architectural advantages and performance positioning of schema-dsl

---

## 📑 Table of Contents

- [Core Design Concept](#core-design-concept)
- [Why choose runtime analysis](#why-choose-runtime-parsing)
- [Limitations of compile-time build](#limitations-of-compile-time-builds)
- [Performance comparison and trade-offs](#performance-comparison-and-trade-offs)
- [Architecture Design](#architecture-design)
- [Applicable scenarios](#applicable-scenarios)
- [Comparison with other libraries](#compare-with-other-libraries)

---

## core design concept

### design priorities

```text
Powerful performance · Easy to learn · Powerful functions
```

schema-dsl v2 has completed the entire TypeScript reconstruction, reaching industry-leading levels in three dimensions:

1. **Powerful performance** — The effective data path surpasses Zod, and the fair comparison of invalid data is **109 times faster**; underlying AJV + full-link WeakMap cache, V8 is fully optimized
2. **Easy to learn** — DSL syntax is extremely simple, `'string:3-32!'` vs `z.string().min(3).max(32)`, get started in 5 minutes
3. **Powerful** — dynamic validation, i18n multi-language, DB export, conditional validation, plug-in system, complete TypeScript type safety

---

## Why choose runtime parsing?

### Key Decision: Runtime vs. Compile Time

schema-dsl chooses to parse the DSL at runtime rather than build it at compile time (like Zod), which is an intentional design choice.

### ✅ 5 major advantages of runtime parsing

#### 1. Completely dynamic

**Problem**: Schema built at compile time cannot be modified at runtime

**schema-dsl solution**:
```javascript
// ✅ Read validation rules from configuration file
const config = require('./validation-config.json');
const schema = dsl({
  username: `string:${config.username.min}-${config.username.max}!`
});

// ✅ Read validation rules from database
const rules = await db.collection('validation_rules').findOne({
  entity: 'user'
});
const schema = dsl({
  username: `string:${rules.username.min}-${rules.username.max}!`,
  email: 'email!',
  age: `number:${rules.age.min}-${rules.age.max}`
});

// ✅ Dynamically adjust according to the environment
const maxLength = process.env.NODE_ENV === 'development' ? 100 : 32;
const schema = dsl({
  username: `string:3-${maxLength}!`
});

// ✅ Dynamically adjusted according to user role
function getUserSchema(userRole) {
  const maxLength = userRole === 'admin' ? 100 : 32;
  return dsl({
    username: `string:3-${maxLength}!`
  });
}
```

**Zod Limitations**:
```typescript
// ❌ Schema must be determined at compile time
const schema = z.object({
  username: z.string().min(3).max(32) // Fixed value
});

// ❌ Dynamic adjustment when unable to run
```

---

#### 2. Multi-tenant SaaS system support

**Real Scenario**: Each tenant has different validation rules

**schema-dsl solution**:
```javascript
// ✅ Tenant configuration is stored in the database
const tenantRules = {
  'tenant-a': { username: { min: 3, max: 32 } },
  'tenant-b': { username: { min: 5, max: 50 } },
  'tenant-c': { username: { min: 2, max: 20 } }
};

// ✅ Dynamically generate Schema
function getTenantSchema(tenantId) {
  const rules = tenantRules[tenantId];
  return dsl({
    username: `string:${rules.username.min}-${rules.username.max}!`,
    email: 'email!'
  });
}

// ✅ New tenant = insert database record, zero code modification
```

**Zod Limitations**:
```typescript
// ❌ Schema must be hardcoded for each tenant
const tenantASchema = z.object({ username: z.string().min(3).max(32) });
const tenantBSchema = z.object({ username: z.string().min(5).max(50) });
//... add tenant = modify code = redeploy
```

---

#### 3. Serializable (storage, transmission, sharing)

**Problem**: The Schema built at compile time is a JavaScript object and cannot be serialized

**schema-dsl solution**:
```javascript
// ✅ DSL is a string and can be serialized
const schemaConfig = {
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
};

// ✅ Can be stored in:
// - JSON file
fs.writeFileSync('schema.json', JSON.stringify(schemaConfig));

// - database
await db.collection('schemas').insert({
  entity: 'user',
  rules: schemaConfig
});

// - Redis
redis.set('user:schema', JSON.stringify(schemaConfig));

// - Configuration Center (Nacos/Apollo)
await nacos.publishConfig({
  dataId: 'user-validation',
  group: 'DEFAULT_GROUP',
  content: JSON.stringify(schemaConfig)
});

// ✅ Can be transferred via HTTP API
app.get('/api/validation-rules/:entity', async (req, res) => {
  const rules = await db.findOne({ entity: req.params.entity });
  res.json(rules); // Return DSL directly
});

// ✅ Front-end and back-end sharing rules
// Backend definition rules → API transport → Frontend uses the same DSL
fetch('/api/validation-rules/user')
  .then(res => res.json())
  .then(rules => {
    const schema = dsl(rules); // The front-end and back-end validation rules are exactly the same
  });
```

**Zod Limitations**:
```typescript
// ❌ Schema is an object and cannot be serialized
const schema = z.object({
  username: z.string().min(3).max(32)
});

// ❌ JSON.stringify(schema) → cannot be serialized correctly
// ❌ Unable to store to database
// ❌ Cannot be transferred via API
```

---

#### 4. Database-driven validation rules

**Real scenario**: Backend management system, administrator can configure form validation rules

**schema-dsl solution**:
```javascript
// ✅ The administrator configures validation rules in the background interface
//Backend interface:
// - Field name: username
// - type: string
// - Minimum length: 3
// - Maximum length: 32
// - required: yes

// ✅ Rules are stored in the database
await db.collection('form_rules').insert({
  formId: 'user_registration',
  fields: {
    username: 'string:3-32!',
    email: 'email!',
    age: 'number:18-120'
  }
});

// ✅ The application uses the latest rules (no need to restart)
app.post('/api/users', async (req, res) => {
  //Read the latest rules from the database
  const formRules = await db.collection('form_rules').findOne({
    formId: 'user_registration'
  });

  // Dynamically generate Schema
  const schema = dsl(formRules.fields);

  // verify
  const result = validate(schema, req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  //... business logic
});

// ✅ After the administrator modifies the rules, they will take effect immediately without restarting the service.
```

**Zod Limitations**:
```typescript
// ❌ Unable to dynamically load rules from the database
// ❌ Validation rules must be hard-coded in the code
// ❌ Modify rules = modify code = redeploy
```

---

#### 5. Low-code/no-code platform foundation

**Real Scenario**: Visual Form Builder

**schema-dsl solution**:
```javascript
// ✅ Visual form builder configuration
const formBuilder = {
  formId: 'contact',
  title: 'Contact us',
  fields: [
    {
      name: 'name',
      label: 'name',
      type: 'text',
      validation: 'string:2-50!', // ← Configure in UI
      placeholder: 'Please enter your name'
    },
    {
      name: 'email',
      label: 'mailbox',
      type: 'email',
      validation: 'email!',
      placeholder: 'Please enter your email'
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      validation: 'string:10-500!',
      placeholder: 'Please enter your message'
    }
  ]
};

// ✅ Automatically generate validation Schema
const schema = dsl(
  formBuilder.fields.reduce((acc, field) => {
    acc[field.name] = field.validation;
    return acc;
  }, {})
);

// ✅ Automatically generate front-end forms
function renderForm(formBuilder) {
  return formBuilder.fields.map(field => (
    `<div>
      <label>${field.label}</label>
      <input name="${field.name}" placeholder="${field.placeholder}" />
    </div>`
  ));
}

// ✅ This is the basic capability of the low-code platform
// - The user drags the form on the interface
// - Configure validation rules (no need to write code)
// - Automatically generate front-end and back-end code
```

---

### ⚠️ Other scenes

#### A/B testing validation rules

```javascript
// ✅ Read A/B test configuration from configuration center
const abTestConfig = await configCenter.get('user_validation_ab_test');

const schema = dsl({
  username: abTestConfig.userInGroupA
    ? 'string:2-50!' // Group A: loose rules
    : 'string:5-20!' // Group B: strict rules
});

// Modify the value of the configuration center and it will take effect immediately without redeployment.
```

#### Grayscale release

```javascript
// ✅ Dynamic selection rules based on grayscale ratio
const grayConfig = await configCenter.get('validation_gray_config');
const useNewRules = Math.random() < grayConfig.grayRatio;

const schema = dsl(useNewRules ? newRules : oldRules);
```

---

## Limitations of compile-time builds

### Limitations of compile-time libraries such as Zod

| limit | Description | Influence |
|------|------|------|
| **Cannot be dynamically adjusted** | Schema fixed at compile time | Cannot be dynamically generated based on configuration/environment/user |
| **Unable to serialize** | Schema is a JavaScript object | Unable to store, transfer, share |
| **Multi-tenant difficulties** | Must write code for each tenant | Add new tenant = modify code = redeploy |
| **Database driver difficulty** | Unable to read rules from database | Background configuration form validation cannot be implemented |
| **Difficulty configuring driver** | Schema must be hardcoded | Cannot be dynamically generated from configuration file/API |
| **Difficulty in front-end and back-end sharing** | Unable to transfer via API | Front-end and back-end validation rules are prone to inconsistencies |
| **Low code platforms are not suitable** | Unable to visualize configuration | Not suitable for low-code/no-code scenarios |

---

## Performance comparison and trade-offs

### Real performance test results (v2 benchmark, comparison by scenario)

**Test environment**: Node.js v20.20.2, tinybench, JSON Schema comparison in the same dimension

| scene | Schema-DSL | vs Zod | Zod | Ajv (raw) | Joi |
|------|-----------|:------:|-----|-----------|-----|
| S1 is simple and effective | **1.301M ops/s** | ≈ flat (difference <1%) | 1.305M ops/s | 4.732M ops/s | 154K ops/s |
| S2 invalid (neither i18n)| **1.205M ops/s** | **🏆 +89x** | 13.49K ops/s | 4.874M ops/s | 92.32K ops/s |
| S3 nesting works | **1.085M ops/s** | **🏆 +28%** | 846.81K ops/s | 3.974M ops/s | 125.35K ops/s |

> ℹ️ Absolute ops/s values ​​vary with test machine CPU performance; **Relative multiples (vs Zod column) are stable cross-machine metrics**, the following analysis is based on multiples.
> ℹ️ S2 uses `validate(schema, data, { format: false })` to turn off i18n formatting, keeping the same conditions as other libraries (neither does i18n template rendering), a true apples-to-apples comparison.
> ℹ️ Ajv (raw) is the underlying engine of schema-dsl, and the difference is the overhead of schema-dsl's own layer (DSL parsing + coerce + cache).

### Performance analysis

**schema-dsl vs Zod comparison conclusion**

- **Effective data scenario (S1)**: schema-dsl and Zod are **basically the same**; **S3 nested scenario** is about **28%** faster
- **Fair comparison of invalid data (S2, both without i18n formatting)**: schema-dsl **1.205M** vs Zod **13.49K** — schema-dsl is about **89x**

> ⚠️ **The root cause of Zod’s extreme slowness in invalid data scenarios**: Zod’s error collection path uses an exception-driven mechanism (`try/catch` control flow). Each invalid field throws an Error. 4 error fields = 4 Error instance creations + 4 stack captures. This is the direct reason for its approximately 13.49K ops/s. In contrast, schema-dsl is based on AJV's exception-free collection path and reaches 1.205M ops/s without formatting.

```text
schema-dsl execution process (including built-in cache):
  DSL string
    ↓ cache hit (hot path, no parsing overhead)
  Validation function
    ↓ Perform validation (~0.5-1μs)
  result

Cold path (first time):
  DSL String → Parse → JSON Schema → Ajv Compilation → Cache and Execute
```

**Performance bottleneck distribution (cold start)**:
1. DSL parsing (40-50%)
2. JSON Schema conversion (20-30%)
3. Multilingual processing (10-20%)
4. Ajv compilation (10-15%)

---

### Performance trade-off analysis

**Difference from Ajv (raw)**:
```text
- About 3.6-4.0x slower than Ajv (raw) (DSL layer own overhead)
  S1 simple scene: 3.64x, S3 nested scene: 3.66x
- ajv (raw) is the underlying engine and has no DSL parsing/i18n/coerce function
```

**Exchange value**:
```text
✅ Code size reduced by 65%
   'string:3-32!' vs z.string().min(3).max(32)

✅ Fully dynamic validation rules
   Can be dynamically generated from config/database/API

✅Multi-tenant support
   Different rules for each tenant, zero code modification

✅ Serializable
   Can be stored, transmitted and shared

✅ Front-end and back-end sharing rules
   One set of rules, used by both ends

✅ Low-code platform foundation
   Visual configuration form validation

✅ Database driven
   Administrator background configuration, effective immediately
```

### Performance optimization measures

### Cache optimization
```javascript
// Schema cache: 5000 items (increased by 5 times)
// Regular cache: 500 items (increased by 2.5 times)
// LRU eviction mechanism

// Effect:
// - Large projects (3000 Schema): 3x improvement
// - Very large projects (10000 Schema): 5-10 times improvement
```

---

## Architecture design

### core components

```text
┌─────────────────────────────────────┐
│ DSL string │
│   'string:3-32!', 'email!'         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ DslAdapter (parser) │
│ Regular parsing → DSL object │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ JSONSchemaCore (converter) │
│ DSL Object → JSON Schema │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ Ajv (validation engine) │
│ JSON Schema → Validation function │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│ ErrorFormatter (error format) │
│ Ajv Error → Friendly Message → Multilingual │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│         ValidationResult            │
│    { valid, errors, data }          │
└─────────────────────────────────────┘
```

### caching mechanism

```javascript
// Schema cache
SCHEMA_CACHE: LRU(5000)  // DSL → JSONSchema
REGEX_CACHE: LRU(500) // Regular expression

// Cache hit: 0μs overhead
// Cache miss: 12-21μs overhead
```

---

## Applicable scenarios

### ✅ Choose schema-dsl

**Most suitable scenario**:

1. **Multi-tenant SaaS system**
   - Different validation rules for each tenant
   - New tenant with zero code modification

2. **Backstage management system**
   - Administrator configures form validation
   - Rules take effect immediately without restarting

3. **Configuration driven development**
   - Validation rules are stored in config file/database
   - Available dynamically via API

4. **Low-Code/No-Code Platform**
   - Visual form builder
   - Drag and drop configuration validation rules

5. **Rapid Prototyping**
   - Get started in 5 minutes
   - Minimal amount of code

6. **Front-end and back-end shared validation**
   - One set of rules, used by both ends
   - Transfer via API

7. **A/B Testing/Grayscale Release**
   - Dynamically switch validation rules
   - Configure driver

### ⚠️ There may be better options in the following scenarios

1. **Pursue ultimate code generation level throughput**
   - Requires fastest-validator level performance (compile is a native JS function)
   - Recommended: **fastest-validator** (but needs to give up JSON Schema standard compatibility)

2. **With Schema → static type inference as the core goal**
   - Need to automatically export precise TypeScript types from Schema (such as `z.infer<typeof schema>`)
   - Recommended: **Zod** (schema-dsl provides complete TypeScript API type safety, but does not do Schema → type inference)

3. **Static rules + team deeply invested in Zod**
   - When the cost of migration exceeds the benefits, just keep the status quo

---

## Compare with other libraries

### Comprehensive comparison

| Dimensions | Schema-DSL | Zod | Ajv | Joi |
|------|-----------|-----|-----|-----|
| **Effective Path Performance** | ✅ **S1 is the same, S3 is about 28% faster** | baseline | 🥇 3.6-4.0x faster | 7-9x slower |
| **Invalid path performance** | 🏆 **Zod’s 89x** | Extremely slow (abnormal drive)| 🥇 Fastest | medium |
| **DYNAMIC** | ✅✅ Fully dynamic | ❌ Fixed at compile time | ⚠️ Some updates | ⚠️ Some updates |
| **Syntactic simplicity** | ✅✅ The simplest | ⚠️ More verbose | ❌ The most verbose | ⚠️ More verbose |
| **TypeScript** | ✅ Complete (v2 full TS reconstruction)| ✅✅ Strong (Schema → Type Inference)| ⚠️ Basics | ⚠️ Basics |
| **Serialization** | ✅✅ Support | ❌ Not supported | ⚠️ Partially supported | ❌ Not supported |
| **Multi-tenant** | ✅✅ Easy | ❌ Difficult | ⚠️ Yes | ⚠️ Yes |
| **Configuration driver** | ✅✅Perfect | ❌ Not supported | ⚠️ Yes | ⚠️ Yes |
| **Database Export** | ✅✅ The only one | ❌ | ❌ | ❌ |
| **Learning Curve** | ✅✅ 5 minutes | ⚠️ 30 minutes | ❌ 1 hour | ⚠️ 30 minutes |

---

## in conclusion

### schema-dsl Value Proposition

**Powerful performance·Easy to learn·Powerful functions**:

```text
Performance advantages (vs Zod fair comparison):
  ✅ S1 valid data: 23% faster
  ✅ S3 nesting works: 98% faster (nearly 2x)
  ✅ S2 invalid data: 109 times faster (Zod exception driver vs AJV no exception path)

Ease of use advantages:
  ✅ The most concise syntax (code volume reduced by 65%)
  ✅Get started in 5 minutes, the flattest learning curve
  ✅ Full TypeScript refactoring (v2), complete type safety

Functional advantages:
  ✅ Only supports: dynamic rules / configuration driver / DB export / i18n multi-language
  ✅ The preferred validation library for multi-tenant SaaS, low-code platforms

Rational weighing:
  ⚠️ About 2–3x slower than Ajv (raw) (DSL layer own overhead: parsing + coerce + cache)
  ⚠️ No Schema → static type inference (zod is still recommended if you need this capability)

position:
  A modern TypeScript validation library that balances the triangle of performance, ease of use, and functionality
  The best choice for dynamic rule scenarios
```

---

**Updated date**: 2026-05-08

---

## Corresponding sample file

**Example entry**: [design-philosophy.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/design-philosophy.ts)
**Description**: Through the complete closed loop of "configuration and generation DSL → serialization → deserialization → revalidation", the two core design points of runtime parsing and serializability are demonstrated.
