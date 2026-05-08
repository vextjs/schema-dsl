# DSL 语法完整指南

> **更新时间**: 2025-12-25  

---

## 📑 目录

- [快速开始](#快速开始)
- [完整类型列表](#完整类型列表)
- [基础语法](#基础语法)
- [约束语法](#约束语法)
- [数组语法](#数组语法)
- [对象语法](#对象语法)
- [条件验证 (Match)](#条件验证-match)
- [高级用法](#高级用法)
- [实现方案对比](#实现方案对比)
- [完整示例](#完整示例)

---

## 快速开始

```javascript
const { dsl } = require('schema-dsl');

// 基本类型
const schema = dsl({
  name: 'string!',                // 必填字符串
  age: 'number',                  // 可选数字
  email: 'email!',                // 必填邮箱
  active: 'boolean',              // 布尔值
  tags: 'array<string>'           // 字符串数组
});
```

---

## 完整类型列表

### 基本类型

| 类型 | DSL | 说明 |
|------|-----|------|
| 字符串 | `string` | 文本类型 |
| 数字 | `number` | 浮点数 |
| 整数 | `integer` | 整数 |
| 布尔 | `boolean` | true/false |
| 对象 | `object` | 嵌套对象 |
| 数组 | `array` | 数组类型 |
| 空值 | `null` | null值 |
| 任意 | `any` | 任意类型 |

### 格式类型

| 类型 | DSL | 说明 |
|------|-----|------|
| 邮箱 | `email` | 邮箱地址 |
| URL | `url` | 网址 |
| URI | `uri` | URI 地址 |
| UUID | `uuid` | UUID格式 |
| 日期 | `date` | YYYY-MM-DD |
| 日期时间 | `datetime` | ISO 8601 |
| 时间 | `time` | HH:mm:ss |
| 主机名 | `hostname` | 主机名 |
| IP（IPv4 / IPv6） | `ip` | 自动接受 IPv4 或 IPv6 |
| IPv4 | `ipv4` | IPv4地址 |
| IPv6 | `ipv6` | IPv6地址 |
| 二进制 | `binary` | Base64编码 |

### 特殊类型

| 类型 | DSL | 说明 |
|------|-----|------|
| ObjectId | `objectId` | MongoDB ObjectId |
| 十六进制颜色 | `hexColor` | CSS 十六进制颜色 |
| MAC 地址 | `macAddress` | MAC 地址 |
| Cron 表达式 | `cron` | 标准 Cron 表达式 |
| URL Slug | `slug` | 小写字母/数字/中横线组成的 URL 友好标识 |
| 中文姓名 | `chineseName` | 2 到 10 个中文字符 |
| 纯中文文本 | `chinese` | 仅允许中文字符 |
| 邮箱域名校验 | `emailDomain` | 邮箱格式基础上的域名约束类型 |
| 字母数字 | `alphanum` | 仅字母与数字 |
| 全小写字符串 | `lower` | 自动约束为小写字符串 |
| 全大写字符串 | `upper` | 自动约束为大写字符串 |
| JSON 字符串 | `json` | 内容需为合法 JSON 字符串 |
| 端口号 | `port` | 整数端口号 |


---

## 基础语法

### 1. 类型定义

```javascript
// 基本类型
'string'      // 字符串
'number'      // 数字
'integer'     // 整数
'boolean'     // 布尔

// 格式类型
'email'       // 邮箱
'url'         // URL
'date'        // 日期
'uuid'        // UUID
```

### 2. 必填与可选标记

使用 `!` 标记必填字段，使用 `?` 显式标记可选字段：

```javascript
const schema = dsl({
  username: 'string!',      // 必填
  nickname: 'string',       // 可选（默认）
  bio: 'string?',           // 显式可选（等价于 string）
  email: 'email?'           // 可选邮箱
});
```

**说明**：
- `!` - 必填标记，字段不能为空
- `?` - 可选标记，字段可以为空（默认行为）
- 不加标记 - 默认可选

**推荐**：
- 使用 `!` 明确标记必填字段
- 使用 `?` 在需要明确表达"可选"时增强代码可读性

### 3. 对象必填

支持两种方式：

```javascript
// 方式1: 字段内部必填
const schema1 = dsl({
  user: {
    name: 'string!',        // name 必填（user 可选）
    email: 'email!'         // email 必填
  }
});

// 方式2: 对象本身必填 ✅ 推荐
const schema2 = dsl({
  'user!': {                // user 本身必填
    name: 'string',         // name 可选
    email: 'email'          // email 可选
  }
});
```

---

## 约束语法

### 1. 字符串长度

```javascript
'string:10'       // 最大长度10
'string:-10'      // 最大长度10（明确语法）
'string:3-32'     // 长度3-32
'string:10-'      // 最小长度10
```

**示例**:
```javascript
const schema = dsl({
  username: 'string:3-32!',     // 3-32字符，必填
  bio: 'string:500',            // 最大500字符
  password: 'string:8-'         // 最少8字符
});
```

### 2. 数字范围

```javascript
'number:100'      // 最大值100
'number:0-100'    // 范围0-100
'number:18-'      // 最小值18
```

**示例**:
```javascript
const schema = dsl({
  age: 'number:18-120',         // 18-120
  score: 'number:100',          // 0-100
  price: 'number:0-'            // ≥0
});
```

### 3. 枚举值

使用 `|` 分隔枚举值：

```javascript
const schema = dsl({
  status: 'active|inactive|pending',
  gender: 'male|female|other!',
  role: 'admin|user|guest'
});
```

### 4. `types:` 联合类型

当一个字段需要接受多种不同类型时，可以使用 `types:` 前缀生成联合类型：

```javascript
const schema = dsl({
  contact: 'types:email|phone',
  price: 'types:number:0-|string:1-20',
  payload: 'types:object|array<object>'
});
```

这个语法会被编译为 `oneOf` 结构，适合表达“满足其中任意一种类型即可”的场景。

**适用场景**:
- 联系方式允许邮箱或手机号
- 价格字段允许数值或说明字符串
- 兼容历史接口中同字段的多种输入格式

### 5. 特殊约束

支持特定格式的约束：

```javascript
'phone:cn'        // 中国手机号
'idCard:cn'       // 中国身份证
'creditCard:visa' // Visa信用卡
'licensePlate:cn' // 中国车牌
'postalCode:cn'   // 中国邮编
'passport:cn'     // 中国护照
```

**示例**:
```javascript
const schema = dsl({
  mobile: 'phone:cn!',
  id: 'idCard:cn',
  card: 'creditCard:mastercard'
});
```

---

## 数组语法

### 1. 基础数组

```javascript
'array'           // 任意类型数组
'array<string>'   // 字符串数组
'array<number>'   // 数字数组
'array<integer>'  // 整数数组
```

### 2. 数组长度约束

```javascript
'array:1-10'              // 1-10个元素
'array!1-10'              // 1-10个元素，必填
'array:1-'                // 至少1个元素
'array:-10'               // 最多10个元素
'array:1-10<string>'      // 1-10个字符串元素
```

**示例**:
```javascript
const schema = dsl({
  tags: 'array!1-10<string>',      // 必填，1-10个字符串
  scores: 'array:1-5<number>',     // 可选，1-5个数字
  items: 'array:1-<string>'        // 至少1个字符串
});
```

### 3. 数组元素约束

```javascript
const schema = dsl({
  tags: 'array<string:1-20>',          // 每个字符串1-20字符
  scores: 'array<number:0-100>',       // 每个数字0-100
  ids: 'array<integer:1->'             // 每个整数≥1
});
```

### 4. 嵌套数组

```javascript
// 二维数组
const schema = dsl({
  matrix: 'array<array<number>>'
});

// 对象数组
const schema = dsl({
  users: 'array<object>',
  // 或更详细定义
  items: {
    type: 'array',
    items: {
      name: 'string!',
      age: 'number'
    }
  }
});
```

---

## 对象语法

### 1. 基础对象

```javascript
const schema = dsl({
  user: {
    name: 'string!',
    email: 'email!',
    age: 'number'
  }
});
```

### 2. 嵌套对象

```javascript
const schema = dsl({
  user: {
    profile: {
      bio: 'string:500',
      social: {
        twitter: 'url',
        github: 'url'
      }
    }
  }
});
```

### 3. 混合嵌套

```javascript
const schema = dsl({
  'user!': {                    // user 必填
    name: 'string!',            // name 必填
    contacts: 'array!1-5<object>',  // 1-5个联系方式
    tags: 'array<string:1-20>'      // 字符串数组
  }
});
```

---

## 条件验证 (Match)

支持更优雅的条件验证语法 `dsl.match` 和 `dsl.if`。

### 1. dsl.match (推荐)

类似于 `switch-case`，根据某个字段的值决定当前字段的验证规则。

**语法**:
```javascript
dsl.match(field, {
  value1: 'schema1',
  value2: 'schema2',
  _default: 'defaultSchema' // 可选
})
```

**示例**:
```javascript
const schema = dsl({
  contactType: 'email|phone',
  
  // 根据 contactType 的值决定 contact 的规则
  contact: dsl.match('contactType', {
    email: 'email!',      // contactType=email 时
    phone: 'string:11!',  // contactType=phone 时
    _default: 'string'    // 其他情况
  })
});
```

**处理非英文值**:
如果条件值包含中文、数字或特殊字符，给键名加上引号即可：

```javascript
discount: dsl.match('level', {
  '普通用户': 'number:0-5',
  'VIP-1':   'number:0-20',
  '100':     'number:0-50'
})
```

### 2. dsl.if (简单条件)

适用于简单的二选一场景。

**语法**:
```javascript
dsl.if(conditionField, thenSchema, elseSchema)
```

**示例**:
```javascript
const schema = dsl({
  isVip: 'boolean',
  
  // 如果是VIP，折扣0-50，否则0-10
  discount: dsl.if('isVip', 'number:0-50', 'number:0-10')
});
```

---

## 高级用法

### 1. 链式调用

> ⚠️ `.custom()` 当前仅支持同步自定义逻辑；异步业务校验请在验证通过后单独执行。

```javascript
const schema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'pattern': '只能包含字母、数字和下划线'
    }),
  
  email: 'email!'
    .label('邮箱地址')
    .description('用于登录和接收通知')
    .custom((value) => {
      if (value.endsWith('@blocked.example')) return '该邮箱域名不允许注册';
    })
});
```

### 2. 默认验证器

```javascript
const schema = dsl({
  username: 'string!'.username('5-20'),     // 自动正则+长度
  phone: 'string!'.phone('cn'),             // 中国手机号
  password: 'string!'.password('strong')    // 强密码
});
```

---

## 注意事项

### 1. 条件验证

⚠️ **注意**: DSL 字符串不支持直接写条件逻辑

```javascript
'string | number'  // ❌ 不支持
```

**解决方案**: 使用 `dsl.match` (推荐)

```javascript
// ✅ 推荐：使用 dsl.match
const schema = dsl({
  vipLevel: 'string',
  discount: dsl.match('vipLevel', {
    gold:   'number:0-50',
    silver: 'number:0-20',
    normal: 'number:0-5'
  })
});
```

---

### 2. 数组约束

✅ **推荐**: 使用简洁的 DSL 语法
```javascript
'array!1-10<string:1-20>'  // 1-10个元素，每个1-20字符
```

⚠️ **也可以**: 使用完整 JSON Schema 格式（不推荐，太繁琐）
```javascript
{
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
}
```

---

### 3. 正则验证

⚠️ **注意**: DSL 字符串不支持直接写正则

```javascript
'string:/^[a-z]+$/'  // ❌ 不支持
```

**解决方案**: 使用 `.pattern()` 方法
```javascript
'string!'.pattern(/^[a-z]+$/)  // ✅ 推荐
```

---

### 4. 自定义验证

⚠️ **注意**: DSL 字符串不支持自定义逻辑

```javascript
'string!@custom'  // ❌ 不支持
```

**解决方案**: 使用 `.custom()` 方法承载**同步**自定义逻辑
```javascript
'string!'.custom((value) => {
  // 自定义同步逻辑
  if (value === 'reserved') {
    return '该值不可用';
  }
})
```

异步校验（如数据库查重）请在 `validate()` / `validateAsync()` 通过后于业务层单独执行。

---

### 5. 对象数组详细定义

⚠️ **注意**: DSL 简写不支持对象数组的详细定义

```javascript
'array<object{name:string,age:number}>'  // ❌ 不支持
```

**解决方案**: 使用完整对象定义
```javascript
const schema = dsl({
  users: {
    type: 'array',
    items: {
      name: 'string!',
      age: 'number:18-'
    }
  }
});
```

---

## 完整示例

### 用户注册表单

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  // 基本信息
  username: 'string:3-32!'.username().label('用户名'),
  password: 'string!'.password('strong').label('密码'),
  email: 'email!'.label('邮箱'),
  phone: 'string!'.phone('cn').label('手机号'),
  
  // 个人资料
  'profile!': {
    realName: 'string:2-50',
    gender: 'male|female|other',
    birthday: 'date',
    bio: 'string:500'
  },
  
  // 地址信息
  addresses: 'array:1-5<object>',  // 1-5个地址
  
  // 标签
  tags: 'array:1-10<string:1-20>',  // 1-10个标签，每个1-20字符
  
  // 同意条款
  agree: 'boolean!'
});
```

### 电商商品 Schema

```javascript
const schema = dsl({
  // 商品基本信息
  title: 'string:1-100!',
  price: 'number:0-!',
  stock: 'integer:0-',
  status: 'on_sale|off_sale|sold_out!',
  
  // 商品详情
  'details!': {
    description: 'string:10000',
    images: 'array!1-10<url>',
    specs: 'array<object>',
    tags: 'array:1-20<string:1-30>'
  },
  
  // SKU信息
  skus: {
    type: 'array',
    minItems: 1,
    items: {
      sku_code: 'string!',
      price: 'number!',
      stock: 'integer!'
    }
  }
});
```

### API 请求验证

```javascript
const schema = dsl({
  // 查询参数
  page: 'integer:1-',
  pageSize: 'integer:10-100',
  keyword: 'string:1-50',
  
  // 筛选条件
  filters: {
    category: 'array<string>',
    priceRange: {
      min: 'number:0-',
      max: 'number:0-'
    },
    status: 'active|inactive'
  },
  
  // 排序
  sort: {
    field: 'price|created_at|sales',
    order: 'asc|desc'
  }
});
```

---

## 常见问题

### Q1: 为什么移除了简写功能？

**A**: 为了降低学习成本和减少歧义。使用完整类型名更清晰，特别是对新手更友好。

### Q2: 数组长度约束怎么写？

**A**: 支持直接在DSL中写：
```javascript
'array!1-10<string>'    // 推荐
```

### Q3: 如何定义对象数组？

**A**: 使用完整对象定义：
```javascript
const schema = dsl({
  users: {
    type: 'array',
    items: {
      name: 'string!',
      email: 'email!'
    }
  }
});
```

### Q4: 不支持条件验证吗？

**A**: 支持。推荐使用 `dsl.match`：
```javascript
dsl.match('vipLevel', { gold: 'number:0-50', silver: 'number:0-20' })
```

### Q5: 能用正则验证吗？

**A**: 能，使用 `.pattern()` 方法：
```javascript
'string!'.pattern(/^[a-z]+$/)
```

---

## 相关文档

- [类型参考](./type-reference.md) - 完整类型列表
- [String 扩展](./string-extensions.md) - 链式调用
- [快速开始](./quick-start.md) - 5分钟上手

---

## 对应示例文件

**示例入口**: [dsl-syntax.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/dsl-syntax.ts)  
**说明**: 覆盖 Batch 1 中 DSL 语法的基础类型、约束、枚举、数组和嵌套对象写法，可直接运行参考。

---

**最后更新**: 2026-05-08  
**作者**: schema-dsl Team

