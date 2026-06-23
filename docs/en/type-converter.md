# TypeConverter type conversion tool

## Overview

`TypeConverter` is a static utility class used to convert between JSON Schema types and various database types. It is the base dependency of all exporters.

### Core functions

- ✅ JSON Schema ↔ MongoDB BSON type conversion
- ✅ JSON Schema ↔ MySQL type conversion
- ✅ JSON Schema ↔ PostgreSQL type conversion
- ✅ Attribute name normalization (camel case ↔ underline)
- ✅ Format validation regular expression
- ✅ Schema merge and constraint extraction

---

## quick start

```javascript
import { TypeConverter } from 'schema-dsl/pure';

// Convert JSON Schema type to MongoDB type
const mongoType = TypeConverter.toMongoDBType('integer');
console.log(mongoType); // 'int'

// Convert JSON Schema type to MySQL type
const mysqlType = TypeConverter.toMySQLType('string', { maxLength: 100 });
console.log(mysqlType); // 'VARCHAR(100)'

// Convert JSON Schema type to PostgreSQL type
const pgType = TypeConverter.toPostgreSQLType('string', { format: 'date-time' });
console.log(pgType); // 'TIMESTAMP'
```

---

## API reference

### `toJSONSchemaType(nativeType)`

Convert the type identifier to a JSON Schema `type` string.

```javascript
TypeConverter.toJSONSchemaType('string');
// 'string'

TypeConverter.toJSONSchemaType('integer');
// 'integer'

TypeConverter.toJSONSchemaType('email');
// 'string'
```

---

### `toMongoDBType(jsonSchemaType)`

Convert JSON Schema type to MongoDB BSON type.

```javascript
TypeConverter.toMongoDBType('string');  // 'string'
TypeConverter.toMongoDBType('number');  // 'double'
TypeConverter.toMongoDBType('integer'); // 'int'
TypeConverter.toMongoDBType('boolean'); // 'bool'
```

---

### `toMySQLType(jsonSchemaType, schemaFragment)`

Convert JSON Schema type to MySQL data type.

```javascript
//Basic conversion
TypeConverter.toMySQLType('string');
// 'VARCHAR(255)'

//With length constraints
TypeConverter.toMySQLType('string', { maxLength: 50 });
// 'VARCHAR(50)'

// long text
TypeConverter.toMySQLType('string', { maxLength: 500 });
// 'TEXT'

// Email format
TypeConverter.toMySQLType('string', { format: 'email' });
// 'VARCHAR(255)'

// Integer range (minimum + maximum hits the TINYINT branch)
TypeConverter.toMySQLType('integer', { minimum: 0, maximum: 100 });
// 'TINYINT'
```

---

### `toPostgreSQLType(jsonSchemaType, schemaFragment)`

Convert JSON Schema type to PostgreSQL data type.

```javascript
// UUID format
TypeConverter.toPostgreSQLType('string', { format: 'uuid' });
// 'VARCHAR(255)' // The current implementation does not automatically switch to the UUID column type due to format=uuid

// date time
TypeConverter.toPostgreSQLType('string', { format: 'date-time' });
// 'TIMESTAMP'

// JSON object
TypeConverter.toPostgreSQLType('object');
// 'JSONB'
```

---

### `normalizePropertyName(name)`

Normalize attribute names: remove leading and trailing whitespace, replace illegal characters with underscores, and compress consecutive underscores.

```javascript
TypeConverter.normalizePropertyName('user name');
// 'user_name'

TypeConverter.normalizePropertyName('123created-at');
// '123created_at'
```

---

### `formatToRegex(format)`

Get the `RegExp` instance corresponding to the format; unknown format returns `null`.

```javascript
const emailRegex = TypeConverter.formatToRegex('email');
emailRegex?.test('user@example.com');
// true

const uuidRegex = TypeConverter.formatToRegex('uuid');
uuidRegex?.test('123e4567-e89b-12d3-a456-426614174000');
// true

TypeConverter.formatToRegex('unknown');
// null
```

---

### `mergeSchemas(base, override)`

