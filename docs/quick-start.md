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
  - [3. String 扩展（2分钟）](#3-string-扩展2分钟)
  - [4. 完整示例（2分钟）](#4-完整示例2分钟)

### 进阶功能
- [🔧 自定义验证](#-自定义验证)
- [🗄️ 数据库导出](#️-数据库导出)
- [📚 下一步](#-下一步)

---

## 🚀 安装

```bash
npm install schema-dsl
```

---

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

### 3. String 扩展（2分钟）

字符串支持链式调用：

```javascript
const schema = dsl({
  // 字符串直接链式调用，无需 dsl() 包裹
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
const { dsl, Validator } = require('schema-dsl');

// 定义用户注册Schema
const registerSchema = dsl({
  // 用户名：正则验证
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '只能包含字母、数字和下划线',
      'min': '至少3个字符',
      'max': '最多32个字符'
    }),
  
  // 邮箱：标签
  email: 'email!'.label('邮箱地址'),
  
  // 密码：复杂正则
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'pattern': '必须包含大小写字母和数字'
    }),
  
  // 简单字段
  age: 'number:18-120',
  gender: 'male|female|other'
});

// 验证数据
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  gender: 'male'
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

### 2. 复杂字段用String扩展

```javascript
const schema = dsl({
  email: 'email!'
    .pattern(/custom/)
    .messages({...})
    .label('邮箱'),
  
  username: 'string:3-32!'
    .pattern(/^\w+$/)
    .custom(checkExists)
});
```

### 3. 80/20 法则

**80%字段用纯DSL，20%字段用String扩展**

---

## 🎯 常见场景

### 表单验证

```javascript
const formSchema = dsl({
  email: 'email!'.label('邮箱地址'),
  password: 'string:8-64!'.label('密码'),
  nickname: 'string:2-20'.label('昵称'),
  bio: 'string:500',
  website: 'url',
  age: 'number:18-120',
  gender: 'male|female|other'
});
```

### 自定义验证

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) {
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
      name: 'string:1-50!'.label('姓名'),
      avatar: 'url'.label('头像'),
      social: {
        twitter: 'url'.pattern(/twitter\.com/),
        github: 'url'.pattern(/github\.com/)
      }
    }
  }
});
```

---

## 📚 下一步

### 深入学习

- [DSL 语法完整指南](./dsl-syntax.md)
- [API 参考文档](./api-reference.md)
- [String 扩展文档](./string-extensions.md)

### 示例代码

- [String扩展完整示例](../examples/string-extensions.js)
- [用户注册示例](../examples/user-registration/)
- [数据库导出示例](../examples/export-demo.js)

### 高级功能

- [自定义验证器](./api-reference.md#custom)
- [条件验证（when）](./api-reference.md#when)
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

运行时解析的代价是性能略低于编译时构建：

| 库名 | 每秒操作数 | 说明 |
|------|-----------|------|
| Ajv | 2,000,000 ops/s | 原生 JSON Schema（最快） |
| Zod | 526,316 ops/s | 编译时构建 |
| **Schema-DSL** | **277,778 ops/s** | 运行时解析（第3名） |
| Joi | 97,087 ops/s | 功能丰富 |
| Yup | 60,241 ops/s | React 生态 |

**结论**:
- ✅ Schema-DSL 比 Joi 快 **2.86倍**，比 Yup 快 **4.61倍**
- ✅ 对大多数应用足够（27万+ ops/s）
- ⚠️ 如需极致性能（>50万 ops/s），推荐使用 Zod 或 Ajv

**权衡**:
```
损失: 比 Zod 慢 1.9倍
换来: 
  ✅ 代码量减少 65%
  ✅ 完全动态的验证规则
  ✅ 多租户/配置驱动支持
  ✅ 前后端共享规则
  ✅ 低代码平台基础
```

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
- **String扩展**: 适合复杂验证，支持链式调用

```javascript
// 纯DSL（简单）
name: 'string:1-50!'

// String扩展（复杂）
email: 'email!'
  .pattern(/custom/)
  .messages({...})
```

### Q: 如何禁用String扩展？

**A**: 
```javascript
const { uninstallStringExtensions } = require('schema-dsl');
uninstallStringExtensions();
```

### Q: 支持TypeScript吗？

**A**: 支持！SchemaIO提供完整的TypeScript类型定义。

---

## 🎉 恭喜！

你已经掌握了SchemaIO的核心用法！

**核心要点**:
1. ✅ DSL语法简洁直观
2. ✅ String扩展强大灵活
3. ✅ 80%用DSL，20%用扩展
4. ✅ 字符串可以直接链式调用

**开始使用**: `npm install schema-dsl`

---

---

**最后更新**: 2025-12-26
- [🔧 自定义验证](#-自定义验证)
- [🗄️ 数据库导出](#️-数据库导出)
- [📚 下一步](#-下一步)

---

## 🚀 安装

```bash
npm install schema-dsl
```

---

## 📖 5分钟快速入门

### 1. Hello World（30秒）

```javascript
const { dsl, Validator } = require('schema-dsl');

// 定义Schema
const schema = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

// 验证数据
const validator = new Validator();
const result = validator.validate(schema, {
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

### 3. String 扩展 - 核心特性（2分钟）

字符串支持链式调用：

```javascript
const schema = dsl({
  // ✨ 字符串直接链式调用，无需 dsl() 包裹
  email: 'email!'
    .pattern(/custom/)
    .label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.pattern': '只能包含字母、数字和下划线'
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
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '只能包含字母、数字和下划线',
      'min': '至少3个字符',
      'max': '最多32个字符'
    }),
  
  // 邮箱：标签
  email: 'email!'.label('邮箱地址'),
  
  // 密码：复杂正则
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'pattern': '必须包含大小写字母和数字'
    }),
  
  // 简单字段
  age: 'number:18-120',
  gender: 'male|female|other'
});

// 验证数据
const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  gender: 'male'
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

### 2. 复杂字段用String扩展

```javascript
const schema = dsl({
  email: 'email!'
    .pattern(/custom/)
    .messages({...})
    .label('邮箱'),
  
  username: 'string:3-32!'
    .pattern(/^\w+$/)
    .custom(checkExists)
});
```

### 3. 80/20 法则

**80%字段用纯DSL，20%字段用String扩展**

---

## 🎯 常见场景

### 表单验证

```javascript
const formSchema = dsl({
  email: 'email!'.label('邮箱地址'),
  password: 'string:8-64!'.label('密码'),
  nickname: 'string:2-20'.label('昵称'),
  bio: 'string:500',
  website: 'url',
  age: 'number:18-120',
  gender: 'male|female|other'
});
```

### 自定义验证

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) {
        return { error: 'username.exists', message: '用户名已存在' };
      }
      return true;
    })
});
```

### 嵌套对象

```javascript
const schema = dsl({
  user: {
    profile: {
      name: 'string:1-50!'.label('姓名'),
      avatar: 'url'.label('头像'),
      social: {
        twitter: 'url'.pattern(/twitter\.com/),
        github: 'url'.pattern(/github\.com/)
      }
    }
  }
});
```

---

## 📚 下一步

### 深入学习

- [DSL 语法完整指南](./dsl-syntax.md)
- [API 参考文档](./api-reference.md)
- [String 扩展文档](./string-extensions.md)

### 示例代码

- [String扩展完整示例](../examples/string-extensions.js)
- [用户注册示例](../examples/user-registration/)
- [数据库导出示例](../examples/export-demo.js)

### 高级功能

- [自定义验证器](./api-reference.md#custom)
- [条件验证（when）](./api-reference.md#when)
- [数据库Schema导出](./api-reference.md#导出器)

---

## 🆘 常见问题

### Q: String扩展和纯DSL有什么区别？

**A**: 
- **纯DSL**: 适合简单字段，语法简洁
- **String扩展**: 适合复杂验证，支持链式调用

```javascript
// 纯DSL（简单）
name: 'string:1-50!'

// String扩展（复杂）
email: 'email!'
  .pattern(/custom/)
  .messages({...})
```

### Q: 如何禁用String扩展？

**A**: 
```javascript
const { uninstallStringExtensions } = require('schema-dsl');
uninstallStringExtensions();
```

### Q: 支持TypeScript吗？

**A**: 支持！SchemaIO提供完整的TypeScript类型定义。

---

## 🎉 恭喜！

你已经掌握了SchemaIO的核心用法！

**核心要点**:
1. ✅ DSL语法简洁直观
2. ✅ String扩展强大灵活
3. ✅ 80%用DSL，20%用扩展
4. ✅ 字符串可以直接链式调用

**开始使用**: `npm install schema-dsl`

---


**最后更新**: 2025-12-25


