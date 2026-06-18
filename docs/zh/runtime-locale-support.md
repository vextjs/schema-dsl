# 运行时多语言支持 - schema-dsl

**版本**: v1.1.8+  
**更新日期**: 2026-06-10

---

## 📋 概述

schema-dsl 的 `s.error` 和 `I18nError` 支持**运行时指定语言**，无需修改全局语言设置。

这对于 **API 开发**特别有用，可以根据每个请求的语言偏好（如 `Accept-Language` 请求头）动态返回对应语言的错误消息。

### 🆕 智能参数识别（v1.1.8）

**v1.1.8 新增**：支持简化语法，从4个参数减少到2个参数

```javascript
// ✅ 新增：简化语法（推荐）
s.error.throw('account.notFound', 'zh-CN');
s.error.throw('account.notFound', 'zh-CN', 404);

// ✅ 标准语法（完全兼容）
s.error.throw('account.notFound', {}, 404, 'zh-CN');
```

**智能识别规则**：
- 第2个参数是 `string` → 识别为语言参数
- 第2个参数是 `object` → 识别为参数对象
- 第2个参数是 `null/undefined/数组` → 使用默认值

### 🎨 支持的模板语法（v1.1.4+）

schema-dsl 现在支持**多种模板语法格式**，提供更好的兼容性：

| 语法格式 | 示例 | 说明 | 版本 |
|---------|------|------|------|
| `{{#variable}}` | `余额{{#balance}}元` | 井号格式（现有） | v1.0.0+ |
| `{{variable}}` | `余额{{balance}}元` | 无井号格式（新增） | v1.1.4+ |
| `{variable}` | `余额{balance}元` | 单花括号（新增） | v1.1.4+ |
| 混合格式 | `{{#user}}在{date}购买{{product}}` | 可混用多种格式 | v1.1.4+ |

**示例**：
```javascript
// 所有格式都支持
Locale.addLocale('zh-CN', {
  'msg1': '余额不足，当前{{#balance}}元',  // {{#}} 格式
  'msg2': '用户{{name}}已登录',            // {{}} 格式
  'msg3': '订单{orderId}已支付',           // {} 格式
  'msg4': '{{#user}}在{date}购买了{{product}}'  // 混合格式
});
```

**向后兼容**：
- ✅ 现有的 `{{#variable}}` 格式完全兼容
- ✅ 所有单元测试通过
- ✅ 无破坏性变更

---

## 🎯 三种使用方式

### 方式 1: 简化语法（v1.1.8 推荐）⭐

```javascript
import { s, Locale } from 'schema-dsl/pure';

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

// ✅ 简化语法：直接传语言参数
const error1 = s.error.create('account.notFound', 'zh-CN');
console.log(error1.message);  // "账户不存在"

const error2 = s.error.create('account.notFound', 'en-US');
console.log(error2.message);  // "Account not found"
```

**适用场景**：
- 不需要参数插值
- API 开发中最常见
- 代码最简洁

### 方式 2: 全局语言设置（传统方式）

```javascript
import { s, Locale } from 'schema-dsl/pure';

// 设置全局语言
Locale.setLocale('zh-CN');

// 后续所有错误都使用中文
const error1 = s.error.create('account.notFound');
console.log(error1.message);  // "账户不存在"

const error2 = s.error.create('user.noPermission');
console.log(error2.message);  // "没有管理员权限"
```

**适用场景**：
- 单一语言的应用
- 不需要动态切换语言
- 简单的错误处理

---

### 方式 3: 运行时指定语言（推荐用于 API）⭐

```javascript
import { s, Locale } from 'schema-dsl/pure';

// 全局保持默认语言
Locale.setLocale('zh-CN');

// 每次调用时指定语言
const error1 = s.error.create('account.notFound', {}, 404, 'zh-CN');
console.log(error1.message);  // "账户不存在"

const error2 = s.error.create('account.notFound', {}, 404, 'en-US');
console.log(error2.message);  // "Account not found"

const error3 = s.error.create('account.notFound', {}, 404, 'ja-JP');
console.log(error3.message);  // "account.notFound"（日语未翻译）
```

**适用场景**：
- 多语言 API
- 根据请求头动态返回多语言错误
- 同一请求中需要多种语言
- 微服务架构中的错误传递

---

## 🔧 API 参数

### s.error.create()

