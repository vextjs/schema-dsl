# MongoDB 导出器文档

> **模块**: `lib/exporters/MongoDBExporter.js`  
> **版本**: v1.0.0  
> **用途**: 将 JSON Schema 转换为 MongoDB 验证 Schema

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

`MongoDBExporter` 将 SchemaIO 生成的 JSON Schema 转换为 MongoDB 的 `$jsonSchema` 验证格式，可直接用于创建集合时的文档验证。

### 核心功能

- ✅ 转换为 MongoDB `$jsonSchema` 格式
- ✅ 自动映射类型为 BSON 类型
- ✅ 保留所有约束条件
- ✅ 生成 `createCollection` 命令
- ✅ 支持严格/宽松验证模式

---

## 快速开始

```javascript
const { dsl, exporters } = require('schemaio');

// 1. 定义 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 2. 创建导出器
const exporter = new exporters.MongoDBExporter();

// 3. 导出为 MongoDB Schema
const mongoSchema = exporter.export(userSchema);
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

---

## API 参考

### 构造函数

```javascript
new MongoDBExporter(options)
```

**参数**：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `options.strict` | boolean | `false` | 是否使用严格验证模式 |

### 方法

#### `export(jsonSchema)`

将 JSON Schema 转换为 MongoDB 验证 Schema。

```javascript
const mongoSchema = exporter.export(jsonSchema);
```

**参数**：
- `jsonSchema` (Object): SchemaIO 生成的 JSON Schema 对象

**返回值**：
- `Object`: 包含 `$jsonSchema` 的 MongoDB 验证对象

---

#### `generateCreateCommand(collectionName, jsonSchema)`

生成 `createCollection` 命令对象。

```javascript
const command = exporter.generateCreateCommand('users', userSchema);
```

**参数**：
- `collectionName` (string): 集合名称
- `jsonSchema` (Object): JSON Schema 对象

**返回值**：

```javascript
{
  collectionName: 'users',
  options: {
    validator: { $jsonSchema: {...} },
    validationLevel: 'moderate',  // 或 'strict'
    validationAction: 'error'
  }
}
```

---

#### `generateCommand(collectionName, jsonSchema)`

生成可执行的 MongoDB 命令字符串。

```javascript
const commandStr = exporter.generateCommand('users', userSchema);
console.log(commandStr);
```

**输出**：

```javascript
db.createCollection("users", {
  "validator": {
    "$jsonSchema": {
      "bsonType": "object",
      ...
    }
  },
  "validationLevel": "moderate",
  "validationAction": "error"
})
```

---

#### `MongoDBExporter.export(jsonSchema)` (静态方法)

快速导出，无需实例化。

```javascript
const mongoSchema = exporters.MongoDBExporter.export(userSchema);
```

---

## 配置选项

### 验证模式

| 模式 | 说明 |
|------|------|
| `strict: false` (默认) | `validationLevel: 'moderate'` - 只验证插入和更新操作中涉及的字段 |
| `strict: true` | `validationLevel: 'strict'` - 验证所有插入和更新操作 |

```javascript
// 严格模式
const strictExporter = new exporters.MongoDBExporter({ strict: true });
```

---

## 完整示例

### 用户集合验证

```javascript
const { dsl, exporters } = require('schemaio');

// 定义复杂用户 Schema
const userSchema = dsl({
  _id: 'string!',
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  email: 'email!'.label('邮箱'),
  profile: {
    bio: 'string:500',
    avatar: 'url'
  },
  status: 'active|inactive|banned',
  createdAt: 'datetime!'
});

// 导出并生成命令
const exporter = new exporters.MongoDBExporter({ strict: true });
const command = exporter.generateCommand('users', userSchema);

console.log(command);
```

### 在 MongoDB 中使用

```javascript
const { MongoClient } = require('mongodb');

async function createValidatedCollection() {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();

  const db = client.db('myapp');
  
  // 获取验证 Schema
  const exporter = new exporters.MongoDBExporter({ strict: true });
  const { options } = exporter.generateCreateCommand('users', userSchema);

  // 创建带验证的集合
  await db.createCollection('users', options);

  console.log('集合创建成功，已启用文档验证');
}
```

---

## 类型映射

| JSON Schema 类型 | MongoDB BSON 类型 |
|------------------|-------------------|
| `string` | `string` |
| `number` | `double` |
| `integer` | `int` |
| `boolean` | `bool` |
| `object` | `object` |
| `array` | `array` |
| `null` | `null` |

### 约束映射

| JSON Schema 约束 | MongoDB 约束 |
|------------------|--------------|
| `minLength` | `minLength` |
| `maxLength` | `maxLength` |
| `minimum` | `minimum` |
| `maximum` | `maximum` |
| `pattern` | `pattern` |
| `enum` | `enum` |
| `minItems` | `minItems` |
| `maxItems` | `maxItems` |

---

## 相关文档

- [数据库导出指南](export-guide.md)
- [MySQL 导出器](mysql-exporter.md)
- [PostgreSQL 导出器](postgresql-exporter.md)
- [TypeConverter](type-converter.md)
