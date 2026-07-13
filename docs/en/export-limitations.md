# Database export restrictions description

**IMPORTANT**: When using schema-dsl to export the database schema feature, please read this document carefully to understand which features can be exported and which are not supported.

## core principles

**schema-dsl's database export function follows the following principles**:

1. ✅ **Static structure first**: Only export fixed, static Schema definitions
2. ❌ **Dynamic logic is not exported**: Runtime conditional logic, dynamic calculations, etc. cannot be converted into database constraints
3. ⚠️ **Limited constraint mapping**: The database’s native constraint capabilities are limited, and some advanced constraints will be ignored or simplified
4. 🎯 **Type mapping is the main**: Mainly focus on type definition and basic constraints (length, range, required, etc.)

---

## Exported features are not supported

The following schema-dsl attributes cannot be exported to a database schema (will be ignored):

### 1. Conditional validation logic ❌

#### `s.match()` - conditional field mapping

```javascript
// ❌ Unable to export
const schema = s({
  contactType: 'email|phone',
  contact: s.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});
```

**Cause**: The database does not support the dynamic constraint of "determine B field type based on A field value".

**Alternatives**:
- Export as loosest type (`VARCHAR(255)`)
- Validation logic remains at the application layer (using the schema-dsl validator)

---

#### `s.if()` - Conditional validation

```javascript
// ❌ Unable to export
const schema = s({
  isVip: 'boolean',
  discount: s.if('isVip', 'number:10-100!', 'number:0-10')
});
```

**Cause**: Same as above, the database does not support conditional constraints.

---

### 2. Complex JSON Schema keywords ❌

The following JSON Schema advanced features cannot be exported:

| Keywords | Description | export behavior |
|--------|------|----------|
| `allOf` | All Schemas are satisfied | ❌ ignore |
| `anyOf` | Meet any Schema | ⚠️ Can only be exported if all branches are mapped to the same SQL type; otherwise an error will be thrown |
| `oneOf` | Only satisfies one Schema | ⚠️ Can only be exported if all branches are mapped to the same SQL type; otherwise an error will be thrown |
| `not` | Does not satisfy a certain Schema | ❌ ignore |
| `if/then/else` | Condition Schema | ❌ ignore |
| `dependencies` | Field dependencies | ❌ ignore |

**Example**:

```javascript
// ⚠️ These structures cannot be stably exported directly to a single SQL column type
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

**Current Behavior**:

- `ipv4 | ipv6` All branches of this type are ultimately mapped to unions of the same SQL column type and can still be exported
- `string | number` This type will fall into the union of different SQL column types. The MySQL / PostgreSQL exporter will **explicitly throw an error** instead of silently fetching the first item

---

### 3. Custom validator ❌

```javascript
// ❌ Custom validator cannot be exported
const schema = s('string:3-32!')
  .custom((value) => value.startsWith('USER_'))
  .messages({ 'string.custom': 'Must start with USER_' });
```

**Cause**: The database cannot execute the JavaScript function.

**Alternatives**:
- Use `pattern` regular expression if expressible
- Validation logic remains in the application layer

---

### 4. Customize error messages ❌

```javascript
// ❌ Error message cannot be exported
const schema = s('email!')
  .messages({
    'string.format': 'Please enter a valid email address'
  })
  .label('User Email');
```

**Export Behavior**:
- ✅ `label()` will be exported as `COMMENT` (MySQL/PostgreSQL)
- ❌ `messages()` will be ignored (the database does not store error messages)

---

### 5. Depth constraints of nested objects ⚠️

```javascript
// ⚠️ Nested objects will be simplified to JSON/JSONB types
const schema = s({
  profile: {
    bio: 'string:500',
    avatar: 'url',
    social: {
      twitter: 'url',
      github: 'url'
    }
  }
});
```

**Export Behavior**:
- MongoDB: ✅ Full support for nested validation
- MySQL: ❌ exported as `JSON` type, internal constraints are lost
- PostgreSQL: ❌ exported as `JSONB` type, internal constraints lost

---

## Partially supported features

The following features are supported to varying degrees in different databases:

### 1. Regular expression constraints ⚠️

```javascript
const schema = s('string!')
  .pattern(/^[A-Z][a-z]+$/);
