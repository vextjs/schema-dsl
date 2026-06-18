# PostgreSQL 导出器文档

> **模块**: `src/exporters/PostgreSQLExporter.ts`  

> **用途**: 将 JSON Schema 转换为 PostgreSQL CREATE TABLE 语句

---


## 概述

`PostgreSQLExporter` 将 schema-dsl 生成的 JSON Schema 转换为 PostgreSQL 的 DDL 语句，支持丰富的 PostgreSQL 特性。

### 核心功能

- ✅ 生成 `CREATE TABLE` DDL 语句
- ✅ 自动类型映射（支持 JSONB、UUID 等）
- ✅ 自动生成 CHECK 约束
- ✅ 支持表和列的 COMMENT
- ✅ 支持多种索引类型（btree、hash、gin、gist）
- ✅ 支持 PostgreSQL schema 命名空间

---

## 快速开始

```javascript
import { s, exporters } from 'schema-dsl/pure';

// 1. 定义 Schema
const userSchema = s({
  id: 'uuid!',
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  status: 'active|inactive'
});

// 2. 创建导出器
const exporter = new exporters.PostgreSQLExporter();

// 3. 导出为 PostgreSQL DDL
const ddl = exporter.export('users', userSchema);
console.log(ddl);
```

**输出**：

```sql
CREATE TABLE public.users (
  id UUID NOT NULL,
  username VARCHAR(32) NOT NULL CHECK (LENGTH(username) BETWEEN 3 AND 32),
  email VARCHAR(255) NOT NULL,
  age DOUBLE PRECISION CHECK (age BETWEEN 18 AND 120),
  status VARCHAR(255) CHECK (status IN ('active', 'inactive')),
  PRIMARY KEY (id)
);
```

---

## API 参考

### 构造函数

```javascript
new PostgreSQLExporter(options)
```

**参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.schema` | string | `'public'` | PostgreSQL schema 名称 |

### 方法

#### `export(tableName, jsonSchema)`

生成 PostgreSQL CREATE TABLE 语句。

```javascript
const ddl = exporter.export('users', userSchema);
```

**参数**：
- `tableName` (string): 表名
- `jsonSchema` (Object): JSON Schema 对象（必须是 object 类型）

**返回值**：
- `string`: PostgreSQL DDL 语句（包含 COMMENT 语句）

---

#### `generateIndex(tableName, columnName, options)`

生成索引创建语句。

```javascript
const indexDdl = exporter.generateIndex('users', 'email', {
  unique: true,
  method: 'btree'
});
console.log(indexDdl);
// CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);
```

**参数**：
- `tableName` (string): 表名
- `columnName` (string): 列名
- `options.name` (string): 索引名（可选）
- `options.unique` (boolean): 是否唯一索引
- `options.method` (string): 索引方法（btree/hash/gin/gist）

---

#### `PostgreSQLExporter.export(tableName, jsonSchema)` (静态方法)

快速导出，无需实例化。

```javascript
const ddl = exporters.PostgreSQLExporter.export('users', userSchema);
```

---

## 配置选项

### Schema 命名空间

```javascript
// 使用自定义 schema
const exporter = new exporters.PostgreSQLExporter({
  schema: 'myapp'
});

const ddl = exporter.export('users', userSchema);
// CREATE TABLE myapp.users (...);
```

---

## 完整示例

### 用户表 DDL 生成

```javascript
import { s, exporters } from 'schema-dsl/pure';

