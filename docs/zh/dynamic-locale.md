# 动态多语言配置指南

## 基本原理

schema-dsl 的 `Validator` 支持在验证时动态指定语言，无需全局切换。

### 核心方法

```javascript
validator.validate(schema, data, {
  locale: 'zh-CN'  // 动态指定语言
});
```

---

## 方案1: 验证时指定语言（推荐）✅

这是**最推荐**的方案，无需修改全局状态，支持并发请求。

### 1.1 应用启动时配置（一次性加载所有语言）

使用 `s.config` 在应用启动时一次性加载所有自定义语言包。

```javascript
import { s, validate } from 'schema-dsl/pure';
import path from 'path';

// ========== 应用启动时配置（只执行一次）==========

// 方式一：传入目录路径（推荐）⭐
// Node >=18：自动扫描目录下的 .js（CommonJS）、.cjs、.json、.jsonc、.json5 文件
s.config({
  i18n: path.join(__dirname, 'locales')
});

// 方式二：直接传入对象
s.config({
  i18n: {
    'fr-FR': {
      'required': '{{#label}} est requis',
      'string.minLength': '{{#label}} doit contenir au moins {{#limit}} caractères'
    },
    'de-DE': {
      'required': '{{#label}} ist erforderlich',
      'string.minLength': '{{#label}} muss mindestens {{#limit}} Zeichen lang sein'
    }
  }
});

// 说明：
// - 只在应用启动时执行一次
// - 自动与系统内置语言包合并（用户自定义的优先）
// - 运行时无需重新加载，直接切换
```

### 1.2 运行时直接切换语言（无需重新加载）

```javascript
import { s, validate } from 'schema-dsl/pure';

// 定义 Schema
const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});

// 测试数据
const data = { username: 'ab', email: 'invalid' };

// ========== 运行时直接切换语言 ==========

// 使用中文
const result1 = validate(schema, data, { locale: 'zh-CN' });
// 错误: "username长度不能少于3个字符"

// 使用法语
const result2 = validate(schema, data, { locale: 'fr-FR' });
// 错误: "username doit contenir au moins 3 caractères"

// 使用德语
const result3 = validate(schema, data, { locale: 'de-DE' });
// 错误: "username muss mindestens 3 Zeichen lang sein"

// 说明：
// - 无需重新加载语言包
// - 每次验证可以使用不同语言
// - 支持高并发（无全局状态修改）
```

### 1.3 从请求头获取语言（实际应用场景）

```javascript
import express from 'express';
import { s, validate } from 'schema-dsl/pure';
import path from 'path';

const app = express();

// ========== 应用启动时配置（只执行一次）==========
s.config({
  i18n: path.join(__dirname, 'locales')
});

// 定义 Schema
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!'
});

// ========== Express 路由 ==========
app.post('/api/user/register', (req, res) => {
  // 从请求头获取语言偏好
  const locale = parseAcceptLanguage(req.headers['accept-language']);
  
  // 验证数据（直接切换语言，无需重新加载）
  const result = validate(userSchema, req.body, { locale });
  
  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors  // 自动使用用户偏好的语言
    });
  }
  
  // 处理成功...
  res.json({ message: 'User registered successfully' });
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

适用于少数场景。

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
  const locale = parseAcceptLanguage(req.headers['accept-language']);
  
  const result = validateWithLocale(validator, schema, req.body, locale);
  
  // ...
});
```

---

## 方案3: Express/Koa 中间件

封装为中间件，自动处理语言切换。

### 3.1 Express 中间件 (推荐)

通过中间件一次性配置，后续业务代码无需关心语言参数。

```javascript
import { Validator } from 'schema-dsl/pure';
const validator = new Validator();

const schemaIoMiddleware = (req, res, next) => {
  // 1. 自动获取语言
  const lang = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';
  // 简单匹配逻辑 (实际可使用 accept-language-parser)
  const locale = lang.includes('zh') ? 'zh-CN' : 
                 lang.includes('ja') ? 'ja-JP' : 
                 lang.includes('es') ? 'es-ES' : 
                 lang.includes('fr') ? 'fr-FR' : 'en-US';

  // 2. 挂载绑定了语言的验证方法
  req.validate = (schema, data) => {
    return validator.validate(schema, data, { locale });
  };

  next();
};

app.use(schemaIoMiddleware);

// 业务中使用
app.post('/users', (req, res) => {
  // 直接调用，自动使用中间件解析的语言
  const result = req.validate(userSchema, req.body);
  
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  
  // ...
});
```

完整示例请参考 [dynamic-locale.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dynamic-locale.ts)。

### 3.2 Koa 中间件

```javascript
import { Locale, Validator } from 'schema-dsl/pure';

const validator = new Validator();

/**
 * Koa 语言中间件
 */
function localeMiddleware() {
  return async (ctx, next) => {
    // 解析语言
    const locale = parseAcceptLanguage(ctx.headers['accept-language']);
    
    // 保存到上下文
    ctx.locale = locale;
    
    // 复用共享 Validator，避免每个请求都重新建立实例和缓存
    ctx.validate = function(schema, data) {
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
import express from 'express';
import { s, Validator, Locale } from 'schema-dsl/pure';

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

const validator = new Validator();

function localeMiddleware(req, res, next) {
  req.locale = parseAcceptLanguage(req.headers['accept-language']);
  
  req.validate = function(schema, data) {
    return validator.validate(schema, data, { locale: req.locale });
  };
  
  next();
}

app.use(localeMiddleware);

// ========== 4. 定义Schema ==========

const userSchema = s({
  username: s('string:3-32!').label('用户名'),
  email: s('email!').label('邮箱地址'),
  password: s('string:8-64!').pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'pattern': '密码必须包含大小写字母和数字'
    }),
  age: s('number:18-120').label('年龄')
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
import zhCN from './zh-CN.cjs';
import enUS from './en-US.cjs';
import jaJP from './ja-JP.cjs';

export default {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP
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
import locales from './locales/index.js';
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
| 方案3: 中间件 | ✅ 自动化<br>✅ 统一管理<br>✅ 可复用共享 Validator 缓存 | - | ⭐⭐⭐⭐⭐ |

**推荐**: 方案1 + 方案3（中间件封装）

---

## 常见问题

### Q1: 如何处理不支持的语言？

**A**: 回退到默认语言

不要直接把原始 `Accept-Language` 头透传给 `locale`；浏览器常见值会带 `q=` 权重，应该先解析再回退。

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
const schema = s({
  password: s('string:8-64!').label('密码')
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
- [Locale API](./api-reference.md#locale)
- [Validator API](./api-reference.md#validator-类)

---

## 对应示例文件

**示例入口**: [dynamic-locale.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dynamic-locale.ts)  
**说明**: 覆盖 `Accept-Language` 解析、运行时 locale 选择，以及同一 schema 在不同请求语言下的验证入口。

---

