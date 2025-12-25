# SchemaIO 错误处理完整指南

> **版本**: v2.0.1  
> **更新**: 2025-12-25  
> **适用**: 企业级应用开发  

---

## 📋 目录

1. [错误对象结构](#错误对象结构)
2. [错误消息定制](#错误消息定制)
3. [错误码系统](#错误码系统)
4. [多层级错误处理](#多层级错误处理)
5. [API响应设计](#api响应设计)
6. [前端错误展示](#前端错误展示)
7. [错误日志记录](#错误日志记录)
8. [最佳实践](#最佳实践)

---

## 错误对象结构

### 基础结构

SchemaIO 验证返回的错误对象结构：

```javascript
const { dsl, validate } = require('schemaio');

const schema = dsl({
  username: 'string:3-32!'.label('用户名')
});

const result = validate(schema, { username: 'ab' });

// 返回结构
{
  valid: false,           // 验证是否通过
  errors: [              // 错误数组（基于 ajv）
    {
      instancePath: '/username',
      schemaPath: '#/properties/username/minLength',
      keyword: 'minLength',
      params: { limit: 3 },
      message: 'must NOT have fewer than 3 characters'
    }
  ]
}
```

### 嵌套对象错误

```javascript
const { dsl, validate } = require('schemaio');

const schema = dsl({
  user: {
    profile: {
      email: 'email!'
    }
  }
});

const result = validate(schema, {
  user: {
    profile: {
      email: 'invalid'
    }
  }
});

// 错误路径
console.log(result.errors[0].instancePath); // '/user/profile/email'
console.log(result.errors[0].message);      // 'must match format "email"'
```

### 数组项错误

```javascript
const { dsl, validate } = require('schemaio');

const schema = dsl({
  items: 'array<string:3->!'
});

const result = validate(schema, {
  items: ['ab', 'valid']
});

// 错误路径
console.log(result.errors[0].instancePath); // '/items/0'
```

---

## 错误消息定制

### 单字段定制

```javascript
const { dsl } = require('schemaio');

// 使用 String 扩展定制消息
const schema = dsl({
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'min': '太短了！至少要3个字符'
    })
});
```

### 多规则定制

```javascript
const { dsl } = require('schemaio');

const schema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'format': '邮箱格式不对哦',
      'required': '邮箱不能为空'
    })
});
```

### 对象级定制

```javascript
const { dsl } = require('schemaio');

const schema = dsl({
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'min': '{{#label}}至少{{#limit}}个字符',
      'max': '{{#label}}最多{{#limit}}个字符'
    }),
  
  email: 'email!'
    .label('邮箱')
    .messages({
      'format': '{{#label}}格式无效'
    })
});
```

### 全局定制

```javascript
const { Locale } = require('schemaio');

// 设置全局消息
Locale.setMessages({
  'min': '输入太短，要{{#limit}}个字符',
  'format': '格式不正确'
});
```

---

## 错误码系统

### 内置错误码（简化版）

SchemaIO 对 ajv 的错误关键字进行了简化映射，使其更易用：

#### 字符串错误码

| 关键字 | 原始关键字 | 说明 | params |
|--------|-----------|------|--------|
| `min` | `minLength` | 长度小于最小值 | { limit: number } |
| `max` | `maxLength` | 长度大于最大值 | { limit: number } |
| `format` | `format` | 格式验证失败 | { format: 'email'/'uri'/etc } |
| `pattern` | `pattern` | 正则不匹配 | { pattern: string } |
| `enum` | `enum` | 不在枚举值中 | { allowedValues: array } |

#### 数字错误码

| 关键字 | 原始关键字 | 说明 | params |
|--------|-----------|------|--------|
| `min` | `minimum` | 小于最小值 | { limit: number } |
| `max` | `maximum` | 大于最大值 | { limit: number } |

#### 通用错误码

| 关键字 | 说明 | params |
|--------|------|--------|
| `required` | 必填字段缺失 | { missingProperty: string } |
| `type` | 类型不匹配 | { type: string } |

**💡 提示**: 您可以使用简化关键字（如 `min`）或原始关键字（如 `minLength`）来定制错误消息，系统会自动处理映射。

### 自动 Label 翻译 (v2.1.0)

如果您在语言包中定义了 `label.{fieldName}`，系统会自动将其作为 Label 使用，无需显式调用 `.label()`。

```javascript
// 语言包
Locale.addLocale('zh-CN', {
  'label.username': '用户名',
  'required': '{{#label}}不能为空'
});

// Schema
const schema = dsl({
  username: 'string!' // 自动查找 label.username
});

// 错误消息: "用户名不能为空"
```

### 自定义验证错误

```javascript
const { dsl } = require('schemaio');

const schema = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      if (value.includes('forbidden')) {
        return '内容包含禁止的词语';
      }
      // 验证通过时无需返回
    })
    .label('用户名')
});
```

---

## 多层级错误处理

### 嵌套对象验证

```javascript
const { dsl, validate } = require('schemaio');

const schema = dsl({
  user: {
    name: 'string:1-100!',
    address: {
      country: 'string!'.label('国家'),
      city: 'string!'.label('城市'),
      street: 'string!'.label('街道')
    }
  }
});

const result = validate(schema, {
  user: {
    name: 'John',
    address: {
      country: 'CN'
      // 缺少city和street
    }
  }
});

// 错误示例
// result.errors[0].instancePath: '/user/address/city'
// result.errors[1].instancePath: '/user/address/street'
```

### 数组验证

```javascript
const { dsl, validate } = require('schemaio');

const schema = dsl({
  items: 'array:1-<string:3->!'
    .label('商品列表')
});

const result = validate(schema, {
  items: ['ab', 'valid']  // 第一项太短
});

// 错误路径
console.log(result.errors[0].instancePath); // '/items/0'
```

---

## API响应设计

### 标准响应格式

```javascript
// 成功响应
{
  success: true,
  code: 'SUCCESS',
  data: { ... }
}

// 验证错误响应
{
  success: false,
  code: 'VALIDATION_ERROR',
  message: '数据验证失败',
  errors: [
    {
      field: 'username',
      message: 'must NOT have fewer than 3 characters',
      keyword: 'minLength',
      params: { limit: 3 }
    }
  ]
}

// 服务器错误响应
{
  success: false,
  code: 'SERVER_ERROR',
  message: '服务器内部错误'
}
```

### Express中间件

```javascript
const { dsl, Validator } = require('schemaio');

// 验证中间件
function validateBody(schema) {
  const validator = new Validator();
  
  return (req, res, next) => {
    const result = validator.validate(schema, req.body);
    
    if (!result.valid) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: '请检查输入信息',
        errors: result.errors.map(err => ({
          field: err.instancePath.replace(/^\//, '').replace(/\//g, '.'),
          message: err.message,
          keyword: err.keyword,
          params: err.params
        }))
      });
    }
    
    // 验证通过，继续处理
    next();
  };
}

// 使用示例
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-64!'
});

app.post('/api/users', 
  validateBody(userSchema),
  async (req, res) => {
    const user = await createUser(req.body);
    res.json({ success: true, data: user });
  }
);
```

### Koa中间件

```javascript
const { dsl, Validator } = require('schemaio');

function validateBody(schema) {
  const validator = new Validator();
  
  return async (ctx, next) => {
    const result = validator.validate(schema, ctx.request.body);
    
    if (!result.valid) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        code: 'VALIDATION_ERROR',
        message: '数据验证失败',
        errors: result.errors.map(err => ({
          field: err.instancePath.replace(/^\//, '').replace(/\//g, '.'),
          message: err.message,
          keyword: err.keyword
        }))
      };
      return;
    }
    
    await next();
  };
}

// 使用示例
const registerSchema = dsl({
  username: 'string:3-32!'.username(),
  email: 'email!',
  password: 'string!'.password('strong')
});

router.post('/register', validateBody(registerSchema), async (ctx) => {
  ctx.body = { success: true, data: await register(ctx.request.body) };
});
```

---

## 前端错误展示

### React示例

```javascript
import React, { useState } from 'react';

function RegisterForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!data.success && data.code === 'VALIDATION_ERROR') {
        // 将错误数组转为对象
        const errorMap = {};
        data.errors.forEach(err => {
          errorMap[err.field] = err.message;
        });
        setErrors(errorMap);
      }
      
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input name="username" />
        {errors.username && (
          <span className="error">{errors.username}</span>
        )}
      </div>
      
      <div>
        <input name="email" type="email" />
        {errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>
      
      <button type="submit">注册</button>
    </form>
  );
}
```

### Vue示例

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.username" />
      <span v-if="errors.username" class="error">
        {{ errors.username }}
      </span>
    </div>
    
    <div>
      <input v-model="form.email" type="email" />
      <span v-if="errors.email" class="error">
        {{ errors.email }}
      </span>
    </div>
    
    <button type="submit">注册</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        email: ''
      },
      errors: {}
    };
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });
        
        const data = await response.json();
        
        if (!data.success && data.code === 'VALIDATION_ERROR') {
          this.errors = data.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {});
        }
        
      } catch (error) {
        console.error(error);
      }
    }
  }
};
</script>
```

---

## 错误日志记录

### 基础日志

```javascript
app.post('/api/register', async (req, res) => {
  const result = await registerSchema.validate(req.body, {
    abortEarly: false
  });
  
  if (!result.isValid) {
    // 记录验证错误
    logger.warn('用户注册验证失败', {
      ip: req.ip,
      errors: result.errors,
      data: req.body
    });
    
    return res.status(400).json({
      success: false,
      errors: result.errors
    });
  }
  
  // 继续处理
});
```

### 结构化日志

```javascript
const logger = require('winston');

