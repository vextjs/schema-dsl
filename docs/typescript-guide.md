# TypeScript 使用指南

> **版本**: schema-dsl v2.0.0-beta.2  
> **更新日期**: 2026-05-08  
> **重要**: v1.0.6 移除了全局 String 类型扩展以避免类型污染

---

## 📋 目录

1. [快速开始](#1-快速开始)
2. [TypeScript 中的链式调用](#2-typescript-中的链式调用)
3. [类型推导最佳实践](#3-类型推导最佳实践)
4. [完整示例](#4-完整示例)
5. [常见问题](#5-常见问题)

---

## 1. 快速开始

### 1.1 安装

```bash
npm install schema-dsl
```

### 1.2 基础用法

```typescript
import { dsl, validate } from 'schema-dsl';

// 定义 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-100'
});

// 验证数据
const result = validate(userSchema, {
  username: 'testuser',
  email: 'test@example.com',
  age: 25
});

if (result.valid) {
  console.log('验证通过:', result.data);
} else {
  console.log('验证失败:', result.errors);
}
```

---

## 2. TypeScript 中的链式调用

### 2.1 重要变更（v1.0.6）

**v1.0.6 移除了全局 `interface String` 扩展**，原因：
- ❌ 全局类型扩展会污染原生 String 类型
- ❌ 导致 `trim()`、`toLowerCase()` 等原生方法的类型推断错误
- ❌ 影响所有使用 TypeScript 的项目的类型安全

**结果**：在 TypeScript 中直接对字符串链式调用会报类型错误：

```typescript
// ❌ TypeScript 中会报错（v1.0.6+）
const schema = dsl({
  email: 'email!'.label('邮箱')  // 类型错误：Property 'label' does not exist on type 'string'
});

// ✅ JavaScript 中仍然可以正常使用
const schema = dsl({
  email: 'email!'.label('邮箱')  // 运行时完全正常
});
```

### 2.2 正确用法 ⭐⭐⭐

**TypeScript 中必须使用 `dsl()` 函数包裹字符串**，才能获得类型提示和链式调用：

```typescript
// ✅ 正确：使用 dsl() 包裹（v1.0.6+ 必须）
const schema = dsl({
  email: dsl('email!').label('邮箱').pattern(/custom/)
});

// ✅ 也可以先定义再使用
const emailField = dsl('email!').label('邮箱');
const schema = dsl({ email: emailField });
```

**好处**：
- ✅ 获得完整的类型推导和 IDE 自动提示
- ✅ 不污染原生 String 类型（`trim()` 正确返回 `string`）
- ✅ 更好的类型安全和开发体验

### 2.3 工作原理

```typescript
// dsl(string) 返回 DslBuilder 实例
const emailBuilder = dsl('email!');
//    ^? DslBuilder - 完整的类型定义

// DslBuilder 支持所有链式方法，并有完整类型提示
emailBuilder.label('邮箱')
//          ^? IDE 自动提示所有可用方法
  .pattern(/^[a-z]+@[a-z]+\.[a-z]+$/)
  .error({ required: '邮箱必填' });

> ℹ️ 当前类型声明优先覆盖稳定链式 API，例如 `label()`、`pattern()`、`error()`、`default()`。  
> 某些运行时扩展方法依然可用，但如果类型声明未暴露，建议在 TypeScript 代码里优先改写为上述稳定组合。
```

---

## 3. 类型推导最佳实践

### 3.1 方式对比

| 方式 | JavaScript | TypeScript | 类型推导 | 推荐度 |
|------|-----------|-----------|---------|--------|
| 直接字符串 | ✅ 完美 | ⚠️ 可能无提示 | ❌ 弱 | ⭐⭐ |
| dsl() 包裹 | ✅ 完美 | ✅ 完美 | ✅ 强 | ⭐⭐⭐⭐⭐ |
| 先定义再使用 | ✅ 完美 | ✅ 完美 | ✅ 强 | ⭐⭐⭐⭐ |

### 3.2 推荐写法

#### ✅ 方式 1: 内联使用 dsl() 包裹（最推荐）

```typescript
const schema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
    .error({ pattern: '只能包含字母、数字和下划线' }),
  
  email: dsl('email!')
    .label('邮箱地址')
    .error({ required: '邮箱必填' }),
  
  age: dsl('number:18-100')
    .label('年龄')
});
```

**优点**:
- ✅ 完整的类型推导
- ✅ IDE 自动提示所有方法
- ✅ 代码紧凑，逻辑清晰

#### ✅ 方式 2: 先定义字段，再组合（适合复用）

```typescript
// 定义可复用的字段
const emailField = dsl('email!')
  .label('邮箱地址')
  .error({ required: '邮箱必填' });

const usernameField = dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('用户名')
  .error({ pattern: '用户名只能包含字母、数字和下划线' });

// 组合使用
const registrationSchema = dsl({
  email: emailField,
  username: usernameField,
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('密码')
    .error({ pattern: '密码至少 8 位且必须包含字母和数字' })
});

const loginSchema = dsl({
  email: emailField,  // 复用
  password: dsl('string!').label('密码')
});
```

**优点**:
- ✅ 字段定义可复用
- ✅ 代码更模块化
- ✅ 适合大型项目

#### ❌ 不推荐的写法

```typescript
// ❌ 在 TypeScript 中直接使用字符串链式调用
const schema = dsl({
  email: 'email!'.label('邮箱')  // 可能无类型提示
});

// ❌ 混合使用（不一致）
const schema = dsl({
  email: 'email!'.label('邮箱'),      // 字符串扩展
  username: dsl('string!').label('用户名')  // dsl 包裹
});
```

---

## 4. 完整示例

### 4.1 用户注册表单

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

// 定义 Schema
const registrationSchema = dsl({
  profile: dsl({
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .error({ pattern: '只能包含字母、数字和下划线' }),
    
    email: dsl('email!')
      .label('邮箱地址')
      .error({ required: '邮箱必填' }),
    
    password: dsl('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('密码')
      .error({ pattern: '密码至少 8 位且必须包含字母和数字' }),
    
    age: dsl('number:18-100')
      .label('年龄')
  }),
  
  settings: dsl({
    emailNotify: dsl('boolean')
      .default(true)
      .label('邮件通知'),
    
    language: dsl('string')
      .default('zh-CN')
      .label('语言设置')
  })
});

// 异步验证（推荐）
async function registerUser(data: any) {
  try {
    const validData = await validateAsync(registrationSchema, data);
    console.log('注册成功:', validData);
    return validData;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('验证失败:');
      error.errors.forEach(err => {
        console.log(`  - ${err.path}: ${err.message}`);
      });
      throw error;
    }
    throw error;
  }
}

// 使用
registerUser({
  profile: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'StrongPass123!',
    age: 25
  },
  settings: {
    emailNotify: true,
    language: 'en-US'
  }
});
```

### 4.2 API 请求验证

```typescript
import { ValidationError, dsl, validateAsync } from 'schema-dsl';
import express from 'express';

const app = express();
app.use(express.json());

// 定义 API Schema
const createUserSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  
  email: dsl('email!').label('邮箱'),
  
  role: dsl('string')
    .default('user')
    .label('角色')
});

// 使用中间件
app.post('/api/users', async (req, res) => {
  try {
    const validData = await validateAsync(createUserSchema, req.body);
    
    // 创建用户逻辑
    const user = await createUser(validData);
    
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    } else {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
});
```

### 4.3 表单字段复用

```typescript
import { dsl } from 'schema-dsl';

// 定义常用字段
const commonFields = {
  email: dsl('email!')
    .label('邮箱地址')
    .error({ required: '邮箱必填' }),
  
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名只能包含字母、数字和下划线' }),
  
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('密码')
    .error({ pattern: '密码至少 8 位且必须包含字母和数字' })
};

// 注册表单
const registrationSchema = dsl({
  ...commonFields,
  confirmPassword: dsl('string!')
    .label('确认密码')
});

// 登录表单
const loginSchema = dsl({
  email: commonFields.email,
  password: dsl('string!').label('密码')  // 登录时不需要强密码验证
});

// 密码重置表单
const resetPasswordSchema = dsl({
  email: commonFields.email,
  newPassword: commonFields.password,
  confirmPassword: dsl('string!').label('确认新密码')
});
```

---

## 5. 常见问题

### 5.1 为什么 TypeScript 中字符串链式调用没有类型提示？

**原因**: TypeScript 对全局 `String.prototype` 扩展的类型推导有限制。

**解决**: 使用 `dsl()` 包裹字符串：

```typescript
// ❌ 可能无提示
'email!'.label('邮箱')

// ✅ 完整提示
dsl('email!').label('邮箱')
```

### 5.2 JavaScript 用户需要改变写法吗？

**不需要！** JavaScript 用户可以继续使用字符串链式调用：

```javascript
// JavaScript 中完全正常
const schema = dsl({
  email: 'email!'.label('邮箱')
});
```

### 5.3 如何在严格模式下使用？

在 `tsconfig.json` 中启用严格模式也没问题：

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

只需使用 `dsl()` 包裹即可：

```typescript
const schema = dsl({
  email: dsl('email!').label('邮箱')  // ✅ 严格模式下正常
});
```

### 5.4 如何获取验证后的数据类型？

使用泛型参数：

```typescript
interface User {
  username: string;
  email: string;
  age?: number;
}

// 同步验证
const result = validate<User>(userSchema, data);
if (result.valid) {
  const user: User = result.data;  // ✅ 类型安全
}

// 异步验证
const validUser = await validateAsync<User>(userSchema, data);
//    ^? User - 完整的类型推导
```

### 5.5 如何处理嵌套对象的验证错误？

```typescript
try {
  await validateAsync(schema, data);
} catch (error) {
  if (error instanceof ValidationError) {
    // 方式 1: 遍历所有错误
    error.errors.forEach(err => {
      console.log(`${err.path}: ${err.message}`);
      // 输出: profile.username: 用户名至少3个字符
    });
    
    // 方式 2: 获取特定字段错误
    const usernameError = error.getFieldError('profile.username');
    if (usernameError) {
      console.log(usernameError.message);
    }
    
    // 方式 3: 获取所有字段错误映射
    const fieldErrors = error.getFieldErrors();
    // { 'profile.username': {...}, 'profile.email': {...} }
  }
}
```

---

## 6. 进阶技巧

### 6.1 额外业务规则

```typescript
const schema = dsl({
  username: dsl('string:3-32!').label('用户名')
});

const result = await validateAsync(schema, data);
if (result.username === 'admin') {
  throw new Error('用户名已存在');
}
```

这种写法的好处是：结构校验仍由 schema-dsl 负责，业务唯一性、数据库查重等规则继续留在 TypeScript 业务层，避免把外部依赖塞进字段声明。

### 6.2 条件验证

```typescript
const schema = dsl({
  userType: dsl('string!').label('用户类型'),
  
  // 使用 dsl.match() 根据 userType 字段动态验证
  companyName: dsl.match('userType', {
    'company': 'string!',  // 企业用户必填
    '_default': 'string'   // 个人用户可选
  })
});
```

### 6.3 Schema 复用和扩展

```typescript
import { SchemaUtils } from 'schema-dsl';

// 基础用户 Schema
const baseUserSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email: dsl('email!').label('邮箱')
});

// 扩展为管理员 Schema
const adminSchema = SchemaUtils.extend(baseUserSchema, {
  role: dsl('string!').default('admin').label('角色'),
  permissions: dsl('array<string>').label('权限列表')
});

// 只选择部分字段
const publicUserSchema = SchemaUtils.pick(
  baseUserSchema,
  ['username']
);
```

---

## 7. 性能优化

### 7.1 复用 Schema 与默认缓存

```typescript
const schema = dsl({
  email: dsl('email!').label('邮箱')
});

// 多次验证会复用默认 Validator 的编译缓存
await validateAsync(schema, data1);
await validateAsync(schema, data2);
await validateAsync(schema, data3);
```

### 7.2 缓存配置

```typescript
import { dsl } from 'schema-dsl';

// 配置缓存大小
dsl.config({
  cache: {
    maxSize: 5000,  // 缓存条目数
    ttl: 60000      // 过期时间（毫秒）
  }
});
```

---

## 8. 最佳实践总结

1. ✅ **TypeScript 中始终使用 `dsl()` 包裹字符串**
2. ✅ **使用 `validateAsync` 进行异步验证**
3. ✅ **为验证结果添加泛型类型参数**
4. ✅ **复用常用字段定义**
5. ✅ **使用 `ValidationError` 类型守卫处理错误**
6. ✅ **为用户提供友好的错误消息**
7. ✅ **复用常用 Schema 对象，让默认缓存命中**

---

## 9. 相关资源

- [API 参考文档](./api-reference.md)
- [DSL 语法完整指南](./dsl-syntax.md)
- [验证规则参考](./validation-guide.md)
- [错误处理指南](./error-handling.md)
- [GitHub 仓库](https://github.com/vextjs/schema-dsl)

---

## 对应示例文件

**示例入口**: [typescript-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/typescript-guide.ts)  
**说明**: 展示 TypeScript 下推荐的 `dsl()` 包裹写法、`validate<T>()` / `validateAsync<T>()`、以及 `ValidationError` 的字段错误读取方式。

---

**更新日期**: 2026-05-08  
**文档版本**: v2.0.0-beta.2

