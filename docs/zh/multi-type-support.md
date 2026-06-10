# 多类型支持设计说明

---

## 📖 快速导航

- **单一类型验证**（本文档）
- **[联合类型验证](./union-types.md)** - 使用 `types:` 语法做真正的跨类型联合验证

---

## 🎯 设计原理

schema-dsl通过**类型无关的Builder模式**实现多类型支持。

### 核心设计

```javascript
// DslBuilder 类型无关
// 所有类型都使用相同的Builder，区别在于解析阶段

class DslBuilder {
  constructor(dslString) {
    // 解析DSL字符串，提取类型信息
    this._baseSchema = this._parseSimple(dslString);
    // 类型信息存储在 _baseSchema.type
  }
}
```

---


## 📊 类型支持矩阵

| DSL字符串 | 解析类型 | 支持的方法 |
|----------|---------|-----------|
| `'string'` | string | pattern, min, max, label, messages |
| `'number'` | number | min, max, integer, label, messages |
| `'email'` | string+format | pattern, label, messages |
| `'url'` | string+format | pattern, label, messages |
| `'boolean'` | boolean | label, messages |
| `'date'` | string+format | min, max, label, messages |

---

## 🔧 实现机制

### 1. 类型解析（DslBuilder构造函数）

```javascript
_parseSimple(dslString) {
  // 提取基础类型
  if (dslString.startsWith('string')) {
    return { type: 'string', ...parseConstraints(dslString) };
  }
  if (dslString.startsWith('number')) {
    return { type: 'number', ...parseConstraints(dslString) };
  }
  if (dslString === 'email') {
    return { type: 'string', format: 'email' };
  }
  // ... 更多类型
}
```

### 2. 方法适配（方法内部检查类型）

```javascript
pattern(regex, message) {
  // 只有字符串类型支持pattern
  if (this._baseSchema.type === 'string') {
    this._baseSchema.pattern = regex.source || regex;
    if (message) {
      this._customMessages['pattern'] = message;
    }
  } else {
    console.warn('pattern() only works for string types');
  }
  return this;
}
```

---

## 💡 String扩展的多类型支持

String扩展**只支持字符串类型**，这是设计决定：

```javascript
// ✅ 正确：字符串类型使用String扩展
email: 'email!'.pattern(/custom/).label('邮箱')
username: 'string:3-32!'.pattern(/^\w+$/).label('用户名')

// ❌ 不适用：数字类型不应使用String扩展
age: 'number:18-120'.label('年龄')  // ✅ 可以用label
age: 'number:18-120'.pattern(/\d/)   // ⚠️ 会被忽略（数字不支持pattern）
```

### 为什么这样设计？

1. **类型安全**: 避免在数字类型上调用字符串方法
2. **语义清晰**: `'number:18-120'` 本身就表达了约束
3. **简洁优先**: 80%的复杂验证都是字符串，重点优化字符串体验

---

## 🎨 各类型的推荐用法

### 字符串类型（支持链式）

```javascript
const schema = dsl({
  // ✨ 简单字段：纯DSL
  name: 'string:1-50!',
  
  // ✨ 复杂字段：String扩展链式
  email: 'email!'
    .pattern(/custom/)
    .messages({ 'format': '邮箱格式不正确' })
    .label('邮箱地址'),
  
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({ 'pattern': '只能包含字母、数字、下划线' })
    .label('用户名')
});
```

### 数字类型（纯DSL）

```javascript
const schema = dsl({
  // 简洁的约束表达
  age: 'number:18-120',      // 范围
  price: 'number:0-999999!', // 必填 + 范围
  count: 'integer:1-100',    // 整数
  
  // 需要label时
  score: 'number:0-100'.label('分数'),
  
  // ⚠️ 数字类型很少需要复杂验证，如需要可用custom
  amount: 'number:0-10000'
    .custom(value => value % 100 === 0) // 必须是100的倍数
    .label('金额')
});
```

### 布尔类型（纯DSL）

