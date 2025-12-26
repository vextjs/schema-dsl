# 数据库导出完整指南

> **用途**: Schema 到数据库 DDL 的完整导出指南  
> **阅读时间**: 10分钟

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [MongoDB 导出](#mongodb-导出)
- [MySQL 导出](#mysql-导出)
- [PostgreSQL 导出](#postgresql-导出)
- [导出对比](#导出对比)
- [最佳实践](#最佳实践)

---

## 概述

SchemaIO 支持将 JSON Schema 导出为多种数据库的 DDL 语句，实现"一次定义，多处使用"。

### 支持的数据库

| 数据库 | 导出器 | 输出格式 |
|--------|--------|----------|
| MongoDB | `MongoDBExporter` | `$jsonSchema` 验证文档 |
| MySQL | `MySQLExporter` | `CREATE TABLE` DDL |
| PostgreSQL | `PostgreSQLExporter` | `CREATE TABLE` DDL + COMMENT |

---

## 快速开始

```javascript
const { dsl, exporters } = require('schemaio');

// 定义统一的 Schema
const userSchema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .description('用户登录名'),
  email: 'email!'
    .description('用户邮箱'),
  age: 'number:18-120',
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// 导出到不同数据库
const mongoSchema = new exporters.MongoDBExporter().export(userSchema);
const mysqlDdl = new exporters.MySQLExporter().export('users', userSchema);
const pgDdl = new exporters.PostgreSQLExporter().export('users', userSchema);
```

---

## MongoDB 导出

### 基本用法

```javascript
const { dsl, exporters } = require('schemaio');

const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

const exporter = new exporters.MongoDBExporter();
const mongoSchema = exporter.export(schema);

console.log(JSON.stringify(mongoSchema, null, 2));
```

**输出**：

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

### 生成创建命令

```javascript
const command = exporter.generateCommand('users', schema);
console.log(command);
```

**输出**：

```javascript
db.createCollection("users", {
  "validator": {
    "$jsonSchema": { ... }
  },
  "validationLevel": "moderate",
  "validationAction": "error"
})
```

### 在 MongoDB 中使用

```javascript
const { MongoClient } = require('mongodb');

async function setupCollection() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('myapp');
  const exporter = new exporters.MongoDBExporter({ strict: true });
  const { options } = exporter.generateCreateCommand('users', schema);

  await db.createCollection('users', options);
  console.log('创建带验证的集合成功');
}
```

---

## MySQL 导出

### 基本用法

```javascript
const { dsl, exporters } = require('schemaio');

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

**输出**：

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

### 配置选项

```javascript
const exporter = new exporters.MySQLExporter({
  engine: 'InnoDB',           // 存储引擎
  charset: 'utf8mb4',         // 字符集
  collate: 'utf8mb4_unicode_ci'  // 排序规则
});
```

### 生成索引

```javascript
// 唯一索引
console.log(exporter.generateIndex('users', 'email', { unique: true }));
// CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);

// 普通索引
console.log(exporter.generateIndex('users', 'status'));
// CREATE INDEX `idx_users_status` ON `users` (`status`);
```

---

## PostgreSQL 导出

### 基本用法

```javascript
const { dsl, exporters } = require('schemaio');

const schema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'
    .description('用户登录名'),
  email: 'email!'
    .description('用户邮箱'),
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

**输出**：

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

COMMENT ON COLUMN public.users.username IS '用户登录名';
COMMENT ON COLUMN public.users.email IS '用户邮箱';
```

### 配置选项

```javascript
const exporter = new exporters.PostgreSQLExporter({
  schema: 'myapp'  // PostgreSQL schema 名称
});
```

### 生成索引

```javascript
// B-tree 索引（默认）
console.log(exporter.generateIndex('users', 'email', { unique: true }));
// CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);

// GIN 索引（用于 JSONB）
console.log(exporter.generateIndex('users', 'metadata', { method: 'gin' }));
// CREATE INDEX idx_users_metadata ON public.users USING gin (metadata);
```

---

## 导出对比

### 同一 Schema 的三种导出

```javascript
const schema = dsl({
  id: 'uuid!',
  name: 'string:3-100!',
  score: 'number:0-100',
  tags: 'array<string>',
  active: 'boolean'
});
```

| 字段 | MongoDB | MySQL | PostgreSQL |
|------|---------|-------|------------|
| `id` | `bsonType: 'string'` | `VARCHAR(255) NOT NULL` | `UUID NOT NULL` |
| `name` | `bsonType: 'string', minLength: 3, maxLength: 100` | `VARCHAR(100) NOT NULL` | `VARCHAR(100) NOT NULL CHECK (...)` |
| `score` | `bsonType: 'double', minimum: 0, maximum: 100` | `DOUBLE NULL` | `DOUBLE PRECISION CHECK (...)` |
| `tags` | `bsonType: 'array', items: {...}` | `JSON NULL` | `JSONB` |
| `active` | `bsonType: 'bool'` | `BOOLEAN NULL` | `BOOLEAN` |

### 约束支持对比

| 约束类型 | MongoDB | MySQL | PostgreSQL |
|---------|---------|-------|------------|
| NOT NULL | ✅ `required` | ✅ `NOT NULL` | ✅ `NOT NULL` |
| 长度范围 | ✅ `minLength/maxLength` | ❌ | ✅ `CHECK` |
| 数值范围 | ✅ `minimum/maximum` | ❌ | ✅ `CHECK` |
| 枚举 | ✅ `enum` | ❌ | ✅ `CHECK` |
| 正则 | ✅ `pattern` | ❌ | ❌ |
| 默认值 | ❌ | ✅ `DEFAULT` | ✅ `DEFAULT` |
| 注释 | ❌ | ✅ `COMMENT` | ✅ `COMMENT ON` |

---

## 最佳实践

### 1. 使用 description 添加注释

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .description('用户登录名，只能包含字母数字下划线'),
  email: 'email!'
    .description('用户邮箱，用于登录和接收通知')
});

// MySQL 和 PostgreSQL 会生成带注释的 DDL
```

### 2. 统一定义，多处导出

```javascript
// schemas/user.js
const { dsl } = require('schemaio');

module.exports = dsl({
  id: 'uuid!',
  username: 'string:3-32!',
  email: 'email!',
  createdAt: 'datetime!'
});

// 导出脚本
const { exporters } = require('schemaio');
const userSchema = require('./schemas/user');

// 生成所有数据库的 DDL
const outputs = {
  mongo: new exporters.MongoDBExporter().generateCommand('users', userSchema),
  mysql: new exporters.MySQLExporter().export('users', userSchema),
  postgres: new exporters.PostgreSQLExporter().export('users', userSchema)
};
```

### 3. 自动化迁移脚本

```javascript
const fs = require('fs');
const { dsl, exporters } = require('schemaio');

function generateMigration(schemaName, schema) {
  const mysql = new exporters.MySQLExporter();
  const pg = new exporters.PostgreSQLExporter();

  const timestamp = Date.now();

  // 生成 MySQL 迁移
  fs.writeFileSync(
    `migrations/${timestamp}_create_${schemaName}.mysql.sql`,
    mysql.export(schemaName, schema)
  );

  // 生成 PostgreSQL 迁移
  fs.writeFileSync(
    `migrations/${timestamp}_create_${schemaName}.pg.sql`,
    pg.export(schemaName, schema)
  );

  console.log(`生成迁移文件: ${schemaName}`);
}

generateMigration('users', userSchema);
generateMigration('orders', orderSchema);
```

### 4. 版本管理

```javascript
// 在 Schema 中添加版本信息
const userSchemaV1 = dsl({ username: 'string!' });
const userSchemaV2 = dsl({ username: 'string:3-32!', email: 'email!' });

// 导出时标注版本
function exportWithVersion(name, schema, version) {
  const ddl = new exporters.MySQLExporter().export(name, schema);
  return `-- Schema Version: ${version}\n-- Generated: ${new Date().toISOString()}\n\n${ddl}`;
}
```

---

## 完整示例

### 电商系统 Schema 导出

```javascript
const { dsl, exporters } = require('schemaio');
const fs = require('fs');

// 用户 Schema
const userSchema = dsl({
  id: 'uuid!',
  username: 'string:3-32!'.description('用户名'),
  email: 'email!'.description('邮箱'),
  phone: 'string:11'.phone('cn').description('手机号'),
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// 商品 Schema
const productSchema = dsl({
  id: 'uuid!',
  name: 'string:3-200!'.description('商品名称'),
  price: 'number:0-'.description('价格'),
  stock: 'integer:0-'.description('库存'),
  category: 'string:2-50!',
  tags: 'array<string>',
  active: 'boolean'
});

// 订单 Schema
const orderSchema = dsl({
  id: 'uuid!',
  userId: 'uuid!',
  items: 'array!1-100',
  totalAmount: 'number:0-!',
  status: 'pending|paid|shipped|delivered|cancelled',
  createdAt: 'datetime!',
  updatedAt: 'datetime'
});

// 导出所有 Schema
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

console.log('导出完成！');
```

---

## 相关文档

- [MongoDB 导出器](mongodb-exporter.md)
- [MySQL 导出器](mysql-exporter.md)
- [PostgreSQL 导出器](postgresql-exporter.md)
- [TypeConverter](type-converter.md)
- [DSL 语法](dsl-syntax.md)
