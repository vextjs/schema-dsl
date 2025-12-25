# validate 方法详细文档

## 概述

`validate` 是 Validator 类的核心方法，用于验证数据是否符合 JSON Schema 定义。基于高性能的 ajv 验证器实现。

---

## 方法签名

```javascript
validator.validate(schema, data, options = {})
```

**参数说明**：
- `schema` (Object|Function): JSON Schema 对象或已编译的验证函数
- `data` (Any): 待验证的数据
- `options` (Object): 验证选项（可选）

**返回值**：
```javascript
{
  valid: Boolean,     // 是否有效
  errors: Array,      // 错误列表
  data: Any          // 验证后的数据（可能被 useDefaults 修改）
}
```

---

## 参数详解

### schema 参数

JSON Schema 对象，支持 JSON Schema Draft 7 标准。

| 参数类型 | 说明 | 来源 |
|---------|------|------|
| Object | JSON Schema 对象 | JSON Schema 标准 ✅ |
| Function | 已编译的验证函数（通过 `compile()` 生成） | ajv ✅ |

### options 对象属性

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `format` | Boolean | 否 | `true` | 是否格式化错误信息 |

**图例说明**:
- ✅ **标准功能**: 该参数来自 JSON Schema 或 ajv 标准

---

## 返回值详解

### valid (Boolean)

表示数据是否通过验证。

```javascript
result.valid === true   // 验证通过
result.valid === false  // 验证失败
```

### errors (Array)

验证错误列表，当 `valid` 为 `false` 时包含详细错误信息。

**错误对象结构**：
```javascript
{
  path: String,      // 错误字段路径，如 'user.email'
  message: String,   // 错误描述信息
  keyword: String,   // 触发的 Schema 关键字
  params: Object     // 错误相关参数
}
```

### data (Any)

验证后的数据。如果 Validator 配置了 `useDefaults: true`，则会应用 Schema 中定义的默认值。

---

## 基础示例

### 示例 1: 验证简单对象

```javascript
const { Validator } = require('schemaio');

const validator = new Validator();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  required: ['name']
};

const result = validator.validate(schema, { 
  name: 'John', 
  age: 25 
});

console.log(result.valid);  // true
console.log(result.errors); // []
```

### 示例 2: 处理验证失败

```javascript
const result = validator.validate(schema, { 
  age: 'invalid' 
});

console.log(result.valid);  // false
console.log(result.errors); 
// [
//   { path: '', message: "must have required property 'name'" },
//   { path: 'age', message: 'must be number' }
// ]
```

---

## 高级示例

### 示例 3: 验证字符串约束

```javascript
const schema = {
  type: 'string',
  minLength: 3,
  maxLength: 32,
  pattern: '^[a-zA-Z0-9]+$'
};

// 有效数据
console.log(validator.validate(schema, 'john123').valid);  // true

// 太短
console.log(validator.validate(schema, 'ab').valid);       // false

// 包含非法字符
console.log(validator.validate(schema, 'john-123').valid); // false
```

### 示例 4: 验证数字范围

```javascript
const schema = {
  type: 'number',
  minimum: 0,
  maximum: 100
};

console.log(validator.validate(schema, 50).valid);   // true
console.log(validator.validate(schema, -1).valid);   // false
console.log(validator.validate(schema, 101).valid);  // false
```

### 示例 5: 验证邮箱格式

```javascript
const schema = {
  type: 'string',
  format: 'email'
};

console.log(validator.validate(schema, 'test@example.com').valid); // true
console.log(validator.validate(schema, 'invalid-email').valid);     // false
```

### 示例 6: 验证枚举值

```javascript
const schema = {
  type: 'string',
  enum: ['active', 'inactive', 'pending']
};

console.log(validator.validate(schema, 'active').valid);  // true
console.log(validator.validate(schema, 'invalid').valid); // false
```

### 示例 7: 验证嵌套对象

```javascript
const schema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      },
      required: ['name', 'email']
    }
  }
};

const data = {
  user: {
    name: 'John',
    email: 'john@example.com'
  }
};

const result = validator.validate(schema, data);
console.log(result.valid); // true
```

### 示例 8: 验证数组

```javascript
const schema = {
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
};

console.log(validator.validate(schema, ['a', 'b', 'c']).valid); // true
console.log(validator.validate(schema, []).valid);              // false (minItems)
console.log(validator.validate(schema, [1, 2, 3]).valid);       // false (type)
```

