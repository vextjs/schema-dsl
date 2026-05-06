<div align="center">

# 🎯 schema-dsl

**用最简洁的 DSL 声明字段规则，让同一份 schema 驱动验证、派生、导出和文档。**

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-Native-3178C6.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

[快速开始](#-快速开始) · [文档站](https://schema-dsl.github.io) · [功能总览](#-功能总览) · [示例代码](./examples)

```bash
npm install schema-dsl
```

</div>

---

## ⚡ TL;DR（30 秒快速理解）

**schema-dsl 是什么？**

把字段规则写成这样：

```typescript
import { dsl, validate } from 'schema-dsl';

const userSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  role:     'admin|user|guest',
  contact:  'types:email|phone'
});

const result = validate(userSchema, req.body);
```

然后这**同一份规则**继续驱动：

- ✅ **同步 / 异步校验** — `validate()` / `validateAsync()`
- ✅ **场景派生** — `pick / omit / partial` 按接口需求裁剪 schema
- ✅ **数据库 Schema** — MongoDB / MySQL / PostgreSQL 直接导出
- ✅ **字段文档** — Markdown 自动生成
- ✅ **统一错误模型** — `ValidationError` + `I18nError`
- ✅ **多语言** — 内置 5 种语言（zh-CN / en-US / ja-JP / es-ES / fr-FR），支持运行时切换

**5 分钟教程**: [快速开始](./docs/quick-start.md) | **完整文档**: [在线文档站](https://schema-dsl.github.io/)

---

## 🗺️ 文档导航

**新手入门**:
- [快速开始](./docs/quick-start.md) — 5 分钟上手
- [DSL 语法速查](#-dsl-语法速查) — 语法参考
- [常见问题](./docs/faq.md) — FAQ 合集

**核心功能**:
- [验证完整指南](./docs/validation-guide.md) — 校验所有场景
- [SchemaUtils 工具](./docs/schema-utils.md) — schema 复用
- [条件验证 API](./docs/conditional-api.md) — dsl.if / dsl.match
- [异步校验与框架集成](./docs/validate-async.md) — Express / Koa / Fastify
- [错误处理与多语言](./docs/error-handling.md) — 错误模型

**导出与集成**:
- [数据库导出指南](./docs/export-guide.md) — MongoDB / MySQL / PostgreSQL
- [TypeScript 指南](./docs/typescript-guide.md) — 类型推断与用法
- [插件系统](./docs/plugin-system.md) — 自定义扩展

**完整文档**: [在线文档站](https://schema-dsl.github.io) · [功能索引](./docs/FEATURE-INDEX.md)

---

## ✨ 为什么选择 schema-dsl？

### 🎯 极简 DSL，代码量减少 65%

<table>
<tr>
<td width="50%" valign="top">

**❌ 传统写法** — 繁琐冗长

```javascript
// Joi — 需要 8 行
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

**✅ schema-dsl** — 简洁优雅

```typescript
// 只需 3 行
const schema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'number:18-120'
});
```

</td>
</tr>
</table>

### 💪 功能完整

| 功能 | schema-dsl | 说明 |
|------|:----------:|------|
| **基本验证** | ✅ | string、number、boolean、date、email、url、phone... |
| **高级验证** | ✅ | 正则、自定义函数、条件分支、嵌套对象、数组... |
| **跨类型联合** | ✅ | `types:email\|phone` 一个字段支持多种类型 |
| **错误消息** | ✅ | 多语言自动翻译 + 自定义消息 + 字段标签 |
| **多语言业务错误** | ✅ | `I18nError` 统一抛出 + 数字错误码 |
| **数据库导出** | ✅ | MongoDB / MySQL / PostgreSQL Schema 自动生成 |
| **文档生成** | ✅ | Markdown 字段说明自动生成 |
| **TypeScript** | ✅ | 原生 TypeScript 编写，完整类型推断 |
| **插件系统** | ✅ | 自定义类型 / 格式 / 验证器 |
| **Schema 复用** | ✅ | pick / omit / partial / extend |

### 🎨 一份规则，多处复用（独家特性）

```typescript
import { dsl, exporters, SchemaUtils } from 'schema-dsl';

const userSchema = dsl({
  id:        'uuid!',
  username:  'string:3-32!',
  email:     'email!',
  password:  'string:8-64!',
  age:       'number:18-120',
  createdAt: 'string!'
});

// 📋 派生各接口场景的 schema
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);
const updateSchema = SchemaUtils.partial(SchemaUtils.pick(userSchema, ['username', 'email']));
const publicSchema = SchemaUtils.omit(userSchema, ['password']);

// 🗄️ 同一份规则导出到数据库
const mongoSchema = new exporters.MongoDBExporter().export(userSchema);
const mysqlDDL    = new exporters.MySQLExporter().export('users', userSchema);
const pgDDL       = new exporters.PostgreSQLExporter().export('users', userSchema);

// 📝 同一份规则生成字段说明文档
const markdown = exporters.MarkdownExporter.export(userSchema, { title: '用户字段说明' });
```

---

## 📦 安装

```bash
npm install schema-dsl
```

**运行时要求**: Node.js >= 18.0.0

---

## 🚀 快速开始

### 1. 基础验证

```typescript
import { dsl, validate } from 'schema-dsl';

const userSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'number:18-120',
  role:     'admin|user|guest',
  tags:     'array<string>'
});

