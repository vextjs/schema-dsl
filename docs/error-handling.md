# SchemaIO 错误处理完整指南

> **版本**: v1.0.2  
> **更新**: 2025-12-24  
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

```javascript
{
  isValid: false,          // 验证是否通过
  errors: [               // 错误数组
    {
      message: '用户名长度不能少于3个字符',
      path: ['username'],
      type: 'string.min',
      context: {
        limit: 3,
        value: 'ab',
        label: '用户名',
        key: 'username'
      }
    }
  ],
  data: { ... }           // 验证后的数据
}
```

### 嵌套对象错误

```javascript
const schema = types.object({
  user: types.object({
    profile: types.object({
      email: types.string().email()
    })
  })
});

const result = await schema.validate({
  user: {
    profile: {
      email: 'invalid'
    }
  }
});

// 错误路径
result.errors[0].path  // ['user', 'profile', 'email']
result.errors[0].message  // "邮箱格式无效"
```

### 数组项错误

```javascript
const schema = types.array().items(
  types.object({
    name: types.string().min(3)
  })
);

const result = await schema.validate([
  { name: 'ab' },  // 错误
  { name: 'valid' }
]);

// 错误路径
result.errors[0].path  // [0, 'name']
```

---

## 错误消息定制

### 单字段定制

```javascript
const schema = types.string()
  .min(3)
  .messages({
    'string.min': '太短了！至少要{{#limit}}个字'
  });
```

### 多规则定制

```javascript
const emailSchema = types.string()
  .email()
  .trim()
  .lowercase()
  .messages({
    'string.base': '必须是字符串',
    'string.email': '邮箱格式不对哦',
    'any.required': '邮箱不能为空'
  });
```

### 对象级定制

```javascript
const userSchema = types.object({
  username: types.string()
    .min(3)
    .label('用户名')
    .messages({
      'string.min': '{{#label}}至少{{#limit}}个字符'
    }),
  
  email: types.string()
    .email()
    .label('邮箱')
    .messages({
      'string.email': '{{#label}}格式无效'
    })
});
```

### 全局定制

```javascript
const { Locale } = require('schemaio');

Locale.setMessages({
  'string.min': '输入太短，要{{#limit}}个字符',
  'string.email': '邮箱格式不正确'
});
```

---

## 错误码系统

### 内置错误码

#### 字符串错误码

| 错误码 | 说明 | 上下文变量 |
|--------|------|-----------|
| `string.base` | 类型不是字符串 | value |
| `string.min` | 长度小于最小值 | limit, value |
| `string.max` | 长度大于最大值 | limit, value |
| `string.length` | 长度不等于指定值 | limit, value |
| `string.email` | 邮箱格式无效 | value |
| `string.uri` | URL格式无效 | value |
| `string.uuid` | UUID格式无效 | value |
| `string.ipv4` | IPv4格式无效 | value |
| `string.ipv6` | IPv6格式无效 | value |
| `string.hostname` | 主机名格式无效 | value |
| `string.pattern` | 正则不匹配 | pattern, value |
| `string.enum` | 不在枚举值中 | valids, value |

#### 数字错误码

| 错误码 | 说明 | 上下文变量 |
|--------|------|-----------|
| `number.base` | 类型不是数字 | value |
| `number.min` | 小于最小值 | limit, value |
| `number.max` | 大于最大值 | limit, value |
| `number.integer` | 不是整数 | value |
| `number.positive` | 不是正数 | value |
| `number.negative` | 不是负数 | value |

#### 通用错误码

| 错误码 | 说明 | 上下文变量 |
|--------|------|-----------|
| `any.required` | 必填字段为空 | label, key |
| `any.invalid` | 包含无效值 | value |
| `any.only` | 不等于指定值 | valids, value |

### 自定义错误码

```javascript
const schema = types.string().custom((value, helpers) => {
  if (value.includes('forbidden')) {
    return helpers.error('custom.forbidden', {
      message: '内容包含禁止的词语',
      word: 'forbidden'
    });
  }
  return value;
});

// 定制消息
schema.messages({
  'custom.forbidden': '不能包含敏感词：{{#word}}'
});
```

