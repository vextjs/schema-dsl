# 数据验证最佳实践指南

> **用途**: 完整的数据验证使用指南  
> **阅读时间**: 15分钟

---

## 📑 目录

- [快速入门](#快速入门)
- [DSL 语法速查](#dsl-语法速查)
- [验证模式](#验证模式)
- [错误处理](#错误处理)
- [性能优化](#性能优化)
- [常见场景](#常见场景)
- [最佳实践](#最佳实践)

---

## 快速入门

### 基本验证流程

```javascript
const { dsl, validate } = require('schema-dsl');

// 1. 定义 Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 2. 验证数据
const result = validate(schema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

// 3. 处理结果
if (result.valid) {
  console.log('验证通过', result.data);
} else {
  console.log('验证失败', result.errors);
}
```

---

## DSL 语法速查

### 基本类型

| DSL | 说明 |
|-----|------|
| `'string'` | 字符串 |
| `'number'` | 数字 |
| `'integer'` | 整数 |
| `'boolean'` | 布尔值 |
| `'object'` | 对象 |
| `'array'` | 数组 |

### 格式类型

| DSL | 说明 |
|-----|------|
| `'email'` | 邮箱格式 |
| `'url'` | URL 格式 |
| `'uuid'` | UUID 格式 |
| `'date'` | 日期格式 |
| `'datetime'` | 日期时间格式 |
| `'time'` | 时间格式 |
| `'ipv4'` | IPv4 地址 |
| `'ipv6'` | IPv6 地址 |

### 约束语法

| DSL | 说明 |
|-----|------|
| `'string:10'` | 最大长度 10 |
| `'string:3-32'` | 长度 3-32 |
| `'string:3-'` | 最小长度 3 |
| `'number:18-120'` | 数值范围 18-120 |
| `'array:1-10'` | 数组长度 1-10 |

### 特殊标记

| DSL | 说明 |
|-----|------|
| `'string!'` | 必填字符串 |
| `'email!'` | 必填邮箱 |
| `'a\|b\|c'` | 枚举值 |
| `'array<string>'` | 字符串数组 |

---

## 验证模式

### 1. 便捷函数验证（推荐）

最简单的验证方式，使用内置单例 Validator：

```javascript
const { dsl, validate } = require('schema-dsl');

const result = validate(schema, data);
```

### 2. Validator 实例验证（高级）

需要自定义配置（如类型转换、自定义关键字）时使用：

```javascript
const { dsl, Validator } = require('schema-dsl');

// 创建自定义配置的 Validator
const validator = new Validator({
  allErrors: true,      // 返回所有错误
  useDefaults: true,    // 使用默认值
  coerceTypes: true     // ✨ 启用类型转换
});

const result = validator.validate(schema, data);
```

> **注意**: `new Validator()` 会创建一个新的 Ajv 实例，有一定的初始化开销。建议在应用启动时创建并复用，避免在每次请求中创建。

### 3. 预编译验证（高性能）

频繁验证同一 Schema 时使用：

```javascript
const validator = new Validator();

// 预编译 Schema
const validateUser = validator.compile(userSchema);

// 多次验证（无需重复编译）
const result1 = validateUser(data1);
const result2 = validateUser(data2);
const result3 = validateUser(data3);
```

### 4. 批量验证

验证多条数据时使用：

```javascript
const { Validator } = require('schema-dsl');
const validator = new Validator();

const dataList = [
  { username: 'user1', email: 'user1@example.com' },
  { username: 'user2', email: 'invalid' },
  { username: 'u', email: 'user3@example.com' }
];

const results = validator.validateBatch(schema, dataList);
// [
//   { valid: true, errors: [] },
//   { valid: false, errors: [...] },
//   { valid: false, errors: [...] }
// ]
```

---

## 错误处理

### 错误对象结构

```javascript
{
  message: '用户名长度不能少于3个字符',
  path: '/username',
  keyword: 'minLength',
  params: { limit: 3 }
}
```

### 自定义错误消息

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'min': '{{#label}}太短了，至少{{#limit}}个字符',
      'max': '{{#label}}太长了，最多{{#limit}}个字符',
      'required': '请输入{{#label}}'
    })
});
```

### 多语言错误消息

```javascript
const { Locale, Validator } = require('schema-dsl');

// 添加语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}长度不能少于{{#limit}}',
  'email': '请输入有效的{{#label}}'
});

// 验证时指定语言
const validator = new Validator();
const result = validator.validate(schema, data, { locale: 'zh-CN' });
```

### 错误格式化

```javascript
function formatErrors(errors) {
  return errors.map(err => {
    const field = err.path.replace(/^\//, '').replace(/\//g, '.');
    return `[${field}] ${err.message}`;
  }).join('\n');
}

if (!result.valid) {
  console.log(formatErrors(result.errors));
  // [username] 用户名长度不能少于3个字符
  // [email] 请输入有效的邮箱地址
}
```

---

## 性能优化

### 1. 使用预编译

```javascript
// ❌ 每次都编译（慢）
function validateUser(data) {
  return validate(userSchema, data);
}

// ✅ 预编译一次，多次使用（快）
const validator = new Validator();
const validateUser = validator.compile(userSchema);
```

### 2. 缓存 Schema

```javascript
// ❌ 每次都创建 Schema
function getSchema() {
  return dsl({
    username: 'string:3-32!',
    email: 'email!'
  });
}

// ✅ 缓存 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

### 3. 合理使用 allErrors

```javascript
// 只需要第一个错误时
const validator = new Validator({ allErrors: false });

// 需要所有错误时（默认）
const validator = new Validator({ allErrors: true });
```

### 4. 监控性能

```javascript
const result = validate(schema, data);
console.log(`验证耗时: ${result.performance?.duration}ms`);
```

---

## 常见场景

### 用户注册表单

```javascript
const registerSchema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '{{#label}}只能包含字母、数字和下划线'
    }),

  email: 'email!'
    .label('邮箱地址'),

  password: 'string:8-64!'
    .password('strong')
    .label('密码'),

  age: 'number:18-120'
    .label('年龄'),

  gender: 'male|female|other',

  terms: 'boolean!'
    .label('服务条款')
    .messages({
      'required': '请同意{{#label}}'
    })
});
```

### API 请求验证

```javascript
const createOrderSchema = dsl({
  userId: 'string!',
  items: 'array!1-100',
  shippingAddress: {
    street: 'string:5-200!',
    city: 'string:2-100!',
    zipCode: 'string:5-10!',
    country: 'string:2!'
  },
  paymentMethod: 'credit_card|paypal|bank_transfer',
  notes: 'string:500'
});

// Express 中间件
function validateRequest(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);
    if (!result.valid) {
      return res.status(400).json({ errors: result.errors });
    }
    req.validatedData = result.data;
    next();
  };
}

app.post('/orders', validateRequest(createOrderSchema), createOrder);
```

### 配置文件验证

```javascript
const configSchema = dsl({
  server: {
    host: 'string!',
    port: 'integer:1-65535!',
    ssl: 'boolean'
  },
  database: {
    url: 'url!',
    poolSize: 'integer:1-100',
    timeout: 'integer:1000-60000'
  },
  logging: {
    level: 'debug|info|warn|error',
    format: 'json|text'
  }
});

function loadConfig(configPath) {
  const config = require(configPath);
  const result = validate(configSchema, config);

  if (!result.valid) {
    throw new Error(`配置文件错误:\n${formatErrors(result.errors)}`);
  }

  return result.data;
}
```

---

## 最佳实践

### 1. 使用 label 提升错误消息质量

```javascript
// ❌ 默认错误消息
email: 'email!'
// 错误: "email is required"

// ✅ 使用 label
email: 'email!'.label('邮箱地址')
// 错误: "邮箱地址不能为空"
```

### 2. 集中管理 Schema

```javascript
// schemas/index.js
const { dsl } = require('schema-dsl');

exports.userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

exports.orderSchema = dsl({
  userId: 'string!',
  items: 'array!1-100'
});
```

### 3. 使用 SchemaUtils 复用字段

```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

// 创建可复用字段
const emailField = SchemaUtils.reusable(() =>
  dsl('email!').label('邮箱地址')
);

// 在多个 Schema 中复用
const loginSchema = dsl({ email: emailField() });
const registerSchema = dsl({ email: emailField(), name: 'string!' });
```

### 4. 分层验证

```javascript
// 基础验证（快速）
const quickSchema = dsl({
  username: 'string!',
  email: 'string!'
});

// 完整验证（详细）
const fullSchema = dsl({
  username: 'string:3-32!'.pattern(/^[a-z]+$/),
  email: 'email!'
});

// 先快速验证，再完整验证
async function validateWithFallback(data) {
  const quick = validate(quickSchema, data);
  if (!quick.valid) return quick;

  const full = validate(fullSchema, data);
  if (!full.valid) return full;

  if (await checkEmailUnique(data.email)) {
    return {
      valid: false,
      errors: [{ field: 'email', keyword: 'business', message: '邮箱已被占用' }]
    };
  }

  return full;
}
```

### 5. 测试验证逻辑

```javascript
describe('User Schema', () => {
  it('应该验证有效用户', () => {
    const result = validate(userSchema, {
      username: 'john_doe',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.true;
  });

  it('应该拒绝短用户名', () => {
    const result = validate(userSchema, {
      username: 'ab',
      email: 'john@example.com'
    });
    expect(result.valid).to.be.false;
    expect(result.errors[0].keyword).to.equal('minLength');
  });
});
```

---

## 相关文档

- [DSL 语法完整指南](dsl-syntax.md)
- [validate 方法详解](validate.md)
- [错误处理指南](error-handling.md)
- [多语言支持](dynamic-locale.md)
- [String 扩展](string-extensions.md)