```typescript
s.error.create(
  code: string,          // 错误代码（如 'account.notFound'）
  params?: object,       // 参数插值（如 { balance: 50 }）
  statusCode?: number,   // HTTP 状态码（默认 400）
  locale?: string        // 🆕 运行时语言（如 'en-US'）
): I18nError
```

### s.error.throw()

```typescript
s.error.throw(
  code: string,
  params?: object,
  statusCode?: number,
  locale?: string        // 🆕 运行时语言
): never
```

### s.error.assert()

```typescript
s.error.assert(
  condition: any,
  code: string,
  params?: object,
  statusCode?: number,
  locale?: string        // 🆕 运行时语言
): void
```

---

## 💡 实际应用场景

### 场景 1: Express/Koa 中根据请求头返回多语言错误

```javascript
import { s } from 'schema-dsl/pure';

function getRequestLocale(acceptLanguage) {
  return acceptLanguage?.split(',')[0]?.trim() || 'zh-CN';
}

// Express 中间件
app.get('/api/account/:id', async (req, res, next) => {
  try {
    const account = await getAccount(req.params.id);
    
    // 根据请求头获取语言
    const locale = getRequestLocale(req.headers['accept-language']);
    
    // 使用运行时语言抛出错误
    s.error.assert(account, 'account.notFound', {}, 404, locale);
    
    res.json(account);
  } catch (error) {
    if (error instanceof I18nError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    next(error);
  }
});

// 请求示例
// 中文客户端: Accept-Language: zh-CN
// 响应: { "code": "account.notFound", "message": "账户不存在", ... }

// 英文客户端: Accept-Language: en-US
// 响应: { "code": "account.notFound", "message": "Account not found", ... }
```

---

### 场景 2: 微服务架构中的错误传递

```javascript
import { s } from 'schema-dsl/pure';

// 服务 A: 用户服务
async function getUserService(userId, locale) {
  const user = await db.findUser(userId);
  
  // 传递 locale 到错误
  s.error.assert(user, 'user.notFound', { userId }, 404, locale);
  
  return user;
}

// 服务 B: API 网关
app.get('/api/users/:id', async (req, res) => {
  try {
    const locale = getRequestLocale(req.headers['accept-language']);
    
    // 调用用户服务，传递 locale
    const user = await getUserService(req.params.id, locale);
    
    res.json(user);
  } catch (error) {
    // 错误已经是正确的语言
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

### 场景 3: 同一请求中使用多种语言

```javascript
import { s } from 'schema-dsl/pure';

// 批量验证，为不同用户返回不同语言的错误
async function batchValidateAccounts(requests) {
  const results = [];
  
  for (const req of requests) {
    try {
      const account = await getAccount(req.accountId);
      
      // 每个用户使用各自的语言偏好
      s.error.assert(
        account.balance >= req.amount,
        'account.insufficientBalance',
        { balance: account.balance, required: req.amount },
        400,
        req.locale  // 每个用户的语言偏好
      );
      
      results.push({ success: true, accountId: req.accountId });
    } catch (error) {
      results.push({
        success: false,
        accountId: req.accountId,
        error: error.toJSON()  // 错误已经是对应用户的语言
      });
    }
  }
  
  return results;
}

// 调用示例
const results = await batchValidateAccounts([
  { accountId: '001', amount: 100, locale: 'zh-CN' },  // 中文用户
  { accountId: '002', amount: 200, locale: 'en-US' },  // 英文用户
  { accountId: '003', amount: 300, locale: 'ja-JP' }   // 日文用户
]);

// 结果：每个用户收到对应语言的错误消息
```

---

### 场景 4: GraphQL Resolver 中的多语言错误

```javascript
import { s } from 'schema-dsl/pure';

