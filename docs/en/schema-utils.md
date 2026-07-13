# Schema tool function documentation

Use SchemaUtils when multiple schemas share fields or when you need to derive one schema from another. This page focuses on practical reuse patterns first, then introduces helper APIs for larger projects.

## Schema reuse

### Direct reuse (easiest)✅

```javascript
import { s } from 'schema-dsl/pure';

//Define reusable fields (just ordinary objects)
const commonFields = {
  email: s('email!').label('email address'),
  phone: s('string:11!').phone('cn').label('mobile number'),
  username: s('string:3-32!').username().label('username')
};

// use directly
const registerSchema = s({
  ...commonFields, // ✅ Expand directly
  password: s('string:8-64!').password('strong')
});

const profileSchema = s({
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
  s('email!').label(label);

const createRangeField = (min, max) =>
  s(`number:${min}-${max}`).label('numeric range');

// use
const schema = s({
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
import { s } from 'schema-dsl/pure';

export default {
  email: () => s('email!').label('email address'),
  phone: (country = 'cn') => s(`string:11!`).phone(country).label('mobile number'),
  username: (range = '3-32') => s(`string:${range}!`).username(range).label('username'),
  password: (strength = 'medium') => s('string:8-64!').password(strength).label('password'),

  //Combined fields
  userAuth: () => ({
    username: s('string:3-32!').username().label('username'),
    password: s('string:8-64!').password('strong').label('password')
  }),

  userProfile: () => ({
    nickname: s('string:2-20!').label('nickname'),
    bio: 'string:500',
    avatar: 'url'
  })
};

// use
import fields from './fields/common.js';

const loginSchema = s({
  email: fields.email(),
  password: fields.password('strong')
});

const registerSchema = s({
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
import { SchemaUtils, s } from 'schema-dsl/pure';

const fields = SchemaUtils.createLibrary({
  email: () => s('email!').label('email address'),
  phone: () => s('string!').phone('cn').label('mobile number'),
  profile: () => ({
    bio: 'string:500',
    avatar: 'url'
  })
});

const registerSchema = s({
  email: fields.email(),
  phone: fields.phone(),
  password: s('string!').password('strong')
});

const profileSchema = s({
  ...fields.profile(),
  email: fields.email()
});
```

**Description**: `createLibrary()` just returns a fragment factory collection, suitable for centralized management of fields and combined fragments in large projects.

---

### extend() - extend Schema (inheritance)

```javascript
const baseUser = s({
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
const fullUser = s({
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
const fullUser = s({
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

### partial() - Make fields optional

```javascript
const updateSchema = SchemaUtils.partial(s({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
}));

// required will be removed from the results, suitable for PATCH / partial update scenarios
```

You can also make only some fields optional while preserving the rest of the schema:

```javascript
const schema = s({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
});

const partialContact = SchemaUtils.partial(schema, ['name', 'email']);
```

`partialContact` still contains `age`; only `name` and `email` are removed from the top-level `required` list. Use `SchemaUtils.pick(schema, fields).partial()` when you want a schema that contains only those fields.

`pick()` and `omit()` also project object-level `allOf`, `dependencies`, `dependentRequired`, and `dependentSchemas` constraints so removed fields cannot survive through a composition branch. Projection is intentionally rejected when it cannot preserve meaning: a projected object-level `$ref`, or an `anyOf` / `oneOf` / `if` / `then` / `else` / `not` branch that still references an omitted field, throws an explicit error instead of returning a weaker schema.

---

## Schema export

### toMarkdown() - Export to Markdown document

```javascript
const schema = s({
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email address'),
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
| username | string | ✅ | length: 3-32 | username |
| email | email | ✅ | - | email address |
| age | number | ❌ | range: 18-120 | - |
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
import { SchemaUtils, Validator, s } from 'schema-dsl/pure';

const schema = s({
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
const original = s({
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
import { s, DslBuilder } from 'schema-dsl/pure';

const schema = s({
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
import { s } from 'schema-dsl/pure';

export default {
  //Basic fields
  id: () => s('string!').pattern(/^[a-zA-Z0-9_-]+$/).label('ID'),
  email: () => s('email!').label('email address'),
  phone: (country = 'cn') => s('string:11!').phone(country).label('mobile number'),

  // Authentication field
  auth: {
    username: () => s('string:3-32!').username().label('username'),
    password: (strength = 'strong') =>
      s('string:8-64!').password(strength).label('password')
  },

  // personal information
  profile: {
    nickname: () => s('string:2-20!').label('nickname'),
    realName: () => s('string:2-50').label('real name'),
    bio: () => 'string:500',
    avatar: () => s('url').label('avatar'),
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
import fields from './libs/fields/index.js';

//User registration
const registerSchema = s({
  ...fields.auth,
  email: fields.email(),
  phone: fields.phone('cn'),
  agree: 'boolean!'
});

//User information
const profileSchema = s({
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
  email: s('email!').label('mailbox'),
  phone: s('string:11!').phone('cn')
};

const schema1 = s({ ...commonFields, ... });
const schema2 = s({ ...commonFields, ... });
```

### 2. Medium-sized projects: function reuse

```javascript
const createUserFields = (options = {}) => ({
  email: s('email!').label(options.emailLabel || 'Email'),
  phone: s('string:11!').phone(options.country || 'cn')
});

const schema = s({
  ...createUserFields({ emailLabel: 'Contact email' }),
  ...otherFields
});
```

### 3. Large-scale projects: field library

```javascript
// Unified management in fields/ directory
import fields from './fields/index.js';

const schema = s({
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
