# 枚举功能文档

**版本**: v1.1.0  
**最后更新**: 2025-12-31

---

## 📖 概述

枚举（Enum）功能允许你定义字段只能取特定的值集合。schema-dsl 支持多种枚举类型和语法格式。

---

## ✨ 核心特性

- ✅ **字符串枚举** - 限定字符串值范围
- ✅ **布尔值枚举** - true/false 布尔值
- ✅ **数字枚举** - 数字值限定
- ✅ **整数枚举** - 整数值限定（禁止小数）
- ✅ **小数枚举** - 支持小数值
- ✅ **自动类型识别** - 智能识别枚举类型
- ✅ **多种语法** - 简写和完整形式
- ✅ **必填支持** - 枚举字段可标记为必填
- ✅ **链式 API** - 支持 .label() 和 .messages()

---

## 📝 语法格式

### 基础语法

```javascript
// 简写形式（自动识别类型）
'value1|value2|value3'

// 完整形式（显式指定类型）
'enum:value1|value2|value3'              // 字符串枚举
'enum:type:value1|value2|value3'         // 指定类型的枚举

// 必填标记
'value1|value2!'
'enum:type:value1|value2!'
```

### 支持的枚举类型

| 类型 | 语法 | 示例 |
|------|------|------|
| 字符串 | `'value1\|value2'` | `'active\|inactive'` |
| 字符串（显式） | `'enum:value1\|value2'` | `'enum:admin\|user'` |
| 布尔值（自动） | `'true\|false'` | `'true\|false'` |
| 布尔值（显式） | `'enum:boolean:true\|false'` | `'enum:boolean:true\|false'` |
| 数字（自动） | `'1\|2\|3'` | `'1\|2\|3'` |
| 数字（显式） | `'enum:number:1\|2\|3'` | `'enum:number:1\|2\|3'` |
| 整数 | `'enum:integer:1\|2\|3'` | `'enum:integer:1\|2\|3'` |
| 小数 | `'1.0\|1.5\|2.0'` | `'1.0\|1.5\|2.0'` |

---

## 🚀 快速开始

### 1. 字符串枚举

```javascript
const { dsl, validate } = require('schema-dsl');

// 简写形式
const schema = dsl({
  status: 'active|inactive|pending'
});

// 验证
validate(schema, { status: 'active' });   // ✅ 通过
validate(schema, { status: 'unknown' });  // ❌ 失败
```

### 2. 布尔值枚举

```javascript
// 自动识别为布尔值
const schema = dsl({
  isPublic: 'true|false',
  verified: 'true|false!'  // 必填
});

// 验证
validate(schema, { isPublic: true, verified: false });  // ✅ 通过
validate(schema, { isPublic: 'true' });  // ❌ 失败（字符串）
```

### 3. 数字枚举

```javascript
// 自动识别为数字
const schema = dsl({
  priority: '1|2|3',
  rating: '1.0|1.5|2.0|2.5'  // 小数
});

// 验证
validate(schema, { priority: 1, rating: 2.0 });  // ✅ 通过
validate(schema, { priority: '1' });  // ❌ 失败（字符串）
```

---

## 📚 详细用法

### 必填枚举

```javascript
const schema = dsl({
  // 字符串枚举必填
  role: 'admin|user|guest!',
  
  // 布尔值枚举必填
  agreeTerms: 'true|false!',
  
  // 数字枚举必填
  level: '1|2|3!'
});

// 缺失必填字段
validate(schema, {});  // ❌ 失败
```

### 显式指定类型

```javascript
const schema = dsl({
  // 显式指定字符串
  status: 'enum:active|inactive',
  
  // 显式指定布尔值
  flag: 'enum:boolean:true|false',
  
  // 显式指定数字
  priority: 'enum:number:1|2|3',
  
  // 显式指定整数（禁止小数）
  level: 'enum:integer:1|2|3'
});
```

### 链式 API

