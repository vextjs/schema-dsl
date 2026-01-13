# schema-dsl 可选标记 ? 支持

**版本**: v1.1.4+  
**更新日期**: 2026-01-13

---

## 📋 功能概述

schema-dsl 现在支持使用 `?` 显式标记可选字段，提供更清晰的语义表达。

### 支持的标记

| 标记 | 含义 | 示例 | 说明 |
|------|------|------|------|
| `!` | 必填 | `string!` | 字段不能为空 |
| `?` | 可选 | `string?` | 字段可以为空（显式表达） |
| 无标记 | 可选（默认） | `string` | 字段可以为空（默认行为） |

---

## ✅ 支持的语法

### 1. 基础类型 + ?

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  username: 'string!',      // 必填字符串
  nickname: 'string',       // 可选字符串（默认）
  bio: 'string?',           // 显式可选字符串
  email: 'email?'           // 可选邮箱
});

// 验证
validate(schema, {});                                // ✅ 通过（只有username必填）
validate(schema, { username: 'test' });              // ✅ 通过
validate(schema, { username: 'test', bio: 'hi' });   // ✅ 通过
validate(schema, { username: 'test', email: 'invalid' }); // ❌ 失败（email格式错误）
```

### 2. 带约束的类型 + ?

```javascript
const schema = dsl({
  username: 'string:3-32!',   // 必填，长度3-32
  nickname: 'string:3-32?',   // 可选，有值时长度3-32
  age: 'number:18-?',         // 可选，有值时≥18
  score: 'number:0-100?'      // 可选，有值时0-100
});

validate(schema, { username: 'test' });              // ✅ 通过
validate(schema, { username: 'test', age: 16 });     // ❌ 失败（age<18）
validate(schema, { username: 'test', age: 20 });     // ✅ 通过
```

### 3. 格式类型 + ?

```javascript
const schema = dsl({
  email: 'email?',            // 可选邮箱
  url: 'url?',                // 可选URL
  uuid: 'uuid?',              // 可选UUID
  date: 'date?',              // 可选日期
  phone: 'phone:cn?'          // 可选中国手机号
});

validate(schema, {});                          // ✅ 通过（全部可选）
validate(schema, { email: 'test@example.com' }); // ✅ 通过
validate(schema, { email: 'invalid' });        // ❌ 失败（格式错误）
```

### 4. 数组类型 + ?

```javascript
const schema = dsl({
  tags: 'array<string>?',     // 可选字符串数组
  items: 'array:1-10?',       // 可选数组，长度1-10
  numbers: 'array<number>?'   // 可选数字数组
});

validate(schema, {});                          // ✅ 通过
validate(schema, { tags: ['a', 'b'] });        // ✅ 通过
validate(schema, { tags: [] });                // ✅ 通过（空数组）
```

---

## 🎯 语义对比

### string vs string?

虽然两者行为相同（都是可选），但语义不同：

```javascript
// 方式1: 隐式可选（默认）
const schema1 = dsl({
  nickname: 'string'
});

// 方式2: 显式可选（推荐）
const schema2 = dsl({
  nickname: 'string?'
});
```

**推荐使用 `?` 的场景**：
- 需要明确表达"此字段是故意设计为可选的"
- 与其他必填字段对比时，增强代码可读性
- 团队规范要求显式标记可选字段

**示例**：

```javascript
// ❌ 不清晰：哪些是有意可选？哪些是遗漏了必填标记？
const schema = dsl({
  username: 'string!',
  nickname: 'string',
  bio: 'string',
  email: 'email!'
});

// ✅ 清晰：明确表达设计意图
const schema = dsl({
  username: 'string!',    // 必填
  nickname: 'string?',    // 可选
  bio: 'string?',         // 可选
  email: 'email!'         // 必填
});
```

---

## ⚠️ 注意事项

### 1. 枚举类型中的 ?

当 `?` 出现在枚举值中时，需要特别注意：

```javascript
// ❌ 错误：? 会被当作枚举值的一部分
const schema1 = dsl({
  status: 'active|inactive?'
});
// 解析为: enum ['active', 'inactive?']
// 'inactive' 会验证失败！

// ✅ 正确：枚举默认就是可选的
const schema2 = dsl({
  status: 'active|inactive'
});