Merge two JSON Schema objects.

```javascript
const base = {
  type: 'object',
  properties: { name: { type: 'string' } },
  required: ['name']
};

const override = {
  properties: { email: { type: 'string' } },
  required: ['email']
};

const merged = TypeConverter.mergeSchemas(base, override);
// {
//   type: 'object',
//   properties: { name: {...}, email: {...} },
//   required: ['name', 'email']
// }
```

---

### `extractConstraints(schema)`

Extract constraints from the Schema.

```javascript
const schema = {
  type: 'string',
  minLength: 3,
  maxLength: 32,
  pattern: '^[a-z]+$',
  format: 'email'
};

const constraints = TypeConverter.extractConstraints(schema);
// {
//   minLength: 3,
//   maxLength: 32,
//   pattern: '^[a-z]+$',
//   format: 'email'
// }
```

---

## type mapping table

### JSON Schema → MongoDB

| JSON Schema | MongoDB BSON |
|-------------|--------------|
| `string` | `string` |
| `number` | `double` |
| `integer` | `int` |
| `boolean` | `bool` |
| `object` | `object` |
| `array` | `array` |
| `null` | `null` |

### JSON Schema → MySQL

| JSON Schema | constraint | MySQL |
|-------------|------|-------|
| `string` | - | `VARCHAR(255)` |
| `string` | `maxLength: 50` | `VARCHAR(50)` |
| `string` | `maxLength: 500` | `TEXT` |
| `string` | `format: email` | `VARCHAR(255)` |
| `string` | `format: date-time` | `DATETIME` |
| `integer` | `minimum: 0, maximum: 100` | `TINYINT` |
| `integer` | `maximum: 32767` | `SMALLINT` |
| `integer` | `maximum: 2147483647` | `INT` |
| `integer` | - | `BIGINT` |
| `number` | - | `DOUBLE` |
| `boolean` | - | `BOOLEAN` |
| `object` | - | `JSON` |
| `array` | - | `JSON` |

### JSON Schema → PostgreSQL

| JSON Schema | constraint | PostgreSQL |
|-------------|------|------------|
| `string` | - | `VARCHAR(255)` |
| `string` | `maxLength: 50` | `VARCHAR(50)` |
| `string` | `maxLength: 500` | `TEXT` |
| `string` | `format: uuid` | `VARCHAR(255)` |
| `string` | `format: date` | `DATE` |
| `string` | `format: date-time` | `TIMESTAMP` |
| `integer` | - | `BIGINT` |
| `number` | - | `DOUBLE PRECISION` |
| `boolean` | - | `BOOLEAN` |
| `object` | - | `JSONB` |
| `array` | - | `JSONB` |

---

## Practical examples

### Batch type conversion

```javascript
import { TypeConverter } from 'schema-dsl/pure';

const fields = ['string', 'number', 'integer', 'boolean', 'object', 'array'];

console.log('=== type mapping comparison ===');
fields.forEach(type => {
  console.log(`${type}:`);
  console.log(`  MongoDB: ${TypeConverter.toMongoDBType(type)}`);
  console.log(`  MySQL:   ${TypeConverter.toMySQLType(type)}`);
  console.log(`  PostgreSQL: ${TypeConverter.toPostgreSQLType(type)}`);
});
```

### Format validation

```javascript
const emailRegex = TypeConverter.formatToRegex('email');
const regex = new RegExp(emailRegex);

console.log(regex.test('user@example.com'));  // true
console.log(regex.test('invalid-email'));     // false
```

---

## Related documents

- [SchemaHelper](schema-helper.md)
- [MongoDB Exporter](mongodb-exporter.md)
- [MySQL Exporter](mysql-exporter.md)
- [PostgreSQL Exporter](postgresql-exporter.md)

---

## Corresponding sample file

**Example entry**: [type-converter.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-converter.ts)
**Description**: Covers type mapping, enumeration to MySQL `ENUM(...)`, PostgreSQL actual UUID mapping, property name normalization, regex fetching, Schema merging and constraint extraction.
