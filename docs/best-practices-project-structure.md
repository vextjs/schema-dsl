# Schema-DSL 项目最佳实践示例

## 推荐的项目结构

```
your-project/
├── schemas/              # ✅ 所有 schema 定义（项目启动时加载）
│   ├── index.js          # 统一导出
│   ├── user.js           # 用户相关 schema
│   ├── order.js          # 订单相关 schema
│   └── product.js        # 产品相关 schema
├── routes/
│   ├── user.js           # 用户路由（使用 schemas/user.js）
│   ├── order.js          # 订单路由（使用 schemas/order.js）
│   └── product.js        # 产品路由（使用 schemas/product.js）
└── app.js                # 主应用入口
```

---

## 完整示例代码

### 1. 定义 Schema（schemas/user.js）

```javascript
const { dsl } = require('schema-dsl');

/**
 * 用户相关的所有 schema
 * 
 * ✅ 在项目启动时转换一次，后续直接复用
 * ✅ 避免每次请求都重复转换
 */
const userSchemas = {
  // 注册 schema
  register: dsl({
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .messages({
        'string.pattern': '用户名只能包含字母、数字和下划线',
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名最多32个字符'
      }),
    
    email: dsl('email!')
      .label('邮箱')
      .messages({
        'string.email': '请输入有效的邮箱地址'
      }),
    
    password: dsl('password:strong!')
      .label('密码')
      .messages({
        'string.password': '密码必须包含大小写字母、数字和特殊字符'
      }),
    
    age: 'number:18-120',
    
    phone: dsl('phone')
      .label('手机号')
      .messages({
        'string.phone': '请输入有效的手机号'
      })
  }),
  
  // 登录 schema
  login: dsl({
    username: 'string!',
    password: 'string!'
  }),
  
  // 更新个人资料 schema
  updateProfile: dsl({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500',
    birthday: 'date',
    gender: 'male|female|other'
  }),
  
  // 修改密码 schema
  changePassword: dsl({
    oldPassword: 'string!',
    newPassword: 'password:strong!'
  })
};

module.exports = userSchemas;
```

### 2. 定义 Schema（schemas/order.js）

```javascript
const { dsl } = require('schema-dsl');

const orderSchemas = {
  // 创建订单
  create: dsl({
    items: 'array:1-100<object>!',
    shippingAddress: dsl({
      name: 'string:2-50!',
      phone: 'phone!',
      address: 'string:10-200!',
      zipCode: 'string:6'
    }),
    paymentMethod: 'alipay|wechat|card!',
    couponCode: 'string:6-20'
  }),
  
  // 更新订单状态
  updateStatus: dsl({
    status: 'pending|paid|shipped|completed|cancelled!',
    note: 'string:0-500'
  })
};

module.exports = orderSchemas;
```

### 3. 统一导出（schemas/index.js）

```javascript
/**
 * 统一导出所有 schema
 * 
 * 使用方式：
 *   const schemas = require('./schemas');
 *   const result = validate(schemas.user.register, data);
 */
module.exports = {
  user: require('./user'),
  order: require('./order'),
  product: require('./product')
};
```

### 4. 在路由中使用（routes/user.js）

```javascript
const express = require('express');
const router = express.Router();
const { validate } = require('schema-dsl');
const userSchemas = require('../schemas/user');

/**
 * 用户注册
 * 
 * ✅ 使用预定义的 schema，不再重复转换
 */
router.post('/register', async (req, res) => {
  // ✅ 直接使用，性能最优
  const result = validate(userSchemas.register, req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: '数据验证失败',
      errors: result.errors
    });
  }
  
  // 处理注册逻辑
  try {
    const user = await createUser(result.data);
    res.status(201).json({
      code: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * 用户登录
 */
router.post('/login', async (req, res) => {
  // ✅ 直接使用
  const result = validate(userSchemas.login, req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      errors: result.errors
    });
  }
  
  // 处理登录逻辑
  // ...
});

/**
 * 更新个人资料
 */
router.put('/profile', authenticate, async (req, res) => {
  // ✅ 直接使用
  const result = validate(userSchemas.updateProfile, req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      errors: result.errors
    });
  }
  
  // 处理更新逻辑
  // ...
});

module.exports = router;
```

### 5. 主应用入口（app.js）

