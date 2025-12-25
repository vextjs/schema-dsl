# DSL 语法完整指南

> **版本**: v1.0.1  
> **更新时间**: 2025-12-25  
> **适用于**: SchemaIO 1.0+  
> **文档长度**: 2815行 - 完整覆盖所有DSL语法  

---

## 📑 目录导航

### 📖 快速入口
- [概述](#概述) - DSL 核心特性和设计原则（**推荐先读**）
- [完整类型支持列表](#完整类型支持列表) - 所有支持的类型一览
- [快速示例](#快速示例) - 5分钟上手
- [语法速查表](#语法速查表) - 快速查询语法（**常用**）

---

### 🎯 基础语法（必读）
- [基本类型](#基本类型) - 字符串、数字、布尔等6种基础类型
  - [字符串类型](#字符串类型)
  - [数字类型](#数字类型)
  - [整数类型](#整数类型)
  - [布尔类型](#布尔类型)
  - [数组类型](#数组类型)
  - [对象类型](#对象类型)
- [约束条件](#约束条件) - 长度、范围、枚举约束
  - [字符串长度范围](#字符串长度范围)
  - [数字范围](#数字范围)
  - [数组长度](#数组长度)
- [必填标记](#必填标记) - 使用 `!` 标记必填
- [格式类型](#格式类型) - email、url、uuid、date等内置格式

---

### 🚀 高级功能
- [枚举值](#枚举值) - 使用 `|` 定义枚举
- [数组类型](#数组类型-1) - array<type> 语法详解
- [嵌套对象](#嵌套对象) - 无限层级嵌套支持
- [高级特性](#高级特性) - 混合使用、动态生成等

---

### ⚠️ 限制与解决方案
- [边界情况和限制](#边界情况和限制) - 5大限制及原因（**重要**）
- [为什么不支持某些功能](#为什么不支持某些功能) - 设计理念解释
- [优雅的扩展方案](#优雅的扩展方案) - 如何突破限制

---

### 💡 实践指南
- [完整示例](#完整示例) - 4个真实业务场景
  - [用户注册表单](#用户注册表单)
  - [商品信息Schema](#商品信息schema)
  - [订单系统Schema](#订单系统schema)
  - [API请求验证](#api请求验证)
- [最佳实践](#最佳实践) - 推荐的使用方式
- [常见问题](#常见问题) - FAQ

---

### 📚 参考资料
- [相关文档](#相关文档) - 其他文档链接
- [API参考](#api参考) - 完整API说明

---

## 概述

SchemaIO 提供了一套简洁优雅的 DSL（Domain Specific Language）语法，用于快速定义 JSON Schema。

### 设计原则

DSL 语法遵循三大核心原则：

1. **简洁性** - 用最少的字符表达完整的Schema定义
2. **直观性** - 语法接近自然语言，一看就懂
3. **易学性** - 5分钟上手，无需深入学习JSON Schema

### 核心特性

- ✅ **基础类型**: 6种基础类型 + 3种简写形式/类型
- ✅ **约束条件**: 支持长度/范围/枚举约束
- ✅ **必填标记**: 使用 `!` 标记必填字段
- ✅ **格式类型**: 内置 email/url/uuid/date 格式
- ✅ **数组支持**: `array<type>` 语法，支持嵌套约束
- ✅ **对象嵌套**: 支持无限层级嵌套对象
- ✅ **类型别名**: 每种类型提供多个简写形式

### 完整类型支持列表

| 基础类型 | 简写1 | 简写2 | 简写3 | JSON Schema类型 |
|---------|------|------|------|----------------|
| `string` | `s` | `str` | - | `string` |
| `number` | `n` | `num` | - | `number` |
| `integer` | `int` | `i` | - | `integer` |
| `boolean` | `bool` | `b` | - | `boolean` |
| `object` | `obj` | `o` | - | `object` |
| `array` | `arr` | `a` | - | `array` |
| `email` | - | - | - | `string` + format |
| `url` | - | - | - | `string` + format |
| `uuid` | - | - | - | `string` + format |
| `date` | - | - | - | `string` + format |

---

## 快速示例

```javascript
const { dsl } = require('schemaio');

// 简单字段定义
const usernameSchema = dsl('string:3-32!');

// 复杂对象定义
const userSchema = dsl({
  username: 'string:3-32!',      // 必填字符串，长度3-32
  email: 'email!',                // 必填邮箱
  age: 'number:18-120',           // 可选数字，范围18-120
  gender: 'male|female|other',    // 枚举值
  status: 'active|inactive',      // 枚举值
  tags: 'array<string:1-20>',     // 字符串数组
  profile: {
    bio: 'string:500',            // 可选字符串，最大500字符
    website: 'url',               // URL格式
    avatar: 'url'
  }
});
```

---

## 基本类型

### 字符串类型

```javascript
'string'      // 字符串
's'           // 简写
'str'         // 简写
```

**示例**：
```javascript
dsl('string')   // { type: 'string' }
dsl('s')        // { type: 'string' }
```

### 数字类型

```javascript
'number'      // 数字（整数或小数）
'n'           // 简写
'num'         // 简写
```

**示例**：
```javascript
dsl('number')   // { type: 'number' }
dsl('n')        // { type: 'number' }
```

### 整数类型

```javascript
'integer'     // 整数
'int'         // 简写
'i'           // 简写
```

**示例**：
```javascript
dsl('integer')  // { type: 'integer' }
dsl('int')      // { type: 'integer' }
```

### 布尔类型

```javascript
'boolean'     // 布尔值
'bool'        // 简写
'b'           // 简写
```

**示例**：
```javascript
dsl('boolean')  // { type: 'boolean' }
dsl('b')        // { type: 'boolean' }
```

### 数组类型

```javascript
'array'       // 数组
'arr'         // 简写
'a'           // 简写
```

**示例**：
```javascript
dsl('array')    // { type: 'array' }
```

### 对象类型

```javascript
'object'      // 对象
'obj'         // 简写
'o'           // 简写
```

**示例**：
```javascript
dsl('object')   // { type: 'object' }
```

---

## 约束条件

### 字符串长度范围

```javascript
'string:min-max'    // 长度范围（最小-最大）
'string:max'        // 最大长度（简写）
'string:min-'       // 最小长度（无最大限制）
'string:-max'       // 最大长度（明确写法，与简写等价）
```

**示例**：
```javascript
dsl('string:3-32')   // { type: 'string', minLength: 3, maxLength: 32 }
dsl('string:100')    // { type: 'string', maxLength: 100 }  // 简写
dsl('string:-100')   // { type: 'string', maxLength: 100 }  // 明确写法
dsl('string:10-')    // { type: 'string', minLength: 10 }   // 只限最小
dsl('s:1-50')        // { type: 'string', minLength: 1, maxLength: 50 }
```

**语法规则**：
- `type:max` → 最大值（简写，最常用）
- `type:min-max` → 范围（最小-最大）
- `type:min-` → 只限制最小值
- `type:-max` → 只限制最大值（与简写等价，明确表达意图）

### 数字范围

```javascript
'number:min-max'    // 数值范围（最小-最大）
'number:max'        // 最大值（简写）
'number:min-'       // 最小值（无最大限制）
'number:-max'       // 最大值（明确写法）
```

**示例**：
```javascript
dsl('number:0-100')  // { type: 'number', minimum: 0, maximum: 100 }
dsl('number:999')    // { type: 'number', maximum: 999 }    // 简写
dsl('number:-999')   // { type: 'number', maximum: 999 }    // 明确写法
dsl('number:18-')    // { type: 'number', minimum: 18 }     // 只限最小
dsl('int:1-10')      // { type: 'integer', minimum: 1, maximum: 10 }
```

### 数组长度范围

```javascript
'array:min-max'     // 数组长度范围（最小-最大）
'array:max'         // 最大长度（简写）
'array:min-'        // 最小长度（无最大限制）
'array:-max'        // 最大长度（明确写法）
```

**示例**：
```javascript
dsl('array:1-10')    // { type: 'array', minItems: 1, maxItems: 10 }
dsl('array:100')     // { type: 'array', maxItems: 100 }   // 简写
dsl('array:-100')    // { type: 'array', maxItems: 100 }   // 明确写法
dsl('array:1-')      // { type: 'array', minItems: 1 }     // 只限最小
```

---

## 必填标记

在类型定义后添加 `!` 表示必填字段。

```javascript
'string!'           // 必填字符串
'string:3-32!'      // 必填字符串，长度3-32
'email!'            // 必填邮箱
'number:0-100!'     // 必填数字，范围0-100
```

**示例**：
```javascript
const schema = dsl({
  username: 'string!',      // 必填
  age: 'number'             // 可选
});

// 结果：
// {
//   type: 'object',
//   properties: {
//     username: { type: 'string' },
//     age: { type: 'number' }
//   },
//   required: ['username']
// }
```

---

## 格式类型

### 邮箱格式

```javascript
'email'       // 邮箱格式（等价于 string + format: 'email'）
```

**示例**：
```javascript
dsl('email')    // { type: 'string', format: 'email' }
dsl('email!')   // 必填邮箱
```

### URL 格式

```javascript
'url'         // URL格式（等价于 string + format: 'uri'）
```

**示例**：
```javascript
dsl('url')      // { type: 'string', format: 'uri' }
dsl('url!')     // 必填URL
```

### UUID 格式

```javascript
'uuid'        // UUID格式
```

**示例**：
```javascript
dsl('uuid')     // { type: 'string', format: 'uuid' }
dsl('uuid!')    // 必填UUID
```

### 日期格式

```javascript
'date'        // 日期时间格式（ISO 8601）
```

**示例**：
```javascript
dsl('date')     // { type: 'string', format: 'date-time' }
dsl('date!')    // 必填日期
```

---

## 枚举值

使用 `|` 分隔多个枚举值。

```javascript
'value1|value2|value3'
```

**示例**：
```javascript
dsl('active|inactive|pending')
// {
//   type: 'string',
//   enum: ['active', 'inactive', 'pending']
// }

const schema = dsl({
  status: 'active|inactive',
  role: 'user|admin|moderator',
  gender: 'male|female|other'
});
```

**支持空格**（会自动去除）：
```javascript
dsl('a | b | c')    // enum: ['a', 'b', 'c']
```

---

## 数组类型

使用 `array<itemType>` 语法定义数组元素类型。

### 简单数组

```javascript
'array<string>'         // 字符串数组
'array<number>'         // 数字数组
'array<boolean>'        // 布尔值数组
```

**示例**：
```javascript
dsl('array<string>')
// {
//   type: 'array',
//   items: { type: 'string' }
// }
```

### 带约束的数组

```javascript
'array<string:1-20>'    // 字符串数组，每项长度1-20
'array<number:0-100>'   // 数字数组，每项范围0-100
'array<int:1-10>'       // 整数数组，每项范围1-10
```

**示例**：
```javascript
dsl('array<string:1-20>')
// {
//   type: 'array',
//   items: {
//     type: 'string',
//     minLength: 1,
//     maxLength: 20
//   }
// }

dsl('array<number:0-100>')
// {
//   type: 'array',
//   items: {
//     type: 'number',
//     minimum: 0,
//     maximum: 100
//   }
// }
```

### 数组长度约束

```javascript
// 数组长度 + 元素约束
const schema = dsl({
  tags: 'array<string:1-20>'  // 元素约束
});

// 如果还需要数组长度约束，需要分步定义：
const { DslAdapter } = require('schemaio');
const schema = {
  type: 'array',
  items: DslAdapter.parse('string:1-20'),
  minItems: 1,
  maxItems: 10
};
```

---

## 嵌套对象

DSL 支持**无限层级**的对象嵌套定义，让复杂数据结构的定义变得简单。

### 基础嵌套（2层）

```javascript
const schema = dsl({
  user: {
    name: 'string:1-100!',
    email: 'email!'
  }
});
```

**生成的 Schema**：
```javascript
{
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' }
      },
      required: ['name', 'email']
    }
  }
}
```

### 多层嵌套（3-4层）

```javascript
const schema = dsl({
  user: {
    name: 'string:1-100!',
    email: 'email!',
    profile: {
      bio: 'string:500',
      website: 'url',
      social: {
        twitter: 'string:1-50',
        github: 'string:1-100',
        linkedin: 'url'
      }
    }
  }
});
```

### 嵌套对象 + 数组

```javascript
const schema = dsl({
  company: {
    name: 'string:1-200!',
    employees: 'array<string>',  // 字符串数组
    departments: {
      engineering: {
        head: 'string!',
        members: 'array<string>',
        projects: 'array<string:1-100>'
      },
      marketing: {
        head: 'string!',
        members: 'array<string>',
        campaigns: 'array<string>'
      }
    }
  }
});
```

### 嵌套对象 + 枚举

```javascript
const schema = dsl({
  order: {
    id: 'string!',
    status: 'pending|processing|shipped|delivered|cancelled',
    customer: {
      name: 'string!',
      email: 'email!',
      type: 'individual|business|government',
      address: {
        country: 'string:2!',  // 国家代码
        state: 'string:50',
        city: 'string:100!',
        zipCode: 'string:10!',
        street: 'string:200!'
      }
    },
    payment: {
      method: 'credit_card|debit_card|paypal|bank_transfer',
      status: 'pending|completed|failed|refunded',
      amount: 'number:0-999999!'
    }
  }
});
```

### 嵌套对象的必填标记

嵌套对象中的必填标记 `!` **只对该对象内的字段生效**：

```javascript
const schema = dsl({
  user: {
    // user 对象本身不是必填的
    name: 'string!',      // 但如果有 user，name 必填
    email: 'email!',      // 如果有 user，email 必填
    age: 'number'         // age 可选
  },
  profile: {
    bio: 'string'         // profile 对象可选，bio 也可选
  }
});

// 如果要让 user 对象本身必填，需要在外层定义
const schema2 = {
  type: 'object',
  properties: {
    user: dsl({
      name: 'string!',
      email: 'email!'
    })
  },
  required: ['user']  // user 对象必填
};
```

### 复杂嵌套示例：社交网络用户

```javascript
const socialUserSchema = dsl({
  // 基本信息
  id: 'uuid!',
  username: 'string:3-32!',
  email: 'email!',
  status: 'active|inactive|suspended|deleted',
  
  // 个人资料（嵌套对象）
  profile: {
    displayName: 'string:1-100!',
    bio: 'string:500',
    avatar: 'url',
    cover: 'url',
    birthday: 'date',
    gender: 'male|female|other|prefer_not_to_say',
    location: {
      country: 'string:2',
      city: 'string:100',
      timezone: 'string:50'
    },
    // 社交链接（嵌套对象）
    social: {
      website: 'url',
      blog: 'url',
      twitter: 'string:1-50',
      github: 'string:1-100',
      linkedin: 'url',
      instagram: 'string:1-50'
    }
  },
  
  // 隐私设置（嵌套对象）
  privacy: {
    profileVisibility: 'public|friends|private',
    showEmail: 'boolean',
    showBirthday: 'boolean',
    allowMessages: 'boolean',
    allowFriendRequests: 'boolean',
    searchable: 'boolean'
  },
  
  // 通知设置（深层嵌套）
  notifications: {
    email: {
      enabled: 'boolean!',
      newFollower: 'boolean',
      newComment: 'boolean',
      newLike: 'boolean',
      mentions: 'boolean'
    },
    push: {
      enabled: 'boolean!',
      newFollower: 'boolean',
      newComment: 'boolean',
      newLike: 'boolean',
      mentions: 'boolean'
    },
    sms: {
      enabled: 'boolean!',
      securityAlerts: 'boolean!'
    }
  },
  
  // 统计数据（嵌套对象）
  stats: {
    followers: 'integer:0-999999999',
    following: 'integer:0-999999999',
    posts: 'integer:0-999999999',
    likes: 'integer:0-999999999'
  },
  
  // 标签数组
  interests: 'array<string:1-50>',
  
  // 时间戳
  createdAt: 'date!',
  updatedAt: 'date!',
  lastLoginAt: 'date'
});
```

**生成的 Schema**（部分）：

```javascript
const schema = dsl({
  user: {
    name: 'string:1-100!',
    email: 'email!',
    profile: {
      bio: 'string:500',
      website: 'url',
      location: 'string:100'
    }
  },
  settings: {
    language: 'en|zh|ja|ko',
    theme: 'light|dark|auto',
    notifications: {
      email: 'boolean',
      sms: 'boolean',
      push: 'boolean'
    }
  }
});
```

**生成的 Schema**：
```javascript
{
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        profile: {
          type: 'object',
          properties: {
            bio: { type: 'string', maxLength: 500 },
            website: { type: 'string', format: 'uri' },
            location: { type: 'string', maxLength: 100 }
          }
        }
      },
      required: ['name', 'email']
    },
    settings: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['en', 'zh', 'ja', 'ko'] },
        theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
        notifications: {
          type: 'object',
          properties: {
            email: { type: 'boolean' },
            sms: { type: 'boolean' },
            push: { type: 'boolean' }
          }
        }
      }
    }
  }
}
```

---

## 高级特性

### 特性 1: 混合使用类型和简写

```javascript
const schema = dsl({
  // 混合使用完整类型和简写
  username: 'string:3-32!',     // 完整写法
  age: 'n:0-150',               // 简写
  email: 'email!',              // 格式类型
  active: 'b',                  // 简写
  tags: 'array<s:1-20>',        // 数组+简写
  role: 'user|admin'            // 枚举
});
```

### 特性 2: 数组嵌套

```javascript
// 字符串数组
const tags = dsl('array<string:1-50>');

// 数字数组（带范围）
const scores = dsl('array<number:0-100>');

// 枚举数组
const roles = dsl('array<user|admin|moderator>');  // ❌ 不支持

// 枚举数组的正确写法
const rolesSchema = {
  type: 'array',
  items: {
    type: 'string',
    enum: ['user', 'admin', 'moderator']
  }
};
```

### 特性 3: 对象数组（需要组合方式）

DSL 不直接支持对象数组，需要组合使用：

```javascript
const { DslAdapter } = require('schemaio');

// 定义单个对象 Schema
const itemSchema = dsl({
  id: 'string!',
  name: 'string:1-100!',
  price: 'number:0-999999!'
});

// 包装为数组
const itemsArraySchema = {
  type: 'array',
  items: itemSchema,
  minItems: 1,
  maxItems: 100
};

// 或者直接在对象中使用
const orderSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: dsl({
        id: 'string!',
        name: 'string:1-100!',
        quantity: 'integer:1-999!'
      })
    }
  }
};
```

### 特性 4: 组合 DSL 和 JSON Schema

DSL 可以与标准 JSON Schema 混合使用：

```javascript
const schema = {
  type: 'object',
  properties: {
    // 使用 DSL
    username: dsl('string:3-32!'),
    email: dsl('email!'),
    
    // 使用标准 JSON Schema（复杂场景）
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$'  // 密码强度正则
    },
    
    // 使用 anyOf（DSL 不支持）
    contactMethod: {
      anyOf: [
        { type: 'string', format: 'email' },
        { type: 'string', pattern: '^\\+?[1-9]\\d{1,14}$' }  // 国际电话号码
      ]
    }
  },
  required: ['username', 'email', 'password']
};
```

### 特性 5: 动态生成 Schema

```javascript
// 根据配置动态生成
function generateUserSchema(options = {}) {
  const schema = {
    username: 'string:3-32!',
    email: 'email!'
  };
  
  if (options.requirePhone) {
    schema.phone = 'string:10-15!';
  }
  
  if (options.includeProfile) {
    schema.profile = {
      bio: 'string:500',
      avatar: 'url'
    };
  }
  
  return dsl(schema);
}

// 使用
const basicSchema = generateUserSchema();
const fullSchema = generateUserSchema({ 
  requirePhone: true, 
  includeProfile: true 
});
```

---

## 边界情况和限制

### 限制 1: 不支持正则表达式

DSL 不支持自定义正则模式，需要使用 JSON Schema：

```javascript
// ❌ DSL 不支持
const schema = dsl('string:/^[a-z]+$/');

// ✅ 正确：使用 JSON Schema
const schema = {
  type: 'string',
  pattern: '^[a-z]+$'
};
```

### 限制 2: 不支持 anyOf/oneOf/allOf

DSL 不支持逻辑组合，需要使用 JSON Schema：

```javascript
// ❌ DSL 不支持
const schema = dsl('string|number');  // 这会被解析为枚举

// ✅ 正确：使用 JSON Schema
const schema = {
  anyOf: [
    { type: 'string' },
    { type: 'number' }
  ]
};
```

### 限制 3: 不支持 nullable

DSL 不支持 nullable，需要使用 JSON Schema：

```javascript
// ❌ DSL 不支持
const schema = dsl('string?');

// ✅ 正确：使用 JSON Schema
const schema = {
  type: ['string', 'null']
};
```

### 限制 4: 不支持条件验证（if/then/else）

```javascript
// ❌ DSL 不支持
// ✅ 使用 JSON Schema
const schema = {
  type: 'object',
  properties: {
    country: { type: 'string' },
    postalCode: { type: 'string' }
  },
  if: {
    properties: { country: { const: 'US' } }
  },
  then: {
    properties: { postalCode: { pattern: '^\\d{5}$' } }
  }
};
```

### 限制 5: 数组长度约束需要组合方式

DSL 中 `array<type>` 只定义元素类型，数组长度需要额外定义：

```javascript
// DSL 只定义元素类型
const schema = dsl('array<string:1-20>');
// 结果: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 20 } }

// 如果还需要数组长度约束
const schemaWithLength = {
  ...dsl('array<string:1-20>'),
  minItems: 1,
  maxItems: 10
};
```

### 边界情况 1: 枚举值中的特殊字符

```javascript
// ✅ 支持：空格会被自动去除
dsl('a | b | c')  // enum: ['a', 'b', 'c']

// ⚠️ 注意：特殊字符需要避免
dsl('a|b:c')      // ❌ 冒号会干扰解析
dsl('a|b!c')      // ❌ 感叹号会干扰解析

// ✅ 解决方案：使用 JSON Schema
{
  type: 'string',
  enum: ['a', 'b:c', 'b!c']
}
```

### 边界情况 2: 嵌套层级建议

```javascript
// ✅ 推荐：2-3层嵌套（可读性好）
const schema = dsl({
  user: {
    profile: {
      name: 'string!'
    }
  }
});

// ⚠️ 可以但不推荐：4-5层嵌套（开始难读）
const schema = dsl({
  a: { b: { c: { d: { e: 'string' } } } }
});

// ❌ 避免：6层以上（严重影响可读性）
// 建议拆分为多个 Schema
```

---

## 为什么不支持某些功能

### 设计理念：简洁 > 完整

DSL 的核心目标是**快速表达常见的80%场景**，而不是覆盖100%的JSON Schema功能。这是一个刻意的设计权衡。

#### 不支持的功能及原因

| 功能 | 不支持的原因 | JSON Schema复杂度 | 使用频率 |
|------|------------|-----------------|---------|
| **正则表达式** | 破坏简洁性，难以在字符串中表达 | ⭐⭐⭐ | ⭐⭐⭐ |
| **anyOf/oneOf/allOf** | 逻辑组合增加学习成本 | ⭐⭐⭐⭐ | ⭐⭐ |
| **nullable** | 与JSON Schema的type数组语法冲突 | ⭐⭐ | ⭐⭐⭐ |
| **条件验证（if/then/else）** | 需要复杂的语法结构 | ⭐⭐⭐⭐⭐ | ⭐ |
| **数组长度约束** | 避免语法歧义（:min-max已用于元素） | ⭐⭐ | ⭐⭐⭐ |
| **自定义错误消息** | DSL专注结构定义，消息属于验证层 | ⭐⭐ | ⭐⭐⭐⭐ |
| **依赖关系（dependencies）** | 使用场景极少，复杂度高 | ⭐⭐⭐⭐⭐ | ⭐ |

#### 为什么不支持正则表达式？

**问题**: 正则表达式包含特殊字符（`/`, `^`, `$`, `|` 等），与DSL的分隔符冲突。

```javascript
// ❌ 语法冲突示例
'string:/^[a-z]+$/'  // "/" 和正则语法混淆
'string:^[a-z]+$'    // ":" 用于约束，"^" 难以解析
'string|/pattern/'   // "|" 用于枚举，无法区分
```

**设计决策**: 保持DSL简洁，复杂模式使用JSON Schema。

#### 为什么不支持 anyOf/oneOf？

**问题**: 逻辑组合需要嵌套结构，破坏DSL的平面化设计。

```javascript
// ❌ 如果支持，语法会变得复杂
'(string|number)&email'  // 难以理解
'string OR number AND length>5'  // 类似SQL，学习成本高
```

**设计决策**: DSL专注简单场景，复杂类型组合使用JSON Schema。

#### 为什么不支持 nullable？

**问题**: `null` 是JavaScript的值，不是类型。JSON Schema使用 `type: ['string', 'null']` 表达。

```javascript
// ❌ 潜在的歧义
'string?'  // 可选字段？还是可为null？
'string|null'  // 与枚举语法冲突
```

**设计决策**: 使用 `!` 标记必填，不标记则为可选。null值通过JSON Schema表达。

#### 为什么不支持条件验证？

**问题**: if/then/else 需要复杂的语法结构，与DSL的简洁性冲突。

```javascript
// ❌ 假设的语法（过于复杂）
'string IF country=US THEN pattern:/^\d{5}$/'
'if(country==US){zipCode:string:5}else{zipCode:string}'
```

**设计决策**: 条件验证使用JSON Schema或Joi风格API（支持when()方法）。

#### 为什么不支持数组长度约束？

**问题**: `:min-max` 已用于元素约束，再用于数组长度会产生歧义。

```javascript
// ❌ 歧义示例
'array<string:1-20>:1-10'  // 难以理解：元素长度1-20，数组长度1-10？
'array:1-10<string:1-20>'  // 语法不一致
```

**设计决策**: 元素约束在 `<>` 内，数组长度通过对象合并添加。

---

## 优雅的扩展方案

虽然DSL有限制，但SchemaIO提供了**多种优雅的方式突破限制**，保持代码可读性。

### 方案1: DSL + JSON Schema 混合使用 ⭐⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐⭐（最推荐）

将DSL用于简单字段，JSON Schema用于复杂字段。

```javascript
const { dsl } = require('schemaio');

const userSchema = {
  type: 'object',
  properties: {
    // ✅ 简单字段：使用DSL
    username: dsl('string:3-32!'),
    email: dsl('email!'),
    age: dsl('number:18-120'),
    
    // ✅ 复杂字段：使用JSON Schema
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',  // 密码强度正则
      description: '密码必须包含大小写字母和数字'
    },
    
    // ✅ 条件验证：使用JSON Schema
    zipCode: {
      type: 'string',
      if: { 
        properties: { country: { const: 'US' } } 
      },
      then: { 
        pattern: '^\\d{5}(-\\d{4})?$' 
      }
    }
  },
  required: ['username', 'email', 'password']
};
```

**优点**:
- ✅ 充分发挥DSL的简洁性
- ✅ 保留JSON Schema的完整功能
- ✅ 代码清晰易读
- ✅ 无学习成本

---

### 方案2: 使用 Joi 风格 API ⭐⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐⭐（最推荐）

SchemaIO的Joi风格API支持所有高级功能，包括条件验证、自定义消息等。

```javascript
const { types } = require('schemaio');
const { ref } = require('schemaio/lib/core/Ref');
const Locale = require('schemaio/lib/core/Locale');

// 设置中文
Locale.setLocale('zh-CN');

const userSchema = types.object({
  // ✅ 基础验证
  username: types.string()
    .min(3)
    .max(32)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'string.min': '{{#label}}长度不能少于{{#limit}}个字符',
      'string.pattern': '{{#label}}只能包含字母、数字和下划线'
    })
    .required(),
  
  // ✅ 密码强度验证
  password: types.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'string.pattern': '{{#label}}必须包含大小写字母和数字'
    })
    .required(),
  
  // ✅ 密码确认（字段引用）
  confirmPassword: types.string()
    .valid(ref('password'))
    .label('确认密码')
    .messages({
      'string.enum': '两次输入的密码不一致'
    })
    .required(),
  
  // ✅ 条件验证
  contactType: types.string()
    .valid('email', 'phone')
    .required(),
  
  contact: types.string()
    .when('contactType', {
      is: 'email',
      then: types.string().email(),
      otherwise: types.string().pattern(/^\d{11}$/)
    })
    .required(),
  
  // ✅ 自定义异步验证
  username: types.string()
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) {
        return { error: 'username.exists', message: '用户名已被占用' };
      }
      return true;
    })
});
```

**优点**:
- ✅ 支持所有高级功能（when/ref/custom）
- ✅ 链式调用，代码流畅
- ✅ 错误消息定制
- ✅ 多语言支持
- ✅ 100%对齐Joi API

**何时使用**: 需要复杂验证逻辑、自定义消息、条件验证时。

---

### 方案3: 对象合并扩展 DSL ⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐

通过对象展开语法扩展DSL生成的Schema。

```javascript
const { dsl } = require('schemaio');

// ✅ 扩展数组长度约束
const tagsSchema = {
  ...dsl('array<string:1-50>'),
  minItems: 1,
  maxItems: 20,
  uniqueItems: true  // 元素唯一
};

// ✅ 添加正则模式
const usernameSchema = {
  ...dsl('string:3-32!'),
  pattern: '^[a-zA-Z0-9_]+$',
  description: '只能包含字母、数字和下划线'
};

// ✅ 添加自定义关键字
const emailSchema = {
  ...dsl('email!'),
  format: 'email',
  errorMessage: {  // 使用 ajv-errors 插件
    format: '邮箱格式不正确'
  }
};

// ✅ 完整示例
const userSchema = {
  type: 'object',
  properties: {
    username: {
      ...dsl('string:3-32!'),
      pattern: '^[a-zA-Z0-9_]+$'
    },
    tags: {
      ...dsl('array<string:1-50>'),
      minItems: 1,
      maxItems: 20
    },
    role: {
      ...dsl('user|admin|moderator'),
      default: 'user'
    }
  },
  required: ['username']
};
```

**优点**:
- ✅ 保持DSL的简洁性
- ✅ 灵活添加额外约束
- ✅ 语法简单，易于理解
- ✅ 适合小范围扩展

**何时使用**: 需要在DSL基础上添加少量额外约束时。

---

### 方案4: 工厂函数封装常用模式 ⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐

将常用的复杂验证封装为可复用的工厂函数。

```javascript
const { dsl } = require('schemaio');

// ✅ 封装密码验证
function passwordField(options = {}) {
  return {
    type: 'string',
    minLength: options.minLength || 8,
    maxLength: options.maxLength || 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    description: options.description || '密码必须包含大小写字母和数字'
  };
}

// ✅ 封装手机号验证
function phoneField(country = 'CN') {
  const patterns = {
    CN: '^1[3-9]\\d{9}$',
    US: '^\\+?1?\\d{10}$',
    UK: '^\\+?44\\d{10}$'
  };
  
  return {
    type: 'string',
    pattern: patterns[country] || patterns.CN,
    description: `${country}手机号格式`
  };
}

// ✅ 封装可为null的字段
function nullableField(dslString) {
  const schema = dsl(dslString);
  return {
    anyOf: [
      schema,
      { type: 'null' }
    ]
  };
}

// ✅ 使用封装好的函数
const userSchema = {
  type: 'object',
  properties: {
    username: dsl('string:3-32!'),
    password: passwordField({ minLength: 10 }),
    phone: phoneField('CN'),
    middleName: nullableField('string:1-50')  // 可为null的字符串
  }
};
```

**优点**:
- ✅ 代码复用，减少重复
- ✅ 统一验证规则
- ✅ 易于维护和更新
- ✅ 团队内共享验证逻辑

**何时使用**: 有多个项目使用相同的验证模式时。

---

### 方案5: 使用 ajv-keywords 扩展 ⭐⭐⭐

**推荐指数**: ⭐⭐⭐

结合 ajv-keywords 插件添加额外的验证功能。

```javascript
const { dsl } = require('schemaio');
const Ajv = require('ajv');
const ajvKeywords = require('ajv-keywords');
const ajvErrors = require('ajv-errors');

const ajv = new Ajv({ allErrors: true });
ajvKeywords(ajv);
ajvErrors(ajv);

// ✅ 使用扩展关键字
const schema = {
  type: 'object',
  properties: {
    username: {
      ...dsl('string:3-32!'),
      pattern: '^[a-zA-Z0-9_]+$',
      // 使用 ajv-keywords 的 regexp 关键字
      regexp: {
        pattern: '^[a-zA-Z0-9_]+$',
        flags: 'i'
      }
    },
    age: {
      ...dsl('number:18-120!'),
      // 使用 ajv-keywords 的 range 关键字
      range: [18, 120],
      exclusiveRange: [17, 121]
    },
    email: {
      ...dsl('email!'),
      // 使用 ajv-keywords 的 transform 关键字
      transform: ['trim', 'toLowerCase']
    }
  },
  // 使用 ajv-errors 自定义错误消息
  errorMessage: {
    properties: {
      username: '用户名格式不正确',
      age: '年龄必须在18-120之间',
      email: '邮箱格式不正确'
    }
  }
};

const validate = ajv.compile(schema);
```

**优点**:
- ✅ 功能强大，扩展性好
- ✅ 社区生态支持
- ✅ 与DSL完美结合

**缺点**:
- ⚠️ 需要额外依赖
- ⚠️ 学习成本增加

**何时使用**: 需要使用ajv生态的特殊功能时。

---

### 方案对比总结

| 方案 | 简洁性 | 功能性 | 学习成本 | 推荐场景 |
|------|--------|--------|---------|---------|
| **DSL + JSON Schema** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 任何项目，最通用 |
| **Joi风格API** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 复杂验证、企业项目 |
| **对象合并** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 小范围扩展 |
| **工厂函数** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 代码复用 |
| **ajv-keywords** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 特殊需求 |

---

### 推荐组合方案

根据项目规模和复杂度选择合适的组合：

#### 小型项目（简单CRUD）

```javascript
// 主要使用 DSL + 偶尔混合 JSON Schema
const schema = dsl({
  name: 'string:1-100!',
  email: 'email!',
  age: 'number:18-120'
});
```

#### 中型项目（业务逻辑中等）

```javascript
// DSL + JSON Schema + 工厂函数
const userSchema = {
  type: 'object',
  properties: {
    username: dsl('string:3-32!'),
    password: passwordField(),  // 工厂函数
    phone: phoneField('CN')     // 工厂函数
  }
};
```

#### 大型项目（复杂业务）

```javascript
// Joi风格API + DSL（简单字段）
const { types } = require('schemaio');
const { dsl } = require('schemaio');

const userSchema = types.object({
  // 复杂验证：使用Joi风格
  username: types.string()
    .min(3)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .custom(checkUsernameExists)
    .messages({ ... }),
  
  // 简单验证：使用DSL（转为Joi）
  ...convertDslToJoi({
    age: 'number:18-120',
    gender: 'male|female|other'
  })
});
```

---

## 完整示例

### 示例 1: 用户注册表单

```javascript
const registerSchema = dsl({
  username: 'string:3-32!',
  password: 'string:8-64!',
  email: 'email!',
  age: 'number:18-120',
  gender: 'male|female|other',
  agree: 'boolean!'
});
```

### 示例 2: 电商商品

```javascript
const productSchema = dsl({
  id: 'string!',
  name: 'string:1-200!',
  description: 'string:1-1000',
  price: 'number:0-999999!',
  stock: 'integer:0-999999!',
  category: 'electronics|books|clothing|food',
  status: 'draft|published|archived',
  tags: 'array<string:1-50>',
  images: 'array<url>',
  seller: {
    id: 'string!',
    name: 'string:1-100!',
    rating: 'number:0-5'
  }
});
```

### 示例 3: 博客文章

```javascript
const articleSchema = dsl({
  id: 'string!',
  title: 'string:1-200!',
  content: 'string!',
  author: {
    id: 'string!',
    name: 'string:1-100!',
    email: 'email!',
    avatar: 'url'
  },
  category: 'tech|lifestyle|business|education',
  tags: 'array<string:1-50>',
  status: 'draft|published|archived',
  viewCount: 'integer:0-999999999',
  likeCount: 'integer:0-999999999',
  createdAt: 'date!',
  updatedAt: 'date!'
});
```

### 示例 4: API 配置

```javascript
const configSchema = dsl({
  api: {
    baseURL: 'url!',
    timeout: 'number:1000-60000',
    retryTimes: 'integer:0-5',
    headers: {
      'Content-Type': 'application/json|application/xml',
      'Accept-Language': 'en|zh|ja|ko'
    }
  },
  cache: {
    enabled: 'boolean!',
    ttl: 'number:0-86400000',
    maxSize: 'integer:0-1000'
  },
  logging: {
    level: 'debug|info|warn|error',
    output: 'console|file|both'
  }
});
```

---

## 语法速查表

| 语法 | 含义 | 示例 |
|------|------|------|
| `string` | 字符串类型 | `dsl('string')` |
| `number` | 数字类型 | `dsl('number')` |
| `integer` | 整数类型 | `dsl('integer')` |
| `boolean` | 布尔类型 | `dsl('boolean')` |
| `array` | 数组类型 | `dsl('array')` |
| `object` | 对象类型 | `dsl('object')` |
| `:min-max` | 范围约束 | `'string:3-32'` |
| `:max` | 最大值约束 | `'string:100'` |
| `!` | 必填标记 | `'string!'` |
| `email` | 邮箱格式 | `'email!'` |
| `url` | URL格式 | `'url'` |
| `uuid` | UUID格式 | `'uuid'` |
| `date` | 日期格式 | `'date!'` |
| `\|` | 枚举分隔符 | `'a\|b\|c'` |
| `array<type>` | 数组元素类型 | `'array<string>'` |
| `{}` | 嵌套对象 | `{ user: { name: 'string!' } }` |

---

## 最佳实践

### 实践 1: 使用简写提高可读性

```javascript
// ✅ 推荐：使用简写
const schema = dsl({
  name: 's:1-100!',
  age: 'n:0-150',
  active: 'b'
});

// ⚠️ 也可以：完整写法
const schema = dsl({
  name: 'string:1-100!',
  age: 'number:0-150',
  active: 'boolean'
});
```

### 实践 2: 合理使用枚举

```javascript
// ✅ 推荐：明确的状态定义
status: 'pending|processing|completed|failed'

// ❌ 不推荐：过多枚举值
status: 'a|b|c|d|e|f|g|h|i|j|k|l|m|n'  // 难以维护
```

### 实践 3: 嵌套不要过深

```javascript
// ✅ 推荐：2-3层嵌套
const schema = dsl({
  user: {
    profile: {
      name: 'string!'
    }
  }
});

// ⚠️ 避免：过深嵌套（>4层）
const schema = dsl({
  a: { b: { c: { d: { e: { f: 'string' } } } } }
});
```

---

## 边界情况和限制

### DSL的设计边界

DSL 是为**快速表达常见场景**而设计的，而不是替代 JSON Schema 的所有功能。了解这些限制能帮助您更好地使用 DSL。

#### 1. 不支持正则表达式

**原因**: 正则表达式包含特殊字符（`/`, `|`, `^` 等），与 DSL 的分隔符冲突，强行支持会破坏语法的简洁性。

```javascript
// ❌ DSL 不支持
'string:/^[a-z]+$/'  // 语法冲突

// ✅ 解决方案1: 使用对象合并
{
  ...dsl('string:1-50!'),
  pattern: '^[a-z]+$'
}

// ✅ 解决方案2: 使用 Joi 风格 API
types.string().min(1).max(50).pattern(/^[a-z]+$/).required()

// ✅ 解决方案3: 封装为工厂函数
function lowercaseString(min, max) {
  return {
    ...dsl(`string:${min}-${max}!`),
    pattern: '^[a-z]+$'
  };
}
```

---

#### 2. 不支持 anyOf/oneOf/allOf

**原因**: 逻辑组合需要嵌套结构，会使 DSL 变得复杂难懂，违背"简洁"原则。

```javascript
// ❌ DSL 不支持
'(string|number)&length>5'  // 过于复杂

// ✅ 解决方案: 使用 JSON Schema
{
  anyOf: [
    { type: 'string', minLength: 5 },
    { type: 'number', minimum: 5 }
  ]
}
```

---

#### 3. 不支持条件验证（if/then/else）

**原因**: 条件逻辑需要完整的表达式语法，会让 DSL 变成一门编程语言。

```javascript
// ❌ DSL 不支持
'if country=US then zipCode:string:5'

// ✅ 解决方案1: 使用 JSON Schema
{
  if: { properties: { country: { const: 'US' } } },
  then: { properties: { zipCode: { type: 'string', minLength: 5 } } }
}

// ✅ 解决方案2: 使用 Joi 风格 API（推荐）
types.string().when('country', {
  is: 'US',
  then: types.string().length(5),
  otherwise: types.string()
})
```

---

#### 4. 不支持 nullable

**原因**: `null` 是值而非类型，在 DSL 中难以与可选字段（`!` 标记）区分。

```javascript
// ❌ DSL 不支持
'string?'  // 可选字段？还是可为null？
'string|null'  // 与枚举语法冲突

// ✅ 解决方案1: 使用 JSON Schema
{
  anyOf: [
    { type: 'string' },
    { type: 'null' }
  ]
}

// ✅ 解决方案2: 封装为工具函数
function nullable(dslString) {
  return {
    anyOf: [
      dsl(dslString),
      { type: 'null' }
    ]
  };
}
```

---

#### 5. 数组长度约束语法有限

**原因**: `:min-max` 已用于数组元素约束，再用于数组长度会产生歧义。

```javascript
// ❌ DSL 不支持数组长度
'array<string>:1-10'  // 歧义：元素约束还是数组长度？

// ✅ 解决方案: 使用对象合并
{
  ...dsl('array<string:1-50>'),
  minItems: 1,
  maxItems: 10,
  uniqueItems: true  // 元素唯一
}
```

---

### 何时使用 DSL，何时使用 JSON Schema？

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 简单类型定义 | ✅ DSL | 简洁高效 |
| 基础约束（长度、范围） | ✅ DSL | 语法直观 |
| 枚举值 | ✅ DSL | 一目了然 |
| 嵌套对象 | ✅ DSL | 结构清晰 |
| 正则验证 | ⚠️ JSON Schema | DSL不支持 |
| 条件验证 | ⚠️ Joi API | 功能强大 |
| 复杂逻辑组合 | ⚠️ JSON Schema | DSL不支持 |
| 自定义错误消息 | ⚠️ Joi API | 多语言支持 |
| 字段引用（ref） | ⚠️ Joi API | DSL不支持 |

**黄金法则**: **80%场景用DSL，20%复杂场景混合JSON Schema或Joi API**。

---

## 为什么不支持某些功能

### 设计理念：简洁 > 完整

DSL 的核心目标是**快速表达常见的80%场景**，而不是覆盖100%的JSON Schema功能。这是一个刻意的设计权衡。

#### 不支持的功能及原因

| 功能 | 不支持的原因 | JSON Schema复杂度 | 使用频率 |
|------|------------|-----------------|---------|
| **正则表达式** | 破坏简洁性，难以在字符串中表达 | ⭐⭐⭐ | ⭐⭐⭐ |
| **anyOf/oneOf/allOf** | 逻辑组合增加学习成本 | ⭐⭐⭐⭐ | ⭐⭐ |
| **nullable** | 与JSON Schema的type数组语法冲突 | ⭐⭐ | ⭐⭐⭐ |
| **条件验证（if/then/else）** | 需要复杂的语法结构 | ⭐⭐⭐⭐⭐ | ⭐ |
| **数组长度约束** | 避免语法歧义（:min-max已用于元素） | ⭐⭐ | ⭐⭐⭐ |
| **自定义错误消息** | DSL专注结构定义，消息属于验证层 | ⭐⭐ | ⭐⭐⭐⭐ |
| **依赖关系（dependencies）** | 使用场景极少，复杂度高 | ⭐⭐⭐⭐⭐ | ⭐ |

#### 为什么不支持正则表达式？

**问题**: 正则表达式包含特殊字符（`/`, `^`, `$`, `|` 等），与DSL的分隔符冲突。

```javascript
// ❌ 语法冲突示例
'string:/^[a-z]+$/'  // "/" 和正则语法混淆
'string:^[a-z]+$'    // ":" 用于约束，"^" 难以解析
'string|/pattern/'   // "|" 用于枚举，无法区分
```

**设计决策**: 保持DSL简洁，复杂模式使用JSON Schema。

#### 为什么不支持 anyOf/oneOf？

**问题**: 逻辑组合需要嵌套结构，破坏DSL的平面化设计。

```javascript
// ❌ 如果支持，语法会变得复杂
'(string|number)&email'  // 难以理解
'string OR number AND length>5'  // 类似SQL，学习成本高
```

**设计决策**: DSL专注简单场景，复杂类型组合使用JSON Schema。

#### 为什么不支持 nullable？

**问题**: `null` 是JavaScript的值，不是类型。JSON Schema使用 `type: ['string', 'null']` 表达。

```javascript
// ❌ 潜在的歧义
'string?'  // 可选字段？还是可为null？
'string|null'  // 与枚举语法冲突
```

**设计决策**: 使用 `!` 标记必填，不标记则为可选。null值通过JSON Schema表达。

#### 为什么不支持条件验证？

**问题**: if/then/else 需要复杂的语法结构，与DSL的简洁性冲突。

```javascript
// ❌ 假设的语法（过于复杂）
'string IF country=US THEN pattern:/^\d{5}$/'
'if(country==US){zipCode:string:5}else{zipCode:string}'
```

**设计决策**: 条件验证使用JSON Schema或Joi风格API（支持when()方法）。

#### 为什么不支持数组长度约束？

**问题**: `:min-max` 已用于元素约束，再用于数组长度会产生歧义。

```javascript
// ❌ 歧义示例
'array<string:1-20>:1-10'  // 难以理解：元素长度1-20，数组长度1-10？
'array:1-10<string:1-20>'  // 语法不一致
```

**设计决策**: 元素约束在 `<>` 内，数组长度通过对象合并添加。

---

## 优雅的扩展方案

虽然DSL有限制，但SchemaIO提供了**多种优雅的方式突破限制**，保持代码可读性。

### 方案1: DSL + JSON Schema 混合使用 ⭐⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐⭐（最推荐）

将DSL用于简单字段，JSON Schema用于复杂字段。

```javascript
const { dsl } = require('schemaio');

const userSchema = {
  type: 'object',
  properties: {
    // ✅ 简单字段：使用DSL
    username: dsl('string:3-32!'),
    email: dsl('email!'),
    age: dsl('number:18-120'),
    
    // ✅ 复杂字段：使用JSON Schema
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 64,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',  // 密码强度正则
      description: '密码必须包含大小写字母和数字'
    },
    
    // ✅ 条件验证：使用JSON Schema
    zipCode: {
      type: 'string',
      if: { 
        properties: { country: { const: 'US' } } 
      },
      then: { 
        pattern: '^\\d{5}(-\\d{4})?$' 
      }
    }
  },
  required: ['username', 'email', 'password']
};
```

**优点**:
- ✅ 充分发挥DSL的简洁性
- ✅ 保留JSON Schema的完整功能
- ✅ 代码清晰易读
- ✅ 无学习成本

---

### 方案2: 使用 Joi 风格 API ⭐⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐⭐（最推荐）

SchemaIO的Joi风格API支持所有高级功能，包括条件验证、自定义消息等。

```javascript
const { types } = require('schemaio');
const { ref } = require('schemaio/lib/core/Ref');
const Locale = require('schemaio/lib/core/Locale');

// 设置中文
Locale.setLocale('zh-CN');

const userSchema = types.object({
  // ✅ 基础验证
  username: types.string()
    .min(3)
    .max(32)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .messages({
      'string.min': '{{#label}}长度不能少于{{#limit}}个字符',
      'string.pattern': '{{#label}}只能包含字母、数字和下划线'
    })
    .required(),
  
  // ✅ 密码强度验证
  password: types.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .messages({
      'string.pattern': '{{#label}}必须包含大小写字母和数字'
    })
    .required(),
  
  // ✅ 密码确认（字段引用）
  confirmPassword: types.string()
    .valid(ref('password'))
    .label('确认密码')
    .messages({
      'string.enum': '两次输入的密码不一致'
    })
    .required(),
  
  // ✅ 条件验证
  contactType: types.string()
    .valid('email', 'phone')
    .required(),
  
  contact: types.string()
    .when('contactType', {
      is: 'email',
      then: types.string().email(),
      otherwise: types.string().pattern(/^\d{11}$/)
    })
    .required(),
  
  // ✅ 自定义异步验证
  username: types.string()
    .custom(async (value) => {
      const exists = await checkUsernameExists(value);
      if (exists) {
        return { error: 'username.exists', message: '用户名已被占用' };
      }
      return true;
    })
});
```

**优点**:
- ✅ 支持所有高级功能（when/ref/custom）
- ✅ 链式调用，代码流畅
- ✅ 错误消息定制
- ✅ 多语言支持
- ✅ 100%对齐Joi API

**何时使用**: 需要复杂验证逻辑、自定义消息、条件验证时。

---

### 方案3: 对象合并扩展 DSL ⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐

通过对象展开语法扩展DSL生成的Schema。

```javascript
const { dsl } = require('schemaio');

// ✅ 扩展数组长度约束
const tagsSchema = {
  ...dsl('array<string:1-50>'),
  minItems: 1,
  maxItems: 20,
  uniqueItems: true  // 元素唯一
};

// ✅ 添加正则模式
const usernameSchema = {
  ...dsl('string:3-32!'),
  pattern: '^[a-zA-Z0-9_]+$',
  description: '只能包含字母、数字和下划线'
};

// ✅ 添加自定义关键字
const emailSchema = {
  ...dsl('email!'),
  format: 'email',
  errorMessage: {  // 使用 ajv-errors 插件
    format: '邮箱格式不正确'
  }
};

// ✅ 完整示例
const userSchema = {
  type: 'object',
  properties: {
    username: {
      ...dsl('string:3-32!'),
      pattern: '^[a-zA-Z0-9_]+$'
    },
    tags: {
      ...dsl('array<string:1-50>'),
      minItems: 1,
      maxItems: 20
    },
    role: {
      ...dsl('user|admin|moderator'),
      default: 'user'
    }
  },
  required: ['username']
};
```

**优点**:
- ✅ 保持DSL的简洁性
- ✅ 灵活添加额外约束
- ✅ 语法简单，易于理解
- ✅ 适合小范围扩展

**何时使用**: 需要在DSL基础上添加少量额外约束时。

---

### 方案4: 工厂函数封装常用模式 ⭐⭐⭐⭐

**推荐指数**: ⭐⭐⭐⭐

将常用的复杂验证封装为可复用的工厂函数。

```javascript
const { dsl } = require('schemaio');

// ✅ 封装密码验证
function passwordField(options = {}) {
  return {
    type: 'string',
    minLength: options.minLength || 8,
    maxLength: options.maxLength || 64,
    pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
    description: options.description || '密码必须包含大小写字母和数字'
  };
}

// ✅ 封装手机号验证
function phoneField(country = 'CN') {
  const patterns = {
    CN: '^1[3-9]\\d{9}$',
    US: '^\\+?1?\\d{10}$',
    UK: '^\\+?44\\d{10}$'
  };
  
  return {
    type: 'string',
    pattern: patterns[country] || patterns.CN,
    description: `${country}手机号格式`
  };
}

// ✅ 封装可为null的字段
function nullableField(dslString) {
  const schema = dsl(dslString);
  return {
    anyOf: [
      schema,
      { type: 'null' }
    ]
  };
}

// ✅ 使用封装好的函数
const userSchema = {
  type: 'object',
  properties: {
    username: dsl('string:3-32!'),
    password: passwordField({ minLength: 10 }),
    phone: phoneField('CN'),
    middleName: nullableField('string:1-50')  // 可为null的字符串
  }
};
```

**优点**:
- ✅ 代码复用，减少重复
- ✅ 统一验证规则
- ✅ 易于维护和更新
- ✅ 团队内共享验证逻辑

**何时使用**: 有多个项目使用相同的验证模式时。

---

### 方案5: 使用 ajv-keywords 扩展 ⭐⭐⭐

**推荐指数**: ⭐⭐⭐

结合 ajv-keywords 插件添加额外的验证功能。

```javascript
const { dsl } = require('schemaio');
const Ajv = require('ajv');
const ajvKeywords = require('ajv-keywords');
const ajvErrors = require('ajv-errors');

const ajv = new Ajv({ allErrors: true });
ajvKeywords(ajv);
ajvErrors(ajv);

// ✅ 使用扩展关键字
const schema = {
  type: 'object',
  properties: {
    username: {
      ...dsl('string:3-32!'),
      pattern: '^[a-zA-Z0-9_]+$',
      // 使用 ajv-keywords 的 regexp 关键字
      regexp: {
        pattern: '^[a-zA-Z0-9_]+$',
        flags: 'i'
      }
    },
    age: {
      ...dsl('number:18-120!'),
      // 使用 ajv-keywords 的 range 关键字
      range: [18, 120],
      exclusiveRange: [17, 121]
    },
    email: {
      ...dsl('email!'),
      // 使用 ajv-keywords 的 transform 关键字
      transform: ['trim', 'toLowerCase']
    }
  },
  // 使用 ajv-errors 自定义错误消息
  errorMessage: {
    properties: {
      username: '用户名格式不正确',
      age: '年龄必须在18-120之间',
      email: '邮箱格式不正确'
    }
  }
};

const validate = ajv.compile(schema);
```

**优点**:
- ✅ 功能强大，扩展性好
- ✅ 社区生态支持
- ✅ 与DSL完美结合

**缺点**:
- ⚠️ 需要额外依赖
- ⚠️ 学习成本增加

**何时使用**: 需要使用ajv生态的特殊功能时。

---

### 方案对比总结

| 方案 | 简洁性 | 功能性 | 学习成本 | 推荐场景 |
|------|--------|--------|---------|---------|
| **DSL + JSON Schema** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 任何项目，最通用 |
| **Joi风格API** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 复杂验证、企业项目 |
| **对象合并** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 小范围扩展 |
| **工厂函数** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 代码复用 |
| **ajv-keywords** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 特殊需求 |

---

### 推荐组合方案

根据项目规模和复杂度选择合适的组合：

#### 小型项目（简单CRUD）

```javascript
// 主要使用 DSL + 偶尔混合 JSON Schema
const schema = dsl({
  name: 'string:1-100!',
  email: 'email!',
  age: 'number:18-120'
});
```

#### 中型项目（业务逻辑中等）

```javascript
// DSL + JSON Schema + 工厂函数
const userSchema = {
  type: 'object',
  properties: {
    username: dsl('string:3-32!'),
    password: passwordField(),  // 工厂函数
    phone: phoneField('CN')     // 工厂函数
  }
};
```

#### 大型项目（复杂业务）

```javascript
// Joi风格API + DSL（简单字段）
const { types } = require('schemaio');
const { dsl } = require('schemaio');

const userSchema = types.object({
  // 复杂验证：使用Joi风格
  username: types.string()
    .min(3)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .custom(checkUsernameExists)
    .messages({ ... }),
  
  // 简单验证：使用DSL（转为Joi）
  ...convertDslToJoi({
    age: 'number:18-120',
    gender: 'male|female|other'
  })
});
```

---

## 常见问题

### Q1: 如何定义可为 null 的字段？

DSL 目前不直接支持 nullable，需要使用 JSON Schema 或工厂函数：

```javascript
// ✅ 方案1: 使用 JSON Schema
const schema = {
  anyOf: [
    { type: 'string' },
    { type: 'null' }
  ]
};

// ✅ 方案2: 封装为工具函数（推荐）
function nullable(dslString) {
  return {
    anyOf: [
      dsl(dslString),
      { type: 'null' }
    ]
  };
}

const middleName = nullable('string:1-50');
```

**详见**: [边界情况和限制 - 不支持nullable](#4-不支持-nullable)

---

### Q2: 如何定义复杂的正则模式？

DSL 不支持自定义正则，使用以下方案：

```javascript
// ✅ 方案1: 对象合并（推荐）
const usernameSchema = {
  ...dsl('string:3-32!'),
  pattern: '^[a-zA-Z0-9_]+$'
};

// ✅ 方案2: Joi风格API
const usernameSchema = types.string()
  .min(3)
  .max(32)
  .pattern(/^[a-zA-Z0-9_]+$/)
  .required();
```

**详见**: [边界情况和限制 - 不支持正则表达式](#1-不支持正则表达式)

---

### Q3: 如何定义 anyOf 或 oneOf？

DSL 不支持，使用 JSON Schema：

```javascript
// ✅ anyOf: 满足任一条件
const schema = {
  anyOf: [
    { type: 'string', minLength: 5 },
    { type: 'number', minimum: 100 }
  ]
};

// ✅ oneOf: 只满足一个条件
const schema = {
  oneOf: [
    { type: 'string' },
    { type: 'number' }
  ]
};

// ✅ allOf: 满足所有条件
const schema = {
  allOf: [
    { type: 'string' },
    { minLength: 5 },
    { maxLength: 20 }
  ]
};
```

**详见**: [边界情况和限制 - 不支持anyOf/oneOf/allOf](#2-不支持-anyofoneofallof)

---

### Q4: 如何实现条件验证（if/then/else）？

```javascript
// ✅ 方案1: Joi风格API（强烈推荐）
const contactSchema = types.string()
  .when('contactType', {
    is: 'email',
    then: types.string().email(),
    otherwise: types.string().pattern(/^\d{11}$/)
  });

// ✅ 方案2: JSON Schema
const schema = {
  type: 'object',
  properties: {
    contactType: { type: 'string' },
    contact: { type: 'string' }
  },
  if: {
    properties: { contactType: { const: 'email' } }
  },
  then: {
    properties: { contact: { format: 'email' } }
  },
  else: {
    properties: { contact: { pattern: '^\\d{11}$' } }
  }
};
```

**详见**: 
- [优雅的扩展方案 - 使用Joi风格API](#方案2-使用-joi-风格-api-)
- [边界情况和限制 - 不支持条件验证](#3-不支持条件验证ifthenelse)

---

### Q5: 如何实现密码确认验证（字段引用）？

```javascript
// ✅ 使用Joi风格API的ref功能
const { types } = require('schemaio');
const { ref } = require('schemaio/lib/core/Ref');

const schema = types.object({
  password: types.string().min(8).required(),
  confirmPassword: types.string()
    .valid(ref('password'))  // 引用password字段
    .messages({
      'string.enum': '两次输入的密码不一致'
    })
    .required()
});

// 验证时必须传递完整数据
const result = await schema.validate(data, { root: data });
```

**详见**: [Ref - 字段引用文档](./ref-validation.md)

---

### Q6: 如何定义数组长度约束？

```javascript
// ❌ DSL 不支持
'array<string>:1-10'  // 语法歧义

// ✅ 使用对象合并
const tagsSchema = {
  ...dsl('array<string:1-50>'),
  minItems: 1,      // 最少1个元素
  maxItems: 20,     // 最多20个元素
  uniqueItems: true // 元素唯一
};
```

**详见**: [边界情况和限制 - 数组长度约束](#5-数组长度约束语法有限)

---

### Q7: 如何自定义错误消息？

```javascript
// ✅ 使用Joi风格API（推荐）
const { types } = require('schemaio');
const Locale = require('schemaio/lib/core/Locale');

Locale.setLocale('zh-CN');  // 设置中文

const schema = types.string()
  .min(3)
  .max(32)
  .label('用户名')
  .messages({
    'string.min': '{{#label}}长度不能少于{{#limit}}个字符',
    'string.max': '{{#label}}长度不能超过{{#limit}}个字符'
  });

// ✅ 使用ajv-errors插件
const schema = {
  ...dsl('string:3-32!'),
  errorMessage: {
    minLength: '用户名至少3个字符',
    maxLength: '用户名最多32个字符'
  }
};
```

**详见**: 
- [错误处理文档](./error-handling.md)
- [StringType完整文档](./types/string-type.md)

---

### Q8: DSL 和 Joi 风格如何选择？

| 场景 | 推荐 | 原因 |
|------|------|------|
| 快速原型开发 | DSL ⭐ | 简洁快速 |
| 简单的 Schema | DSL ⭐ | 一目了然 |
| 配置文件定义 | DSL ⭐ | 易于维护 |
| 复杂的验证逻辑 | Joi ⭐ | 功能强大 |
| 需要自定义验证 | Joi ⭐ | 支持custom |
| 需要条件验证 | Joi ⭐ | 支持when |
| 需要字段引用 | Joi ⭐ | 支持ref |
| 需要错误消息定制 | Joi ⭐ | 多语言支持 |
| 企业级项目 | Joi ⭐ | 完整功能 |

**黄金法则**: 
- **80%简单场景用DSL**
- **20%复杂场景用Joi或混合JSON Schema**

---

### Q9: 如何实现自定义异步验证（如数据库检查）？

```javascript
// ✅ 使用Joi风格API的custom方法
const { types } = require('schemaio');

const schema = types.object({
  username: types.string()
    .min(3)
    .max(32)
    .custom(async (value) => {
      // 异步检查用户名是否已存在
      const exists = await checkUsernameExists(value);
      if (exists) {
        return { 
          error: 'username.exists', 
          message: '用户名已被占用' 
        };
      }
      return true;
    })
    .required(),
  
  email: types.string()
    .email()
    .custom(async (value) => {
      // 异步检查邮箱是否已注册
      const exists = await checkEmailExists(value);
      if (exists) {
        return { 
          error: 'email.exists', 
          message: '该邮箱已被注册' 
        };
      }
      return true;
    })
    .required()
});
```

**详见**: [用户注册示例](../examples/user-registration/README.md)

---

### Q10: 如何混合使用DSL和JSON Schema？

```javascript
const { dsl } = require('schemaio');

// ✅ 完美混合（推荐）
const userSchema = {
  type: 'object',
  properties: {
    // 简单字段用DSL
    username: dsl('string:3-32!'),
    email: dsl('email!'),
    age: dsl('number:18-120'),
    role: dsl('user|admin|moderator'),
    
    // 复杂字段用JSON Schema
    password: {
      type: 'string',
      minLength: 8,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$',
      description: '密码必须包含大小写字母和数字'
    },
    
    // 数组长度约束：DSL + 对象合并
    tags: {
      ...dsl('array<string:1-50>'),
      minItems: 1,
      maxItems: 20,
      uniqueItems: true
    }
  },
  required: ['username', 'email', 'password']
};
```

**详见**: [优雅的扩展方案 - DSL + JSON Schema混合使用](#方案1-dsl--json-schema-混合使用-)

---

### Q11: 如何处理嵌套对象验证？

```javascript
// ✅ DSL 支持无限层级嵌套
const schema = dsl({
  user: {
    profile: {
      name: 'string:1-50!',
      avatar: 'url',
      bio: 'string:0-500'
    },
    settings: {
      theme: 'light|dark',
      language: 'zh-CN|en-US',
      notifications: {
        email: 'boolean',
        sms: 'boolean',
        push: 'boolean'
      }
    }
  }
});

// ✅ Joi风格也支持嵌套
const schema = types.object({
  user: types.object({
    profile: types.object({
      name: types.string().min(1).max(50).required(),
      avatar: types.string().url(),
      bio: types.string().max(500)
    }),
    settings: types.object({
      theme: types.string().valid('light', 'dark'),
      language: types.string().valid('zh-CN', 'en-US'),
      notifications: types.object({
        email: types.boolean(),
        sms: types.boolean(),
        push: types.boolean()
      })
    })
  })
});
```

**详见**: [嵌套对象](#嵌套对象)

---

### Q12: 如何使用SchemaIO生成MongoDB Schema？

```javascript
const { dsl, exporters } = require('schemaio');

// 1. 定义Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  tags: 'array<string>',
  createdAt: 'date!'
});

// 2. 导出为MongoDB Schema
const mongoSchema = exporters.MongoDBExporter.export(userSchema);

// 3. 生成createCollection命令
const command = exporters.MongoDBExporter.generateCreateCommand(
  'users',
  mongoSchema,
  { validationLevel: 'strict' }
);

console.log(command);
// db.createCollection('users', { validator: { ... } })
```

**详见**: [数据库Schema导出文档](./database-export.md)

---

### Q13: 性能如何？DSL解析会不会很慢？

**答**: DSL解析性能优秀，有缓存机制。

```javascript
// 性能数据
解析简单Schema:  < 0.05ms
解析复杂Schema:  < 0.5ms
有缓存命中:     < 0.01ms

// 缓存自动启用
const schema1 = dsl('string:1-100!');  // 0.05ms（首次解析）
const schema2 = dsl('string:1-100!');  // 0.01ms（缓存命中）
```

**优化建议**:
- ✅ 在模块加载时定义Schema（而非每次请求）
- ✅ 复用已定义的Schema对象
- ✅ 复杂验证使用Joi风格预编译

---

### Q14: 如何在TypeScript中使用？

```typescript
import { dsl, types } from 'schemaio';
import { ref } from 'schemaio/lib/core/Ref';

// DSL方式
interface User {
  username: string;
  email: string;
  age?: number;
}

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// Joi风格方式（有类型提示）
const userSchemaJoi = types.object<User>({
  username: types.string().min(3).max(32).required(),
  email: types.string().email().required(),
  age: types.number().min(18).max(120).optional()
});

// 验证
const result = await userSchemaJoi.validate(data);
if (result.isValid) {
  const validData: User = result.data;
}
```

**类型定义**: SchemaIO提供完整的TypeScript类型定义（index.d.ts）

---

### Q15: 如何调试DSL解析结果？

```javascript
const { dsl } = require('schemaio');

// 1. 查看解析结果
const schema = dsl('string:3-32!');
console.log(JSON.stringify(schema, null, 2));

// 输出:
// {
//   "type": "string",
//   "minLength": 3,
//   "maxLength": 32
// }

// 2. 查看复杂对象
const complexSchema = dsl({
  username: 'string:3-32!',
  tags: 'array<string:1-50>',
  role: 'user|admin'
});
console.log(JSON.stringify(complexSchema, null, 2));

// 3. 启用调试模式（如果需要）
process.env.DEBUG = 'schemaio:dsl';
```

---

## 相关文档

### 核心文档
- [StringType完整API](./types/string-type.md) - 字符串类型完整文档
- [错误处理指南](./error-handling.md) - 错误消息定制和多语言支持
- [Joi风格API](./joi-style.md) - 链式调用API完整指南
- [类型系统总览](./TYPES.md) - 所有类型的完整说明

### 高级功能
- [Ref字段引用](./ref-validation.md) - 密码确认等字段关联验证
- [When条件验证](./when-validation.md) - 动态验证规则
- [自定义验证](./custom-validation.md) - 异步验证和数据库检查

### 数据库集成
- [MongoDB Schema导出](./database/mongodb-export.md) - 生成MongoDB验证规则
- [MySQL Schema导出](./database/mysql-export.md) - 生成MySQL表结构
- [PostgreSQL Schema导出](./database/postgresql-export.md) - 生成PostgreSQL表结构

### 示例代码
- [用户注册系统](../examples/user-registration/README.md) - 完整的企业级示例
- [密码重置](../examples/password-reset/README.md) - ref功能实践
- [DSL风格示例](../examples/dsl-style.js) - DSL语法示例集合
- [Joi风格示例](../examples/joi-style.js) - Joi API示例集合

### 开发指南
- [贡献指南](../CONTRIBUTING.md) - 如何参与SchemaIO开发
- [测试指南](../test/README.md) - 如何编写和运行测试
- [架构设计](../docs/architecture.md) - SchemaIO架构说明

---

## API参考

### DSL函数

```typescript
dsl(definition: string | object): JSONSchemaObject
```

**参数**:
- `definition`: DSL字符串或对象

**返回**: JSON Schema对象

**示例**:
```javascript
// 字符串方式
const schema = dsl('string:3-32!');

// 对象方式
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!'
});
```

---

### 类型别名

```javascript
const { s, n, b, o, a } = require('schemaio').dsl;

s('string')  // string类型
n('number')  // number类型
b('boolean') // boolean类型
o(...)       // object类型
a(...)       // array类型
```

---

### 导出功能

```javascript
const { exporters } = require('schemaio');

// MongoDB导出
exporters.MongoDBExporter.export(schema);

// MySQL导出
exporters.MySQLExporter.export(schema);

// PostgreSQL导出
exporters.PostgreSQLExporter.export(schema);
```

---

**文档版本**: v1.0.1  
**最后更新**: 2025-12-24  
**SchemaIO版本**: 1.0+

