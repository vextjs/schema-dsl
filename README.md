<div align="center">

# 🎯 schema-dsl

**最简洁的数据验证库 - 代码量减少 65%**

一行 DSL 替代 10 行链式调用

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[快速开始](#-快速开始) · [在线体验](https://runkit.com/npm/schema-dsl) · [完整文档](./docs/INDEX.md) · [示例代码](./examples) · [性能测试](./docs/cache-manager.md)

</div>

---

## ⚡ TL;DR（30秒快速理解）

**schema-dsl 是什么？**  
最简洁的数据验证库，一行DSL代替10行链式调用，性能超越Zod/Joi/Yup。

**核心优势：**
- 🎯 **极简语法**: `'string:3-32!'` 代替 8行 Joi 代码（减少 65% 代码量）
- 🚀 **性能第一**: 2,879,606 ops/s，比 Zod 快 1.58倍，比 Joi 快 9.61倍
- 🌍 **完整多语言**: 内置5种语言，支持运行时动态切换（v1.1.0+）
- 🎨 **独家功能**: 从验证规则直接生成 MongoDB/MySQL/PostgreSQL Schema

**3行代码上手：**
```javascript
const { dsl, validate } = require('schema-dsl');
const schema = dsl({ email: 'email!', age: 'number:18-' });
const result = validate(schema, { email: 'test@example.com', age: 25 });
console.log(result.valid);  // true
```

**5分钟教程**: [快速开始](#-快速开始) | **完整文档**: [docs/INDEX.md](./docs/INDEX.md) | **在线体验**: [RunKit](https://runkit.com/npm/schema-dsl)

---

## 🗺️ 文档导航

**新手入门**:
- [快速开始](#-快速开始) - 5 分钟上手
- [功能总览](#-功能总览) - 了解所有功能
- [DSL 语法速查](#-dsl-语法速查) - 语法参考

**核心功能**:
- [基础验证](#1-基础验证javascript) - 表单验证
- [批量验证](#批量验证) - 性能优化
- [嵌套对象](#嵌套对象验证) - 复杂结构
- [条件验证](#条件验证---一行代码搞定) - 动态规则
- [多语言](#4-多语言支持) - 国际化

**框架集成**:
- [Express](#2-express-集成---自动错误处理)
- [Koa](#koa-集成)
- [Fastify](#fastify-集成)

**高级功能**:
- [数据库导出](#3-数据库-schema-导出) - 独家功能
- [插件系统](#6-插件系统) - 扩展功能
- [TypeScript](#15-typescript-用法-) - 类型支持

**完整文档**: [docs/INDEX.md](./docs/INDEX.md) - 40+ 篇详细文档

---

## 🆕 最新特性（v1.1.8）

### 🎯 智能参数识别 - 简化语法支持（v1.1.8）

**API 更简洁，从4个参数减少到2个参数**

```javascript
const { dsl, Locale } = require('schema-dsl');

// 配置语言包
Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  }
});

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found'
  }
});

// ✅ 新增：简化语法（推荐）
dsl.error.throw('account.notFound', 'zh-CN');
dsl.error.throw('account.notFound', 'zh-CN', 404);

// ✅ 标准语法（完全兼容）
dsl.error.throw('account.notFound', {}, 404, 'zh-CN');
dsl.error.throw('account.notFound', { id: '123' }, 404, 'zh-CN');

// 所有方法都支持
dsl.error.create('account.notFound', 'zh-CN');
dsl.error.assert(account, 'account.notFound', 'zh-CN');
```

**核心优势**:
- 🎯 **参数更少**: 无需参数对象时从4个参数减少到2个
- 🎯 **智能识别**: 自动判断第2个参数是语言还是参数对象
- 🎯 **完全兼容**: 现有代码无需修改，渐进式增强
- 🎯 **降低错误**: 不再需要传递空对象 `{}`

📖 [完整文档](./docs/error-handling.md) · [变更日志](./CHANGELOG.md)

---

### 🎯 错误配置对象格式支持（v1.1.5）

**统一错误代码，多语言共享，前端友好**

```javascript
// 语言包配置（支持对象格式）
const locales = {
  'zh-CN': {
    'account.notFound': {
      code: 40001,              // 统一的数字错误代码
      message: '账户不存在'
    },
    'account.insufficientBalance': {
      code: 40002,
      message: '余额不足，当前{{#balance}}，需要{{#required}}'
    }
  },
  'en-US': {
    'account.notFound': {
      code: 40001,              // 相同的数字 code
      message: 'Account not found'
    },
    'account.insufficientBalance': {
      code: 40002,
      message: 'Insufficient balance: {{#balance}}, required: {{#required}}'
    }
  }
};

// 使用
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  console.log(error.code);         // 40001 (统一数字代码)
  console.log(error.originalKey);  // 'account.notFound' (原始key)
  console.log(error.message);      // 中文: "账户不存在" / 英文: "Account not found"
  
  // 增强的 error.is() - 两种方式都支持
  if (error.is('account.notFound')) { }  // ✅ 使用 originalKey
  if (error.is(40001)) { }               // ✅ 使用数字 code
}

// 前端统一处理
switch (error.code) {
  case 40001: showNotFoundPage(); break;     // 不受语言影响
  case 40002: showTopUpDialog(); break;
}
```

**核心优势**:
- 🎯 **统一错误代码**: 不同语言使用相同的数字 `code`，便于前端统一处理
- 🔄 **完全向后兼容**: 字符串格式自动转换，现有代码无需修改
- 📊 **更好的错误追踪**: `originalKey` 和 `code` 分离，便于日志分析
- 🌍 **多语言友好**: 前端可以用统一的数字 code 处理，不受语言影响

📖 [完整文档](./docs/error-handling.md#v115-新功能对象格式错误配置) · [变更日志](./CHANGELOG.md)

---

### 🔗 跨类型联合验证（v1.1.0）

**一行代码支持多种类型，告别繁琐的类型判断**

```javascript
const schema = dsl({
  contact: 'types:email|phone!',      // 邮箱或手机号
  price: 'types:number:0-|string:1-20',  // 数字价格或"面议"
  status: 'types:active|inactive|null'   // 枚举或空值
});

validate(schema, { contact: 'test@example.com' });  // ✅ 通过
validate(schema, { contact: '13800138000' });       // ✅ 通过
validate(schema, { contact: 12345 });               // ❌ 失败
```

**实际场景**:
- ✅ 用户注册：支持邮箱或手机号登录
- ✅ 商品价格：数字或"面议"字符串
- ✅ 可选字段：允许null值

📖 [完整文档](./docs/union-types.md)

---

### 🌍 运行时多语言支持

**无需修改全局设置，每次调用指定语言**

```javascript
// 根据请求头动态返回不同语言的错误
app.post('/api/account', (req, res) => {
  const locale = req.headers['accept-language'] || 'en-US';
  
  try {
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);
    // 中文请求返回: "账户不存在"
    // 英文请求返回: "Account not found"
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

**适用场景**:
- ✅ 多语言 API（根据请求头动态返回）
- ✅ 微服务架构（错误传递保持原语言）
- ✅ 国际化应用（同一请求多种语言）

📖 [运行时多语言文档](./docs/runtime-locale-support.md)

---

### ⚡ 其他新特性

- ✅ **错误配置对象格式**: 支持 `{ code, message }` 统一错误代码（v1.1.5）
- ✅ **统一错误抛出**: `I18nError` 类，支持多语言错误消息（v1.1.1）
- ✅ **插件系统增强**: 自定义类型注册更简单（v1.1.0）
- ✅ **TypeScript 类型完善**: 0个类型错误（v1.1.4）

[查看完整更新日志](./CHANGELOG.md)

---

## 📦 功能清单（AI友好格式）

> 方便AI快速理解所有功能

### 核心功能

```json
{
  "validation": {
    "basic": ["string", "number", "boolean", "date", "email", "url", "phone", "idCard"],
    "advanced": ["regex", "custom", "conditional", "nested", "array"],
    "unionTypes": "v1.1.0+ 跨类型联合验证 (types:string|number)"
  },
  "i18n": {
    "supported": ["zh-CN", "en-US", "ja-JP", "es-ES", "fr-FR"],
    "features": ["配置加载", "运行时切换", "自定义消息", "参数插值"],
    "runtime": "v1.1.0+ 运行时指定语言 (dsl.error.create(code, params, statusCode, locale))"
  },
  "database": {
    "export": ["MongoDB", "MySQL", "PostgreSQL"],
    "unique": "从验证规则直接生成数据库Schema"
  },
  "framework": {
    "integration": ["Express", "Koa", "Fastify"],
    "async": "validateAsync() 失败自动抛出 ValidationError"
  },
  "api": {
    "main": ["dsl()", "validate()", "validateAsync()"],
    "utils": ["SchemaUtils.pick()", "SchemaUtils.omit()", "SchemaUtils.partial()"],
    "conditional": ["dsl.if()", "dsl.match()"],
    "errors": ["ValidationError", "I18nError"]
  },
  "performance": {
    "opsPerSecond": 2879606,
    "vs": {
      "Zod": "1.58x faster",
      "Joi": "9.61x faster",
      "Yup": "27.07x faster"
    },
    "optimization": ["WeakMap缓存", "智能编译", "批量验证优化"]
  }
}
```

### API速查

| API | 用途 | 返回值 | 文档 |
|-----|------|--------|------|
| `dsl(schema)` | 创建Schema | Schema对象 | [DSL语法](./docs/dsl-syntax.md) |
| `validate(schema, data)` | 同步验证 | `{valid, errors, data}` | [验证指南](./docs/validation-guide.md) |
| `validateAsync(schema, data)` | 异步验证 | Promise（失败抛错） | [异步验证](./docs/validate-async.md) |
| `builder.toSchema()` | 转为 JSON Schema（含内部标记） | JSON Schema 对象 | [API参考](./docs/api-reference.md#toschema) |
| `builder.toJsonSchema()` | 转为纯净 JSON Schema（v1.2.5） | JSON Schema 对象 | [API参考](./docs/api-reference.md#tojsonschema) |
| `dsl.if(condition)` | 条件验证 | ConditionalBuilder | [条件API](./docs/conditional-api.md) |
| `SchemaUtils.pick()` | 选择字段 | 新Schema | [SchemaUtils](./docs/schema-utils.md) |
| `I18nError.throw()` | 抛出多语言错误 | never | [I18nError示例](./examples/i18n-error.examples.js) |

---

## ✨ 为什么选择 schema-dsl？

### 🎯 极简 DSL 语法

**3 行代码完成验证规则定义**

<table>
<tr>
<td width="50%" valign="top">

**❌ 传统写法** - 繁琐冗长

```javascript
// Joi - 需要 8 行
const schema = Joi.object({
  username: Joi.string()
    .min(3).max(32).required(),
  email: Joi.string()
    .email().required(),
  age: Joi.number()
    .min(18).max(120)
});
```

</td>
<td width="50%" valign="top">

**✅ schema-dsl** - 简洁优雅

```javascript
// 只需 3 行！
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});
```

</td>
</tr>
</table>

### 🚀 性能卓越

**测试结果：schema-dsl 是目前性能最优的验证库（基于最新基准测试）**

| 验证库 | 性能 (ops/s) | 相对速度 | 评价 |
|--------|-------------|---------|------|
| **schema-dsl** | **2,879,606** | **基准 (1.00x)** | **🥇 第一名** |
| Zod | 1,818,592 | 0.63x | 🥈 慢 58% |
| Joi | 299,761 | 0.10x | 🥉 慢 861% |
| Yup | 106,378 | 0.04x | 慢 2607% |

**性能优势**:
- ✅ 比 Zod 快 **1.58倍**
- ✅ 比 Joi 快 **9.61倍**
- ✅ 比 Yup 快 **27.07倍**

> 📊 **测试环境**: Node.js v20.x, Windows  
> 📊 **测试场景**: 用户注册表单验证（username, email, age, tags）  
> 📊 **测试工具**: [Benchmark.js](https://benchmarkjs.com/)  
> 📊 **运行测试**: `node test/benchmarks/library-comparison.js`

### 🌍 完整多语言支持

**一行配置，自动加载所有语言包**

```javascript
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// ========== 应用启动时配置（只执行一次）==========
dsl.config({
  i18n: path.join(__dirname, 'locales')  // 自动加载目录下所有语言文件
});

// ========== 运行时直接切换语言（无需重新加载）==========
const schema = dsl({ username: 'string:3-32!' });

// 中文错误消息
validate(schema, { username: 'ab' }, { locale: 'zh-CN' });
// => "username长度不能少于3个字符"

// 英文错误消息
validate(schema, { username: 'ab' }, { locale: 'en-US' });
// => "username length must be at least 3"

// 日语错误消息
validate(schema, { username: 'ab' }, { locale: 'ja-JP' });
// => "usernameは3文字以上である必要があります"
```

**🆕 运行时多语言支持（v1.1.0+）**

无需修改全局设置，可在每次调用时指定语言：

```javascript
const { dsl, I18nError } = require('schema-dsl');

// 方式1: 业务错误 - 运行时指定语言
const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
console.log(error1.message);  // "账户不存在"

const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
console.log(error2.message);  // "Account not found"

// 方式2: 断言风格 - 根据请求头动态指定
app.post('/api/withdraw', (req, res) => {
  const locale = req.headers['accept-language'] || 'en-US';
  const account = getAccount(req.user.id);
  
  // 根据请求头返回对应语言的错误
  I18nError.assert(account, 'account.notFound', {}, 404, locale);
  I18nError.assert(
    account.balance >= req.body.amount,
    'account.insufficientBalance',
    { balance: account.balance, required: req.body.amount },
    400,
    locale
  );
  
  // 验证通过，继续处理...
});
```

**适用场景**：
- ✅ 多语言 API（根据请求头返回不同语言）
- ✅ 微服务架构（错误在服务间传递时保持语言）
- ✅ 同一请求中需要多种语言的错误消息

**内置语言**: 中文、英文、日语、法语、西班牙语

📖 [完整多语言文档](./docs/i18n.md)  
📖 [运行时多语言支持](./docs/runtime-locale-support.md)

### 🎨 数据库 Schema 导出

**一份定义，多处使用**

```javascript
const { dsl, exporters } = require('schema-dsl');

const schema = dsl({ 
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 导出 MongoDB Schema
const mongoExporter = new exporters.MongoDBExporter();
const mongoSchema = mongoExporter.export(schema);

// 导出 MySQL 建表语句
const mysqlExporter = new exporters.MySQLExporter();
const mysqlDDL = mysqlExporter.export('users', schema);

// 导出 PostgreSQL 建表语句
const pgExporter = new exporters.PostgreSQLExporter();
const pgDDL = pgExporter.export('users', schema);
```

**✅ 独家功能**：从验证规则直接生成数据库结构！

### ⚡ 5 分钟上手

**学习成本极低，立即可用**

```javascript
const { dsl, validate } = require('schema-dsl');

// 1️⃣ 定义规则（1 分钟）
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-!'
});

// 2️⃣ 验证数据（30 秒）
const result = validate(schema, {
  username: 'john',
  email: 'john@example.com',
  password: '12345678'
});

// 3️⃣ 处理结果（30 秒）
if (result.valid) {
  console.log('验证通过！');
} else {
  console.log('错误：', result.errors);
}
```

**对比其他库**：
- Joi/Yup：需要 30 分钟学习链式 API
- Zod：需要 15 分钟学习 TypeScript 类型
- Ajv：需要 20 分钟学习 JSON Schema 规范

### 💪 功能完整

| 功能 | schema-dsl | 说明 |
|------|-----------|------|
| **基本验证** | ✅ | string、number、boolean、date、email、url... |
| **高级验证** | ✅ | 正则、自定义、条件、嵌套、数组... |
| **🆕 跨类型联合** | ✅ | `types:string|number` 一个字段支持多种类型 (v1.1.1) |
| **错误格式化** | ✅ | 自动多语言翻译 |
| **🆕 多语言错误** | ✅ | `I18nError` 统一的多语言错误抛出 (v1.1.1) |
| **数据库导出** | ✅ | MongoDB、MySQL、PostgreSQL |
| **TypeScript** | ✅ | 完整类型定义 |
| **性能优化** | ✅ | WeakMap 缓存、智能编译 |
| **插件系统** | ✅ | 支持自定义类型注册 (v1.1.1) |
| **文档生成** | ✅ | Markdown、HTML |

### 🆕 v1.1.0 新特性：跨类型联合验证

**一行代码支持多种类型**

```javascript
const { dsl, validate } = require('schema-dsl');

// 字段可以是字符串或数字
const schema = dsl({
  value: 'types:string|number'
});

validate(schema, { value: 'hello' });  // ✅ 通过
validate(schema, { value: 123 });      // ✅ 通过
validate(schema, { value: true });     // ❌ 失败

// 带约束的联合类型
const advancedSchema = dsl({
  contact: 'types:email|phone!',  // 邮箱或手机号
  price: 'types:number:0-|string:1-20'  // 数字价格或"面议"
});
```

**实际场景示例**:
```javascript
// 用户注册：支持邮箱或手机号
const registerSchema = dsl({
  username: 'string:3-20!',
  contact: 'types:email|phone!',  // 灵活的联系方式
  age: 'types:integer:1-150|null' // 年龄可选
});
```

📖 [完整文档](./docs/union-types.md) | [插件开发指南](./docs/plugin-system.md)

---

## � 功能总览

> 让 AI 和开发者快速了解所有功能

### 核心功能速查表

| 分类 | 功能 | 代码示例 | 文档链接 |
|------|------|---------|----------|
| **基础验证** | DSL 语法 | `'string:3-32!'` | [DSL 语法](./docs/dsl-syntax.md) |
| | 链式调用 | `'string!'.label('用户名')` | [String 扩展](./docs/string-extensions.md) |
| | TypeScript | `dsl('string!')` | [TS 指南](./docs/typescript-guide.md) |
| **高级验证** | 条件验证 | `dsl.if()/dsl.match()` | [条件 API](./docs/conditional-api.md) |
| | 嵌套对象 | `{ user: { name: 'string!' } }` | [验证指南](./docs/validation-guide.md) |
| | 数组验证 | `'array:1-10<string>'` | [类型参考](./docs/type-reference.md) |
| | 联合类型 | `'types:string\|number'` | [联合类型](./docs/union-types.md) |
| | 正则验证 | `.pattern(/^[A-Z]+$/)` | [自定义扩展](./docs/custom-extensions-guide.md) |
| | 自定义验证 | `.custom((v) => ...)` | [自定义扩展](./docs/custom-extensions-guide.md) |
| **Schema 工具** | 复用字段 | `SchemaUtils.pick()` | [SchemaUtils](./docs/schema-utils.md) |
| | 批量验证 | `validateBatch(schema, array)` | [批量验证](#批量验证) |
| | 字段库 | `createLibrary()` | [SchemaUtils](./docs/schema-utils.md) |
| **框架集成** | Express | `validateAsync + try/catch` | [Express 示例](./examples/express-integration.js) |
| | Koa | `validateAsync + ctx.throw` | [中间件示例](./examples/middleware-usage.js) |
| | Fastify | `preValidation hook` | [中间件示例](./examples/middleware-usage.js) |
| **多语言** | 配置语言 | `dsl.config({ i18n })` | [i18n 指南](./docs/i18n-user-guide.md) |
| | 错误抛出 | `I18nError.throw()` | [I18nError 示例](./examples/i18n-error.examples.js) |
| **数据库** | MongoDB | `MongoDBExporter.export()` | [MongoDB 导出](./docs/mongodb-exporter.md) |
| | MySQL | `MySQLExporter.export()` | [MySQL 导出](./docs/mysql-exporter.md) |
| | PostgreSQL | `PostgreSQLExporter.export()` | [PostgreSQL 导出](./docs/postgresql-exporter.md) |
| **插件** | 自定义格式 | `pluginManager.register()` | [插件系统](./docs/plugin-system.md) |
| **性能** | 缓存配置 | `config({ cache })` | [缓存管理](./docs/cache-manager.md) |

### 常见使用场景

| 场景 | 代码示例 | 完整示例 |
|------|---------|----------|
| **API 参数验证** | [Express 集成](#2-express-集成---自动错误处理) | [完整代码](./examples/express-integration.js) |
| **用户注册表单** | [基础验证](#1-基础验证javascript) | [完整代码](./examples/user-registration/) |
| **批量数据处理** | [批量验证](#批量验证) | [完整代码](./examples/simple-example.js) |
| **多语言应用** | [多语言支持](#4-多语言支持) | [完整代码](./examples/i18n-full-demo.js) |
| **数据库建表** | [数据库导出](#3-数据库-schema-导出) | [完整代码](./examples/export-demo.js) |
| **复杂嵌套结构** | [嵌套对象](#嵌套对象验证) | [验证指南](./docs/validation-guide.md) |
| **正则格式验证** | [正则验证](#正则验证) | [自定义扩展](./docs/custom-extensions-guide.md) |
| **业务逻辑验证** | [自定义验证器](#自定义验证器) | [自定义扩展](./docs/custom-extensions-guide.md) |

---

## �📦 安装

```bash
npm install schema-dsl
```

---

## 🚀 快速开始

### 1. 基础验证（JavaScript）

```javascript
const { dsl, validate } = require('schema-dsl');

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  tags: 'array<string>'
});

// ✅ 验证成功
const result1 = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['admin', 'verified']
});

console.log(result1.valid);    // true
console.log(result1.data);     // 验证后的数据

// ❌ 验证失败 - 看看如何处理错误
const result2 = validate(userSchema, {
  username: 'ab',           // 太短（最少3个字符）
  email: 'invalid-email',   // 格式错误
  age: 15                   // 小于最小值18
});

console.log(result2.valid);    // false
console.log(result2.errors);   // 错误列表
/*
[
  { path: 'username', message: 'username must be at least 3 characters' },
  { path: 'email', message: 'must be a valid email' },
  { path: 'age', message: 'age must be at least 18' }
]
*/
```

### 1.5 TypeScript 用法 ⭐

**重要**: TypeScript 中**必须**使用 `dsl()` 包裹字符串以获得类型提示（v1.0.6+ 移除了全局 String 类型扩展以避免类型污染）：

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

// ✅ 正确：使用 dsl() 包裹字符串获得完整类型提示
const userSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
    .label('用户名'),
  
  email: dsl('email!')
    .label('邮箱地址')
    .messages({ required: '邮箱必填' }),
  
  age: dsl('number:18-100')
    .label('年龄')
});

// 异步验证（推荐）
try {
  const validData = await validateAsync(userSchema, {
    username: 'testuser',
    email: 'test@example.com',
    age: 25
  });
  console.log('验证通过:', validData);
} catch (error) {
  if (error instanceof ValidationError) {
    error.errors.forEach(err => {
      console.log(`${err.path}: ${err.message}`);
    });
  }
}
```

**为什么必须用 `dsl()` 包裹？**
- ✅ 完整的类型推导和 IDE 自动提示
- ✅ 避免污染原生 String 类型（v1.0.6+ 重要改进）
- ✅ 保证 `trim()`、`toLowerCase()` 等原生方法类型正确
- ✅ 更好的开发体验和类型安全

**JavaScript 用户不受影响**：在 JavaScript 中仍然可以直接使用 `'email!'.label('邮箱')` 语法。

**详细说明**: 请查看 [TypeScript 使用指南](./docs/typescript-guide.md)

### 2. Express 集成 - 自动错误处理

```javascript
const { dsl, validateAsync, ValidationError } = require('schema-dsl');

// 定义验证 Schema
const createUserSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!'
});

// 在路由中使用
app.post('/api/users', async (req, res, next) => {
  try {
    // validateAsync 验证失败时会抛出 ValidationError
    const validData = await validateAsync(createUserSchema, req.body);
    
    const user = await db.users.create(validData);
    res.json({ success: true, data: user });
  } catch (error) {
    // ValidationError 会被全局错误处理器捕获
    next(error);
  }
});

// 全局错误处理 - 区分验证错误和其他错误
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    // 验证错误返回 400
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors  // 详细的字段错误列表
    });
  }
  
  // 其他错误继续传递
  next(error);
});
```

### Schema 复用 - 按场景使用

```javascript
const { dsl, SchemaUtils } = require('schema-dsl');

// 完整的用户 Schema
const fullUserSchema = dsl({
  id: 'string!',
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'number:18-120',
  role: 'admin|user|guest',
  createdAt: 'datetime!',
  updatedAt: 'datetime!'
});

// 场景1: 创建用户 - 排除自动生成的字段
// 使用 omit() 排除不需要的字段
const createSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

// 场景2: 查询用户 - 隐藏敏感字段
// 使用 omit() 排除敏感信息
const publicSchema = SchemaUtils.omit(fullUserSchema, ['password']);

// 场景3: 更新用户 - 只允许更新部分字段
// 使用 pick() 选择字段 + partial() 变为可选
const updateSchema = SchemaUtils
  .pick(fullUserSchema, ['username', 'email', 'age'])
  .partial();  // 所有字段变为可选

// 场景4: 注册接口 - 扩展额外字段
// 使用 pick() + extend() 添加新字段
const registerSchema = SchemaUtils
  .pick(fullUserSchema, ['username', 'email', 'password'])
  .extend({ 
    captcha: 'string:4-6!',
    agree: 'boolean!'
  });

// 💡 快速记忆：
// omit - 排除字段（隐藏敏感信息）
// pick - 挑选字段（限制可修改字段）
// extend - 扩展字段（添加新字段）
// partial - 变为可选（用于更新接口）
```

### 条件验证 - 一行代码搞定

**问题场景**：不同情况需要不同的验证规则

```javascript
const { dsl } = require('schema-dsl');

// 场景1：年龄限制 - 未成年不能注册
// ❌ 传统做法：先验证，再判断，写两次
const result = validate(schema, userData);
if (!result.valid) return;
if (userData.age < 18) {
  throw new Error('未成年用户不能注册');
}

// ✅ 新做法：一行代码搞定
dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .assert(userData);  // 失败自动抛错

// 场景2：权限检查 - 快速判断
// ❌ 传统做法：写 if 判断
if (user.role !== 'admin' && user.role !== 'moderator') {
  return res.status(403).json({ error: '权限不足' });
}

// ✅ 新做法：一行搞定
if (!dsl.if(d => d.role === 'admin' || d.role === 'moderator')
     .message('权限不足')
     .check(user)) {
  return res.status(403).json({ error: '权限不足' });
}

// 场景3：批量过滤 - 筛选符合条件的数据
// ❌ 传统做法：写 filter 函数
const adults = users.filter(u => u.age >= 18);

// ✅ 新做法：语义更清晰
const adults = users.filter(u => 
  !dsl.if(d => d.age < 18).message('未成年').check(u)
);
```

#### 四种方法，满足不同场景

| 方法 | 什么时候用 | 返回什么 | 示例 |
|------|-----------|---------|------|
| **`.validate()`** | 需要知道错误详情 | `{ valid, errors, data }` | 表单验证 |
| **`.validateAsync()`** | async/await 场景 | Promise（失败抛错） | Express 中间件 |
| **`.assert()`** | 快速失败，不想写 if | 失败直接抛错 | 函数入口检查 |
| **`.check()`** | 只需要判断真假 | `true/false` | 数据过滤 |

#### 实际例子

**表单验证 - 需要显示错误**

```javascript
// 使用 .validate() 获取错误详情
const result = dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .validate(formData);

if (!result.valid) {
  showError(result.errors[0].message);  // 显示给用户
}
```

**Express 中间件 - 异步验证**

```javascript
// 使用 .validateAsync() 失败自动抛错
app.post('/register', async (req, res, next) => {
  try {
    await dsl.if(d => d.age < 18)
      .message('未成年用户不能注册')
      .validateAsync(req.body);
    
    // 验证通过，继续处理
    const user = await createUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);  // 自动传递给错误处理中间件
  }
});
```

**函数参数检查 - 快速断言**

```javascript
// 使用 .assert() 不满足直接抛错
function registerUser(userData) {
  // 入口检查，不满足直接抛错，代码更清晰
  dsl.if(d => d.age < 18).message('未成年不能注册').assert(userData);
  dsl.if(d => !d.email).message('邮箱必填').assert(userData);
  dsl.if(d => !d.phone).message('手机号必填').assert(userData);
  
  // 检查通过，继续业务逻辑
  return createUser(userData);
}
```

**批量数据处理 - 快速过滤**

```javascript
// 使用 .check() 只返回 true/false
const canRegister = dsl.if(d => d.age < 18)
  .or(d => d.status === 'blocked')
  .message('不允许注册');

// 过滤出可以注册的用户
const validUsers = users.filter(u => !canRegister.check(u));

// 统计未成年用户数量
const minorCount = users.filter(u => 
  dsl.if(d => d.age < 18).message('未成年').check(u)
).length;
```

**复用验证器**

```javascript
// 创建一次，到处使用
const ageValidator = dsl.if(d => d.age < 18)
  .message('未成年用户不能注册');

// 不同场景使用不同方法
const r1 = ageValidator.validate({ age: 16 });      // 同步，返回详情
const r2 = await ageValidator.validateAsync(data);  // 异步，失败抛错
const r3 = ageValidator.check({ age: 20 });         // 快速判断
```

#### 💡 选择建议

- 🎯 **表单验证**：用 `.validate()` - 需要显示错误给用户
- 🚀 **API 接口**：用 `.validateAsync()` - 配合 try/catch
- ⚡ **函数入口**：用 `.assert()` - 快速失败，代码简洁
- 🔍 **数据过滤**：用 `.check()` - 只需要判断真假

**完整文档**: [ConditionalBuilder API](./docs/conditional-api.md)

---

## � 进阶功能

### 批量验证

**场景**: 验证 1000 条用户数据，性能提升 50 倍

```javascript
const { dsl, SchemaUtils, Validator } = require('schema-dsl');

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 批量数据
const users = [
  { username: 'user1', email: 'user1@example.com', age: 25 },
  { username: 'u2', email: 'invalid', age: 15 },  // 两个错误
  { username: 'user3', email: 'user3@example.com', age: 30 }
];

// 批量验证
const validator = new Validator();
const result = SchemaUtils.validateBatch(userSchema, users, validator);

console.log(result.summary);
/*
{
  total: 3,
  valid: 2,
  invalid: 1,
  duration: 5  // 毫秒
}
*/

console.log(result.errors);
/*
[
  { index: 1, errors: [
    { path: 'username', message: '...' },
    { path: 'age', message: '...' }
  ]}
]
*/

// 只获取有效数据
const validUsers = result.results
  .filter(r => r.valid)
  .map(r => r.data);
```

📖 **详细文档**: [SchemaUtils.validateBatch](./docs/schema-utils.md#validatebatch---批量验证)

---

### 嵌套对象验证

**场景**: 验证复杂的用户资料

```javascript
const { dsl, validate } = require('schema-dsl');

const profileSchema = dsl({
  user: {
    basic: {
      name: 'string:2-50!',
      email: 'email!',
      phone: 'string:11!'
    },
    address: {
      country: 'string!',
      city: 'string!',
      street: 'string',
      zipCode: 'string:6'
    },
    preferences: {
      language: 'zh-CN|en-US|ja-JP',
      timezone: 'string',
      notifications: {
        email: 'boolean',
        sms: 'boolean',
        push: 'boolean'
      }
    }
  },
  metadata: {
    source: 'web|mobile|api',
    createdAt: 'datetime!',
    tags: 'array:0-10<string>'
  }
});

const result = validate(profileSchema, {
  user: {
    basic: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '13800138000'
    },
    address: {
      country: 'China',
      city: 'Beijing',
      zipCode: '100000'
    },
    preferences: {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  metadata: {
    source: 'web',
    createdAt: new Date().toISOString(),
    tags: ['vip', 'active']
  }
});

console.log(result.valid);  // true
```

📖 **详细文档**: [嵌套对象验证](./docs/validation-guide.md#嵌套对象验证)

---

### 数组高级验证

**场景**: 验证订单商品列表

```javascript
const { dsl, validate } = require('schema-dsl');

// 方式 1: 简单数组
const schema1 = dsl({
  tags: 'array:1-10<string>',  // 1-10 个字符串
  scores: 'array<number:0-100>'  // 数字数组，每个 0-100
});

// 方式 2: 对象数组
const orderSchema = dsl({
  orderId: 'string!',
  items: 'array:1-100!',  // 必填，1-100 个商品
  // 注意：数组元素的验证需要单独定义
  _itemSchema: {  // 约定：用 _ 前缀标记辅助 schema
    productId: 'string!',
    name: 'string:1-100!',
    quantity: 'integer:1-999!',
    price: 'number:>0!'
  }
});

// 验证订单
const order = {
  orderId: 'ORD-12345',
  items: [
    { productId: 'P001', name: 'iPhone', quantity: 2, price: 5999.00 },
    { productId: 'P002', name: 'AirPods', quantity: 1, price: 1299.00 }
  ]
};

// 先验证订单结构
const result1 = validate(orderSchema, order);
if (!result1.valid) {
  console.log('订单结构错误:', result1.errors);
}

// 再验证每个商品
const itemSchema = dsl(orderSchema._itemSchema);
for (const [index, item] of order.items.entries()) {
  const result = validate(itemSchema, item);
  if (!result.valid) {
    console.log(`商品 ${index} 错误:`, result.errors);
  }
}
```

📖 **详细文档**: [数组验证](./docs/validation-guide.md#数组验证)

---

### 正则验证

**场景**: 自定义格式验证

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  // 车牌号
  licensePlate: 'string!'
    .pattern(/^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/)
    .label('车牌号')
    .messages({
      pattern: '请输入有效的中国车牌号'
    }),
  
  // 身份证号（简化版）
  idCard: 'string:18!'
    .pattern(/^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$/)
    .label('身份证号')
    .messages({
      pattern: '请输入有效的 18 位身份证号'
    }),
  
  // 自定义代码格式
  inviteCode: 'string:8!'
    .pattern(/^[A-Z]{3}\\d{5}$/)
    .label('邀请码')
    .messages({
      pattern: '邀请码格式：3个大写字母 + 5个数字（如 ABC12345）'
    })
});

const result = validate(schema, {
  licensePlate: '京A12345',
  idCard: '110101199003071234',
  inviteCode: 'ABC12345'
});

console.log(result.valid);  // true
```

📖 **详细文档**: [正则验证](./docs/validation-guide.md#正则验证) | [String 扩展](./docs/string-extensions.md)

---

### 自定义验证器

**场景**: 业务逻辑验证

```javascript
const { dsl, validate, validateAsync } = require('schema-dsl');

// 同步自定义验证
const schema1 = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      // 不能以数字开头
      if (/^\\d/.test(value)) {
        return '用户名不能以数字开头';
      }
      // 禁用敏感词
      const blocked = ['admin', 'root', 'system'];
      if (blocked.includes(value.toLowerCase())) {
        return '该用户名不可用';
      }
    })
    .label('用户名')
});

// 异步自定义验证（检查唯一性）
const schema2 = dsl({
  email: 'email!'
    .custom(async (value) => {
      const exists = await checkEmailExists(value);
      if (exists) {
        return '该邮箱已被注册';
      }
    })
    .label('邮箱')
});

// 多字段联合验证
const schema3 = dsl({
  password: 'string:8-32!',
  confirmPassword: 'string:8-32!'
})
  .custom((data) => {
    if (data.password !== data.confirmPassword) {
      return { confirmPassword: '两次密码不一致' };
    }
  });

// 使用
const result = validate(schema1, { username: 'admin' });
console.log(result.errors);  // [{ path: 'username', message: '该用户名不可用' }]

// 模拟数据库查询
async function checkEmailExists(email) {
  // 实际项目中查询数据库
  return email === 'exists@example.com';
}
```

📖 **详细文档**: [自定义验证器](./docs/custom-extensions-guide.md) | [验证指南](./docs/validation-guide.md)

---

### 框架集成

#### Koa 集成

```javascript
const Koa = require('koa');
const { dsl, validateAsync, ValidationError } = require('schema-dsl');

const app = new Koa();

const createUserSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!'
});

// 路由
app.use(async (ctx) => {
  if (ctx.path === '/api/users' && ctx.method === 'POST') {
    try {
      // 验证请求体
      const validData = await validateAsync(createUserSchema, ctx.request.body);
      
      // 业务逻辑
      const user = await createUser(validData);
      
      ctx.body = { success: true, data: user };
    } catch (error) {
      if (error instanceof ValidationError) {
        ctx.status = 400;
        ctx.body = {
          success: false,
          message: 'Validation failed',
          errors: error.errors
        };
      } else {
        throw error;
      }
    }
  }
});

app.listen(3000);

// 模拟用户创建函数
async function createUser(data) {
  return { id: '123', ...data };
}
```

#### Fastify 集成

```javascript
const fastify = require('fastify')();
const { dsl, validateAsync, ValidationError } = require('schema-dsl');

const createUserSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!'
});

// 使用 preValidation hook
fastify.post('/api/users', {
  preValidation: async (request, reply) => {
    try {
      request.body = await validateAsync(createUserSchema, request.body);
    } catch (error) {
      if (error instanceof ValidationError) {
        reply.code(400).send({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      } else {
        throw error;
      }
    }
  }
}, async (request, reply) => {
  // 验证通过，继续处理
  const user = await createUser(request.body);
  return { success: true, data: user };
});

fastify.listen({ port: 3000 });

// 模拟用户创建函数
async function createUser(data) {
  return { id: '123', ...data };
}
```

📖 **详细文档**: [中间件使用示例](./examples/middleware-usage.js) | [Express 集成](./examples/express-integration.js)

---

### 字段库复用

**场景**: 大型项目的字段管理

```javascript
// fields/common.js - 定义字段库
const { dsl } = require('schema-dsl');

module.exports = {
  // 基础字段
  email: () => 'email!'.label('邮箱地址'),
  phone: (country = 'cn') => 'string:11!'.phoneNumber(country).label('手机号'),
  username: () => 'string:3-32!'.username().label('用户名'),
  password: (strength = 'medium') => 'string:8-32!'.password(strength).label('密码'),
  
  // 组合字段
  userAuth: () => ({
    username: 'string:3-32!'.username().label('用户名'),
    password: 'string:8-32!'.password('strong').label('密码')
  }),
  
  userProfile: () => ({
    nickname: 'string:2-20!'.label('昵称'),
    bio: 'string:-500',
    avatar: 'url',
    birthday: 'date'
  }),
  
  address: () => ({
    country: 'string!',
    province: 'string!',
    city: 'string!',
    district: 'string',
    street: 'string',
    zipCode: 'string:6'
  })
};

// schemas/user.js - 使用字段库
const { dsl } = require('schema-dsl');
const fields = require('../fields/common');

// 注册 Schema
exports.registerSchema = dsl({
  ...fields.userAuth(),  // 展开用户认证字段
  email: fields.email(),
  phone: fields.phone(),
  agree: 'boolean!'
});

// 个人资料 Schema
exports.profileSchema = dsl({
  ...fields.userProfile(),  // 展开用户资料字段
  ...fields.address()       // 展开地址字段
});

// 登录 Schema
exports.loginSchema = dsl({
  account: 'types:email|phone!',  // 邮箱或手机号
  password: fields.password('strong')
});
```

📖 **详细文档**: [SchemaUtils 完整指南](./docs/schema-utils.md) | [字段库复用](./docs/schema-utils.md#字段库复用大型项目) | [最佳实践](./docs/best-practices.md)

---

## �📖 DSL 语法速查

### 基础类型

```javascript
dsl({
  // 字符串
  name: 'string!',              // 必填字符串
  code: 'string:6',             // 🆕 v1.0.3: 精确长度 6（验证码）
  bio: 'string:-500',           // 🆕 v1.0.3: 最大长度 500
  content: 'string:10-',        // 🆕 v1.0.3: 最小长度 10
  username: 'string:3-32',      // 长度范围 3-32
  
  // 数字
  age: 'number!',               // 必填数字
  price: 'number:0-9999.99',    // 范围 0-9999.99
  score: 'integer:0-100',       // 整数 0-100
  
  // 🆕 v1.1.2: 数字比较运算符
  minAge: 'number:>=18',        // 大于等于 18
  maxScore: 'number:<=100',     // 小于等于 100
  positiveNum: 'number:>0',     // 大于 0（不包括0）
  temperature: 'number:<100',   // 小于 100（不包括100）
  exactValue: 'number:=50',     // 等于 50
  negativeOk: 'number:>-10',    // 支持负数：大于 -10
  priceLimit: 'number:<=99.99', // 支持小数：小于等于 99.99
  
  // 💡 比较运算符 vs 范围语法
  // 'number:18-120'  → 18 <= x <= 120 (包括边界)
  // 'number:>=18'    → x >= 18 (语义更清晰)
  // 'number:>0'      → x > 0 (不包括0，范围语法无法表达)
  // 'number:<100'    → x < 100 (不包括100，范围语法无法表达)
  
  // 布尔值
  active: 'boolean!',
  
  // 枚举 - 限定值只能是特定选项之一
  status: 'active|inactive|pending',     // ✅ 推荐：字符串枚举（简写）
  role: 'enum:admin|user|guest!',        // 等价写法（完整形式）
  
  isPublic: 'true|false',                 // ✅ 自动识别布尔值
  isVerified: 'enum:boolean:true|false',  // 显式指定类型（更清晰）
  
  priority: '1|2|3!',                     // ✅ 自动识别数字
  level: 'enum:number:1|2|3|4|5',        // 显式指定（避免字符串"1"通过验证）
  grade: 'enum:integer:1|2|3',           // 整数枚举（禁止小数）
  rating: '1.0|1.5|2.0|2.5',             // 小数枚举
  
  // 💡 使用建议：
  // - 默认用简写（active|inactive）- 最简洁
  // - 需要明确类型时用完整形式（enum:number:1|2|3）
  // - 值可能混淆时用完整形式（避免"1"和1混用）
  
  // 数组
  tags: 'array<string>',        // 字符串数组
  items: 'array:1-10<number>',  // 1-10 个数字的数组
  
  // 对象
  meta: 'object'                // 任意对象
})
```

### 内置格式

```javascript
dsl({
  // 邮箱
  email: 'email!',
  
  // URL
  website: 'url!',
  homepage: 'https-url!',       // 必须 HTTPS
  
  // 日期时间
  birthday: 'date!',            // YYYY-MM-DD
  createdAt: 'datetime!',       // ISO 8601
  publishTime: 'timestamp!',    // Unix 时间戳
  
  // UUID
  userId: 'uuid!',
  requestId: 'uuid:v4!',
  
  // 中国手机号
  phone: 'phone:cn!',
  
  // 身份证号
  idCard: 'idCard:cn!',
  
  // 信用卡
  cardNumber: 'creditCard:visa!',
  
  // 邮政编码
  zipCode: 'postalCode:cn!',
  
  // 车牌号
  plate: 'licensePlate:cn!',
  
  // 护照号
  passport: 'passport:cn!'
})
```

### ✨ v1.0.3 新增类型

#### URL友好字符串（slug）- 用于博客和页面URL

```javascript
dsl({
  // 博客文章URL: /posts/my-first-blog-post
  articleSlug: 'slug:3-100!',
  
  // 分类URL: /category/javascript  
  categorySlug: 'slug!',
  
  // 链式调用
  pageSlug: 'string!'.slug()
})

// ✅ 有效格式: my-blog-post, hello-world-123, article
// ✅ 只能包含: 小写字母(a-z)、数字(0-9)、连字符(-)
// ❌ 不能包含: 大写字母、下划线、空格、特殊字符

// 查看完整示例: node examples/slug.examples.js
```

#### 字符串验证增强 - 解决常见验证场景

```javascript
dsl({
  // 用户名 - 只允许字母和数字（不允许下划线）
  username: 'alphanum:3-20!',     // 只允许 john123，不允许 john_123
  
  // 邮箱 - 统一小写存储
  email: 'lower!',                // 自动转小写
  
  // 验证码 - 强制大写
  code: 'upper:6!',               // 验证码大写: ABC123
  
  // JSON配置 - 验证JSON字符串格式
  config: 'json!',                // 存储JSON配置: {"theme":"dark"}
  
  // 端口号 - 限制有效范围
  serverPort: 'port!',            // 1-65535
  dbPort: 'port!'                 // 数据库端口
})
```

#### 约束语法优化 ⚠️ 破坏性变更

**v1.0.3 修复了单值语法**，使其更符合直觉：

```javascript
dsl({
  code: 'string:6!',      // 🆕 精确长度 6（之前是最大长度）
  bio: 'string:-500',     // 🆕 最大长度 500（新语法）
  content: 'string:10-',  // 🆕 最小长度 10（新语法）
  username: 'string:3-32' // 长度范围 3-32（不变）
})
```

**迁移指南**:
- 如果你之前用 `'string:N'` 表示最大长度，请改为 `'string:-N'`
- 如果你期望精确长度，无需修改（新版本行为正确）

**查看详细文档**: 
- [完整验证规则参考](./docs/validation-guide.md)
- [更新日志](./CHANGELOG.md)

### 高级特性

```javascript
dsl({
  // 用户名（3-32字符，字母数字下划线）
  username: 'string:3-32!'.username(),
  
  // 密码（8-32字符，必须包含大小写字母和数字）
  password: 'string:8-32!'.password(),
  
  // 自定义正则
  code: 'string!'.pattern(/^[A-Z]{3}\d{3}$/),
  
  // 自定义错误消息
  age: 'number:18-120!'.messages({
    'number.min': '年龄必须大于18岁',
    'number.max': '年龄不能超过120岁'
  }),
  
  // 字段标签（用于多语言）
  email: 'email!'.label('用户邮箱'),
  
  // 字段描述
  bio: 'string:10-500'.description('用户简介，10-500字符')
})
```

### 条件验证 - dsl.match 和 dsl.if

**根据其他字段的值动态决定验证规则**

```javascript
const { dsl } = require('schema-dsl');

// 1. dsl.match - 根据字段值匹配不同规则（类似 switch-case）
const contactSchema = dsl({
  contactType: 'email|phone|wechat',
  
  // 根据 contactType 的值决定 contact 字段的验证规则
  contact: dsl.match('contactType', {
    email: 'email!',           // contactType='email' 时验证邮箱格式
    phone: 'string:11!',       // contactType='phone' 时验证11位手机号
    wechat: 'string:6-20!',    // contactType='wechat' 时验证微信号
    _default: 'string'         // 默认规则（可选）
  })
});

// ✅ 验证通过
validate(contactSchema, { contactType: 'email', contact: 'user@example.com' });
validate(contactSchema, { contactType: 'phone', contact: '13800138000' });

// ❌ 验证失败
validate(contactSchema, { contactType: 'email', contact: 'invalid' });


// 2. dsl.if - 简单条件分支（类似 if-else）
const vipSchema = dsl({
  isVip: 'boolean!',
  
  // 如果是 VIP，折扣必须在 10-50 之间；否则在 0-10 之间
  discount: dsl.if('isVip', 'number:10-50!', 'number:0-10')
});

// ✅ VIP 用户
validate(vipSchema, { isVip: true, discount: 30 });

// ❌ 非 VIP 用户折扣超过 10
validate(vipSchema, { isVip: false, discount: 15 });


// 3. 实际应用场景：订单验证
const orderSchema = dsl({
  paymentMethod: 'alipay|wechat|card|cod',  // cod = 货到付款
  
  // 根据支付方式决定支付信息格式
  paymentInfo: dsl.match('paymentMethod', {
    alipay: 'email!',                        // 支付宝：邮箱
    wechat: 'string:20-30',                  // 微信：支付串
    card: 'string:16-19',                    // 银行卡：卡号
    cod: 'string:0-0',                       // 货到付款：无需支付信息
    _default: 'string'
  }),
  
  // 货到付款需要详细地址
  address: dsl.if('paymentMethod', 
    'string:10-200!',   // cod = 货到付款时地址必填
    'string:10-200'     // 其他支付方式地址可选
  )
});
```

**💡 使用场景**:
- ✅ 多种联系方式验证（邮箱/手机/微信）
- ✅ VIP 和普通用户不同的折扣范围
- ✅ 不同支付方式的支付信息格式
- ✅ 根据用户类型决定必填字段

**查看完整示例**: [examples/dsl-match-example.js](./examples/dsl-match-example.js)

---

## 🔧 核心功能

### 1. String 扩展 - 链式调用

```javascript
// 直接在字符串上调用验证方法
const schema = dsl({
  username: 'string:3-32!'.username().label('用户名'),
  email: 'email!'.label('邮箱地址'),
  phone: 'string:11!'.phoneNumber('cn').label('手机号'),
  password: 'string:8-32!'.password().messages({
    'string.password': '密码必须包含大小写字母和数字'
  })
});
```

### 2. Schema 复用工具

```javascript
const { SchemaUtils } = require('schema-dsl');

// 创建可复用的字段片段
const fields = SchemaUtils.createLibrary({
  email: () => 'email!'.label('邮箱'),
  phone: () => 'string:11!'.phoneNumber('cn').label('手机号'),
  username: () => 'string:3-32!'.username().label('用户名')
});

// 在多个 Schema 中复用
const loginSchema = dsl({
  account: fields.email(),
  password: 'string!'
});

const registerSchema = dsl({
  username: fields.username(),
  email: fields.email(),
  phone: fields.phone(),
  password: 'string:8-32!'
});

// Schema 组合操作
const baseUser = dsl({ name: 'string!', email: 'email!' });

// 挑选字段
const publicUser = SchemaUtils.pick(baseUser, ['name', 'email']);

// 排除字段
const safeUser = SchemaUtils.omit(baseUser, ['password']);

// 扩展字段
const adminUser = SchemaUtils.extend(baseUser, {
  role: 'admin|superadmin',
  permissions: 'array<string>'
});

// 部分验证（移除必填限制）
const updateUser = SchemaUtils.partial(baseUser, ['name', 'email']);
```

### 3. 数据库 Schema 导出

**唯一支持数据库 Schema 自动生成的验证库！**

```javascript
const { dsl, exporters } = require('schema-dsl');

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  tags: 'array<string>',
  createdAt: 'datetime!'
});

// 导出为 MongoDB Schema
const mongoSchema = exporters.MongoDBExporter.export(userSchema);
console.log(mongoSchema);
/*
{
  username: { type: String, required: true, minlength: 3, maxlength: 32 },
  email: { type: String, required: true, match: /.../ },
  age: { type: Number, min: 18, max: 120 },
  tags: [{ type: String }],
  createdAt: { type: Date, required: true }
}
*/

// 导出为 MySQL DDL
const mysqlExporter = new exporters.MySQLExporter();
const mysqlDDL = mysqlExporter.export('users', userSchema);
console.log(mysqlDDL);
/*
CREATE TABLE `users` (
  `username` VARCHAR(32) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `age` INT,
  `tags` JSON,
  `createdAt` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
*/

// 导出为 PostgreSQL DDL
const pgExporter = new exporters.PostgreSQLExporter();
const pgDDL = pgExporter.export('users', userSchema);

// 导出为 Markdown 文档
const markdown = exporters.MarkdownExporter.export(userSchema, {
  title: 'User API 文档'
});
```

### 4. 多语言支持

```javascript
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// 方式 1: 从目录加载语言包（推荐）
dsl.config({
  i18n: path.join(__dirname, 'i18n/dsl')  // 直接传字符串路径
});

// 方式 2: 直接传入语言包对象
dsl.config({
  i18n: {
    'zh-CN': {
      'label.username': '用户名',
      'label.email': '邮箱地址',
      'required': '{{#label}}不能为空',
      'string.min': '{{#label}}长度不能少于{{#limit}}个字符'
    },
    'en-US': {
      'label.username': 'Username',
      'label.email': 'Email Address',
      'required': '{{#label}} is required',
      'string.min': '{{#label}} must be at least {{#limit}} characters'
    }
  }
});

// 使用 Label Key
const schema = dsl({
  username: dsl('string:3-32!').label('label.username'),
  email: dsl('email!').label('label.email')
});

// 验证时指定语言
const result1 = validate(schema, data, { locale: 'zh-CN' });
// 错误消息：用户名长度不能少于3个字符

const result2 = validate(schema, data, { locale: 'en-US' });
// 错误消息：Username must be at least 3 characters
```

### 5. 缓存配置 (v1.0.4+)

```javascript
const { dsl, config } = require('schema-dsl');

// 配置缓存选项（推荐在使用 DSL 之前调用）
config({
  cache: {
    maxSize: 1000,        // 最大缓存条目数（默认：100）
    ttl: 7200000,         // 缓存过期时间（毫秒，默认：3600000，即1小时）
    enabled: true,        // 是否启用缓存（默认：true）
    statsEnabled: true    // 是否启用统计（默认：true）
  }
});

// 之后创建的 Schema 将使用新的缓存配置
const schema = dsl({ name: 'string!' });

// 也可以在 Validator 创建后动态修改配置（向后兼容）
const { getDefaultValidator } = require('schema-dsl');
const validator = getDefaultValidator();
console.log('当前缓存配置:', validator.cache.options);

// 动态修改
config({
  cache: { maxSize: 5000 }  // 只修改某个参数
});
```

**缓存说明**：
- Schema 编译结果会被缓存以提高性能
- 使用 LRU（最近最少使用）淘汰策略
- 支持 TTL（生存时间）自动过期
- 可通过 `validator.cache.getStats()` 查看缓存统计信息

### 6. 插件系统

```javascript
const { PluginManager } = require('schema-dsl');

const pluginManager = new PluginManager();

// 注册自定义验证器插件
pluginManager.register({
  name: 'custom-validator',
  version: '1.0.0',
  
  onBeforeValidate(schema, data) {
    // 验证前预处理
    console.log('验证开始');
  },
  
  onAfterValidate(result) {
    // 验证后处理
    console.log('验证结束:', result.valid);
    return result;
  },
  
  onError(error) {
    // 错误处理
    console.error('验证出错:', error);
  }
});

// 注册自定义格式插件
pluginManager.register({
  name: 'custom-formats',
  
  formats: {
    'hex-color': {
      validate: (value) => /^#[0-9A-F]{6}$/i.test(value),
      message: '必须是有效的十六进制颜色代码'
    },
    'mac-address': {
      validate: (value) => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(value),
      message: '必须是有效的 MAC 地址'
    }
  }
});

// 使用自定义格式
const schema = dsl({
  color: 'hex-color!',
  mac: 'mac-address!'
});
```

### 7. 错误处理

```javascript
const { validate, ValidationError } = require('schema-dsl');

const schema = dsl({
  email: 'email!',
  age: 'number:18-120!'
});

const result = validate(schema, { email: 'invalid', age: 15 });

if (!result.valid) {
  console.log(result.errors);
  /*
  [
    {
      field: 'email',
      message: '邮箱格式不正确',
      keyword: 'format',
      params: { format: 'email' }
    },
    {
      field: 'age',
      message: '年龄必须大于等于18',
      keyword: 'minimum',
      params: { limit: 18 }
    }
  ]
  */
}

// 使用 validateAsync + try-catch
try {
  const data = await validateAsync(schema, invalidData);
  // 验证通过
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.errors);      // 错误列表
    console.log(error.statusCode);  // 400
    console.log(error.toJSON());    // 标准 JSON 格式
  }
}
```

---

## ❓ 常见问题 FAQ

### Q1: 如何判断数据不能为空？（类似 `if(!data)`）

**方案1：使用必填标记**（推荐）
```javascript
const schema = dsl({
  username: 'string!',  // 必填，不能为空
  email: 'email!'
});
```

**方案2：使用条件验证 + 抛错**
```javascript
// 验证失败自动抛错
dsl.if(d => !d)
  .message('数据不能为空')
  .assert(data);
```

**方案3：异步验证**
```javascript
// Express/Koa 推荐
await dsl.if(d => !d)
  .message('数据不能为空')
  .validateAsync(data);
```

---

### Q2: 如何判断数据是否是对象？（类似 `typeof data === 'object'`）

**方案1：使用内置 object 类型**（推荐）
```javascript
const schema = dsl({
  data: 'object!'  // 必须是对象（排除 null 和 array）
});

validate(schema, { data: { name: 'John' } });  // ✅ 通过
validate(schema, { data: 'string' });          // ❌ 失败
validate(schema, { data: [] });                // ❌ 失败
```

**方案2：条件验证 + 抛错**
```javascript
dsl.if(d => typeof d !== 'object' || d === null || Array.isArray(d))
  .message('data 必须是一个对象')
  .assert(data);
```

**方案3：带结构验证**
```javascript
const schema = dsl({
  data: {
    name: 'string!',
    age: 'integer!',
    email: 'email'
  }
});

await validateAsync(schema, input);  // 验证对象结构
```

---

### Q3: 如何验证嵌套对象？

```javascript
const schema = dsl({
  user: {
    profile: 'object!',  // profile 必须是对象
    settings: {
      theme: 'string',
      notifications: 'object!'  // 嵌套对象验证
    }
  }
});
```

---

### Q4: 如何在 Express/Koa 中使用？

```javascript
app.post('/api/user', async (req, res) => {
  try {
    // 1. 验证请求体是对象
    await dsl.if(d => typeof d !== 'object' || d === null)
      .message('请求体必须是对象')
      .validateAsync(req.body);
    
    // 2. 验证字段
    const schema = dsl({
      username: 'string:3-32!',
      email: 'email!',
      password: 'string:8-!'
    });
    
    const validData = await validateAsync(schema, req.body);
    
    // 继续处理...
    res.json({ success: true, data: validData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

---

### Q5: 如何自定义错误消息？

```javascript
const schema = dsl({
  username: dsl('string:3-32!')
    .label('用户名')
    .messages({
      minLength: '用户名至少需要 {{#limit}} 个字符',
      required: '用户名不能为空'
    }),
  
  email: dsl('email!')
    .label('邮箱地址')
    .messages({
      format: '请输入有效的邮箱地址',
      required: '邮箱不能为空'
    })
});
```

---

### Q6: 类型对照表

| JavaScript 条件 | schema-dsl 写法 |
|----------------|----------------|
| `if (!data)` | `'string!'` 或 `.assert(data)` |
| `if (typeof data === 'object')` | `'object!'` |
| `if (typeof data === 'string')` | `'string!'` |
| `if (typeof data === 'number')` | `'number!'` |
| `if (Array.isArray(data))` | `'array!'` |
| `if (data === null)` | `'null!'` |
| `if (data > 0)` | `'number:0-!'` |
| `if (data.length >= 3)` | `'string:3-!'` |

---

### Q7: 如何合并多个 dsl.if() 验证？

**原代码（多个独立验证）**：
```javascript
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .assert(account);

dsl.if(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account.tradable_credits);
```

**✅ 方案1：使用 .and() 链式合并（v1.1.1 推荐）**
```javascript
// ✅ 每个条件都有独立的错误消息
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// 工作原理：
// - 第一个条件失败 → 返回 'ACCOUNT_NOT_FOUND'
// - 第二个条件失败 → 返回 'INSUFFICIENT_TRADABLE_CREDITS'
// - 所有条件通过 → 验证成功
```

**✅ 方案2：使用 .elseIf() 分支验证**
```javascript
// ✅ 按优先级检查，找到第一个失败的
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .elseIf(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);
```

**✅ 方案3：保持独立验证**（最清晰）
```javascript
// ✅ 两个独立的验证器
dsl.if(d => !d).message('ACCOUNT_NOT_FOUND').assert(account);
dsl.if(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account.tradable_credits);
```

**⚠️ 注意事项**：
- `.and()` 用于组合多个条件，每个条件可以有**独立的** `.message()` (v1.1.1)
- 如果 `.and()` 后不调用 `.message()`，则使用前一个条件的消息
- `.elseIf()` 按顺序检查，找到第一个失败的就停止（if-else-if 逻辑）

**何时使用**：
- ✅ 使用 `.and()` - 多个条件，每个有不同错误消息（v1.1.1）
- ✅ 使用 `.elseIf()` - 不同分支有不同验证规则
- ✅ 独立验证 - 最清晰，最可靠

**实际应用示例**：
```javascript
// 账户验证：检查存在性 + 余额 + 状态
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.status !== 'active')
  .message('ACCOUNT_INACTIVE')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// 每个失败条件都有清晰的错误消息！
```

📖 更多示例请查看 [完整文档](./docs/INDEX.md)

---

### Q8: 如何统一抛出多语言错误？(v1.1.1+)

**问题**: 业务代码中抛出的错误无法多语言，与 `.message()` 和 `.label()` 不一致

**✅ 解决方案：使用 `I18nError` 或 `dsl.error`**

```javascript
const { I18nError, dsl } = require('schema-dsl');

// 方式1：直接抛出
I18nError.throw('account.notFound');
// 中文: "账户不存在"
// 英文: "Account not found"

// 方式2：带参数插值
I18nError.throw('account.insufficientBalance', {
  balance: 50,
  required: 100
});
// 输出: "余额不足，当前余额50，需要100"

// 方式3：断言风格（推荐）
I18nError.assert(account, 'account.notFound');
I18nError.assert(
  account.balance >= 100,
  'account.insufficientBalance',
  { balance: account.balance, required: 100 }
);

// 方式4：快捷方法
dsl.error.throw('user.noPermission');
dsl.error.assert(user.role === 'admin', 'user.noPermission');
```

**🆕 对象格式错误配置（v1.1.5）**

支持统一的数字错误代码，便于前端处理：

```javascript
// 语言包配置（src/locales/zh-CN.ts）
module.exports = {
  // 字符串格式（向后兼容）
  'user.notFound': '用户不存在',
  
  // 对象格式（v1.1.5 新增）- 使用数字错误码
  'account.notFound': {
    code: 40001,              // 数字错误代码
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}，需要{{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: '订单未支付'
  }
};

// src/locales/en-US.ts
module.exports = {
  'account.notFound': {
    code: 40001,              // 相同的数字 code
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: {{#balance}}, required: {{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: 'Order not paid'
  }
};

// 使用
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  error.code          // 40001 (数字代码)
  error.originalKey   // 'account.notFound' (原始key)
  error.message       // '账户不存在'
  
  // 两种判断方式
  error.is('account.notFound')  // ✅ 使用 originalKey
  error.is(40001)               // ✅ 使用数字 code
}

// 前端统一处理（不受语言影响）
try {
  await api.getAccount(id);
} catch (error) {
  switch (error.code) {
    case 40001:
      router.push('/account-not-found');
      break;
    case 40002:
      showTopUpDialog(error.params.balance, error.params.required);
      break;
    case 50001:
      showPaymentDialog();
      break;
  }
}
```

**优势**：
- ✅ 多语言共享相同的数字 `code`，前端统一处理
- ✅ 完全向后兼容，字符串格式自动转换
- ✅ `originalKey` 便于调试和日志追踪
- ✅ 数字 code 更简洁，易于管理和文档化

**错误码规范建议**：
- `4xxxx` - 客户端错误（账户、权限、参数等）
- `5xxxx` - 业务逻辑错误（订单、支付、库存等）
- `6xxxx` - 系统错误（数据库、服务不可用等）

📖 详细说明: [错误处理文档](./docs/error-handling.md#v115-新功能对象格式错误配置)

**🆕 运行时指定语言（v1.1.0+）**

无需修改全局语言设置，每次调用时指定：

```javascript
// 根据请求头动态返回不同语言
app.post('/api/account', (req, res, next) => {
  const locale = req.headers['accept-language'] || 'en-US';
  const account = getAccount(req.user.id);
  
  try {
    // 第5个参数指定语言
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);
    dsl.error.assert(
      account.balance >= 100,
      'account.insufficientBalance',
      { balance: account.balance, required: 100 },
      400,
      locale
    );
    // 验证通过...
  } catch (error) {
    next(error);
  }
});

// 同一请求中使用不同语言
const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
console.log(error1.message);  // "账户不存在"

const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
console.log(error2.message);  // "Account not found"
```

**Express/Koa 集成**:
```javascript
// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof I18nError) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  next(error);
});

// 业务代码中使用
app.post('/withdraw', (req, res) => {
  const account = getAccount(req.user.id);
  I18nError.assert(account, 'account.notFound');
  I18nError.assert(
    account.balance >= req.body.amount,
    'account.insufficientBalance',
    { balance: account.balance, required: req.body.amount }
  );
  // ...
});
```

**内置错误代码**:
- 通用: `error.notFound`, `error.forbidden`, `error.unauthorized`
- 账户: `account.notFound`, `account.insufficientBalance`
- 用户: `user.notFound`, `user.noPermission`
- 订单: `order.notPaid`, `order.paymentMissing`

📖 完整文档请查看 [examples/i18n-error.examples.js](./examples/i18n-error.examples.js)  
📖 运行时多语言支持请查看 [docs/runtime-locale-support.md](./docs/runtime-locale-support.md)

---

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/vextjs/schema-dsl.git
cd schema-dsl

# 安装依赖
npm install

# 运行测试
npm test

# 代码检查
npm run lint

# 查看测试覆盖率
npm run coverage
```

### 提交规范

- 🐛 **Bug 修复**: `fix: 修复XXX问题`
- ✨ **新功能**: `feat: 添加XXX功能`
- 📝 **文档**: `docs: 更新XXX文档`
- 🎨 **代码格式**: `style: 格式化代码`
- ♻️ **重构**: `refactor: 重构XXX模块`
- ✅ **测试**: `test: 添加XXX测试`

详见 [贡献指南](./CONTRIBUTING.md)

---

## 📄 开源协议

[MIT License](./LICENSE)

---

## 🙏 致谢

- 感谢 [ajv](https://github.com/ajv-validator/ajv) 提供强大的验证引擎
- 感谢所有贡献者和用户的支持

---

## 🔗 相关链接

### 📦 快速入口
- [npm 包](https://www.npmjs.com/package/schema-dsl) - 安装和版本历史
- [GitHub 仓库](https://github.com/vextjs/schema-dsl) - 源代码和 Star ⭐
- [在线体验](https://runkit.com/npm/schema-dsl) - RunKit 演练场
- [问题反馈](https://github.com/vextjs/schema-dsl/issues) - Bug 报告和功能请求
- [讨论区](https://github.com/vextjs/schema-dsl/discussions) - 社区交流

### 📖 核心文档
- [完整文档索引](./docs/INDEX.md) - 40+ 篇文档导航
- [快速开始](./docs/quick-start.md) - 5 分钟入门
- [DSL 语法](./docs/dsl-syntax.md) - 语法完整指南（2815 行）
- [API 参考](./docs/api-reference.md) - API 完整文档
- [TypeScript 指南](./docs/typescript-guide.md) - TS 用户必读
- [最佳实践](./docs/best-practices.md) - 避免常见坑
- [常见问题](./docs/faq.md) - FAQ 合集
- [故障排查](./docs/troubleshooting.md) - 问题诊断

### 🎯 功能文档
- [字符串扩展](./docs/string-extensions.md) - String 扩展方法
- [SchemaUtils 工具](./docs/schema-utils.md) - Schema 复用工具
- [条件验证 API](./docs/conditional-api.md) - dsl.if/dsl.match
- [验证指南](./docs/validation-guide.md) - 高级验证技巧
- [类型参考](./docs/type-reference.md) - 所有内置类型
- [枚举类型](./docs/enum.md) - 枚举验证详解
- [联合类型](./docs/union-types.md) - v1.1.0 新特性
- [数字运算符](./docs/number-operators.md) - v1.1.2 新特性
- [错误处理](./docs/error-handling.md) - 错误处理策略

### 🌍 多语言支持
- [多语言用户指南](./docs/i18n-user-guide.md) - 完整使用教程
- [多语言配置详解](./docs/i18n.md) - 配置说明
- [前端集成指南](./docs/frontend-i18n-guide.md) - 前端使用
- [添加自定义语言](./docs/add-custom-locale.md) - 扩展新语言
- [动态语言配置](./docs/dynamic-locale.md) - 动态切换
- [Label vs Description](./docs/label-vs-description.md) - 最佳实践

### 🗄️ 数据库导出
- [导出指南](./docs/export-guide.md) - 完整导出教程
- [MongoDB 导出器](./docs/mongodb-exporter.md) - MongoDB Schema 导出
- [MySQL 导出器](./docs/mysql-exporter.md) - MySQL DDL 生成
- [PostgreSQL 导出器](./docs/postgresql-exporter.md) - PostgreSQL DDL 生成
- [Markdown 导出器](./docs/markdown-exporter.md) - API 文档生成
- [⚠️ 导出限制说明](./docs/export-limitations.md) - **必读！了解哪些特性无法导出**

### 🔌 插件和扩展
- [插件系统](./docs/plugin-system.md) - 插件开发和使用
- [插件类型注册](./docs/plugin-system.md) - 自定义类型
- [自定义扩展指南](./docs/custom-extensions-guide.md) - 添加自定义验证

### 📊 性能和设计
- [性能基准测试报告](./docs/cache-manager.md) - 性能对比数据
- [设计理念](./docs/design-philosophy.md) - 架构和权衡
- [缓存管理器](./docs/cache-manager.md) - 缓存配置和优化

### 💻 示例代码

> v2.0.0 已移除 `examples/` 目录（原 CJS 风格示例）。请参考：
> - **`test/`** — 1013 个测试用例，覆盖所有功能的实际用法
> - **`docs/`** — 45 个功能文档，含大量代码示例
> - 本 README 内联示例（下方各章节）

### 📝 版本和贡献
- [更新日志](./CHANGELOG.md) - 详细版本历史
- [贡献指南](./CONTRIBUTING.md) - 如何参与贡献

- [安全策略](./SECURITY.md) - 安全问题报告

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by schema-dsl team

</div>

