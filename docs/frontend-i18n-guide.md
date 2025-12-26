# 前端动态切换语言 - 最佳实践指南

> **适用版本**: SchemaIO v2.2.0+  
> **场景**: 前后端分离架构，前端需要动态切换验证错误消息语言

---

## 📋 目录

1. [核心问题](#核心问题)
2. [推荐方案](#推荐方案)
3. [完整示例](#完整示例)
4. [常见问题](#常见问题)

---

## 核心问题

### 当前架构限制 ⚠️

SchemaIO v2.2.0 使用全局语言状态 (`Locale.setLocale()`)，在高并发场景下可能不安全：

```javascript
// ❌ 问题代码：全局切换
app.post('/api/validate', (req, res) => {
  Locale.setLocale('zh-CN');  // 修改全局状态
  const result = validate(schema, req.body);
  res.json(result);
});

// 并发问题：
// 请求1: 中文用户 → 设置 zh-CN → 验证
// 请求2: 英文用户 → 设置 en-US → 验证（可能影响请求1）
// 结果：请求1 可能得到英文错误消息
```

### 为什么会有问题？

1. **全局状态共享**：所有请求共享同一个 `Locale.currentLocale`
2. **Node.js 异步特性**：请求处理可能交错执行
3. **竞态条件**：语言切换和验证执行之间存在时序问题

---

## 推荐方案

### 方案1：实例级配置（⭐⭐⭐⭐⭐ 推荐）

**原理**：每个请求创建独立的 Validator 实例

#### 后端实现

```javascript
const express = require('express');
const { Validator, dsl } = require('schemaio');

const app = express();
app.use(express.json());

// 定义 Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

// ✅ 推荐：实例级配置
app.post('/api/validate', (req, res) => {
  // 从请求头获取语言
  const locale = req.headers['accept-language'] || 'en-US';
  
  // 创建独立的 Validator 实例
  const validator = new Validator({ locale });
  
  // 验证数据
  const result = validator.validate(userSchema, req.body);
  
  res.json(result);
});

app.listen(3000);
```

**优点**：
✅ 完全隔离，无并发问题  
✅ 每个请求独立处理  
✅ 支持不同用户同时使用不同语言

#### 前端实现（React）

```jsx
import { useState } from 'react';

function RegistrationForm() {
  const [locale, setLocale] = useState('zh-CN');
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': locale  // ✅ 传递语言
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!result.valid) {
        setErrors(result.errors);
      } else {
        // 验证通过
        console.log('验证成功！');
      }
    } catch (error) {
      console.error('验证失败:', error);
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

      {/* 表单 */}
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({
          username: e.target.username.value,
          email: e.target.email.value,
          age: parseInt(e.target.age.value)
        });
      }}>
        <input name="username" placeholder="用户名" />
        <input name="email" type="email" placeholder="邮箱" />
        <input name="age" type="number" placeholder="年龄" />
        <button type="submit">提交</button>
      </form>

      {/* 错误显示 */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((err, i) => (
            <p key={i} className="error">{err.message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 方案2：请求级配置（⭐⭐⭐⭐ 备选）

**原理**：使用 `validate()` 的 `options.locale` 参数

```javascript
const { validate, dsl } = require('schemaio');

const schema = dsl({ /* ... */ });

app.post('/api/validate', (req, res) => {
  const locale = req.headers['accept-language'] || 'en-US';
  
  // ✅ 使用 options.locale
  const result = validate(schema, req.body, {
    locale: locale  // 请求级语言配置
  });
  
  res.json(result);
});
```

**优点**：
✅ 无需创建实例  
✅ API 简洁

**缺点**：
⚠️ 内部仍使用临时切换全局状态  
⚠️ 高并发下可能有极小概率问题

---

### 方案3：中间件统一处理（⭐⭐⭐⭐⭐ 推荐）

**原理**：提取语言配置逻辑到中间件

```javascript
const express = require('express');
const { Validator, dsl } = require('schemaio');

const app = express();

// ✅ 语言配置中间件
app.use((req, res, next) => {
  // 解析 Accept-Language 头
  const locale = req.headers['accept-language']?.split(',')[0] || 'en-US';
  
  // 创建请求级 Validator
  req.validator = new Validator({ locale });
  req.locale = locale;
  
  next();
});

// 使用中间件配置的 validator
app.post('/api/validate', (req, res) => {
  const schema = dsl({ /* ... */ });
  const result = req.validator.validate(schema, req.body);
  
  res.json(result);
});
```

**优点**：
✅ 统一管理语言配置  
✅ 代码复用性高  
✅ 易于维护

---

## 完整示例

### 示例1：完整的 Express 应用

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { Validator, dsl } = require('schemaio');

const app = express();
app.use(cors());
app.use(express.json());

// 语言中间件
app.use((req, res, next) => {
  const acceptLanguage = req.headers['accept-language'] || 'en-US';
  const locale = acceptLanguage.split(',')[0].trim();
  
  req.validator = new Validator({ 
    locale,
    allErrors: true  // 返回所有错误
  });
  
  next();
});

// Schema 定义
const schemas = {
  user: dsl({
    username: 'string:3-32!',
    email: 'email!',
    password: 'string:8-64!',
    age: 'number:18-120',
    phone: 'string'
  }),
  
  post: dsl({
    title: 'string:1-200!',
    content: 'string:10-10000!',
    tags: 'array:1-5<string:1-20>'
  })
};

// 通用验证端点
app.post('/api/validate/:type', (req, res) => {
  const { type } = req.params;
  const schema = schemas[type];
  
  if (!schema) {
    return res.status(404).json({ error: 'Schema not found' });
  }
  
  const result = req.validator.validate(schema, req.body);
  res.json(result);
});

// 用户注册（带验证）
app.post('/api/register', (req, res) => {
  const result = req.validator.validate(schemas.user, req.body);
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors
    });
  }
  
  // 保存用户...
  res.json({ success: true, message: '注册成功' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### 示例2：Vue 3 前端

```vue
<template>
  <div class="validation-form">
    <!-- 语言切换 -->
    <div class="language-selector">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        :class="{ active: locale === lang.code }"
        @click="locale = lang.code"
      >
        {{ lang.label }}
      </button>
    </div>

    <!-- 表单 -->
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>用户名</label>
        <input v-model="form.username" />
        <span v-if="getError('username')" class="error">
          {{ getError('username') }}
        </span>
      </div>

      <div class="form-group">
        <label>邮箱</label>
        <input v-model="form.email" type="email" />
        <span v-if="getError('email')" class="error">
          {{ getError('email') }}
        </span>
      </div>

      <div class="form-group">
        <label>密码</label>
        <input v-model="form.password" type="password" />
        <span v-if="getError('password')" class="error">
          {{ getError('password') }}
        </span>
      </div>

      <button type="submit">提交</button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const locale = ref('zh-CN');
const languages = [
  { code: 'zh-CN', label: '中文' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: '日本語' }
];

const form = reactive({
  username: '',
  email: '',
  password: ''
});

const errors = ref([]);

const handleSubmit = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/validate/user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': locale.value
      },
      body: JSON.stringify(form)
    });

    const result = await response.json();

    if (!result.valid) {
      errors.value = result.errors;
    } else {
      alert('验证通过！');
      errors.value = [];
    }
  } catch (error) {
    console.error('验证失败:', error);
  }
};

