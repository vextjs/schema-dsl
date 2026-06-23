# schema-dsl 最佳实践

当你已经有可用 schema，并希望进入生产级结构、性能和可维护性实践时阅读本页。项目组织方式请继续看 [项目结构最佳实践](best-practices-project-structure.md)。

## Schema 设计原则

### 1. 简单字段用纯 DSL

**推荐**:
```javascript
const schema = s({
  username: 'string:3-32!',
  age: 'number:18-120',
  email: 'email!',
  role: 'admin|user|guest'
});
```

**不推荐**（过度复杂）:
```javascript
const schema = s({
  username: s('string').min(3).max(32).require(),
  // 太冗长了！
});
```

**原则**: 简单字段保持紧凑 DSL 字面量；只有需要 label、messages、自定义验证器或其他增强时再追加链式方法。

---

### 2. 复杂验证用链式调用

**适合链式调用的场景**:
- 需要正则验证
- 需要自定义错误消息
- 需要自定义验证器
- 需要标签（label）

**示例**:
```javascript
const schema = s({
  // 简单字段：纯 DSL
  age: 'number:18-120',
  
  // 复杂字段：链式调用
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '只能包含字母、数字和下划线',
      'min': '至少3个字符',
      'max': '最多32个字符'
    }),
  
  email: s('email!')
    .custom((value) => {
      if (value.endsWith('@blocked.example')) return '该邮箱域名不允许注册';
    })
    .label('邮箱地址')
});
```

---

### 3. 使用预设验证器

schema-dsl 提供了常用的预设验证器，开箱即用：

```javascript
const schema = s({
  // ✅ 使用预设验证器（推荐）
  username: s('string!').username(),        // 自动设置 3-32 长度 + 正则
  password: s('string!').password('strong'), // 强密码验证
  phone: s('string!').phone('cn'),          // 中国手机号
  
  // ❌ 手动实现（不推荐）
  username: s('string:3-32!')
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
const schema = s({
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
const addressSchema = s({
  street: 'string!',
  city: 'string!',
  zipCode: 'string'
});

const userSchema = s({
  name: 'string!',
  email: 'email!',
  address: addressSchema
});

// 方案2: 扁平化
const schema = s({
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
  const schema = s({ username: 'string!' });
  const result = validate(schema, req.body); // 每次都编译
});
```

**推荐**（预编译）:
```javascript
// 在应用启动时编译一次
const validator = new Validator();
const userSchema = s({ username: 'string!' });
const validateUser = validator.compile(userSchema);

app.post('/api/user', (req, res) => {
  const result = validateUser(req.body); // 直接使用
});
```

**收益**: 复用已编译结果可以显著减少重复编译成本，尤其适合热点路由和高频校验路径。

---

### 2. 启用缓存

```javascript
const validator = new Validator({
  cache: true  // ✅ 简写：启用默认编译缓存配置
});

// 需要更细粒度时，使用对象配置
const tunedValidator = new Validator({
  cache: {
    enabled: true,
    maxSize: 500,
    ttl: 60 * 60 * 1000
  }
});

// 或者使用全局单例（默认启用缓存）
import { validate } from 'schema-dsl/pure';
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
import { SchemaUtils, Validator } from 'schema-dsl/pure';

const validator = new Validator();
const result = SchemaUtils.validateBatch(schema, records, validator.getAjv());
// 当你已经复用 Validator 底层 Ajv 实例时，这条路径适合批量校验
```

> ℹ️ 如果你确实要直接传入自己创建的 Ajv 实例，请先确保它已经注册了与 schema-dsl 生成 schema 匹配的格式和关键字；对大多数项目来说，直接复用 `validator.getAjv()` 更稳妥。

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

