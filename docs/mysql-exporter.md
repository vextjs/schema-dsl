# MySQL 导出器文档

> **模块**: `lib/exporters/MySQLExporter.js`  

> **用途**: 将 JSON Schema 转换为 MySQL CREATE TABLE 语句

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [配置选项](#配置选项)
- [完整示例](#完整示例)
- [类型映射](#类型映射)

---

## 概述

`MySQLExporter` 将 SchemaIO 生成的 JSON Schema 转换为 MySQL 的 DDL 语句，包括 `CREATE TABLE` 和索引创建语句。

### 核心功能

- ✅ 生成 `CREATE TABLE` DDL 语句
- ✅ 自动类型映射（JSON Schema → MySQL）
- ✅ 支持 NOT NULL、DEFAULT、COMMENT
- ✅ 自动检测主键
- ✅ 生成索引 DDL
- ✅ 可配置存储引擎和字符集

---

## 快速开始

```javascript
const { dsl, exporters } = require('schemaio');

// 1. 定义 Schema
const userSchema = dsl({
  id: 'string!',
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  status: 'active|inactive'
});

// 2. 创建导出器
const exporter = new exporters.MySQLExporter();

// 3. 导出为 MySQL DDL
const ddl = exporter.export('users', userSchema);
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

---

## API 参考

### 构造函数

```javascript
new MySQLExporter(options)
```

**参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.engine` | string | `'InnoDB'` | 存储引擎 |
| `options.charset` | string | `'utf8mb4'` | 字符集 |
| `options.collate` | string | `'utf8mb4_unicode_ci'` | 排序规则 |

### 方法

#### `export(tableName, jsonSchema)`

生成 MySQL CREATE TABLE 语句。

```javascript
const ddl = exporter.export('users', userSchema);
```

**参数**：
- `tableName` (string): 表名
- `jsonSchema` (Object): JSON Schema 对象（必须是 object 类型）

**返回值**：
- `string`: MySQL DDL 语句

---

#### `generateIndex(tableName, columnName, options)`

生成索引创建语句。

```javascript
const indexDdl = exporter.generateIndex('users', 'email', { unique: true });
console.log(indexDdl);
// CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
```

**参数**：
- `tableName` (string): 表名
- `columnName` (string): 列名
- `options.name` (string): 索引名（可选，默认 `idx_表名_列名`）
- `options.unique` (boolean): 是否唯一索引（默认 false）

---

#### `MySQLExporter.export(tableName, jsonSchema)` (静态方法)

快速导出，无需实例化。

```javascript
const ddl = exporters.MySQLExporter.export('users', userSchema);
```

---

## 配置选项

### 存储引擎

```javascript
// 使用 MyISAM 引擎
const exporter = new exporters.MySQLExporter({
  engine: 'MyISAM'
});
```

### 字符集配置

```javascript
// 使用 utf8 字符集
const exporter = new exporters.MySQLExporter({
  charset: 'utf8',
  collate: 'utf8_general_ci'
});
```

---

## 完整示例

### 用户表 DDL 生成

```javascript
const { dsl, exporters } = require('schemaio');

// 定义用户 Schema（带描述）
const userSchema = dsl({
  id: 'string!',
  username: 'string:3-32!'
    .description('用户登录名'),
  email: 'email!'
    .description('用户邮箱'),
  password: 'string:8-64!',
  age: 'number:0-150',
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// 生成 DDL
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', userSchema);

console.log(ddl);

// 生成索引
console.log(exporter.generateIndex('users', 'email', { unique: true }));
console.log(exporter.generateIndex('users', 'username', { unique: true }));
console.log(exporter.generateIndex('users', 'status'));
```

**输出**：

```sql
CREATE TABLE `users` (
  `id` VARCHAR(255) NOT NULL,
  `username` VARCHAR(32) NOT NULL COMMENT '用户登录名',
  `email` VARCHAR(255) NOT NULL COMMENT '用户邮箱',
  `password` VARCHAR(64) NOT NULL,
  `age` DOUBLE NULL,
  `status` VARCHAR(255) NULL,
  `createdAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
CREATE UNIQUE INDEX `idx_users_username` ON `users` (`username`);
CREATE INDEX `idx_users_status` ON `users` (`status`);
```

---

## 类型映射

| JSON Schema 类型 | 格式/约束 | MySQL 类型 |
|------------------|-----------|------------|
| `string` | - | `VARCHAR(255)` |
| `string` | `maxLength: 50` | `VARCHAR(50)` |
| `string` | `maxLength: 500` | `TEXT` |
| `string` | `format: email` | `VARCHAR(255)` |
| `string` | `format: date-time` | `DATETIME` |
| `integer` | `maximum: 127` | `TINYINT` |
| `integer` | `maximum: 32767` | `SMALLINT` |
| `integer` | `maximum: 2147483647` | `INT` |
| `integer` | - | `BIGINT` |
| `number` | - | `DOUBLE` |
| `boolean` | - | `BOOLEAN` |
| `object` | - | `JSON` |
| `array` | - | `JSON` |

### 约束映射

| 约束 | MySQL 处理 |
|------|-----------|
| `required` | `NOT NULL` |
| 非 required | `NULL` |
| `default` | `DEFAULT value` |
| `description` | `COMMENT 'text'` |

---

## 主键检测

导出器会自动检测以下字段作为主键：

1. 名为 `id` 的字段
2. 名为 `_id` 的字段

如果存在这些字段，会自动添加 `PRIMARY KEY` 约束。

---

## 相关文档

- [数据库导出指南](export-guide.md)
- [MongoDB 导出器](mongodb-exporter.md)
- [PostgreSQL 导出器](postgresql-exporter.md)
- [TypeConverter](type-converter.md)
