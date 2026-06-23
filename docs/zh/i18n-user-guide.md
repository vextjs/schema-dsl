# 多语言支持用户指南

当验证错误需要跟随用户语言，或应用需要维护自己的字段标签和错误文案时，使用本指南。如果你只想先跑通最小示例，从下面的快速开始读起；如果还要接前端语言切换，再继续看前端 i18n 指南。

## 快速开始

> **Node.js 要求**：`>=18.0.0`
>
> **目录加载（Node >=18）默认支持的语言文件格式**：`.js`（CommonJS）、`.cjs`、`.json`、`.jsonc`、`.json5`。  
> **推荐**：如果你的应用是 `type: module` / ESM 项目，优先使用 `.cjs`、`.json`、`.jsonc`、`.json5`。

### 5 分钟上手

```javascript
import { s, validate } from 'schema-dsl/pure';

// 1. 配置用户语言包
s.config({
  i18n: {
    'zh-CN': {
      'username': '用户名',
      'email': '邮箱地址'
    },
    'en-US': {
      'username': 'Username',
      'email': 'Email Address'
    }
  }
});

// 2. 定义 Schema（使用 key）
const schema = s({
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email')
});

// 3. 验证（动态切换语言）
const result = validate(schema, data, { locale: 'zh-CN' });
```

---

## 配置方式

### 方式 1：传入对象配置（推荐小型项目）

`schema-dsl` 同时支持两种对象写法：

- 兼容包装层：`{ i18n: { locales: { ... } } }`
- 简写形式：`{ i18n: { 'zh-CN': { ... }, 'en-US': { ... } } }`

```javascript
s.config({
  i18n: {
    locales: {
      'zh-CN': {
        'username': '用户名',
        'email': '邮箱地址',
        'custom.invalidEmail': '邮箱格式不正确'
      },
      'en-US': {
        'username': 'Username',
        'email': 'Email Address',
        'custom.invalidEmail': 'Invalid email format'
      }
    }
  }
});
```

**简写形式**:

```javascript
s.config({
  i18n: {
    'zh-CN': {
      'username': '用户名',
      'email': '邮箱地址'
    },
    'en-US': {
      'username': 'Username',
      'email': 'Email Address'
    }
  }
});
```

**优点**:
- ✅ 简单直接
- ✅ 适合小型项目
- ✅ 无需额外文件

**缺点**:
- ❌ 语言包较大时代码臃肿
- ❌ 不利于维护

---

### 方式 2：从目录加载（推荐大型项目）

**目录结构**:
```text
project/
  ├── i18n/
  │   └── labels/
  │       ├── zh-CN.cjs
  │       ├── en-US.jsonc
  │       └── ja-JP.json5
  ├── app.js
  └── routes/
```

**配置**:
```javascript
import path from 'path';

s.config({
  i18n: {
    localesPath: path.join(__dirname, 'i18n/labels')
  }
});
```

**语言包文件**（`i18n/labels/zh-CN.cjs`）:
```javascript
module.exports = {
  // 字段标签
  'username': '用户名',
  'email': '邮箱地址',
  'password': '密码',
  'age': '年龄',
  
  // 嵌套字段
  'address.city': '城市',
  'address.street': '街道',
  
  // 自定义错误消息
  'custom.invalidEmail': '邮箱格式不正确',
  'custom.emailTaken': '该邮箱已被注册'
};
```

**优点**:
- ✅ 清晰维护
- ✅ 支持大型项目
- ✅ 易于协作

---

### 缓存配置（可选）

```javascript
s.config({
  cache: {
    maxSize: 10000,   // 缓存最大条目数
    ttl: 7200000      // 缓存过期时间（ms）
  }
});
```

**推荐配置**:

| 项目规模 | maxSize | 说明 |
|---------|---------|------|
| 小型（< 100 Schema） | 1000 | 够用 |
| 中型（100-1000） | 5000（默认） | 推荐 |
| 大型（1000-5000） | 10000 | 推荐 |
| 超大型（> 5000） | 20000 | 推荐 |

---

## Schema 定义

### 使用 key 引用语言包

```javascript
const userSchema = s({
  // label 使用 key
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email'),
  
  // messages 使用 key
  password: s('string:8-32!').label('password').messages({
    'minLength': 'custom.passwordWeak'
  })
});
```

### 嵌套字段

```javascript
const addressSchema = s({
  address: s({
    city: s('string!').label('address.city'),
    street: s('string!').label('address.street'),
    zipCode: s('string!').label('address.zipCode')
  })
});
```

**语言包**:
```javascript
const labels = {
  'address.city': '城市',
  'address.street': '街道',
  'address.zipCode': '邮编'
}
```

---

## 前端集成

### Express 中间件

