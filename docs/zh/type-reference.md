# schema-dsl 完整类型列表

本页列出内置 DSL 类型，并说明同一种类型在推荐写法中的三种调用方式：纯 DSL 字符串、`s('...')` builder seed、`s.xxx()` factory。

---

## 📊 支持的类型

### 基本类型

| 类型 | schema-dsl DSL | JSON Schema | 说明 |
|------|----------|-------------|------|
| 字符串 | `string` | `{ type: 'string' }` | 文本类型 |
| 数字 | `number` | `{ type: 'number' }` | 浮点数 |
| 整数 | `integer` | `{ type: 'integer' }` | 整数 |
| 整数别名 | `int` | `{ type: 'integer' }` | `integer` 的别名 |
| 布尔 | `boolean` | `{ type: 'boolean' }` | true/false |
| 对象 | `object` | `{ type: 'object' }` | 嵌套对象 |
| 数组 | `array` | `{ type: 'array' }` | 数组 |
| 空值 | `null` | `{ type: 'null' }` | null值 |
| 任意 | `any` | `{}` | 任意类型 |
| 任意别名 | `mixed` | `{}` | `any` 的别名 |

---

### 格式类型（基于 string）

| 类型 | schema-dsl DSL | JSON Schema format | 说明 |
|------|----------|-------------------|------|
| 邮箱 | `email` | `email` | 邮箱地址 |
| URL | `url` | `uri` | 网址 |
| URI | `uri` | `uri` | URI 字符串 |
| UUID | `uuid` | `uuid` | UUID格式 |
| IP（IPv4/IPv6） | `ip` | `anyOf(ipv4, ipv6)` | 双栈 IP |
| 日期 | `date` | `date` | YYYY-MM-DD |
| 日期时间 | `datetime` | `date-time` | ISO 8601 |
| 时间 | `time` | `time` | HH:mm:ss |
| 主机名 | `hostname` | `hostname` | 主机名 |
| IPv4 | `ipv4` | `ipv4` | IPv4地址 |
| IPv6 | `ipv6` | `ipv6` | IPv6地址 |

---

### 特殊类型

| 类型 | schema-dsl DSL | JSON Schema | 说明 |
|------|----------|-------------|------|
| 二进制 | `binary` | `contentEncoding: base64` | Base64编码 |
| 二进制别名 | `buffer` | `contentEncoding: base64` | `binary` 的别名 |
| ObjectId | `objectId` | `pattern: ^[0-9a-fA-F]{24}$` | MongoDB ObjectId |
| ObjectId 别名 | `objectid` | `pattern: ^[0-9a-fA-F]{24}$` | `objectId` 的小写别名 |
| HexColor | `hexColor` | `pattern: ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$` | CSS 16进制颜色 |
| MAC地址 | `macAddress` | `pattern: ^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$` | MAC地址 |
| Cron | `cron` | `pattern: ...` | Cron表达式 |
| Slug | `slug` | `pattern: ^[a-z0-9]+(?:-[a-z0-9]+)*$` | URL Slug |
| 中文姓名 | `chineseName` | `pattern: ^[\u4e00-\u9fa5]{2,10}$` | 中文姓名 |
| 中文文本 | `chinese` | `pattern: ^[\u4e00-\u9fa5]+$` | 纯中文文本 |
| 邮箱域扩展 | `emailDomain` | `format: email` | 邮箱 + 域名扩展校验 |
| 只含字母数字 | `alphanum` | `alphanum: true` | 自定义 AJV keyword |
| 小写字符串 | `lower` | `lowercase: true` | 自定义 AJV keyword |
| 大写字符串 | `upper` | `uppercase: true` | 自定义 AJV keyword |
| JSON字符串 | `json` | `jsonString: true` | 自定义 AJV keyword |
| 端口号 | `port` | `port: true` | 整数端口号 |
| 浮点数别名 | `float` | `{ type: 'number' }` | `number` 的别名 |
| 双精度别名 | `double` | `{ type: 'number' }` | `number` 的别名 |
| 十进制别名 | `decimal` | `{ type: 'number' }` | `number` 的别名 |

---

## 📝 类型使用示例

### 基本类型

```javascript
import { s } from 'schema-dsl/pure';

// 字符串
const schema1 = s({ name: 'string' });

// 数字
const schema2 = s({ age: 'number' });

// 整数
const schema3 = s({ count: 'integer' });

// 布尔
const schema4 = s({ active: 'boolean' });

// 对象
const schema5 = s({
  user: {
    name: 'string',
    age: 'number'
  }
});

// 数组
const schema6 = s({ tags: 'array<string>' });

// 对象数组
const schema6b = s({
  items: s.array({
    name: 'string!',
    quantity: 'number:1-999!'
  })
});

// 空值
const schema7 = s({ value: 'null' });

// 任意类型
const schema8 = s({ data: 'any' });
```

---

### 参数化 DSL 类型

