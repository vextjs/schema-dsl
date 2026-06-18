# schema-dsl 链式字段方法列表

> **更新时间**: 2026-06-18

当字段不再只是一个纯 DSL 字符串时，请查阅本页。v2.1.0 起推荐的默认写法是：

```ts
import { s } from 'schema-dsl/pure';

const schema = s({
  email: 'email!',
  username: s('string:3-32!').label('用户名'),
  age: s.number().min(18).max(120).require()
});
```

## 入口支持

| 入口 | 示例 | TypeScript 提示 | 运行时副作用 |
|------|------|-----------------|--------------|
| 纯 DSL 字符串 | `email: 'email!'` | 只有 DSL 字面量值类型推导 | 无 |
| `s('...')` seed | `s('email!').label('邮箱')` | 完整 `IDslBuilder` 方法 | 无 |
| `s.xxx()` factory | `s.email().label('邮箱')` | 完整 builder 方法和可发现 factory 名称 | 无 |
| `runtime.s` | `runtime.s.email().require()` | runtime 作用域 builder 方法 | 隔离 runtime 实例 |
| 直接 String 链式 | `'email!'.label('邮箱')` | 需要显式导入 `schema-dsl/string-types` | 需要 `schema-dsl/register-string`、compat/root 或编译期 transform |

直接 String 链式仍然支持，但不再作为默认文档入口。请显式启用，或在需要零运行时原型修改时使用 transform 路径。

## 通用方法

| 方法 | 适用类型 | 结果 |
|------|----------|------|
| `.label(text)` | 所有 builder | 设置错误消息中使用的字段标签。 |
| `.description(text)` | 所有 builder | 添加 JSON Schema `description`。 |
| `.messages(map)` / `.error(map)` | 所有 builder | 添加自定义验证消息。 |
| `.default(value)` | 所有 builder | 添加 JSON Schema `default`。 |
| `.optional()` | 所有 builder | 标记字段可选。 |
| `.require()` / `.required()` | 所有 builder | 标记字段必填。字段 builder 上的 `.require()` 不接受参数。 |
| `.enum(...values)` | 兼容的基础类型 builder | 限制可选值。 |
| `.format(name)` | 字符串类 builder | 设置 JSON Schema `format`。 |
| `.pattern(regex, message?)` | 字符串 builder | 添加安全正则 pattern。 |
| `.custom(fn)` | 所有 builder | 添加同步或异步自定义验证器。 |

## 字符串方法

| 方法 | 结果 |
|------|------|
| `.min(n)` / `.max(n)` | 设置 `minLength` / `maxLength`。 |
| `.length(n)` | 精确字符串长度。仅 builder 支持；直接 String 链式不能使用，因为原生字符串已有 `.length` 属性。 |
| `.alphanum()` | 只允许字母和数字。 |
| `.trim()` | 拒绝首尾空白。仅 builder 支持；直接 String 链式不能使用，因为原生字符串已有 `.trim()` 方法。 |
| `.lowercase()` / `.uppercase()` | 要求小写或大写输入。 |
| `.json()` | 要求合法 JSON 字符串。 |
| `.dateFormat(fmt)` | 验证日期字符串格式。 |
| `.after(date)` / `.dateGreater(date)` | 要求日期字符串晚于给定值。 |
| `.before(date)` / `.dateLess(date)` | 要求日期字符串早于给定值。 |
| `.slug()` | URL slug pattern。 |
| `.domain()` | 域名 pattern。 |
| `.ip()` | IP 地址 pattern。 |
| `.base64()` | Base64 字符串 pattern。 |
| `.jwt()` | JWT pattern。 |
| `.username(preset)` | 用户名预设或选项。 |
| `.password(strength)` | 密码强度预设：`weak`、`medium`、`strong`、`veryStrong`。 |
| `.phone(country)` / `.phoneNumber(country)` | 手机号 pattern。 |
| `.idCard(country)` | 身份证件 pattern。 |
| `.creditCard(type)` | 信用卡 pattern。 |
| `.licensePlate(country)` | 车牌 pattern。 |
| `.postalCode(country)` | 邮政编码 pattern。 |
| `.passport(country)` | 护照 pattern。 |

## 数字方法

| 方法 | 结果 |
|------|------|
| `.min(n)` / `.max(n)` | 设置数字最小值 / 最大值。 |
| `.precision(n)` | 限制小数精度。 |
| `.multiple(n)` | 设置 JSON Schema `multipleOf`。 |
| `.port()` | 验证整数端口范围。 |

## 数组方法

| 方法 | 结果 |
|------|------|
| `.min(n)` / `.max(n)` | 设置 `minItems` / `maxItems`。 |
| `.items(item)` | 用 DSL 字符串、builder 或 JSON Schema 设置 item schema。 |
| `.noSparse()` | 拒绝稀疏数组。 |
| `.includesRequired(items)` | 要求数组包含指定值。 |

## 对象方法

| 方法 | 结果 |
|------|------|
| `.requireAll()` | 将对象中定义的所有属性标记为必填。 |
| `.strict()` | 拒绝额外属性。 |

## 输出方法

| 方法 | 结果 |
|------|------|
| `.toSchema()` | 返回带 schema-dsl 内部元数据的 schema，供验证器使用。 |
| `.toJsonSchema()` | 返回干净 JSON Schema，适合导出和嵌入 OpenAPI。 |
| `.toString()` | 序列化 `.toJsonSchema()`。仅 builder 支持。 |
| `.validate(data)` | 使用 builder 自带 validator 验证。仅 builder 支持。 |

## 自定义方法

本页列出内置字段 builder 方法。用户自定义方法应先区分要扩展的层次：

- 复用 `tenant-id!` 这样的字面量，看 [自定义 DSL 类型](plugin-type-registration.md)。
- 增加 `s.tenantId()` 这样的 namespace factory，看 [自定义 s.xxx() 工厂](custom-factories.md)。
- 增加 `s('string!').tenantId()` 这样的 builder 方法，看 [自定义链式方法](custom-chain-methods.md)。
- 源码必须保留 `'string!'.tenantId()` 时，看 [String 扩展](string-extensions.md) 并配置 transform。

## 相关文档

- [快速上手](./quick-start.md)
- [完整类型列表](./type-reference.md)
- [TypeScript 指南](./typescript-guide.md)
- [String 扩展](./string-extensions.md)
- [运行时隔离](./runtime-isolation.md)
- [自定义链式方法](./custom-chain-methods.md)

---

## 对应示例文件

**示例入口**: [chain-methods.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/chain-methods.ts)
**说明**: 覆盖通用、字符串、数字、数组、对象、输出和 runtime 作用域链式方法。
