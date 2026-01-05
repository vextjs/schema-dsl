# 数据库导出限制说明

> **重要提示**: 在使用 schema-dsl 导出数据库 Schema 功能时，请仔细阅读本文档，了解哪些特性可以导出，哪些不支持。

---

## 📑 目录

- [核心原则](#核心原则)
- [不支持导出的特性](#不支持导出的特性)
- [部分支持的特性](#部分支持的特性)
- [完全支持的特性](#完全支持的特性)
- [数据库特定限制](#数据库特定限制)
- [最佳实践建议](#最佳实践建议)

---

## 核心原则

**schema-dsl 的数据库导出功能遵循以下原则**：

1. ✅ **静态结构优先**: 只导出固定的、静态的 Schema 定义
2. ❌ **动态逻辑不导出**: 运行时条件逻辑、动态计算等无法转换为数据库约束
3. ⚠️ **约束映射有限**: 数据库原生约束能力有限，部分高级约束会被忽略或简化
4. 🎯 **类型映射为主**: 主要关注类型定义和基础约束（长度、范围、必填等）

---

## 不支持导出的特性

以下 schema-dsl 特性**无法导出到数据库 Schema**（会被忽略）：

### 1. 条件验证逻辑 ❌

#### `dsl.match()` - 条件字段映射

```javascript
// ❌ 无法导出
const schema = dsl({
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});
```

**原因**: 数据库不支持"根据 A 字段值决定 B 字段类型"的动态约束。

**替代方案**:
- 导出为最宽松的类型（`VARCHAR(255)`）
- 验证逻辑保留在应用层（使用 SchemaI-DSL 验证器）

---

#### `dsl.if()` - 条件验证

```javascript
// ❌ 无法导出
const schema = dsl({
  isVip: 'boolean',
  discount: dsl.if('isVip', 'number:10-100!', 'number:0-10')
});
```

**原因**: 同上，数据库不支持条件约束。

---

### 2. 复杂的 JSON Schema 关键字 ❌

以下 JSON Schema 高级特性无法导出：

| 关键字 | 说明 | 导出行为 |
|--------|------|----------|
| `allOf` | 所有 Schema 都满足 | ❌ 忽略 |
| `anyOf` | 满足任一 Schema | ❌ 忽略 |
| `oneOf` | 仅满足一个 Schema | ❌ 忽略 |
| `not` | 不满足某 Schema | ❌ 忽略 |
| `if/then/else` | 条件 Schema | ❌ 忽略 |
| `dependencies` | 字段依赖关系 | ❌ 忽略 |

**示例**:

```javascript
// ❌ 这些结构无法导出
const schema = {
  type: 'object',
  allOf: [
    { properties: { name: { type: 'string' } } },
    { properties: { age: { type: 'number' } } }
  ]
};
```

---

### 3. 自定义验证器 ❌

```javascript
// ❌ 自定义验证器无法导出
const schema = dsl('string:3-32!')
  .custom((value) => value.startsWith('USER_'))
  .messages({ 'string.custom': '必须以 USER_ 开头' });
```

**原因**: 数据库无法执行 JavaScript 函数。

**替代方案**:
- 使用 `pattern` 正则表达式（如果可表达）
- 验证逻辑保留在应用层

---

### 4. 自定义错误消息 ❌

```javascript
// ❌ 错误消息无法导出
const schema = dsl('email!')
  .messages({
    'string.format': '请输入有效的邮箱地址'
  })
  .label('用户邮箱');
```

**导出行为**:
- ✅ `label()` 会导出为 `COMMENT`（MySQL/PostgreSQL）
- ❌ `messages()` 会被忽略（数据库不存储错误消息）

---

### 5. 嵌套对象的深度约束 ⚠️

```javascript
// ⚠️ 嵌套对象会简化为 JSON/JSONB 类型
const schema = dsl({
  profile: {
    bio: 'string:500',
    avatar: 'url',
    social: {
      twitter: 'url',
      github: 'url'
    }
  }
});
```

**导出行为**:
- MongoDB: ✅ 完整支持嵌套验证
- MySQL: ❌ 导出为 `JSON` 类型，内部约束丢失
- PostgreSQL: ❌ 导出为 `JSONB` 类型，内部约束丢失

---

## 部分支持的特性

以下特性在不同数据库中支持程度不同：

### 1. 正则表达式约束 ⚠️

```javascript
const schema = dsl('string!')
  .pattern(/^[A-Z][a-z]+$/);
```

| 数据库 | 支持程度 | 导出结果 |
|--------|----------|----------|
| MongoDB | ✅ 完全支持 | `pattern: "^[A-Z][a-z]+$"` |
| MySQL | ❌ 不支持 | 忽略 |
| PostgreSQL | ❌ 不支持 | 忽略 |

**注意**: MySQL 和 PostgreSQL 没有原生的正则约束，需在应用层验证。

---

### 2. 数值范围约束 ⚠️

```javascript
const schema = dsl('number:18-120');
```

| 数据库 | 支持程度 | 导出结果 |
|--------|----------|----------|
| MongoDB | ✅ 完全支持 | `minimum: 18, maximum: 120` |
| MySQL | ❌ 不支持 | 忽略 |
| PostgreSQL | ✅ 支持 | `CHECK (age BETWEEN 18 AND 120)` |

---

### 3. 字符串长度约束 ⚠️

```javascript
const schema = dsl('string:3-32');
```

| 数据库 | 支持程度 | 导出结果 |
|--------|----------|----------|
| MongoDB | ✅ 完全支持 | `minLength: 3, maxLength: 32` |
| MySQL | ⚠️ 仅 maxLength | `VARCHAR(32)` |
| PostgreSQL | ✅ 完全支持 | `VARCHAR(32) CHECK (LENGTH(...) >= 3)` |

---

### 4. 枚举约束 ⚠️

```javascript
const schema = dsl('active|inactive|banned');
```

| 数据库 | 支持程度 | 导出结果 |
|--------|----------|----------|
| MongoDB | ✅ 完全支持 | `enum: ['active', 'inactive', 'banned']` |
| MySQL | ❌ 不支持 | `VARCHAR(255)` |
| PostgreSQL | ✅ 支持 | `CHECK (status IN (...))` |

---

### 5. 数组约束 ⚠️

```javascript
const schema = dsl('array!1-10<string:3-32>');
```

| 数据库 | 支持程度 | 导出结果 |
|--------|----------|----------|
| MongoDB | ✅ 完全支持 | `type: array, minItems: 1, maxItems: 10, items: {...}` |
| MySQL | ❌ 简化 | `JSON` |
| PostgreSQL | ❌ 简化 | `JSONB` |

---

## 完全支持的特性

以下特性在所有数据库中都能良好导出：

### ✅ 基础类型

```javascript
dsl({
  name: 'string!',
  age: 'number',
  active: 'boolean',
  createdAt: 'datetime!'
})
```

**所有数据库都支持类型映射**。

---

### ✅ 必填约束

```javascript
dsl({
  email: 'email!',   // 必填
  phone: 'phone:cn'  // 可选
})
```

**导出为**:
- MongoDB: `required: ['email']`
- MySQL/PostgreSQL: `NOT NULL` / `NULL`

---

### ✅ 默认值（仅 MySQL/PostgreSQL）

```javascript
const schema = dsl('boolean')
  .default(false);
```

**导出为**:
- MongoDB: ❌ 不支持 `default`
- MySQL/PostgreSQL: ✅ `DEFAULT false`

---

### ✅ 字段描述

```javascript
const schema = dsl('string!')
  .description('用户登录名');
```

**导出为**:
- MongoDB: `description: "用户登录名"`
- MySQL: `COMMENT '用户登录名'`
- PostgreSQL: `COMMENT ON COLUMN ... IS '用户登录名'`

---

## 数据库特定限制

### MongoDB

| 限制 | 说明 |
|------|------|
| ❌ 不支持 `default` | MongoDB JSON Schema 不支持默认值 |
| ❌ 不支持外键 | 需在应用层实现引用完整性 |
| ✅ 最完整的约束支持 | 正则、范围、枚举、数组约束都支持 |

---

### MySQL

| 限制 | 说明 |
|------|------|
| ❌ 不支持正则 | 无法导出 `pattern` 约束 |
| ❌ 不支持数值范围 | 无法导出 `minimum/maximum` |
| ❌ 不支持枚举 CHECK | 枚举导出为普通 `VARCHAR` |
| ⚠️ 字符串长度仅 maxLength | `minLength` 会被忽略 |
| ❌ 对象/数组简化为 JSON | 内部结构约束丢失 |

---

### PostgreSQL

| 限制 | 说明 |
|------|------|
| ❌ 不支持正则 | 无法导出 `pattern` 约束 |
| ✅ 支持 CHECK 约束 | 可导出范围、枚举、长度约束 |
| ❌ 对象/数组简化为 JSONB | 内部结构约束丢失 |
| ✅ 完整的注释支持 | `COMMENT ON COLUMN` |

---

## 最佳实践建议

### 1. 分层验证策略 🎯

```
┌─────────────────────────────────────────┐
│  应用层（SchemaI-DSL 完整验证）             │
│  - 条件逻辑（match/if）                 │
│  - 自定义验证器                         │
│  - 复杂约束（正则、范围等）              │
│  - 友好的错误消息                       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  数据库层（基础约束）                    │
│  - 类型定义（string/number/boolean）     │
│  - NOT NULL 约束                        │
│  - 主键/外键                            │
│  - 简单长度限制（maxLength）             │
└─────────────────────────────────────────┘
```

**原则**:
- 数据库：防止数据损坏的最后一道防线
- 应用层：完整的业务逻辑验证

---

### 2. 明确导出前的预期 📋

在使用导出功能前，请先检查 Schema 是否包含不支持的特性：

```javascript
const { dsl, exporters } = require('schema-dsl');

// ❌ 不适合导出的 Schema（包含条件逻辑）
const conditionalSchema = dsl({
  type: 'email|phone',
  value: dsl.match('type', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

// ✅ 适合导出的 Schema（静态定义）
const staticSchema = dsl({
  id: 'uuid!',
  email: 'email!',
  phone: 'string:11',
  status: 'active|inactive',
  createdAt: 'datetime!'
});

// 导出前先了解限制
const exporter = new exporters.MySQLExporter();
const ddl = exporter.export('users', staticSchema);
```

---

### 3. 使用描述说明约束 📝

对于无法导出的约束，使用 `description()` 在数据库中留下说明：

```javascript
const schema = dsl('string!')
  .pattern(/^[A-Z][a-z]+$/)
  .description('首字母大写，其余小写（正则：^[A-Z][a-z]+$）');
```

**导出为**:

```sql
-- MySQL
`name` VARCHAR(255) NOT NULL COMMENT '首字母大写，其余小写（正则：^[A-Z][a-z]+$）'

-- PostgreSQL
COMMENT ON COLUMN users.name IS '首字母大写，其余小写（正则：^[A-Z][a-z]+$）';
```

---

### 4. 保留完整 Schema 定义 💾

```javascript
// schemas/user.js
const { dsl } = require('schema-dsl');

// 完整定义（包含所有验证逻辑）
const userSchema = dsl({
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'string.pattern': '只能包含字母数字下划线' })
    .description('用户登录名'),
  
  contactType: 'email|phone',
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

module.exports = {
  // 应用层使用完整 Schema
  full: userSchema,
  
  // 数据库导出使用简化 Schema
  db: dsl({
    username: 'string:3-32!'.description('用户登录名'),
    contactType: 'email|phone',
    contact: 'string!'.description('邮箱或手机号（根据 contactType）')
  })
};
```

---

### 5. 文档化不兼容特性 📖

在项目文档中明确说明哪些验证逻辑在数据库层不生效：

```markdown
## 数据验证说明

### 应用层验证（SchemaI-DSL）
- ✅ `contact` 字段根据 `contactType` 动态验证
- ✅ 用户名正则验证（`^[a-zA-Z0-9_]+$`）
- ✅ 自定义业务规则验证

### 数据库层约束
- ✅ `username` 长度限制（3-32 字符）
- ✅ 必填字段约束
- ❌ 动态类型验证（依赖应用层）
- ❌ 正则表达式验证（依赖应用层）
```

---

## 常见问题

### Q1: 为什么 `dsl.match()` 不能导出？

**A**: 数据库不支持"根据字段 A 的值决定字段 B 的类型"这种动态约束。数据库 Schema 在创建时就固定了，无法运行时改变。

**解决方案**:
- 导出为最宽松的类型（如 `VARCHAR(255)`）
- 应用层使用完整 Schema 验证

---

### Q2: MySQL 不支持正则，怎么办？

**A**: MySQL 的 `CHECK` 约束不支持正则表达式。

**解决方案**:
1. 应用层验证（推荐）
2. 使用触发器（不推荐，复杂且难维护）
3. 在 `COMMENT` 中说明约束规则

---

### Q3: 嵌套对象导出后丢失约束？

**A**: MySQL/PostgreSQL 将嵌套对象导出为 `JSON`/`JSONB` 类型，内部约束无法表达。

**解决方案**:
- MongoDB: 完整支持嵌套验证
- MySQL/PostgreSQL: 应用层验证

---

### Q4: 如何检查 Schema 是否适合导出？

**A**: 以下特性**不适合**导出：

```javascript
// ❌ 包含条件逻辑
dsl.match(...)
dsl.if(...)

// ❌ 包含自定义验证器
.custom(...)

// ❌ 复杂的 allOf/anyOf/oneOf
{ allOf: [...] }
```

**适合导出**的特性：

```javascript
// ✅ 基础类型 + 简单约束
dsl('string:3-32!')
dsl('number:0-100')
dsl('email!')
dsl('active|inactive|banned')
```

---

## 总结

| 特性 | MongoDB | MySQL | PostgreSQL |
|------|---------|-------|------------|
| 基础类型 | ✅ | ✅ | ✅ |
| 必填约束 | ✅ | ✅ | ✅ |
| 长度约束 | ✅ | ⚠️ 仅 max | ✅ |
| 数值范围 | ✅ | ❌ | ✅ |
| 正则表达式 | ✅ | ❌ | ❌ |
| 枚举 | ✅ | ❌ | ✅ |
| 条件逻辑 | ❌ | ❌ | ❌ |
| 自定义验证器 | ❌ | ❌ | ❌ |
| 嵌套对象 | ✅ | ⚠️ JSON | ⚠️ JSONB |
| 字段描述 | ✅ | ✅ | ✅ |

---

## 相关文档

- [数据库导出指南](export-guide.md)
- [MongoDB 导出器](mongodb-exporter.md)
- [MySQL 导出器](mysql-exporter.md)
- [PostgreSQL 导出器](postgresql-exporter.md)
- [最佳实践](best-practices.md)

