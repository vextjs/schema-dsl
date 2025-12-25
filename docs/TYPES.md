# SchemaIO 类型系统完整文档

> **类型系统**: SchemaIO的核心功能，提供**6种类型类**和**60+个方法**  
> **设计理念**: 链式调用、类型安全、扩展性强  

---

## 🎯 类型系统概览

SchemaIO提供了一套**完整的类型系统**，每种类型都是一个独立的类，支持链式调用和丰富的验证方法。

###类型列表

| 类型 | 类名 | 方法数 | 文档 | 说明 |
|------|------|--------|------|------|
| 字符串 | `StringType` | **18个** | [详细文档](types/string-type.md) | 最复杂的类型，支持email/url/ipv4/ipv6等 |
| 数字 | `NumberType` | **12个** | [详细文档](types/number-type.md) | 支持整数/浮点/范围验证 |
| 布尔 | `BooleanType` | **5个** | [详细文档](types/boolean-type.md) | 简单但实用 |
| 对象 | `ObjectType` | **15个** | [详细文档](types/object-type.md) | 支持嵌套/动态键 |
| 数组 | `ArrayType` | **12个** | [详细文档](types/array-type.md) | 支持元素类型/长度约束 |
| 日期 | `DateType` | **10个** | [详细文档](types/date-type.md) | ISO 8601格式支持 |

**总计**: **72个方法** + 基类方法

---

## 🚀 快速开始

### 基础使用

```javascript
const { types } = require('schemaio');

// 字符串类型
const username = types.string()
  .min(3)
  .max(32)
  .pattern(/^[a-z0-9_]+$/)
  .required();

// 数字类型
const age = types.number()
  .integer()
  .min(0)
  .max(150)
  .required();

// 布尔类型
const active = types.boolean()
  .default(true);

// 对象类型
const user = types.object({
  username,
  age,
  active
});

// 验证数据
const result = await user.validate({
  username: 'john_doe',
  age: 25,
  active: true
});

console.log(result.isValid); // true
```

---

## 📚 StringType - 字符串类型

### 核心方法（18个）

#### 长度约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `min(length)` | 最小长度 | `.min(3)` |
| `max(length)` | 最大长度 | `.max(32)` |
| `length(length)` | 精确长度 | `.length(10)` |

#### 模式和枚举

| 方法 | 说明 | 示例 |
|------|------|------|
| `pattern(regex)` | 正则表达式 | `.pattern(/^[a-z]+$/)` |
| `valid(...values)` | 枚举值 | `.valid('A', 'B', 'C')` |

#### 格式验证（9个格式）⭐

| 方法 | 说明 | 验证规则 |
|------|------|----------|
| `email()` | 邮箱格式 | RFC 5322标准 |
| `url()` | URL格式 | 必须含协议 |
| `uuid()` | UUID格式 | v1/v4版本 |
| **`ipv4()`** | IPv4地址 | 0.0.0.0-255.255.255.255 ⭐ |
| **`ipv6()`** | IPv6地址 | 支持简写 ⭐ |
| **`hostname()`** | 主机名 | 域名格式 ⭐ |
| **`dateTime()`** | 日期时间 | ISO 8601完整格式 ⭐ |
| **`date()`** | 日期 | YYYY-MM-DD ⭐ |
| **`time()`** | 时间 | HH:mm:ss ⭐ |

#### 转换方法（3个）⭐

| 方法 | 说明 | 使用场景 |
|------|------|----------|
| **`lowercase()`** | 转小写 | 邮箱/用户名 ⭐ |
| **`uppercase()`** | 转大写 | 国家代码 ⭐ |
| **`trim()`** | 去空格 | 所有用户输入 ⭐ |

### 完整示例

```javascript
// 用户名：3-32字符，字母数字下划线，小写
const username = types.string()
  .min(3)
  .max(32)
  .pattern(/^[a-zA-Z0-9_]+$/)
  .lowercase()
  .trim()
  .required();

// 邮箱：自动转小写，去空格
const email = types.string()
  .email()
  .lowercase()
  .trim()
  .required();

// IP地址白名单
const ipWhitelist = types.string()
  .ipv4()
  .valid('192.168.1.1', '10.0.0.1')
  .required();

// 域名验证
const domain = types.string()
  .hostname()
  .required();
```

**详细文档**: [StringType完整文档](types/string-type.md)

---

## 🔢 NumberType - 数字类型

### 核心方法（12个）

#### 类型约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `integer()` | 必须是整数 | `.integer()` |
| `positive()` | 必须为正数 | `.positive()` |
| `negative()` | 必须为负数 | `.negative()` |