// ✅ 验证成功
const result = validate(userSchema, {
  username: 'john_doe',
  email:    'john@example.com',
  age:      25,
  role:     'user',
  tags:     ['verified']
});

console.log(result.valid);   // true
console.log(result.data);    // 验证后的数据

// ❌ 验证失败
const bad = validate(userSchema, { username: 'ab', email: 'not-email' });
console.log(bad.errors);
// [
//   { path: 'username', message: 'username 长度不能少于 3 个字符' },
//   { path: 'email',    message: 'email 格式不正确' }
// ]
```

### 2. 异步验证 + Express 集成

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

const createUserSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  password: 'string:8-32!'
});

app.post('/api/users', async (req, res, next) => {
  try {
    // 验证失败时自动抛出 ValidationError
    const validData = await validateAsync(createUserSchema, req.body);
    const user = await db.users.create(validData);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// 全局错误处理
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({ success: false, errors: error.errors });
  }
  next(error);
});
```

### 3. Schema 复用（create / update / public）

```typescript
import { dsl, SchemaUtils } from 'schema-dsl';

const userSchema = dsl({
  id:        'uuid!',
  username:  'string:3-32!',
  email:     'email!',
  password:  'string:8-64!',
  createdAt: 'string!'
});

// 创建接口：去掉服务端自动生成的字段
const createSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt']);

// 更新接口：只允许修改部分字段，且全部可选
const updateSchema = SchemaUtils.partial(
  SchemaUtils.pick(userSchema, ['username', 'email'])
);

// 公开响应：隐藏敏感字段
const publicSchema = SchemaUtils.omit(userSchema, ['password']);
```

### 4. 数据库 Schema 导出

```typescript
import { dsl, exporters } from 'schema-dsl';

const productSchema = dsl({
  name:      'string:1-100!',
  price:     'number:>0!',
  stock:     'integer:0-!',
  category:  'string!',
  createdAt: 'datetime!'
});

// MongoDB $jsonSchema（用于 db.createCollection() 字段验证，非 Mongoose model schema）
const mongoSchema = new exporters.MongoDBExporter().export(productSchema);
/*
{
  $jsonSchema: {
    bsonType: 'object',
    properties: {
      name:      { bsonType: 'string', minLength: 1, maxLength: 100 },
      price:     { bsonType: 'double', minimum: 0 },
      stock:     { bsonType: 'int',    minimum: 0 },
      category:  { bsonType: 'string' },
      createdAt: { bsonType: 'string' }
    },
    required: ['name', 'price', 'stock', 'category', 'createdAt']
  }
}
*/

// MySQL DDL
const mysqlDDL = new exporters.MySQLExporter().export('products', productSchema);
/*
CREATE TABLE `products` (
  `name`      VARCHAR(100) NOT NULL,
  `price`     DECIMAL(10, 2) NOT NULL,
  `stock`     INT NOT NULL,
  `category`  VARCHAR(255) NOT NULL,
  `createdAt` DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
*/

// Markdown 字段文档
const markdown = exporters.MarkdownExporter.export(productSchema, { title: '商品字段说明' });
```

---

## 🗒️ 功能总览

### 常见使用场景

| 场景 | 用法 | 文档 |
|------|------|------|
| API 参数验证 | `validateAsync` + `ValidationError` | [异步校验](./docs/validate-async.md) |
| 表单 / 脚本校验 | `validate()` | [验证指南](./docs/validation-guide.md) |
| 批量数据校验 | `SchemaUtils.validateBatch()` | [SchemaUtils](./docs/schema-utils.md) |
| create / update 派生 | `pick / omit / partial` | [SchemaUtils](./docs/schema-utils.md) |
| 数据库建表 | `MongoDBExporter / MySQLExporter` | [导出指南](./docs/export-guide.md) |
| 字段文档生成 | `MarkdownExporter` | [导出指南](./docs/export-guide.md) |
| 多语言 API 错误 | `I18nError` | [错误处理](./docs/error-handling.md) |
| 条件 / 动态规则 | `dsl.if()` / `dsl.match()` | [条件验证](./docs/conditional-api.md) |
| 自定义类型扩展 | `PluginManager` | [插件系统](./docs/plugin-system.md) |