```javascript
const schema = dsl({
  status: dsl('active|inactive|archived')
    .label('文章状态')
    .messages({
      'string.enum': '状态必须是: 草稿、已发布或已归档'
    })
});
```

### 数组中的枚举

```javascript
const schema = dsl({
  tags: 'array<enum:tech|business|lifestyle>',
  permissions: 'array<enum:read|write|delete>'
});

validate(schema, {
  tags: ['tech', 'business'],
  permissions: ['read', 'write']
});  // ✅ 通过
```

### 嵌套对象中的枚举

```javascript
const schema = dsl({
  user: {
    name: 'string!',
    role: 'admin|user|guest',
    status: 'active|inactive'
  },
  settings: {
    theme: 'light|dark|auto',
    language: 'en|zh-CN|ja'
  }
});
```

---

## 🎯 实际应用场景

### 用户管理系统

```javascript
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  role: 'admin|moderator|user|guest!',
  status: 'active|inactive|suspended|banned',
  emailVerified: 'true|false',
  permissionLevel: '0|1|2|3|4|5'.default(0),
  preferences: {
    theme: 'light|dark|auto',
    language: 'en|zh-CN|zh-TW|ja|ko',
    notifications: 'all|mentions|none'
  }
});
```

### 订单管理

```javascript
const orderSchema = dsl({
  orderId: 'string!',
  status: 'pending|processing|completed|cancelled!',
  priority: '1|2|3'.default(2),
  payment: {
    method: 'card|paypal|crypto!',
    status: 'pending|success|failed!'
  }
});
```

### 内容管理

```javascript
const postSchema = dsl({
  title: 'string:5-100!',
  status: 'draft|published|archived!',
  visibility: 'public|private|unlisted',
  category: 'tech|business|lifestyle|education'
});
```

---

## ⚙️ 高级特性

### 默认值

```javascript
const schema = dsl({
  theme: 'light|dark|auto'.default('auto'),
  language: 'en|zh-CN'.default('en')
});
```

### 自定义错误消息

#### 统一使用 'enum' 键（推荐）✅

所有枚举类型统一使用 `'enum'` 定义错误消息，最简单直接：

```javascript
// 字符串枚举
const schema = dsl({
  status: dsl('active|inactive|pending').messages({
    'enum': '状态必须是: 激活、未激活或待处理'
  })
});

// 布尔值枚举
const schema = dsl({
  isActive: dsl('true|false').messages({
    'enum': '必须是 true 或 false'
  })
});

// 数字枚举
const schema = dsl({
  priority: dsl('1|2|3').messages({
    'enum': '优先级必须是 1、2 或 3'
  })
});

// 整数枚举
const schema = dsl({
  level: dsl('enum:integer:1|2|3').messages({
    'enum': '等级必须是 1、2 或 3'
  })
});
```

**说明**: 
- ✅ 所有枚举类型统一使用 `'enum'` 键
- ✅ 简单易懂，不需要记忆不同类型的键名
- ✅ 自动推断类型，用户只关心错误提示内容

#### 高级用法：按类型定制消息（可选）

如果需要为不同类型的枚举定制不同的错误消息，可以使用 `type.enum` 格式：

```javascript
const schema = dsl({
  status: dsl('active|inactive').messages({
    'string.enum': '字符串枚举错误'  // 字符串枚举专用
  }),
  priority: dsl('1|2|3').messages({
    'number.enum': '数字枚举错误'    // 数字枚举专用
  }),
  flag: dsl('true|false').messages({
    'boolean.enum': '布尔枚举错误'   // 布尔枚举专用
  })
});
```

**优先级**: `type.enum` > `enum` > 全局默认

**建议**: 99% 的场景直接使用 `'enum'` 就够了 ✅

### 多语言支持