```javascript
const express = require('express');
const app = express();

// ✅ 在应用启动时加载所有 schema（只转换一次）
const schemas = require('./schemas');
console.log('✅ Schemas loaded:', Object.keys(schemas));

// 中间件
app.use(express.json());

// 路由
app.use('/api/user', require('./routes/user'));
app.use('/api/order', require('./routes/order'));
app.use('/api/product', require('./routes/product'));

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log('✅ All schemas are pre-compiled and ready to use');
});

module.exports = app;
```

---

## 性能对比

### ❌ 不推荐：每次请求都转换

```javascript
// ❌ 错误示例
router.post('/register', (req, res) => {
  const result = validate(
    {  // ❌ 每次请求都转换
      username: 'string:3-32!',
      email: 'email!',
      password: 'password:strong!'
    },
    req.body
  );
  // ...
});
```

**性能问题**：
- ❌ 每次请求都执行 DSL → JSON Schema 转换
- ❌ 1000 次请求 = 1000 次转换
- ❌ 高并发时性能损失明显

### ✅ 推荐：项目启动时转换

```javascript
// ✅ 正确示例
const userSchemas = require('../schemas/user');  // ✅ 启动时加载

router.post('/register', (req, res) => {
  const result = validate(
    userSchemas.register,  // ✅ 直接使用
    req.body
  );
  // ...
});
```

**性能优势**：
- ✅ 启动时转换 1 次
- ✅ 1000 次请求 = 0 次转换
- ✅ 高并发时性能最优

---

## 使用场景总结

| 场景 | 推荐方式 | 代码示例 | 原因 |
|------|---------|---------|------|
| **生产环境 API** | ✅ 项目启动时配置 | `const schemas = require('./schemas')` | 避免每次请求都转换 |
| **高并发服务** | ✅ 项目启动时配置 | 同上 | 3-5% 的性能损失会被放大 |
| **微服务** | ✅ 项目启动时配置 | 同上 | 保证响应时间稳定 |
| **单次脚本** | ✅ 直接用 DSL 对象 | `validate({ email: 'email!' }, data)` | 只执行一次，性能影响可忽略 |
| **原型开发** | ✅ 直接用 DSL 对象 | 同上 | 快速迭代，无需在意性能 |
| **测试代码** | ✅ 直接用 DSL 对象 | 同上 | 简洁清晰，易于维护 |

---

## 常见错误

### ❌ 错误1：在路由文件中定义 schema

```javascript
// ❌ 不推荐
router.post('/register', (req, res) => {
  const schema = dsl({  // ❌ 每次请求都创建
    username: 'string:3-32!',
    email: 'email!'
  });
  
  const result = validate(schema, req.body);
  // ...
});
```

**问题**：每次请求都创建新的 schema 对象，浪费性能。

### ❌ 错误2：在函数内部定义 schema

```javascript
// ❌ 不推荐
function validateUser(data) {
  const schema = dsl({  // ❌ 每次调用都创建
    username: 'string:3-32!',
    email: 'email!'
  });
  
  return validate(schema, data);
}
```

**问题**：每次调用函数都创建新的 schema，应该提到函数外部。

### ✅ 正确：在模块顶部定义

```javascript
// ✅ 推荐：模块加载时创建一次
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});

router.post('/register', (req, res) => {
  const result = validate(userSchema, req.body);  // ✅ 直接使用
  // ...
});
```

---

## TypeScript 支持

```typescript
// schemas/user.ts
import { dsl } from 'schema-dsl';

export const userSchemas = {
  register: dsl({
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': '只能包含字母、数字和下划线' }),
    email: 'email!',
    password: 'password:strong!',
    age: 'number:18-120'
  }),
  
  login: dsl({
    username: 'string!',
    password: 'string!'
  })
};

// routes/user.ts
import { validate } from 'schema-dsl';
import { userSchemas } from '../schemas/user';

router.post('/register', (req, res) => {
  const result = validate(userSchemas.register, req.body);
  // ...
});
```

---

## 总结

**✅ 最佳实践**：
1. 在单独的 `schemas/` 目录定义所有 schema
2. 项目启动时加载，转换一次
3. 路由中直接使用，不再转换
4. 适合生产环境和高并发场景

**✅ 性能优势**：
- 避免每次请求都重复转换
- schema 复用，内存占用更小
- 响应时间更稳定

**✅ 代码优势**：
- 集中管理所有验证规则
- 易于维护和修改
- 类型安全（TypeScript）
