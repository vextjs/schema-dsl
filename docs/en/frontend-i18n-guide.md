# Dynamically switching languages ​​on the front end - a best practice guide


> **Scenario**: Front-end and back-end separation architecture, the front-end needs to dynamically switch the validation error message language

---

## 📋 Table of Contents

1. [How to use](#how-to-use)
2. [Complete example](#complete-example)
3. [FAQ](#faq)

---

<a id="how-to-use"></a>

## Complete example

### Example 1: Complete Express application

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { dsl, validate } = require('schema-dsl');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ========== Configuration when the application starts (only executed once) ==========
dsl.config({
  i18n: path.join(__dirname, 'locales') //Load all language packages at once
});

// Schema definition
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

// Generic validation endpoint
app.post('/api/validate/:type', (req, res) => {
  const { type } = req.params;
  const schema = schemas[type];

  if (!schema) {
    return res.status(404).json({ error: 'Schema not found' });
  }

  // Get the language preference from the request header
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';

  // Validation (switch language directly without reloading)
  const result = validate(schema, req.body, { locale });

  res.json(result);
});

//User registration (with validation)
app.post('/api/register', (req, res) => {
  // Get the language preference from the request header
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';

  //Verify data
  const result = validate(schemas.user, req.body, { locale });

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors // Automatically use the user's preferred language
    });
  }

  //Save user...
  res.json({ success: true, message: 'Registration successful' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('The language pack has been loaded and supports dynamic switching');
});
```

### Example 2: Vue 3 front end

```vue
<template>
  <div class="validation-form">
    <!-- Language switching -->
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

    <!-- Form -->
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>Username</label>
        <input v-model="form.username" />
        <span v-if="getError('username')" class="error">
          {{ getError('username') }}
        </span>
      </div>

      <div class="form-group">
        <label>Email</label>
        <input v-model="form.email" type="email" />
        <span v-if="getError('email')" class="error">
          {{ getError('email') }}
        </span>
      </div>

      <div class="form-group">
        <label>Password</label>
        <input v-model="form.password" type="password" />
        <span v-if="getError('password')" class="error">
          {{ getError('password') }}
        </span>
      </div>

      <button type="submit">Submit</button>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const locale = ref('zh-CN');
const languages = [
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'en-US', label: 'English' },
  { code: 'ja-JP', label: 'Japanese' }
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
      alert('Validation passed!');
      errors.value = [];
    }
  } catch (error) {
    console.error('Validation failed:', error);
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

## FAQ

### Q1: Why can’t I use `Locale.setLocale()` directly?

**A**: Because Node.js is single-threaded and asynchronous, multiple requests may modify the global state at the same time, causing language confusion.

```javascript
// ❌ Error example
app.post('/api/validate', (req, res) => {
  Locale.setLocale('zh-CN'); // Global modification
  // If another request sets 'en-US' at this time, the current request may get an English message
  const result = validate(schema, req.body);
  res.json(result);
});
```

### Q2: Will creating a Validator instance for each request affect performance?

**A**: The instance creation itself is very lightweight, but it is still recommended to reuse the same `Validator` instance**. The reason is not that the constructor is slow, but that the compilation cache is hung on the instance; if every request is `new Validator()`, the same Schema will repeatedly have first compilation misses.

```javascript
const validator = new Validator();

app.post('/api/validate', (req, res) => {
  const locale = resolveLocale(req);
  const result = validator.validate(schema, req.body, { locale });
  res.json(result);
});

// Description:
// - Shared instance: subsequent requests for the same schema can reuse the compilation cache
// - The language is still passed in through validate(..., { locale }), do not write it into the constructor
```

### Q3: How to support more languages?

**A**: Use `Locale.addLocale()` to add a custom language pack.

```javascript
const { Locale } = require('schema-dsl');

Locale.addLocale('de-DE', {
  required: '{{#label}} ist erforderlich',
  'format.email': '{{#label}} muss eine gültige E-Mail-Adresse sein'
  //... more news
});
```

### Q4: How to cache language packs on the front end?

**A**: The error message returned by the backend is already localized and does not need to be processed by the frontend. If front-end validation is required:

```javascript
// The front end can reuse the same set of schema-dsl validation rules
import { dsl, validate } from 'schema-dsl';

const schema = dsl({ /* ... */ });
const result = validate(schema, formData, {
  locale: currentLocale
});
```

### Q5: How to handle language in Cookie or Session?

```javascript
// Middleware: Priority Header > Cookie > Session > Default
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

## Summarize

### ✅ Recommended practices

1. **Reuse Shared Validator Instance**: Incoming language via `validate(..., { locale })`
2. **Pass language via request header**: Compliant with HTTP standards
3. **Use middleware for unified processing**: Improve code reusability

---

**Related Documents**:
- [API Reference](api-reference.md)
- [Best Practice](best-practices.md)

---

## Corresponding sample file

**Example entry**: [frontend-i18n-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/frontend-i18n-guide.ts)
**Description**: Covers common front-end language priority parsing, form submission validation, and organizing error arrays into field-level error mapping.
