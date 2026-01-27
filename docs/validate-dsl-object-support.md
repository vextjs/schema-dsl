# validate() 函数支持 DSL 对象说明

## 问题

用户问：`validate(schema, { email: 'test@example.com', age: 25 })` 中的 `schema` 能否直接是个对象，为什么必须是 schema？

## 答案

**现在可以了！** 🎉 从 v1.1.7 开始，`validate()` 和 `validateAsync()` 都支持直接传入 DSL 对象。

---

## 支持的三种方式

### 方式1：传入 DSL 对象（✅ v1.1.7 新增）

```javascript
const { validate } = require('schema-dsl');

// ✅ 直接传入 DSL 对象，无需 dsl() 包裹
const result = validate(
  { email: 'email!', age: 'number:18-120' },  // DSL 对象
  { email: 'test@example.com', age: 25 }
);

console.log(result.valid);  // true
```

**优点**：
- ✅ 最简洁，无需 `dsl()` 包裹
- ✅ 代码更直观，适合简单场景

**⚠️ 注意**：DSL 对象也支持混合使用 DslBuilder 实例：

```javascript
const { dsl, validate } = require('schema-dsl');

// ✅ 混合使用：DslBuilder + DSL 字符串
const result = validate(
  {
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': '只能包含字母、数字和下划线' }),
    email: 'email!',  // 纯 DSL 字符串
    age: 'number:18-'
  },
  data
);
```

### 方式2：使用 dsl() 包裹（推荐）

```javascript
const { dsl, validate } = require('schema-dsl');

// ✅ 先转换为 JSON Schema，再验证
const schema = dsl({
  email: 'email!',
  age: 'number:18-120'
});

const result = validate(schema, { email: 'test@example.com', age: 25 });
```

**优点**：
- ✅ 更明确，意图清晰
- ✅ 可复用 schema
- ✅ 支持链式调用扩展

### 方式3：传入标准 JSON Schema

```javascript
const { validate } = require('schema-dsl');

// ✅ 传入标准 JSON Schema
const result = validate(
  {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      age: { type: 'number', minimum: 18, maximum: 120 }
    },
    required: ['email']
  },
  { email: 'test@example.com', age: 25 }
);
```

**优点**：
- ✅ 兼容标准 JSON Schema
- ✅ 可与其他 JSON Schema 工具互操作

---

## 实现原理

### 自动检测逻辑

`validate()` 函数会自动检测传入的 schema 类型：

```javascript
function validate(schema, data, options = {}) {
  // ✅ 自动检测并转换 DSL 对象
  if (_isDslObject(schema)) {
    schema = DslAdapter.parseObject(schema);
  }
  
  const validator = new Validator(options);
  return validator.validate(schema, data, options);
}
```

### 检测规则

判断是否为 DSL 对象的逻辑（`_isDslObject()`）：

1. **排除非对象**：不是普通对象返回 false
2. **排除 DslBuilder**：有 `toSchema()` 方法返回 false
3. **排除 ConditionalBuilder**：有 `_isConditional` 标记返回 false
4. **排除标准 JSON Schema**：
   - 有 `type` 字段且值为标准类型（string/number/object等）
   - `properties` 的所有值都包含 `type` 字段
5. **识别 DSL 对象**：
   - 属性值包含 DSL 字符串（如 `'email!'`, `'string:3-32'`）
   - 属性值包含嵌套的 DSL 对象

---

## 为什么之前必须是 schema？

### 历史原因

在 v1.1.7 之前，`validate()` 不会自动转换 DSL 对象：

```javascript
// ❌ v1.1.6 及之前版本会失败
const result = validate(
  { email: 'email!', age: 'number!' },  // 被当作 JSON Schema
  { email: 'test@example.com', age: 25 }
);
// 错误：Schema compilation failed: unknown keyword: "email"
```

**原因**：`validate()` 会把 DSL 对象当作标准 JSON Schema，而 `"email!"` 不是有效的 JSON Schema 关键字。

### 解决方案

v1.1.7 添加了自动检测和转换逻辑：

1. **检测 DSL 对象**：识别对象中的 DSL 字符串
2. **自动转换**：调用 `DslAdapter.parseObject()` 转换为 JSON Schema
3. **透明处理**：用户无需关心内部转换

---

## 使用建议

### 简单场景：直接用 DSL 对象

适用于：脚本、原型开发、测试代码、一次性验证

```javascript
// ✅ 简单验证，直接传 DSL 对象
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number:18-' },
    req.body
  );
  
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  
  // 处理数据...
});
```

### 复杂场景：项目启动时配置 schema（推荐）

适用于：生产环境、高并发服务、需要复用的场景

