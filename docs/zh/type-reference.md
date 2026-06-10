# schema-dsl 类型参考

> **更新时间**: 2026-05-08  

---

## 📊 支持的类型

### 基本类型

| 类型 | schema-dsl DSL | JSON Schema | 说明 |
|------|----------|-------------|------|
| 字符串 | `string` | `{ type: 'string' }` | 文本类型 |
| 数字 | `number` | `{ type: 'number' }` | 浮点数 |
| 整数 | `integer` | `{ type: 'integer' }` | 整数 |
| 布尔 | `boolean` | `{ type: 'boolean' }` | true/false |
| 对象 | `object` | `{ type: 'object' }` | 嵌套对象 |
| 数组 | `array` | `{ type: 'array' }` | 数组 |
| 空值 | `null` | `{ type: 'null' }` | null值 |
| 任意 | `any` | `{}` | 任意类型 |

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
| ObjectId | `objectId` | `pattern: ^[0-9a-fA-F]{24}$` | MongoDB ObjectId |
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

---

## 📝 类型使用示例

### 基本类型

```javascript
const { dsl } = require('schema-dsl');

// 字符串
const schema1 = dsl({ name: 'string' });

// 数字
const schema2 = dsl({ age: 'number' });

// 整数
const schema3 = dsl({ count: 'integer' });

// 布尔
const schema4 = dsl({ active: 'boolean' });

// 对象
const schema5 = dsl({ 
  user: {
    name: 'string',
    age: 'number'
  }
});

// 数组
const schema6 = dsl({ tags: 'array<string>' });

// 空值
const schema7 = dsl({ value: 'null' });

// 任意类型
const schema8 = dsl({ data: 'any' });
```

---

### 参数化 DSL 类型

```javascript
// 手机号（默认 cn）
const schema1 = dsl({ mobile: 'phone:cn!' });

// 身份证
const schema2 = dsl({ idCard: 'idCard:cn!' });

// 信用卡
const schema3 = dsl({ card: 'creditCard:visa!' });

// 车牌号
const schema4 = dsl({ plate: 'licensePlate:cn!' });

// 邮政编码
const schema5 = dsl({ zip: 'postalCode:cn!' });

// 护照
const schema6 = dsl({ passportNo: 'passport:cn!' });
```

---

### 格式类型

```javascript
// 邮箱
const schema1 = dsl({ email: 'email!' });

// URL
const schema2 = dsl({ website: 'url' });

// UUID
const schema3 = dsl({ id: 'uuid!' });

// 日期
const schema4 = dsl({ birthday: 'date' });

// 日期时间
const schema5 = dsl({ created_at: 'datetime!' });

// 时间
const schema6 = dsl({ start_time: 'time' });

// IP地址
const schema7 = dsl({ 
  ipv4_addr: 'ipv4',
  ipv6_addr: 'ipv6'
});
```

---

### 特殊类型

```javascript
// 二进制数据（Base64）
const schema = dsl({ 
  avatar: 'binary'  // 头像图片（Base64编码）
});
```

---

## 🔄 与 joi 的对应关系

### 完整对照表

| joi | schema-dsl DSL | 说明 |
|-----|--------------|------|
| `Joi.string()` | `'string'` | 字符串 |
| `Joi.string().email()` | `'email'` | 邮箱 |
| `Joi.string().uri()` | `'url'` | URL |
| `Joi.string().uuid()` | `'uuid'` | UUID |
| `Joi.string().ip()` | `'ipv4'` 或 `'ipv6'` | IP地址 |
| `Joi.string().min(3).max(32)` | `'string:3-32'` | 长度范围 |
| `Joi.string().required()` | `'string!'` | 必填 |
| `Joi.number()` | `'number'` | 数字 |
| `Joi.number().min(0).max(100)` | `'number:0-100'` | 数字范围 |
| `Joi.number().integer()` | `'integer'` | 整数 |
| `Joi.boolean()` | `'boolean'` | 布尔 |
| `Joi.date()` | `'date'` 或 `'datetime'` | 日期 |
| `Joi.array()` | `'array'` | 数组 |
| `Joi.array().items(Joi.string())` | `'array<string>'` | 字符串数组 |
| `Joi.array().min(1).max(10)` | `'array:1-10'` | 数组长度 |
| `Joi.object()` | `{ ... }` | 对象 |
| `Joi.any()` | `'any'` | 任意类型 |
| `Joi.binary()` | `'binary'` | 二进制 |
| `Joi.valid('a','b','c')` | `'a\|b\|c'` | 枚举 |

---

## 📚 相关文档

- [DSL 语法指南](./dsl-syntax.md) - 完整语法说明
- [快速开始](./quick-start.md) - 5分钟上手
- [String 扩展](./string-extensions.md) - 链式调用

---

## ❓ 常见问题

### Q1: 为什么没有直接叫 `Joi.alternatives()` 的 API？

A: schema-dsl 把这类需求拆成两类：

- 单字段跨类型联合: 使用 `types:` 语法
- 根据其他字段做条件分支: 使用 `dsl.match()`

```javascript
const schema = dsl({
  value: 'types:string|number',
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
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

**最后更新**: 2026-05-08

---

## 对应示例文件

**示例入口**: [type-reference.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/type-reference.ts)  
**说明**: 用一份 schema 串起常用内置类型、参数化 DSL 类型和运行时错误路径，方便快速核对实际支持范围。


