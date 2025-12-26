# SchemaHelper Schema辅助工具

> **模块**: `lib/utils/SchemaHelper.js`  

> **用途**: 提供 JSON Schema 操作的常用辅助方法

---

## 📑 目录

- [概述](#概述)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [实用示例](#实用示例)

---

## 概述

`SchemaHelper` 是一个静态工具类，提供各种 Schema 操作的辅助方法，包括验证、克隆、扁平化、比较等功能。

### 核心功能

- ✅ 验证 Schema 有效性
- ✅ 生成 Schema 唯一 ID
- ✅ 深度克隆 Schema
- ✅ 扁平化嵌套 Schema
- ✅ 提取所有字段路径
- ✅ 提取 required 字段
- ✅ 比较两个 Schema
- ✅ 计算 Schema 复杂度
- ✅ 生成 Schema 摘要

---

## 快速开始

```javascript
const { SchemaHelper } = require('schemaio/lib/utils');
const { dsl } = require('schemaio');

// 创建 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  profile: {
    bio: 'string:500',
    avatar: 'url'
  }
});

// 获取 Schema 摘要
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

## API 参考

### `isValidSchema(schema)`

检查是否为有效的 JSON Schema。

```javascript
SchemaHelper.isValidSchema({ type: 'string' });        // true
SchemaHelper.isValidSchema({ properties: {} });        // true
SchemaHelper.isValidSchema({});                        // false
SchemaHelper.isValidSchema(null);                      // false
```

**判断标准**：至少包含 `type`、`properties`、`items` 或 `$ref` 之一。

---

### `generateSchemaId(schema)`

生成 Schema 的唯一 ID（基于内容哈希）。

```javascript
const id = SchemaHelper.generateSchemaId(userSchema);
console.log(id); // 'schema_1a2b3c4d'
```

**用途**：缓存、去重、唯一标识。

---

### `cloneSchema(schema)`

深度克隆 Schema 对象。

```javascript
const cloned = SchemaHelper.cloneSchema(userSchema);

// 修改克隆不影响原对象
cloned.properties.newField = { type: 'string' };
console.log(userSchema.properties.newField); // undefined
```

---

### `flattenSchema(schema, prefix)`

扁平化嵌套 Schema。

```javascript
const schema = dsl({
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

获取 Schema 中所有字段路径。

```javascript
const paths = SchemaHelper.getFieldPaths(userSchema);
// ['username', 'email', 'profile', 'profile.bio', 'profile.avatar']
```

**数组字段**：使用 `[]` 表示，如 `items[].name`

---

### `extractRequiredFields(schema)`

提取 Schema 中所有 required 字段（包括嵌套）。

```javascript
const required = SchemaHelper.extractRequiredFields(userSchema);
// ['username', 'email']
```

---

### `compareSchemas(schema1, schema2)`

比较两个 Schema 是否相同。

```javascript
const schema1 = dsl({ name: 'string!' });
const schema2 = dsl({ name: 'string!' });
const schema3 = dsl({ name: 'string' });

SchemaHelper.compareSchemas(schema1, schema2); // true
SchemaHelper.compareSchemas(schema1, schema3); // false
```

---

### `simplifySchema(schema)`

简化 Schema（移除不必要的字段）。

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

**移除内容**：`$schema`、空的 `properties`、空的 `required`

---

### `isValidPropertyName(name)`

验证属性名是否合法。

```javascript
SchemaHelper.isValidPropertyName('userName');     // true
SchemaHelper.isValidPropertyName('user_name');    // true
SchemaHelper.isValidPropertyName('user-name');    // true
SchemaHelper.isValidPropertyName('123name');      // false
SchemaHelper.isValidPropertyName('user name');    // false
```

**规则**：以字母或下划线开头，只能包含字母、数字、下划线、连字符。

---

### `getSchemaComplexity(schema)`

获取 Schema 的复杂度（最大嵌套层级）。

```javascript
// 无嵌套
const simple = dsl({ name: 'string!' });
SchemaHelper.getSchemaComplexity(simple); // 0

// 一层嵌套
const nested = dsl({
  user: {
    name: 'string!'
  }
});
SchemaHelper.getSchemaComplexity(nested); // 1

// 多层嵌套
const deep = dsl({
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

生成 Schema 的摘要信息。

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

**用途**：调试、日志、文档生成。

---

## 实用示例

### Schema 分析工具

```javascript
const { SchemaHelper } = require('schemaio/lib/utils');
const { dsl } = require('schemaio');

function analyzeSchema(schema, name = 'Schema') {
  console.log(`\n=== ${name} 分析 ===`);

  // 有效性检查
  if (!SchemaHelper.isValidSchema(schema)) {
    console.log('❌ 无效的 Schema');
    return;
  }

  // 生成摘要
  const summary = SchemaHelper.summarizeSchema(schema);
  console.log(`类型: ${summary.type}`);
  console.log(`字段数: ${summary.fieldCount}`);
  console.log(`必填数: ${summary.requiredCount}`);
  console.log(`嵌套层级: ${summary.complexity}`);
  console.log(`字段列表: ${summary.fields.join(', ')}`);

  // 必填字段
  const required = SchemaHelper.extractRequiredFields(schema);
  console.log(`必填字段: ${required.join(', ') || '无'}`);

  // 唯一 ID
  console.log(`Schema ID: ${SchemaHelper.generateSchemaId(schema)}`);
}

// 使用
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  profile: {
    bio: 'string:500',
    avatar: 'url'
  }
});

analyzeSchema(userSchema, 'User Schema');
```

### Schema 版本比较

```javascript
function compareSchemaVersions(oldSchema, newSchema) {
  if (SchemaHelper.compareSchemas(oldSchema, newSchema)) {
    console.log('✅ Schema 未变化');
    return;
  }

  const oldFields = new Set(SchemaHelper.getFieldPaths(oldSchema));
  const newFields = new Set(SchemaHelper.getFieldPaths(newSchema));

  // 新增字段
  const added = [...newFields].filter(f => !oldFields.has(f));
  if (added.length) {
    console.log('➕ 新增字段:', added.join(', '));
  }

  // 删除字段
  const removed = [...oldFields].filter(f => !newFields.has(f));
  if (removed.length) {
    console.log('➖ 删除字段:', removed.join(', '));
  }
}
```

---

## 相关文档

- [TypeConverter](type-converter.md)
- [SchemaUtils](schema-utils.md)
- [API 参考](api-reference.md)