// ✅ 正确：枚举必填时使用 !
const schema3 = dsl({
  status: 'active|inactive!'
});
```

### 2. 优先级规则

当 `!` 和 `?` 同时出现时（虽然不推荐），`!` 优先：

```javascript
// ⚠️ 不推荐：同时使用 ! 和 ?
const schema = dsl({
  field: 'string!?'     // ! 优先，字段必填
});
```

### 3. 对象字段的可选

```javascript
// 对象本身可选，内部字段必填
const schema1 = dsl({
  user: {
    name: 'string!',      // 当user存在时，name必填
    email: 'email!'       // 当user存在时，email必填
  }
});

// 对象本身可选（显式），内部字段必填
const schema2 = dsl({
  'user?': {              // 显式可选
    name: 'string!',
    email: 'email!'
  }
});

// 对象本身必填，内部字段可选
const schema3 = dsl({
  'user!': {              // 对象必填
    name: 'string?',      // 可选
    email: 'email?'       // 可选
  }
});
```

---

## 📊 实际测试结果

### 测试统计

- ✅ **string?** - 支持
- ✅ **string:3-32?** - 支持
- ✅ **email?** - 支持
- ✅ **number:18-?** - 支持
- ✅ **array<string>?** - 支持
- ✅ **所有单元测试通过** - 949/949

### 测试代码

```javascript
const { dsl, validate } = require('schema-dsl');

// 测试1: string?
const schema1 = dsl({ name: 'string?' });
console.log(validate(schema1, {}).valid);              // true
console.log(validate(schema1, { name: 'test' }).valid); // true

// 测试2: email?
const schema2 = dsl({ email: 'email?' });
console.log(validate(schema2, {}).valid);                        // true
console.log(validate(schema2, { email: 'test@ex.com' }).valid); // true
console.log(validate(schema2, { email: 'invalid' }).valid);     // false ✅

// 测试3: string:3-32?
const schema3 = dsl({ username: 'string:3-32?' });
console.log(validate(schema3, {}).valid);                   // true
console.log(validate(schema3, { username: 'ab' }).valid);   // false ✅
console.log(validate(schema3, { username: 'test' }).valid); // true
```

---

## 🔧 实现细节

### DslBuilder 构造函数

```javascript
constructor(dslString) {
  // ...
  
  // 🔴 处理必填标记 ! 和可选标记 ?
  // 优先级：! > ?（如果同时存在，! 优先）
  this._required = processedDsl.endsWith('!');
  this._optional = processedDsl.endsWith('?') && !this._required;
  
  let dslWithoutMarker = processedDsl;
  if (this._required) {
    dslWithoutMarker = processedDsl.slice(0, -1);
  } else if (this._optional) {
    dslWithoutMarker = processedDsl.slice(0, -1);
  }
  
  // ...
}
```

---

## 📝 最佳实践

### 推荐的使用方式

```javascript
const { dsl } = require('schema-dsl');

// ✅ 推荐：显式标记所有字段
const schema = dsl({
  // 必填字段 - 使用 !
  username: 'string:3-32!',
  password: 'string:8-!',
  email: 'email!',
  
  // 可选字段 - 使用 ?
  nickname: 'string:3-32?',
  bio: 'string:500?',
  avatar: 'url?',
  phone: 'phone:cn?',
  
  // 对象字段
  'profile!': {           // 对象必填
    age: 'number:18-?',   // 年龄可选
    gender: 'male|female|other?', // 性别可选
  }
});
```

### 代码审查清单

在代码审查时，检查以下事项：

- [ ] 所有必填字段都使用 `!` 标记
- [ ] 可选字段根据团队规范决定是否使用 `?`
- [ ] 枚举类型中没有错误地使用 `?`（如 `active|inactive?`）
- [ ] 复杂约束的可选字段正确使用（如 `string:3-32?`）

---

## 🔄 版本兼容性

- **v1.1.3 及之前**：`?` 被忽略，但不影响功能（因为默认可选）
- **v1.1.4+**：`?` 被显式处理，语义更清晰

**向后兼容**：✅ 完全兼容，所有现有代码无需修改

---

## 📚 相关文档

- [DSL 语法完整指南](./dsl-syntax.md)
- [TypeScript 类型定义](../index.d.ts)
- [单元测试](../test/unit/dsl-adapter.test.js)

---

**最后更新**: 2026-01-13  
**作者**: schema-dsl Team

