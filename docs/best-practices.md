# schema-dsl 最佳实践

> **用途**: 帮助你写出高质量、高性能的 Schema 代码  
> **更新**: 2025-12-26  

---

## 📑 目录

- [Schema 设计原则](#schema-设计原则)
- [性能优化](#性能优化)
- [安全性考虑](#安全性考虑)
- [错误处理](#错误处理)
- [代码组织](#代码组织)
- [生产环境建议](#生产环境建议)

---

## Schema 设计原则

### 1. 简单字段用纯 DSL

**推荐**:
```javascript
const schema = dsl({
  username: 'string:3-32!',
  age: 'number:18-120',
  email: 'email!',
  role: 'admin|user|guest'
});
```

**不推荐**（过度复杂）:
```javascript
const schema = dsl({
  username: dsl('string').minLength(3).maxLength(32).required(),
  // 太冗长了！
});
```

**原则**: 能用 DSL 字符串表达的，就不要用链式调用。

---

### 2. 复杂验证用链式调用

**适合链式调用的场景**:
- 需要正则验证
- 需要自定义错误消息
- 需要自定义验证器
- 需要标签（label）

**示例**:
```javascript
const schema = dsl({
  // 简单字段：纯 DSL
  age: 'number:18-120',
  
  // 复杂字段：链式调用
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '只能包含字母、数字和下划线',
      'min': '至少3个字符',
      'max': '最多32个字符'
    }),
  
  email: 'email!'
    .custom(async (value) => {
      const exists = await checkEmailExists(value);
      if (exists) return '邮箱已被占用';
    })
    .label('邮箱地址')
});
```

---

### 3. 使用预设验证器

SchemaI-DSL 提供了常用的预设验证器，开箱即用：

```javascript
const schema = dsl({
  // ✅ 使用预设验证器（推荐）
  username: dsl('string!').username(),        // 自动设置 3-32 长度 + 正则
  password: dsl('string!').password('strong'), // 强密码验证
  phone: dsl('string!').phone('cn'),          // 中国手机号
  
  // ❌ 手动实现（不推荐）
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
});
```

**可用预设**:
- `username(preset?)` - 用户名验证
- `password(strength?)` - 密码强度验证
- `phone(country?)` - 手机号验证
- `slug()` - URL slug 验证

---

### 4. 避免过深的嵌套

**不推荐**（嵌套过深）:
```javascript
const schema = dsl({
  user: {
    profile: {
      personal: {
        address: {
          detail: {
            street: 'string'  // 嵌套 5 层
          }
        }
      }
    }
  }
});
```

**推荐**（拆分或扁平化）:
```javascript
// 方案1: 拆分为多个 Schema
const addressSchema = dsl({
  street: 'string!',
  city: 'string!',
  zipCode: 'string'
});

const userSchema = dsl({
  name: 'string!',
  email: 'email!',
  address: addressSchema
});

// 方案2: 扁平化
const schema = dsl({
  'user_name': 'string!',
  'user_email': 'email!',
  'address_street': 'string!',
  'address_city': 'string!'
});
```

**原则**: 嵌套深度建议不超过 3-4 层。

---

## 性能优化

### 1. 预编译 Schema

**不推荐**（每次都编译）:
```javascript
app.post('/api/user', (req, res) => {
  const schema = dsl({ username: 'string!' });
  const result = validate(schema, req.body); // 每次都编译
});
```

**推荐**（预编译）:
```javascript
// 在应用启动时编译一次
const userSchema = dsl({ username: 'string!' });
const validateUser = validator.compile(userSchema);

app.post('/api/user', (req, res) => {
  const result = validateUser(req.body); // 直接使用
});
```

**性能提升**: 预编译可以提升 **10-100 倍** 的性能！

---

### 2. 启用缓存

```javascript
const validator = new Validator({ 
  cache: true  // 启用编译缓存
});

// 或者使用全局单例（默认启用缓存）
const { validate } = require('schema-dsl');
validate(schema, data); // 自动缓存
```

---

### 3. 批量验证

**不推荐**（循环验证）:
```javascript
const errors = [];
records.forEach(record => {
  const result = validate(schema, record);
  if (!result.valid) {
    errors.push(result.errors);
  }
});
```

**推荐**（批量验证）:
```javascript
const result = validator.validateBatch(schema, records);
// 一次性验证所有记录，性能更好
```

---

### 4. 优化正则表达式

**不推荐**（可能导致 ReDoS）:
```javascript
// 危险的正则：灾难性回溯
.pattern(/^(a+)+$/)
.pattern(/^(a*)*$/)
.pattern(/^(a|a)*$/)
```

**推荐**（安全高效）:
```javascript
// 简单明确的正则
.pattern(/^[a-zA-Z0-9_]+$/)
.pattern(/^[a-z]{3,10}$/)
```

**工具**: 使用 [regexploit](https://www.npmjs.com/package/regexploit) 检测危险正则。

---

### 5. 避免在循环中创建 Schema

**不推荐**:
```javascript
records.forEach(record => {
  const schema = dsl({ name: 'string!' }); // 每次都创建
  validate(schema, record);
});
```

**推荐**:
```javascript
const schema = dsl({ name: 'string!' }); // 创建一次
records.forEach(record => {
  validate(schema, record); // 重复使用
});
```

---

## 安全性考虑

### 1. 限制用户输入的正则

**危险**:
```javascript
// ❌ 用户控制的正则表达式
app.post('/api/validate', (req, res) => {
  const pattern = req.body.pattern; // 用户输入
  const schema = dsl('string').pattern(new RegExp(pattern)); // 危险！
});
```

**原因**: 用户可能输入恶意正则导致 ReDoS 攻击。

**安全做法**:
```javascript
// ✅ 使用预定义的正则
const ALLOWED_PATTERNS = {
  username: /^[a-zA-Z0-9_]+$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

app.post('/api/validate', (req, res) => {
  const patternName = req.body.pattern;
  const pattern = ALLOWED_PATTERNS[patternName];
  if (!pattern) {
    return res.status(400).json({ error: 'Invalid pattern' });
  }
  const schema = dsl('string').pattern(pattern);
});
```

---

### 2. 清理错误消息

生产环境不要暴露敏感信息：

```javascript
// 开发环境
if (process.env.NODE_ENV === 'development') {
  return res.status(400).json({
    valid: false,
    errors: result.errors // 详细错误
  });
}

// 生产环境
return res.status(400).json({
  valid: false,
  message: '输入数据验证失败' // 简化消息
});
```

---

### 3. 限制 Schema 复杂度

```javascript
const validator = new Validator({
  maxNestingDepth: 10,  // 限制嵌套深度
  maxSchemaSize: 10000  // 限制 Schema 大小（建议）
});

// 在 validate 前检查
DslBuilder.validateNestingDepth(schema, 10);
```

---

### 4. 防止原型污染

```javascript
// 验证数据时避免原型污染
const validator = new Validator({
  removeAdditional: true, // 移除额外属性
  useDefaults: false      // 不自动填充默认值（如果不需要）
});
```

---

## 错误处理

### 1. 统一错误格式

**推荐的错误处理中间件**:
```javascript
// Express 中间件
function validateMiddleware(schema) {
  return (req, res, next) => {
    const result = validate(schema, req.body);
    
    if (!result.valid) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: '请求数据验证失败',
        errors: result.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    next();
  };
}

// 使用
app.post('/api/user', 
  validateMiddleware(userSchema),
  userController.create
);
```

---

### 2. 友好的错误消息

**使用 label 和自定义消息**:
```javascript
const schema = dsl({
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'required': '{{#label}}不能为空',
      'min': '{{#label}}至少需要{{#limit}}个字符',
      'max': '{{#label}}最多{{#limit}}个字符',
      'pattern': '{{#label}}格式不正确'
    }),
  
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'required': '请填写{{#label}}',
      'format': '{{#label}}格式不正确'
    })
});
```

**效果**:
```
❌ 用户名不能为空
❌ 用户名至少需要3个字符
✅ 清晰明了，用户友好
```

---

### 3. 处理异步验证错误

```javascript
const schema = dsl({
  email: 'email!'.custom(async (value) => {
    try {
      const exists = await checkEmailExists(value);
      if (exists) return '邮箱已被占用';
    } catch (error) {
      // 记录错误但不阻止验证
      console.error('Email check failed:', error);
      // 可以选择跳过此验证或返回提示
      return; // 跳过
    }
  })
});
```

---

## 代码组织

### 1. 集中管理 Schema

**推荐的项目结构**:
```
src/
├── schemas/
│   ├── index.js         # 导出所有 Schema
│   ├── user.schema.js   # 用户相关 Schema
│   ├── post.schema.js   # 文章相关 Schema
│   └── common.schema.js # 通用 Schema
├── routes/
│   ├── user.routes.js
│   └── post.routes.js
└── controllers/
```

**schemas/user.schema.js**:
```javascript
const { dsl } = require('schema-dsl');

// 可复用的字段
const commonFields = {
  username: dsl('string!').username().label('用户名'),
  email: 'email!',
  password: dsl('string!').password('strong').label('密码')
};

// 注册 Schema
exports.registerSchema = dsl({
  ...commonFields,
  confirmPassword: 'string!',
  agreeTerms: 'boolean!'
});

// 登录 Schema
exports.loginSchema = dsl({
  email: commonFields.email,
  password: commonFields.password
});

// 更新 Schema
exports.updateSchema = dsl({
  username: commonFields.username,
  email: commonFields.email
  // 不包含密码
});
```

**schemas/index.js**:
```javascript
const userSchemas = require('./user.schema');
const postSchemas = require('./post.schema');

module.exports = {
  user: userSchemas,
  post: postSchemas
};
```

**routes/user.routes.js**:
```javascript
const schemas = require('../schemas');
const { validate } = require('schema-dsl');

router.post('/register', (req, res) => {
  const result = validate(schemas.user.registerSchema, req.body);
  // ...
});
```

---

### 2. Schema 复用

**使用 SchemaHelper**:
```javascript
const { SchemaHelper } = require('schema-dsl');

// 创建可复用字段库
const fields = SchemaHelper.createLibrary({
  email: 'email!',
  phone: dsl('string!').phone('cn'),
  password: dsl('string!').password('strong')
});

// 在多个 Schema 中复用
const registerSchema = dsl({
  ...fields.pick(['email', 'password']),
  username: 'string:3-32!'
});

const profileSchema = dsl({
  ...fields.pick(['email', 'phone']),
  bio: 'string:500'
});
```

---

## 生产环境建议

### 1. 环境配置

```javascript
// config/validator.js
const { Validator } = require('schema-dsl');

const config = {
  development: {
    verbose: true,
    allErrors: true,
    cache: false // 开发时不缓存，便于调试
  },
  production: {
    verbose: false,
    allErrors: false, // 只返回第一个错误
    cache: true      // 生产环境启用缓存
  }
};

module.exports = new Validator(
  config[process.env.NODE_ENV || 'development']
);
```

---

### 2. 监控和日志

```javascript
const validator = new Validator();

// 包装 validate 方法，添加监控
const originalValidate = validator.validate.bind(validator);
validator.validate = function(schema, data, options) {
  const startTime = Date.now();
  const result = originalValidate(schema, data, options);
  const duration = Date.now() - startTime;
  
  // 记录慢查询
  if (duration > 100) {
    console.warn(`Slow validation: ${duration}ms`);
  }
  
  // 记录验证失败
  if (!result.valid) {
    logger.info('Validation failed', {
      errors: result.errors.length,
      paths: result.errors.map(e => e.path)
    });
  }
  
  return result;
};
```

---

### 3. 健康检查

```javascript
// routes/health.js
app.get('/health', (req, res) => {
  const { validator } = require('../config/validator');
  
  // 检查验证器是否正常
  try {
    const testSchema = dsl({ test: 'string!' });
    const result = validator.validate(testSchema, { test: 'ok' });
    
    if (!result.valid) {
      throw new Error('Validator test failed');
    }
    
    res.json({ 
      status: 'ok',
      validator: 'operational',
      cacheSize: validator.getCacheSize()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message
    });
  }
});
```

---

### 4. 定期维护

```javascript
// 定期清理缓存
const cron = require('node-cron');

// 每天凌晨清理一次
cron.schedule('0 0 * * *', () => {
  validator.clearCache();
  console.log('Validator cache cleared');
});

// 或者根据内存使用情况清理
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.heapUsed > 500 * 1024 * 1024) { // 超过 500MB
    validator.clearCache();
  }
}, 60000); // 每分钟检查一次
```

---

## 性能基准参考

基于 SchemaI-DSL 的性能测试：

| 操作 | 性能指标 |
|------|---------|
| 简单验证（未缓存） | ~0.1ms |
| 简单验证（已缓存） | ~0.01ms |
| 复杂嵌套（未缓存） | ~1ms |
| 复杂嵌套（已缓存） | ~0.1ms |
| 批量验证（1000条） | ~100ms |

**结论**: 合理使用缓存可以提升 **10-100倍** 性能。

---

## 总结

遵循这些最佳实践，你的 SchemaI-DSL 代码将具备：

✅ **高性能** - 通过预编译和缓存  
✅ **高安全性** - 避免常见安全陷阱  
✅ **高可维护性** - 清晰的代码组织  
✅ **高可用性** - 完善的错误处理  

---

## 延伸阅读

- [性能优化指南](performance-guide.md)（待创建）
- [安全检查清单](security-checklist.md)（待创建）
- [故障排查指南](troubleshooting.md)