function logValidationError(req, result) {
  logger.warn({
    message: '验证失败',
    type: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    url: req.url,
    method: req.method,
    errors: result.errors.map(err => ({
      path: err.path.join('.'),
      type: err.type,
      message: err.message
    })),
    // 敏感数据脱敏
    data: maskSensitiveData(req.body)
  });
}
```

---

## 最佳实践

### 1. 使用 label 让错误消息更清晰

```javascript
const { dsl } = require('schemaio');

// ✅ 推荐：使用 label
const schema = dsl({
  username: 'string:3-32!'.label('用户名')
});
// 错误消息会包含"用户名"标签

// ❌ 不推荐：不使用 label
const schema = dsl({
  username: 'string:3-32!'
});
// 错误消息只显示字段名 "username"
```

### 2. 提供友好的中文错误消息

```javascript
const { dsl } = require('schemaio');

// ✅ 推荐：自定义中文消息
const schema = dsl({
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'minLength': '{{#label}}至少需要{{#limit}}个字符',
      'maxLength': '{{#label}}最多{{#limit}}个字符'
    })
});

// ❌ 不推荐：使用默认英文消息
const schema = dsl({
  username: 'string:3-32!'
});
```

### 3. 使用自定义验证实现业务逻辑

```javascript
const { dsl } = require('schemaio');

