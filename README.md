# 🎯 schema-dsl

**最简洁的数据验证库 - 代码量减少 65%**

一行 DSL 替代 10 行链式调用

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[快速开始](./docs/quick-start.md) · [在线体验](https://runkit.com/npm/schema-dsl) · [完整文档](./docs/INDEX.md) · [示例代码](./examples) · [性能测试](./docs/performance-guide.md)

---

> **当前源码版本**：`2.0.0-beta.1`（TypeScript 重构版）。本文中标注的 `v1.x` 表示该功能首次引入的历史版本；当前重构版保留这些 v1 公共 API 兼容入口。

---

## ⚡ TL;DR（30秒快速理解）

**schema-dsl 是什么？**  
最简洁的数据验证库，一行 DSL 代替 10 行链式调用；在当前 benchmark 的有效数据场景中，性能稳定快于 Zod/Joi。

**核心优势：**
- 🎯 **极简语法**: `'string:3-32!'` 代替 8行 Joi 代码（减少 65% 代码量）
- 🚀 **高性能（分场景）**: 当前 `tinybench` 实测下，有效数据场景稳定快于 Zod/Joi；无效数据场景快于 Zod、慢于 Joi
- 🌍 **完整多语言**: 内置5种语言，支持运行时动态切换（v1.1.0+）
- 🎨 **独家功能**: 从验证规则直接生成 MongoDB/MySQL/PostgreSQL Schema

**3行代码上手：**
```javascript
const { dsl, validate } = require('schema-dsl');
const schema = dsl({ email: 'email!', age: 'number:18-' });
const result = validate(schema, { email: 'test@example.com', age: 25 });
console.log(result.valid);  // true
```

**5分钟教程**: [快速开始](./docs/quick-start.md) | **完整文档**: [docs/INDEX.md](./docs/INDEX.md) | **在线体验**: [RunKit](https://runkit.com/npm/schema-dsl)

---

## 🗺️ 文档导航

**新手入门**:
- [快速开始](./docs/quick-start.md) - 5 分钟上手
- [功能总览](./docs/FEATURE-INDEX.md) - 了解所有功能
- [DSL 语法速查](./docs/dsl-syntax.md) - 语法参考

**核心功能**:
- [基础验证](./docs/validation-guide.md) - 表单验证
- [批量验证](./docs/validate-batch.md) - 性能优化
- [嵌套对象](./docs/json-schema-basics.md) - 复杂结构
- [条件验证](./docs/conditional-api.md) - 动态规则
- [多语言](./docs/i18n.md) - 国际化

**框架集成**:
- [Express / Koa / Fastify 集成](./docs/validate-async.md)

**高级功能**:
- [数据库导出](./docs/export-guide.md) - 独家功能
- [插件系统](./docs/plugin-system.md) - 扩展功能
- [TypeScript](./docs/typescript-guide.md) - 类型支持

**完整文档**: [docs/INDEX.md](./docs/INDEX.md) - 58 份文档（含 README）

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
    "benchmarkTool": "tinybench",
    "sameTierConclusion": {
      "simpleValid": "ajv(raw) > schema-dsl > zod > joi",
      "simpleInvalid": "ajv(raw) > joi > schema-dsl > zod",
      "nestedValid": "ajv(raw) > schema-dsl > zod > joi"
    },
    "notes": [
      "schema-dsl 在有效数据场景稳定快于 zod/joi",
      "schema-dsl 在无效数据场景快于 zod，慢于 joi",
      "绝对 ops/s 会随 Node 版本与机器环境波动，请以 npm run bench 实测为准"
    ],
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
| `builder.toJsonSchema()` | 转为纯净 JSON Schema（v1.2.5） | JSON Schema 对象 | [API参考](./docs/api-reference.md) |
| `dsl.if(condition)` | 条件验证 | ConditionalBuilder | [条件API](./docs/conditional-api.md) |
| `SchemaUtils.pick()` | 选择字段 | 新Schema | [SchemaUtils](./docs/schema-utils.md) |
| `I18nError.throw()` | 抛出多语言错误 | never | [I18nError示例](./examples/i18n-error.examples.ts) |

---

## ✨ 为什么选择 schema-dsl？

### 🎯 极简 DSL 语法

**3 行代码完成验证规则定义**

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

**✅ schema-dsl** - 简洁优雅

```javascript
// 只需 3 行！
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});
```

### 🚀 性能表现（按场景看）

**当前 benchmark 更适合解读为“分场景结论”，而不是固定单一榜单。**

| 场景 | 同维度相对结论 | 结论解读 |
|------|----------------|----------|
| S1：简单对象（有效数据） | `ajv(raw) > schema-dsl > zod > joi` | `schema-dsl` 稳定快于 `zod` / `joi` |
| S2：简单对象（无效数据 / 错误收集） | `ajv(raw) > joi > schema-dsl > zod` | `schema-dsl` 快于 `zod`，但慢于 `joi` |
| S3：嵌套对象（有效数据） | `ajv(raw) > schema-dsl > zod > joi` | `schema-dsl` 稳定快于 `zod` / `joi` |

**应如何理解当前性能结论**:
- ✅ 在**有效数据场景**（S1 / S3），`schema-dsl` 目前稳定快于 `zod` 和 `joi`
- ✅ 在**无效数据 / 错误收集场景**（S2），`schema-dsl` 目前快于 `zod`，但慢于 `joi`
- ℹ️ `ajv (raw)` 是 `schema-dsl` 的底层引擎，用于衡量 DSL / i18n / coerce / cache 带来的额外开销
- ℹ️ `fastest-validator` 属于代码生成路线，benchmark 中仅作不同技术路线参考，不宜与 JSON Schema 合规验证器直接宣称“同榜第一”
- ⚠️ 绝对 `ops/s` 会随 Node 版本、CPU、操作系统和测量轮次波动，请以本地 `npm run bench` 输出为准

> 📊 **测试环境**: Node.js v20.x, Windows  
> 📊 **测试场景**: S1 简单对象（有效数据）/ S2 简单对象（无效数据）/ S3 嵌套对象（有效数据）  
> 📊 **测试工具**: [tinybench](https://github.com/tinylibs/tinybench)  
> 📊 **运行测试**: `npm run bench`

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

> **目录加载支持（Node >=18）**：`dsl.config({ i18n: '/path/to/locales' })` 默认支持 `.js`（CommonJS）、`.cjs`、`.json`、`.jsonc`、`.json5`。  
> **推荐**：如果你的应用是 `type: module` / ESM 项目，优先使用 `.cjs`、`.json`、`.jsonc`、`.json5` 作为语言包文件，兼容性最稳定。

**🆕 运行时多语言支持（v1.1.0+）**

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

📖 完整文档请查看 [examples/i18n-error.examples.ts](./examples/i18n-error.examples.ts)  
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
- [完整文档索引](./docs/INDEX.md) - 57 篇文档导航
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

> 当前仓库保留 `examples/` 目录（可直接运行的 smoke 示例），并同时维护测试与文档示例：
> - **`examples/`** — 包含 `export-demo.js` 等可运行示例
> - **`test/`** — 1,018 个测试用例，覆盖所有功能的实际用法
> - **`docs/`** — 57 个功能文档，含大量代码示例
> - 本 README 内联示例（下方各章节）

### 📝 版本和贡献
- [更新日志](./CHANGELOG.md) - 详细版本历史
- [贡献指南](./CONTRIBUTING.md) - 如何参与贡献

- [安全策略](./SECURITY.md) - 安全问题报告

---

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by schema-dsl team