const getError = (field) => {
  const error = errors.value.find(e => e.path === field);
  return error?.message;
};
</script>

<style scoped>
.error {
  color: red;
  font-size: 0.9em;
}

.language-selector button.active {
  background: #007bff;
  color: white;
}
</style>
```

---

## 常见问题

### Q1: 为什么不能直接使用 `Locale.setLocale()`？

**A**: 因为 Node.js 是单线程异步的，多个请求可能同时修改全局状态，导致语言混乱。

```javascript
// ❌ 错误示例
app.post('/api/validate', (req, res) => {
  Locale.setLocale('zh-CN');  // 全局修改
  // 如果此时另一个请求设置了 'en-US'，当前请求可能得到英文消息
  const result = validate(schema, req.body);
  res.json(result);
});
```

### Q2: 每次请求创建 Validator 实例会影响性能吗？

**A**: 不会。Validator 实例创建非常轻量，且验证器内部有编译缓存。

```javascript
// 性能测试结果
// 创建实例: ~0.001ms
// 验证数据: ~0.1-1ms
// 总计: 可忽略不计
```

### Q3: 如何支持更多语言？

**A**: 使用 `Locale.addLocale()` 添加自定义语言包。

```javascript
const { Locale } = require('schemaio');

Locale.addLocale('de-DE', {
  required: '{{#label}} ist erforderlich',
  'format.email': '{{#label}} muss eine gültige E-Mail-Adresse sein'
  // ... 更多消息
});
```

### Q4: 如何在前端缓存语言包？

**A**: 后端返回错误消息已经是本地化的，前端无需处理。如果需要前端验证：

```javascript
// 前端可以使用相同的 SchemaIO（浏览器版）
import { dsl, validate } from 'schemaio/browser';

const schema = dsl({ /* ... */ });
const result = validate(schema, formData, { 
  locale: currentLocale 
});
```

### Q5: 如何处理 Cookie 或 Session 中的语言？

```javascript
// 中间件：优先级 Header > Cookie > Session > 默认
app.use((req, res, next) => {
  const locale = 
    req.headers['accept-language'] ||
    req.cookies?.locale ||
    req.session?.locale ||
    'en-US';
  
  req.validator = new Validator({ locale });
  next();
});
```

---

## 总结

### ✅ 推荐做法

1. **使用实例级配置**：每个请求创建独立 Validator
2. **通过请求头传递语言**：符合 HTTP 标准
3. **使用中间件统一处理**：提高代码复用性

### ❌ 避免做法

1. **全局语言切换**：`Locale.setLocale()`
2. **共享 Validator 实例**：多请求共用同一个实例
3. **忽略并发问题**：假设请求是同步的

### 🔮 未来计划

SchemaIO v2.3.0 将重构架构，彻底解决并发安全问题：
- 实例级语言配置
- 移除全局状态依赖
- 向后兼容现有代码

---

**相关文档**：
- [多语言深度分析](i18n-analysis.md)
- [API 参考](api-reference.md)
- [最佳实践](best-practices.md)