// 定义用户 Schema（带描述）
const userSchema = s({
  id: 'uuid!',
  username: s('string:3-32!').description('用户登录名，3-32个字符'),
  email: s('email!').description('用户邮箱地址'),
  password: 'string:8-64!',
  age: 'number:18-120',
  profile: {
    bio: 'string:500',
    avatar: 'url'
  },
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// 添加表描述
userSchema.description = '用户信息表';

// 生成 DDL
const exporter = new exporters.PostgreSQLExporter({ schema: 'app' });
const ddl = exporter.export('users', userSchema);

console.log(ddl);

// 生成索引
console.log(exporter.generateIndex('users', 'email', { unique: true }));
console.log(exporter.generateIndex('users', 'username', { unique: true }));
console.log(exporter.generateIndex('users', 'profile', { method: 'gin' }));
```

**输出**：

```sql
CREATE TABLE app.users (
  id UUID NOT NULL,
  username VARCHAR(32) NOT NULL CHECK (LENGTH(username) BETWEEN 3 AND 32),
  email VARCHAR(255) NOT NULL,
  password VARCHAR(64) NOT NULL CHECK (LENGTH(password) BETWEEN 8 AND 64),
  age DOUBLE PRECISION CHECK (age BETWEEN 18 AND 120),
  profile JSONB,
  status VARCHAR(255) CHECK (status IN ('active', 'inactive', 'banned')),
  createdAt TIMESTAMP NOT NULL,
  PRIMARY KEY (id)
);

COMMENT ON TABLE app.users IS '用户信息表';

COMMENT ON COLUMN app.users.username IS '用户登录名，3-32个字符';
COMMENT ON COLUMN app.users.email IS '用户邮箱地址';

CREATE UNIQUE INDEX idx_users_email ON app.users USING btree (email);
CREATE UNIQUE INDEX idx_users_username ON app.users USING btree (username);
CREATE INDEX idx_users_profile ON app.users USING gin (profile);
```

---

## 类型映射

| JSON Schema 类型 | 格式/约束 | PostgreSQL 类型 |
|------------------|-----------|-----------------|
| `string` | - | `VARCHAR(255)` |
| `string` | `maxLength: 50` | `VARCHAR(50)` |
| `string` | `maxLength: 500` | `TEXT` |
| `string` | `format: email` | `VARCHAR(255)` |
| `string` | `format: uuid` | `UUID` |
| `string` | `format: date` | `DATE` |
| `string` | `format: date-time` | `TIMESTAMP` |
| `integer` | `maximum: 32767` | `SMALLINT` |
| `integer` | `maximum: 2147483647` | `INTEGER` |
| `integer` | - | `BIGINT` |
| `number` | - | `DOUBLE PRECISION` |
| `boolean` | - | `BOOLEAN` |
| `object` | - | `JSONB` |
| `array` | - | `JSONB` |

---

## CHECK 约束

PostgreSQLExporter 会自动为以下约束生成 CHECK 语句：

### 字符串长度约束

```javascript
username: 'string:3-32!'
// CHECK (LENGTH(username) BETWEEN 3 AND 32)
```

### 数值范围约束

```javascript
age: 'number:18-120'
// CHECK (age BETWEEN 18 AND 120)
```

### 枚举约束

```javascript
status: 'active|inactive|banned'
// CHECK (status IN ('active', 'inactive', 'banned'))
```

---

## 索引类型

| 方法 | 用途 | 示例 |
|------|------|------|
| `btree` (默认) | 通用索引，支持排序和范围查询 | 主键、外键、排序字段 |
| `hash` | 等值查询 | 精确匹配查询 |
| `gin` | JSON/数组索引 | JSONB 字段、全文搜索 |
| `gist` | 几何数据、范围类型 | 地理位置、IP 范围 |

```javascript
// GIN 索引用于 JSONB 字段
exporter.generateIndex('users', 'metadata', { method: 'gin' });
```

---

## 导出限制

⚠️ **重要提示**: PostgreSQL 虽然支持 CHECK 约束，但仍有部分特性无法导出。

**PostgreSQL 不支持的特性**:
- ❌ 正则表达式约束（`pattern`）
- ❌ 嵌套对象约束（导出为 `JSONB`，内部约束丢失）
- ❌ 条件验证逻辑（`s.match()`, `s.if()`）

**详细说明**: 请阅读 [导出限制说明文档](export-limitations.md)

---

## 相关文档

- [数据库导出指南](export-guide.md)
- [MongoDB 导出器](mongodb-exporter.md)
- [MySQL 导出器](mysql-exporter.md)
- [TypeConverter](type-converter.md)
- [**导出限制说明**](export-limitations.md) ⚠️

---

## 对应示例文件

**示例入口**: [postgresql-exporter.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/postgresql-exporter.ts)  
**说明**: 覆盖 PostgreSQL DDL 导出、CHECK 约束示意，以及 `generateIndex()` 生成 `gin` 索引。

