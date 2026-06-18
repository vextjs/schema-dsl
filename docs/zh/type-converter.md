# TypeConverter 类型转换工具

> **模块**: `src/utils/TypeConverter.ts`  

> **用途**: 提供 JSON Schema 与各种数据库类型之间的转换

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
import { TypeConverter } from 'schema-dsl/pure';

// JSON Schema 类型转 MongoDB 类型
const mongoType = TypeConverter.toMongoDBType('integer');
console.log(mongoType); // 'int'

// JSON Schema 类型转 MySQL 类型
const mysqlType = TypeConverter.toMySQLType('string', { maxLength: 100 });
console.log(mysqlType); // 'VARCHAR(100)'

// JSON Schema 类型转 PostgreSQL 类型
const pgType = TypeConverter.toPostgreSQLType('string', { format: 'date-time' });
console.log(pgType); // 'TIMESTAMP'
```

---

## API 参考

### `toJSONSchemaType(nativeType)`

将类型标识转换为 JSON Schema 的 `type` 字符串。

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

JSON Schema 类型转 MongoDB BSON 类型。

```javascript
TypeConverter.toMongoDBType('string');  // 'string'
TypeConverter.toMongoDBType('number');  // 'double'
TypeConverter.toMongoDBType('integer'); // 'int'
TypeConverter.toMongoDBType('boolean'); // 'bool'
```

---

### `toMySQLType(jsonSchemaType, schemaFragment)`

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

// 整数范围（minimum + maximum 命中 TINYINT 分支）
TypeConverter.toMySQLType('integer', { minimum: 0, maximum: 100 });
// 'TINYINT'
```

---

### `toPostgreSQLType(jsonSchemaType, schemaFragment)`

JSON Schema 类型转 PostgreSQL 数据类型。

```javascript
// UUID 格式
TypeConverter.toPostgreSQLType('string', { format: 'uuid' });
// 'VARCHAR(255)'  // 当前实现不会因 format=uuid 自动切换到 UUID 列类型

// 日期时间
TypeConverter.toPostgreSQLType('string', { format: 'date-time' });
// 'TIMESTAMP'

// JSON 对象
TypeConverter.toPostgreSQLType('object');
// 'JSONB'
```

---

### `normalizePropertyName(name)`

规范化属性名：去除首尾空白、将非法字符替换为下划线，并压缩连续下划线。

```javascript
TypeConverter.normalizePropertyName('user name');
// 'user_name'

TypeConverter.normalizePropertyName('123created-at');
// '123created_at'
```

---

### `formatToRegex(format)`

获取格式对应的 `RegExp` 实例；未知格式返回 `null`。

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
//   pattern: '^[a-z]+$',
//   format: 'email'
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
| `integer` | `minimum: 0, maximum: 100` | `TINYINT` |
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
| `string` | `format: uuid` | `VARCHAR(255)` |
| `string` | `format: date` | `DATE` |
| `string` | `format: date-time` | `TIMESTAMP` |
| `integer` | - | `BIGINT` |
| `number` | - | `DOUBLE PRECISION` |
| `boolean` | - | `BOOLEAN` |
| `object` | - | `JSONB` |
| `array` | - | `JSONB` |

---

## 实用示例

### 批量类型转换

```javascript
import { TypeConverter } from 'schema-dsl/pure';

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

---

## 对应示例文件

**示例入口**: [type-converter.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-converter.ts)  
**说明**: 覆盖类型映射、枚举到 MySQL `ENUM(...)`、PostgreSQL 实际 UUID 映射、属性名规范化、正则获取、Schema 合并和约束提取。