```javascript
// 手机号（默认 cn）
const schema1 = s({ mobile: 'phone:cn!' });

// 身份证
const schema2 = s({ idCard: 'idCard:cn!' });

// 信用卡
const schema3 = s({ card: 'creditCard:visa!' });

// 车牌号
const schema4 = s({ plate: 'licensePlate:cn!' });

// 邮政编码
const schema5 = s({ zip: 'postalCode:cn!' });

// 护照
const schema6 = s({ passportNo: 'passport:cn!' });
```

---

### 格式类型

```javascript
// 邮箱
const schema1 = s({ email: 'email!' });

// URL
const schema2 = s({ website: 'url' });

// UUID
const schema3 = s({ id: 'uuid!' });

// 日期
const schema4 = s({ birthday: 'date' });

// 日期时间
const schema5 = s({ created_at: 'datetime!' });

// 时间
const schema6 = s({ start_time: 'time' });

// IP地址
const schema7 = s({
  ipv4_addr: 'ipv4',
  ipv6_addr: 'ipv6'
});
```

---

### 特殊类型

```javascript
// 二进制数据（Base64）
const schema = s({
  avatar: 'binary'  // 头像图片（Base64编码）
});
```

---

## 调用方式矩阵

| 目标 | 推荐写法 | 示例 |
|------|----------|------|
| 最短 schema object | 纯 DSL 字符串 | `s({ email: 'email!' })` |
| DSL seed + 链式增强 | `s('...')` | `s('string:3-32!').label('用户名')` |
| 完整方法发现 | `s.xxx()` factory | `s.email().label('邮箱').require()` |
| 框架隔离运行时 | `runtime.s` | `runtime.s({ email: 'email!' })` |
| 直接字符串链式源码 | String Extensions 或 transform | `'email!'.label('邮箱')` |

Factory 示例：

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  name: s.string().min(1).max(50).require(),
  age: s.number().min(18).max(120),
  email: s.email().label('邮箱').require(),
  tags: s.array('string:1-30').min(1).max(10),
  lines: s.array({ name: 'string!', quantity: 'number:1-999!' }),
  status: s.enum('active', 'inactive', 'pending').default('active')
});
```

### Factory 支持边界

不是每个 DSL 类型都有同名 `s.xxx()` factory。内置 factory 覆盖最常用的类型和入口：

| 类别 | 可直接调用的 factory |
|------|----------------------|
| 基础类型 | `s.string()`、`s.number()`、`s.integer()`、`s.int()`、`s.boolean()`、`s.object()`、`s.array()`、`s.any()`、`s.mixed()` |
| 格式类型 | `s.email()`、`s.url()`、`s.uri()`、`s.uuid()`、`s.ip()`、`s.ipv4()`、`s.ipv6()`、`s.date()`、`s.datetime()`、`s.time()`、`s.slug()` |
| 常用预设 | `s.phone(country?)`、`s.username(preset?)`、`s.password(strength?)` |
| 其他内置类型 | 用 `s('objectId!')`、`s('hexColor')` 或 `s.type('objectId')` |

`s.array(item)` 和 `.items(item)` 的 `item` 可以是 DSL 字符串、builder、DSL 对象或标准 JSON Schema：

```javascript
s.array('string:1-30')
s.array(s.string().min(1).require())
s.array({ name: 'string!', quantity: 'number:1-999!' })
s.array({ type: 'string', minLength: 1 }) // 标准 JSON Schema
s.array({ enum: ['small', 'large'] })     // 无 type 的 JSON Schema 片段也会保留
```

如果对象数组的子字段名刚好叫 `enum`、`pattern`、`minimum` 这类 JSON Schema keyword，请用 `s({ ... })` 明确告诉 schema-dsl 这是 DSL 对象：

```javascript
s.array(s({
  enum: 'string!',
  pattern: 'string'
}))
```

---

## 📚 相关文档

- [DSL 语法指南](./dsl-syntax.md) - 完整语法说明
- [快速开始](./quick-start.md) - 5分钟上手
- [String 扩展](./string-extensions.md) - 链式调用

---

## ❓ 常见问题

### Q1: 如何表达字段可选类型？

A: schema-dsl 把这类需求拆成两类：

- 单字段跨类型联合: 使用 `types:` 语法
- 根据其他字段做条件分支: 使用 `s.match()`

```javascript
const schema = s({
  value: 'types:string|number',
  contactType: 'email|phone',
  contact: s.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});
```

### Q2: 为什么 `integer` 不是 `number().integer()`？

A: schema-dsl 使用 JSON Schema 标准，`integer` 是独立类型。

### Q3: 不支持简写吗？

A: 不支持 `s`/`n`/`i`/`b` 等简写，统一使用完整类型名（`string`/`number`/`integer`/`boolean`），降低学习成本。

---


---

## 对应示例文件

**示例入口**: [type-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-reference.ts)
**说明**: 用一份 schema 串起常用内置类型、参数化 DSL 类型和运行时错误路径，方便快速核对实际支持范围。


