# schema-dsl 快速上手

> **阅读时间**: 5分钟  
> **目标**: 快速掌握 schema-dsl 核心用法  

---

## 📑 目录

### 入门指南
- [🚀 安装](#-安装)
- [📖 5分钟快速入门](#-5分钟快速入门)
  - [1. Hello World（30秒）](#1-hello-world30秒)
  - [2. DSL 语法速查（1分钟）](#2-dsl-语法速查1分钟)
  - [3. 链式字段（2分钟）](#3-链式字段2分钟)
  - [4. 完整示例（2分钟）](#4-完整示例2分钟)

### 进阶功能
- [🔧 自定义验证](#自定义验证)
- [🗄️ 数据库导出](#database-export)
- [📚 下一步](#-下一步)

---

<a id="-安装"></a>

## 🚀 安装

```bash
npm install schema-dsl
```

> **Node.js 要求**：`>=18.0.0`
> 
> 当前 TypeScript 重构版以 `Node.js >=18.0.0` 为唯一运行时基线，不再承诺旧 Node 版本兼容。

---

<a id="-5分钟快速入门"></a>

## 📖 5分钟快速入门

### 1. Hello World（30秒）

```javascript
const { dsl, validate } = require('schema-dsl');

// 定义Schema
const schema = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

// 验证数据（使用便捷函数）
const result = validate(schema, {
  name: '张三',
  email: 'zhangsan@example.com'
});

console.log(result.valid); // true
```

**解释**:
- `'string:1-50!'` - 必填字符串，长度1-50
- `'email!'` - 必填邮箱
- `!` 表示必填

---

### 2. DSL 语法速查（1分钟）

```javascript
// 基本类型
'string'           // 字符串
'number'           // 数字
'integer'          // 整数
'boolean'          // 布尔值
'email'            // 邮箱
'url'              // URL
'date'             // 日期

// 约束
'string:3-32'      // 长度3-32（范围）
'string:100'       // 最大长度100（简写）
'string:-100'      // 最大长度100（明确写法）
'string:10-'       // 最小长度10（无最大限制）
'number:18-120'    // 范围18-120

// 必填
'string!'          // 必填字符串
'email!'           // 必填邮箱

// 枚举
'active|inactive|pending'    // 三选一

// 数组
'array<string>'              // 字符串数组
'array:1-10<string>'         // 1-10个字符串
'array<string:1-50>'         // 带约束的数组元素
```

**语法规则**:
- `type:max` → 最大值（简写）
- `type:min-max` → 范围
- `type:min-` → 只限最小
- `type:-max` → 只限最大

---

### 3. 链式字段（2分钟）

JavaScript 中导入 `schema-dsl` 后，字符串字面量默认可以直接调用 `.label()` / `.pattern()`。如果你不想保留全局 String 扩展，可以调用 `uninstallStringExtensions()` 后改用 `dsl()` 包裹，详见 [String 扩展文档](./string-extensions.md)。

```javascript
const schema = dsl({
  // 默认：直接字符串链式调用
  email: 'email!'
    .pattern(/custom/)
    .label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': '只能包含字母、数字和下划线'
    })
    .label('用户名'),
  
  // 简单字段仍然可以用纯DSL
  age: 'number:18-120',
  role: 'user|admin'
});
```

**可用方法**:
- `.pattern(regex)` - 正则验证
- `.label(text)` - 字段标签
- `.messages(obj)` - 自定义消息
- `.description(text)` - 描述
- `.custom(fn)` - 自定义验证器

---

### 4. 完整示例（2分钟）

```javascript
const { dsl, validate } = require('schema-dsl');

// 定义用户注册Schema
const registerSchema = dsl({
  // 用户名：正则验证
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({
      pattern: '只能包含字母、数字和下划线'
    }),
  
  // 邮箱：标签
  email: dsl('email!').label('邮箱地址'),
  
  // 密码：复杂正则
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .error({
      pattern: '必须包含大小写字母和数字'
    }),
  
  // 简单字段
  age: 'number:18-120',
  role: 'user|admin'
});

// 验证数据
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user'
};

const result = validate(registerSchema, testData);

if (result.valid) {
  console.log('✅ 验证通过！');
} else {
  console.log('❌ 验证失败:', result.errors);
}
```

---

## 💡 最佳实践

### 1. 简单字段用纯DSL

```javascript
const schema = dsl({
  name: 'string:1-50!',     // ✅ 简洁
  age: 'number:18-120',     // ✅ 清晰
  role: 'user|admin'        // ✅ 直观
});
```

### 2. 复杂字段用 dsl() 链式 API

```javascript
const schema = dsl({
  email: dsl('email!')
    .pattern(/custom/)
    .messages({...})
    .label('邮箱'),
  
  username: dsl('string:3-32!')
    .pattern(/^\w+$/)
    .custom(checkExists)
});
```

### 3. 80/20 法则

**JavaScript 中 80% 字段用纯 DSL，20% 复杂字段可直接字符串链式调用；TypeScript 中为了类型提示，复杂字段优先用 `dsl()` 包裹。**

---

## 🎯 常见场景

### 表单验证

```javascript
const formSchema = dsl({
  email: dsl('email!').label('邮箱地址'),
  password: dsl('string:8-64!').label('密码'),
  nickname: dsl('string:2-20').label('昵称'),
  bio: 'string:500',
  website: 'url',
  age: 'number:18-120',
  gender: 'male|female|other'
});
```

### 自定义验证

> `.custom()` 支持同步函数；如果返回 `Promise`，请使用 `validateAsync()`。同步 `validate()` 遇到 Promise-returning custom validator 会返回明确错误。

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      if (value === 'admin') {
        return '用户名已存在';
      }
    })
});
```

### 嵌套对象

```javascript
const schema = dsl({
  user: {
    profile: {
      name: dsl('string:1-50!').label('姓名'),
      avatar: dsl('url').label('头像'),
      social: {
        twitter: dsl('url').pattern(/twitter\.com/),
        github: dsl('url').pattern(/github\.com/)
      }
    }
  }
});
```

---

<a id="-下一步"></a>

## 📚 下一步

### 深入学习

- [DSL 语法完整指南](./dsl-syntax.md)
- [API 参考文档](./api-reference.md)
- [String 扩展文档](./string-extensions.md)

### 示例代码

- [Quick Start 完整示例](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts)

其余主题示例现在都已分别挂到各自文档底部，并统一切到稳定 GitHub 示例链接。

<a id="database-export"></a>

### 高级功能

- [自定义验证器](./api-reference.md#customvalidator)
- [条件验证](./conditional-api.md)
- [数据库Schema导出](./api-reference.md#导出器)

---

## 🎯 设计理念与性能

### 为什么选择运行时解析？

Schema-DSL 使用**运行时解析 DSL**，而非编译时构建（如 Zod），这是有意的设计选择：

#### ✅ 运行时解析的优势

1. **完全动态** - 验证规则可以从配置文件、数据库动态加载
   ```javascript
   // 从配置读取规则
   const rules = await db.findOne({ entity: 'user' });
   const schema = dsl({
     username: `string:${rules.min}-${rules.max}!`
   });
   ```

2. **多租户支持** - 每个租户可以有不同的验证规则
   ```javascript
   // 租户A: 用户名3-32字符
   // 租户B: 用户名5-50字符
   function getTenantSchema(tenantId) {
     const rules = tenantConfig[tenantId];
     return dsl({
       username: `string:${rules.min}-${rules.max}!`
     });
   }
   ```

3. **可序列化** - DSL 字符串可以存储、传输、共享
   ```javascript
   // 存储到数据库
   await db.insert({ 
     formId: 'register', 
     rules: { username: 'string:3-32!', email: 'email!' }
   });
   
   // 通过 API 传输
   res.json({ validationRules: rules });
   
   // 前后端共享规则
   ```

4. **低代码基础** - 支持可视化表单构建器
   ```javascript
   // 管理员在界面配置验证规则
   const formBuilder = {
     fields: [
       { name: 'username', validation: 'string:3-32!' }
     ]
   };
   ```

#### ⚠️ 性能权衡

S1 有效数据与 Zod 持平，S3 嵌套场景快约 28%，无效数据公平对比快 89x：

| 库名 | 性能 | 场景 |
|------|-----------|------|
| Ajv (raw) | 4.732M ops/s | 底层引擎，无 DSL 层 |
| **Schema-DSL** | **1.301M ops/s**（S1有效） | 全功能（DSL + i18n + coerce）|
| **Schema-DSL** | **1.205M ops/s**（S2 无效，均无 i18n）| 公平对比（均无 i18n）|
| Zod | 1.305M ops/s（S1有效）/ 13.49K（S2 无效）| 编译时构建，错误路径异常驱动 |
| Joi | 154K ops/s | 功能丰富 |

**结论**:
- ✅ S3 嵌套有效场景比 Zod 快 **28%**；S1 简单有效场景持平（差 <1%）
- ✅ 无效数据公平对比（均无 i18n）比 Zod 快 **89x**
- ✅ 内置缓存，热路径零解析开销

### 适用场景

**✅ 选择 Schema-DSL**:
- 需要动态验证规则（配置驱动、多租户）
- 需要数据库 Schema 导出
- 快速开发原型
- 多语言 SaaS 系统

**⚠️ 考虑其他库**:
- TypeScript 项目需要强类型推断 → **Zod**
- 性能是第一优先级 → **Ajv** 或 **Zod**
- 静态验证规则 → **Zod**

---

## 🆘 常见问题

### Q: String扩展和纯DSL有什么区别？

**A**: 
- **纯DSL**: 适合简单字段，语法简洁
- **`dsl()` 链式 API**: 适合复杂验证，不修改全局原型
- **String 扩展**: 适合想直接对字符串字面量链式调用的 JavaScript 项目，root entry 默认可用

```javascript
// 纯DSL（简单）
name: 'string:1-50!'

// dsl() 链式 API（复杂，推荐）
email: dsl('email!')
  .pattern(/custom/)
  .messages({...})

// String 扩展（导入 schema-dsl 后默认可用）
const { dsl } = require('schema-dsl');
const schemaWithStringExtension = dsl({
  email: 'email!'.pattern(/custom/).messages({...})
});
```

### Q: 如何启用或卸载 String 扩展？

**A**: 
```javascript
const { installStringExtensions, uninstallStringExtensions } = require('schema-dsl');
uninstallStringExtensions(); // 主动禁用
installStringExtensions();   // 重新启用
```

### Q: 支持TypeScript吗？

**A**: 支持！schema-dsl 提供完整的 TypeScript 类型定义。

---

## 🎉 恭喜！

你已经掌握了 schema-dsl 的核心用法！

**核心要点**:
1. ✅ DSL语法简洁直观
2. ✅ `dsl()` 链式 API 强大灵活
3. ✅ 80%用纯DSL，20%复杂字段用链式 API
4. ✅ JavaScript 可直接字符串链式；TypeScript 复杂字段优先用 `dsl()` 包裹

**开始使用**: `npm install schema-dsl`

---

## 对应示例文件

**示例入口**: [quick-start.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/quick-start.ts)  
**说明**: 覆盖快速上手中的 Hello World、String 扩展、用户注册示例，以及 `validate()` 与 `Validator.compile()` 的基础复用路径，可直接运行参考。

---

**最后更新**: 2026-06-10


