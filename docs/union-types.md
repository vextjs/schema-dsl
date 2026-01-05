# 跨类型联合验证 - types: 语法

> **版本**: v1.1.0+  
> **状态**: ✅ 稳定

---

## 概述

`types:` 语法允许您定义跨类型联合验证，支持字段匹配多种不同的数据类型。

### 特性

✅ **简洁语法** - `'types:string|number'` 一行搞定  
✅ **带约束** - `'types:string:3-10|number:0-100'`  
✅ **插件扩展** - 支持自定义类型注册  
✅ **多语言** - 完整的i18n支持

---

## 快速开始

### 基础用法

```javascript
const { dsl, validate } = require('schema-dsl');

// 定义联合类型
const schema = dsl({
  value: 'types:string|number'
});

// 验证
validate(schema, { value: 'hello' });  // ✅ 通过
validate(schema, { value: 123 });      // ✅ 通过
validate(schema, { value: true });     // ❌ 失败
```

### 带约束

```javascript
const schema = dsl({
  value: 'types:string:3-10|number:0-100!'
});

validate(schema, { value: 'abc' });    // ✅ 通过
validate(schema, { value: 50 });       // ✅ 通过
validate(schema, { value: 'ab' });     // ❌ 太短
validate(schema, { value: 101 });      // ❌ 超范围
```

---

## 语法说明

### 基本格式

```
types:type1|type2|type3[!]
```

- `types:` - 固定前缀
- `type1|type2` - 类型列表，用 `|` 分隔
- `!` - 可选的必填标记

### 带约束格式

```
types:type1:constraint1|type2:constraint2
```

---

## 支持的类型

### 内置类型

所有内置类型都可以在 `types:` 中使用：

- **基本类型**: `string`, `number`, `integer`, `boolean`, `null`, `any`
- **格式类型**: `email`, `url`, `uuid`, `date`, `datetime`, `time`
- **特殊类型**: `phone`, `idCard`, `objectId`, `hexColor` 等

### 插件自定义类型

通过插件注册的自定义类型也可以使用：

```javascript
const { DslBuilder, PluginManager } = require('schema-dsl');

// 注册自定义类型
DslBuilder.registerType('order-id', {
  type: 'string',
  pattern: /^ORD[0-9]{12}$/.source,
  minLength: 15,
  maxLength: 15
});

// 在types:中使用
const schema = dsl({
  identifier: 'types:uuid|order-id'
});
```

---

## 实际应用场景

### 场景1：用户注册（邮箱或手机号）

```javascript
const registerSchema = dsl({
  username: 'string:3-20!',
  password: 'string:8-20!',
  contact: 'types:email|phone!'  // 邮箱或手机号
});
```

### 场景2：灵活的价格输入

```javascript
const productSchema = dsl({
  price: 'types:number:0-|string:1-20'  // 数字价格或"面议"
});

validate(productSchema, { price: 99.99 });  // ✅ 数字
validate(productSchema, { price: '面议' });  // ✅ 字符串
```

### 场景3：订单查询（订单号或SKU）

```javascript
// 先注册自定义类型
DslBuilder.registerType('order-id', { ... });
DslBuilder.registerType('sku', { ... });

const querySchema = dsl({
  identifier: 'types:order-id|sku!'
});
```

---

## 插件开发指南

### 注册自定义类型

```javascript
// 在插件的install方法中
install(schemaDsl, options, context) {
  const { DslBuilder } = schemaDsl;

  // 注册DSL类型
  DslBuilder.registerType('custom-type', {
    type: 'string',
    pattern: /^CUSTOM-\d+$/.source,
    minLength: 8,
    maxLength: 20
  });

  // 同时注册ajv format（可选）
  const validator = schemaDsl.getDefaultValidator();
  const ajv = validator.getAjv();
  ajv.addFormat('custom-type', {
    validate: /^CUSTOM-\d+$/
  });
}
```

### DslBuilder API

#### `DslBuilder.registerType(name, schema)`

注册自定义类型。

**参数**:
- `name` (string) - 类型名称
- `schema` (Object|Function) - JSON Schema对象或生成函数

#### `DslBuilder.hasType(type)`

检查类型是否已注册。

#### `DslBuilder.getCustomTypes()`

获取所有已注册的自定义类型。

#### `DslBuilder.clearCustomTypes()`

清除所有自定义类型（主要用于测试）。

---

## 多语言支持

### 中文

```javascript
validate(schema, { value: true }, { locale: 'zh-CN' });
// 错误: "必须匹配以下类型之一"
```

### 英文

```javascript
validate(schema, { value: true }, { locale: 'en-US' });
// Error: "Must match one of the following types"
```

支持的语言：`zh-CN`, `en-US`, `es-ES`, `fr-FR`, `ja-JP`

---

## 最佳实践

### 1. 优先使用内置类型

```javascript
// ✅ 推荐
'types:email|phone'

// ⚠️ 不推荐（性能较差）
'types:string:custom-email-pattern|string:custom-phone-pattern'
```

### 2. 合理使用约束

```javascript
// ✅ 明确约束
'types:string:3-32|number:0-100'

// ❌ 过于宽松
'types:string|number'  // 没有约束
```

### 3. 插件类型命名规范

```javascript
// ✅ 使用kebab-case
DslBuilder.registerType('order-id', { ... });
DslBuilder.registerType('phone-cn', { ... });

// ❌ 不推荐
DslBuilder.registerType('OrderID', { ... });
DslBuilder.registerType('phone_cn', { ... });
```

---

## 注意事项

### oneOf语义

`types:` 语法内部使用JSON Schema的 `oneOf`，表示"恰好匹配其中一种类型"。

### 性能考虑

联合类型会依次验证每个类型，直到匹配成功。类型越多，性能开销越大。

**建议**:
- 联合类型数量控制在5个以内
- 将最常用的类型放在前面

---

## 相关文档

- [插件系统](./plugin-system.md)
- [自定义类型注册](./plugin-type-registration.md)
- [代码规范](../specs/rules/代码规范.md)

---

## 版本历史

- **v1.1.0** - 首次发布跨类型联合验证功能

