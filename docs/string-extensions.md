# String 扩展文档

> **更新时间**: 2025-12-25  

---

## 📑 目录

- [核心特性](#核心特性)
- [可用方法](#可用方法)
- [快速开始](#快速开始)
- [详细示例](#详细示例)
- [多语言支持](#多语言支持)
- [安装与卸载](#安装与卸载)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 核心特性

**字符串可以直接调用链式方法**

```javascript
// ✅ 字符串直接链式调用
email: 'email!'.pattern(/custom/).label('邮箱')

// ✅ 纯DSL仍然有效
age: 'number:18-120'
```

**优势**:
- ✅ 更简洁自然
- ✅ 减少代码量
- ✅ 100%向后兼容

---

## 可用方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `.pattern(regex, msg?)` | 正则验证 | `'string!'.pattern(/^\w+$/)` |
| `.label(text)` | 字段标签 | `'email!'.label('邮箱地址')` |
| `.messages(obj)` | 自定义消息 | `'string!'.messages({...})` |
| `.description(text)` | 描述 | `'url'.description('主页')` |
| `.custom(fn)` | 自定义验证 | `'string!'.custom(async...)` |
| `.when(field, opts)` | 条件验证 | `'string'.when('type',{...})` |
| `.default(value)` | 默认值 | `'string'.default('guest')` |
| `.username(range?)` | 用户名验证 | `'string!'.username('5-20')` |
| `.phone(country)` | 手机号验证 | `'string!'.phone('cn')` |
| `.phoneNumber(country)` | 手机号验证(别名) | `'string!'.phoneNumber('cn')` |
| `.idCard(country)` | 身份证验证 | `'string!'.idCard('cn')` |
| `.slug()` | URL别名验证 | `'string!'.slug()` |
| `.password(strength)` | 密码验证 | `'string!'.password('strong')` |

---

## 快速开始

```javascript
const { dsl } = require('schemaio');

const schema = dsl({
  // 字符串直接链式调用
  email: 'email!'.label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  
  // 简单字段用纯DSL
  age: 'number:18-120',
  role: 'user|admin'
});
```

---

## 详细示例

### 1. 正则验证

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': '只能包含字母、数字和下划线'
    })
    .label('用户名'),
  
  phone: 'string:11!'
    .pattern(/^1[3-9]\d{9}$/)
    .messages({
      'pattern': '请输入有效的手机号'
    })
    .label('手机号'),
  
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .messages({
      'pattern': '密码必须包含大小写字母和数字'
    })
    .label('密码')
});
```

**正确的错误码**:
- `'required'` - 必填字段
- `'min'` - 最小长度/值
- `'max'` - 最大长度/值
- `'pattern'` - 正则验证
- `'format'` - 格式验证（email/url等）
- `'enum'` - 枚举值

---

### 2. 自定义错误消息

```javascript
const schema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'format': '请输入有效的邮箱地址',
      'required': '邮箱地址不能为空'
    }),
  
  bio: 'string:500'
    .label('个人简介')
    .messages({
      'max': '个人简介不能超过{{#limit}}个字符'
    }),
  
  age: 'number:18-120'
    .messages({
      'min': '年龄不能小于{{#limit}}',
      'max': '年龄不能大于{{#limit}}'
    })
});
```

**消息模板变量**:
- `{{#label}}` - 字段标签
- `{{#limit}}` - 约束值（min/max）
- `{{#value}}` - 当前值
- `{{#pattern}}` - 正则表达式

---

### 3. 自定义验证器

```javascript
const schema = dsl({
  // 最优雅：只在失败时返回错误消息
  username: 'string:3-32!'
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) return '用户名已被占用';
      // 成功时无需返回
    })
    .label('用户名'),
  
  // 支持同步验证
  password: 'string:8-64!'
    .custom((value) => {
      if (!/[A-Z]/.test(value)) return '必须包含大写字母';
      if (!/[a-z]/.test(value)) return '必须包含小写字母';
      if (!/\d/.test(value)) return '必须包含数字';
    })
    .label('密码')
});
```

**支持的返回值**:
- 不返回/`undefined` → 验证通过 ✅
- 返回字符串 → 验证失败（错误消息）
- 返回 `{ error, message }` → 自定义错误码
- 抛出异常 → 验证失败
- 返回 `true` → 验证通过
- 返回 `false` → 验证失败（默认消息）

**注意**: 
- 异步验证器（async）需要使用 `validator.validateAsync()`（计划中）或在外部处理。
- 目前 `validator.validate()` 是同步的，如果 `.custom()` 返回 Promise，会抛出错误提示。

---

### 4. 条件验证

```javascript
const schema = dsl({
  contactType: 'email|phone',
  
  contact: 'string'
    .when('contactType', {
      is: 'email',
      then: 'email!',
      otherwise: 'string!'.pattern(/^\d{11}$/)
    })
    .label('联系方式')
});
```

---

### 5. 默认验证器

```javascript
const schema = dsl({
  // 用户名验证（自动正则+长度）
  username: 'string!'.username('5-20'),  // 5-20个字符
  
  // 手机号验证
  phone: 'string!'.phone('cn'),  // 中国手机号
  
  // 密码强度
  password: 'string!'.password('strong'),  // 强密码

  // 身份证验证 (v2.0.1)
  idCard: 'string!'.idCard('cn'),

  // URL别名验证 (v2.0.1)
  slug: 'string!'.slug()
});
```

**username 预设**:
- `'short'` - 2-16
- `'medium'` - 3-32（默认）
- `'long'` - 5-64
- `'3-32'` - 自定义范围

**phone 支持的国家**:
- `'cn'` - 中国（11位）
- `'us'` - 美国
- `'uk'` - 英国

**password 强度**:
- `'weak'` - 6-64
- `'medium'` - 8-64（默认）
- `'strong'` - 8-64（大小写+数字）

---

### 6. 完整表单示例

```javascript
const { dsl, Validator } = require('schemaio');

const formSchema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .description('用于登录和接收通知')
    .messages({
      'format': '请输入有效的邮箱地址'
    }),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': '只能包含字母、数字和下划线',
      'min': '用户名至少3个字符',
      'max': '用户名最多32个字符'
    })
    .label('用户名'),
  
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    .messages({
      'pattern': '密码必须包含大小写字母、数字和特殊字符'
    })
    .label('密码'),
  
  // 简单字段
  age: 'number:18-120',
  gender: 'male|female|other'
});

// 验证
const validator = new Validator();
const result = validator.validate(formSchema, {
  email: 'user@example.com',
  username: 'john_doe',
  password: 'Password123!',
  age: 25,
  gender: 'male'
});

console.log(result.valid); // true
```

---

## 多语言支持

### 方案1: 全局多语言配置（推荐）

```javascript
const { Locale } = require('schemaio');

// 设置语言
Locale.setLocale('zh-CN');

// 添加自定义语言包
Locale.addLocale('zh-CN', {
  'required': '{{#label}}不能为空',
  'min': '{{#label}}至少{{#limit}}个字符',
  'max': '{{#label}}最多{{#limit}}个字符',
  'pattern': '{{#label}}格式不正确',
  'format': '请输入有效的{{#label}}'
});

// Schema中使用label
const schema = dsl({
  email: 'email!'
    .label('邮箱地址'),  // 错误消息会自动使用"邮箱地址"
  
  username: 'string:3-32!'
    .label('用户名')
});

// 切换语言
Locale.setLocale('en-US');  // 自动切换为英文消息
```

### 方案2: 字段级多语言

```javascript
const schema = dsl({
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'format': '请输入有效的邮箱地址',
      'required': '邮箱地址不能为空'
    })
});
```

### 方案3: 运行时动态切换

```javascript
const { Locale } = require('schemaio');

// 根据用户语言偏好切换
function getSchema(locale) {
  Locale.setLocale(locale);
  
  return dsl({
    email: 'email!'.label(
      locale === 'zh-CN' ? '邮箱地址' : 'Email Address'
    )
  });
}

const zhSchema = getSchema('zh-CN');
const enSchema = getSchema('en-US');
```

**推荐方案**: 方案1（全局配置） + 方案2（特殊字段覆盖）

---

## 安装与卸载

### 自动安装

String扩展在导入时自动安装：

```javascript
const { dsl } = require('schemaio');
// String扩展已自动安装
```

### 手动禁用

```javascript
const { uninstallStringExtensions } = require('schemaio');

uninstallStringExtensions();

// 之后只能用纯DSL
'email!'.pattern(/custom/)  // ❌ 报错
```

### 重新启用

```javascript
const { installStringExtensions } = require('schemaio');

installStringExtensions();

// String扩展恢复
'email!'.pattern(/custom/)  // ✅ 正常
```

---

## 最佳实践

### 1. 简单字段用纯DSL

```javascript
const schema = dsl({
  name: 'string:1-50!',
  age: 'number:18-120',
  role: 'user|admin'
});
```

### 2. 复杂字段用链式调用

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

### 3. 遵循 80/20 法则

**80%字段用纯DSL，20%字段用String扩展**

---

## 常见问题

### Q1: String扩展会污染全局吗？

**A**: 会扩展 `String.prototype`，但冲突概率极低。提供 `uninstallStringExtensions()` 可以卸载。

### Q2: 性能如何？

**A**: 性能开销极小（<5%），测试显示反而更快（少了函数调用）。

### Q3: TypeScript 支持吗？

**A**: 完全支持，通过类型定义文件。

### Q4: 正确的错误码是什么？

**A**: 
- `'required'` - 必填
- `'min'` / `'max'` - 长度/值范围
- `'pattern'` - 正则
- `'format'` - 格式（email/url）
- `'enum'` - 枚举

### Q5: 如何支持多语言？

**A**: 使用 `Locale` 全局配置（推荐）或字段级 `.messages()` 覆盖。

---

## 相关文档

- [DSL 语法](./dsl-syntax.md)
- [API 参考](./api-reference.md)
- [多语言支持](./multi-language.md)
- [示例代码](../examples/string-extensions.js)

---

**最后更新**: 2025-12-25

