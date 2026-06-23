# 前端动态切换语言 - 最佳实践指南


<a id="使用方法"></a>

## 完整示例

### 示例1：完整的 Express 应用

```javascript
// server.js
import express from 'express';
import cors from 'cors';
import { s, validate } from 'schema-dsl/pure';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json());

// ========== 应用启动时配置（只执行一次）==========
s.config({
  i18n: path.join(__dirname, 'locales')  // 一次性加载所有语言包
});

// Schema 定义
const schemas = {
  user: s({
    username: 'string:3-32!',
    email: 'email!',
    password: 'string:8-64!',
    age: 'number:18-120',
    phone: 'string'
  }),
  
  post: s({
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
  
  // 从请求头获取语言偏好
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';
  
  // 验证（直接切换语言，无需重新加载）
  const result = validate(schema, req.body, { locale });
  
  res.json(result);
});

// 用户注册（带验证）
app.post('/api/register', (req, res) => {
  // 从请求头获取语言偏好
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';
  
  // 验证数据
  const result = validate(schemas.user, req.body, { locale });
  
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors  // 自动使用用户偏好的语言
    });
  }
  
  // 保存用户...
  res.json({ success: true, message: '注册成功' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('语言包已加载，支持动态切换');
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

**A**: 实例创建本身很轻量，但**仍然建议复用同一个 `Validator` 实例**。原因不是构造函数慢，而是编译缓存挂在实例上；如果每个请求都 `new Validator()`，同一份 Schema 会反复出现首次编译 miss。

```javascript
const validator = new Validator();

app.post('/api/validate', (req, res) => {
  const locale = resolveLocale(req);
  const result = validator.validate(schema, req.body, { locale });
  res.json(result);
});

// 说明：
// - 共享实例：同一 schema 的后续请求可以复用编译缓存
// - 语言仍通过 validate(..., { locale }) 按次传入，不要写进构造函数
```

### Q3: 如何支持更多语言？

**A**: 使用 `Locale.addLocale()` 添加自定义语言包。

```javascript
import { Locale } from 'schema-dsl/pure';

Locale.addLocale('de-DE', {
  required: '{{#label}} ist erforderlich',
  'format.email': '{{#label}} muss eine gültige E-Mail-Adresse sein'
  // ... 更多消息
});
```

### Q4: 如何在前端缓存语言包？

**A**: 后端返回错误消息已经是本地化的，前端无需处理。如果需要前端验证：

```javascript
// 前端可以复用同一套 schema-dsl 校验规则
import { s, validate } from 'schema-dsl/pure';

const schema = s({ /* ... */ });
const result = validate(schema, formData, { 
  locale: currentLocale 
});
```

### Q5: 如何处理 Cookie 或 Session 中的语言？

```javascript
// 中间件：优先级 Header > Cookie > Session > 默认
app.use((req, res, next) => {
  const locale = 
    req.headers['accept-language']?.split(',')[0]?.trim() ||
    req.cookies?.locale ||
    req.session?.locale ||
    'en-US';
  
  req.locale = locale;
  next();
});
```

---

## 总结

### ✅ 推荐做法

1. **复用共享 Validator 实例**：按次通过 `validate(..., { locale })` 传入语言
2. **通过请求头传递语言**：符合 HTTP 标准
3. **使用中间件统一处理**：提高代码复用性

---

**相关文档**：
- [API 参考](api-reference.md)
- [最佳实践](best-practices.md)

---

## 对应示例文件

**示例入口**: [frontend-i18n-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/frontend-i18n-guide.ts)  
**说明**: 覆盖前端常见的语言优先级解析、表单提交验证，以及把错误数组整理成字段级错误映射。

