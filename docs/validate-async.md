# validateAsync - 异步验证

> 验证失败自动抛出错误

---

## 快速开始

```javascript
const { dsl, validateAsync } = require('schema-dsl');

const userSchema = dsl({
  name: 'string!',
  email: 'email!',
  age: 'integer:18-120'
});

try {
  const data = await validateAsync(userSchema, {
    name: 'John',
    email: 'john@example.com',
    age: 30
  });
  
  console.log('验证成功:', data);
} catch (error) {
  console.error('验证失败:', error.message);
}
```

---

## 基础用法
    name: '',
    email: 'invalid'
  });
} catch (error) {
  console.log(error instanceof ValidationError); // true
  console.log(error.getFieldErrors());
  // { name: '长度必须大于等于1', email: '邮箱格式错误', age: '字段必填' }
}
```

---

## ValidationError

### 属性

```javascript
class ValidationError extends Error {
  name: 'ValidationError'        // 错误名称
  message: string                // 友好的错误消息
  errors: Array<Object>          // 原始错误列表
  data: any                      // 原始输入数据
  statusCode: 400                // HTTP 状态码
}
```

### 方法

#### 1. `toJSON()` - 转换为 JSON（用于 API 响应）

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const json = error.toJSON();
  // {
  //   error: 'ValidationError',
  //   message: 'Validation failed: name: 字段必填',
  //   statusCode: 400,
  //   details: [
  //     { field: 'name', message: '字段必填', keyword: 'required', params: {...} }
  //   ]
  // }
}
```

#### 2. `getFieldError(field)` - 获取指定字段的错误

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const nameError = error.getFieldError('name');
  console.log(nameError.message); // '字段必填'
}
```

#### 3. `getFieldErrors()` - 获取所有字段的错误映射

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const fieldErrors = error.getFieldErrors();
  // { name: '字段必填', email: '邮箱格式错误' }
}
```

#### 4. `hasFieldError(field)` - 检查字段是否有错误

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  if (error.hasFieldError('email')) {
    console.log('邮箱格式错误');
  }
}
```

#### 5. `getErrorCount()` - 获取错误数量

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  console.log(`发现 ${error.getErrorCount()} 个错误`);
}
```

---

## Express 集成

### 基础集成

```javascript
const express = require('express');
const { dsl, validateAsync, ValidationError } = require('schema-dsl');

const app = express();
app.use(express.json());

// 定义 Schema
const userSchema = dsl({
  name: 'string:1-50!',
  email: 'email!',
  age: 'integer:18-120'
});

// 路由处理
app.post('/users', async (req, res, next) => {
  try {
    // 验证请求体
    const validData = await validateAsync(userSchema, req.body);
    
    // 保存到数据库
    const user = await db.users.insert(validData);
    
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error); // 传递给错误处理中间件
  }
});

// 全局错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  // 其他错误
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000);
```

### 完整 CRUD 示例

```javascript
const { SchemaUtils } = require('schema-dsl');

// 定义完整 Schema
const fullUserSchema = dsl({
  id: 'objectId!',
  name: 'string:1-50!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:18-120',
  createdAt: 'date',
  updatedAt: 'date'
});

// POST /users - 创建用户（严格模式）
const createSchema = SchemaUtils
  .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt'])
  .strict();

app.post('/users', async (req, res, next) => {
  try {
    const data = await validateAsync(createSchema, req.body);
    const user = await db.users.insert({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// GET /users/:id - 查询用户（移除敏感字段）
const publicSchema = SchemaUtils
  .omit(fullUserSchema, ['password'])
  .clean();

app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.users.findById(req.params.id);
    const { validate } = require('schema-dsl');
    const result = validate(publicSchema, user);
    res.json(result.data); // 自动移除 password
  } catch (error) {
    next(error);
  }
});

// PATCH /users/:id - 更新用户（部分验证）
const updateSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'age'])
  .partial()
  .loose();

app.patch('/users/:id', async (req, res, next) => {
  try {
    const data = await validateAsync(updateSchema, req.body);
    const user = await db.users.updateById(req.params.id, {
      ...data,
      updatedAt: new Date()
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /users/:id - 替换用户（严格模式）
const replaceSchema = SchemaUtils
  .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt'])
  .strict();

app.put('/users/:id', async (req, res, next) => {
  try {
    const data = await validateAsync(replaceSchema, req.body);
    const user = await db.users.replaceById(req.params.id, {
      ...data,
      updatedAt: new Date()
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

---

## 错误处理

### 自定义错误格式

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    // 自定义错误响应格式
    return res.status(422).json({
      code: 'VALIDATION_FAILED',
      message: '数据验证失败',
      timestamp: new Date().toISOString(),
      fields: error.getFieldErrors()
    });
  }
  
  next(error);
});
```

