# Schema tool function documentation

> **Update time**: 2025-12-25

---

## 📑 Table of Contents

- [Schema reuse](#schema-reuse)
- [Schema merge](#schema-merge)
- [Schema Filter](#schema-filter)
- [Schema Export](#schema-export)
- [Performance Monitoring](#performance-monitoring)
- [Complete example](#complete-example)

---

## Schema reuse

### Direct reuse (easiest)✅

```javascript
const { dsl } = require('schema-dsl');

//Define reusable fields (just ordinary objects)
const commonFields = {
  email: 'email!'.label('email address'),
  phone: 'string:11!'.phone('cn').label('mobile number'),
  username: 'string:3-32!'.username().label('username')
};

// use directly
const registerSchema = dsl({
  ...commonFields, // ✅ Expand directly
  password: 'string:8-64!'.password('strong')
});

const profileSchema = dsl({
  ...commonFields, // ✅Reuse
  bio: 'string:500',
  avatar: 'url'
});
```

**Advantages**: The simplest, directly use JavaScript object expansion

---

### Function reuse (when parameters are required)

```javascript
//Define reusable field functions
const createEmailField = (label = 'Email address') =>
  'email!'.label(label);

const createRangeField = (min, max) =>
  `number:${min}-${max}`.label('numeric range');

// use
const schema = dsl({
  email: createEmailField('Contact email'),
  workEmail: createEmailField('work email'),
  age: createRangeField(18, 120),
  score: createRangeField(0, 100)
});
```

**Advantages**: Supports parameterization and has strong flexibility

---

### Field library reuse (large projects)

```javascript
// fields/common.js - defines the field library
module.exports = {
  email: () => 'email!'.label('email address'),
  phone: (country = 'cn') => `string:11!`.phone(country).label('mobile number'),
  username: (range = '3-32') => `string:${range}!`.username(range).label('username'),
  password: (strength = 'medium') => 'string:8-64!'.password(strength).label('password'),

  //Combined fields
  userAuth: () => ({
    username: 'string:3-32!'.username().label('username'),
    password: 'string:8-64!'.password('strong').label('password')
  }),

  userProfile: () => ({
    nickname: 'string:2-20!'.label('nickname'),
    bio: 'string:500',
    avatar: 'url'
  })
};

// use
const fields = require('./fields/common');

const loginSchema = dsl({
  email: fields.email(),
  password: fields.password('strong')
});

const registerSchema = dsl({
  ...fields.userAuth(), // ✅ Expand combined fields
  email: fields.email(),
  phone: fields.phone('cn')
});
```

**Advantages**: Unified management, easy to maintain

---

## Schema merge

### createLibrary() - Create a fragment library

```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

const fields = SchemaUtils.createLibrary({
  email: () => 'email!'.label('email address'),
  phone: () => dsl('string!').phone('cn').label('mobile number'),
  profile: () => ({
    bio: 'string:500',
    avatar: 'url'
  })
});

const registerSchema = dsl({
  email: fields.email(),
  phone: fields.phone(),
  password: dsl('string!').password('strong')
});

const profileSchema = dsl({
  ...fields.profile(),
  email: fields.email()
});
```

**Description**: `createLibrary()` just returns a fragment factory collection, suitable for centralized management of fields and combined fragments in large projects.

---

### extend() - extend Schema (inheritance)

```javascript
const baseUser = dsl({
  name: 'string!',
  email: 'email!'
});

//Extend basic Schema
const admin = SchemaUtils.extend(baseUser, {
  role: 'admin|superadmin',
  permissions: 'array<string>'
});

// admin contains all baseUser fields + role + permissions
```

**Description**: Similar to inheritance, all fields of the base Schema are retained.

---

## Schema filter

### pick() - select a field

```javascript
const fullUser = dsl({
  name: 'string!',
  email: 'email!',
  password: 'string:8-64!',
  phone: 'string:11!',
  age: 'number:18-120'
});

// Select only specific fields
const publicUser = SchemaUtils.pick(fullUser, ['name', 'email']);

// publicUser only contains name and email
```

**Purpose**: Extract some fields (such as public information) from the complete Schema

---

### omit() - exclude fields

```javascript
const fullUser = dsl({
  name: 'string!',
  email: 'email!',
  password: 'string:8-64!',
  phone: 'string:11!'
});

//Exclude sensitive fields
const safeUser = SchemaUtils.omit(fullUser, ['password']);

// safeUser contains all fields except password
```

**Purpose**: Remove sensitive fields (such as passwords)

---

### partial() - Make a field optional

```javascript
const updateSchema = SchemaUtils.partial(dsl({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
}));

// required will be removed from the results, suitable for PATCH / partial update scenarios
```

You can also make only some fields optional:

```javascript
const schema = dsl({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
});

const partialContact = SchemaUtils.partial(schema, ['name', 'email']);
```

---

## Schema export

### toMarkdown() - Export to Markdown document

```javascript
const schema = dsl({
  username: 'string:3-32!'.label('username'),
  email: 'email!'.label('email address'),
  age: 'number:18-120'
});

const markdown = SchemaUtils.toMarkdown(schema, {
  title: 'User Registration Schema'
});

console.log(markdown);
```

**Output**:
```markdown
# User registration Schema

| Field | Type | Required | Constraints | Description |
|------|------|------|------|------|
| username | string | ✅ | 3-32 characters | username |
| email | email | ✅ | - | Email address |
| age | number | ❌ | 18-120 | - |
```

**Purpose**: Generate API documentation

---

### toHTML() - export to HTML table

```javascript
const html = SchemaUtils.toHTML(schema, {
  title: 'User Registration Schema'
});

// Generate HTML table, which can be embedded in the document
```

**Use**: Integrate into web documents

---

## Performance monitoring

### validateBatch() - batch validation statistics

```javascript
const { SchemaUtils, Validator, dsl } = require('schema-dsl');

const schema = dsl({
  email: 'email!',
  age: 'number:18-120'
});

const validator = new Validator();

const items = [
  { email: 'user1@example.com', age: 25 },
  { email: 'invalid', age: 15 },
  { email: 'user2@example.com', age: 30 }
];

const batch = SchemaUtils.validateBatch(schema, items, validator.getAjv());

console.log(batch);
// {
//   results: [
//     { index: 0, valid: true, errors: null, data: {...} },
//     { index: 1, valid: false, errors: [...], data: null },
//     { index: 2, valid: true, errors: null, data: {...} }
//   ],
//   summary: {
//     total: 3,
//     valid: 2,
//     invalid: 1,
//     duration: 5,
//     averageTime: 1.67
//   }
// }
```
**Description**:
- If you only need the result of "whether each item passed", you can directly use `validator.validateBatch(schema, items)`
- If you also need summary statistics, use `SchemaUtils.validateBatch(schema, items, validator.getAjv())`

---

### withPerformance() - Add performance wrapper to Validator

```javascript
const validator = SchemaUtils.withPerformance(new Validator());

const result = validator.validate(schema, data);

console.log(result.performance);
// {
//   duration: 2,
//   timestamp: '2026-05-06T12:34:56.789Z'
// }
```

**Purpose**: Add time-consuming information to the validation results without changing the business calling method.

---

## Other tools

### clone() - Deep clone Schema

```javascript
const original = dsl({
  user: {
    name: 'string!',
    profile: {
      bio: 'string:500'
    }
  }
});

const cloned = SchemaUtils.clone(original);

// cloned is a completely independent copy
cloned.properties.user.properties.name.maxLength = 100;
// original will not be modified
```

---

### validateNestingDepth() - Check nesting depth

```javascript
const { dsl, DslBuilder } = require('schema-dsl');

const schema = dsl({
  level1: {
    level2: {
      level3: {
        level4: 'string'
      }
    }
  }
});

const result = DslBuilder.validateNestingDepth(schema, 10);
// Return: { valid: true, depth: 4, path: 'level1.level2.level3', message: '...' }

if (result.depth > 5) {
  console.warn('The nesting level is too deep, it is recommended to flatten');
}
```

**Note**: This capability belongs to the `DslBuilder` static method and is not a member of `SchemaUtils`; it is listed here because it is often used with the Schema tool chain.

---

## Complete example

### Enterprise level field library

```javascript
// libs/fields/index.js
module.exports = {
  //Basic fields
  id: () => 'string!'.pattern(/^[a-zA-Z0-9_-]+$/).label('ID'),
  email: () => 'email!'.label('email address'),
  phone: (country = 'cn') => 'string:11!'.phone(country).label('mobile number'),

  // Authentication field
  auth: {
    username: () => 'string:3-32!'.username().label('username'),
    password: (strength = 'strong') =>
      'string:8-64!'.password(strength).label('password')
  },

  // personal information
  profile: {
    nickname: () => 'string:2-20!'.label('nickname'),
    realName: () => 'string:2-50'.label('real name'),
    bio: () => 'string:500',
    avatar: () => 'url'.label('avatar'),
    birthday: () => 'date'
  },

  //Address information
  address: () => ({
    country: 'string:2-50!',
    province: 'string:2-50!',
    city: 'string:2-50!',
    detail: 'string:10-200!'
  }),

  // timestamp
  timestamps: () => ({
    created_at: 'datetime!',
    updated_at: 'datetime!'
  })
};

// use
const fields = require('./libs/fields');

//User registration
const registerSchema = dsl({
  ...fields.auth,
  email: fields.email(),
  phone: fields.phone('cn'),
  agree: 'boolean!'
});

//User information
const profileSchema = dsl({
  ...fields.profile,
  ...fields.timestamps()
});

// full user
const userSchema = SchemaUtils.extend(
  SchemaUtils.extend(registerSchema, profileSchema),
  fields.address()
);
```

---

## best practices

### 1. Small projects: direct reuse

```javascript
const commonFields = {
  email: 'email!'.label('mailbox'),
  phone: 'string:11!'.phone('cn')
};

const schema1 = dsl({ ...commonFields, ... });
const schema2 = dsl({ ...commonFields, ... });
```

### 2. Medium-sized projects: function reuse

```javascript
const createUserFields = (options = {}) => ({
  email: 'email!'.label(options.emailLabel || 'Email'),
  phone: 'string:11!'.phone(options.country || 'cn')
});

const schema = dsl({
  ...createUserFields({ emailLabel: 'Contact email' }),
  ...otherFields
});
```

### 3. Large-scale projects: field library

```javascript
// Unified management in fields/ directory
const fields = require('./fields');

const schema = dsl({
  ...fields.auth,
  ...fields.profile
});
```

---

## Related documents

- [DSL syntax](./dsl-syntax.md)
- [String extension](./string-extensions.md)
- [API Reference](./api-reference.md)

---

## Corresponding sample file

**Example entry**: [schema-utils.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-utils.ts)
**Description**: Minimal workflow covering `reusable()`, `createLibrary()`, `extend()`, `validateBatch()`, `withPerformance()` and `clone()`.

---

**Last updated**: 2026-05-08
