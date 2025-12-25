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
const { dsl } = require('schemaio');

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

### merge() - 合并多个Schema

```javascript
const { SchemaUtils, dsl } = require('schemaio');

// 基础Schema
const baseUser = dsl({
  name: 'string:1-50!',
  email: 'email!'
});

// 扩展Schema
const withAge = dsl({
  age: 'number:18-120',
  gender: 'male|female|other'
});

const withProfile = dsl({
  bio: 'string:500',
  avatar: 'url'
});

// 合并
const fullUser = SchemaUtils.merge(baseUser, withAge, withProfile);
```

**说明**: 合并 properties 和 required 数组，自动去重

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

## Schema 导出

### toMarkdown() - 导出为Markdown文档

```javascript
const schema = dsl({
  username: 'string:3-32!'.label('用户名'),
  email: 'email!'.label('邮箱地址'),
  age: 'number:18-120'
});

const markdown = SchemaUtils.toMarkdown(schema, {
  title: '用户注册Schema',
  showRequired: true,
  showType: true,
  showConstraints: true
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
  title: '用户注册Schema',
  theme: 'bootstrap'  // 或 'default'
});

// 生成HTML表格，可以嵌入文档
```

**用途**: 集成到Web文档

---

## 性能监控

### validateBatch() - 批量验证

```javascript
const { Validator } = require('schemaio');

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

const results = validator.validateBatch(schema, items);

console.log(results);
// {
//   results: [
//     { valid: true, ... },
//     { valid: false, errors: [...] },
//     { valid: true, ... }
//   ],
//   stats: {
//     total: 3,
//     valid: 2,
//     invalid: 1,
//     duration: '5.2ms'
//   }
// }
```

**用途**: 批量验证数据，获取性能统计

---

### 性能监控（自动）

```javascript
const validator = new Validator({ performance: true });

const result = validator.validate(schema, data);

console.log(result.performance);
// {
//   duration: '2.1ms',
//   compileDuration: '1.5ms',
//   validateDuration: '0.6ms'
// }
```

**用途**: 监控验证性能

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
const schema = dsl({
  level1: {
    level2: {
      level3: {
        level4: 'string'
      }
    }
  }
});

const depth = schema.validateNestingDepth(10);
// 返回: 4

if (depth > 5) {
  console.warn('嵌套层级过深，建议扁平化');
}
```

**用途**: 防止过深嵌套

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
const userSchema = SchemaUtils.merge(
  registerSchema,
  profileSchema,
  dsl(fields.address())
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

**最后更新**: 2025-12-25