```javascript
const schema = dsl({
  // 布尔类型非常简单
  isActive: 'boolean',
  agreeTerms: 'boolean!',
  
  // 需要label时
  emailNotification: 'boolean'.label('邮件通知')
});
```

### 日期类型（纯DSL）

```javascript
const schema = dsl({
  // 日期约束
  birthday: 'date',
  createdAt: 'date!',
  
  // 需要验证范围可用custom
  appointmentDate: 'date!'
    .custom(value => {
      const date = new Date(value);
      return date > new Date(); // 必须是未来日期
    })
    .label('预约日期')
});
```

### 枚举类型（纯DSL）

```javascript
const schema = dsl({
  // 枚举值用 | 分隔
  status: 'active|inactive|pending',
  role: 'user|admin|moderator',
  
  // 需要label时
  gender: 'male|female|other'.label('性别')
});
```

### 数组类型（纯DSL）

```javascript
const schema = dsl({
  // 数组元素类型
  tags: 'array<string>',
  scores: 'array<number>',
  
  // 数组元素约束
  tags: 'array<string:1-20>',  // 元素长度1-20
  
  // 需要复杂验证时用对象数组
  items: {
    type: 'array',
    items: {
      name: 'string:1-50!',
      price: 'number:0-10000!'
    }
  }
});
```

---

## 🚀 扩展新类型

当前版本优先通过公开运行时 API 扩展类型，而不是要求业务方修改内部 `DslAdapter` / `ErrorCodes` 源码。

### 推荐入口

```javascript
const { DslBuilder, TypeRegistry } = require('schema-dsl');

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 }
});

DslBuilder.registerType('phone-cn-lite', {
  type: 'string',
  pattern: '^1[3-9]\\d{9}$',
  minLength: 11,
  maxLength: 11
});
```

### 使用方式

```javascript
const schema = dsl({
  phone: 'phone-cn-lite!',
  luckyNumber: 'evenNumber'
});
```

---

## 📋 类型方法兼容性矩阵

| 方法 | string | number | boolean | date | array |
|------|--------|--------|---------|------|-------|
| `.pattern()` | ✅ | ❌ | ❌ | ❌ | ❌ |
| `.label()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.messages()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.description()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.custom()` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `.default()` | ✅ | ✅ | ✅ | ✅ | ✅ |

**条件验证**: 使用 `dsl.match()` 或 `dsl.if()` 静态方法。

**说明**:
- ✅ 完全支持
- ❌ 不支持（会被忽略或警告）

---

## 🎯 最佳实践

### 1. 根据类型选择表达方式

```javascript
// ✅ 字符串：复杂验证用链式
username: 'string:3-32!'.pattern(/^\w+$/).label('用户名')

// ✅ 数字：简单约束用DSL
age: 'number:18-120'

// ✅ 枚举：用DSL最简洁
status: 'active|inactive'
```

### 2. String扩展只用于字符串

```javascript
// ✅ 正确
email: 'email!'.pattern(/custom/)

// ❌ 不推荐（虽然不会报错，但pattern会被忽略）
age: 'number:18-120'.pattern(/\d+/)
```

### 3. 复杂验证用custom

```javascript
// 对于任何类型，复杂验证都用custom
amount: 'number:0-10000'
  .custom(value => value % 100 === 0)
  .label('金额')
```

---

## 💡 总结

schema-dsl 的多类型支持采用**类型无关 Builder + 方法智能适配**设计：

1. **统一入口**: 所有类型都通过DslBuilder
2. **类型感知**: 方法内部检查类型兼容性
3. **简洁优先**: String扩展专注字符串（80%的复杂场景）
4. **渐进增强**: 简单用DSL，复杂用链式，特殊用custom

**设计哲学**: 让最常见的场景（字符串验证）最简洁，其他类型保持DSL的简洁性。

---

## 对应示例文件

**示例入口**: [multi-type-support.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/multi-type-support.ts)  
**说明**: 用一个对象同时覆盖字符串、数字、布尔、日期、数组和枚举字段的推荐写法，以及对应的成功 / 失败验证路径。


