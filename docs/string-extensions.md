# String 扩展文档

> **更新时间**: 2026-05-22  

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

## 替代方案（非侵入式）

如果你介意修改 `String.prototype`，可以直接使用 `dsl()` 包裹字符串：

```javascript
const { dsl } = require('schema-dsl');

// 禁用 String 扩展
require('schema-dsl').uninstallStringExtensions();

const schema = dsl({
  // 使用 dsl() 包裹字符串
  email: dsl('email!').pattern(/custom/).label('邮箱'),
  
  // 纯DSL不受影响
  age: 'number:18-120'
});
```

---

## 可用方法

| 方法 | 说明 | 示例 |
|------|------|------|
| `.pattern(regex, msg?)` | 正则验证 | `'string!'.pattern(/^\w+$/)` |
| `.label(text)` | 字段标签 | `'email!'.label('邮箱地址')` |
| `.messages(obj)` | 自定义消息 | `'string!'.messages({...})` |
| `.description(text)` | 描述 | `'url'.description('主页')` |
| `.custom(fn)` | 自定义同步验证 | `'string!'.custom(value => value !== "admin")` |
| `.default(value)` | 默认值 | `'string'.default('guest')` |
| `.username(range?)` | 用户名验证 | `'string!'.username('5-20')` |
| `.phone(country)` | 手机号验证 | `'string!'.phone('cn')` |
| `.phoneNumber(country)` | 手机号验证(别名) | `'string!'.phoneNumber('cn')` |
| `.idCard(country)` | 身份证验证 | `'string!'.idCard('cn')` |
| `.slug()` | URL别名验证 | `'string!'.slug()` |
| `.password(strength)` | 密码验证 | `'string!'.password('strong')` |
| `.format(name)` | 设置格式 | `'string'.format('email')` |
| `.toSchema()` | 转为Schema | `'string!'.toSchema()` |
| `.creditCard(type)` | 信用卡验证 | `'string!'.creditCard('visa')` |
| `.licensePlate(country)` | 车牌验证 | `'string!'.licensePlate('cn')` |
| `.postalCode(country)` | 邮编验证 | `'string!'.postalCode('cn')` |
| `.passport(country)` | 护照验证 | `'string!'.passport('cn')` |

---

## 快速开始

```javascript
const { dsl } = require('schema-dsl');

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
    .custom((value) => {
      if (value === 'admin') return '用户名已被占用';
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

⚠️ `.custom()` 当前仅支持同步函数；需要异步查库或远程调用时，请在 `validate()` / `validateAsync()` 通过后于业务层单独执行。

**支持的返回值**:
- 不返回/`undefined` → 验证通过 ✅
- 返回字符串 → 验证失败（错误消息）
- 返回 `{ error, message }` → 自定义错误码
- 抛出异常 → 验证失败
- 返回 `true` → 验证通过
- 返回 `false` → 验证失败（默认消息）

**注意**: 
- 当前版本**不支持**在 `.custom()` 中直接返回 `Promise`；即使调用 `validateAsync()`，异步 custom validator 仍会报 `同步验证不支持异步操作`。
- 需要异步校验时，请改为：① 先用 `schema-dsl` 做同步结构校验；② 再在业务层执行异步检查。


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

  // 身份证验证
  idCard: 'string!'.idCard('cn'),

  // URL别名验证
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
const { dsl, Validator } = require('schema-dsl');

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
const { validate } = require('schema-dsl');
const result = validate(formSchema, {
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
const { Locale } = require('schema-dsl');

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
const { Locale } = require('schema-dsl');

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
const { dsl } = require('schema-dsl');
// String扩展已自动安装
```

### 手动禁用

```javascript
const { uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();

// 之后只能用纯DSL
'email!'.pattern(/custom/)  // ❌ 报错
```

### 重新启用

```javascript
const { installStringExtensions } = require('schema-dsl');

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
- [示例代码](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts)

---

## 对应示例文件

**示例入口**: [string-extensions.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/string-extensions.ts)  
**说明**: 覆盖 String.prototype 扩展的安装/卸载、链式 `.label()` / `.messages()` / `.pattern()` 调用，以及校验成功/失败路径。

---

**最后更新**: 2026-05-08


