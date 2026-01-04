# v1.0.2 新增验证规则

**版本**: v1.0.2  
**发布日期**: 2025-12-31  
**新增验证器**: 15 个

本文档详细介绍 v1.0.2 版本新增的 15 个验证规则，包括使用方法、应用场景和完整示例。

---

## 📚 目录

- [String 验证器 (6个)](#string-验证器)
  - [exactLength - 精确长度验证](#1-exactlength---精确长度验证)
  - [alphanum - 字母和数字](#2-alphanum---字母和数字)
  - [trim - 前后空格检查](#3-trim---前后空格检查)
  - [lowercase - 小写检查](#4-lowercase---小写检查)
  - [uppercase - 大写检查](#5-uppercase---大写检查)
  - [jsonString - JSON字符串验证](#6-jsonstring---json字符串验证)
- [Number 验证器 (2个)](#number-验证器)
  - [precision - 小数位数限制](#7-precision---小数位数限制)
  - [port - 端口号验证](#8-port---端口号验证)
- [Object 验证器 (2个)](#object-验证器)
  - [requiredAll - 要求所有属性](#9-requiredall---要求所有属性)
  - [strictSchema - 严格模式](#10-strictschema---严格模式)
- [Array 验证器 (2个)](#array-验证器)
  - [noSparse - 禁止稀疏数组](#11-nosparse---禁止稀疏数组)
  - [includesRequired - 必须包含元素](#12-includesrequired---必须包含元素)
- [Date 验证器 (3个)](#date-验证器)
  - [dateFormat - 日期格式验证](#13-dateformat---日期格式验证)
  - [dateGreater - 日期大于](#14-dategreater---日期大于)
  - [dateLess - 日期小于](#15-dateless---日期小于)

---

## String 验证器

### 1. exactLength - 精确长度验证

**用途**: 验证字符串长度必须等于指定值

**参数**: `number` - 精确长度

**错误消息**: 
- 中文: "{{#label}}长度必须是{{#limit}}个字符"
- 英文: "{{#label}} length must be exactly {{#limit}} characters"

**使用方法**:

```javascript
const { dsl, validate } = require('schema-dsl');

// 方式1: JSON Schema
const schema = {
  type: 'object',
  properties: {
    code: {
      type: 'string',
      exactLength: 6
    }
  }
};

// 方式2: DSL 语法 + 约束（v1.0.3+）
const schema2 = dsl({
  code: 'string:6!'  // 精确长度 6
});

// 方式3: 链式调用 JSON Schema
const schema3 = dsl({
  code: {
    type: 'string',
    exactLength: 6
  }
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { code: 'ABC123' }); 
// { valid: true, errors: [], data: { code: 'ABC123' } }

// ❌ 失败 - 长度不足
validate(schema, { code: 'ABC12' });
// { valid: false, errors: ['code长度必须是6个字符'], ... }

// ❌ 失败 - 长度超出
validate(schema, { code: 'ABC1234' });
// { valid: false, errors: ['code长度必须是6个字符'], ... }
```

**应用场景**:
- ✅ 短信验证码 (6位)
- ✅ 邀请码 (固定长度)
- ✅ 产品编码 (固定格式)
- ✅ 颜色代码 (如 #RRGGBB)

**最佳实践**:

```javascript
// 验证码场景
const verifyCodeSchema = dsl({
  code: 'string!',
  exactLength: 6,
  alphanum: true // 配合 alphanum 使用
});

// 邀请码场景
const inviteCodeSchema = dsl({
  inviteCode: 'string!',
  exactLength: 8,
  uppercase: true // 配合 uppercase 使用
});
```

---

### 2. alphanum - 字母和数字

**用途**: 验证字符串只能包含字母和数字

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}只能包含字母和数字"
- 英文: "{{#label}} must only contain alphanumeric characters"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      alphanum: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  username: 'string!',
  alphanum: true
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { username: 'user123' });
validate(schema, { username: 'ABC' });
validate(schema, { username: '123' });

// ❌ 失败 - 包含特殊字符
validate(schema, { username: 'user_123' });
// { valid: false, errors: ['username只能包含字母和数字'], ... }

validate(schema, { username: 'user-123' });
validate(schema, { username: 'user@123' });
validate(schema, { username: 'user 123' }); // 空格也不允许
```

**应用场景**:
- ✅ 用户名验证
- ✅ 产品编码
- ✅ 简单标识符
- ✅ 文件名（无特殊字符）

**最佳实践**:

```javascript
// 用户名场景 - 配合长度验证
const usernameSchema = dsl({
  username: 'string:3-20!',
  alphanum: true
});

// 产品编码 - 配合大写
const productCodeSchema = dsl({
  productCode: 'string!',
  alphanum: true,
  uppercase: true,
  exactLength: 10
});
```

---

### 3. trim - 前后空格检查

**用途**: 验证字符串不能包含前后空格

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}不能包含前后空格"
- 英文: "{{#label}} must not have leading or trailing whitespace"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    keyword: {
      type: 'string',
      trim: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  keyword: 'string!',
  trim: true
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { keyword: 'search' });
validate(schema, { keyword: 'hello world' }); // 中间空格允许

// ❌ 失败 - 前导空格
validate(schema, { keyword: ' search' });
// { valid: false, errors: ['keyword不能包含前后空格'], ... }

// ❌ 失败 - 尾随空格
validate(schema, { keyword: 'search ' });

// ❌ 失败 - 前后都有空格
validate(schema, { keyword: ' search ' });
```

**应用场景**:
- ✅ 搜索关键词
- ✅ 标签名称
- ✅ 精确匹配场景
- ✅ API 密钥
- ✅ Token 验证

**最佳实践**:

```javascript
// 搜索关键词 - 自动修剪
const searchSchema = dsl({
  keyword: 'string:1-100!',
  trim: true
});

// 标签场景 - 严格验证
const tagSchema = dsl({
  tag: 'string:2-20!',
  trim: true,
  lowercase: true // 统一小写
});
```

**注意事项**:
- ⚠️ 此验证器只检查前后空格，不会自动去除
- 💡 如需自动去除，请在业务代码中使用 `String.prototype.trim()`

---

### 4. lowercase - 小写检查

**用途**: 验证字符串必须全部是小写

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}必须是小写"
- 英文: "{{#label}} must be lowercase"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      lowercase: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  email: 'email!',
  lowercase: true
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { email: 'user@example.com' });
validate(schema, { email: 'test123' });
validate(schema, { email: 'abc' });

// ❌ 失败 - 包含大写字母
validate(schema, { email: 'User@example.com' });
// { valid: false, errors: ['email必须是小写'], ... }

validate(schema, { email: 'TEST' });
validate(schema, { email: 'Test123' });
```

**应用场景**:
- ✅ 邮箱地址（规范化）
- ✅ 用户名（统一小写）
- ✅ URL slug
- ✅ 标签名称
- ✅ 数据库字段名

**最佳实践**:

```javascript
// 邮箱场景
const emailSchema = dsl({
  email: 'email!',
  lowercase: true,
  trim: true
});

// URL slug 场景
const slugSchema = dsl({
  slug: 'string:3-50!',
  lowercase: true,
  alphanum: false, // 允许连字符
  regex: /^[a-z0-9-]+$/
});

// 数据库字段名
const fieldNameSchema = dsl({
  fieldName: 'string!',
  lowercase: true,
  regex: /^[a-z_][a-z0-9_]*$/ // 下划线命名
});
```

---

### 5. uppercase - 大写检查

**用途**: 验证字符串必须全部是大写

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}必须是大写"
- 英文: "{{#label}} must be uppercase"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    countryCode: {
      type: 'string',
      uppercase: true,
      exactLength: 2
    }
  }
};

// DSL 语法
const schema2 = dsl({
  countryCode: 'string!',
  uppercase: true,
  exactLength: 2
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { countryCode: 'CN' });
validate(schema, { countryCode: 'US' });

// ❌ 失败 - 包含小写字母
validate(schema, { countryCode: 'cn' });
// { valid: false, errors: ['countryCode必须是大写'], ... }

validate(schema, { countryCode: 'Cn' });
```

**应用场景**:
- ✅ 国家代码 (ISO 3166)
- ✅ 货币代码 (ISO 4217)
- ✅ 语言代码 (ISO 639)
- ✅ 产品系列代码
- ✅ 常量名称

**最佳实践**:

```javascript
// 国家代码
const countrySchema = dsl({
  country: 'string!',
  uppercase: true,
  exactLength: 2,
  regex: /^[A-Z]{2}$/
});

// 货币代码
const currencySchema = dsl({
  currency: 'string!',
  uppercase: true,
  exactLength: 3,
  regex: /^[A-Z]{3}$/ // USD, EUR, CNY
});

// 产品系列代码
const seriesCodeSchema = dsl({
  seriesCode: 'string!',
  uppercase: true,
  alphanum: true,
  exactLength: 6
});
```

---

### 6. jsonString - JSON字符串验证

**用途**: 验证字符串必须是有效的 JSON 格式

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}必须是有效的JSON字符串"
- 英文: "{{#label}} must be a valid JSON string"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    config: {
      type: 'string',
      jsonString: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  config: 'string!',
  jsonString: true
});
```

**验证示例**:

```javascript
// ✅ 通过 - 有效的 JSON
validate(schema, { config: '{"key":"value"}' });
validate(schema, { config: '[1,2,3]' });
validate(schema, { config: '"string"' });
validate(schema, { config: '123' });
validate(schema, { config: 'true' });
validate(schema, { config: 'null' });

// ❌ 失败 - 无效的 JSON
validate(schema, { config: '{key:value}' }); // 键未加引号
// { valid: false, errors: ['config必须是有效的JSON字符串'], ... }

validate(schema, { config: "{'key':'value'}" }); // 单引号
validate(schema, { config: '{incomplete' }); // 不完整
validate(schema, { config: 'undefined' }); // undefined 不是有效 JSON
```

**应用场景**:
- ✅ 配置字符串存储
- ✅ API 参数验证
- ✅ 数据库 TEXT 字段存储 JSON
- ✅ 日志记录
- ✅ 消息队列载荷

**最佳实践**:

```javascript
// 配置存储场景
const configSchema = dsl({
  config: 'string!',
  jsonString: true
});

// 使用示例
const result = validate(configSchema, {
  config: JSON.stringify({ theme: 'dark', lang: 'zh' })
});

if (result.valid) {
  const config = JSON.parse(result.data.config);
  console.log(config.theme); // 'dark'
}

// 结合长度限制
const limitedConfigSchema = dsl({
  config: 'string:1-10000!', // 最大 10KB
  jsonString: true
});
```

**注意事项**:
- ⚠️ 此验证器只检查 JSON 格式有效性，不验证内容结构
- 💡 如需验证 JSON 内容结构，请解析后再用嵌套 schema 验证

---

## Number 验证器

### 7. precision - 小数位数限制

**用途**: 验证数字的小数位数不超过指定值

**参数**: `number` - 最大小数位数

**错误消息**: 
- 中文: "{{#label}}小数位数不能超过{{#limit}}位"
- 英文: "{{#label}} must have at most {{#limit}} decimal places"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    price: {
      type: 'number',
      precision: 2
    }
  }
};

// DSL 语法
const schema2 = dsl({
  price: 'number!',
  precision: 2
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { price: 99.99 });
validate(schema, { price: 100 }); // 整数（0位小数）
validate(schema, { price: 99.9 }); // 1位小数

// ❌ 失败 - 小数位数超出
validate(schema, { price: 99.999 });
// { valid: false, errors: ['price小数位数不能超过2位'], ... }

validate(schema, { price: 99.1234 });
```

**应用场景**:
- ✅ 价格金额 (2位小数)
- ✅ 百分比 (2位小数)
- ✅ 坐标精度 (6位小数)
- ✅ 科学计算精度控制
- ✅ 财务数据

**最佳实践**:

```javascript
// 价格场景 - 人民币
const priceSchema = dsl({
  price: 'number:0.01-99999999.99!',
  precision: 2
});

// 百分比场景
const percentageSchema = dsl({
  percentage: 'number:0-100!',
  precision: 2
});

// GPS 坐标
const coordinateSchema = dsl({
  latitude: 'number:-90-90!',
  precision: 6,
  longitude: 'number:-180-180!',
  precision: 6
});

// 汇率场景 - 高精度
const exchangeRateSchema = dsl({
  rate: 'number!',
  precision: 4
});
```

**注意事项**:
- ⚠️ 整数会被识别为 0 位小数（通过验证）
- ⚠️ JavaScript 浮点数精度问题可能影响验证结果
- 💡 金融场景建议使用整数存储（如分为单位）

---

### 8. port - 端口号验证

**用途**: 验证数字是有效的端口号 (1-65535)

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}必须是有效的端口号(1-65535)"
- 英文: "{{#label}} must be a valid port number (1-65535)"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    port: {
      type: 'integer',
      port: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  port: 'integer!',
  port: true
});
```

**验证示例**:

```javascript
// ✅ 通过
validate(schema, { port: 80 });
validate(schema, { port: 443 });
validate(schema, { port: 3000 });
validate(schema, { port: 65535 }); // 最大值

// ❌ 失败 - 端口号超出范围
validate(schema, { port: 0 });
// { valid: false, errors: ['port必须是有效的端口号(1-65535)'], ... }

validate(schema, { port: 65536 }); // 超过最大值
validate(schema, { port: -1 }); // 负数

// ❌ 失败 - 非整数
validate(schema, { port: 80.5 });
validate(schema, { port: '80' }); // 字符串（需先类型转换）
```

**应用场景**:
- ✅ 服务器配置
- ✅ 数据库连接配置
- ✅ 微服务端口分配
- ✅ 负载均衡配置
- ✅ 防火墙规则

**最佳实践**:

```javascript
// 服务器配置
const serverConfigSchema = dsl({
  httpPort: 'integer!',
  port: true,
  httpsPort: 'integer!',
  port: true
});

// 数据库配置
const dbConfigSchema = dsl({
  host: 'string!',
  port: 'integer!',
  port: true,
  database: 'string!'
});

// 常用端口验证（带默认值）
const webServerSchema = {
  type: 'object',
  properties: {
    port: {
      type: 'integer',
      port: true,
      default: 3000
    }
  }
};
```

**常用端口参考**:
- HTTP: 80
- HTTPS: 443
- SSH: 22
- FTP: 21
- MySQL: 3306
- PostgreSQL: 5432
- MongoDB: 27017
- Redis: 6379

---

## Object 验证器

### 9. requiredAll - 要求所有属性

**用途**: 要求对象的所有定义属性都必须存在

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}缺少必需属性"
- 英文: "{{#label}} is missing required properties"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string' }
  },
  requiredAll: true
};

// DSL 语法
const schema2 = dsl({
  name: 'string',
  age: 'number',
  email: 'string',
  _requiredAll: true
});
```

**验证示例**:

```javascript
// ✅ 通过 - 所有属性都存在
validate(schema, {
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// ❌ 失败 - 缺少属性
validate(schema, {
  name: 'John',
  age: 30
  // 缺少 email
});
// { valid: false, errors: ['缺少必需属性'], ... }

validate(schema, {
  name: 'John'
  // 缺少 age 和 email
});
```

**应用场景**:
- ✅ 完整性检查
- ✅ 表单提交验证
- ✅ API 响应验证
- ✅ 配置文件验证
- ✅ 数据导入验证

**最佳实践**:

```javascript
// 用户注册 - 所有字段必填
const registerSchema = dsl({
  username: 'string:3-20',
  password: 'string:8-32',
  email: 'email',
  phone: 'string',
  _requiredAll: true
});

// 配置文件 - 完整性检查
const configSchema = dsl({
  host: 'string',
  port: 'integer',
  database: 'string',
  username: 'string',
  password: 'string',
  _requiredAll: true
});
```

**与 required 的区别**:
- `required`: 指定哪些字段必填（灵活）
- `requiredAll`: 所有定义的字段都必填（严格）

```javascript
// required 方式（灵活）
const schema1 = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string' }
  },
  required: ['name', 'email'] // 只要求 name 和 email
};

// requiredAll 方式（严格）
const schema2 = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' },
    email: { type: 'string' }
  },
  requiredAll: true // 要求所有 3 个属性
};
```

---

### 10. strictSchema - 严格模式

**用途**: 不允许对象包含未定义的额外属性

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}包含额外属性"
- 英文: "{{#label}} contains additional properties"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'number' }
  },
  strictSchema: true
};

// DSL 语法
const schema2 = dsl({
  name: 'string',
  age: 'number',
  _strictSchema: true
});
```

**验证示例**:

```javascript
// ✅ 通过 - 只包含定义的属性
validate(schema, {
  name: 'John',
  age: 30
});

// ❌ 失败 - 包含额外属性
validate(schema, {
  name: 'John',
  age: 30,
  email: 'john@example.com' // 额外属性
});
// { valid: false, errors: ['包含额外属性'], ... }

validate(schema, {
  name: 'John',
  age: 30,
  address: '123 Main St',
  phone: '1234567890'
});
```

**应用场景**:
- ✅ API 请求验证（防止恶意字段）
- ✅ 数据库写入验证（防止污染）
- ✅ 安全敏感场景
- ✅ 严格的表单验证
- ✅ 配置文件验证

**最佳实践**:

```javascript
// API 请求验证 - 严格模式
const apiRequestSchema = dsl({
  userId: 'string!',
  action: 'string!',
  params: 'object',
  _strictSchema: true // 防止注入额外字段
});

// 数据库更新 - 严格模式
const updateUserSchema = dsl({
  name: 'string',
  email: 'email',
  age: 'number',
  _strictSchema: true // 只允许更新这3个字段
});

// 支付参数 - 严格模式（安全）
const paymentSchema = dsl({
  amount: 'number!',
  currency: 'string!',
  orderId: 'string!',
  _strictSchema: true // 防止篡改
});
```

**与 additionalProperties 的区别**:

```javascript
// additionalProperties: false（ajv 标准）
const schema1 = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  additionalProperties: false
};

// strictSchema: true（schema-dsl 扩展）
const schema2 = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  strictSchema: true
};

// 功能相同，strictSchema 提供更友好的错误消息
```

---

## Array 验证器

### 11. noSparse - 禁止稀疏数组

**用途**: 不允许数组包含 undefined 元素（稀疏数组）

**参数**: `boolean` - true 表示启用验证

**错误消息**: 
- 中文: "{{#label}}不能是稀疏数组"
- 英文: "{{#label}} must not be a sparse array"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      noSparse: true
    }
  }
};

// DSL 语法
const schema2 = dsl({
  items: 'array!',
  noSparse: true
});
```

**验证示例**:

```javascript
// ✅ 通过 - 密集数组
validate(schema, { items: [1, 2, 3] });
validate(schema, { items: ['a', 'b', 'c'] });
validate(schema, { items: [] }); // 空数组

// ❌ 失败 - 稀疏数组
const sparseArray = [1, , 3]; // 注意第2个元素是 empty slot
validate(schema, { items: sparseArray });
// { valid: false, errors: ['items不能是稀疏数组'], ... }

// 创建稀疏数组的方式
const sparse1 = new Array(5); // [empty × 5]
const sparse2 = [1, 2];
delete sparse2[1]; // [1, empty]
```

**应用场景**:
- ✅ 数据完整性要求
- ✅ 批量处理数据
- ✅ 数据库批量插入
- ✅ API 批量操作
- ✅ 文件上传列表

**最佳实践**:

```javascript
// 批量创建用户
const batchCreateSchema = dsl({
  users: 'array:1-100!',
  noSparse: true,
  items: {
    type: 'object',
    properties: {
      username: { type: 'string' },
      email: { type: 'string' }
    }
  }
});

// 上传文件列表
const uploadSchema = dsl({
  files: 'array:1-10!',
  noSparse: true,
  items: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      size: { type: 'number' },
      type: { type: 'string' }
    }
  }
});
```

**什么是稀疏数组**:

```javascript
// 密集数组（正常）
const dense = [1, 2, 3];
console.log(0 in dense); // true
console.log(1 in dense); // true
console.log(2 in dense); // true

// 稀疏数组（异常）
const sparse = [1, , 3];
console.log(0 in sparse); // true
console.log(1 in sparse); // false ❌ empty slot
console.log(2 in sparse); // true

// 影响
sparse.forEach(x => console.log(x)); // 只输出 1, 3（跳过空位）
console.log(sparse.length); // 3（长度不变）
```

---

### 12. includesRequired - 必须包含元素

**用途**: 数组必须包含指定的元素

**参数**: `array` - 必须包含的元素列表

**错误消息**: 
- 中文: "{{#label}}必须包含指定元素"
- 英文: "{{#label}} must include required items"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      includesRequired: ['featured', 'published']
    }
  }
};

// DSL 语法
const schema2 = dsl({
  tags: 'array!',
  includesRequired: ['featured', 'published']
});
```

**验证示例**:

```javascript
// ✅ 通过 - 包含所有必需元素
validate(schema, {
  tags: ['featured', 'published', 'tech']
});

validate(schema, {
  tags: ['published', 'featured'] // 顺序无关
});

// ❌ 失败 - 缺少必需元素
validate(schema, {
  tags: ['featured'] // 缺少 'published'
});
// { valid: false, errors: ['tags必须包含指定元素'], ... }

validate(schema, {
  tags: ['tech', 'news'] // 都缺少
});
```

**应用场景**:
- ✅ 文章标签验证（必须有分类标签）
- ✅ 权限验证（必须包含基础权限）
- ✅ 配置验证（必须包含关键配置）
- ✅ 功能开关验证
- ✅ 环境变量验证

**最佳实践**:

```javascript
// 文章发布 - 必须有分类和状态标签
const articleSchema = dsl({
  tags: 'array:2-10!',
  includesRequired: ['category:*', 'status:published'] // * 表示任意分类
});

// 用户权限 - 必须包含基础权限
const userPermissionsSchema = dsl({
  permissions: 'array!',
  includesRequired: ['read', 'write'] // 基础权限
});

// 部署环境 - 必须包含关键配置
const deployConfigSchema = dsl({
  requiredEnvVars: 'array!',
  includesRequired: ['NODE_ENV', 'DATABASE_URL', 'SECRET_KEY']
});
```

**对象元素匹配**:

```javascript
// 简单类型匹配（字符串、数字等）
const schema1 = {
  items: {
    type: 'array',
    includesRequired: ['admin', 'user']
  }
};

// 对象匹配（使用 JSON.stringify 比较）
const schema2 = {
  items: {
    type: 'array',
    includesRequired: [
      { role: 'admin', level: 1 },
      { role: 'user', level: 0 }
    ]
  }
};

validate(schema2, {
  items: [
    { role: 'admin', level: 1 },
    { role: 'user', level: 0 },
    { role: 'guest', level: -1 }
  ]
}); // ✅ 通过
```

---

## Date 验证器

### 13. dateFormat - 日期格式验证

**用途**: 验证字符串符合指定的日期格式

**参数**: `string` - 日期格式（支持5种）

**支持的格式**:
- `YYYY-MM-DD`: 2025-12-31
- `YYYY/MM/DD`: 2025/12/31
- `DD-MM-YYYY`: 31-12-2025
- `DD/MM/YYYY`: 31/12/2025
- `ISO8601`: 2025-12-31T15:30:00.000Z

**错误消息**: 
- 中文: "{{#label}}日期格式不正确"
- 英文: "{{#label}} date format is invalid"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    birthDate: {
      type: 'string',
      dateFormat: 'YYYY-MM-DD'
    }
  }
};

// DSL 语法
const schema2 = dsl({
  birthDate: 'string!',
  dateFormat: 'YYYY-MM-DD'
});
```

**验证示例**:

```javascript
// ✅ 通过 - YYYY-MM-DD 格式
validate(schema, { birthDate: '2025-12-31' });
validate(schema, { birthDate: '1990-01-01' });

// ❌ 失败 - 格式不匹配
validate(schema, { birthDate: '2025/12/31' }); // 使用了 /
validate(schema, { birthDate: '31-12-2025' }); // DD-MM-YYYY 格式
validate(schema, { birthDate: '2025-13-01' }); // 月份无效
validate(schema, { birthDate: '2025-12-32' }); // 日期无效

// ISO8601 格式
const isoSchema = dsl({
  createdAt: 'string!',
  dateFormat: 'ISO8601'
});

validate(isoSchema, { createdAt: '2025-12-31T15:30:00.000Z' }); // ✅
validate(isoSchema, { createdAt: '2025-12-31T15:30:00Z' }); // ✅
```

**应用场景**:
- ✅ 生日验证 (YYYY-MM-DD)
- ✅ 预约日期 (DD/MM/YYYY)
- ✅ API 时间戳 (ISO8601)
- ✅ 日志时间 (ISO8601)
- ✅ 数据库日期字段

**最佳实践**:

```javascript
// 生日场景 - 带范围验证
const birthDateSchema = dsl({
  birthDate: 'string!',
  dateFormat: 'YYYY-MM-DD'
  // 可结合 dateGreater/dateLess 验证年龄范围
});

// API 时间戳 - ISO8601
const timestampSchema = dsl({
  createdAt: 'string!',
  dateFormat: 'ISO8601',
  updatedAt: 'string',
  dateFormat: 'ISO8601'
});

// 国际化日期 - 欧洲格式
const europeDateSchema = dsl({
  date: 'string!',
  dateFormat: 'DD/MM/YYYY'
});

// 中国日期格式
const chinaDateSchema = dsl({
  date: 'string!',
  dateFormat: 'YYYY-MM-DD' // 或 YYYY/MM/DD
});
```

**格式选择建议**:
- 📅 **YYYY-MM-DD**: 推荐（ISO 8601标准，数据库友好）
- 📅 **ISO8601**: API 和日志场景
- 📅 **DD/MM/YYYY**: 欧洲用户
- 📅 **MM/DD/YYYY**: 美国用户（需自定义）

---

### 14. dateGreater - 日期大于

**用途**: 验证日期必须大于（晚于）指定日期

**参数**: `string` - 对比日期（ISO 8601 格式）

**错误消息**: 
- 中文: "{{#label}}必须晚于{{#limit}}"
- 英文: "{{#label}} must be after {{#limit}}"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    endDate: {
      type: 'string',
      dateGreater: '2025-01-01'
    }
  }
};

// DSL 语法
const schema2 = dsl({
  endDate: 'string!',
  dateGreater: '2025-01-01'
});
```

**验证示例**:

```javascript
// ✅ 通过 - 日期在指定日期之后
validate(schema, { endDate: '2025-12-31' });
validate(schema, { endDate: '2026-01-01' });

// ❌ 失败 - 日期在指定日期之前或相等
validate(schema, { endDate: '2025-01-01' }); // 相等
// { valid: false, errors: ['endDate必须晚于2025-01-01'], ... }

validate(schema, { endDate: '2024-12-31' }); // 更早

// ❌ 失败 - 无效日期
validate(schema, { endDate: 'invalid-date' });
```

**应用场景**:
- ✅ 结束日期必须晚于开始日期
- ✅ 预约日期必须是未来
- ✅ 过期时间验证
- ✅ 活动时间范围
- ✅ 会员有效期

**最佳实践**:

```javascript
// 活动时间范围验证
const eventSchema = dsl({
  startDate: 'string!',
  dateGreater: new Date().toISOString(), // 必须是未来
  endDate: 'string!',
  dateGreater: '${startDate}' // 动态引用（需自行处理）
});

// 会员有效期
const membershipSchema = dsl({
  expireDate: 'string!',
  dateGreater: new Date().toISOString() // 未过期
});

// 预约系统 - 至少提前1天
const bookingSchema = {
  type: 'object',
  properties: {
    bookingDate: {
      type: 'string',
      dateGreater: new Date(Date.now() + 86400000).toISOString() // 明天
    }
  }
};
```

**动态日期验证**:

```javascript
// 动态验证 - 结束日期必须晚于开始日期
function validateDateRange(data) {
  // 先验证基础格式
  const schema = dsl({
    startDate: 'string!',
    endDate: 'string!'
  });
  
  const result = validate(schema, data);
  if (!result.valid) return result;
  
  // 再验证日期范围
  const rangeSchema = {
    type: 'object',
    properties: {
      endDate: {
        type: 'string',
        dateGreater: data.startDate
      }
    }
  };
  
  return validate(rangeSchema, data);
}
```

---

### 15. dateLess - 日期小于

**用途**: 验证日期必须小于（早于）指定日期

**参数**: `string` - 对比日期（ISO 8601 格式）

**错误消息**: 
- 中文: "{{#label}}必须早于{{#limit}}"
- 英文: "{{#label}} must be before {{#limit}}"

**使用方法**:

```javascript
// JSON Schema
const schema = {
  type: 'object',
  properties: {
    startDate: {
      type: 'string',
      dateLess: '2025-12-31'
    }
  }
};

// DSL 语法
const schema2 = dsl({
  startDate: 'string!',
  dateLess: '2025-12-31'
});
```

**验证示例**:

```javascript
// ✅ 通过 - 日期在指定日期之前
validate(schema, { startDate: '2025-01-01' });
validate(schema, { startDate: '2024-12-31' });

// ❌ 失败 - 日期在指定日期之后或相等
validate(schema, { startDate: '2025-12-31' }); // 相等
// { valid: false, errors: ['startDate必须早于2025-12-31'], ... }

validate(schema, { startDate: '2026-01-01' }); // 更晚

// ❌ 失败 - 无效日期
validate(schema, { startDate: 'invalid-date' });
```

**应用场景**:
- ✅ 开始日期必须早于结束日期
- ✅ 历史数据验证
- ✅ 出生日期（必须是过去）
- ✅ 活动报名截止
- ✅ 优惠券使用期限

**最佳实践**:

```javascript
// 出生日期 - 必须是过去
const birthDateSchema = dsl({
  birthDate: 'string!',
  dateFormat: 'YYYY-MM-DD',
  dateLess: new Date().toISOString() // 今天之前
});

// 活动报名 - 截止日期前
const registrationSchema = dsl({
  registrationDate: 'string!',
  dateLess: '2025-12-31T23:59:59Z' // 截止时间
});

// 历史记录 - 不能是未来
const historySchema = dsl({
  recordDate: 'string!',
  dateLess: new Date().toISOString()
});

// 促销活动 - 开始日期必须早于结束日期
const promotionSchema = {
  type: 'object',
  properties: {
    startDate: {
      type: 'string',
      dateLess: '${endDate}' // 动态引用（需自行处理）
    },
    endDate: {
      type: 'string'
    }
  }
};
```

**组合使用 dateGreater 和 dateLess**:

```javascript
// 日期范围验证 - 必须在某个时间段内
const dateRangeSchema = dsl({
  date: 'string!',
  dateGreater: '2025-01-01', // 必须晚于 2025-01-01
  dateLess: '2025-12-31'     // 必须早于 2025-12-31
});

// 验证
validate(dateRangeSchema, { date: '2025-06-15' }); // ✅ 通过
validate(dateRangeSchema, { date: '2024-12-31' }); // ❌ 失败（太早）
validate(dateRangeSchema, { date: '2026-01-01' }); // ❌ 失败（太晚）
```

---

## 📝 使用技巧

### 组合使用多个验证器

```javascript
// 用户名 - 3-20位字母数字
const usernameSchema = dsl({
  username: 'string:3-20!',
  alphanum: true,
  lowercase: true,
  trim: true
});

// 产品编码 - 6位大写字母数字
const productCodeSchema = dsl({
  code: 'string!',
  exactLength: 6,
  alphanum: true,
  uppercase: true
});

// 价格 - 正数，2位小数，最大100万
const priceSchema = dsl({
  price: 'number:0.01-1000000!',
  precision: 2
});

// 严格的配置对象
const strictConfigSchema = dsl({
  host: 'string!',
  port: 'integer!',
  port: true,
  database: 'string!',
  _requiredAll: true,
  _strictSchema: true
});
```

### 错误消息国际化

```javascript
const { dsl, validate, Locale } = require('schema-dsl');

// 切换到英文
Locale.setLocale('en-US');

const schema = dsl({
  code: 'string!',
  exactLength: 6
});

validate(schema, { code: 'ABC12' });
// { valid: false, errors: ['code length must be exactly 6 characters'], ... }

// 切换回中文
Locale.setLocale('zh-CN');

validate(schema, { code: 'ABC12' });
// { valid: false, errors: ['code长度必须是6个字符'], ... }
```

---

## 🔗 相关文档

- [完整验证规则参考](./validation-rules-complete.md)
- [Pattern 验证器使用指南](./pattern-validators.md)
- [自定义验证指南](./custom-validation.md)
- [API 参考](./api-reference.md)
- [DSL 语法](./dsl-syntax.md)

---

## 📞 反馈与支持

如果您发现文档有误或有改进建议，欢迎：
- 提交 [Issue](https://github.com/vextjs/schema-dsl/issues)
- 发起 [Pull Request](https://github.com/vextjs/schema-dsl/pulls)
- 加入讨论组

---

**文档版本**: v1.0.2  
**最后更新**: 2025-12-31  
**维护者**: schema-dsl 开发团队

