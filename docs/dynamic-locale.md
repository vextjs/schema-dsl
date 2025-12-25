# 动态多语言配置指南

> **更新时间**: 2025-12-25  
> **场景**: 从请求头动态获取语言配置  

---

## 📑 目录

- [基本原理](#基本原理)
- [方案1: 验证时指定语言（推荐）](#方案1-验证时指定语言推荐)
- [方案2: 临时切换语言](#方案2-临时切换语言)
- [方案3: Express/Koa 中间件](#方案3-expresskoa-中间件)
- [完整示例](#完整示例)
- [最佳实践](#最佳实践)

---

## 基本原理

SchemaIO 的 `Validator` 支持在验证时动态指定语言，无需全局切换。

### 核心方法

```javascript
validator.validate(schema, data, {
  locale: 'zh-CN'  // 动态指定语言
});
```

---

## 方案1: 验证时指定语言（推荐）✅

这是**最推荐**的方案，无需修改全局状态，支持并发请求。

### 1.1 基础用法

```javascript
const { dsl, Validator, Locale } = require('schemaio');

// 初始化：添加语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}至少{{#limit}}个字符',
  'max': '{{#label}}最多{{#limit}}个字符',
  'pattern': '{{#label}}格式不正确',
  'format': '请输入有效的{{#label}}'
});

Locale.addLocale('en-US', {
  'required': '{{#label}} is required',
  'min': '{{#label}} must be at least {{#limit}} characters',
  'max': '{{#label}} must be at most {{#limit}} characters',
  'pattern': '{{#label}} format is invalid',
  'format': 'Please enter a valid {{#label}}'
});

// 定义Schema
const schema = dsl({
  username: 'string:3-32!'.label('用户名'),
  email: 'email!'.label('邮箱地址')
});

// 创建验证器
const validator = new Validator();

// 验证时动态指定语言
const result1 = validator.validate(schema, data, { locale: 'zh-CN' });
const result2 = validator.validate(schema, data, { locale: 'en-US' });
```

### 1.2 从请求头获取语言

```javascript
// Express 示例
app.post('/api/user/register', (req, res) => {
  // 从请求头获取语言
  const locale = req.headers['accept-language'] || 'en-US';
  
  // 验证数据
  const result = validator.validate(schema, req.body, { 
    locale: locale 
  });
  
  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors  // 自动使用对应语言的错误消息
    });
  }
  
  // 处理成功...
});
```

### 1.3 解析 Accept-Language 头

```javascript
/**
 * 解析 Accept-Language 头
 * @param {string} acceptLanguage - Accept-Language 头的值
 * @returns {string} 语言代码
 */
function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en-US';
  
  // Accept-Language 格式: zh-CN,zh;q=0.9,en;q=0.8
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';');
    const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
    return { code: code.trim(), q };
  });
  
  // 按权重排序
  languages.sort((a, b) => b.q - a.q);
  
  // 映射到支持的语言
  const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'];
  for (const lang of languages) {
    const matched = supportedLocales.find(locale => 
      locale.toLowerCase() === lang.code.toLowerCase() ||
      locale.split('-')[0] === lang.code.split('-')[0]
    );
    if (matched) return matched;
  }
  
  return 'en-US';  // 默认语言
}

// 使用
app.post('/api/user/register', (req, res) => {
  const locale = parseAcceptLanguage(req.headers['accept-language']);
  
  const result = validator.validate(schema, req.body, { locale });
  
  // ...
});
```

---

## 方案2: 临时切换语言

适用于少数场景，需要注意并发问题。

### 2.1 使用闭包保存原语言

```javascript
function validateWithLocale(validator, schema, data, locale) {
  const originalLocale = Locale.getLocale();
  
  try {
    Locale.setLocale(locale);
    return validator.validate(schema, data);
  } finally {
    Locale.setLocale(originalLocale);  // 恢复原语言
  }
}

// 使用
app.post('/api/user/register', (req, res) => {
  const locale = req.headers['accept-language'] || 'en-US';
  
  const result = validateWithLocale(validator, schema, req.body, locale);
  
  // ...
});
```

**⚠️ 注意**: 此方案在高并发时可能有竞态问题，推荐使用方案1。

---

## 方案3: Express/Koa 中间件

封装为中间件，自动处理语言切换。

### 3.1 Express 中间件

```javascript
const { Locale } = require('schemaio');

/**
 * 语言中间件
 */
function localeMiddleware(req, res, next) {
  // 解析语言
  const locale = parseAcceptLanguage(req.headers['accept-language']);
  
  // 保存到请求对象
  req.locale = locale;
  
  // 创建验证辅助函数
  req.validate = function(schema, data) {
    const { Validator } = require('schemaio');
    const validator = new Validator();
    return validator.validate(schema, data, { locale: req.locale });
  };
  
  next();
}

// 应用中间件
app.use(localeMiddleware);

// 使用
app.post('/api/user/register', (req, res) => {
  // 自动使用请求的语言
  const result = req.validate(userSchema, req.body);
  
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  
  // ...
});
```

### 3.2 Koa 中间件

```javascript
const { Locale } = require('schemaio');

/**
 * Koa 语言中间件
 */
function localeMiddleware() {
  return async (ctx, next) => {
    // 解析语言
    const locale = parseAcceptLanguage(ctx.headers['accept-language']);
    
    // 保存到上下文
    ctx.locale = locale;
    
    // 创建验证辅助函数
    ctx.validate = function(schema, data) {
      const { Validator } = require('schemaio');
      const validator = new Validator();
      return validator.validate(schema, data, { locale: ctx.locale });
    };
    
    await next();
  };
}

// 应用中间件
app.use(localeMiddleware());

// 使用
router.post('/api/user/register', async (ctx) => {
  // 自动使用请求的语言
  const result = ctx.validate(userSchema, ctx.request.body);
  
  if (!result.valid) {
    ctx.status = 400;
    ctx.body = { errors: result.errors };
    return;
  }
  
  // ...
});
```

---

## 完整示例

### Express 完整示例

```javascript
const express = require('express');
const { dsl, Validator, Locale } = require('schemaio');

const app = express();
app.use(express.json());

// ========== 1. 初始化语言包 ==========

Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}至少{{#limit}}个字符',
  'max': '{{#label}}最多{{#limit}}个字符',
  'pattern': '{{#label}}格式不正确',
  'format': '请输入有效的{{#label}}'
});

Locale.addLocale('en-US', {
  'required': '{{#label}} is required',
  'min': '{{#label}} must be at least {{#limit}} characters',
  'max': '{{#label}} must be at most {{#limit}} characters',
  'pattern': '{{#label}} format is invalid',
  'format': 'Please enter a valid {{#label}}'
});

// ========== 2. 工具函数 ==========

function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en-US';
  
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';');
    const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
    return { code: code.trim(), q };
  });
  
  languages.sort((a, b) => b.q - a.q);
  
  const supportedLocales = ['zh-CN', 'en-US'];
  for (const lang of languages) {
    const matched = supportedLocales.find(locale => 
      locale.toLowerCase() === lang.code.toLowerCase()
    );
    if (matched) return matched;
  }
  
  return 'en-US';
}

// ========== 3. 中间件 ==========

function localeMiddleware(req, res, next) {
  req.locale = parseAcceptLanguage(req.headers['accept-language']);
  
  req.validate = function(schema, data) {
    const validator = new Validator();
    return validator.validate(schema, data, { locale: req.locale });
  };
  
  next();
}

app.use(localeMiddleware);

// ========== 4. 定义Schema ==========

const userSchema = dsl({
  username: 'string:3-32!'.label('用户名'),
  email: 'email!'.label('邮箱地址'),
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'pattern': '密码必须包含大小写字母和数字'
    }),
  age: 'number:18-120'.label('年龄')
});

// ========== 5. API 路由 ==========

app.post('/api/user/register', (req, res) => {
  // 验证数据（自动使用请求语言）
  const result = req.validate(userSchema, req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors,
      locale: req.locale  // 返回使用的语言
    });
  }
  
  // 处理注册逻辑
  res.json({
    success: true,
    message: req.locale === 'zh-CN' ? '注册成功' : 'Registration successful'
  });
});

// ========== 6. 测试 ==========

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('\n测试命令:');
  console.log('# 中文错误消息');
  console.log('curl -X POST http://localhost:3000/api/user/register \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Accept-Language: zh-CN" \\');
  console.log('  -d \'{"username":"ab"}\'');
  console.log('\n# 英文错误消息');
  console.log('curl -X POST http://localhost:3000/api/user/register \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Accept-Language: en-US" \\');
  console.log('  -d \'{"username":"ab"}\'');
});
```

---

## 最佳实践

### 1. 语言包集中管理

```javascript
// locales/index.js
module.exports = {
  'zh-CN': require('./zh-CN.json'),
  'en-US': require('./en-US.json'),
  'ja-JP': require('./ja-JP.json')
};

// locales/zh-CN.json
{
  "required": "{{#label}}不能为空",
  "min": "{{#label}}至少{{#limit}}个字符",
  "max": "{{#label}}最多{{#limit}}个字符",
  "pattern": "{{#label}}格式不正确",
  "format": "请输入有效的{{#label}}"
}

// 初始化
const locales = require('./locales');
Object.entries(locales).forEach(([locale, messages]) => {
  Locale.addLocale(locale, messages);
});
```

### 2. 支持的语言列表

```javascript
const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'ja-JP'];

function getSupportedLocale(requestLocale) {
  return SUPPORTED_LOCALES.includes(requestLocale) 
    ? requestLocale 
    : 'en-US';
}
```

### 3. 缓存验证器

```javascript
// 为每个语言缓存验证器
const validators = {
  'zh-CN': new Validator(),
  'en-US': new Validator(),
  'ja-JP': new Validator()
};

function getValidator(locale) {
  return validators[locale] || validators['en-US'];
}

// 使用
const result = getValidator(req.locale).validate(
  schema, 
  data, 
  { locale: req.locale }
);
```

### 4. 错误响应标准化

```javascript
function sendValidationError(res, result, locale) {
  res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: locale === 'zh-CN' ? '验证失败' : 'Validation failed',
    errors: result.errors,
    locale: locale
  });
}

// 使用
if (!result.valid) {
  return sendValidationError(res, result, req.locale);
}
```

---

## 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **方案1: 验证时指定** | ✅ 无竞态问题<br>✅ 支持并发<br>✅ 代码简洁 | - | ⭐⭐⭐⭐⭐ |
| 方案2: 临时切换 | ✅ 实现简单 | ⚠️ 并发竞态问题 | ⭐⭐⭐ |
| 方案3: 中间件 | ✅ 自动化<br>✅ 统一管理 | - | ⭐⭐⭐⭐⭐ |

**推荐**: 方案1 + 方案3（中间件封装）

---

## 常见问题

### Q1: 如何处理不支持的语言？

**A**: 回退到默认语言

```javascript
function parseAcceptLanguage(acceptLanguage) {
  // ...解析逻辑
  return supportedLocale || 'en-US';  // 默认英文
}
```

### Q2: 是否支持动态加载语言包？

**A**: 支持

```javascript
async function loadLocale(locale) {
  if (!Locale.getAvailableLocales().includes(locale)) {
    const messages = await import(`./locales/${locale}.json`);
    Locale.addLocale(locale, messages);
  }
}

// 使用
app.use(async (req, res, next) => {
  await loadLocale(req.locale);
  next();
});
```

### Q3: 如何自定义某些字段的错误消息？

**A**: 使用 `.messages()` 方法

```javascript
const schema = dsl({
  password: 'string:8-64!'
    .label('密码')
    .messages({
      'required': req.locale === 'zh-CN' 
        ? '请输入密码' 
        : 'Please enter password',
      'min': req.locale === 'zh-CN'
        ? '密码太短了，至少8个字符'
        : 'Password is too short, at least 8 characters'
    })
});
```

---

## 相关文档

- [String 扩展](./string-extensions.md#多语言支持)
- [Locale API](./api-reference.md#locale-类)
- [Validator API](./api-reference.md#validator-类)

---

**最后更新**: 2025-12-25  
**作者**: SchemaIO Team