const resolvers = {
  Query: {
    account: async (_, { id }, context) => {
      // 从 context 获取用户语言偏好
      const locale = context.user?.locale || 'zh-CN';
      
      const account = await getAccount(id);
      
      // 使用运行时语言
      s.error.assert(account, 'account.notFound', {}, 404, locale);
      
      return account;
    }
  }
};
```

---

## 🔍 运行时语言 vs 全局语言

### 对比表

| 特性 | 全局语言 | 运行时语言 |
|------|---------|-----------|
| 设置方式 | `Locale.setLocale('zh-CN')` | `s.error.create(..., locale)` |
| 影响范围 | 全局所有错误 | 仅当前错误 |
| 是否改变全局状态 | ✅ 是 | ❌ 否 |
| 适用场景 | 单一语言应用 | 多语言 API |
| 并发安全 | ⚠️ 需注意 | ✅ 完全安全 |
| 推荐用于 | 简单应用 | API/微服务 |

### 并发安全性

**全局语言**（不推荐用于多语言 API）：

```javascript
// ❌ 并发不安全
app.get('/api/account/:id', async (req, res) => {
  // 修改全局状态
  Locale.setLocale(req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN');
  
  // 如果同时有多个请求，语言会互相干扰
  const error = s.error.create('account.notFound');
  // 错误消息可能是错误的语言！
});
```

**运行时语言**（推荐）：

```javascript
// ✅ 并发安全
app.get('/api/account/:id', async (req, res) => {
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  
  // 不修改全局状态，每个请求独立
  const error = s.error.create('account.notFound', {}, 404, locale);
  // 错误消息始终是正确的语言
});
```

---

## 📊 测试验证

### 运行时语言测试

```javascript
import { s, Locale } from 'schema-dsl/pure';

// 设置全局为中文
Locale.setLocale('zh-CN');

// 测试1: 运行时指定不同语言
const error1 = s.error.create('account.notFound', {}, 404, 'zh-CN');
const error2 = s.error.create('account.notFound', {}, 404, 'en-US');
const error3 = s.error.create('account.notFound', {}, 404, 'ja-JP');

console.log(error1.message);  // "账户不存在"
console.log(error2.message);  // "Account not found"
console.log(error3.message);  // "account.notFound"

// 测试2: 验证全局语言未被改变
const currentLocale = Locale.getLocale();
console.log(currentLocale);  // "zh-CN"

const error4 = s.error.create('user.noPermission');  // 不指定locale
console.log(error4.message);  // "没有管理员权限"（使用全局语言）
```

### 带参数的运行时语言

```javascript
const error1 = s.error.create(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  400,
  'zh-CN'
);
console.log(error1.message);  // "余额不足，当前余额50，需要100"

const error2 = s.error.create(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  400,
  'en-US'
);
console.log(error2.message);  // "Insufficient balance, current: 50, required: 100"
```

---

## 🎯 最佳实践

### 1. API 开发中始终使用运行时语言

```javascript
// ✅ 推荐
app.get('/api/account/:id', async (req, res) => {
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  
  try {
    const account = await getAccount(req.params.id);
    s.error.assert(account, 'account.notFound', {}, 404, locale);
    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});

// ❌ 不推荐
app.get('/api/account/:id', async (req, res) => {
  Locale.setLocale(req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN');  // 并发不安全
  // ...
});
```

### 2. 统一封装语言获取逻辑

```javascript
// 工具函数
function getUserLocale(req) {
  return req.user?.locale || 
         req.headers['accept-language']?.split(',')[0]?.trim() || 
         'zh-CN';
}

// 在业务代码中使用
app.get('/api/account/:id', async (req, res) => {
  const locale = getUserLocale(req);
  
  try {
    const account = await getAccount(req.params.id);
    s.error.assert(account, 'account.notFound', {}, 404, locale);
    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

### 3. 在微服务间传递 locale

```javascript
// 服务 A: 底层服务
async function getUser(userId, options = {}) {
  const user = await db.findUser(userId);
  
  s.error.assert(
    user,
    'user.notFound',
    { userId },
    404,
    options.locale  // 接收 locale 参数
  );
  
  return user;
}

// 服务 B: API 网关
app.get('/api/users/:id', async (req, res) => {
  const locale = getUserLocale(req);
  
  try {
    const user = await getUser(req.params.id, { locale });
    res.json(user);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

## 📝 向后兼容

✅ **完全向后兼容**

- 现有代码无需修改
- `locale` 参数为可选参数
- 不传 `locale` 时使用全局语言
- 相关单元测试已覆盖

---

## 🔗 相关文档

- [多语言配置指南](./i18n.md)
- [错误处理完整指南](./error-handling.md)
- [I18nError API 参考](./api-reference.md)

---

## 对应示例文件

**示例入口**: [runtime-locale-support.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-locale-support.ts)  
**说明**: 覆盖运行时指定 locale 创建错误对象、参数插值，以及“局部语言切换不污染全局状态”的关键行为。

---

**最后更新**: 2026-06-10
**作者**: schema-dsl Team

