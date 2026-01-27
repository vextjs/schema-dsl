# Schema-DSL 性能优化快速参考

## 🚀 核心原则

**生产环境：在项目启动时配置好所有 schema，避免每次请求都重复转换**

---

## ❌ 错误示例（性能差）

```javascript
// ❌ 每次请求都转换（性能损失 3-5%）
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number!' },  // ❌ 每次都转换
    req.body
  );
});
```

---

## ✅ 正确示例（性能最优）

### 步骤1：定义 Schema（schemas/user.js）

```javascript
const { dsl } = require('schema-dsl');

// ✅ 项目启动时转换一次
module.exports = {
  register: dsl({
    email: 'email!',
    password: 'password:strong!',
    age: 'number:18-'
  }),
  
  login: dsl({
    email: 'email!',
    password: 'string!'
  })
};
```

### 步骤2：在路由中使用（routes/user.js）

```javascript
const userSchemas = require('../schemas/user');
const { validate } = require('schema-dsl');

// ✅ 直接使用，不再转换
app.post('/api/register', (req, res) => {
  const result = validate(userSchemas.register, req.body);
  // ...
});

app.post('/api/login', (req, res) => {
  const result = validate(userSchemas.login, req.body);
  // ...
});
```

---

## 📊 性能对比

| 方式 | 1000次请求 | 转换次数 | 适用场景 |
|------|-----------|---------|---------|
| ❌ 每次转换 | ~3.4秒 | 1000次 | 原型、测试 |
| ✅ 启动配置 | ~3.3秒 | 1次 | **生产环境** |

**性能差异：约 3-5%**

---

## 📁 推荐项目结构

```
your-project/
├── schemas/              # ✅ 所有 schema 定义
│   ├── index.js          # 统一导出
│   ├── user.js
│   └── order.js
├── routes/               # 路由使用 schemas/
│   ├── user.js
│   └── order.js
└── app.js                # 启动时加载 schemas
```

---

## 🎯 使用场景

| 场景 | 推荐方式 |
|------|---------|
| 生产环境 API | ✅ 项目启动时配置 |
| 高并发服务 | ✅ 项目启动时配置 |
| 微服务 | ✅ 项目启动时配置 |
| 单次脚本 | ✅ 直接用 DSL 对象 |
| 原型开发 | ✅ 直接用 DSL 对象 |
| 测试代码 | ✅ 直接用 DSL 对象 |

---

## 💡 记住

**生产环境 = 启动时配置 = 性能最优**

```javascript
// ✅ 这样做
const schemas = require('./schemas');  // 启动时加载
validate(schemas.user.register, data);  // 直接使用

// ❌ 不要这样
validate({ email: 'email!' }, data);  // 每次都转换
```

---

## 📚 完整文档

- `best-practices-project-structure.md` - 完整示例
- `validate-dsl-object-support.md` - 功能说明
