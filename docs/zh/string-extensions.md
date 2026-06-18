# String 扩展文档

> **更新时间**: 2026-06-18

---

本页说明显式 String 扩展路径。普通业务代码默认推荐 `schema-dsl/pure` + `s`；当你确实想使用直接字符串链式源码，或需要维护已有直接链式代码时，再阅读本页。

## 核心特性

**显式启用 String 扩展后，字符串可以直接调用链式方法**

```javascript
import 'schema-dsl/register-string';
import { s } from 'schema-dsl/pure';

const schema = s({
  // ✅ 已显式启用直接 String 链式
  email: 'email!'.pattern(/custom/).label('邮箱'),

  // ✅ 纯DSL仍然有效
  age: 'number:18-120'
});
```

**优势**:
- ✅ 更简洁自然
- ✅ 减少代码量
- ✅ 可与 `s('...')` 种子和 `s.xxx()` factory 共存

## 默认替代方案：不修改原型

如果你不希望修改 `String.prototype`，从一开始就从 `schema-dsl/pure` 导入 `s`，并使用 `s('...')` 或 `s.xxx()` factory：

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  // 使用 s() 或 s.xxx()，不走直接 String 链式
  email: s.email().pattern(/custom/).label('邮箱').require(),
  
  // 纯DSL不受影响
  age: 'number:18-120'
});
```

---

## 副作用可控入口

root `schema-dsl` 入口仍然为了兼容 v1 安装 String 扩展。新代码通常应从 `schema-dsl/pure` 开始；只有明确想要直接字符串链式写法时，才使用下面的显式入口。

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
import { s } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = s({
  email: 'email!'.description('登录邮箱')
});
```

如果希望保留 String 链式作者体验，但不在运行时修改原型，可使用 `transformSchemaDsl()` 或 `schemaDslEsbuildPlugin()`，把静态链式调用改写为从 `schema-dsl/pure` 导入的 `s('...')` 调用。默认 transform 覆盖完整内建 String 扩展方法集合和裸 pipe 枚举；用户自定义方法通过 `additionalMethods` 追加，已注册的自定义 DSL 类型字面量通过 `additionalTypes` 或 `additionalTypePatterns` 追加。

---

## 直接 String 可用方法

下列方法会由 root 入口或 `schema-dsl/register-string` 安装到 `String.prototype`。该列表与运行时 `STRING_EXTENSION_METHODS` 保持一致。`DslBuilder.length(n)` 与 `DslBuilder.trim()` 不会安装到 String 上，因为 JavaScript 字符串已经有原生 `.length` 属性和 `.trim()` 方法。

| 分类 | 方法 |
|------|------|
| 元信息与消息 | `.label(text)`、`.description(text)`、`.messages(obj)`、`.error(obj)` |
| 必填与默认值 | `.require()`、`.required()`、`.optional()`、`.default(value)` |
| 通用约束 | `.pattern(regex, msg?)`、`.format(name)`、`.enum(...values)`、`.custom(fn)` |
| 字符串规则 | `.min(n)`、`.max(n)`、`.alphanum()`、`.lowercase()`、`.uppercase()`、`.json()` |
| 字符串格式 | `.slug()`、`.domain()`、`.ip()`、`.base64()`、`.jwt()`、`.dateFormat(fmt)`、`.after(date)`、`.before(date)`、`.dateGreater(date)`、`.dateLess(date)` |
| 预设 | `.username(range?)`、`.password(strength?)`、`.phone(country?)`、`.phoneNumber(country?)`、`.idCard(country?)`、`.creditCard(type?)`、`.licensePlate(country?)`、`.postalCode(country?)`、`.passport(country?)` |
| 数字辅助 | `.precision(n)`、`.multiple(n)`、`.port()` |
| 对象辅助 | `.requireAll()`、`.strict()` |
| 数组辅助 | `.items(item)`、`.noSparse()`、`.includesRequired(items)` |
| 输出 | `.toSchema()`、`.toJsonSchema()` |

示例：

```javascript
'email!'.label('邮箱').require().pattern(/custom/).toSchema()
'string'.default('guest')
'number'.min(18).max(120).precision(2)
'array'.items('string').noSparse().includesRequired(['admin'])
```

