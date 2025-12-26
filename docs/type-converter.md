# TypeConverter 类型转换工具

> **模块**: `lib/utils/TypeConverter.js`  

> **用途**: 提供 JSON Schema 与各种数据库类型之间的转换

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [类型映射表](#类型映射表)
- [实用示例](#实用示例)

---

## 概述

`TypeConverter` 是一个静态工具类，用于在 JSON Schema 类型与各种数据库类型之间进行转换。它是所有导出器的基础依赖。

### 核心功能

- ✅ JSON Schema ↔ MongoDB BSON 类型转换
- ✅ JSON Schema ↔ MySQL 类型转换
- ✅ JSON Schema ↔ PostgreSQL 类型转换
- ✅ 属性名规范化（驼峰 ↔ 下划线）
- ✅ 格式验证正则表达式
- ✅ Schema 合并与约束提取

---

## 快速开始

```javascript
const { TypeConverter } = require('schemaio/lib/utils');

// JSON Schema 类型转 MongoDB 类型
const mongoType = TypeConverter.toMongoDBType('integer');
console.log(mongoType); // 'int'

// JSON Schema 类型转 MySQL 类型
const mysqlType = TypeConverter.toMySQLType('string', { maxLength: 100 });
console.log(mysqlType); // 'VARCHAR(100)'

// JSON Schema 类型转 PostgreSQL 类型
const pgType = TypeConverter.toPostgreSQLType('string', { format: 'uuid' });
console.log(pgType); // 'UUID'
```

---

## API 参考

### `toJSONSchemaType(simpleType)`

将简单类型字符串转换为 JSON Schema 类型对象。

```javascript
TypeConverter.toJSONSchemaType('string');
// { type: 'string' }

TypeConverter.toJSONSchemaType('int');
// { type: 'integer' }

TypeConverter.toJSONSchemaType('bool');
// { type: 'boolean' }
```

**支持的别名**：

| 完整类型 | 别名 |
|---------|------|
| `string` | `str`, `s` |
| `number` | `num`, `n` |
| `integer` | `int`, `i` |
| `boolean` | `bool`, `b` |
| `object` | `obj`, `o` |
| `array` | `arr`, `a` |

---

### `toMongoDBType(jsonSchemaType)`

JSON Schema 类型转 MongoDB BSON 类型。

```javascript
TypeConverter.toMongoDBType('string');  // 'string'
TypeConverter.toMongoDBType('number');  // 'double'
TypeConverter.toMongoDBType('integer'); // 'int'
TypeConverter.toMongoDBType('boolean'); // 'bool'
```

---

### `toMySQLType(jsonSchemaType, constraints)`

JSON Schema 类型转 MySQL 数据类型。

```javascript
// 基本转换
TypeConverter.toMySQLType('string');
// 'VARCHAR(255)'

// 带长度约束
TypeConverter.toMySQLType('string', { maxLength: 50 });
// 'VARCHAR(50)'

// 长文本
TypeConverter.toMySQLType('string', { maxLength: 500 });
// 'TEXT'

// 邮箱格式
TypeConverter.toMySQLType('string', { format: 'email' });
// 'VARCHAR(255)'

// 整数范围
TypeConverter.toMySQLType('integer', { maximum: 100 });
// 'TINYINT'
```

---

### `toPostgreSQLType(jsonSchemaType, constraints)`

JSON Schema 类型转 PostgreSQL 数据类型。

```javascript
// UUID 格式
TypeConverter.toPostgreSQLType('string', { format: 'uuid' });
// 'UUID'

// 日期时间
TypeConverter.toPostgreSQLType('string', { format: 'date-time' });
// 'TIMESTAMP'

// JSON 对象
TypeConverter.toPostgreSQLType('object');
// 'JSONB'
```

---

### `normalizePropertyName(name, style)`

规范化属性名，转换命名风格。

```javascript
// camelCase 转 snake_case
TypeConverter.normalizePropertyName('userName', 'snake_case');
// 'user_name'

TypeConverter.normalizePropertyName('createdAt', 'snake_case');
// 'created_at'
```

---

### `formatToRegex(format)`

获取格式对应的正则表达式。

```javascript
TypeConverter.formatToRegex('email');
// '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'

TypeConverter.formatToRegex('uuid');
// '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

TypeConverter.formatToRegex('ipv4');
// IPv4 正则表达式
```

---

### `mergeSchemas(base, override)`

合并两个 JSON Schema 对象。

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

提取 Schema 中的约束条件。

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
//   minimum: undefined,
//   maximum: undefined,
//   pattern: '^[a-z]+$',
//   format: 'email',
//   enum: undefined,
//   default: undefined
// }
```

---

## 类型映射表

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

| JSON Schema | 约束 | MySQL |
|-------------|------|-------|
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

### JSON Schema → PostgreSQL

| JSON Schema | 约束 | PostgreSQL |
|-------------|------|------------|
| `string` | - | `VARCHAR(255)` |
| `string` | `maxLength: 50` | `VARCHAR(50)` |
| `string` | `maxLength: 500` | `TEXT` |
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

## 实用示例

### 批量类型转换

```javascript
const { TypeConverter } = require('schemaio/lib/utils');

const fields = ['string', 'number', 'integer', 'boolean', 'object', 'array'];

console.log('=== 类型映射对比 ===');
fields.forEach(type => {
  console.log(`${type}:`);
  console.log(`  MongoDB: ${TypeConverter.toMongoDBType(type)}`);
  console.log(`  MySQL:   ${TypeConverter.toMySQLType(type)}`);
  console.log(`  PostgreSQL: ${TypeConverter.toPostgreSQLType(type)}`);
});
```

### 格式验证

```javascript
const emailRegex = TypeConverter.formatToRegex('email');
const regex = new RegExp(emailRegex);

console.log(regex.test('user@example.com'));  // true
console.log(regex.test('invalid-email'));     // false
```

---

## 相关文档

- [SchemaHelper](schema-helper.md)
- [MongoDB 导出器](mongodb-exporter.md)
- [MySQL 导出器](mysql-exporter.md)
- [PostgreSQL 导出器](postgresql-exporter.md)

