# schema-dsl 错误处理完整指南

> **更新**: 2026-01-30  
> **版本**: v1.1.8+  
> **适用**: 企业级应用开发  

---

## 📋 目录

1. [错误对象结构](#错误对象结构)
2. [I18nError - 多语言错误抛出](#i18nerror---多语言错误抛出) 🆕
   - [📖 概述](#-概述)
   - [🚀 快速开始](#-快速开始)
   - [📚 核心 API](#-核心-api)
   - [🔧 配置语言包](#-配置语言包)
   - [🌐 默认语言机制](#-默认语言机制)
   - [智能参数识别（v1.1.8）](#智能参数识别v118)
   - [🌐 实际场景](#-实际场景)
   - [📦 错误对象结构](#-错误对象结构)
   - [❓ 常见问题](#-常见问题)
3. [错误消息定制](#错误消息定制)
4. [错误码系统](#错误码系统)
5. [多层级错误处理](#多层级错误处理)
6. [API响应设计](#api响应设计)
7. [前端错误展示](#前端错误展示)
8. [错误日志记录](#错误日志记录)
9. [最佳实践](#最佳实践)

---

## I18nError - 多语言错误抛出

### 📖 概述

`I18nError` 是 schema-dsl 提供的**统一多语言错误抛出机制**，专为企业级应用设计。

**核心价值**:
- ✅ **多语言支持**: 一套代码，自动适配中文/英文/日文等
- ✅ **统一错误码**: 跨语言使用相同数字 code，前端处理不受语言影响
- ✅ **参数插值**: 支持 `{{#balance}}` 等动态参数
- ✅ **框架集成**: 与 Express/Koa 无缝集成
- ✅ **TypeScript 支持**: 完整的类型定义

**适用场景**:
- API 业务逻辑错误（账户不存在、余额不足、权限不足等）
- 多语言用户场景（国际化应用）
- 需要统一错误码的系统

**与 ValidationError 的区别**:
- `ValidationError`: 表单验证错误（字段级错误）
- `I18nError`: 业务逻辑错误（应用级错误）

---

### 🚀 快速开始

#### 5分钟上手

```javascript
const { I18nError, Locale } = require('schema-dsl');

// 步骤1：配置语言包
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

// 步骤2：设置默认语言
Locale.setLocale('zh-CN');

// 步骤3：使用 I18nError
try {
  I18nError.throw('account.notFound');
} catch (error) {
  console.log(error.message);  // "账户不存在"
  console.log(error.code);     // 40001
}
```

---

### 📚 核心 API

#### I18nError.create()

**创建错误对象（不抛出）**

```javascript
/**
 * @param {string} code - 错误代码（多语言 key）
 * @param {Object|string} paramsOrLocale - 参数对象 或 语言代码（智能识别）
 * @param {number} statusCode - HTTP 状态码（默认 400）
 * @param {string} locale - 语言环境（可选）
 * @returns {I18nError} 错误实例
 */
I18nError.create(code, paramsOrLocale?, statusCode?, locale?)
```

**使用示例**:
```javascript
// 基础用法
const error = I18nError.create('account.notFound');

// 带参数
const error = I18nError.create('account.insufficientBalance', {
  balance: 50,
  required: 100
});

// 指定状态码
const error = I18nError.create('user.notFound', {}, 404);

// 运行时指定语言（v1.1.8+）
const error = I18nError.create('account.notFound', 'en-US', 404);
```

---

#### I18nError.throw()

**直接抛出错误**

```javascript
/**
 * @param {string} code - 错误代码
 * @param {Object|string} paramsOrLocale - 参数对象 或 语言代码
 * @param {number} statusCode - HTTP 状态码
 * @param {string} locale - 语言环境
 * @throws {I18nError}
 */
I18nError.throw(code, paramsOrLocale?, statusCode?, locale?)
```

**使用示例**:
```javascript
// 直接抛错
I18nError.throw('user.noPermission');

// 带参数和状态码
I18nError.throw('account.insufficientBalance', { balance: 50, required: 100 }, 400);

// 简化语法（v1.1.8+）
I18nError.throw('account.notFound', 'zh-CN', 404);
```

---

#### I18nError.assert()

**断言风格 - 条件不满足时抛错**

```javascript
/**
 * @param {any} condition - 条件表达式（falsy 时抛错）
 * @param {string} code - 错误代码
 * @param {Object|string} paramsOrLocale - 参数对象 或 语言代码
 * @param {number} statusCode - HTTP 状态码
 * @param {string} locale - 语言环境
 * @throws {I18nError} 条件为 false 时抛出
 */
I18nError.assert(condition, code, paramsOrLocale?, statusCode?, locale?)
```

**使用示例**:
```javascript
function getAccount(id) {
  const account = db.findAccount(id);
  
  // 断言：账户必须存在
  I18nError.assert(account, 'account.notFound', { id });
  
  // 断言：余额必须充足
  I18nError.assert(
    account.balance >= 100,
    'account.insufficientBalance',
    { balance: account.balance, required: 100 }
  );
  
  return account;
}
```

---

#### dsl.error 快捷方法

`dsl.error` 是 `I18nError` 的快捷访问方式，提供相同的三个方法：

```javascript
const { dsl } = require('schema-dsl');

// 等价于 I18nError.create()
dsl.error.create('account.notFound');

// 等价于 I18nError.throw()
dsl.error.throw('order.notPaid');

// 等价于 I18nError.assert()
dsl.error.assert(order, 'order.notFound');
```

**推荐使用场景**:
- ✅ 与 `dsl()` 函数一起使用时（风格统一）
- ✅ 导入较少依赖时（只需 `dsl`）

---

### 🔧 配置语言包

#### 方式1：使用 Locale.addLocale()（推荐）

```javascript
const { Locale } = require('schema-dsl');

Locale.addLocale('zh-CN', {
  // 字符串格式（简单场景）
  'user.notFound': '用户不存在',
  
  // 对象格式（推荐，v1.1.5+）
  'account.notFound': {
    code: 40001,  // 数字错误码
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元'
  }
});

Locale.addLocale('en-US', {
  'user.notFound': 'User not found',
  'account.notFound': {
    code: 40001,  // 相同的错误码
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: {{#balance}}, required {{#required}}'
  }
});
```

---

#### 方式2：使用 dsl.config()（批量配置）

```javascript
const { dsl } = require('schema-dsl');

dsl.config({
  i18n: {
    'zh-CN': {
      'payment.failed': {
        code: 50001,
        message: '支付失败：{{#reason}}'
      }
    },
    'en-US': {
      'payment.failed': {
        code: 50001,
        message: 'Payment failed: {{#reason}}'
      }
    }
  }
});
```

---

#### 方式3：从目录加载（大型项目）

**目录结构**:
```text
project/
├── i18n/
│   └── errors/
│       ├── zh-CN.cjs
│       ├── en-US.jsonc
│       └── ja-JP.json5
└── app.js
```

**配置**:
```javascript
const path = require('path');

dsl.config({
  i18n: path.join(__dirname, 'i18n/errors')
});
```

**语言包文件**（例如 `i18n/errors/zh-CN.cjs`）:
```javascript
module.exports = {
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元'
  },
  'user.noPermission': {
    code: 40003,
    message: '您没有权限执行此操作'
  }
};
```

---

### 🌐 默认语言机制

#### 默认语言设置

**默认值**: `'zh-CN'`（简体中文）

**全局设置**:
```javascript
const { Locale } = require('schema-dsl');

// 设置默认语言为中文
Locale.setLocale('zh-CN');

// 获取当前语言
console.log(Locale.getLocale());  // 'zh-CN'
```

---

#### 语言优先级规则

```javascript
运行时 locale 参数 > 全局 Locale.currentLocale > 默认 'zh-CN'
```

**示例**:
```javascript
// 场景1：使用全局语言
Locale.setLocale('zh-CN');
I18nError.throw('account.notFound');  // 使用中文 'zh-CN'

// 场景2：运行时覆盖
Locale.setLocale('zh-CN');
I18nError.throw('account.notFound', 'en-US');  // 覆盖为英文 'en-US'

// 场景3：参数对象 + 运行时语言
I18nError.throw('account.insufficientBalance', 
  { balance: 50, required: 100 },  // 参数对象
  400, 
  'ja-JP'  // 运行时指定日文
);
```

---

#### 实际应用 - API 多语言响应

```javascript
const express = require('express');
const { I18nError } = require('schema-dsl');

const app = express();

// 中间件：提取客户端语言
app.use((req, res, next) => {
  req.locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  next();
});

// API 路由
app.get('/api/account/:id', async (req, res) => {
  try {
    const account = await findAccount(req.params.id);
    
    // 🎯 运行时指定语言（根据客户端请求）
    I18nError.assert(account, 'account.notFound', req.locale, 404);
    
    res.json({ success: true, data: account });
  } catch (error) {
    if (error instanceof I18nError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
```

**效果**:
- 客户端请求头 `Accept-Language: zh-CN` → 返回中文错误
- 客户端请求头 `Accept-Language: en-US` → 返回英文错误
- 无需修改业务代码，自动适配

---

### 智能参数识别（v1.1.8）

### 智能参数识别（v1.1.8）

**v1.1.8 新增**：支持简化语法，智能识别第2个参数类型

#### 简化语法

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
```

#### 智能识别规则

```javascript
// 规则：自动判断第2个参数类型
typeof params === 'string'  → 识别为语言参数
typeof params === 'object'  → 识别为参数对象
params === null/undefined   → 使用默认值
```

#### 所有调用方式

```javascript
// 1. 简化语法 - 只传语言
dsl.error.throw('account.notFound', 'zh-CN');
dsl.error.create('account.notFound', 'en-US');
dsl.error.assert(account, 'account.notFound', 'zh-CN');

// 2. 简化语法 - 语言 + 状态码
dsl.error.throw('account.notFound', 'zh-CN', 404);
dsl.error.assert(account, 'account.notFound', 'zh-CN', 404);

// 3. 标准语法 - 带参数对象
dsl.error.throw('account.insufficientBalance', 
  { balance: 50, required: 100 }, 
  400, 
  'zh-CN'
);

// 4. 省略所有参数 - 使用全局语言
dsl.error.throw('account.notFound');
```

#### 实际应用

```javascript
// Express API
app.get('/api/account/:id', async (req, res) => {
  try {
    const account = await findAccount(req.params.id);
    const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
    
    // 🎯 简化语法：只需2个参数
    dsl.error.assert(account, 'account.notFound', locale);
    
    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

### 🌐 实际场景

#### Express 完整集成

```javascript
const express = require('express');
const { I18nError, Locale } = require('schema-dsl');

const app = express();
app.use(express.json());

// ========== 配置语言包 ==========
Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元'
  }
});

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: {{#balance}}, required {{#required}}'
  }
});

// ========== 中间件：提取语言 ==========
app.use((req, res, next) => {
  req.locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  next();
});

// ========== 错误处理中间件 ==========
app.use((error, req, res, next) => {
  if (error instanceof I18nError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.toJSON()
    });
  }
  
  // 其他错误
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// ========== 业务路由 ==========
app.get('/api/account/:id', async (req, res, next) => {
  try {
    const account = await findAccount(req.params.id);
    
    // 使用运行时语言
    I18nError.assert(account, 'account.notFound', req.locale, 404);
    
    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

app.post('/api/account/transfer', async (req, res, next) => {
  try {
    const { fromId, toId, amount } = req.body;
    const account = await findAccount(fromId);
    
    I18nError.assert(account, 'account.notFound', req.locale, 404);
    I18nError.assert(
      account.balance >= amount,
      'account.insufficientBalance',
      { balance: account.balance, required: amount },
      400,
      req.locale
    );
    
    await transferMoney(fromId, toId, amount);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
```

---

#### Koa 完整集成

```javascript
const Koa = require('koa');
const { I18nError, Locale } = require('schema-dsl');

const app = new Koa();

// ========== 配置语言包 ==========
Locale.addLocale('zh-CN', {
  'user.noPermission': {
    code: 40003,
    message: '您没有权限执行此操作'
  }
});

// ========== 中间件：提取语言 ==========
app.use(async (ctx, next) => {
  ctx.locale = ctx.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  await next();
});

// ========== 错误处理中间件 ==========
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof I18nError) {
      ctx.status = error.statusCode;
      ctx.body = {
        success: false,
        error: error.toJSON()
      };
    } else {
      ctx.status = 500;
      ctx.body = { success: false, message: 'Internal Server Error' };
    }
  }
});

// ========== 业务路由 ==========
app.use(async (ctx) => {
  if (ctx.path === '/api/admin/users' && ctx.method === 'GET') {
    const user = await getCurrentUser(ctx);
    
    I18nError.assert(user.role === 'admin', 'user.noPermission', ctx.locale, 403);
    
    ctx.body = { success: true, data: await getUsers() };
  }
});
```

---

#### 原生 Node.js HTTP Server

```javascript
const http = require('http');
const { I18nError, Locale } = require('schema-dsl');

// 配置语言包
Locale.addLocale('zh-CN', {
  'order.notPaid': {
    code: 50001,
    message: '订单未支付'
  }
});

const server = http.createServer((req, res) => {
  try {
    // 提取语言
    const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
    
    // 业务逻辑
    const order = getOrder(req.url);
    I18nError.assert(order && order.paid, 'order.notPaid', locale, 400);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: order }));
  } catch (error) {
    if (error instanceof I18nError) {
      res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.toJSON()
      }));
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(3000);
```

---

#### TypeScript 支持

```typescript
import { I18nError, Locale } from 'schema-dsl';

// 类型安全的语言包配置
interface ErrorMessages {
  [key: string]: {
    code: number;
    message: string;
  };
}

const zhCN: ErrorMessages = {
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  }
};

Locale.addLocale('zh-CN', zhCN);

// 使用类型守卫
function handleError(error: unknown): void {
  if (error instanceof I18nError) {
    console.log(`错误码: ${error.code}`);
    console.log(`错误消息: ${error.message}`);
    console.log(`HTTP状态: ${error.statusCode}`);
    console.log(`语言: ${error.locale}`);
  }
}

// 业务函数
async function getAccount(id: string): Promise<Account> {
  const account = await findAccount(id);
  
  I18nError.assert(account, 'account.notFound', { id }, 404);
  
  return account;
}
```

---

### 📦 错误对象结构

#### toJSON() 输出格式

```javascript
try {
  I18nError.throw('account.notFound', {}, 404);
} catch (error) {
  console.log(error.toJSON());
}
```

**输出**:
```json
{
  "error": "I18nError",
  "originalKey": "account.notFound",
  "code": 40001,
  "message": "账户不存在",
  "params": {},
  "statusCode": 404,
  "locale": "zh-CN"
}
```

**字段说明**:
- `error`: 固定为 `"I18nError"`
- `originalKey`: 原始错误 key（v1.1.5 新增，用于日志追踪）
- `code`: 错误代码（数字或字符串）
- `message`: 已翻译的错误消息
- `params`: 参数对象
- `statusCode`: HTTP 状态码
- `locale`: 使用的语言

---

#### 错误对象属性

```javascript
try {
  I18nError.throw('account.insufficientBalance', 
    { balance: 50, required: 100 }, 
    400, 
    'zh-CN'
  );
} catch (error) {
  console.log(error.name);          // 'I18nError'
  console.log(error.message);       // '余额不足，当前50元，需要100元'
  console.log(error.originalKey);   // 'account.insufficientBalance'
  console.log(error.code);          // 40002
  console.log(error.params);        // { balance: 50, required: 100 }
  console.log(error.statusCode);    // 400
  console.log(error.locale);        // 'zh-CN'
  console.log(error.stack);         // 堆栈跟踪
}
```

---

#### is() 方法 - 错误类型判断

```javascript
try {
  I18nError.throw('account.notFound');
} catch (error) {
  if (error instanceof I18nError) {
    // 使用 originalKey 判断
    if (error.is('account.notFound')) {
      console.log('账户不存在错误');
    }
    
    // 使用数字 code 判断（v1.1.5+）
    if (error.is(40001)) {
      console.log('账户不存在错误（通过数字码判断）');
    }
  }
}
```

---

### ❓ 常见问题

#### Q1: 如何动态切换语言？

**A**: 有两种方式：

```javascript
// 方式1：全局切换（影响所有后续调用）
Locale.setLocale('en-US');
I18nError.throw('account.notFound');  // 使用英文

// 方式2：运行时指定（只影响当次调用）
I18nError.throw('account.notFound', 'en-US');  // 使用英文
I18nError.throw('account.notFound', 'zh-CN');  // 使用中文
```

**推荐**: 在 API 中根据客户端请求头动态指定（见上面的 Express 示例）

---

#### Q2: 字符串格式和对象格式有什么区别？

**A**: 

| 格式 | 优势 | 适用场景 |
|------|------|---------|
| 字符串 | 简单快捷 | 内部错误、不需要统一码 |
| 对象 | 统一错误码、跨语言一致 | 暴露给前端的错误、国际化 |

```javascript
// 字符串格式
'user.notFound': '用户不存在'

// 对象格式（推荐）
'user.notFound': {
  code: 40001,  // 统一的数字码
  message: '用户不存在'
}
```

**建议**: 优先使用对象格式，便于前端统一处理。

---

#### Q3: 参数插值如何使用？

**A**: 使用 `{{#参数名}}` 语法：

```javascript
// 语言包配置
Locale.addLocale('zh-CN', {
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元'
  }
});

// 使用
I18nError.throw('account.insufficientBalance', {
  balance: 50,
  required: 100
});
// 输出: "余额不足，当前50元，需要100元"
```

**注意**: 参数名必须用 `{{#参数名}}` 格式（井号必须有）。

---

#### Q4: 与 dsl.if 的 message() 有什么区别？

**A**: 

- `dsl.if().message()`: 用于**数据验证错误**（Schema 验证）
- `I18nError`: 用于**业务逻辑错误**（API 业务逻辑）

```javascript
// dsl.if - 数据验证
dsl.if(d => !d).message('user.notFound').assert(user);

// I18nError - 业务逻辑
I18nError.assert(user.role === 'admin', 'user.noPermission');
```

**可以混合使用**:
```javascript
function validateAndProcess(user) {
  // 步骤1：数据验证（使用 dsl.if）
  dsl.if(d => !d).message('user.notFound').assert(user);
  
  // 步骤2：业务逻辑验证（使用 I18nError）
  I18nError.assert(user.role === 'admin', 'user.noPermission');
}
```

---

#### Q5: 如何获取所有可用语言？

**A**: 

```javascript
const { Locale } = require('schema-dsl');

const locales = Locale.getAvailableLocales();
console.log(locales);  // ['en-US', 'zh-CN', 'ja-JP', ...]
```

---

#### Q6: 如何在前端统一处理错误码？

**A**: 使用数字 `code` 字段：

```javascript
// 前端错误处理
async function apiCall() {
  try {
    const response = await fetch('/api/account');
    const data = await response.json();
  } catch (error) {
    // 根据数字 code 统一处理（不受语言影响）
    switch (error.code) {
      case 40001:
        router.push('/login');  // 账户不存在 → 跳转登录
        break;
      case 40002:
        showTopUpDialog();      // 余额不足 → 显示充值弹窗
        break;
      case 40003:
        showError('权限不足');   // 权限不足
        break;
      default:
        showError(error.message);
    }
  }
}
```

**优势**: 前端逻辑不受后端语言切换影响。

---

#### Q7: 默认语言是什么？如何修改？

**A**: 

- **默认语言**: `'zh-CN'`（简体中文）
- **修改方式**: 

```javascript
const { Locale } = require('schema-dsl');

// 启动时设置默认语言
Locale.setLocale('zh-CN');

// 获取当前默认语言
console.log(Locale.getLocale());  // 'zh-CN'
```

**建议**: 在应用启动时（app.js 入口）设置默认语言。

---

#### Q8: 如何处理未配置的错误 key？

**A**: 如果错误 key 未在语言包中配置，会直接返回原始 key：

```javascript
// 未配置 'custom.error'
I18nError.throw('custom.error');
// message: 'custom.error'（原样返回）
```

**建议**: 
1. 使用 TypeScript 定义错误 key 类型，避免拼写错误
2. 在开发环境检查是否所有错误 key 都已配置

---

#### Q9: 支持哪些内置语言？

**A**: 

| 语言代码 | 语言名称 | 支持状态 |
|---------|---------|---------|
| `en-US` | 英语（美国） | ✅ 内置 |
| `zh-CN` | 简体中文 | ✅ 内置 |
| `ja-JP` | 日语 | ✅ 可扩展 |
| `fr-FR` | 法语 | ✅ 可扩展 |
| `es-ES` | 西班牙语 | ✅ 可扩展 |

**自定义语言**: 使用 `Locale.addLocale()` 添加任意语言。

---

#### Q10: 如何在日志中记录错误详情？

**A**: 

```javascript
const winston = require('winston');

app.use((error, req, res, next) => {
  if (error instanceof I18nError) {
    // 记录详细日志
    winston.error('业务错误', {
      originalKey: error.originalKey,  // 原始 key（便于追踪）
      code: error.code,                // 错误码
      message: error.message,          // 已翻译的消息
      params: error.params,            // 参数
      statusCode: error.statusCode,
      locale: error.locale,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
    
    return res.status(error.statusCode).json(error.toJSON());
  }
  next(error);
});
```

**推荐**: 使用 `originalKey` 而非 `message`，因为 `message` 会随语言变化。

---

## 错误对象结构

### 基础结构

schema-dsl 验证返回的错误对象结构：

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!'.label('用户名')
});

const result = validate(schema, { username: 'ab' });

// 返回结构
{
  valid: false,
  errors: [
    {
      path: 'username',
      field: 'username',
      keyword: 'minLength',
      params: { limit: 3 },
      message: '用户名长度不能少于3个字符'
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
console.log(result.errors[0].path);    // 'user/profile/email'
console.log(result.errors[0].message); // '邮箱必须是有效的邮箱地址'
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
console.log(result.errors[0].path); // 'items/0'
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

schema-dsl 对 Ajv 的错误关键字进行了统一格式化，使其更易用：

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
// result.errors[0].path: 'user/address/city'
// result.errors[1].path: 'user/address/street'
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
console.log(result.errors[0].path); // 'items/0'
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
          field: err.path.replace(/\//g, '.'),
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
          field: err.path.replace(/\//g, '.'),
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
      path: err.path.replace(/\//g, '.'),
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
    .custom((value) => {
      if (value === 'admin') {
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
function formatValidationErrors(errors) {
  return errors.map(err => ({
    field: err.path.replace(/\//g, '.'),
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
// i18n/errors/zh-CN.cjs（或任意 .json/.jsonc/.json5 自定义语言包文件）
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
// zh-CN.cjs
'account.notFound': {
  code: 40001,  // ← 数字 code 一致
  message: '账户不存在'
}

// en-US.cjs
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
```

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

- [v1.1.5 完整变更日志](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md)
- [升级指南](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md#升级指南)
- [最佳实践](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md#最佳实践)

---

## 相关文档

- [API 参考文档](./api-reference.md)
- [DSL 语法指南](./dsl-syntax.md)
- [String 扩展文档](./string-extensions.md)
- [多语言配置](./dynamic-locale.md)
- [v1.1.5 变更日志](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md)

---

## 对应示例文件

**示例入口**: [error-handling.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/error-handling.ts)  
**说明**: 覆盖 `validate()` 产生的字段错误、`I18nError` 业务错误对象、`toJSON()` 输出与错误码判断。

---

**最后更新**: 2026-05-08  
**版本**: v1.1.5


