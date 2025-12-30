<div align="center">

# 🎯 schema-dsl

**最简洁的 JSON Schema 验证库**

一行代码定义验证规则，代码量减少 65%

[![npm version](https://img.shields.io/npm/v/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![npm downloads](https://img.shields.io/npm/dm/schema-dsl.svg?style=flat-square)](https://www.npmjs.com/package/schema-dsl)
[![Build Status](https://github.com/vextjs/schema-dsl/workflows/CI/badge.svg)](https://github.com/vextjs/schema-dsl/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D12.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org)

[快速开始](#-快速开始) · [完整文档](./docs/INDEX.md) · [示例代码](./examples) · [更新日志](./CHANGELOG.md)

</div>

---

## 💡 为什么选择 schema-dsl？

### 对比其他库，代码量减少 65%

<table>
<tr>
<td width="50%">

**schema-dsl** - 简洁优雅 ✨
```javascript
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});
```
**3 行代码**

</td>
<td width="50%">

**其他库** - 冗长繁琐
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
**8 行代码**

</td>
</tr>
</table>

### 核心优势

| 特性 | schema-dsl | Joi/Yup | Zod | Ajv |
|------|-----------|---------|-----|-----|
| **简洁度** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **性能** | 27万次/秒 | 9万次/秒 | 52万次/秒 | 200万次/秒 |
| **学习成本** | 5分钟 | 30分钟 | 15分钟 | 20分钟 |
| **数据库导出** | ✅ | ❌ | ❌ | ❌ |
| **多语言支持** | ✅ 完整 | ⚠️ 部分 | ⚠️ 部分 | ⚠️ 部分 |
| **文档生成** | ✅ | ❌ | ❌ | ❌ |

---

## 📦 安装

```bash
npm install schema-dsl
```

---

## 🚀 快速开始

### 基础用法 - 3 秒上手

```javascript
const { dsl, validate } = require('schema-dsl');

// 定义 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  tags: 'array<string>'
});

// 验证数据
const result = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
  tags: ['admin', 'verified']
});

console.log(result.valid);    // true
console.log(result.data);     // 验证后的数据
```

### Express 集成 - 自动错误处理

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
    // 验证通过返回数据，失败自动抛出 ValidationError
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
    return res.status(400).json({
      success: false,
      errors: error.errors
    });
  }
  next(error);
});
```

### Schema 复用 - 灵活组合

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
  createdAt: 'string!',
  updatedAt: 'string!'
});

// POST /api/users - 创建用户（排除自动生成字段）
const createSchema = SchemaUtils.omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

// GET /api/users/:id - 查询用户（隐藏敏感字段）
const publicSchema = SchemaUtils.omit(fullUserSchema, ['password']);

// PATCH /api/users/:id - 更新用户（部分字段可选）
const updateSchema = SchemaUtils
  .pick(fullUserSchema, ['username', 'email', 'age'])
  .partial();

// POST /api/register - 注册（扩展验证码字段）
const registerSchema = SchemaUtils
  .pick(fullUserSchema, ['username', 'email', 'password'])
  .extend({ 
    captcha: 'string:4-6!',
    agree: 'boolean!'
  });
```

---

## 📖 DSL 语法速查

### 基础类型

```javascript
dsl({
  // 字符串
  name: 'string!',              // 必填字符串
  bio: 'string:10-500',         // 长度 10-500
  
  // 数字
  age: 'number!',               // 必填数字
  price: 'number:0-9999.99',    // 范围 0-9999.99
  score: 'integer:0-100',       // 整数 0-100
  
  // 布尔值
  active: 'boolean!',
  
  // 枚举
  role: 'admin|user|guest',     // 只能是这三个值之一
  
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
  bio: 'string:10-500'.description('用户简介，10-500字符'),
  
  // 条件验证
  discount: 'number'.when('vip', {
    is: true,
    then: 'number:10-50!',  // VIP 用户折扣必填
    otherwise: 'number'      // 普通用户可选
  })
})
```

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
const { dsl, Locale } = require('schema-dsl');

// 配置语言包
dsl.config({
  i18n: {
    locales: {
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
  }
});

// 使用 Label Key
const schema = dsl({
  username: 'string:3-32!'.label('label.username'),
  email: 'email!'.label('label.email')
});

// 验证时指定语言
const result1 = validate(schema, data, { locale: 'zh-CN' });
// 错误消息：用户名长度不能少于3个字符

const result2 = validate(schema, data, { locale: 'en-US' });
// 错误消息：Username must be at least 3 characters

// 从文件加载语言包
dsl.config({
  i18n: {
    localesPath: './i18n'  // 自动加载 ./i18n/*.js 或 *.json
  }
});
```

### 5. 插件系统

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

### 6. 错误处理

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

## 🎯 适用场景

### ✅ 特别适合

- 🚀 **快速开发** - API 开发、表单验证，追求开发效率
- 🌍 **国际化项目** - 需要完整的多语言错误消息支持
- 🗄️ **全栈开发** - 需要从 Schema 自动生成数据库表结构
- 📋 **配置驱动** - 验证规则需要从配置文件或数据库动态读取
- 🏢 **中小型项目** - Node.js + Express/Koa/Egg.js 后端项目

### 💡 使用场景示例

**RESTful API 开发**
```javascript
// 统一的验证中间件
const validateMiddleware = (schema) => {
  return async (req, res, next) => {
    try {
      req.body = await validateAsync(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

app.post('/api/users', 
  validateMiddleware(createUserSchema), 
  userController.create
);
```

**表单验证**
```javascript
// 前端也可以使用（支持浏览器）
const formSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!',
  confirmPassword: 'string!'
});

const result = validate(formSchema, formData);
if (!result.valid) {
  // 显示错误消息
  showErrors(result.errors);
}
```

**动态配置验证**
```javascript
// 从数据库读取验证规则
const rules = await db.validationRules.find({ formId: 'user-register' });

// 动态构建 Schema
const dynamicSchema = dsl(
  rules.reduce((schema, rule) => {
    schema[rule.field] = rule.dsl;
    return schema;
  }, {})
);
```

---

## ⚡ 性能对比

**测试环境**: Node.js 18, 10,000 次验证

| 库名 | 速度 (ops/sec) | 相对速度 |
|------|---------------|---------|
| Ajv | 2,000,000 | 🥇 最快 |
| Zod | 526,316 | 🥈 很快 |
| **schema-dsl** | **277,778** | 🥉 **快** |
| Joi | 97,087 | 中等 |
| Yup | 60,241 | 较慢 |

**结论**:
- ✅ 比 Joi 快 **2.86倍**
- ✅ 比 Yup 快 **4.61倍**  
- ✅ 对 99% 的应用场景足够快（27万+次/秒）
- ⚠️ 如果需要极致性能（100万+次/秒），推荐使用 Ajv

---

## 🆚 与其他库对比

### 选择建议

| 项目需求 | 推荐方案 | 原因 |
|---------|---------|------|
| 快速开发，减少代码量 | **schema-dsl** | 代码量最少，学习成本最低 |
| TypeScript 强类型推断 | Zod | 最佳的 TypeScript 支持 |
| 极致性能要求 | Ajv | 性能最强 |
| 企业级成熟方案 | Joi | 社区最大，经过大规模验证 |
| 多语言 + 数据库导出 | **schema-dsl** | 独家功能 |

### 详细对比

<table>
<tr>
<th>特性</th>
<th>schema-dsl</th>
<th>Joi</th>
<th>Yup</th>
<th>Zod</th>
<th>Ajv</th>
</tr>
<tr>
<td><strong>语法简洁度</strong></td>
<td>⭐⭐⭐⭐⭐<br>一行代码</td>
<td>⭐⭐<br>链式调用冗长</td>
<td>⭐⭐<br>链式调用冗长</td>
<td>⭐⭐⭐<br>相对简洁</td>
<td>⭐⭐<br>JSON 配置繁琐</td>
</tr>
<tr>
<td><strong>学习成本</strong></td>
<td>⭐⭐⭐⭐⭐<br>5分钟</td>
<td>⭐⭐⭐<br>30分钟</td>
<td>⭐⭐⭐<br>30分钟</td>
<td>⭐⭐⭐⭐<br>15分钟</td>
<td>⭐⭐⭐<br>20分钟</td>
</tr>
<tr>
<td><strong>性能</strong></td>
<td>⭐⭐⭐⭐<br>27万/秒</td>
<td>⭐⭐<br>9万/秒</td>
<td>⭐⭐<br>6万/秒</td>
<td>⭐⭐⭐⭐<br>52万/秒</td>
<td>⭐⭐⭐⭐⭐<br>200万/秒</td>
</tr>
<tr>
<td><strong>TypeScript 支持</strong></td>
<td>⭐⭐⭐<br>.d.ts 类型定义</td>
<td>⭐⭐⭐<br>.d.ts 类型定义</td>
<td>⭐⭐⭐<br>.d.ts 类型定义</td>
<td>⭐⭐⭐⭐⭐<br>完美类型推断</td>
<td>⭐⭐<br>基础支持</td>
</tr>
<tr>
<td><strong>数据库导出</strong></td>
<td>✅ MongoDB<br>✅ MySQL<br>✅ PostgreSQL</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><strong>多语言支持</strong></td>
<td>✅ 完整支持<br>可自定义语言包</td>
<td>⚠️ 基础支持</td>
<td>⚠️ 基础支持</td>
<td>⚠️ 基础支持</td>
<td>⚠️ 基础支持</td>
</tr>
<tr>
<td><strong>文档生成</strong></td>
<td>✅ Markdown<br>✅ HTML</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
<td>❌</td>
</tr>
<tr>
<td><strong>社区规模</strong></td>
<td>⭐⭐⭐<br>成长中</td>
<td>⭐⭐⭐⭐⭐<br>最大</td>
<td>⭐⭐⭐⭐<br>很大</td>
<td>⭐⭐⭐⭐<br>快速增长</td>
<td>⭐⭐⭐⭐<br>成熟</td>
</tr>
</table>

---

## 📚 完整文档

### 核心文档
- [快速开始](./docs/quick-start.md) - 5分钟上手指南
- [DSL 语法完整参考](./docs/dsl-syntax.md) - 所有语法详解
- [API 文档](./docs/api-reference.md) - 完整 API 说明

### 功能指南
- [String 扩展方法](./docs/string-extensions.md) - 链式调用详解
- [Schema 复用](./docs/schema-reuse.md) - omit/pick/extend/partial
- [异步验证](./docs/validate-async.md) - validateAsync 使用指南
- [错误处理](./docs/error-handling.md) - ValidationError 详解
- [多语言支持](./docs/i18n.md) - 国际化配置指南
- [插件开发](./docs/plugin-development.md) - 自定义插件教程

### 导出功能
- [MongoDB 导出](./docs/exporters/mongodb.md)
- [MySQL 导出](./docs/exporters/mysql.md)
- [PostgreSQL 导出](./docs/exporters/postgresql.md)
- [Markdown 导出](./docs/exporters/markdown.md)

### 集成示例
- [Express 集成](./examples/express-integration.js)
- [Koa 集成](./examples/koa-integration.js)
- [Egg.js 集成](./examples/eggjs-integration.js)

---

## 💻 示例代码

项目包含 30+ 完整示例，涵盖所有功能：

```bash
# 查看所有示例
ls examples/

# 运行基础示例
node examples/basic-usage.js

# 运行数据库导出示例
node examples/database-export.js

# 运行 Express 集成示例
node examples/express-integration.js
```

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

- [npm 包](https://www.npmjs.com/package/schema-dsl)
- [GitHub 仓库](https://github.com/vextjs/schema-dsl)
- [问题反馈](https://github.com/vextjs/schema-dsl/issues)
- [更新日志](./CHANGELOG.md)
- [贡献指南](./CONTRIBUTING.md)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by schema-dsl team

</div>

