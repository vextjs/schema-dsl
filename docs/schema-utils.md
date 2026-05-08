# Schema 工具函数文档

> **更新时间**: 2025-12-25  

---

## 📑 目录

- [Schema 复用](#schema-复用)
- [Schema 合并](#schema-合并)
- [Schema 筛选](#schema-筛选)
- [Schema 导出](#schema-导出)
- [性能监控](#性能监控)
- [完整示例](#完整示例)

---

## Schema 复用

### 直接复用（最简单）✅

```javascript
const { dsl } = require('schema-dsl');

// 定义可复用字段（就是普通对象）
const commonFields = {
  email: 'email!'.label('邮箱地址'),
  phone: 'string:11!'.phone('cn').label('手机号'),
  username: 'string:3-32!'.username().label('用户名')
};

// 直接使用
const registerSchema = dsl({
  ...commonFields,  // ✅ 直接展开
  password: 'string:8-64!'.password('strong')
});

const profileSchema = dsl({
  ...commonFields,  // ✅ 重复使用
  bio: 'string:500',
  avatar: 'url'
});
```

**优点**: 最简单，直接使用 JavaScript 对象展开

---

### 函数复用（需要参数时）

```javascript
// 定义可复用字段函数
const createEmailField = (label = '邮箱地址') => 
  'email!'.label(label);

const createRangeField = (min, max) => 
  `number:${min}-${max}`.label('数值范围');

// 使用
const schema = dsl({
  email: createEmailField('联系邮箱'),
  workEmail: createEmailField('工作邮箱'),
  age: createRangeField(18, 120),
  score: createRangeField(0, 100)
});
```

**优点**: 支持参数化，灵活性强

---

### 字段库复用（大型项目）

```javascript
// fields/common.js - 定义字段库
module.exports = {
  email: () => 'email!'.label('邮箱地址'),
  phone: (country = 'cn') => `string:11!`.phone(country).label('手机号'),
  username: (range = '3-32') => `string:${range}!`.username(range).label('用户名'),
  password: (strength = 'medium') => 'string:8-64!'.password(strength).label('密码'),
  
  // 组合字段
  userAuth: () => ({
    username: 'string:3-32!'.username().label('用户名'),
    password: 'string:8-64!'.password('strong').label('密码')
  }),
  
  userProfile: () => ({
    nickname: 'string:2-20!'.label('昵称'),
    bio: 'string:500',
    avatar: 'url'
  })
};

// 使用
const fields = require('./fields/common');

const loginSchema = dsl({
  email: fields.email(),
  password: fields.password('strong')
});

const registerSchema = dsl({
  ...fields.userAuth(),  // ✅ 展开组合字段
  email: fields.email(),
  phone: fields.phone('cn')
});
```

**优点**: 统一管理，易于维护

---

## Schema 合并

### createLibrary() - 创建片段库

```javascript
const { SchemaUtils, dsl } = require('schema-dsl');

const fields = SchemaUtils.createLibrary({
  email: () => 'email!'.label('邮箱地址'),
  phone: () => dsl('string!').phone('cn').label('手机号'),
  profile: () => ({
    bio: 'string:500',
    avatar: 'url'
  })
});

const registerSchema = dsl({
  email: fields.email(),
  phone: fields.phone(),
  password: dsl('string!').password('strong')
});

const profileSchema = dsl({
  ...fields.profile(),
  email: fields.email()
});
```

**说明**: `createLibrary()` 只是返回片段工厂集合，适合在大型项目中集中管理字段和组合片段。

---

### extend() - 扩展Schema（继承）

```javascript
const baseUser = dsl({
  name: 'string!',
  email: 'email!'
});

// 扩展基础Schema
const admin = SchemaUtils.extend(baseUser, {
  role: 'admin|superadmin',
  permissions: 'array<string>'
});

// admin包含所有baseUser字段 + role + permissions
```

**说明**: 类似继承，保留基础Schema的所有字段

---

## Schema 筛选

### pick() - 选择字段

```javascript
const fullUser = dsl({
  name: 'string!',
  email: 'email!',
  password: 'string:8-64!',
  phone: 'string:11!',
  age: 'number:18-120'
});

// 只选择特定字段
const publicUser = SchemaUtils.pick(fullUser, ['name', 'email']);

// publicUser 只包含 name 和 email
```

**用途**: 从完整Schema中提取部分字段（如公开信息）

---

### omit() - 排除字段

```javascript
const fullUser = dsl({
  name: 'string!',
  email: 'email!',
  password: 'string:8-64!',
  phone: 'string:11!'
});

// 排除敏感字段
const safeUser = SchemaUtils.omit(fullUser, ['password']);

// safeUser 包含除 password 外的所有字段
```

**用途**: 移除敏感字段（如密码）

---

### partial() - 将字段改为可选

```javascript
const updateSchema = SchemaUtils.partial(dsl({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
}));

// 结果中 required 会被移除，适合 PATCH / 局部更新场景
```

也可以只对部分字段做可选化：

```javascript
const schema = dsl({
  name: 'string!',
  email: 'email!',
  age: 'number:18-120'
});

const partialContact = SchemaUtils.partial(schema, ['name', 'email']);
```

---

## Schema 导出

### toMarkdown() - 导出为Markdown文档

```javascript
const schema = dsl({
  username: 'string:3-32!'.label('用户名'),
  email: 'email!'.label('邮箱地址'),
  age: 'number:18-120'
});

const markdown = SchemaUtils.toMarkdown(schema, {
  title: '用户注册Schema'
});

console.log(markdown);
```

**输出**:
```markdown
# 用户注册Schema

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| username | string | ✅ | 3-32字符 | 用户名 |
| email | email | ✅ | - | 邮箱地址 |
| age | number | ❌ | 18-120 | - |
```

**用途**: 生成API文档

---

### toHTML() - 导出为HTML表格

```javascript
const html = SchemaUtils.toHTML(schema, {
  title: '用户注册Schema'
});

// 生成HTML表格，可以嵌入文档
```

**用途**: 集成到Web文档

---

## 性能监控

### validateBatch() - 批量验证统计

```javascript
const { SchemaUtils, Validator, dsl } = require('schema-dsl');

const schema = dsl({
  email: 'email!',
  age: 'number:18-120'
});

const validator = new Validator();

const items = [
  { email: 'user1@example.com', age: 25 },
  { email: 'invalid', age: 15 },
  { email: 'user2@example.com', age: 30 }
];

const batch = SchemaUtils.validateBatch(schema, items, validator.getAjv());

console.log(batch);
// {
//   results: [
//     { index: 0, valid: true, errors: null, data: {...} },
//     { index: 1, valid: false, errors: [...], data: null },
//     { index: 2, valid: true, errors: null, data: {...} }
//   ],
//   summary: {
//     total: 3,
//     valid: 2,
//     invalid: 1,
//     duration: 5,
//     averageTime: 1.67
//   }
// }
```

**说明**:
- 如果你只需要“每条是否通过”的结果，可直接使用 `validator.validateBatch(schema, items)`
- 如果你还需要汇总统计信息，再使用 `SchemaUtils.validateBatch(schema, items, validator.getAjv())`

---

### withPerformance() - 给 Validator 添加性能包装

```javascript
const validator = SchemaUtils.withPerformance(new Validator());

const result = validator.validate(schema, data);

console.log(result.performance);
// {
//   duration: 2,
//   timestamp: '2026-05-06T12:34:56.789Z'
// }
```

**用途**: 在不改业务调用方式的前提下，为验证结果附加耗时信息

---

## 其他工具

### clone() - 深度克隆Schema

```javascript
const original = dsl({
  user: {
    name: 'string!',
    profile: {
      bio: 'string:500'
    }
  }
});

const cloned = SchemaUtils.clone(original);

// cloned 是完全独立的副本
cloned.properties.user.properties.name.maxLength = 100;
// original 不会被修改
```

---

### validateNestingDepth() - 检查嵌套深度

```javascript
const { dsl, DslBuilder } = require('schema-dsl');

const schema = dsl({
  level1: {
    level2: {
      level3: {
        level4: 'string'
      }
    }
  }
});

const result = DslBuilder.validateNestingDepth(schema, 10);
// 返回: { valid: true, depth: 4, path: 'level1.level2.level3', message: '...' }

if (result.depth > 5) {
  console.warn('嵌套层级过深，建议扁平化');
}
```

**说明**: 这个能力属于 `DslBuilder` 静态方法，不是 `SchemaUtils` 的成员；这里一并列出是因为它常与 Schema 工具链一起使用。

---

## 完整示例

### 企业级字段库

```javascript
// libs/fields/index.js
module.exports = {
  // 基础字段
  id: () => 'string!'.pattern(/^[a-zA-Z0-9_-]+$/).label('ID'),
  email: () => 'email!'.label('邮箱地址'),
  phone: (country = 'cn') => 'string:11!'.phone(country).label('手机号'),
  
  // 认证字段
  auth: {
    username: () => 'string:3-32!'.username().label('用户名'),
    password: (strength = 'strong') => 
      'string:8-64!'.password(strength).label('密码')
  },
  
  // 个人信息
  profile: {
    nickname: () => 'string:2-20!'.label('昵称'),
    realName: () => 'string:2-50'.label('真实姓名'),
    bio: () => 'string:500',
    avatar: () => 'url'.label('头像'),
    birthday: () => 'date'
  },
  
  // 地址信息
  address: () => ({
    country: 'string:2-50!',
    province: 'string:2-50!',
    city: 'string:2-50!',
    detail: 'string:10-200!'
  }),
  
  // 时间戳
  timestamps: () => ({
    created_at: 'datetime!',
    updated_at: 'datetime!'
  })
};

// 使用
const fields = require('./libs/fields');

// 用户注册
const registerSchema = dsl({
  ...fields.auth,
  email: fields.email(),
  phone: fields.phone('cn'),
  agree: 'boolean!'
});

// 用户资料
const profileSchema = dsl({
  ...fields.profile,
  ...fields.timestamps()
});

// 完整用户
const userSchema = SchemaUtils.extend(
  SchemaUtils.extend(registerSchema, profileSchema),
  fields.address()
);
```

---

## 最佳实践

### 1. 小项目：直接复用

```javascript
const commonFields = {
  email: 'email!'.label('邮箱'),
  phone: 'string:11!'.phone('cn')
};

const schema1 = dsl({ ...commonFields, ... });
const schema2 = dsl({ ...commonFields, ... });
```

### 2. 中型项目：函数复用

```javascript
const createUserFields = (options = {}) => ({
  email: 'email!'.label(options.emailLabel || '邮箱'),
  phone: 'string:11!'.phone(options.country || 'cn')
});

const schema = dsl({
  ...createUserFields({ emailLabel: '联系邮箱' }),
  ...otherFields
});
```

### 3. 大型项目：字段库

```javascript
// 统一管理在 fields/ 目录
const fields = require('./fields');

const schema = dsl({
  ...fields.auth,
  ...fields.profile
});
```

---

## 相关文档

- [DSL 语法](./dsl-syntax.md)
- [String 扩展](./string-extensions.md)
- [API 参考](./api-reference.md)

---

## 对应示例文件

**示例入口**: [schema-utils.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/schema-utils.ts)  
**说明**: 覆盖 `reusable()`、`createLibrary()`、`extend()`、`validateBatch()`、`withPerformance()` 和 `clone()` 的最小工作流。

---

**最后更新**: 2026-05-08


