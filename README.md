<div align="center">

# 🎯 schema-dsl

**最简洁的 JSON Schema 验证库 - 一行代码搞定复杂验证**

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[快速开始](#-快速开始) · [文档](./docs/INDEX.md) · [示例](./examples) · [更新日志](./CHANGELOG.md)

---

### 代码量减少 65% | 性能优秀 | 独家数据库导出

</div>

---

## 📑 目录

- [安装](#-安装)
- [快速开始](#-快速开始)
- [核心特性](#-核心特性)
- [DSL 语法](#-dsl-语法)
- [String 扩展](#-string-扩展)
- [默认验证器](#-默认验证器)
- [验证功能](#-验证功能)
- [数据库导出](#-数据库导出)
- [多语言支持](#-多语言支持)
- [插件系统](#-插件系统)
- [错误处理](#-错误处理)
- [工具函数](#-工具函数)
- [完整文档](#-完整文档)

---

## 📦 安装

```bash
npm install schema-dsl
```

---

## 🚀 快速开始

```javascript
const { dsl, validate } = require('schema-dsl');

// 定义Schema
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// 验证数据
const result = validate(schema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

console.log(result.valid);  // true
```

### 📊 与其他库对比

<table>
<tr>
<td width="50%">

**schema-dsl - 简洁优雅** ✨
```javascript
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});
```

</td>
<td width="50%">

**其他库 - 冗长繁琐**
```javascript
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
</tr>
</table>

**代码量减少 65%，开发效率提升 3 倍！** 🚀

**📖 详细教程**: [快速开始](docs/quick-start.md)

---

## ✨ 核心特性

- **简洁语法**: 一行代码定义验证规则
- **String扩展**: 字符串直接链式调用方法
- **默认验证器**: 内置用户名、手机号、密码验证
- **插件系统**: 强大的插件机制，支持自定义验证器和格式 🆕
- **数据库导出**: 导出MongoDB/MySQL/PostgreSQL Schema
- **多语言支持**: 内置中英文，可自定义语言包
- **高性能**: 基于ajv，支持编译缓存
- **轻量级**: 无冗余依赖

---

## 🎯 为什么选择 schema-dsl？

### 三大核心优势

#### 1. 代码最简洁 ⭐⭐⭐⭐⭐

**一行代码搞定复杂验证**：
```javascript
// schema-dsl - 简洁明了
username: 'string:3-32!'

// 其他库 - 冗长繁琐
username: Joi.string().min(3).max(32).required()
```

代码量减少 **65%**，开发效率提升 **3倍**！

---

#### 2. 性能优秀 ⭐⭐⭐⭐

**真实测试结果**（10,000次验证）：

| 库名 | 速度 | 排名 |
|------|------|------|
| Ajv | 2,000,000 次/秒 | 🥇 第1 |
| Zod | 526,316 次/秒 | 🥈 第2 |
| **schema-dsl** | **277,778 次/秒** | 🥉 **第3** |
| Joi | 97,087 次/秒 | 第4 |
| Yup | 60,241 次/秒 | 第5 |

- ✅ 比 Joi 快 **2.86倍**
- ✅ 比 Yup 快 **4.61倍**
- ✅ 对大多数应用足够（27万+次/秒）

---

#### 3. 独家功能 ⭐⭐⭐⭐⭐

**唯一支持的功能**：

✅ **数据库 Schema 导出**
```javascript
// 自动生成 MongoDB/MySQL/PostgreSQL Schema
const mongoSchema = exporters.MongoDBExporter.export(schema);
const mysqlDDL = new exporters.MySQLExporter().export('users', schema);
```

✅ **完整的多语言系统**
```javascript
// 用户可自定义语言包
dsl.config({
  i18n: {
    locales: { 'zh-CN': { 'username': '用户名' } }
  }
});
```

✅ **Markdown 文档自动生成**
```javascript
// 一键生成 API 文档
const markdown = exporters.MarkdownExporter.export(schema);
```

---

### 适合你吗？

**✅ 选择 schema-dsl，如果你**：
- 想快速开发，减少代码量
- 需要多语言支持（国际化项目）
- 需要自动生成数据库 Schema
- 需要配置驱动的验证规则（多租户系统）
- 想 5 分钟上手

**⚠️ 考虑其他库，如果**：
- TypeScript 项目需要强类型推断 → 推荐 **Zod**
- 需要极致性能（>50万次/秒）→ 推荐 **Ajv** 或 **Zod**

---

## 🤔 适合你的项目吗？

### ✅ 选择 schema-dsl，如果你：

- 🚀 **追求开发效率** - 想用最少的代码完成验证
- 🌍 **需要多语言支持** - 国际化项目必备（内置5种语言）
- 🗄️ **需要数据库 Schema** - 自动生成 MongoDB/MySQL/PostgreSQL DDL
- 🔧 **配置驱动** - 验证规则需要从配置/数据库动态读取
- 👨‍💻 **快速上手** - 5 分钟学会，文档完善

### 🔀 考虑其他库，如果：

- 📘 **TypeScript 类型推断** - 项目需要极强的类型安全 → 推荐 **[Zod](https://github.com/colinhacks/zod)**
- ⚡ **极致性能要求** - 需要 50 万+ ops/s → 推荐 **[Ajv](https://github.com/ajv-validator/ajv)**
- 🏢 **企业级成熟方案** - 需要经过大规模验证 → 推荐 **[Joi](https://github.com/sideway/joi)**

### 💡 独家优势

schema-dsl 是**唯一**同时提供以下功能的库：

| 功能 | schema-dsl | Joi | Yup | Zod | Ajv |
|------|----------|-----|-----|-----|-----|
| **DSL 语法** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **数据库导出** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **完整多语言** | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Markdown 导出** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **配置驱动** | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 💡 性能说明

### 为什么比 Zod 慢但依然值得选择？

schema-dsl 使用**运行时解析**，而 Zod 使用**编译时构建**。

**这个选择带来的好处**：

1. ✅ **完全动态** - 验证规则可以从配置文件、数据库动态读取
   ```javascript
   // 从数据库读取规则
   const rules = await db.findOne({ entity: 'user' });
   const schema = dsl({ username: `string:${rules.min}-${rules.max}!` });
   ```

2. ✅ **多租户支持** - 每个租户可以有不同的验证规则
   ```javascript
   // 租户A: 用户名3-32字符，租户B: 5-50字符
   const schema = dsl(tenantConfig[tenantId]);
   ```

3. ✅ **前后端共享规则** - 一套规则，两端使用
   ```javascript
   // 后端定义规则，通过 API 传给前端
   res.json({ rules: { username: 'string:3-32!' } });
   ```

**权衡结果**
```
损失：比 Zod 慢 1.9倍
换来：代码量减少 65% + 完全动态性 + 独家功能
结论：对大多数应用（<10万次/秒验证）完全够用
```

---

## 📚 DSL 语法

### 基本类型

```javascript
const schema = dsl({
  name: 'string',       // 字符串
  age: 'number',        // 数字
  count: 'integer',     // 整数
  active: 'boolean',    // 布尔值
  email: 'email',       // 邮箱
  website: 'url',       // URL
  id: 'uuid',           // UUID
  created: 'date'       // 日期
});
```

### 约束条件

```javascript
const schema = dsl({
  // 范围约束
  username: 'string:3-32',    // 长度3-32（最小3，最大32）
  age: 'number:18-120',       // 范围18-120
  
  // 单边约束
  bio: 'string:500',          // 最大长度500（简写）
  bio: 'string:-500',         // 最大长度500（明确写法，与上面等价）
  content: 'string:10-',      // 最小长度10（无最大限制）
  
  // 数组约束
  tags: 'array:1-10',         // 数组长度1-10
  items: 'array:1-',          // 数组最少1个
  options: 'array:-20'        // 数组最多20个
});
```

**语法规则**：
- `type:max` → 最大值（简写，常用）
- `type:min-max` → 范围（最小-最大）
- `type:min-` → 只限制最小值
- `type:-max` → 只限制最大值（与简写等价）

### 必填标记

```javascript
const schema = dsl({
  username: 'string:3-32!',   // 必填
  email: 'email!',            // 必填
  age: 'number:18-120'        // 可选
});
```

### 枚举值

```javascript
const schema = dsl({
  status: 'active|inactive|pending',   // 三选一
  role: 'admin|user|guest'             // 三选一
});
```

### 数组类型

```javascript
const schema = dsl({
  // 基础数组
  tags: 'array<string>',
  scores: 'array<number>',
  
  // 带长度约束
  images: 'array:1-5<url>',           // 1-5个URL
  items: 'array:1-<string>',          // 至少1个
  
  // 元素带约束
  tags: 'array<string:1-20>',         // 每项1-20字符
  scores: 'array:1-5<number:0-100>'   // 1-5个，每个0-100
});
```

**📖 完整语法**: [DSL 语法指南](docs/dsl-syntax.md)

### 嵌套对象

```javascript
const schema = dsl({
  user: {
    name: 'string:1-100!',
    email: 'email!',
    profile: {
      bio: 'string:500',
      website: 'url',
      social: {
        twitter: 'url',
        github: 'url'
      }
    }
  }
});
```

---

## 🆕 String 扩展

字符串可以直接调用方法，无需 `dsl()` 包裹：

```javascript
const schema = dsl({
  // 正则验证
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'pattern': '只能包含字母、数字和下划线' })
    .label('用户名'),
  
  // 自定义验证（优雅方式：只在失败时返回）
  email: 'email!'
    .custom(async (value) => {
      const exists = await checkEmailExists(value);
      if (exists) return '邮箱已被占用';  // 失败时返回错误消息
      // 成功时无需返回
    })
    .label('邮箱'),
  
  // 条件验证 - 使用 dsl.match()
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'string'.pattern(/^\d{11}$/)
  })
});
```

**可用方法**:
- `.pattern(regex, msg)` - 正则验证
- `.label(text)` - 字段标签
- `.messages(obj)` - 自定义消息
- `.description(text)` - 字段描述
- `.custom(fn)` - 自定义验证（支持多种返回方式）
- `.default(value)` - 默认值

**📖 详细文档**: [String 扩展](docs/string-extensions.md)

---

## 🎯 默认验证器

### 用户名验证

```javascript
const schema = dsl({
  // ✨ 简洁写法
  username: 'string!'.username(),              // 自动3-32（默认 medium）
  
  // 自定义长度（多种方式）
  username: 'string!'.username('5-20'),        // 字符串范围
  username: 'string!'.username('short'),       // 短用户名(3-16)
  username: 'string!'.username('medium'),      // 中等(3-32)
  username: 'string!'.username('long'),        // 长用户名(3-64)
});
```

**预设选项**:
- 默认（不传参） - 3-32位
- `'short'` - 3-16位（短用户名）
- `'medium'` - 3-32位（中等，默认值）
- `'long'` - 3-64位（长用户名）
- `'5-20'` - 自定义范围（字符串格式）

### 手机号验证

```javascript
const schema = dsl({
  // ✨ 简洁优雅
  phone: 'string!'.phone('cn'),          // 推荐 ✅
  
  // 自动纠正：即使写成 number 也能自动纠正为 string
  phone: 'number!'.phone('cn'),          // 自动纠正 ✅
});
```

**💡 为什么用 string 不用 number？**
- 手机号可能有前导0
- 国际手机号有 + 号前缀
- 不用于数学计算
- phone() 会自动纠正类型

**支持国家**: `cn`, `us`, `uk`, `hk`, `tw`, `international`

### 密码强度验证

```javascript
const schema = dsl({
  password: 'string!'.password('strong')       // 自动8-64长度
});
```

**强度级别**:
- `weak` - 最少6位
- `medium` - 8位，字母+数字
- `strong` - 8位，大小写+数字
- `veryStrong` - 10位，大小写+数字+特殊字符

### 完整示例

```javascript
// ✨ 极简写法
const registrationSchema = dsl({
  username: 'string!'.username('5-20'),                // 5-20位
  phone: 'string!'.phone('cn').label('手机号'),        // 简洁 ✅
  password: 'string!'.password('strong').label('密码'), // 自动8-64
  email: 'email!'.label('邮箱')
});
```

---

## ✅ 验证功能

### 基础验证

```javascript
const { validate } = require('schema-dsl');

const result = validate(schema, data);

console.log(result.valid);   // true/false
console.log(result.errors);  // 错误列表
console.log(result.data);    // 验证后的数据
```

### 使用 Validator 类（高级用法）

当需要自定义配置（如关闭默认值、启用类型转换）时，使用 `Validator` 类：

```javascript
const { Validator } = require('schema-dsl');

// 1. 创建实例（支持自定义配置）
const validator = new Validator({
  allErrors: true,      // 返回所有错误
  useDefaults: true,    // 应用默认值
  coerceTypes: true     // ✨ 启用类型转换（如字符串转数字）
});

const result = validator.validate(schema, data);
```

**💡 提示**: 对于大多数场景，直接使用 `validate(schema, data)` 即可（它使用默认配置的单例）。

**📖 详细文档**: [validate 方法](docs/validate.md)

### 批量验证

```javascript
const dataArray = [
  { username: 'user1', email: 'user1@example.com' },
  { username: 'user2', email: 'user2@example.com' }
];

const results = validator.validateBatch(schema, dataArray);

console.log(results.performance);  // 性能统计
```

### 编译缓存

```javascript
// 编译一次，重复使用
const validate = validator.compile(schema, 'user-schema');

// 使用缓存
const result = validator.validate(validate, data);
```

---

## � 插件系统

**v2.2.0 新增**：强大的插件机制，轻松扩展 schema-dsl 功能。

### 快速开始

```javascript
const { PluginManager } = require('schema-dsl');

// 1. 创建插件管理器
const pluginManager = new PluginManager();

// 2. 注册插件
const customPlugin = require('./plugins/custom-validator');
pluginManager.register(customPlugin);

// 3. 安装插件
const schema-dsl = require('schema-dsl');
pluginManager.install(schema-dsl);
```

### 内置示例插件

#### 1. custom-validator - 自定义验证器

```javascript
const customValidator = require('schema-dsl/plugins/custom-validator');
pluginManager.register(customValidator);
pluginManager.install(schema-dsl);

// 现在可以使用自定义关键字
const schema = dsl({
  email: { type: 'string', unique: { table: 'users', field: 'email' } },
  password: { type: 'string', passwordStrength: 'strong' },
  idCard: { type: 'string', idCard: true }
});
```

**提供的验证器**：
- `unique` - 异步唯一性验证（数据库检查）
- `passwordStrength` - 密码强度验证（weak/medium/strong）
- `idCard` - 中国身份证号验证（含校验和）

#### 2. custom-format - 自定义格式

```javascript
const customFormat = require('schema-dsl/plugins/custom-format');
pluginManager.register(customFormat);
pluginManager.install(schema-dsl);

// 使用新增的格式
const schema = dsl({
  phone: { type: 'string', format: 'phone-cn' },
  bankCard: { type: 'string', format: 'bank-card' },
  licensePlate: { type: 'string', format: 'license-plate' }
});
```

**提供的格式**：
- `phone-cn` - 中国手机号
- `postal-code-cn` - 中国邮编
- `wechat` - 微信号
- `qq` - QQ号
- `bank-card` - 银行卡号（Luhn算法）
- `license-plate` - 车牌号
- `credit-code` - 统一社会信用代码
- `passport-cn` - 中国护照
- `hk-macao-pass` - 港澳通行证
- `ipv4` - IPv4地址

### 创建自定义插件

```javascript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: '我的自定义插件',

  // 安装函数
  install(schema-dsl, options, context) {
    // 添加自定义功能
    schemaDsl.myMethod = () => { /* ... */ };
  },

  // 卸载函数（可选）
  uninstall(schema-dsl, context) {
    delete schemaDsl.myMethod;
  },

  // 生命周期钩子（可选）
  hooks: {
    onBeforeValidate(schema, data) {
      // 验证前处理
    },
    onAfterValidate(result) {
      // 验证后处理
    }
  }
};

pluginManager.register(myPlugin);
pluginManager.install(schema-dsl, 'my-plugin', { /* 选项 */ });
```

### 生命周期钩子

插件系统提供9个生命周期钩子：
- `onBeforeRegister` - 插件注册前
- `onAfterRegister` - 插件注册后
- `onBeforeValidate` - 验证前
- `onAfterValidate` - 验证后
- `onBeforeExport` - 导出前
- `onAfterExport` - 导出后
- `onBeforeCompile` - 编译前
- `onAfterCompile` - 编译后
- `onError` - 错误处理

### 插件管理

```javascript
// 查看所有插件
pluginManager.list();

// 检查插件是否存在
pluginManager.has('custom-validator');

// 获取插件信息
pluginManager.get('custom-validator');

// 卸载插件
pluginManager.uninstall('custom-validator', schema-dsl);

// 清空所有插件
pluginManager.clear(schema-dsl);
```

**📖 完整文档**: [插件系统指南](docs/plugin-system.md)

---

## �🗄️ 数据库导出

> ⚠️ **重要提示**: 并非所有 schema-dsl 特性都能导出到数据库。条件验证（`dsl.match()`、`dsl.if()`）、自定义验证器等无法导出。详见 [**导出限制说明**](docs/export-limitations.md)。

### MongoDB Schema

```javascript
const { exporters } = require('schema-dsl');

const mongoExporter = new exporters.MongoDBExporter();
const mongoSchema = mongoExporter.export(jsonSchema);

// 生成命令
const command = mongoExporter.generateCommand('users', jsonSchema);
```

### MySQL DDL

```javascript
const mysqlExporter = new exporters.MySQLExporter();
const ddl = mysqlExporter.export('users', jsonSchema);

// 输出:
// CREATE TABLE `users` (
//   `username` VARCHAR(32) NOT NULL,
//   `email` VARCHAR(255) NOT NULL,
//   ...
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### PostgreSQL DDL

```javascript
const pgExporter = new exporters.PostgreSQLExporter();
const ddl = pgExporter.export('users', jsonSchema);

// 输出:
// CREATE TABLE public.users (
//   username VARCHAR(32) NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   ...
// );
```

---

## 🌍 多语言支持

### 内置语言包

默认支持5种语言：
- `zh-CN` - 简体中文
- `en-US` - 英语
- `ja-JP` - 日语
- `es-ES` - 西班牙语
- `fr-FR` - 法语

### 全局配置

```javascript
const { dsl } = require('schema-dsl');

// 配置多语言目录
dsl.config({
  locales: './locales' // 目录路径，包含 zh-CN.js, en-US.js 等
});

// 或者直接传入对象
dsl.config({
  locales: {
    'fr-FR': {
      'required': '{{#label}} est requis',
      'pattern.phone.cn': 'Numéro de téléphone invalide'
    }
  }
});
```

### 切换语言

```javascript
const { Locale } = require('schema-dsl');

Locale.setLocale('zh-CN');  // 中文
Locale.setLocale('en-US');  // 英文
```

**内置语言**: `en-US` (英语), `zh-CN` (中文)

### 添加语言包

```javascript
Locale.addLocale('ja-JP', {
  'minLength': '{{#label}}は{{#limit}}文字以上である必要があります',
  'required': '{{#label}}は必須です'
});
```

### 全局自定义消息

```javascript
Locale.setMessages({
  'format': '格式不正确',
  'required': '这是必填项',
  'minLength': '长度不能少于{{#limit}}个字符'
});
```

### 动态切换与 Label 翻译 (v2.1.0)

支持在验证时动态指定语言，并自动翻译字段标签。

```javascript
// 1. 定义 Schema (使用 Label Key)
const schema = dsl({
  username: 'string!'.label('label.username')
});

// 2. 配置语言包 (包含 Label 翻译)
Locale.addLocale('zh-CN', {
  'label.username': '用户名',
  'required': '{{#label}}不能为空'
});

// 3. 验证时指定语言
validator.validate(schema, data, { locale: 'zh-CN' });
// 错误消息: "用户名不能为空"
```

**📖 详细文档**: [动态多语言配置](docs/dynamic-locale.md)

**📖 详细文档**: [错误处理指南](docs/error-handling.md)

---

## 🔧 错误处理

### label、message、description

```javascript
const schema = dsl({
  email: 'email!'
    .label('邮箱地址')                    // 错误消息中显示
    .description('用于登录和接收通知')    // 表单提示/文档
    .messages({                           // 自定义错误消息
      'required': '{{#label}}不能为空',
      'format': '请输入有效的{{#label}}'
      // 💡 'format' 是 JSON Schema 标准对 email/url/uuid 等格式验证失败的错误关键字
    }),
  
  username: 'string:3-32!'
    .label('用户名')
    .messages({
      'min': '{{#label}}至少{{#limit}}个字符',
      'max': '{{#label}}最多{{#limit}}个字符',
      'pattern': '{{#label}}格式不正确',  // pattern 是正则验证失败的错误关键字
      'required': '{{#label}}不能为空'
    })
});
```

| 属性 | 用途 | 场景 |
|------|------|------|
| **label** | 字段名称 | 错误消息 |
| **messages** | 自定义错误 | 验证失败 |
| **description** | 详细说明 | 表单提示/文档 |

**常见错误关键字**（来自 JSON Schema / ajv）:
- `required` - 必填字段为空
- `min` / `max` - 字符串长度不符
- `minimum` / `maximum` - 数字范围不符
- `format` - 格式验证失败（email、url、uuid、date 等都用这个）
- `pattern` - 正则表达式不匹配
- `enum` - 不在枚举值中
- `type` - 类型不匹配

**💡 简化的错误关键字**:  
schema-dsl 对常见的错误关键字做了简化：
- `min` / `max` 代替 `minLength` / `maxLength` - 更简洁
- 同时也支持完整关键字 `minLength` / `maxLength` - 向后兼容

**💡 为什么 email 用 `format` 而不是 `email`？**  
因为在 JSON Schema 标准中，email、url、uuid 等都是 `format` 属性的不同值，验证失败时统一使用 `format` 作为错误关键字。

**📖 详细说明**: [label vs description](docs/label-vs-description.md)

### 自定义验证器

`.custom()` 方法支持多种优雅的返回方式：

```javascript
const schema = dsl({
  // 方式1: 返回错误消息字符串（推荐，最简洁）
  email: 'email!'
    .custom(async (value) => {
      const exists = await checkEmailExists(value);
      if (exists) return '邮箱已被占用';
      // 验证通过时无需返回
    }),
  
  // 方式2: 返回错误对象（需要自定义错误码）
  username: 'string:3-32!'
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) {
        return { error: 'username.exists', message: '用户名已被占用' };
      }
    }),
  
  // 方式3: 抛出异常
  userId: 'string!'
    .custom(async (value) => {
      const user = await findUser(value);
      if (!user) throw new Error('用户不存在');
    })
});
```

**支持的返回方式**:
- 不返回/返回 `undefined` → 验证通过 ✅
- 返回字符串 → 验证失败，字符串作为错误消息
- 返回 `{ error, message }` → 验证失败，自定义错误码和消息
- 抛出异常 → 验证失败，异常消息作为错误
- 返回 `true` → 验证通过（兼容旧写法）
- 返回 `false` → 验证失败（使用默认消息）

---

## 🧰 工具函数

### Schema 复用

```javascript
const { SchemaUtils } = require('schema-dsl');

// 创建可复用片段
const emailField = SchemaUtils.reusable(() => dsl('email!'));

const schema1 = dsl({ email: emailField() });
const schema2 = dsl({ contactEmail: emailField() });
```

### Schema 合并

```javascript
const baseUser = dsl({ name: 'string!', email: 'email!' });
const withAge = dsl({ age: 'number:18-120' });

const merged = SchemaUtils.merge(baseUser, withAge);
```

### Schema 筛选

```javascript
// 选择字段
const picked = SchemaUtils.pick(schema, ['name', 'email']);

// 排除字段
const omitted = SchemaUtils.omit(schema, ['password', 'secret']);
```

### Schema 导出

```javascript
// 导出为 Markdown
const markdown = SchemaUtils.toMarkdown(schema);

// 导出为 HTML
const html = SchemaUtils.toHTML(schema);
```

**📖 完整API**: [功能索引](docs/FEATURE-INDEX.md)

---

## 📖 完整文档

### 核心文档

- [快速开始](docs/quick-start.md) - 5分钟入门
- [DSL 语法指南](docs/dsl-syntax.md) - 完整语法（2815行）
- [API 参考](docs/api-reference.md) - 所有API
- [功能索引](docs/FEATURE-INDEX.md) - 功能查找

### 专题文档

- [String 扩展](docs/string-extensions.md) - 链式调用
- [validate 方法](docs/validate.md) - 验证详解
- [错误处理指南](docs/error-handling.md) - 多语言/自定义消息
- [label vs description](docs/label-vs-description.md) - 属性区别

### 示例代码

- [examples/string-extensions.js](examples/string-extensions.js) - String扩展
- [examples/dsl-style.js](examples/dsl-style.js) - DSL基础
- [examples/user-registration/](examples/user-registration/) - 注册场景
- [examples/export-demo.js](examples/export-demo.js) - 数据库导出

---

## 🌟 谁在使用？

schema-dsl 适用于以下场景：

- 📱 **RESTful API 验证** - Express、Koa、Fastify 等框架
- 🎨 **前端表单验证** - React、Vue、Angular 项目
- 🏢 **微服务系统** - 多服务间的数据验证
- 🌐 **多租户 SaaS** - 每个租户不同的验证规则
- 🔄 **数据库 Schema 管理** - 自动生成和同步数据库结构
- 🌍 **国际化项目** - 多语言错误消息支持

### 真实案例

```javascript
// Express API 验证
app.post('/api/users', (req, res) => {
  const result = validate(userSchema, req.body);
  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }
  // 处理业务逻辑
});

// 多租户动态规则
const tenantRules = await db.collection('rules').findOne({ 
  tenantId 
});
const schema = dsl({
  username: `string:${tenantRules.usernameMin}-${tenantRules.usernameMax}!`
});

// 自动生成数据库表
const ddl = new MySQLExporter().export('users', schema);
await db.query(ddl);
```

---

## 🧪 测试

```bash
npm test          # 运行测试
npm run coverage  # 测试覆盖率
```

**测试状态**: ✅ 150+ 测试用例全部通过 | 覆盖率 > 90%

---

## 🗺️ 路线图

### v2.4.0（计划中）

- [ ] GraphQL Schema 导出
- [ ] 在线 Playground
- [ ] 性能优化（目标：40 万+ ops/s）
- [ ] 更多数据库支持（SQLite、Oracle）

### 长期规划

- [ ] VSCode 插件（智能提示）
- [ ] 可视化 Schema 编辑器
- [ ] JSON Schema 2020-12 完整支持

**建议和想法？** [提交 Feature Request](https://github.com/vextjs/schema-dsl/issues/new?template=feature_request.md)

---

## 🤝 贡献

我们欢迎所有形式的贡献！

### 如何贡献

- 🐛 [报告 Bug](https://github.com/vextjs/schema-dsl/issues/new?template=bug_report.md)
- ✨ [建议新功能](https://github.com/vextjs/schema-dsl/issues/new?template=feature_request.md)
- 📖 改进文档
- 💻 提交代码

查看 [贡献指南](CONTRIBUTING.md) 了解详情。

### 贡献者

感谢所有为 schema-dsl 做出贡献的开发者！

<a href="https://github.com/vextjs/schema-dsl/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=vextjs/schema-dsl" />
</a>

---

## 📄 许可证

[MIT](LICENSE) © 2025 vextjs

---

## ⭐ Star History

如果 schema-dsl 对你有帮助，请给我们一个 Star ⭐

[![Star History Chart](https://api.star-history.com/svg?repos=vextjs/schema-dsl&type=Date)](https://star-history.com/#vextjs/schema-dsl&Date)

---

## 💬 社区

- 💬 [GitHub Discussions](https://github.com/vextjs/schema-dsl/discussions) - 提问、讨论、分享
- 🐛 [Issue Tracker](https://github.com/vextjs/schema-dsl/issues) - Bug 报告和功能请求
- 📧 [Email](mailto:rockyshi1993@gmail.com) - 联系维护者

---

## 🔗 相关链接

- [npm 包](https://www.npmjs.com/package/schema-dsl)
- [GitHub 仓库](https://github.com/vextjs/schema-dsl)
- [更新日志](./CHANGELOG.md)
- [贡献指南](./CONTRIBUTING.md)
- [安全政策](./.github/SECURITY.md)
- [行为准则](./.github/CODE_OF_CONDUCT.md)

---

<div align="center">

**如果 schema-dsl 帮助到你，请给我们一个 ⭐ Star！**

**你的支持是我们最大的动力！**

Made with ❤️ by [vextjs](https://github.com/vextjs)

</div>