---

## 使用默认值

当 Validator 配置了 `useDefaults: true` 时，会自动应用 Schema 中的默认值。

```javascript
const validator = new Validator({ useDefaults: true });

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    status: { type: 'string', default: 'active' }
  }
};

const result = validator.validate(schema, { name: 'John' });

console.log(result.valid);        // true
console.log(result.data);         // { name: 'John', status: 'active' }
console.log(result.data.status);  // 'active' (自动应用默认值)
```

---

## 使用已编译的验证函数

为了提高性能，可以先编译 Schema，然后重复使用编译后的验证函数。

```javascript
// 编译 Schema
const validateFn = validator.compile(schema);

// 重复使用（性能更好）
const result1 = validator.validate(validateFn, data1);
const result2 = validator.validate(validateFn, data2);
const result3 = validator.validate(validateFn, data3);
```

---

## 错误处理最佳实践

### 实践 1: 展示用户友好的错误信息

```javascript
const result = validator.validate(schema, data);

if (!result.valid) {
  // 格式化错误信息
  result.errors.forEach(err => {
    console.log(`字段 "${err.path}": ${err.message}`);
  });
  
  // 或者整体提示
  console.log(`验证失败，共 ${result.errors.length} 个错误`);
}
```

### 实践 2: API 响应中返回错误

```javascript
const result = validator.validate(schema, req.body);

if (!result.valid) {
  return res.status(400).json({
    success: false,
    message: '数据验证失败',
    errors: result.errors.map(err => ({
      field: err.path,
      message: err.message
    }))
  });
}

// 验证通过，继续处理
processData(result.data);
```

### 实践 3: 抛出异常

```javascript
const result = validator.validate(schema, data);

if (!result.valid) {
  const error = new ValidationError('数据验证失败');
  error.errors = result.errors;
  throw error;
}
```

---

## 性能优化建议

### 建议 1: 复用 Validator 实例

```javascript
// ✅ 好：复用实例
const validator = new Validator();

app.post('/api/users', (req, res) => {
  const result = validator.validate(userSchema, req.body);
  // ...
});

// ❌ 不好：每次创建新实例
app.post('/api/users', (req, res) => {
  const validator = new Validator(); // 不推荐
  const result = validator.validate(userSchema, req.body);
  // ...
});
```

### 建议 2: 预编译 Schema

```javascript
// 应用启动时预编译
const validateUser = validator.compile(userSchema);
const validateProduct = validator.compile(productSchema);

// 使用时直接验证（更快）
app.post('/api/users', (req, res) => {
  const result = validator.validate(validateUser, req.body);
  // ...
});
```

### 建议 3: 使用缓存

```javascript
// 使用缓存键
const result = validator.validate(
  schema, 
  data,
  { cacheKey: 'user-schema' }  // 自动缓存编译结果
);
```

---

## 常见问题

### Q1: 如何验证可选字段？

不在 `required` 数组中的字段自动为可选：

```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }   // age 是可选的
  },
  required: ['name']           // 只有 name 是必填的
};
```

### Q2: 如何允许额外字段？

JSON Schema 默认允许额外字段。如果要禁止额外字段：

```javascript
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  additionalProperties: false  // 禁止额外字段
};
```

### Q3: 如何验证多种类型？

使用 `anyOf` 或 `oneOf`：

```javascript
const schema = {
  type: 'object',
  properties: {
    value: {
      anyOf: [
        { type: 'string' },
        { type: 'number' }
      ]
    }
  }
};
```

### Q4: 性能如何？

基于 ajv，业界最快的 JSON Schema 验证器：
- 验证速度 >15,000 ops/s
- 内置编译缓存
- 支持批量验证优化

---

## 相关文档

- [Validator 类概述](./validator.md)
- [compile 方法](./compile.md) - 编译 Schema 提升性能
- [validateBatch 方法](./validate-batch.md) - 批量验证
- [addKeyword 方法](./add-keyword.md) - 添加自定义验证
- [JSON Schema 基础](./json-schema-basics.md)

---

## 外部参考

- [JSON Schema 官方文档](https://json-schema.org/)
- [ajv 文档](https://ajv.js.org/)
- [JSON Schema Validator](https://www.jsonschemavalidator.net/) - 在线测试工具

---

**文档版本**: v1.0.0  
**最后更新**: 2025-12-24