#### 范围约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `min(value)` | 最小值 | `.min(0)` |
| `max(value)` | 最大值 | `.max(100)` |
| `greater(value)` | 大于某值 | `.greater(0)` |
| `less(value)` | 小于某值 | `.less(100)` |

#### 精度和倍数

| 方法 | 说明 | 示例 |
|------|------|------|
| `precision(digits)` | 小数精度 | `.precision(2)` |
| `multiple(base)` | 必须是某数的倍数 | `.multiple(5)` |

#### 特殊值

| 方法 | 说明 | 示例 |
|------|------|------|
| `port()` | 端口号（1-65535） | `.port()` |
| `safe()` | 安全整数范围 | `.safe()` |

### 完整示例

```javascript
// 年龄：18-120的整数
const age = types.number()
  .integer()
  .min(18)
  .max(120)
  .required();

// 价格：保留2位小数
const price = types.number()
  .positive()
  .precision(2)
  .required();

// 端口号
const port = types.number()
  .port()
  .default(8080);

// 评分：0.5的倍数（如0.5, 1.0, 1.5）
const rating = types.number()
  .min(0)
  .max(5)
  .multiple(0.5)
  .required();
```

**详细文档**: [NumberType完整文档](types/number-type.md)

---

## ✅ BooleanType - 布尔类型

### 核心方法（5个）

| 方法 | 说明 | 示例 |
|------|------|------|
| `truthy(values)` | 可转为true的值 | `.truthy(1, 'yes', 'true')` |
| `falsy(values)` | 可转为false的值 | `.falsy(0, 'no', 'false')` |
| `strict()` | 严格模式（只接受true/false） | `.strict()` |

### 完整示例

```javascript
// 严格布尔（只接受true/false）
const active = types.boolean()
  .strict()
  .default(true);

// 宽松布尔（接受多种值）
const enabled = types.boolean()
  .truthy(1, 'yes', 'Y', 'true', 'True')
  .falsy(0, 'no', 'N', 'false', 'False')
  .default(false);
```

**详细文档**: [BooleanType完整文档](types/boolean-type.md)

---

## 📦 ObjectType - 对象类型

### 核心方法（15个）

#### Schema定义

| 方法 | 说明 | 示例 |
|------|------|------|
| `keys(schema)` | 定义属性 | `.keys({ name: types.string() })` |
| `append(schema)` | 追加属性 | `.append({ age: types.number() })` |
| `requiredKeys(...keys)` | 设置必填字段 | `.requiredKeys('name', 'email')` |

#### 约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `min(count)` | 最少属性数 | `.min(1)` |
| `max(count)` | 最多属性数 | `.max(10)` |
| `length(count)` | 精确属性数 | `.length(5)` |

#### 动态键

| 方法 | 说明 | 示例 |
|------|------|------|
| `pattern(regex, schema)` | 匹配正则的键 | `.pattern(/^prop_/, types.string())` |
| `unknown(allow)` | 允许未知属性 | `.unknown(true)` |

### 完整示例

```javascript
// 用户对象
const user = types.object({
  username: types.string().required(),
  email: types.string().email().required(),
  age: types.number().integer().min(0).optional(),
  profile: types.object({
    bio: types.string().max(500),
    website: types.string().url()
  }).optional()
})
.requiredKeys('username', 'email')
.unknown(false); // 不允许额外属性

// 配置对象（动态键）
const config = types.object()
  .pattern(/^[A-Z_]+$/, types.string()) // 所有大写键都是字符串
  .unknown(true);
```

**详细文档**: [ObjectType完整文档](types/object-type.md)

---

## 📋 ArrayType - 数组类型

### 核心方法（12个）

#### 长度约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `min(count)` | 最少元素数 | `.min(1)` |
| `max(count)` | 最多元素数 | `.max(10)` |
| `length(count)` | 精确元素数 | `.length(5)` |

#### 元素约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `items(schema)` | 元素类型 | `.items(types.string())` |
| `ordered(...schemas)` | 有序元素（元组） | `.ordered(types.string(), types.number())` |
| `unique()` | 元素唯一 | `.unique()` |
| `sparse()` | 允许稀疏数组 | `.sparse()` |

### 完整示例

```javascript
// 字符串数组
const tags = types.array()
  .items(types.string().min(1).max(20))
  .min(1)
  .max(10)
  .unique()
  .required();

// 元组（固定顺序和类型）
const point = types.array()
  .ordered(
    types.number(), // x坐标
    types.number()  // y坐标
  )
  .length(2);

// 对象数组
const users = types.array()
  .items(types.object({
    id: types.string().required(),
    name: types.string().required()
  }))
  .min(1);
```

**详细文档**: [ArrayType完整文档](types/array-type.md)

---

## 📅 DateType - 日期类型