```

| database | level of support | Export results |
|--------|----------|----------|
| MongoDB | ✅ Fully supported | `pattern: "^[A-Z][a-z]+$"` |
| MySQL | ❌ Not supported | neglect |
| PostgreSQL | ❌ Not supported | neglect |

**Note**: MySQL and PostgreSQL do not have native regular constraints and need to be validated at the application layer.

---

### 2. Numerical range constraints ⚠️

```javascript
const schema = s('number:18-120');
```

| database | level of support | Export results |
|--------|----------|----------|
| MongoDB | ✅ Fully supported | `minimum: 18, maximum: 120` |
| MySQL | ❌ Not supported | neglect |
| PostgreSQL | ✅ Support | `CHECK (age BETWEEN 18 AND 120)` |

---

### 3. String length constraint ⚠️

```javascript
const schema = s('string:3-32');
```

| database | level of support | Export results |
|--------|----------|----------|
| MongoDB | ✅ Fully supported | `minLength: 3, maxLength: 32` |
| MySQL | ⚠️ maxLength only | `VARCHAR(32)` |
| PostgreSQL | ✅ Fully supported | `VARCHAR(32) CHECK (LENGTH(...) >= 3)` |

---

### 4. Enumeration constraints ⚠️

```javascript
const schema = s('active|inactive|banned');
```

| database | level of support | Export results |
|--------|----------|----------|
| MongoDB | ✅ Fully supported | `enum: ['active', 'inactive', 'banned']` |
| MySQL | ❌ Not supported | `VARCHAR(255)` |
| PostgreSQL | ✅ Support | `CHECK (status IN (...))` |

---

### 5. Array constraints ⚠️

```javascript
const schema = s('array!1-10<string:3-32>');
```

| database | level of support | Export results |
|--------|----------|----------|
| MongoDB | ✅ Fully supported | `type: array, minItems: 1, maxItems: 10, items: {...}` |
| MySQL | ❌ Simplify | `JSON` |
| PostgreSQL | ❌ Simplify | `JSONB` |

---

## Fully supported features

The following properties export well in all databases:

### ✅ Basic type

```javascript
s({
  name: 'string!',
  age: 'number',
  active: 'boolean',
  createdAt: 'datetime!'
})
```

**All databases support type mapping**.

---

### ✅Required constraints

```javascript
s({
  email: 'email!', // required
  phone: 'phone:cn' // optional
})
```

**Export as**:
- MongoDB: `required: ['email']`
- MySQL/PostgreSQL: `NOT NULL` / `NULL`

---

### ✅ Default value (MySQL/PostgreSQL only)

```javascript
const schema = s('boolean')
  .default(false);
```

**Export as**:
- MongoDB: ❌ Not supported `default`
- MySQL/PostgreSQL: ✅ `DEFAULT false`

---

### ✅ Field description

```javascript
const schema = s('string!')
  .description('User login name');
```

**Export as**:
- MongoDB: `description: "User login name"`
- MySQL: `COMMENT 'User login name'`
- PostgreSQL: `COMMENT ON COLUMN... IS 'User login name'`

---

## Database specific restrictions

### MongoDB

| limit | Description |
|------|------|
| ❌ Not supported `default` | MongoDB JSON Schema does not support default values |
| ❌ Does not support foreign keys | Referential integrity needs to be implemented at the application layer |
| ✅ The most complete constraint support | Regular, range, enumeration, and array constraints are all supported |

---

### MySQL

| limit | Description |
|------|------|
| ❌ Does not support regular expressions | Unable to export `pattern` constraint |
| ❌ Numeric range is not supported | Unable to export `minimum/maximum` |
| ❌ Enumeration CHECK is not supported | Enumerations are exported as normal `VARCHAR` |
| ⚠️ The string length is only maxLength | `minLength` will be ignored |
| ❌ Object/array reduced to JSON | Internal structural constraints are lost |

---

### PostgreSQL

| limit | Description |
|------|------|
| ❌ Does not support regular expressions | Unable to export `pattern` constraint |
| ✅Support CHECK constraints | Exportable ranges, enumerations, length constraints |
| ❌ Object/array simplified to JSONB | Internal structural constraints are lost |
| ✅ Full annotation support | `COMMENT ON COLUMN` |

---

## Best practice recommendations

### 1. Hierarchical validation strategy 🎯

```text
┌─────────────────────────────────────────┐
│ Application layer (schema-dsl complete validation) │
│ - Conditional logic (match/if) │
│ - Custom validator │
│ - Complex constraints (regular, range, etc.) │
│ - Friendly error messages │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│ Database layer (basic constraints) │
│ - Type definition (string/number/boolean) │
│ - NOT NULL constraint │
│ - Primary key/foreign key │
│ - Simple length limit (maxLength) │
└─────────────────────────────────────────┘
```

**in principle**:
- Database: The last line of defense against data corruption
- Application layer: complete business logic validation

---

### 2. Clarify expectations before exporting 📋

Before using the export function, please check whether the Schema contains unsupported features:

```javascript
import { s, exporters } from 'schema-dsl/pure';