---

## 📖 DSL 语法速查

### 基础类型

```typescript
dsl({
  // 字符串
  name:     'string!',         // 必填
  code:     'string:6',        // 精确长度 6
  bio:      'string:-500',     // 最大长度 500
  username: 'string:3-32',     // 长度范围 3–32

  // 数字
  age:   'number:18-120',      // 范围 18–120
  score: 'integer:0-100',      // 整数 0–100
  price: 'number:>0',          // 大于 0（严格）
  level: 'number:>=1',         // 大于等于 1

  // 枚举
  status: 'active|inactive|pending',  // 字符串枚举
  level:  'enum:number:1|2|3',        // 数字枚举

  // 数组
  tags:  'array<string>',             // 字符串数组
  items: 'array:1-10<number>',        // 1–10 个数字元素

  // 布尔
  active: 'boolean!',

  // 联合类型
  contact: 'types:email|phone!',      // 邮箱或手机号二选一
  price2:  'types:number:0-|string',  // 数字或字符串
})
```

### 内置格式

```typescript
dsl({
  email:     'email!',          // 邮箱
  website:   'url!',            // URL
  birthday:  'date!',           // YYYY-MM-DD
  createdAt: 'datetime!',       // ISO 8601
  userId:    'uuid!',           // UUID
  phone:     'phone:cn!',       // 中国手机号
  idCard:    'idCard:cn!',      // 身份证号
  slug:      'slug:3-100!',     // URL 友好字符串
})
```

### 链式调用（TypeScript 推荐写法）

```typescript
import { dsl } from 'schema-dsl';

const schema = dsl({
  username: dsl('string:3-32!')
    .username()
    .label('用户名')
    .messages({ required: '用户名不能为空' }),

  email: dsl('email!').label('邮箱地址'),

  phone: dsl('string:11!')
    .pattern(/^1[3-9]\d{9}$/)
    .label('手机号'),
});
```

### 条件验证

```typescript
// dsl.match — 根据字段值路由不同规则
const contactSchema = dsl({
  type:    'email|phone|wechat',
  contact: dsl.match('type', {
    email:  'email!',
    phone:  'string:11!',
    wechat: 'string:6-20!',
  })
});

// dsl.if — 简单条件分支
const orderSchema = dsl({
  isVip:    'boolean!',
  discount: dsl.if('isVip', 'number:10-50!', 'number:0-10')
});

// dsl.if 链式条件断言
dsl.if(d => !d.account)
  .message('账户不存在')
  .and(d => d.account.balance < amount)
  .message('余额不足')
  .assert(data);
```

---

## 🌍 多语言支持

```typescript
import { dsl, validate, Locale, I18nError } from 'schema-dsl';

// 内置语言：zh-CN / en-US / ja-JP / es-ES / fr-FR（自动加载，无需配置）
const result = validate(schema, data, { locale: 'zh-CN' });
// 错误消息自动使用中文

// 添加自定义语言包
Locale.addLocale('zh-CN', {
  'user.notFound':    '用户不存在',
  'user.forbidden':   { code: 40003, message: '无权访问' },
});

// 抛出多语言业务错误
I18nError.assert(user, 'user.notFound');           // 不存在时自动抛出
I18nError.throw('user.forbidden', {}, 403);        // 直接抛出
I18nError.assert(ok, 'user.notFound', {}, 404, locale); // 运行时指定语言

// 错误包含统一数字码，前端按 code 分支处理
try {
  await api.getUser(id);
} catch (error) {
  switch (error.code) {
    case 40003: showForbiddenPage(); break;
  }
}
```

---

## 🔌 插件系统

```typescript
import { PluginManager, Validator, dsl } from 'schema-dsl';

const pluginManager = new PluginManager();

// 注册自定义格式插件（必须提供 install 函数）
pluginManager.register({
  name: 'extra-formats',
  install(core) {
    const validator = core as Validator;
    // 通过 addFormat 向 Validator 实例注册自定义格式
    validator.addFormat('hex-color', {
      validate: (v: string) => /^#[0-9A-F]{6}$/i.test(v)
    });
    validator.addFormat('mac-address', {
      validate: (v: string) => /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/i.test(v)
    });
  }
});

// 创建 Validator 并安装插件
const validator = new Validator();
pluginManager.install(validator);

// 现在可以在 schema 中使用自定义格式
const schema = dsl({ color: 'hex-color!', mac: 'mac-address' });
const result = validator.validate(schema, { color: '#FF5733', mac: '00:1A:2B:3C:4D:5E' });
```