// ✅ 推荐：返回错误消息字符串
const schema = dsl({
  username: 'string:3-32!'
    .custom(async (value) => {
      if (await userExists(value)) {
        return '用户名已被占用';
      }
      // 验证通过时无需返回
    })
    .label('用户名')
});
```

### 4. 敏感数据不要出现在错误日志中

```javascript
function maskSensitiveData(data) {
  return {
    ...data,
    password: '***',
    confirmPassword: '***',
    creditCard: data.creditCard ? '****' + data.creditCard.slice(-4) : undefined
  };
}

// 使用
logger.warn('验证失败', {
  errors: result.errors,
  data: maskSensitiveData(req.body)
});
```

### 5. 统一错误格式便于前端处理

```javascript
// 统一的错误格式化函数
function formatValidationErrors(ajvErrors) {
  return ajvErrors.map(err => ({
    field: err.instancePath.replace(/^\//, '').replace(/\//g, '.'),
    message: err.message,
    keyword: err.keyword,
    params: err.params
  }));
}

// 使用
if (!result.valid) {
  return res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    errors: formatValidationErrors(result.errors)
  });
}
```

---

## 相关文档

- [API 参考文档](./api-reference.md)
- [DSL 语法指南](./dsl-syntax.md)
- [String 扩展文档](./string-extensions.md)
- [多语言配置](./dynamic-locale.md)

---

**文档版本**: v2.0.1  
**最后更新**: 2025-12-25