```javascript
// ✅ 最佳实践：在单独的文件中定义所有 schema

// schemas/user.js - 项目启动时加载，转换一次
const { dsl } = require('schema-dsl');

module.exports = {
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
  }),
  
  updateProfile: dsl({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500'
  })
};

// routes/user.js - 路由中直接使用，不再转换
const userSchemas = require('../schemas/user');
const { validate } = require('schema-dsl');

app.post('/api/register', (req, res) => {
  const result = validate(userSchemas.register, req.body);  // ✅ 直接使用
  // ...
});

app.post('/api/login', (req, res) => {
  const result = validate(userSchemas.login, req.body);  // ✅ 直接使用
  // ...
});

app.put('/api/user/profile', (req, res) => {
  const result = validate(userSchemas.updateProfile, req.body);  // ✅ 直接使用
  // ...
});
```

**性能优势**：
- ✅ 避免每次请求都转换 DSL 对象
- ✅ schema 只在项目启动时创建一次
- ✅ 适合高并发场景

### 需要链式调用：混合使用 DslBuilder

适用于：需要自定义错误消息、复杂验证规则

```javascript
// ✅ 需要自定义消息
const schema = dsl({
  email: dsl('email!')
    .label('邮箱地址')
    .messages({ 'string.email': '请输入有效的邮箱' }),
  
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'string.pattern': '只能包含字母、数字和下划线' })
});

const result = validate(schema, data);
```

---

## 对比总结

| 方式 | 简洁性 | 灵活性 | 复用性 | 适用场景 |
|------|-------|-------|-------|---------|
| DSL 对象 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 简单验证、一次性使用 |
| dsl() 包裹 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 复杂验证、需要复用 |
| JSON Schema | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 与其他工具互操作 |

---

## 注意事项

### 1. 性能考虑

DSL 对象会在每次 `validate()` 调用时转换，如果需要高性能：

```javascript
// ❌ 不推荐：每次请求都转换
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number!' },  // 每次都转换
    req.body
  );
});

// ✅ 推荐：提前转换，复用 schema
const userSchema = dsl({ email: 'email!', age: 'number!' });

app.post('/api/user', (req, res) => {
  const result = validate(userSchema, req.body);  // 直接使用
});
```

### 2. 类型混淆

确保 DSL 对象不会被误识别为 JSON Schema：

```javascript
// ✅ 明确的 DSL 对象
{ email: 'email!', age: 'number!' }  // 自动识别

// ⚠️ 可能混淆
{
  type: 'object',  // 有 type 字段
  email: 'email!'  // 但还有 DSL 字符串
}
// 会被识别为 JSON Schema（type 优先级高）
```

### 3. 嵌套对象

嵌套的 DSL 对象会被正确处理：

```javascript
// ✅ 支持嵌套
const result = validate(
  {
    user: {
      profile: {
        name: 'string!',
        age: 'number!'
      }
    }
  },
  data
);
```

---

## 完整示例

```javascript
const { validate, validateAsync } = require('schema-dsl');

// 示例1：同步验证
const result = validate(
  {
    email: 'email!',
    password: 'password:strong!',
    age: 'number:18-120',
    username: 'string:3-32!'
  },
  {
    email: 'test@example.com',
    password: 'MyP@ssw0rd!',
    age: 25,
    username: 'john_doe'
  }
);

if (result.valid) {
  console.log('验证通过');
} else {
  console.log('验证失败:', result.errors);
}

// 示例2：异步验证
(async () => {
  try {
    const data = await validateAsync(
      { email: 'email!', age: 'number!' },
      { email: 'test@example.com', age: 25 }
    );
    console.log('验证通过:', data);
  } catch (error) {
    console.error('验证失败:', error.errors);
  }
})();
```

---

## 总结

**问：为什么必须是 schema？**

**答：现在不必了！** 

- ✅ v1.1.7 开始支持直接传入 DSL 对象
- ✅ 自动检测并转换，无需手动包裹
- ✅ 完全向后兼容，不影响原有功能
- ✅ 同时支持 JSON Schema、DslBuilder、DSL 对象三种方式

**推荐使用**：
- 简单场景：直接用 DSL 对象
- 复杂场景：先用 `dsl()` 转换，便于复用和扩展

---

## 常见问题

### Q1: DSL 对象中可以使用链式调用吗？

**A: 可以！** 支持混合使用 DslBuilder 实例和 DSL 字符串：

```javascript
const result = validate(
  {
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .messages({ 'string.pattern': '只能包含字母、数字和下划线' }),
    email: 'email!',  // 纯 DSL 字符串
    age: 'number:18-'
  },
  data
);
```

嵌套对象中也支持：

```javascript
const result = validate(
  {
    user: {
      name: dsl('string:3-32!').messages({ 'string.min': '名字太短了' }),
      email: 'email!'
    }
  },
  data
);
```

