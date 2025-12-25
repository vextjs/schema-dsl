# SchemaIO

> **简洁 + 强大 = 完美平衡**  
> v2.0.1 新特性：字符串直接链式调用，无需 `dsl()` 包裹！

基于统一DSL Pattern的JSON Schema验证库，支持字符串链式调用和数据库Schema导出。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg)](https://nodejs.org)
[![Version](https://img.shields.io/badge/version-2.0.1-blue.svg)](https://github.com/yourname/schemaio)

## ✨ 核心特性

- ✨ **String扩展（v2.0.1）**: 字符串直接链式调用，语法更简洁
- 🎯 **DSL语法**: 简洁的DSL定义Schema，一行搞定基础验证
- ✅ **标准验证**: 基于JSON Schema Draft 7，使用ajv验证器
- 🗄️ **数据库导出**: 导出MongoDB、MySQL、PostgreSQL Schema
- 🔧 **自定义验证**: 支持正则、自定义函数、异步验证
- 🚀 **高性能**: 性能开销<5%，100%向后兼容
- 📦 **轻量级**: 核心代码精简，无冗余依赖

## 🆕 v2.0.1 新特性

### String 扩展 - 字符串直接链式调用

```javascript
const { dsl } = require('schemaio');

// ✨ v2.0.1：字符串直接链式调用
const schema = dsl({
  email: 'email!'
    .pattern(/custom/)
    .messages({ 'pattern': '格式不正确' })
    .label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  
  // 简单字段仍然可以用纯DSL
  age: 'number:18-120',
  role: 'user|admin'
});
```

**核心优势**:
- ✅ 减少 `dsl()` 包裹，代码更简洁
- ✅ 字符串直接调用方法，更直观自然
- ✅ 支持所有DslBuilder方法
- ✅ 100%向后兼容

## 📦 安装

```bash
npm install schemaio
```

## 🚀 快速开始（5分钟）

### 基础用法（推荐）

```javascript
const { dsl, validate } = require('schemaio');

// 定义Schema
const userSchema = dsl({
  username: 'string:3-32!',      // 必填字符串，长度3-32
  email: 'email!',                // 必填邮箱
  age: 'number:18-120'            // 可选数字，范围18-120
});

// 验证数据（使用便捷方法，无需new）
const result = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25
});

console.log(result.valid); // true
```

### 完整用法（需要自定义配置时）

```javascript
const { dsl, Validator } = require('schemaio');

// 创建自定义Validator
const validator = new Validator({
  allErrors: true,  // 返回所有错误
  verbose: true     // 详细错误信息
});

const schema = dsl({ email: 'email!' });
const result = validator.validate(schema, { email: 'test@example.com' });
```

### String 扩展高级用法

```javascript
const schema = dsl({
  // 正则验证 + 自定义消息
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': '只能包含字母、数字和下划线'
    })
    .label('用户名'),
  
  // 邮箱验证 + 标签
  email: 'email!'.label('邮箱地址'),
  
  // 密码复杂度
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码'),
  
  // 枚举 + 默认值
  language: 'en|zh|ja'.default('zh')
});
```

## 📚 DSL 语法速查

### 基本类型

```javascript
'string'      // 字符串
'number'      // 数字
'integer'     // 整数
'boolean'     // 布尔值
'email'       // 邮箱
'url'         // URL
'date'        // 日期
```

### 约束条件

```javascript
'string:3-32'         // 字符串长度 3-32
'number:0-100'        // 数字范围 0-100
'string:100'          // 字符串最大长度 100
```

### 必填标记

```javascript
'string:3-32!'        // 必填字符串
'email!'              // 必填邮箱
```

### 格式类型

```javascript
'email'               // 邮箱格式
'url'                 // URL格式
'uuid'                // UUID格式
'date'                // 日期格式
```

### 枚举值

```javascript
'active|inactive|pending'   // 枚举值
```

### 数组类型

```javascript
'array<string>'             // 字符串数组
'array<string:1-20>'        // 字符串数组，每项长度1-20
'array<number:0-100>'       // 数字数组，范围0-100
```

### 嵌套对象

```javascript
const schema = dsl({
  user: {
    name: 'string:1-100!',
    profile: {
      bio: 'string:500',
      website: 'url'
    }
  }
});
```

## 🗄️ 数据库导出

### MongoDB Schema

```javascript
const { exporters } = require('schemoio');

const mongoExporter = new exporters.MongoDBExporter();
const mongoSchema = mongoExporter.export(jsonSchema);

// 生成 createCollection 命令
const command = mongoExporter.generateCommand('users', jsonSchema);
console.log(command);
```

### MySQL DDL

```javascript
const { exporters } = require('schemoio');

const mysqlExporter = new exporters.MySQLExporter();
const ddl = mysqlExporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE `users` (
//   `username` VARCHAR(32) NOT NULL,
//   `email` VARCHAR(255) NOT NULL,
//   ...
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### PostgreSQL DDL

```javascript
const { exporters } = require('schemoio');

const pgExporter = new exporters.PostgreSQLExporter();
const ddl = pgExporter.export('users', jsonSchema);

console.log(ddl);
// CREATE TABLE public.users (
//   username VARCHAR(32) NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   ...
// );
```

## 🔧 自定义验证

### 自定义关键字

```javascript
const { Validator, CustomKeywords } = require('schemoio');

const validator = new Validator();

// 注册自定义关键字
CustomKeywords.registerAll(validator.getAjv());

// 使用自定义验证
const schema = {
  type: 'string',
  regex: '^[a-z]+$'  // 自定义正则验证
};
```

### 函数验证

```javascript
const schema = {
  type: 'number',
  validate: (value) => value % 2 === 0  // 验证偶数
};
```

## 📖 文档

### 快速开始
- **[🚀 5分钟快速上手](docs/quick-start.md)** - 新手入门（推荐）
- **[📚 完整API参考](docs/api-reference.md)** - 所有API详细说明

### 核心功能
- **[✨ String扩展文档](docs/string-extensions.md)** - v2.0.1新特性
- **[📝 DSL语法指南](docs/dsl-syntax.md)** - DSL完整语法（2815行）
- **[🔧 错误处理](docs/error-handling.md)** - 错误消息定制

### 示例代码
- **[String扩展示例](examples/string-extensions.js)** - 完整String扩展示例
- **[DSL风格示例](examples/dsl-style.js)** - DSL基础示例
- **[用户注册示例](examples/user-registration/)** - 真实业务场景
- **[数据库导出示例](examples/export-demo.js)** - 导出MongoDB/MySQL/PostgreSQL

运行示例：

```bash
node examples/string-extensions.js
node examples/dsl-style.js
```

## 🎯 核心优势

### 1. 简洁的DSL语法

```javascript
// ✅ SchemaIO - 一行搞定
username: 'string:3-32!'

// ❌ 其他库 - 冗长繁琐
username: Joi.string().min(3).max(32).required()
```

### 2. String扩展（v2.0.1）

```javascript
// ✨ 字符串直接链式调用
email: 'email!'.pattern(/custom/).label('邮箱')

// 减少5个字符，更直观自然
```

### 3. 渐进式增强

```javascript
// 简单字段：纯DSL
age: 'number:18-120'

// 复杂字段：String扩展
email: 'email!'.pattern(/custom/).messages({...})

// 完美平衡：80%用DSL，20%用扩展
```

## 🏗️ 架构设计

SchemaIO v2.0.1 采用统一DSL Pattern：

```
┌─────────────────────────────────────────┐
│         用户API层（统一DSL）              │
├─────────────────────────────────────────┤
│  dsl() 函数  │  DslBuilder类  │  String扩展  │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│            核心层（统一表示）             │
├─────────────────────────────────────────┤
│           JSON Schema Core              │
│  (标准JSON Schema Draft 7作为内部表示)   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         验证层 + 导出层（功能实现）        │
├─────────────────────────────────────────┤
│  ajv验证器  │  MongoDB  │  MySQL  │  PostgreSQL  │
└─────────────────────────────────────────┘
```

## 🧪 测试

```bash
# 运行测试
npm test

# 运行示例
node examples/string-extensions.js
```

**测试结果**: 86 passing (146ms) ✅

## 🗺️ 版本历史

### v2.0.1（2025-12-25）✨

- ✨ **String扩展**: 字符串直接链式调用
- 🎯 **统一API**: 移除Joi风格，统一为DSL Pattern
- 📦 **代码精简**: 核心文件减少40%
- 📚 **文档完整**: 3815行核心文档
- ✅ **测试通过**: 86个测试100%通过

### v1.0.0（2024）

- ✅ JSON Schema核心类
- ✅ ajv验证器集成
- ✅ Joi风格适配器（已废弃）
- ✅ DSL风格适配器
- ✅ MongoDB/MySQL/PostgreSQL导出器

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详情。

## 📄 许可证

[MIT](LICENSE)

## 🔗 相关链接

- [GitHub](https://github.com/yourname/schemaio)
- [NPM](https://www.npmjs.com/package/schemaio)
- [文档](https://github.com/yourname/schemaio/tree/main/docs)
- [问题反馈](https://github.com/yourname/schemaio/issues)

---

**SchemaIO v2.0.1** - 简洁 + 强大 = 完美平衡 🎉