---

## 🔧 核心 API 速查

| API | 用途 | 返回值 | 文档 |
|-----|------|--------|------|
| `dsl(schema)` | 创建 Schema | Schema 对象 | [DSL 语法](./docs/dsl-syntax.md) |
| `validate(schema, data)` | 同步验证 | `{ valid, errors, data }` | [验证指南](./docs/validation-guide.md) |
| `validateAsync(schema, data)` | 异步验证 | Promise（失败抛错） | [异步校验](./docs/validate-async.md) |
| `SchemaUtils.pick()` | 选择字段 | 新 Schema | [SchemaUtils](./docs/schema-utils.md) |
| `SchemaUtils.omit()` | 排除字段 | 新 Schema | [SchemaUtils](./docs/schema-utils.md) |
| `SchemaUtils.partial()` | 全部可选 | 新 Schema | [SchemaUtils](./docs/schema-utils.md) |
| `dsl.if(condition)` | 条件验证 | ConditionalBuilder | [条件 API](./docs/conditional-api.md) |
| `dsl.match(field, map)` | 分支验证 | ConditionalBuilder | [条件 API](./docs/conditional-api.md) |
| `I18nError.throw()` | 抛出多语言错误 | never | [错误处理](./docs/error-handling.md) |
| `I18nError.assert()` | 断言 + 抛出 | void | [错误处理](./docs/error-handling.md) |

---

## 📝 TypeScript 用法

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

// ✅ TypeScript 中用 dsl() 包裹字符串获得完整类型推断
const userSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email:    dsl('email!').label('邮箱'),
  age:      dsl('number:18-100').label('年龄')
});

try {
  const validData = await validateAsync(userSchema, payload);
  // validData 有完整类型推断
} catch (error) {
  if (error instanceof ValidationError) {
    error.errors.forEach(e => console.log(`${e.path}: ${e.message}`));
  }
}
```

> **注意**：TypeScript 项目中需用 `dsl('...')` 包裹字符串以获得类型推断，JavaScript 项目可直接写字符串。
> 详见 [TypeScript 使用指南](./docs/typescript-guide.md)

---

## 🛠️ 开发与验证

```bash
npm run build      # 编译 TypeScript
npm run test       # 运行测试
npm run typecheck  # 类型检查
```

文档站本地预览：

```bash
cd website
npm run dev
```

---

## 🤝 贡献

```bash
git clone https://github.com/vextjs/schema-dsl.git
cd schema-dsl
npm install
npm test
```

详见 [贡献指南](./CONTRIBUTING.md)

---

## 🔗 相关链接

### 📖 核心文档
- [快速开始](./docs/quick-start.md) — 5 分钟入门
- [DSL 语法完整指南](./docs/dsl-syntax.md) — 完整语法参考
- [验证指南](./docs/validation-guide.md) — 高级验证技巧
- [API 参考](./docs/api-reference.md) — 完整 API 文档
- [TypeScript 指南](./docs/typescript-guide.md) — TS 用户必读
- [最佳实践](./docs/best-practices.md) — 避免常见坑
- [故障排查](./docs/troubleshooting.md) — 问题诊断

### 🎯 功能文档
- [SchemaUtils 工具](./docs/schema-utils.md)
- [条件验证 API](./docs/conditional-api.md)
- [异步校验](./docs/validate-async.md)
- [错误处理与多语言](./docs/error-handling.md)
- [联合类型](./docs/union-types.md)
- [枚举类型](./docs/enum.md)

### 🗄️ 导出与集成
- [导出指南](./docs/export-guide.md)
- [MongoDB 导出器](./docs/mongodb-exporter.md)
- [MySQL 导出器](./docs/mysql-exporter.md)
- [PostgreSQL 导出器](./docs/postgresql-exporter.md)
- [Markdown 导出器](./docs/markdown-exporter.md)
- [⚠️ 导出限制说明](./docs/export-limitations.md)

### 💻 示例代码
- [simple-example.ts](./examples/simple-example.ts) — 基础用法
- [express-integration.ts](./examples/express-integration.ts) — Express 集成
- [export-demo.ts](./examples/export-demo.ts) — 数据库导出
- [i18n-error.examples.ts](./examples/i18n-error.examples.ts) — 多语言错误
- [plugin-system.examples.ts](./examples/plugin-system.examples.ts) — 插件示例

### 📝 版本与贡献
- [更新日志](./CHANGELOG.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全策略](./SECURITY.md)

---

## 📄 License

[MIT](./LICENSE)

---

<div align="center">

如果这个项目对你有帮助，欢迎给仓库一个 Star ⭐

Made with ❤️ by the schema-dsl team

</div>