### Q2: 直接用对象会有什么影响？

**性能影响**：

每次调用 `validate()` 时，DSL 对象都会被转换为 JSON Schema：

```javascript
// ❌ 性能较差：每次请求都重复转换（~3.4秒/1000次）
app.post('/api/user', (req, res) => {
  const result = validate(
    { email: 'email!', age: 'number!' },  // ❌ 每次请求都会执行 DSL → JSON Schema 转换
    req.body
  );
});

// ✅ 性能最优：项目启动时转换一次，复用 schema（~3.3秒/1000次）
const userSchema = dsl({ email: 'email!', age: 'number!' });  // ✅ 启动时转换一次

app.post('/api/user', (req, res) => {
  const result = validate(userSchema, req.body);  // ✅ 直接使用，不再转换
});
```

**性能差异**：约 3-5%（对于简单 schema）

**✅ 您的理解完全正确！**

**最佳实践**：在项目启动时配置好所有 schema

```javascript
// ✅ 推荐：在单独的文件中定义所有 schema（schemas/user.js）
const { dsl } = require('schema-dsl');

// 项目启动时转换一次，后续直接复用
const userSchemas = {
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
  }),
  
  updateProfile: dsl({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500'
  })
};

module.exports = userSchemas;

// 在路由中使用（routes/user.js）
const userSchemas = require('../schemas/user');

app.post('/api/register', (req, res) => {
  const result = validate(userSchemas.register, req.body);  // ✅ 直接使用
  // ...
});

app.post('/api/login', (req, res) => {
  const result = validate(userSchemas.login, req.body);  // ✅ 直接使用
  // ...
});
```

**场景建议**：

| 场景 | 推荐方式 | 原因 |
|------|---------|------|
| **生产环境 API** | ✅ 项目启动时配置 schema | 避免每次请求都转换，性能最优 |
| **高并发服务** | ✅ 项目启动时配置 schema | 3-5% 的性能损失会被放大 |
| **单次脚本** | ✅ 直接用 DSL 对象 | 只执行一次，性能影响可忽略 |
| **原型开发** | ✅ 直接用 DSL 对象 | 快速迭代，无需在意性能 |
| **测试代码** | ✅ 直接用 DSL 对象 | 简洁清晰，易于维护 |

### Q3: 为什么之前不这样设计？

**历史原因**：

1. **明确的职责分离**（设计哲学）
   ```javascript
   // 转换阶段：DSL → JSON Schema
   const schema = dsl({ email: 'email!', age: 'number!' });
   
   // 验证阶段：JSON Schema + data → result
   const result = validate(schema, data);
   ```
   这种设计让每个步骤的职责更清晰。

2. **避免隐式转换**（最小惊喜原则）
   ```javascript
   // 用户传入什么，就是什么
   validate(jsonSchema, data);  // JSON Schema
   validate(dslBuilder, data);  // DslBuilder
   
   // ❌ 之前不支持隐式转换
   validate({ email: 'email!' }, data);  // 会被当作 JSON Schema
   ```

3. **类型安全考虑**（TypeScript）
   ```typescript
   // 明确的类型定义
   function validate(
     schema: JSONSchema | DslBuilder,  // 明确的类型
     data: any
   ): ValidationResult;
   
   // 如果支持任意对象，类型推断会变复杂
   function validate(
     schema: JSONSchema | DslBuilder | Record<string, any>,  // 太宽泛
     data: any
   ): ValidationResult;
   ```

4. **性能考虑**（避免重复转换）
   ```javascript
   // 避免用户不经意间写出性能差的代码
   for (let i = 0; i < 10000; i++) {
     validate({ email: 'email!' }, data);  // 每次都转换
   }
   ```

**为什么现在改变了？**

1. **用户反馈**：很多用户期望更简洁的 API
2. **智能检测**：通过 `_isDslObject()` 准确区分 DSL 对象和 JSON Schema
3. **性能可接受**：转换开销很小（~3-5%）
4. **向后兼容**：不影响现有代码
5. **使用体验优先**：简化常见场景的使用

**设计权衡**：

| 设计方案 | 优点 | 缺点 |
|---------|------|------|
| **显式转换**（v1.1.6） | 职责清晰、类型安全、性能最优 | 代码冗长、学习成本高 |
| **自动转换**（v1.1.7） | 简洁直观、学习成本低 | 隐式行为、可能误用 |

**最终选择**：两者都支持，让用户自由选择！

```javascript
// ✅ 简单场景：直接用 DSL 对象
validate({ email: 'email!' }, data);

// ✅ 复杂场景：显式转换
const schema = dsl({ email: 'email!' });
validate(schema, data);
```

