# Schema-DSL 项目最佳实践示例

当你准备把 schema-dsl 放进真实应用，而不只是写一个示例文件时，先看本页。本页说明 schema 文件放在哪里、路由如何复用它们，以及如何避免每个请求都重新创建 schema。

## 推荐的项目结构

```text
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
import { s } from 'schema-dsl/pure';

/**
 * 用户相关的所有 schema
 * 
 * ✅ 在项目启动时转换一次，后续直接复用
 * ✅ 避免每次请求都重复转换
 */
const userSchemas = {
  // 注册 schema
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .messages({
        'string.pattern': '用户名只能包含字母、数字和下划线',
        'string.min': '用户名至少需要3个字符',
        'string.max': '用户名最多32个字符'
      }),
    
    email: s('email!')
      .label('邮箱')
      .messages({
        'string.email': '请输入有效的邮箱地址'
      }),
    
    password: s('string!').password('strong')
      .label('密码')
      .messages({
        'string.password': '密码必须包含大小写字母、数字和特殊字符'
      }),
    
    age: 'number:18-120',
    
    phone: s('phone')
      .label('手机号')
      .messages({
        'string.phone': '请输入有效的手机号'
      })
  }),
  
  // 登录 schema
  login: s({
    username: 'string!',
    password: 'string!'
  }),
  
  // 更新个人资料 schema
  updateProfile: s({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500',
    birthday: 'date',
    gender: 'male|female|other'
  }),
  
  // 修改密码 schema
  changePassword: s({
    oldPassword: 'string!',
    newPassword: s('string!').password('strong')
  })
};

export default userSchemas;
```

### 2. 定义 Schema（schemas/order.js）

```javascript
import { s } from 'schema-dsl/pure';

const orderSchemas = {
  // 创建订单
  create: s({
    items: 'array:1-100<object>!',
    shippingAddress: s({
      name: 'string:2-50!',
      phone: 'phone!',
      address: 'string:10-200!',
      zipCode: 'string:6'
    }),
    paymentMethod: 'alipay|wechat|card!',
    couponCode: 'string:6-20'
  }),
  
  // 更新订单状态
  updateStatus: s({
    status: 'pending|paid|shipped|completed|cancelled!',
    note: 'string:0-500'
  })
};

export default orderSchemas;
```

### 3. 统一导出（schemas/index.js）

```javascript
/**
 * 统一导出所有 schema
 * 
 * 使用方式：
 *   import schemas from './schemas/index.js';
 *   const result = validate(schemas.user.register, data);
 */
import userSchemas from './user.js';
import orderSchemas from './order.js';
import productSchemas from './product.js';

export default {
  user: userSchemas,
  order: orderSchemas,
  product: productSchemas
};
```

### 4. 在路由中使用（routes/user.js）

```javascript
import express from 'express';
const router = express.Router();
import { validate } from 'schema-dsl/pure';
import userSchemas from '../schemas/user';

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

export default router;
```

### 5. 主应用入口（app.js）

```javascript
import express from 'express';
import userRoutes from './routes/user.js';
import orderRoutes from './routes/order.js';
import productRoutes from './routes/product.js';

const app = express();

// ✅ 在应用启动时加载所有 schema（只转换一次）
import schemas from './schemas';
console.log('✅ Schemas loaded:', Object.keys(schemas));

// 中间件
app.use(express.json());

// 路由
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/product', productRoutes);

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log('✅ All schemas are loaded and ready to validate');
});

export default app;
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
      password: s('string!').password('strong')
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
- ❌ 如果请求会改变 schema 结构，缓存难以命中，内存和 CPU 压力都会上升

### ✅ 推荐：项目启动时转换

```javascript
// ✅ 正确示例
import userSchemas from '../schemas/user.js';  // ✅ 启动时加载

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

### 缓存与内存边界

稳定的请求级 DSL 通常是性能问题，而不是内存泄漏问题。只要 schema 结构相同，即使处理函数里创建了新的对象，validator 也可以复用编译缓存；但它仍然慢于启动时转换，因为 DSL 对象还需要重新归一化。

长运行服务真正有内存风险的场景，是接收或构造无限多种不同的 schema 结构：

```javascript
// ❌ 避免：请求级字段名会让每次请求都产生新的 schema 结构
router.post('/dynamic', (req, res) => {
  const schema = s({ [`field_${req.id}`]: 'string!' });
  const result = validate(schema, req.body);
  // ...
});
```

缓存对重复结构有效，但不能替代对动态 schema 基数的约束。

普通请求处理函数里也应避免 `new Validator()`。如果实例没有被保存，它通常不是保留型内存泄漏；但每次请求都会丢弃 AJV 实例和编译缓存。

---

## 使用场景总结

| 场景 | 推荐方式 | 代码示例 | 原因 |
|------|---------|---------|------|
| **生产环境 API** | ✅ 项目启动时配置 | `import schemas from './schemas/index.js'` | 避免每次请求都转换 |
| **高并发服务** | ✅ 项目启动时配置 | 同上 | 3-5% 的性能损失会被放大 |
| **微服务** | ✅ 项目启动时配置 | 同上 | 保证响应时间稳定 |
| **单次脚本** | ✅ 直接用 DSL 对象（当前版便捷函数支持） | `validate({ email: 'email!' }, data)` | 只执行一次，性能影响可忽略 |
| **原型开发** | ✅ 直接用 DSL 对象（当前版便捷函数支持） | 同上 | 快速迭代，无需在意性能 |
| **测试代码** | ✅ 直接用 DSL 对象（当前版便捷函数支持） | 同上 | 简洁清晰，易于维护 |

---

## 常见错误

### ❌ 错误1：在路由文件中定义 schema

```javascript
// ❌ 不推荐
router.post('/register', (req, res) => {
  const schema = s({  // ❌ 每次请求都创建
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
  const schema = s({  // ❌ 每次调用都创建
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
const userSchema = s({
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
import { s } from 'schema-dsl/pure';

export const userSchemas = {
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .error({ pattern: '只能包含字母、数字和下划线' }),
    email: 'email!',
    password: s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .error({ pattern: '密码至少 8 位且必须包含字母和数字' }),
    age: 'number:18-120'
  }),
  
  login: s({
    username: 'string!',
    password: 'string!'
  })
};

// routes/user.ts
import { validate } from 'schema-dsl/pure';
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

---

## 对应示例文件

**示例入口**: [best-practices-project-structure.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/best-practices-project-structure.ts)  
**说明**: 用一个最小的 `userSchemas` 对象模拟集中定义 / 路由复用结构，直接验证注册与登录两条路径。
