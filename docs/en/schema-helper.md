# SchemaHelper Schema helper

## Overview

`SchemaHelper` is a static tool class that provides auxiliary methods for various Schema operations, including validation, cloning, flattening, comparison and other functions.

### Core functions

- ✅ Verify Schema validity
- ✅ Generate Schema unique ID
- ✅ Deep Clone Schema
- ✅ Flat nested Schema
- ✅ Extract all field paths
- ✅ Extract required fields
- ✅ Compare two Schemas
- ✅ Calculate Schema complexity
- ✅ Generate Schema summary

---

## quick start

```javascript
import { SchemaHelper, s } from 'schema-dsl/pure';

//Create Schema
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  profile: {
    bio: 'string:500',
    avatar: 'url'
  }
});

// Get Schema summary
const summary = SchemaHelper.summarizeSchema(userSchema);
console.log(summary);
// {
//   type: 'object',
//   fieldCount: 4,
//   requiredCount: 2,
//   complexity: 1,
//   hasNested: true,
//   fields: ['username', 'email', 'profile.bio', 'profile.avatar']
// }
```

---

## API reference

### `isValidSchema(schema)`

Check if it is a valid JSON Schema.

```javascript
SchemaHelper.isValidSchema({ type: 'string' });        // true
SchemaHelper.isValidSchema({ properties: {} });        // true
SchemaHelper.isValidSchema(true);                      // true
SchemaHelper.isValidSchema({ const: 1 });              // true
SchemaHelper.isValidSchema({ format: 'email' });       // true
SchemaHelper.isValidSchema({});                        // false
SchemaHelper.isValidSchema(null);                      // false
```

**Judgment Criteria**: Boolean schemas are accepted. Object schemas must contain at least one recognized JSON Schema keyword such as `type`, `properties`, `items`, `$ref`, `const`, `not`, `if`/`then`, `format`, or `pattern`.

---

### `generateSchemaId(schema)`

Generate a unique ID for the Schema (based on the content hash).

```javascript
const id = SchemaHelper.generateSchemaId(userSchema);
console.log(id); // 'schema_1a2b3c4d'
```

**Purpose**: Caching, deduplication, unique identification.

---

### `cloneSchema(schema)`

Deep clone Schema objects.

```javascript
const cloned = SchemaHelper.cloneSchema(userSchema);

// Modifying the clone does not affect the original object
cloned.properties.newField = { type: 'string' };
console.log(userSchema.properties.newField); // undefined
```

---

### `flattenSchema(schema, prefix)`

Flatten nested schemas.

```javascript
const schema = s({
  user: {
    name: 'string!',
    address: {
      city: 'string!',
      zip: 'string'
    }
  }
});

const flat = SchemaHelper.flattenSchema(schema);
// {
//   'user.name': { type: 'string' },
//   'user.address.city': { type: 'string' },
//   'user.address.zip': { type: 'string' }
// }
```

---

### `getFieldPaths(schema)`

Get all field paths in Schema.

```javascript
const paths = SchemaHelper.getFieldPaths(userSchema);
// ['username', 'email', 'profile', 'profile.bio', 'profile.avatar']
```

**Array field**: represented by `[]`, such as `items[].name`

---

### `extractRequiredFields(schema)`

Extract all required fields in the Schema (including nested ones).

```javascript
const required = SchemaHelper.extractRequiredFields(userSchema);
// ['username', 'email']
```

---

### `compareSchemas(schema1, schema2)`

Compare two Schemas to see if they are the same.

```javascript
const schema1 = s({ name: 'string!' });
const schema2 = s({ name: 'string!' });
const schema3 = s({ name: 'string' });

SchemaHelper.compareSchemas(schema1, schema2); // true
SchemaHelper.compareSchemas(schema1, schema3); // false
```

---

### `simplifySchema(schema)`

Simplify Schema (remove unnecessary fields).

```javascript
const schema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  properties: {},
  required: []
};

const simplified = SchemaHelper.simplifySchema(schema);
// { type: 'object' }
```

