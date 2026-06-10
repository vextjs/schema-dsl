# Complete guide to exporting

> **PURPOSE**: A complete guide to exporting Schema to multiple output formats
> **Reading time**: 10 minutes

> ⚠️ **IMPORTANT**: Not all schema-dsl features can be exported to the database. Please read the [Export Restrictions Description](export-limitations.md) first to learn which features are not supported for export.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [MongoDB Export](#mongodb-export)
- [MySQL Export](#mysql-export)
- [PostgreSQL Export](#postgresql-export)
- [Markdown export](#markdown-export)
- [Export comparison](#export-comparison)
- [Best Practice](#best-practices)

---

## Overview

schema-dsl supports exporting JSON Schema into a variety of database structures or document formats to achieve "define once, use in many places".

### Supported export formats

| type | exporter | Output format |
|------|--------|----------|
| MongoDB | `MongoDBExporter` | `$jsonSchema` Validation document |
| MySQL | `MySQLExporter` | `CREATE TABLE` DDL |
| PostgreSQL | `PostgreSQLExporter` | `CREATE TABLE` DDL + COMMENT |
| Markdown | `MarkdownExporter` | Markdown document for human reading |

Among them, `MarkdownExporter` is more suitable for generating interface field descriptions, form documents or internal specification documents. For complete usage, see [Markdown Exporter](./markdown-exporter.md).

---

## quick start

```javascript
const { dsl, exporters } = require('schema-dsl');

//Define a unified Schema
const userSchema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .description('User login name'),
  email: 'email!'
    .description('User Email'),
  age: 'number:18-120',
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

//Export to different targets
const mongoSchema = new exporters.MongoDBExporter().export(userSchema);
const mysqlDdl = new exporters.MySQLExporter().export('users', userSchema);
const pgDdl = new exporters.PostgreSQLExporter().export('users', userSchema);
const markdownDoc = exporters.MarkdownExporter.export(userSchema, {
  title: 'User Schema Document'
});
```

---

## Markdown export

If your goal is not a database, but to generate a directly readable field description document for R&D, testing, product or interface users, you can use `MarkdownExporter`:

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!'.description('Login account'),
  email: 'email!'.description('Contact email'),
  age: 'number:18-120'.description('age')
});

const markdown = exporters.MarkdownExporter.export(schema, {
  title: 'User registration field description',
  locale: 'zh-CN'
});

console.log(markdown);
```

For a more complete description of options, examples, and multilingual output, see [Markdown Exporter](./markdown-exporter.md).

---

## MongoDB export

### Basic usage

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(schema);

console.log(JSON.stringify(mongoSchema, null, 2));
```

**Output**:

```json
{
  "$jsonSchema": {
    "bsonType": "object",
    "required": ["username", "email"],
    "properties": {
      "username": {
        "bsonType": "string",
        "minLength": 3,
        "maxLength": 32
      },
      "email": {
        "bsonType": "string"
      },
      "age": {
        "bsonType": "double",
        "minimum": 18,
        "maximum": 120
      }
    }
  }
}
```

### Generate create command

```javascript
const command = exporter.generateCommand('users', schema);
console.log(command);
```

**Output**:

```javascript
db.createCollection("users", {
  "validator": {
    "$jsonSchema": { ... }
  },
  "validationLevel": "moderate",
  "validationAction": "error"
})
```

### Used in MongoDB

```javascript
const { MongoClient } = require('mongodb');

async function setupCollection() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('myapp');
  const exporter = new exporters.MongoDBExporter({ strict: true });
  const { options } = exporter.generateCreateCommand('users', schema);

  await db.createCollection('users', options);
  console.log('Create collection with validation successfully');
}
```

---

## MySQL export

### Basic usage

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  id: 'string!',
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:0-150',
  status: 'active|inactive'
});

const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', schema);

console.log(ddl);
```

**Output**:

```sql
CREATE TABLE `users` (
  `id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(32) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `age` DOUBLE NULL,
  `status` VARCHAR(255) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Configuration options

```javascript
const exporter = new exporters.MySQLExporter({
  engine: 'InnoDB', // storage engine
  charset: 'utf8mb4', // character set
  collate: 'utf8mb4_unicode_ci' // Collation rules
});
```

### Generate index

```javascript
// unique index
console.log(exporter.generateIndex('users', 'email', { unique: true }));
// CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);

// Ordinary index
console.log(exporter.generateIndex('users', 'status'));
// CREATE INDEX `idx_users_status` ON `users` (`status`);
```

---

## PostgreSQL export

### Basic usage

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'
    .description('User login name'),
  email: 'email!'
    .description('User Email'),
  age: 'number:18-120',
  status: 'active|inactive|banned',
  metadata: {
    lastLogin: 'datetime',
    preferences: 'object'
  }
});

const exporter = new exporters.PostgreSQLExporter();
const ddl = exporter.export('users', schema);

console.log(ddl);
```

**Output**:

```sql
CREATE TABLE public.users (
  id UUID NOT NULL,
  username VARCHAR(32) NOT NULL CHECK (LENGTH(username) BETWEEN 3 AND 32),
  email VARCHAR(255) NOT NULL,
  age DOUBLE PRECISION CHECK (age BETWEEN 18 AND 120),
  status VARCHAR(255) CHECK (status IN ('active', 'inactive', 'banned')),
  metadata JSONB,
  PRIMARY KEY (id)
);

COMMENT ON COLUMN public.users.username IS 'User login name';
COMMENT ON COLUMN public.users.email IS 'User Email';
```

### Configuration options

```javascript
const exporter = new exporters.PostgreSQLExporter({
  schema: 'myapp' // PostgreSQL schema name
});
```

### Generate index

```javascript
// B-tree index (default)
console.log(exporter.generateIndex('users', 'email', { unique: true }));
// CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);

// GIN index (for JSONB)
console.log(exporter.generateIndex('users', 'metadata', { method: 'gin' }));
// CREATE INDEX idx_users_metadata ON public.users USING gin (metadata);
```

---

## Export comparison

### Three exports of the same Schema

```javascript
const schema = dsl({
  id: 'uuid!',
  name: 'string:3-100!',
  score: 'number:0-100',
  tags: 'array<string>',
  active: 'boolean'
});
```

| Field | MongoDB | MySQL | PostgreSQL |
|------|---------|-------|------------|
| `id` | `bsonType: 'string'` | `VARCHAR(255) NOT NULL` | `UUID NOT NULL` |
| `name` | `bsonType: 'string', minLength: 3, maxLength: 100` | `VARCHAR(100) NOT NULL` | `VARCHAR(100) NOT NULL CHECK (...)` |
| `score` | `bsonType: 'double', minimum: 0, maximum: 100` | `DOUBLE NULL` | `DOUBLE PRECISION CHECK (...)` |
| `tags` | `bsonType: 'array', items: {...}` | `JSON NULL` | `JSONB` |
| `active` | `bsonType: 'bool'` | `BOOLEAN NULL` | `BOOLEAN` |

### Constraint support comparison

| constraint type | MongoDB | MySQL | PostgreSQL |
|---------|---------|-------|------------|
| NOT NULL | ✅ `required` | ✅ `NOT NULL` | ✅ `NOT NULL` |
| length range | ✅ `minLength/maxLength` | ❌ | ✅ `CHECK` |
| Numeric range | ✅ `minimum/maximum` | ❌ | ✅ `CHECK` |
| enumerate | ✅ `enum` | ❌ | ✅ `CHECK` |
| regular | ✅ `pattern` | ❌ | ❌ |
| default value | ❌ | ✅ `DEFAULT` | ✅ `DEFAULT` |
| Comment | ❌ | ✅ `COMMENT` | ✅ `COMMENT ON` |

---

## best practices

### 1. Use description to add comments

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .description('User login name, can only contain alphanumeric and underscore'),
  email: 'email!'
    .description('User email, used to log in and receive notifications')
});

// MySQL and PostgreSQL generate annotated DDL
```

### 2. Unified definition, exported in multiple places

```javascript
// schemas/user.js
const { dsl } = require('schema-dsl');

module.exports = dsl({
  id: 'uuid!',
  username: 'string:3-32!',
  email: 'email!',
  createdAt: 'datetime!'
});

// Export script
const { exporters } = require('schema-dsl');
const userSchema = require('./schemas/user');

// Generate DDL for all databases
const outputs = {
  mongo: new exporters.MongoDBExporter().generateCommand('users', userSchema),
  mysql: new exporters.MySQLExporter().export('users', userSchema),
  postgres: new exporters.PostgreSQLExporter().export('users', userSchema)
};
```

### 3. Automated migration script

```javascript
const fs = require('fs');
const { dsl, exporters } = require('schema-dsl');

function generateMigration(schemaName, schema) {
  const mysql = new exporters.MySQLExporter();
  const pg = new exporters.PostgreSQLExporter();

  const timestamp = Date.now();

  // Generate MySQL migration
  fs.writeFileSync(
    `migrations/${timestamp}_create_${schemaName}.mysql.sql`,
    mysql.export(schemaName, schema)
  );

  // Generate PostgreSQL migrations
  fs.writeFileSync(
    `migrations/${timestamp}_create_${schemaName}.pg.sql`,
    pg.export(schemaName, schema)
  );

  console.log(`Generate migration file: ${schemaName}`);
}

generateMigration('users', userSchema);
generateMigration('orders', orderSchema);
```

### 4. Version management

```javascript
//Add version information in Schema
const userSchemaV1 = dsl({ username: 'string!' });
const userSchemaV2 = dsl({ username: 'string:3-32!', email: 'email!' });

// Mark version when exporting
function exportWithVersion(name, schema, version) {
  const ddl = new exporters.MySQLExporter().export(name, schema);
  return `-- Schema Version: ${version}\n-- Generated: ${new Date().toISOString()}\n\n${ddl}`;
}
```

---

## Complete example

### E-commerce system Schema export

```javascript
const { dsl, exporters } = require('schema-dsl');
const fs = require('fs');

//User Schema
const userSchema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'.description('username'),
  email: 'email!'.description('mailbox'),
  phone: 'string:11'.phone('cn').description('mobile number'),
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// Product Schema
const productSchema = dsl({
  id: 'uuid!',
  name: 'string:3-200!'.description('product name'),
  price: 'number:0-'.description('price'),
  stock: 'integer:0-'.description('stock'),
  category: 'string:2-50!',
  tags: 'array<string>',
  active: 'boolean'
});

// Order Schema
const orderSchema = dsl({
  id: 'uuid!',
  userId: 'uuid!',
  items: 'array!1-100',
  totalAmount: 'number:0-!',
  status: 'pending|paid|shipped|delivered|cancelled',
  createdAt: 'datetime!',
  updatedAt: 'datetime'
});

// Export all Schemas
const schemas = { users: userSchema, products: productSchema, orders: orderSchema };
const mysqlExporter = new exporters.MySQLExporter();
const pgExporter = new exporters.PostgreSQLExporter({ schema: 'ecommerce' });

let mysqlDdl = '';
let pgDdl = '';

for (const [name, schema] of Object.entries(schemas)) {
  mysqlDdl += mysqlExporter.export(name, schema) + '\n\n';
  pgDdl += pgExporter.export(name, schema) + '\n\n';
}

fs.writeFileSync('schema.mysql.sql', mysqlDdl);
fs.writeFileSync('schema.pg.sql', pgDdl);

console.log('Export completed!');
```

---

## Related documents

- [**Export Restrictions**](export-limitations.md) ⚠️ **Must Read**
- [MongoDB Exporter](mongodb-exporter.md)
- [MySQL Exporter](mysql-exporter.md)
- [PostgreSQL Exporter](postgresql-exporter.md)
- [TypeConverter](type-converter.md)
- [DSL syntax](dsl-syntax.md)

---

## Corresponding sample file

**Example entry**: [export-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/export-guide.ts)
**Description**: A minimal workflow that covers the same set of schemas and simultaneously exports to MongoDB, MySQL and PostgreSQL, making it easy to compare the results of multiple exporters.
