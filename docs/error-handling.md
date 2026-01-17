# schema-dsl 错误处理完整指南


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

SchemaI-DSL 验证返回的错误对象结构：

```javascript
const { dsl, validate } = require('schema-dsl');

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
const { dsl, validate } = require('schema-dsl');

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
const { dsl, validate } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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
const { Locale } = require('schema-dsl');

// 设置全局消息
Locale.setMessages({
  'min': '输入太短，要{{#limit}}个字符',
  'format': '格式不正确'
});
```

---

## 错误码系统

### 内置错误码（简化版）

SchemaI-DSL 对 ajv 的错误关键字进行了简化映射，使其更易用：

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

### 自动 Label 翻译

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
const { dsl } = require('schema-dsl');

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
const { dsl, validate } = require('schema-dsl');

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
const { dsl, validate } = require('schema-dsl');

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
const { dsl, Validator } = require('schema-dsl');

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
const { dsl, Validator } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');

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

## v1.1.5 新功能：对象格式错误配置

### 概述

从 v1.1.5 开始，语言包支持对象格式 `{ code, message }`，实现统一的错误代码管理。

### 基础用法

**语言包配置**:
```javascript
// lib/locales/zh-CN.js (或自定义语言包)
module.exports = {
  // 字符串格式（向后兼容）
  'user.notFound': '用户不存在',
  
  // 对象格式（v1.1.5 新增）✨ - 使用数字错误码
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前余额{{#balance}}，需要{{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: '订单未支付'
  }
};
```

**使用示例**:
```javascript
const { dsl } = require('schema-dsl');

try {
  dsl.error.throw('account.notFound');
} catch (error) {
  console.log(error.originalKey);  // 'account.notFound'
  console.log(error.code);         // 40001 ✨ 数字错误码
  console.log(error.message);      // '账户不存在'
}
```

### 核心特性

#### 1. originalKey 字段（新增）

保留原始的 key，便于调试和日志追踪：

```javascript
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  error.originalKey  // 'account.notFound' (原始 key)
  error.code         // 40001 (数字错误码)
}
```

#### 2. 多语言共享 code

不同语言使用相同的数字 `code`，便于前端统一处理：

```javascript
// zh-CN.js
'account.notFound': {
  code: 40001,  // ← 数字 code 一致
  message: '账户不存在'
}

// en-US.js
'account.notFound': {
  code: 40001,  // ← 数字 code 一致
  message: 'Account not found'
}

// 前端处理 - 不受语言影响
switch (error.code) {
  case 40001:
    redirectToLogin();
    break;
  case 40002:
    showTopUpDialog();
    break;
  case 50001:
    showPaymentDialog();
    break;
}
#### 3. 增强的 error.is() 方法

同时支持 `originalKey` 和数字 `code` 判断：

```javascript
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  // 两种方式都可以
  if (error.is('account.notFound')) { }  // ✅ 使用 originalKey
  if (error.is(40001)) { }               // ✅ 使用数字 code
}
```

#### 4. toJSON 包含 originalKey

```javascript
const json = error.toJSON();
// {
//   error: 'I18nError',
//   originalKey: 'account.notFound',  // ✨ v1.1.5 新增
//   code: 'ACCOUNT_NOT_FOUND',
//   message: '账户不存在',
//   params: {},
//   statusCode: 400,
//   locale: 'zh-CN'
// }
```

### 向后兼容

**完全向后兼容** ✅ - 字符串格式自动转换：

```javascript
// 字符串格式（原有）
'user.notFound': '用户不存在'

// 自动转换为对象
dsl.error.throw('user.notFound');
// error.code = 'user.notFound' (使用 key 作为 code)
// error.originalKey = 'user.notFound'
// error.message = '用户不存在'
```

### 最佳实践

#### 1. 何时使用对象格式

**推荐使用对象格式**:
- ✅ 需要在多语言中统一处理的错误
- ✅ 需要前端统一判断的错误
- ✅ 核心业务错误（账户、订单、支付等）

**可以使用字符串格式**:
- ✅ 简单的验证错误
- ✅ 内部错误（不暴露给前端）
- ✅ 不需要统一处理的错误

#### 2. 错误代码命名规范

推荐使用**数字错误码**，按模块分段：

```javascript
// 错误码规范（5位数字）
// 4xxxx - 客户端错误
// 5xxxx - 业务逻辑错误  
// 6xxxx - 系统错误

'account.notFound': {
  code: 40001,  // ✅ 推荐：账户模块，序号001
  message: '账户不存在'
}

'account.insufficientBalance': {
  code: 40002,  // 账户模块，序号002
  message: '余额不足'
}

'order.notPaid': {
  code: 50001,  // ✅ 订单模块，序号001
  message: '订单未支付'
}

'order.cancelled': {
  code: 50002,  // 订单模块，序号002
  message: '订单已取消'
}

'database.connectionError': {
  code: 60001,  // ✅ 系统错误
  message: '数据库连接失败'
}
```

**错误码分段建议**：
- `40001-49999` - 客户端错误（账户、权限、参数验证等）
- `50001-59999` - 业务逻辑错误（订单、支付、库存等）
- `60001-69999` - 系统错误（数据库、服务不可用等）

#### 3. 前端统一错误处理

```javascript
// API 调用
try {
  const response = await fetch('/api/account');
  const data = await response.json();
} catch (error) {
  // 使用数字 code 统一处理，不受语言影响
  switch (error.code) {
    case 40001:  // ACCOUNT_NOT_FOUND
      showNotFoundPage();
      break;
    case 40002:  // INSUFFICIENT_BALANCE
      showTopUpDialog(error.params);
      break;
    case 50001:  // ORDER_NOT_PAID
      showPaymentDialog();
      break;
    case 60001:  // SYSTEM_ERROR
      showSystemErrorPage();
      break;
    default:
      showGenericError(error.message);
  }
}
```

**更优雅的方式 - 错误码映射**：
```javascript
// errorCodeMap.js
const ERROR_HANDLERS = {
  40001: () => router.push('/account-not-found'),
  40002: (error) => showDialog('topup', error.params),
  50001: (error) => showDialog('payment', error.params),
  60001: () => showSystemErrorPage(),
};

// 统一错误处理
function handleError(error) {
  const handler = ERROR_HANDLERS[error.code];
  if (handler) {
    handler(error);
  } else {
    showGenericError(error.message);
  }
}
```

### 更多信息

- [v1.1.5 完整变更日志](../changelogs/v1.1.5.md)
- [升级指南](../changelogs/v1.1.5.md#升级指南)
- [最佳实践](../changelogs/v1.1.5.md#最佳实践)

---

## 相关文档

- [API 参考文档](./api-reference.md)
- [DSL 语法指南](./dsl-syntax.md)
- [String 扩展文档](./string-extensions.md)
- [多语言配置](./dynamic-locale.md)
- [v1.1.5 变更日志](../changelogs/v1.1.5.md)

---

**最后更新**: 2026-01-17  
**版本**: v1.1.5