// ❌ Schema not suitable for export (contains conditional logic)
const conditionalSchema = s({
  type: 'email|phone',
  value: s.match('type', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

// ✅ Schema suitable for export (static definition)
const staticSchema = s({
  id: 'uuid!',
  email: 'email!',
  phone: 'string:11',
  status: 'active|inactive',
  createdAt: 'datetime!'
});

// Understand the restrictions before exporting
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', staticSchema);
```

---

### 3. Use descriptions to illustrate constraints 📝

For constraints that cannot be exported, use `description()` to leave a description in the database:

```javascript
const schema = s('string!')
  .pattern(/^[A-Z][a-z]+$/)
  .description('The first letter is capitalized, the rest are lowercase (regular: ^[A-Z][a-z]+$)');
```

**Export as**:

```sql
-- MySQL
`name` VARCHAR(255) NOT NULL COMMENT 'The first letter is capitalized, the rest are lowercase (regular: ^[A-Z][a-z]+$)'

-- PostgreSQL
COMMENT ON COLUMN users.name IS 'The first letter is capitalized, the rest are lowercase (regular: ^[A-Z][a-z]+$)';
```

---

### 4. Keep the complete Schema definition 💾

```javascript
// schemas/user.js
import { s } from 'schema-dsl/pure';

// Complete definition (including all validation logic)
const userSchema = s({
  username: s('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'string.pattern': 'Can only contain alphanumeric underscores' })
    .description('User login name'),

  contactType: 'email|phone',
  contact: s.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

export const userSchemas = {
  // The application layer uses the complete Schema
  full: userSchema,

  // Database export uses simplified Schema
  db: s({
    username: s('string:3-32!').description('User login name'),
    contactType: 'email|phone',
    contact: s('string!').description('Email or mobile phone number (according to contactType)')
  })
};
```

---

### 5. Documented incompatible features 📖

Clearly state in the project documentation which validation logic does not take effect at the database layer:

```markdown
## Data validation instructions

### Application layer validation (schema-dsl)
- ✅ `contact` field is dynamically validated based on `contactType`
- ✅ Username regular validation (`^[a-zA-Z0-9_]+$`)
- ✅ Custom business rule validation

### Database layer constraints
- ✅ `username` length limit (3-32 characters)
- ✅ Required field constraints
- ❌ Dynamic type validation (depends on application layer)
- ❌ Regular expression validation (depends on application layer)
```

---

## FAQ

### Q1: Why can't `s.match()` be exported?

**A**: The database does not support the dynamic constraint of "determining the type of field B based on the value of field A". The database schema is fixed when it is created and cannot be changed at runtime.

**Solution**:
- Export to the loosest type (e.g. `VARCHAR(255)`)
- Application layer uses full Schema validation

---

### Q2: MySQL does not support regular expressions, what should I do?

**A**: MySQL's `CHECK` constraint does not support regular expressions.

**Solution**:
1. Application layer authentication (recommended)
2. Use triggers (not recommended, complex and difficult to maintain)
3. Specify constraint rules in `COMMENT`

---

### Q3: Constraints lost after nested objects are exported?

**A**: MySQL/PostgreSQL exports nested objects as `JSON`/`JSONB` types, and internal constraints cannot be expressed.

**Solution**:
- MongoDB: Full support for nested validation
- MySQL/PostgreSQL: Application Layer Authentication

---

### Q4: How to check whether the Schema is suitable for export?

**A**: The following features are **not suitable** for export:

```javascript
// ❌ Contains conditional logic
s.match(...)
s.if(...)

// ❌ Contains custom validators
.custom(...)

// ❌ Complex allOf/anyOf/oneOf
{ allOf: [...] }
```

**Features suitable for export**:

```javascript
// ✅ Basic type + simple constraints
s('string:3-32!')
s('number:0-100')
s('email!')
s('active|inactive|banned')
```

---

## Summarize

| characteristic | MongoDB | MySQL | PostgreSQL |
|------|---------|-------|------------|
| base type | ✅ | ✅ | ✅ |
| Required constraints | ✅ | ✅ | ✅ |
| length constraint | ✅ | ⚠️ max only | ✅ |
| Numeric range | ✅ | ❌ | ✅ |
| regular expression | ✅ | ❌ | ❌ |
| enumerate | ✅ | ❌ | ✅ |
| conditional logic | ❌ | ❌ | ❌ |
| Custom validator | ❌ | ❌ | ❌ |
| Nested objects | ✅ | ⚠️ JSON | ⚠️ JSONB |
| Field description | ✅ | ✅ | ✅ |

---

## Related documents

- [Database Export Guide](export-guide.md)
- [MongoDB Exporter](mongodb-exporter.md)
- [MySQL Exporter](mysql-exporter.md)
- [PostgreSQL Exporter](postgresql-exporter.md)
- [Best Practice](best-practices.md)

---

## Corresponding sample file

**Example entry**: [export-limitations.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/export-limitations.ts)
**Description**: Shows the division of labor between "complete application layer schema" and "database export-specific simplified schema", as well as the implementation results of the three types of exporters on static schemas.