```javascript
dsl.config({
  i18n: {
    'zh-CN': {
      'field.status': '状态',
      'enum.status': '状态必须是: 激活、未激活或待处理'
    }
  }
});

const schema = dsl({
  status: dsl('active|inactive|pending').label('field.status')
});
```

---

## 🔍 类型识别规则

### 自动识别逻辑

```javascript
// 1. 所有值都是 'true' 或 'false' → 布尔值枚举
'true|false'  → { type: 'boolean', enum: [true, false] }

// 2. 所有值都是数字 → 数字枚举
'1|2|3'  → { type: 'number', enum: [1, 2, 3] }

// 3. 包含小数 → 数字枚举
'1.0|1.5|2.0'  → { type: 'number', enum: [1.0, 1.5, 2.0] }

// 4. 其他情况 → 字符串枚举
'active|inactive'  → { type: 'string', enum: ['active', 'inactive'] }
```

### 显式指定类型

```javascript
// 强制字符串类型（即使值看起来像数字）
'enum:string:1|2|3'  → { type: 'string', enum: ['1', '2', '3'] }

// 强制布尔值类型
'enum:boolean:true|false'  → { type: 'boolean', enum: [true, false] }

// 强制数字类型
'enum:number:1|2|3'  → { type: 'number', enum: [1, 2, 3] }

// 强制整数类型（禁止小数）
'enum:integer:1|2|3'  → { type: 'integer', enum: [1, 2, 3] }
```

---

## ❌ 错误处理

### 无效的枚举值

```javascript
// 布尔值枚举只接受 'true' 和 'false'
try {
  dsl({ flag: 'enum:boolean:true|false|maybe' });
} catch (error) {
  // Error: Invalid boolean enum value: maybe
}

// 数字枚举只接受数字
try {
  dsl({ value: 'enum:number:1|2|abc' });
} catch (error) {
  // Error: Invalid number enum value: abc
}
```

### 类型不匹配

枚举会自动进行类型验证：

```javascript
const schema = dsl({ priority: '1|2|3' });

// 错误：传入字符串
validate(schema, { priority: '1' });
// ❌ 失败: priority 必须是数字类型（自动类型检查）

// 错误：传入超出范围的数字
validate(schema, { priority: 999 });
// ❌ 失败: priority 必须是以下值之一: 1, 2, 3（枚举检查）
```

**说明**: 
- 类型错误由 schema 自动验证（如传入字符串给数字枚举）
- 枚举范围错误统一使用 `'enum'` 错误消息

---

## 📊 性能

枚举验证性能优异：

```javascript
const schema = dsl({
  status: 'active|inactive|pending',
  priority: '1|2|3',
  flag: 'true|false'
});

// 性能测试：10,000 次验证
// 平均每秒验证: 270,000+ 次
```

---

## 🔄 兼容性

### 与旧版本兼容

```javascript
// v1.0.x 语法（仍然支持）
'value1|value2|value3'

// v1.1.0 新增语法
'enum:value1|value2|value3'
'enum:type:value1|value2|value3'
```

### 不影响其他类型

```javascript
// 带冒号的其他类型不受影响
const schema = dsl({
  username: 'string:3-32',     // ✅ 正常工作
  age: 'number:18-120',        // ✅ 正常工作
  phone: 'phone:cn',           // ✅ 正常工作
  status: 'active|inactive'    // ✅ 枚举正常工作
});
```

---

## 📖 相关文档

- [基础用法](./README.md)
- [验证规则](./docs/validation.md)
- [API 参考](./docs/api.md)
- [示例代码](../examples/enum.examples.js)

---

## 🆕 更新日志

### v1.1.0 (2025-12-31)

- ✨ 新增枚举功能
- ✨ 支持字符串、布尔值、数字、整数枚举
- ✨ 支持 `enum:` 前缀语法
- ✨ 支持 `enum:type:values` 格式
- ✨ 自动类型识别
- ✨ 支持枚举必填标记

---

**文档生成时间**: 2025-12-31  
**版本**: v1.1.0

