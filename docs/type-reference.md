# schema-dsl 完整类型列表

> **更新时间**: 2025-12-25  

---

## 📊 支持的类型

### 基本类型

| 类型 | SchemaI-DSL | JSON Schema | 说明 |
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

| 类型 | SchemaI-DSL | JSON Schema format | 说明 |
|------|----------|-------------------|------|
| 邮箱 | `email` | `email` | 邮箱地址 |
| URL | `url` | `uri` | 网址 |
| UUID | `uuid` | `uuid` | UUID格式 |
| 日期 | `date` | `date` | YYYY-MM-DD |
| 日期时间 | `datetime` | `date-time` | ISO 8601 |
| 时间 | `time` | `time` | HH:mm:ss |
| IPv4 | `ipv4` | `ipv4` | IPv4地址 |
| IPv6 | `ipv6` | `ipv6` | IPv6地址 |

---

### 特殊类型

| 类型 | SchemaI-DSL | JSON Schema | 说明 |
|------|----------|-------------|------|
| 二进制 | `binary` | `contentEncoding: base64` | Base64编码 |
| ObjectId | `objectId` | `pattern: ^[0-9a-fA-F]{24}$` | MongoDB ObjectId |
| HexColor | `hexColor` | `pattern: ^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$` | CSS 16进制颜色 |
| MAC地址 | `macAddress` | `pattern: ^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$` | MAC地址 |
| Cron | `cron` | `pattern: ...` | Cron表达式 |

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

### 扩展验证类型

```javascript
// 手机号
const schema1 = dsl({ mobile: 'phone:cn!' });

// 身份证
const schema2 = dsl({ id_card: 'idCard:cn!' });

// 信用卡
const schema3 = dsl({ card: 'creditCard:visa!' });

// 车牌号
const schema4 = dsl({ plate: 'licensePlate:cn!' });

// 邮政编码
const schema5 = dsl({ zip: 'postalCode:cn!' });

// 护照
const schema6 = dsl({ passport: 'passport:cn!' });
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

| joi | SchemaI-DSL | 说明 |
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

### Q1: 为什么没有 `Joi.alternatives()` 对应？

A: 使用条件验证 `dsl.match()` 实现：

```javascript
const schema = dsl({
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'string:11!'
  })
});
```

### Q2: 为什么 `integer` 不是 `number().integer()`？

A: SchemaI-DSL 使用 JSON Schema 标准，`integer` 是独立类型。

### Q3: 不支持简写吗？

A: 不支持 `s`/`n`/`i`/`b` 等简写，统一使用完整类型名（`string`/`number`/`integer`/`boolean`），降低学习成本。

---

**最后更新**: 2025-12-25


