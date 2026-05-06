# 链式条件 API - ConditionalBuilder

> **版本**: v1.1.1  
> **更新日期**: 2026-01-06  
> **状态**: ✅ 稳定

---

## 📋 目录

- [概述](#概述)
- [🆕 v1.1.1 新功能](#-v110-新功能)
- [快速开始](#快速开始)
- [API 参考](#api-参考)
- [使用场景](#使用场景)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 概述

`ConditionalBuilder` 提供流畅的链式条件判断 API，类似 JavaScript 的 if-else 语句，用于在验证时根据实际数据动态调整验证规则。

### 核心特性

- ✅ **链式调用** - 流畅的 API，类似 JavaScript if-else
- ✅ **运行时执行** - 在验证时根据实际数据判断
- ✅ **多条件组合** - 支持 and/or 逻辑组合
- ✅ **🆕 独立消息** - v1.1.1+ 每个 .and()/.or() 可有独立错误消息
- ✅ **else 可选** - 不写 else 就不验证
- ✅ **简化设计** - message 自动抛错，无需 throwError()
- ✅ **完全兼容** - 不影响现有 API

---

## 🆕 v1.1.1 新功能

### 独立消息支持 - `.and()/.or()` 后可调用 `.message()`

**每个条件都可以有自己的错误消息**

v1.1.1 开始，支持在 `.and()` 和 `.or()` 后调用 `.message()` 设置独立的错误消息，让错误提示更精确。

#### 基础用法

```javascript
const { dsl } = require('schema-dsl');

// ✅ v1.1.1+ 新功能：每个条件独立消息
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// 工作原理：
// - 第一个条件为 true → 返回 'ACCOUNT_NOT_FOUND'
// - 第二个条件为 true → 返回 'INSUFFICIENT_TRADABLE_CREDITS'
// - 所有条件为 false → 验证成功
```

#### 多个 .and() 条件

```javascript
// 多层验证，每层都有清晰的错误消息
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.status !== 'active')
  .message('ACCOUNT_INACTIVE')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// 依次检查，第一个为 true 的条件返回其消息
```

#### .or() 条件独立消息

```javascript
// OR 条件也支持独立消息
dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .or(d => d.isBlocked)
  .message('账户已被封禁')
  .assert(data);

// 任一条件为 true 就失败，返回对应消息
```

#### 链式检查模式

v1.1.1 引入了**链式检查模式**，当满足以下条件时自动启用：

1. 使用 `.message()` 模式（不是 `.then()`/`.else()`）
2. root 条件有 `.message()`
3. 有 `.and()` 条件
4. 没有 `.or()` 条件

**链式检查模式特点**：
- 依次检查每个条件
- 第一个为 `true` 的条件失败，返回其消息
- 所有条件为 `false` 时验证通过

**示例对比**：

```javascript
// ✅ 启用链式检查（纯 AND 场景）
dsl.if(d => !d).message('A').and(d => d < 100).message('B')

// ❌ 不启用（有 .or()，使用传统 AND/OR 逻辑）
dsl.if(d => !d).message('A').and(d => d < 100).or(d => d > 200).message('B')

// ❌ 不启用（使用 .then()/.else()，不是 message 模式）
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').then('email!')
```

#### 向后兼容性

**100% 向后兼容**，不影响现有代码：

```javascript
// ✅ 原有用法继续工作
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').message('不符合条件')

// ✅ .and() 后不调用 .message() 也可以
dsl.if(d => !d).message('整体错误').and(d => d < 100).assert(50)
// → 使用整体消息 '整体错误'
```

#### 实际应用场景

**场景1：账户验证**
```javascript
function validateAccount(account, amount) {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.status !== 'active')
    .message('ACCOUNT_INACTIVE')
    .and(d => d.balance < amount)
    .message('INSUFFICIENT_BALANCE')
    .assert(account);
}

// 每个失败点都有清晰的错误消息
```

**场景2：用户权限验证**
```javascript
function validateUserPermission(user) {
  dsl.if(d => d.role !== 'admin')
    .message('NO_ADMIN_PERMISSION')
    .and(d => !d.isVerified)
    .message('USER_NOT_VERIFIED')
    .and(d => d.isBanned)
    .message('USER_BANNED')
    .assert(user);
}
```

**场景3：订单状态检查**
```javascript
function validateOrder(order) {
  dsl.if(d => d.status !== 'paid')
    .message('ORDER_NOT_PAID')
    .and(d => !d.payment)
    .message('PAYMENT_INFO_MISSING')
    .and(d => !d.shippingAddress)
    .message('SHIPPING_ADDRESS_MISSING')
    .assert(order);
}
```

---

## 与现有方法的区别

`dsl.if()` 提供两种使用方式，根据参数类型自动选择：

| 方式 | 参数类型 | 执行时机 | 用途 | 示例 |
|------|---------|---------|------|------|
| **方式一** | 字符串 | Schema 定义时 | 静态布尔条件 | `dsl.if('isVip', thenSchema, elseSchema)` |
| **方式二** | 函数 | 验证时 | 动态条件判断 | `dsl.if((data) => data.age >= 18).then(...)` |

**方式一**（字段条件）：基于字段值的静态判断
```javascript
// 示例：根据 isVip 字段值选择不同的验证规则
dsl.if('isVip', 'number:0-50', 'number:0-10')
```

**方式二**（函数条件）：基于完整数据的动态判断  
```javascript
// 示例：根据多个字段的组合逻辑动态选择
dsl.if((data) => data.age >= 18 && data.role === 'admin')
  .then('email!')
  .else('email')
```

此外，`dsl.match()` 适用于多值映射场景：
```javascript
// 示例：根据 type 字段值映射不同验证规则
dsl.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

---

## 快速开始

### 基础用法

```javascript
const { dsl, validate } = require('schema-dsl');

// 方式1：传统方式（需要 validate 函数）
const schema1 = dsl({
  age: 'number!',
  status: dsl.if((data) => data.age >= 18)
    .message('未成年用户不能注册')
});

validate(schema1, { age: 16, status: 'active' });
// => { valid: false, errors: [{ message: '未成年用户不能注册' }] }

// ✅ 方式2：快捷方式（一行代码验证）
const result = dsl.if((data) => data.age >= 18)
  .message('未成年用户不能注册')
  .validate({ age: 16 });
// => { valid: false, errors: [{ message: '未成年用户不能注册' }] }

// ✅ 方式3：.check() 快速判断
const isValid = dsl.if((data) => data.age >= 18)
  .message('未成年用户不能注册')
  .check({ age: 16 });
// => false

// 2. 条件 + then/else（动态Schema）
const result = dsl.if((data) => data.userType === 'admin')
  .then('email!')  // 管理员必填
  .else('email')   // 普通用户可选
  .validate({ userType: 'admin', email: 'admin@example.com' });

// 3. else 可选
const result = dsl.if((data) => data.userType === 'vip')
  .then('enum:gold|silver|bronze!')
  // 不写 else，非 vip 用户不验证
  .validate({ userType: 'user' });

// 4. 复用验证器
const ageValidator = dsl.if(d => d.age < 18).message('未成年用户不能注册');
const r1 = ageValidator.validate({ age: 16 });  // 失败
const r2 = ageValidator.validate({ age: 20 });  // 通过
```

### 多条件组合

```javascript
// 1. AND 条件
const result = dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .message('只有成年管理员可以操作')
  .validate({ age: 20, userType: 'user' });

// 2. OR 条件
const result = dsl.if((data) => data.age < 18)
  .or((data) => data.status === 'blocked')
  .message('不允许注册')
  .validate({ age: 16, status: 'active' });

// 3. 复杂组合
const result = dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .or((data) => data.status === 'vip')
  .then('email!')
  .else('email')
  .validate(data);
```

### elseIf 分支

```javascript
const validator = dsl.if((data) => data.userType === 'admin')
  .then('array<string>!')
  .elseIf((data) => data.userType === 'vip')
  .then('array<string>')
  .elseIf((data) => data.userType === 'user')
  .then('array')
  .else(null);  // 游客不验证

const r1 = validator.validate({ userType: 'admin', permissions: ['read', 'write'] });
const r2 = validator.validate({ userType: 'vip' });
const r3 = validator.validate({ userType: 'guest' });
```

---

## API 参考

### dsl.if(condition)

创建链式条件构建器。

**参数**:
- `condition` {Function} - 条件函数，接收完整数据对象
  - 参数: `(data: any) => boolean`
  - 返回: `boolean` - true 表示条件满足

**返回**: `ConditionalBuilder` - 构建器实例

**示例**:
```javascript
dsl.if((data) => data.age >= 18)
dsl.if((data) => data.userType === 'admin')
dsl.if((data) => data.status === 'active' && data.verified)
```

---

### .and(condition)

添加 AND 条件（与前一个条件组合）。

> **v1.1.1+** 支持在 `.and()` 后调用 `.message()` 设置独立的错误消息

**参数**:
- `condition` {Function} - 条件函数

**返回**: `this` - 支持链式调用

**基础示例**:
```javascript
// 传统用法：所有条件共享一个消息
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .message('不符合条件')
```

**v1.1.1+ 独立消息**:
```javascript
// ✅ 每个条件都有自己的错误消息
dsl.if((data) => !data)
  .message('账户不存在')
  .and((data) => data.balance < 100)
  .message('余额不足')
  .assert(account);

// 工作原理：
// - 第一个条件为 true → 返回 '账户不存在'
// - 第二个条件为 true → 返回 '余额不足'
// - 所有条件为 false → 验证成功
```

**多个 .and() 条件**:
```javascript
// 支持多个 .and() 条件，每个都有独立消息
dsl.if(d => !d)
  .message('NOT_FOUND')
  .and(d => d.status !== 'active')
  .message('INACTIVE')
  .and(d => d.balance < 100)
  .message('INSUFFICIENT')
  .assert(account);

// 依次检查，第一个为 true 的条件返回其消息
```

**逻辑**: 
- 传统模式：`(condition1 AND condition2)` - 所有条件为 true 才失败
- 链式检查模式 (v1.1.1+)：依次检查，第一个为 true 的失败

**链式检查模式触发条件**:
1. 使用 `.message()` 模式
2. root 条件有 `.message()`
3. 有 `.and()` 条件
4. 没有 `.or()` 条件

---

### .or(condition)

添加 OR 条件（与前一个条件组合）。

> **v1.1.1+** 支持在 `.or()` 后调用 `.message()` 设置独立的错误消息

**参数**:
- `condition` {Function} - 条件函数

**返回**: `this` - 支持链式调用

**基础示例**:
```javascript
// 传统用法：所有条件共享一个消息
dsl.if((data) => data.age < 18)
  .or((data) => data.status === 'blocked')
  .message('不允许注册')
```

**v1.1.1+ 独立消息**:
```javascript
// ✅ 每个 OR 条件都有自己的错误消息
dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .or(d => d.isBlocked)
  .message('账户已被封禁')
  .assert(data);

// 工作原理：
// - 第一个条件为 true → 返回 '未成年用户不能注册'
// - 第二个条件为 true → 返回 '账户已被封禁'
// - 所有条件为 false → 验证成功
```

**逻辑**: `(condition1 OR condition2)` - 任一条件为 true 就失败

**注意**: 
- 如果有 `.or()` 条件，不会启用链式检查模式
- 使用传统 AND/OR 组合逻辑

---

### .build()

将当前 `ConditionalBuilder` 输出为可直接交给 `Validator` / `validate()` 使用的 schema 对象。

`.build()` 是 `.toSchema()` 的别名，适合在你想显式拿到最终 schema 时使用。

```javascript
const { dsl, validate } = require('schema-dsl');

const conditionalSchema = dsl.if(data => data.age >= 18)
  .then('email!')
  .else('email')
  .build();

const result = validate(conditionalSchema, 'user@example.com');
console.log(result.valid);
```

---

### .elseIf(condition)

添加 else-if 分支。

**参数**:
- `condition` {Function} - 条件函数

**返回**: `this` - 支持链式调用

**示例**:
```javascript
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .elseIf((data) => data.userType === 'vip')
  .then('email')
  .else(null)
```

**注意**: 必须在 `.if()` 之后调用

---

### .message(msg)

设置错误消息（支持多语言 key）。

> **v1.1.1+** 支持为 `.and()` 和 `.or()` 条件设置独立消息

**参数**:
- `msg` {string} - 错误消息或多语言 key

**返回**: `this` - 支持链式调用

**行为**: 条件为 true 时自动抛出此错误（无需 `.throwError()`）

**基础示例**:
```javascript
dsl.if((data) => data.age >= 18)
  .message('未成年用户不能注册')

// 支持多语言 key
dsl.if((data) => data.age >= 18)
  .message('error.underage')
```

**v1.1.1+ 为 .and() 设置独立消息**:
```javascript
// ✅ 每个条件都有自己的错误消息
dsl.if((data) => !data)
  .message('账户不存在')
  .and((data) => data.balance < 100)
  .message('余额不足')
  .assert(account);
```

**v1.1.1+ 为 .or() 设置独立消息**:
```javascript
// ✅ OR 条件也支持独立消息
dsl.if(d => d.age < 18)
  .message('未成年')
  .or(d => d.isBlocked)
  .message('已封禁')
  .assert(data);
```

**链式检查模式说明** (v1.1.1+):

当满足以下条件时，自动启用链式检查模式：
1. 使用 `.message()` 模式（不是 `.then()`/`.else()`）
2. root 条件有 `.message()`
3. 有 `.and()` 条件
4. 没有 `.or()` 条件

```javascript
// ✅ 启用链式检查（纯 AND 场景）
dsl.if(d => !d).message('A').and(d => d < 100).message('B')

// ❌ 不启用（有 .or()）
dsl.if(d => !d).message('A').and(d => d < 100).or(d => d > 200).message('B')

// ❌ 不启用（使用 .then()/.else()）
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').then('email!')
```

---

### .then(schema)

设置满足条件时的 Schema。

**参数**:
- `schema` {string|DslBuilder|JSONSchema} - DSL 字符串或 Schema 对象

**返回**: `this` - 支持链式调用

**示例**:
```javascript
// DSL 字符串
dsl.if((data) => data.userType === 'admin')
  .then('email!')

// DslBuilder 实例
dsl.if((data) => data.userType === 'admin')
  .then(dsl('email!').label('管理员邮箱'))

// JSON Schema 对象
dsl.if((data) => data.userType === 'admin')
  .then({ type: 'string', format: 'email' })
```

---

### .else(schema)

设置默认 Schema（所有条件都不满足时）。

**参数**:
- `schema` {string|DslBuilder|JSONSchema|null} - DSL 字符串、Schema 对象或 null

**返回**: `this` - 支持链式调用

**特性**: 可选，不写 else 就不验证

**示例**:
```javascript
// 显式指定 else
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else('email')

// else 为 null（显式跳过验证）
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else(null)

// 不写 else（隐式跳过验证）
dsl.if((data) => data.userType === 'admin')
  .then('email!')
```

---

### .validate(data, options)

快捷验证方法 - 返回完整验证结果。

**参数**:
- `data` {*} - 待验证的数据（任意类型）
- `options` {Object} - 验证选项（可选）
  - `locale` {string} - 语言环境（如 'zh-CN', 'en-US'）
  - `messages` {Object} - 自定义错误消息

**返回**: `Object` - 验证结果 `{ valid, errors, data }`

**特性**: 一行代码完成验证，无需外部 `validate()` 函数

**示例**:
```javascript
// 一行代码验证
const result = dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .validate({ age: 16 });
// => { valid: false, errors: [...], data }

// 复用验证器
const ageValidator = dsl.if(d => d.age < 18).message('未成年');
const r1 = ageValidator.validate({ age: 16 });  // false
const r2 = ageValidator.validate({ age: 20 });  // true

// 支持验证选项
const result = dsl.if(d => d.age < 18)
  .message('conditional.underAge')
  .validate({ age: 16 }, { locale: 'zh-CN' });

// 验证非对象类型
const result = dsl.if(d => d.includes('@'))
  .then('email!')
  .validate('test@example.com');
```

---

### .validateAsync(data, options)

异步验证方法 - 失败自动抛出异常。

**参数**:
- `data` {*} - 待验证的数据
- `options` {Object} - 验证选项（可选）

**返回**: `Promise<*>` - 验证通过返回数据，失败抛出异常

**抛出**: `ValidationError` - 验证失败抛出异常

**特性**: 适合 async/await 场景，失败自动抛错

**示例**:
```javascript
// 异步验证，失败自动抛错
try {
  const data = await dsl.if(d => d.age < 18)
    .message('未成年用户不能注册')
    .validateAsync({ age: 16 });
} catch (error) {
  console.log(error.message);  // "未成年用户不能注册"
  console.log(error.errors);   // 详细错误信息
}

// Express 中间件
app.post('/register', async (req, res, next) => {
  try {
    await dsl.if(d => d.age < 18)
      .message('未成年用户不能注册')
      .validateAsync(req.body);
    
    // 验证通过，继续处理...
    const user = await createUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// 复用验证器
const ageValidator = dsl.if(d => d.age < 18).message('未成年');

try {
  await ageValidator.validateAsync({ age: 16 });
} catch (error) {
  // 处理错误
}
```

---

### .assert(data, options)

断言方法 - 同步验证，失败直接抛错。

**参数**:
- `data` {*} - 待验证的数据
- `options` {Object} - 验证选项（可选）

**返回**: `*` - 验证通过返回数据

**抛出**: `ValidationError` - 验证失败时直接抛出 `ValidationError`

**特性**: 同步版本的断言验证，适合快速失败场景

**示例**:
```javascript
// 断言验证，失败直接抛错
try {
  dsl.if(d => d.age < 18)
    .message('未成年用户不能注册')
    .assert({ age: 16 });
} catch (error) {
  console.log(error.message);  // "未成年用户不能注册"
}

// 函数中快速断言
function registerUser(userData) {
  // 断言验证
  dsl.if(d => d.age < 18)
    .message('未成年用户不能注册')
    .assert(userData);
  
  dsl.if(d => !d.email)
    .message('邮箱不能为空')
    .assert(userData);
  
  // 验证通过，继续处理...
  return createUser(userData);
}

// 链式断言
function validateAndCreate(data) {
  dsl.if(d => d.age < 18).message('未成年').assert(data);
  dsl.if(d => !d.email).message('邮箱必填').assert(data);
  dsl.if(d => !d.username).message('用户名必填').assert(data);
  
  return createUser(data);
}
```

---

### .check(data)

快捷检查方法 - 只返回 boolean。

**参数**:
- `data` {*} - 待验证的数据

**返回**: `boolean` - 验证是否通过

**特性**: 比 `.validate()` 更简洁，适合只需要判断真假的场景

**示例**:
```javascript
// 快速判断
const isValid = dsl.if(d => d.age < 18)
  .message('未成年')
  .check({ age: 16 });
// => false

// 断言场景
if (!validator.check(userData)) {
  console.log('验证失败');
}

// 循环验证
const users = [{ age: 16 }, { age: 20 }, { age: 17 }];
const adults = users.filter(u => 
  !dsl.if(d => d.age < 18).message('未成年').check(u)
);
```

---

## 使用场景

### 场景1：用户注册 - 快捷验证

使用 `.validate()` 方法快速验证用户注册数据。

```javascript
// 创建可复用的验证器
const validators = {
  age: dsl.if(d => d.age < 18).message('未成年用户不能注册'),
  email: dsl.if(d => d.userType === 'admin')
    .message('管理员必须提供邮箱')
};

// 快速验证（一行代码）
function registerUser(userData) {
  // 验证年龄
  const ageResult = validators.age.validate(userData);
  if (!ageResult.valid) {
    return { error: ageResult.errors[0].message };
  }
  
  // 验证邮箱
  const emailResult = validators.email.validate(userData);
  if (!emailResult.valid) {
    return { error: emailResult.errors[0].message };
  }
  
  return { success: true };
}

// 使用
registerUser({ username: 'test', age: 16 });
// => { error: '未成年用户不能注册' }
```

### 场景2：批量数据验证 - 使用 .check()

使用 `.check()` 方法快速过滤符合条件的数据。

```javascript
const users = [
  { name: '张三', age: 16 },
  { name: '李四', age: 20 },
  { name: '王五', age: 17 },
  { name: '赵六', age: 25 }
];

// 创建验证器
const canRegister = dsl.if(d => d.age < 18)
  .message('未成年');

// ✅ 使用 .check() 过滤
const validUsers = users.filter(u => !canRegister.check(u));
// => [{ name: '李四', age: 20 }, { name: '赵六', age: 25 }]

// ✅ 使用 .check() 统计
const minorCount = users.filter(u => canRegister.check(u)).length;
console.log(`未成年用户: ${minorCount} 人`);
// => "未成年用户: 2 人"
```

### 场景3：表单实时验证

```javascript
// 前端表单验证
const formValidators = {
  username: dsl.if(d => d.length < 3)
    .message('用户名至少3个字符'),
  
  password: dsl.if(d => d.length < 8)
    .message('密码至少8个字符')
};

// 实时验证（输入时）
function onUsernameChange(value) {
  const isValid = formValidators.username.check(value);
  if (!isValid) {
    showError('用户名至少3个字符');
  } else {
    clearError();
  }
}

// 提交验证
function onSubmit(formData) {
  const usernameResult = formValidators.username.validate(formData.username);
  const passwordResult = formValidators.password.validate(formData.password);
  
  if (!usernameResult.valid) {
    return alert(usernameResult.errors[0].message);
  }
  
  if (!passwordResult.valid) {
    return alert(passwordResult.errors[0].message);
  }
  
  // 提交表单...
}
```

### 场景4：用户权限检查

```javascript
// 权限验证器
const hasPermission = dsl.if(d => d.role === 'admin')
  .or(d => d.role === 'moderator')
  .message('权限不足');

// 中间件
function checkPermission(req, res, next) {
  if (!hasPermission.check(req.user)) {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
}

// 路由
app.delete('/users/:id', checkPermission, deleteUser);
```

### 场景5：根据年龄和用户类型验证不同字段（传统方式对比）

```javascript
// 传统方式（需要 validate 函数）
const schema = dsl({
  username: 'string:3-32!',
  age: 'number:1-120!',
  userType: 'enum:admin|vip|user!',
  
  // 未成年禁止注册
  ageCheck: dsl.if((data) => data.age < 18)
    .message('未成年用户不能注册'),
  
  // 管理员必须有邮箱
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!')
    .else('email'),
  
  // VIP用户必须有手机号
  phone: dsl.if((data) => data.userType === 'vip')
    .then('string:11!')
    .else(null),
  
  // 管理员和VIP可以设置昵称
  nickname: dsl.if((data) => data.userType === 'admin')
    .or((data) => data.userType === 'vip')
    .then('string:2-20')
    .else(null)
});

// 测试
validate(schema, {
  username: 'admin1',
  age: 25,
  userType: 'admin',
  email: 'admin@example.com'
});
// => { valid: true }
```

### 场景2：商品发布

根据商品类型验证不同字段。

```javascript
const schema = dsl({
  title: 'string:1-100!',
  price: 'number:0-!',
  type: 'enum:physical|digital|service!',
  
  // 实体商品需要重量和尺寸
  weight: dsl.if((data) => data.type === 'physical')
    .then('number:0-!')
    .else(null),
  
  dimensions: dsl.if((data) => data.type === 'physical')
    .then('string!')
    .else(null),
  
  // 数字商品需要下载链接
  downloadUrl: dsl.if((data) => data.type === 'digital')
    .then('url!')
    .else(null),
  
  // 服务类需要服务时长
  duration: dsl.if((data) => data.type === 'service')
    .then('number:1-!')
    .else(null)
});

// 实体商品
validate(schema, {
  title: '笔记本电脑',
  price: 5999,
  type: 'physical',
  weight: 1.5,
  dimensions: '30x20x2cm'
});
// => { valid: true }

// 数字商品
validate(schema, {
  title: '电子书',
  price: 29.9,
  type: 'digital',
  downloadUrl: 'https://example.com/download'
});
// => { valid: true }
```

### 场景3：权限控制

根据用户角色和状态控制访问。

```javascript
const schema = dsl({
  userId: 'string!',
  role: 'enum:admin|moderator|user!',
  status: 'enum:active|suspended|banned!',
  
  // 被封禁用户禁止操作
  accessCheck: dsl.if((data) => data.status === 'banned')
    .message('您的账号已被封禁'),
  
  // 暂停用户只能查看
  operationType: dsl.if((data) => data.status === 'suspended')
    .then('enum:view!')
    .else('enum:view|edit|delete!'),
  
  // 管理员可以访问所有资源
  resourceIds: dsl.if((data) => data.role === 'admin')
    .then('array<string>')  // 可选
    .else('array<string>!')  // 必填
});
```

---

## 最佳实践

### 1. 条件函数保持简单

❌ **不推荐**:
```javascript
dsl.if((data) => {
  const user = getUserFromDB(data.userId);  // 同步数据库查询
  return user.level > 5;
})
```

✅ **推荐**:
```javascript
dsl.if((data) => data.userLevel > 5)
```

**原因**: 条件函数应该只读取数据对象，不应该有副作用或执行耗时操作。

---

### 2. 使用有意义的字段名

❌ **不推荐**:
```javascript
const schema = dsl({
  field1: 'string!',
  check1: dsl.if((data) => data.field1 === 'admin')
    .message('Error')
});
```

✅ **推荐**:
```javascript
const schema = dsl({
  userType: 'string!',
  ageVerification: dsl.if((data) => data.age < 18)
    .message('未成年用户不能注册')
});
```

---

### 3. 合理使用 else

当条件不满足时需要不同的验证规则，使用 `.else()`：

```javascript
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else('email')  // 不同的验证规则
```

当条件不满足时不需要验证，省略 `.else()`：

```javascript
dsl.if((data) => data.userType === 'vip')
  .then('string:6!')
  // 不写 else，非 vip 用户不验证
```

---

### 4. 多条件组合优先使用函数内部逻辑

简单条件可以直接在函数内部组合：

```javascript
// ✅ 推荐（简洁）
dsl.if((data) => data.age >= 18 && data.userType === 'admin')
  .then('email!')

// ⚠️ 可用但稍繁琐
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .then('email!')
```

复杂逻辑或需要可维护性时使用 `.and()` / `.or()`：

```javascript
// ✅ 推荐（可读性强）
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .and((data) => data.verified)
  .or((data) => data.isSuperUser)
  .then('email!')
```

---

### 5. 错误消息清晰明确

❌ **不推荐**:
```javascript
dsl.if((data) => data.age < 18)
  .message('Error')
```

✅ **推荐**:
```javascript
dsl.if((data) => data.age < 18)
  .message('未成年用户不能注册')
```

✅ **更好**（支持多语言）:
```javascript
dsl.if((data) => data.age < 18)
  .message('error.user.underage')
```

---

## 常见问题

### Q1: 条件函数什么时候执行？

**A**: 在调用 `validate()` 时执行，不是在定义 Schema 时。

```javascript
const schema = dsl({
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!')  // ← 这里不会执行
});

validate(schema, data);  // ← 条件函数在这里执行
```

---

### Q2: 条件函数可以访问哪些数据？

**A**: 可以访问完整的数据对象。

```javascript
const schema = dsl({
  age: 'number!',
  userType: 'string!',
  status: 'string!',
  email: dsl.if((data) => {
    // 可以访问所有字段
    return data.age >= 18 && data.userType === 'admin' && data.status === 'active';
  }).then('email!')
});
```

---

### Q3: 如何处理条件函数抛错？

**A**: 条件函数抛错会被捕获，视为条件不满足。

```javascript
const schema = dsl({
  obj: 'object!',
  result: dsl.if((data) => data.obj.nested.value > 10)
    .then('string!')
    .else(null)
});

// data.obj.nested 不存在，访问会抛错
validate(schema, { obj: {} });
// => { valid: true }  条件不满足，执行 else(null)
```

**建议**: 在条件函数中做好防御性检查：

```javascript
dsl.if((data) => data.obj?.nested?.value > 10)
  .then('string!')
```

---

### Q4: 可以嵌套 dsl.if() 吗？

**A**: 可以，支持嵌套。

```javascript
const schema = dsl({
  userType: 'string!',
  age: 'number!',
  email: dsl.if((data) => data.userType === 'admin')
    .then(
      dsl.if((data) => data.age >= 18)
        .then('email!')
        .else('email')
    )
    .else('email')
});
```

---

### Q5: 如何与现有的 dsl.match() 方法配合使用？

**A**: 可以混用，选择最适合的方法。

```javascript
const schema = dsl({
  // 静态值映射 - 使用 match
  userType: 'enum:admin|vip|user!',
  level: dsl.match('userType', {
    admin: 'enum:high!',
    vip: 'enum:medium!',
    user: 'enum:low!'
  }),
  
  // 动态条件判断 - 使用 if
  email: dsl.if((data) => data.userType === 'admin' && data.level === 'high')
    .then('email!')
    .else('email')
});
```

**选择建议**:
- **简单值映射** → 使用 `dsl.match()`
- **复杂条件逻辑** → 使用 `dsl.if()`

---

### Q6: 是否支持非对象类型（字符串、数组、数字等）？

**A**: 完全支持！可以直接验证任何类型的值。

```javascript
// 示例1：直接验证字符串
const stringSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:1-50');

validate(stringSchema, 'test@example.com'); // ✅ 作为邮箱验证
validate(stringSchema, 'just a text');       // ✅ 作为普通字符串验证

// 示例2：直接验证数组
const arraySchema = dsl.if((data) => Array.isArray(data) && data.length > 5)
  .message('数组最多5个元素');

validate(arraySchema, [1, 2, 3]);           // ✅ 通过
validate(arraySchema, [1, 2, 3, 4, 5, 6]);  // ❌ 失败

// 示例3：直接验证数字
const numberSchema = dsl.if((data) => typeof data === 'number' && data < 0)
  .message('不允许负数');

validate(numberSchema, 10);   // ✅ 通过
validate(numberSchema, -5);   // ❌ 失败

// 示例4：自动识别类型（邮箱或手机号）
const contactSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:11!');

validate(contactSchema, 'user@example.com');  // ✅ 作为邮箱验证
validate(contactSchema, '13800138000');       // ✅ 作为手机号验证
```

**完整示例**: 参见 `test/unit/conditional-non-object.test.ts`

---

### Q7: 性能如何？

**A**: 性能优秀，条件函数执行非常快。

- 条件函数是纯 JavaScript 函数，执行速度快
- 只遍历条件链一次，找到第一个匹配的条件就停止
- 支持缓存优化（WeakMap）

**性能提示**:
- 避免在条件函数中执行耗时操作（数据库查询、API 调用）
- 将最常见的条件放在前面（if 而不是 elseIf）

---

## 更新日志

### v1.1.1 (2026-01-05)

- ✅ 新增 `ConditionalBuilder` 类
- ✅ 新增 `dsl.if()` 链式条件 API
- ✅ 支持 and/or 多条件组合
- ✅ 支持 elseIf 多分支
- ✅ message 自动抛错（无需 throwError）
- ✅ else 可选（不写就不验证）
- ❌ 移除无效的旧条件方法类型定义

---

## 相关文档

- [快速开始](./quick-start.md)
- [验证指南](./validation-guide.md)
- [API 参考](./api-reference.md)
- [最佳实践](./best-practices.md)

