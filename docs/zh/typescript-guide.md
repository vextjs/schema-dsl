# TypeScript 使用指南

> **版本**: schema-dsl v2.1.0
> **更新日期**: 2026-06-18
> **重要**: 自 v2.1.0 起，公开 TypeScript 示例默认推荐 `schema-dsl/pure` + `s`，避免导入后自动安装 String 原型扩展。

---

当你需要在纯 DSL 字符串、DSL 种子 builder、命名空间 factory 和可选 String 扩展之间做取舍时，请尽早阅读本页。它说明 TypeScript 能推导什么、哪些仍是运行时约束，以及编辑器提示的边界。

## 1. 快速开始

### 1.1 安装

```bash
npm install schema-dsl
```

### 1.2 基础用法

```typescript
import { s, validate } from 'schema-dsl/pure';

// 定义 Schema
const userSchema = s({
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

### 2.1 默认不扩展全局 String 类型

默认情况下，TypeScript 不会获得全局 `interface String` 链式声明。这样可以让导入 `schema-dsl/pure` 的项目保持原生 `trim()`、`toLowerCase()` 等方法的类型稳定。

因此，直接字符串链式调用默认会报类型错误；只有显式导入 `schema-dsl/string-types` 时才会获得 String 链式提示：

```typescript
// ❌ 默认 TypeScript 中会报错
const defaultErrorSchema = s({
  email: 'email!'.label('邮箱')  // 类型错误：Property 'label' does not exist on type 'string'
});

// ✅ 不扩展全局 String 类型时的默认 TypeScript 路径：使用 factory
const defaultBuilderSchema = s({
  email: s.email().label('邮箱').require()
});
```

### 2.2 v2.1.0 起推荐编写入口

按编写目标选择三种推荐入口之一：

```typescript
import { s } from 'schema-dsl/pure';

// ✅ 纯 DSL：配置最短，字面量内部提示有限
const compactSchema = s({
  email: 'email!',
  username: 'string:3-32!'
});

// ✅ 显式 DSL 种子：紧凑 DSL + builder 提示
const emailField = s('email!').label('邮箱').pattern(/custom/);
const reusableSchema = s({ email: emailField });

// ✅ factory 写法：最完整的 TypeScript 方法发现
const accountEmail = s.email().label('邮箱').pattern(/custom/).require();
const factorySchema = s({ email: accountEmail });
```

兼容导出 `dsl` 仍会保留，但新的公开示例统一使用更短的 `s` 命名空间。从 `schema-dsl/pure` 导入时，`s` 支持纯 DSL 字符串、`s('...')` 和 `s.xxx()`，不会安装 String 扩展。

如果项目会通过 `transformSchemaDsl()` 或 `schemaDslEsbuildPlugin()` 把静态 String 链式调用编译成 builder 调用，可以显式导入类型入口：

```typescript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/string-types';

const schema = s({
  role: 'admin|user|guest'.label('角色'),
  email: 'email!'.label('邮箱').require()
});
```

直接字符串链式不是默认路径。只有当你明确需要最紧凑源码，并且项目已经显式安装编译期或运行时 String 扩展支持时，才建议使用。

**好处**：
- ✅ 纯 DSL 字符串仍然是最短配置方式。
- ✅ `s('...')` 保留 DSL 语法，同时在种子之后提供完整 builder 方法提示。
- ✅ `s.email()` / `s.string()` / `s.number()` 提供最完整的 factory 和方法发现。
- ✅ `schema-dsl/pure` 入口不会安装 String 扩展。
- ✅ transform + `schema-dsl/string-types` 路径只在显式导入时提供 String 链式提示。
- ✅ 已知 DSL 字面量仍可通过 `InferSchema` / `InferDslString` 获得轻量静态值类型推导。

### 2.3 工作原理

```typescript
// s factory 和 s(string) 都返回按公开 IDslBuilder 链式契约声明的 builder
const emailBuilder = s.email().require();
const sameBuilderShape = s('email!').label('邮箱');
//    ^? IDslBuilder - 完整公开链式类型

// DslBuilder 支持所有链式方法，并有完整类型提示
emailBuilder.label('邮箱')
//          ^? IDE 自动提示所有可用方法
  .pattern(/^[a-z]+@[a-z]+\.[a-z]+$/)
  .error({ required: '邮箱必填' });