**工具**: 使用 [safe-regex2](https://github.com/fastify/safe-regex2) 检测危险正则。

---

### 5. 避免在循环中创建 Schema

**不推荐**:
```javascript
records.forEach(record => {
  const schema = s({ name: 'string!' }); // 每次都创建
  validate(schema, record);
});
```

**推荐**:
```javascript
const schema = s({ name: 'string!' }); // 创建一次
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
  const schema = s('string').pattern(new RegExp(pattern)); // 危险！
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
  const schema = s('string').pattern(pattern);
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
const MAX_SCHEMA_SIZE = 10000;

if (JSON.stringify(schema).length > MAX_SCHEMA_SIZE) {
  throw new Error('Schema 体积过大，建议拆分');
}

// 在 validate 前检查
const depthCheck = DslBuilder.validateNestingDepth(schema, 10);
if (!depthCheck.valid) {
  throw new Error(depthCheck.message);
}
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
const schema = s({
  username: s('string:3-32!').label('用户名')
    .messages({
      'required': '{{#label}}不能为空',
      'min': '{{#label}}至少需要{{#limit}}个字符',
      'max': '{{#label}}最多{{#limit}}个字符',
      'pattern': '{{#label}}格式不正确'
    }),
  
  email: s('email!')
    .label('邮箱地址')
    .messages({
      'required': '请填写{{#label}}',
      'format': '{{#label}}格式不正确'
    })
});
```

**效果**:
```text
❌ 用户名不能为空
❌ 用户名至少需要3个字符
✅ 清晰明了，用户友好
```

---

### 3. 处理外部异步校验错误

> `.custom()` 支持同步函数；涉及数据库、RPC、HTTP 等异步检查时，可返回 `Promise` 并通过 `validateAsync()` 执行，也可以在基础校验通过后于业务层单独执行。

```javascript
const schema = s({
  email: s('email!').label('邮箱地址')
});

async function validateUser(data) {
  const result = validate(schema, data);
  if (!result.valid) return result;

  try {
    const exists = await checkEmailExists(data.email);
    if (exists) {
      return {
        valid: false,
        errors: [{ field: 'email', keyword: 'business', message: '邮箱已被占用' }]
      };
    }
  } catch (error) {
    console.error('Email check failed:', error);
  }

  return result;
}
```

---

## 代码组织

### 1. 集中管理 Schema

**推荐的项目结构**:
```text
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
import { s } from 'schema-dsl/pure';

// 可复用的字段
const commonFields = {
  username: s('string!').username().label('用户名'),
  email: 'email!',
  password: s('string!').password('strong').label('密码')
};

// 注册 Schema
export const registerSchema = s({
  ...commonFields,
  confirmPassword: 'string!',
  agreeTerms: 'boolean!'
});

// 登录 Schema
export const loginSchema = s({
  email: commonFields.email,
  password: commonFields.password
});

// 更新 Schema
export const updateSchema = s({
  username: commonFields.username,
  email: commonFields.email
  // 不包含密码
});
```

**schemas/index.js**:
```javascript
import * as userSchemas from './user.schema.js';
import * as postSchemas from './post.schema.js';

export default {
  user: userSchemas,
  post: postSchemas
};
```

**routes/user.routes.js**:
```javascript
import schemas from '../schemas';
import { validate } from 'schema-dsl/pure';

router.post('/register', (req, res) => {
  const result = validate(schemas.user.registerSchema, req.body);
  // ...
});
```

---

### 2. Schema 复用

**使用 SchemaUtils**:
```javascript
import { SchemaUtils, s } from 'schema-dsl/pure';

// 创建可复用字段库
const fields = SchemaUtils.createLibrary({
  email: () => 'email!',
  phone: () => s('string!').phone('cn'),
  password: () => s('string!').password('strong')
});

// 在多个 Schema 中复用
const registerSchema = s({
  email: fields.email(),
  password: fields.password(),
  username: 'string:3-32!'
});

const profileSchema = s({
  email: fields.email(),
  phone: fields.phone(),
  bio: 'string:500'
});
```

---

## 生产环境建议

### 1. 环境配置

```javascript
// config/validator.js
import { Validator } from 'schema-dsl/pure';

const config = {
  development: {
    verbose: true,
    allErrors: true,
    cache: false // ✅ 简写：关闭缓存，便于调试
  },
  production: {
    verbose: false,
    allErrors: false, // 只返回第一个错误
    cache: {
      enabled: true,
      maxSize: 1000,
      ttl: 60 * 60 * 1000
    }
  }
};

export const validator = new Validator(
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
import { validator } from '../config/validator.js';

app.get('/health', (req, res) => {
  // 检查验证器是否正常
  try {
    const testSchema = s({ test: 'string!' });
    const result = validator.validate(testSchema, { test: 'ok' });
    
    if (!result.valid) {
      throw new Error('Validator test failed');
    }
    
    res.json({ 
      status: 'ok',
      validator: 'operational',
      cacheStats: validator.getCacheStats()
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
import cron from 'node-cron';

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

缓存命中前后通常能显著降低重复编译开销，但绝对耗时会受到机器性能、Node 版本、schema 复杂度、数据规模和命中率影响，不建议把某组固定毫秒数当成通用基准。

**更稳定的结论**:

- 复用同一个 schema 对象或 `Validator` 实例，通常比每次请求都重新编译更快
- schema 越复杂、重复验证次数越多，缓存收益通常越明显
- 批量验证总耗时主要取决于单条 schema 复杂度和数据规模，不应使用固定毫秒数做容量承诺

如需当前可复查的吞吐量对比，请以维护中的 benchmark 结果和 FAQ 中同步的性能数据为准。

---

## 总结

遵循这些最佳实践，你的 schema-dsl 代码将具备：

✅ **高性能** - 通过预编译和缓存  
✅ **高安全性** - 避免常见安全陷阱  
✅ **高可维护性** - 清晰的代码组织  
✅ **高可用性** - 完善的错误处理  

---

## 延伸阅读

- [性能优化指南](performance-guide.md)
- [安全注意事项](security-checklist.md)
- [故障排查指南](troubleshooting.md)

---

## 对应示例文件

**示例入口**: [best-practices.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/best-practices.ts)  
**说明**: 展示“简单字段用纯 DSL、复杂字段局部使用 Builder、字段库复用”的推荐组合，以及成功 / 失败两条验证路径。