### 核心方法（10个）

#### 范围约束

| 方法 | 说明 | 示例 |
|------|------|------|
| `min(date)` | 最早日期 | `.min(new Date('2020-01-01'))` |
| `max(date)` | 最晚日期 | `.max(new Date())` |
| `greater(date)` | 晚于某日期 | `.greater(yesterday)` |
| `less(date)` | 早于某日期 | `.less(tomorrow)` |

#### 格式

| 方法 | 说明 | 示例 |
|------|------|------|
| `iso()` | ISO 8601格式 | `.iso()` |
| `timestamp()` | Unix时间戳 | `.timestamp()` |

### 完整示例

```javascript
// 生日（必须在过去）
const birthday = types.date()
  .max(new Date())
  .iso()
  .required();

// 事件时间（未来30天内）
const eventDate = types.date()
  .min(new Date())
  .max(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  .required();

// 创建时间（时间戳）
const createdAt = types.date()
  .timestamp()
  .default(Date.now);
```

**详细文档**: [DateType完整文档](types/date-type.md)

---

## 🏗️ BaseType - 基类

所有类型都继承自`BaseType`，拥有以下通用方法：

| 方法 | 说明 | 示例 |
|------|------|------|
| `required()` | 设置为必填 | `.required()` |
| `optional()` | 设置为可选 | `.optional()` |
| `default(value)` | 设置默认值 | `.default('hello')` |
| `allow(...values)` | 允许特殊值 | `.allow(null)` |
| `forbidden()` | 禁止该字段 | `.forbidden()` |
| `meta(key, value)` | 添加元数据 | `.meta('label', '用户名')` |
| `description(text)` | 添加描述 | `.description('用户的唯一标识')` |
| `example(value)` | 添加示例 | `.example('john_doe')` |

**详细文档**: [BaseType完整文档](types/base-type.md)

---

## 🎯 高级特性

### 1. 自定义验证

```javascript
const customType = types.string()
  .custom((value, helpers) => {
    if (value.includes('bad')) {
      return helpers.error('string.bad');
    }
    return value;
  });
```

### 2. 条件验证

```javascript
const schema = types.object({
  type: types.string().valid('email', 'phone'),
  value: types.string().when('type', {
    is: 'email',
    then: types.string().email(),
    otherwise: types.string().pattern(/^\d{11}$/)
  })
});
```

### 3. 引用其他字段

```javascript
const schema = types.object({
  password: types.string().min(8),
  confirmPassword: types.string().ref('password')
});
```

---

## 📊 性能对比

| 操作 | 耗时 | 说明 |
|------|------|------|
| 简单验证 | ~0.03ms | StringType.min/max |
| 复杂验证 | ~0.05ms | StringType.email/pattern |
| 嵌套对象 | ~0.1ms | 3层嵌套 |
| 数组验证 | ~0.2ms | 100个元素 |

**基准测试**: 详见 [性能测试报告](../test/benchmarks/validation-performance.test.js)

---

## 🆚 与其他库对比

| 特性 | SchemaIO | Joi | Yup |
|------|---------|-----|-----|
| IPv4/IPv6验证 | ✅ | ✅ | ❌ |
| Hostname验证 | ✅ | ✅ | ❌ |
| 字符串转换 | ✅ | ✅ | ✅ |
| 数据库导出 | ✅ | ❌ | ❌ |
| DSL语法 | ✅ | ❌ | ❌ |
| 链式API | ✅ | ✅ | ✅ |
| 性能 | 优秀 | 优秀 | 良好 |

---

## 📖 相关文档

### 类型详细文档

- [StringType 完整文档](types/string-type.md) - 18个方法详解
- [NumberType 完整文档](types/number-type.md) - 12个方法详解
- [BooleanType 完整文档](types/boolean-type.md) - 5个方法详解
- [ObjectType 完整文档](types/object-type.md) - 15个方法详解
- [ArrayType 完整文档](types/array-type.md) - 12个方法详解
- [DateType 完整文档](types/date-type.md) - 10个方法详解
- [BaseType 完整文档](types/base-type.md) - 通用方法

### 使用指南

- [快速开始](guides/quick-start.md)
- [数据验证指南](guides/validation-guide.md)
- [最佳实践](guides/best-practices.md)

### API文档

- [文档索引](INDEX.md)
- [Joi风格API](joi-compile.md)
- [DSL风格API](dsl-syntax.md)

---

**文档版本**: v1.0.1  
**最后更新**: 2025-12-24  
**类型总数**: 6种类型  
**方法总数**: 72个方法  

🎉 **SchemaIO提供了业界最全面的字符串验证功能（18个方法），包括IPv4/IPv6/Hostname等高级格式！**