### 分类错误处理

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    const fieldErrors = error.getFieldErrors();
    
    // 邮箱格式错误
    if (error.hasFieldError('email')) {
      return res.status(400).json({
        code: 'INVALID_EMAIL',
        message: '邮箱格式错误',
        field: 'email'
      });
    }
    
    // 其他验证错误
    return res.status(400).json(error.toJSON());
  }
  
  next(error);
});
```

### 日志记录

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    // 记录验证错误日志
    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: error.errors,
      data: error.data
    });
    
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  next(error);
});
```

---

## 完整示例

### 用户注册 API

```javascript
const express = require('express');
const bcrypt = require('bcrypt');
const { dsl, validateAsync, ValidationError, SchemaUtils } = require('schema-dsl');

const app = express();
app.use(express.json());

// 基础用户 Schema
const baseUserSchema = dsl({
  id: 'objectId!',
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:18-120',
  createdAt: 'date',
  updatedAt: 'date'
});

// 注册 Schema（排除系统字段，严格模式）
const registerSchema = SchemaUtils
  .omit(baseUserSchema, ['id', 'createdAt', 'updatedAt'])
  .strict();

// 注册接口
app.post('/register', async (req, res, next) => {
  try {
    // 1. 验证请求数据
    const data = await validateAsync(registerSchema, req.body);
    
    // 2. 检查用户是否存在
    const existingUser = await db.users.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({
        code: 'USER_EXISTS',
        message: '邮箱已被注册'
      });
    }
    
    // 3. 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // 4. 保存用户
    const user = await db.users.insert({
      ...data,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 5. 返回公开信息（移除密码）
    const publicSchema = SchemaUtils
      .omit(baseUserSchema, ['password'])
      .clean();
    
    const { validate } = require('schema-dsl');
    const result = validate(publicSchema, user);
    
    res.status(201).json({
      success: true,
      user: result.data
    });
    
  } catch (error) {
    next(error);
  }
});

// 全局错误处理
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## API 参考

### validateAsync(schema, data, options?)

**参数**:
- `schema` - JSON Schema 或 DslBuilder 实例
- `data` - 待验证的数据
- `options` - 验证选项（可选）
  - `locale` - 语言设置（如 'zh-CN', 'en-US'）
  - `format` - 是否格式化错误（默认 true）

**返回值**:
- 验证通过：返回处理后的数据
- 验证失败：抛出 `ValidationError`

**示例**:
```javascript
// 基础用法
const data = await validateAsync(schema, inputData);

// 指定语言
const data = await validateAsync(schema, inputData, { locale: 'zh-CN' });

// 不格式化错误
const data = await validateAsync(schema, inputData, { format: false });
```

### ValidationError 类

**构造函数**:
```javascript
new ValidationError(errors, data)
```

**属性**:
- `name: 'ValidationError'`
- `message: string` - 友好的错误消息
- `errors: Array<Object>` - 原始错误列表
- `data: any` - 原始输入数据
- `statusCode: 400` - HTTP 状态码

**方法**:
- `toJSON()` - 转换为 JSON 格式
- `getFieldError(field)` - 获取指定字段的错误
- `getFieldErrors()` - 获取所有字段的错误映射
- `hasFieldError(field)` - 检查字段是否有错误
- `getErrorCount()` - 获取错误数量

---

## 相关文档

- [SchemaUtils 链式调用](schema-utils-chaining.md) - Schema 复用简化方法
- [validate.md](validate.md) - 传统同步验证方法
- [error-handling.md](error-handling.md) - 错误处理指南
- [Express 示例](../examples/express-integration.js) - 完整 Express 集成示例

---

**版本**: v1.0.4  
**更新日期**: 2025-12-29  
**作者**: SchemaI-DSL Team