---

## 快速开始

```javascript
import 'schema-dsl/register-string';
import { s } from 'schema-dsl/pure';

const schema = s({
  // 显式注册后可以直接字符串链式调用
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

以下示例假设已经显式注册 direct String 扩展。如果不希望运行时修改原型，请改用 `s('...')` 或 `s.xxx()`。

### 1. 正则验证

```javascript
const schema = s({
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
const schema = s({
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
const schema = s({
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
const schema = s({
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
import 'schema-dsl/register-string';
import { s, validate } from 'schema-dsl/pure';

const formSchema = s({
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
import 'schema-dsl/register-string';
import { Locale, s } from 'schema-dsl/pure';

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
const schema = s({
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
const schema = s({
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
import 'schema-dsl/register-string';
import { Locale, s } from 'schema-dsl/pure';

// 根据用户语言偏好切换
function getSchema(locale) {
  Locale.setLocale(locale);
  
  return s({
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

## 兼容安装与清理

### 兼容安装

root 兼容入口和 `schema-dsl/compat` 会在导入时安装 String 扩展。新代码默认应优先使用 `schema-dsl/pure`，只有明确需要 direct String chain 时才启用该能力。

```javascript
import 'schema-dsl/compat';
import { s } from 'schema-dsl/pure';

const schema = s({
  email: 'email!'.label('邮箱地址')
});
```

扩展以不可枚举属性挂载到 `String.prototype`，并在安装时检测同名外部方法；如果发现不是 schema-dsl 自己安装的方法，会拒绝覆盖。

如果你的运行环境在导入 `schema-dsl` 之前已经扩展了同名方法（例如 `String.prototype.label`），root entry 会在导入阶段抛出冲突错误，避免静默覆盖外部实现。处理方式是先移除或重命名冲突的外部扩展，再导入 `schema-dsl`；普通项目通常不会遇到这个场景。

### 显式安装后的禁用

```javascript
import { uninstallStringExtensions } from 'schema-dsl/pure';

uninstallStringExtensions();

// 清理后不再支持直接 String 链式。
'email!'.pattern(/custom/)  // ❌ 报错
```

### 重新启用或自定义安装

```javascript
import { installStringExtensions } from 'schema-dsl/pure';

installStringExtensions();

// String扩展恢复
'email!'.pattern(/custom/)  // ✅ 正常
```

---

## 最佳实践

### 1. 简单字段用纯DSL

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  name: 'string:1-50!',
  age: 'number:18-120',
  role: 'user|admin'
});
```

### 2. 复杂字段用链式调用

```javascript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/register-string';

const schema = s({
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

**简单字段保持纯 DSL 字符串。只有明确想要这种作者体验时才使用直接字符串链式；否则用 `s('...')` 获得显式 DSL seed + builder 提示，或用 `s.xxx()` factory 获得最完整方法发现。TypeScript 中 direct String chain 的提示需要 `schema-dsl/string-types`。**

---

## 常见问题

### Q1: String扩展会污染全局吗？

**A**: 直接字符串链式会修改 `String.prototype`，因此新代码中属于 opt-in 路径。如果不希望导入时修改全局原型，请用 `schema-dsl/pure` 并通过 `s('...')` 或 `s.xxx()` 链式调用；如果明确希望启用直接字符串链式，请在应用启动阶段导入 `schema-dsl/register-string`。`uninstallStringExtensions()` 主要用于测试清理或旧兼容回归。

### Q2: 性能如何？

**A**: String 扩展的开销更适合作为易用性取舍看待，不应写成永久性能承诺。热点路径应复用 schema 和 validator，并按 [性能优化指南](performance-guide.md) 中的 benchmark 路线验证。

### Q3: TypeScript 支持吗？

**A**: 完全支持。默认推荐 `s('...')` 或 `s.xxx()` 获得无全局类型污染的链式提示；如果 TS 项目会通过 transform 编译 String 链式写法，可显式导入 `schema-dsl/string-types` 获得 IDE 提示。

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

**最后更新**: 2026-06-18


