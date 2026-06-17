# String 扩展文档

> **更新时间**: 2026-06-17

---

## 📑 目录

- [核心特性](#核心特性)
- [副作用可控入口](#副作用可控入口)
- [可用方法](#可用方法)
- [快速开始](#快速开始)
- [详细示例](#详细示例)
- [多语言支持](#多语言支持)
- [默认安装与卸载](#默认安装与卸载)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 核心特性

**导入 schema-dsl 后，字符串可以直接调用链式方法**

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  // ✅ root entry 默认已安装 String 扩展
  email: 'email!'.pattern(/custom/).label('邮箱'),

  // ✅ 纯DSL仍然有效
  age: 'number:18-120'
});
```

**优势**:
- ✅ 更简洁自然
- ✅ 减少代码量
- ✅ 与 `dsl()` 包裹写法可共存

## 替代方案（主动卸载后非侵入式）

如果你介意修改 `String.prototype`，可以主动卸载扩展，然后使用 `dsl()` 包裹字符串：

```javascript
const { dsl, uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();

const schema = dsl({
  // 使用 dsl() 包裹字符串
  email: dsl('email!').pattern(/custom/).label('邮箱'),
  
  // 纯DSL不受影响
  age: 'number:18-120'
});
```

---

## 副作用可控入口

root `schema-dsl` 入口仍然为了兼容 v1 默认安装 String 扩展。需要控制这个全局副作用时，请使用下面的显式入口。

| 入口 | 行为 | 推荐场景 |
|------|------|------|
| `schema-dsl` | v1 兼容 root 入口；导入时安装 String 扩展 | 已经依赖 `'email!'.description(...)` 直接链式写法的应用 |
| `schema-dsl/pure` | 只导入核心 API；不安装 String 扩展 | 库、worker、测试、SSR 或隔离运行时 |
| `schema-dsl/compat` | 与 root 入口相同的兼容副作用，但语义更显式 | 希望明确表达兼容模式的代码 |
| `schema-dsl/register-string` | 显式副作用入口，导入后安装 String 扩展 | 应用启动阶段主动注册 String 链式 API |
| `schema-dsl/string-types` | 仅提供 String 链式写法的 TypeScript 声明；不安装运行时扩展 | 使用编译期转换且需要 IDE 提示的 TS 项目 |
| `schema-dsl/transform` | 静态 String 链式 DSL 的编译期转换核心 | 构建工具或自定义适配器 |
| `schema-dsl/esbuild` | transform 的可选 esbuild 适配器 | esbuild build/context 流程 |

```javascript
import { dsl } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = dsl({
  email: 'email!'.description('登录邮箱')
});
```

如果希望保留 String 链式作者体验，但不在运行时修改原型，可使用 `transformSchemaDsl()` 或 `schemaDslEsbuildPlugin()`，把静态链式调用改写为从 `schema-dsl/pure` 导入的 `dsl('...')` 调用。默认 transform 覆盖完整内建 String 扩展方法集合和裸 pipe 枚举；用户自定义方法通过 `additionalMethods` 追加。

---

## 可用方法

下表示例默认在导入 `schema-dsl` 后即可使用。

| 方法 | 说明 | 示例 |
|------|------|------|
| `.pattern(regex, msg?)` | 正则验证 | `'string!'.pattern(/^\w+$/)` |
| `.label(text)` | 字段标签 | `'email!'.label('邮箱地址')` |
| `.messages(obj)` | 自定义消息 | `'string!'.messages({...})` |
| `.description(text)` | 描述 | `'url'.description('主页')` |
| `.custom(fn)` | 自定义验证；返回 Promise 时需使用 `validateAsync()` | `'string!'.custom(value => value !== "admin")` |
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
  // 默认可以直接字符串链式调用
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

以下示例默认在导入 `schema-dsl` 后即可使用。如果你不想保留 `String.prototype` 扩展，可以先调用 `uninstallStringExtensions()`，再把每个复杂字段改写为 `dsl('...')` 包裹。

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

⚠️ `.custom()` 支持同步函数；需要异步查库或远程调用时，可以返回 `Promise` 并使用 `validateAsync()`。同步 `validate()` 遇到 Promise-returning custom validator 会返回明确错误。

**支持的返回值**:
- 不返回/`undefined` → 验证通过 ✅
- 返回字符串 → 验证失败（错误消息）
- 返回 `{ error, message }` → 自定义错误码
- 抛出异常 → 验证失败
- 返回 `true` → 验证通过
- 返回 `false` → 验证失败（默认消息）

**注意**: 
- 当前版本支持在 `.custom()` 中返回 `Promise`，但必须通过 `validateAsync()` 执行。
- 如果你希望把数据库/RPC/HTTP 检查留在业务层，也可以先用 `schema-dsl` 做结构校验，再在业务层执行异步检查。


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

## 默认安装与卸载

### 默认安装

root entry 默认安装 String 扩展，用于兼容 v1.1.x 直接字符串链式写法：

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  email: 'email!'.label('邮箱地址')
});
```

扩展以不可枚举属性挂载到 `String.prototype`，并在安装时检测同名外部方法；如果发现不是 schema-dsl 自己安装的方法，会拒绝覆盖。

如果你的运行环境在导入 `schema-dsl` 之前已经扩展了同名方法（例如 `String.prototype.label`），root entry 会在导入阶段抛出冲突错误，避免静默覆盖外部实现。处理方式是先移除或重命名冲突的外部扩展，再导入 `schema-dsl`；普通项目通常不会遇到这个场景。

### 手动禁用

```javascript
const { uninstallStringExtensions } = require('schema-dsl');

uninstallStringExtensions();

// 之后只能用纯DSL
'email!'.pattern(/custom/)  // ❌ 报错
```

### 重新启用或自定义安装

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

**JavaScript 中 80% 字段用纯 DSL，20% 复杂字段可直接字符串链式调用；TypeScript 中为了类型提示，复杂字段优先用 `dsl()` 包裹。**

---

## 常见问题

### Q1: String扩展会污染全局吗？

**A**: root `schema-dsl` 入口为了兼容 v1.1.x 默认扩展 `String.prototype`。副作用已降到较低：扩展方法不可枚举、安装前检测同名冲突、可通过 `uninstallStringExtensions()` 卸载。如果不希望导入时修改全局原型，请改用 `schema-dsl/pure`；如果希望显式启用副作用，请在应用启动阶段导入 `schema-dsl/register-string`。

### Q2: 性能如何？

**A**: 性能开销极小（<5%），测试显示反而更快（少了函数调用）。

### Q3: TypeScript 支持吗？

**A**: 完全支持。默认推荐 `dsl('...')` 获得无全局类型污染的链式提示；如果 TS 项目会通过 transform 编译 String 链式写法，可显式导入 `schema-dsl/string-types` 获得 IDE 提示。

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

**最后更新**: 2026-06-17


