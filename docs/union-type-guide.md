# 一个字段支持多种类型

> 使用 `.pattern()` 方法匹配多种格式

---

## 基本用法

```javascript
const { dsl, validate } = require('schema-dsl');

// 邮箱 或 手机号
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: '必须是邮箱或手机号' })
});

validate(schema, { contact: 'test@example.com' });  // ✅
validate(schema, { contact: '13800138000' });       // ✅
validate(schema, { contact: 'invalid' });           // ❌
```

**说明**：
- 正则中使用 `|` 表示"或"，括号 `()` 分组
- 使用 `.messages()` 设置错误消息，支持多语言

---

## 常用示例

### 用户登录（用户名或邮箱）

```javascript
const loginSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/)
    .messages({ pattern: '必须是邮箱或用户名' }),
  password: 'string:8-32!'
});
```

### 联系方式（邮箱或手机号）

```javascript
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: '必须是邮箱或手机号' })
});
```

### URL（http 或 https）

```javascript
const schema = dsl({
  website: dsl('string!')
    .pattern(/^https?:\/\/.+$/)
    .messages({ pattern: '必须是 http 或 https 开头的 URL' })
});
```

---

## 支持多语言

```javascript
// 使用多语言 key
const schema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: 'pattern.emailOrPhone' })  // 多语言 key
});

// 验证时指定语言
validate(schema, { contact: 'invalid' }, { locale: 'zh-CN' });  // 中文：必须是邮箱或手机号
validate(schema, { contact: 'invalid' }, { locale: 'en-US' });  // 英文：Must be an email or phone number
```

**内置多语言 key**：
- `pattern.emailOrPhone` - 邮箱或手机号
- `pattern.usernameOrEmail` - 用户名或邮箱
- `pattern.httpOrHttps` - http 或 https URL

---

## 正则表达式速查

```javascript
// 邮箱 或 手机号
/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/

// http 或 https
/^https?:\/\/.+$/

// 用户名 或 邮箱
/^([^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]{3,32})$/

// 数字ID 或 UUID
/^(\d+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

// 多个邮箱域名
/^[^\s@]+@(gmail\.com|qq\.com|163\.com)$/

// 中国或美国手机号
/^(1[3-9]\d{9}|\+1\d{10})$/
```

---


## 完整示例

```javascript
const { dsl, validate } = require('schema-dsl');

const registerSchema = dsl({
  name: 'string:1-50!',
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .messages({ pattern: '必须是邮箱或手机号' })
});

const testData = [
  { name: '张三', contact: 'zhangsan@example.com' },
  { name: '李四', contact: '13800138000' },
  { name: '王五', contact: 'invalid' }
];

testData.forEach((data, index) => {
  const result = validate(registerSchema, data);
  console.log(`测试${index + 1}:`, result.valid ? '✅' : '❌');
  if (!result.valid) {
    console.log('  错误:', result.errors[0].message);
  }
});
```

**输出**：
```
测试1: ✅
测试2: ✅
测试3: ❌
  错误: 必须是邮箱或手机号
```