```

不要把 `s('string:3-32!')` 理解为完整的 TypeScript 级 DSL parser。它能为返回的 builder 提供完整链式方法提示；字符串字面量本身只通过 `InferDslString<'string:3-32!'>` 等辅助类型做粗粒度值类型推导，例如推成 `string`。长度范围、正则、自定义验证器和本地化消息属于运行时 schema 约束，不会变成 TypeScript 的精确值域类型。

---

## 3. 类型推导最佳实践

### 3.1 方式对比

| 方式 | JavaScript | TypeScript | 类型推导 | 推荐度 |
|------|-----------|-----------|---------|--------|
| `s({})` 中的纯 DSL | ✅ 可用 | ✅ 稳定 | ✅ DSL 字面量轻量推导 | ⭐⭐⭐⭐⭐ |
| `s('...')` DSL 种子 | ✅ 可用 | ✅ builder 方法提示完整 | ✅ builder 提示 + DSL 字面量轻量推导 | ⭐⭐⭐⭐⭐ |
| `s.xxx()` 命名空间 factory | ✅ 可用 | ✅ builder 方法提示完整 | ✅ builder 提示强，不依赖 DSL 字面量解析 | ⭐⭐⭐⭐⭐ |
| 未导入 `string-types` 的直接字符串 | ✅ 仅安装 String 运行时后可用 | ❌ 类型错误 | ❌ 弱 | ⭐ |
| 导入 `schema-dsl/string-types` 的直接字符串 | ✅ 显式 runtime/transform 支持后可用 | ✅ opt-in String 链式提示 | ✅ 编写提示强；DSL 字面量轻量推导 | ⭐⭐⭐ |
| `dsl('...')` 兼容别名 | ✅ 可用 | ✅ builder 方法提示完整 | ✅ 与 `s('...')` 相同 builder 表面 | ⭐⭐⭐ |

### 3.2 推荐写法

#### ✅ 方式 1: 纯 DSL 字符串，保持最短配置

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: 'username:medium!',
  email: 'email!',
  age: 'number:18-100'
});
```

**优点**:
- ✅ 公开文档中最短的编写方式
- ✅ 不安装 String 扩展
- ✅ 适合只需要内置 DSL 约束的字段

#### ✅ 方式 2: 先定义 DSL 种子，再组合

```typescript
import { s } from 'schema-dsl/pure';

// 定义可复用的字段
const emailField = s('email!')
  .label('邮箱地址')
  .error({ required: '邮箱必填' });

const usernameField = s('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('用户名')
  .error({ pattern: '用户名只能包含字母、数字和下划线' });

// 组合使用
const registrationSchema = s({
  email: emailField,
  username: usernameField,
  password: s('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('密码')
    .error({ pattern: '密码至少 8 位且必须包含字母和数字' })
});

const loginSchema = s({
  email: emailField,  // 复用
  password: s('string!').label('密码')
});
```

**优点**:
- ✅ 字段定义可复用
- ✅ 代码更模块化
- ✅ 适合大型项目

#### ✅ 方式 3: 需要最完整方法发现时使用 `s` 命名空间 factory

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: s.string().min(3).max(32).require()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),

  email: s.email().label('邮箱地址').require(),
  age: s.number().min(18).max(100).label('年龄')
});
```

**优点**:
- ✅ 完整的 builder 链式方法提示
- ✅ IDE 自动提示所有 factory 与 builder 方法
- ✅ 适合更偏好可发现 API、而不是紧凑 DSL 字面量的用户

#### ❌ 避免未配置或不一致的写法

```typescript
// ❌ 未导入 schema-dsl/string-types 就直接使用字符串链式调用
const schema = s({
  email: 'email!'.label('邮箱')  // 可能无类型提示
});

// ❌ 同一份指南里混用 root 入口副作用和 pure 入口示例
// 建议一个指南、包或代码区域只保留一种入口风格。
```

---

## 4. 完整示例

### 4.1 用户注册表单

```typescript
import { s, validateAsync, ValidationError } from 'schema-dsl/pure';