**Content removed**: `$schema`, empty `properties`, empty `required`

---

### `isValidPropertyName(name)`

Verify that the attribute name is legal.

```javascript
SchemaHelper.isValidPropertyName('userName');     // true
SchemaHelper.isValidPropertyName('user_name');    // true
SchemaHelper.isValidPropertyName('user-name');    // true
SchemaHelper.isValidPropertyName('123name');      // false
SchemaHelper.isValidPropertyName('user name');    // false
```

**Rules**: Start with a letter or underscore, and can only contain letters, numbers, underscores, and hyphens.

---

### `getSchemaComplexity(schema)`

Get the Schema's complexity (maximum nesting level).

```javascript
// no nesting
const simple = s({ name: 'string!' });
SchemaHelper.getSchemaComplexity(simple); // 0

// One level of nesting
const nested = s({
  user: {
    name: 'string!'
  }
});
SchemaHelper.getSchemaComplexity(nested); // 1

//Multiple levels of nesting
const deep = s({
  level1: {
    level2: {
      level3: 'string!'
    }
  }
});
SchemaHelper.getSchemaComplexity(deep); // 2
```

---

### `summarizeSchema(schema)`

Generate Schema summary information.

```javascript
const summary = SchemaHelper.summarizeSchema(userSchema);
// {
//   type: 'object',
//   fieldCount: 4,
//   requiredCount: 2,
//   complexity: 1,
//   hasNested: true,
//   fields: ['username', 'email', 'profile.bio', 'profile.avatar']
// }
```

**Use**: debugging, logging, document generation.

---

## Practical examples

### Schema analysis tools

```javascript
import { SchemaHelper, s } from 'schema-dsl/pure';

function analyzeSchema(schema, name = 'Schema') {
  console.log(`\n=== ${name} analysis ===`);

  // Validity check
  if (!SchemaHelper.isValidSchema(schema)) {
    console.log('❌ Invalid Schema');
    return;
  }

  // Generate summary
  const summary = SchemaHelper.summarizeSchema(schema);
  console.log(`Type: ${summary.type}`);
  console.log(`Number of fields: ${summary.fieldCount}`);
  console.log(`required count: ${summary.requiredCount}`);
  console.log(`Nesting level: ${summary.complexity}`);
  console.log(`Field list: ${summary.fields.join(', ')}`);

  // required fields
  const required = SchemaHelper.extractRequiredFields(schema);
  console.log(`Required fields: ${required.join(', ') || 'None'}`);

  // unique ID
  console.log(`Schema ID: ${SchemaHelper.generateSchemaId(schema)}`);
}

// use
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  profile: {
    bio: 'string:500',
    avatar: 'url'
  }
});

analyzeSchema(userSchema, 'User Schema');
```

### Schema version comparison

```javascript
function compareSchemaVersions(oldSchema, newSchema) {
  if (SchemaHelper.compareSchemas(oldSchema, newSchema)) {
    console.log('✅ Schema unchanged');
    return;
  }

  const oldFields = new Set(SchemaHelper.getFieldPaths(oldSchema));
  const newFields = new Set(SchemaHelper.getFieldPaths(newSchema));

  //Add new field
  const added = [...newFields].filter(f => !oldFields.has(f));
  if (added.length) {
    console.log('➕ New field:', added.join(', '));
  }

  // delete field
  const removed = [...oldFields].filter(f => !newFields.has(f));
  if (removed.length) {
    console.log('➖ Remove field:', removed.join(', '));
  }
}
```

---

## Related documents

- [TypeConverter](type-converter.md)
- [SchemaUtils](schema-utils.md)
- [API Reference](api-reference.md)

---

## Corresponding sample file

**Example entry**: [schema-helper.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/schema-helper.ts)
**Description**: Covers `isValidSchema()`, `generateSchemaId()`, `flattenSchema()`, `extractRequiredFields()`, `summarizeSchema()` and `compareSchemas()`.