```javascript
import express from 'express';
import { validate } from 'schema-dsl/pure';

const app = express();
app.use(express.json());

// 中间件：提取语言参数（简化版：query > Accept-Language > 默认）
app.use((req, res, next) => {
  req.locale = req.query.lang ||
               req.headers['accept-language']?.split(',')[0]?.trim() || 
               'zh-CN';
  next();
});

// API 路由
app.post('/api/register', (req, res) => {
  // 使用全局 validate，传递 locale
  const result = validate(userSchema, req.body, {
    locale: req.locale
  });
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors
    });
  }
  
  res.json({ success: true });
});
```

---

### React 集成

```javascript
import { useState } from 'react';

function RegisterForm() {
  const [locale, setLocale] = useState('zh-CN');
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (formData) => {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale  // ← 传递语言
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();
    
    if (!result.success) {
      setErrors(result.errors);  // 错误消息已经是对应语言
    }
  };

  return (
    <div>
      {/* 语言切换 */}
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="zh-CN">中文</option>
        <option value="en-US">English</option>
        <option value="ja-JP">日本語</option>
      </select>

      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({
          username: e.target.username.value,
          email: e.target.email.value
        });
      }}>
        <input name="username" />
        <input name="email" />
        <button type="submit">提交</button>
      </form>

      {errors.map(err => (
        <div key={err.path}>{err.message}</div>
      ))}
    </div>
  );
}
```

---

### Vue 集成

```vue
<template>
  <div>
    <select v-model="locale">
      <option value="zh-CN">中文</option>
      <option value="en-US">English</option>
    </select>

    <form @submit.prevent="handleSubmit">
      <input v-model="form.username" />
      <input v-model="form.email" />
      <button type="submit">提交</button>
    </form>

    <div v-for="error in errors" :key="error.path">
      {{ error.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const locale = ref('zh-CN');
const form = reactive({ username: '', email: '' });
const errors = ref([]);

const handleSubmit = async () => {
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': locale.value
    },
    body: JSON.stringify(form)
  });

  const result = await response.json();
  errors.value = result.errors || [];
};
</script>
```

---

## 最佳实践

### 1. 语言包组织

**推荐结构**:
```text
i18n/
  ├── labels/         # 字段标签
  │   ├── zh-CN.cjs
  │   ├── en-US.jsonc
  │   └── ja-JP.json5
  └── messages/       # 自定义消息（可选）
      ├── zh-CN.cjs
      └── en-US.json
```

### 2. 命名规范

**字段标签**:
```javascript
const fieldLabels = {
  'username': '用户名',           // 简单字段
  'address.city': '城市',         // 嵌套字段
  'order.items[0].name': '商品名称' // 数组字段
}
```

**自定义消息**:
```javascript
const customMessages = {
  'custom.emailTaken': '邮箱已被注册',
  'custom.passwordWeak': '密码强度不够',
  'custom.orderExpired': '订单已过期'
}
```

### 3. 语言检测优先级

```javascript
// 推荐优先级
const locale = 
  req.query.lang ||              // 1. URL 参数（最高优先级）
  req.cookies.lang ||            // 2. Cookie
  req.headers['accept-language']?.split(',')[0]?.trim() || // 3. Accept-Language 头（取首个语言标签）
  'en-US';                       // 4. 默认语言
```

### 4. 语言持久化

**前端**:
```javascript
// 保存用户语言偏好
localStorage.setItem('userLanguage', locale);

// 恢复语言偏好
const savedLang = localStorage.getItem('userLanguage') || 'zh-CN';
```

---

## 常见问题

### Q1: 如何添加新语言？

**A**: 创建新的语言包文件并重启应用

```javascript
// i18n/labels/fr-FR.cjs（法语）
module.exports = {
  'username': 'nom utilisateur',
  'email': 'adresse e-mail'
};
```

### Q2: 如何处理缺失的翻译？

**A**: 系统会自动回退

```text
查找顺序：
1. 用户语言包（例如 `i18n/labels/zh-CN.cjs` / `zh-CN.jsonc`）
2. 内置语言包（包内预置的 `zh-CN` / `en-US` / `ja-JP` / `es-ES` / `fr-FR`）
3. 使用 key 本身
```

### Q3: 缓存配置对性能有多大影响？

**A**: 大型项目提升 3-10 倍

```text
场景：3000 个 Schema
原配置（1000）：33% 命中率
优化后（5000）：100% 命中率
性能提升：3 倍
```

### Q4: 是否支持动态加载语言包？

**A**: 支持，在应用启动后调用 `s.config()`

```javascript
// 动态添加语言
import frFR from './i18n/fr-FR.cjs';

s.config({
  i18n: {
    locales: {
      'fr-FR': frFR
    }
  }
});
```

---

## 对应示例文件

**示例入口**: [i18n-user-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/i18n-user-guide.ts)  
**说明**: 覆盖 `s.config({ i18n: { locales: ... } })` 的对象配置方式、已加载语言列表，以及不同 locale 的运行时切换。