---

## 多层级错误处理

### 嵌套对象验证

```javascript
const addressSchema = types.object({
  country: types.string().required().label('国家'),
  city: types.string().required().label('城市'),
  street: types.string().required().label('街道')
});

const userSchema = types.object({
  name: types.string().required().label('姓名'),
  address: addressSchema
});

const result = await userSchema.validate({
  name: 'John',
  address: {
    country: 'CN'
    // 缺少city和street
  }
});

// 错误：
// [
//   { path: ['address', 'city'], message: '城市是必填项' },
//   { path: ['address', 'street'], message: '街道是必填项' }
// ]
```

### 数组验证

```javascript
const itemSchema = types.object({
  id: types.string().required(),
  name: types.string().min(3)
});

const orderSchema = types.object({
  items: types.array()
    .items(itemSchema)
    .min(1)
    .label('商品列表')
});

const result = await orderSchema.validate({
  items: [
    { id: '1', name: 'ab' },  // name太短
    { id: '2', name: 'valid' }
  ]
});

// 错误：
// [
//   { 
//     path: ['items', 0, 'name'], 
//     message: 'name长度不能少于3个字符' 
//   }
// ]
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
      message: '用户名长度不能少于3个字符',
      code: 'string.min'
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
// 验证中间件
function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const result = await schema.validate(req.body, {
        abortEarly: false
      });
      
      if (!result.isValid) {
        return res.status(400).json({
          success: false,
          code: 'VALIDATION_ERROR',
          message: '请检查输入信息',
          errors: result.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.type,
            context: err.context
          }))
        });
      }
      
      // 验证通过，将清洗后的数据挂载到req
      req.validated = result.data;
      next();
      
    } catch (error) {
      next(error);
    }
  };
}

// 使用
app.post('/api/users', 
  validateBody(userSchema),
  async (req, res) => {
    const user = await createUser(req.validated);
    res.json({ success: true, data: user });
  }
);
```

### Koa中间件

```javascript
function validateBody(schema) {
  return async (ctx, next) => {
    const result = await schema.validate(ctx.request.body, {
      abortEarly: false
    });
    
    if (!result.isValid) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        code: 'VALIDATION_ERROR',
        errors: result.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      };
      return;
    }
    
    ctx.validated = result.data;
    await next();
  };
}
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

### 1. 使用abortEarly: false收集所有错误

```javascript
// ✅ 推荐：返回所有错误
const result = await schema.validate(data, {
  abortEarly: false
});

// ❌ 不推荐：只返回第一个错误
const result = await schema.validate(data);
```

### 2. 提供友好的错误消息

```javascript
// ✅ 推荐
const schema = types.string()
  .min(3)
  .label('用户名')
  .messages({
    'string.min': '{{#label}}至少需要{{#limit}}个字符'
  });

// ❌ 不推荐：使用默认英文消息
const schema = types.string().min(3);
```

### 3. 使用label让错误消息更清晰

```javascript
// ✅ 推荐
types.string().label('用户名')
// 错误: "用户名长度不能少于3个字符"

// ❌ 不推荐
types.string()
// 错误: "username must be at least 3 characters"
```

### 4. 自定义错误码用于前端处理

```javascript
const schema = types.string().custom((value, helpers) => {
  if (await userExists(value)) {
    return helpers.error('username.exists', {
      message: '用户名已被占用'
    });
  }
  return value;
});

// 前端根据错误码特殊处理
if (error.code === 'username.exists') {
  showSuggestions(['user123', 'user456']);
}
```

### 5. 敏感数据不要出现在错误日志中

```javascript
function maskSensitiveData(data) {
  return {
    ...data,
    password: '***',
    confirmPassword: '***',
    creditCard: data.creditCard ? '****' + data.creditCard.slice(-4) : undefined
  };
}
```

---

## 相关文档

- [StringType完整文档](types/string-type.md)
- [国际化指南](i18n.md)
- [高级验证技巧](advanced-validation.md)

---

**文档版本**: v1.0.2  
**最后更新**: 2025-12-24