// 定义 Schema
const registrationSchema = s({
  profile: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .error({ pattern: '只能包含字母、数字和下划线' }),
    
    email: s('email!')
      .label('邮箱地址')
      .error({ required: '邮箱必填' }),
    
    password: s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('密码')
      .error({ pattern: '密码至少 8 位且必须包含字母和数字' }),
    
    age: s('number:18-100')
      .label('年龄')
  }),
  
  settings: s({
    emailNotify: s('boolean')
      .default(true)
      .label('邮件通知'),
    
    language: s('string')
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
import { ValidationError, s, validateAsync } from 'schema-dsl/pure';
import express from 'express';

const app = express();
app.use(express.json());

// 定义 API Schema
const createUserSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名'),
  
  email: s('email!').label('邮箱'),
  
  role: s('string')
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
import { s } from 'schema-dsl/pure';

// 定义常用字段
const commonFields = {
  email: s('email!')
    .label('邮箱地址')
    .error({ required: '邮箱必填' }),
  
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名只能包含字母、数字和下划线' }),
  
  password: s('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('密码')
    .error({ pattern: '密码至少 8 位且必须包含字母和数字' })
};

// 注册表单
const registrationSchema = s({
  ...commonFields,
  confirmPassword: s('string!')
    .label('确认密码')
});

// 登录表单
const loginSchema = s({
  email: commonFields.email,
  password: s('string!').label('密码')  // 登录时不需要强密码验证
});

// 密码重置表单
const resetPasswordSchema = s({
  email: commonFields.email,
  newPassword: commonFields.password,
  confirmPassword: s('string!').label('确认新密码')
});
```

---

## 5. 常见问题

### 5.1 为什么 TypeScript 中字符串链式调用没有类型提示？

**原因**: TypeScript 对全局 `String.prototype` 扩展的类型推导有限制。

**解决**: 使用 `s('...')` 包裹字符串：

```typescript
// ❌ 可能无提示
'email!'.label('邮箱')

// ✅ 完整提示
s('email!').label('邮箱')
```

### 5.2 JavaScript 用户需要改变写法吗？

已有 JavaScript 用户可以继续使用 root 入口兼容写法；新文档推荐无副作用的 pure 入口：

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  email: s('email!').label('邮箱'),
  age: 'number:18-100'
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

只需使用 `s('...')` 即可：

```typescript
const schema = s({
  email: s('email!').label('邮箱')  // ✅ 严格模式下正常
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
const schema = s({
  username: s('string:3-32!').label('用户名')
});

const result = await validateAsync(schema, data);
if (result.username === 'admin') {
  throw new Error('用户名已存在');
}
```

这种写法的好处是：结构校验仍由 schema-dsl 负责，业务唯一性、数据库查重等规则继续留在 TypeScript 业务层，避免把外部依赖塞进字段声明。

### 6.2 条件验证

```typescript
const schema = s({
  userType: s('string!').label('用户类型'),
  
  // 使用 s.match() 根据 userType 字段动态验证
  companyName: s.match('userType', {
    'company': 'string!',  // 企业用户必填
    '_default': 'string'   // 个人用户可选
  })
});
```

### 6.3 Schema 复用和扩展

```typescript
import { SchemaUtils, s } from 'schema-dsl/pure';

// 基础用户 Schema
const baseUserSchema = s({
  username: s('string:3-32!').label('用户名'),
  email: s('email!').label('邮箱')
});

// 扩展为管理员 Schema
const adminSchema = SchemaUtils.extend(baseUserSchema, {
  role: s('string!').default('admin').label('角色'),
  permissions: s('array<string>').label('权限列表')
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
const schema = s({
  email: s('email!').label('邮箱')
});

// 多次验证会复用默认 Validator 的编译缓存
await validateAsync(schema, data1);
await validateAsync(schema, data2);
await validateAsync(schema, data3);
```

### 7.2 缓存配置

```typescript
import { s } from 'schema-dsl/pure';

// 配置缓存大小
s.config({
  cache: {
    maxSize: 5000,  // 缓存条目数
    ttl: 60000      // 过期时间（毫秒）
  }
});
```

---

## 8. 最佳实践总结

1. ✅ **按目标选择入口：`s({})` 中的纯 DSL、`s('...')` 或 `s.xxx()`**
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
**说明**: 展示 TypeScript 下推荐的三种编写入口、`validate<T>()` / `validateAsync<T>()`、以及 `ValidationError` 的字段错误读取方式。

---

**更新日期**: 2026-06-18
**文档版本**: v2.1.0

