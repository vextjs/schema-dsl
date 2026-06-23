# Multi-language support user guide

Use this guide when validation errors need to follow the user's language or when an application maintains its own field labels and message texts. If you only need the smallest working example, start with the quick start below; if you need frontend language switching, continue to the frontend i18n guide afterwards.

## quick start

> **Node.js Requirements**: `>=18.0.0`
>
> **Language file formats supported by directory loading (Node >=18) by default**: `.js` (CommonJS), `.cjs`, `.json`, `.jsonc`, `.json5`.
> **Recommendation**: If your application is a `type: module` / ESM project, give priority to using `.cjs`, `.json`, `.jsonc`, `.json5`.

### Get started in 5 minutes

```javascript
import { s, validate } from 'schema-dsl/pure';

// 1. Configure user language pack
s.config({
  i18n: {
    'zh-CN': {
      'username': 'username',
      'email': 'email address'
    },
    'en-US': {
      'username': 'Username',
      'email': 'Email Address'
    }
  }
});

// 2. Define Schema (using key)
const schema = s({
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email')
});

// 3. Validation (dynamically switch language)
const result = validate(schema, data, { locale: 'zh-CN' });
```

---

## Configuration method

### Method 1: Pass in object configuration (recommended for small projects)

`schema-dsl` Supports two object writing methods at the same time:

- Compatible packaging layer: `{ i18n: { locales: {... } } }`
- Abbreviated form: `{ i18n: { 'zh-CN': {... }, 'en-US': {... } } }`

```javascript
s.config({
  i18n: {
    locales: {
      'zh-CN': {
        'username': 'username',
        'email': 'email address',
        'custom.invalidEmail': 'The email format is incorrect'
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

**Abbreviated form**:

```javascript
s.config({
  i18n: {
    'zh-CN': {
      'username': 'username',
      'email': 'email address'
    },
    'en-US': {
      'username': 'Username',
      'email': 'Email Address'
    }
  }
});
```

**advantage**:
- ✅ Simple and direct
- ✅ Suitable for small projects
- ✅ No additional documents required

**shortcoming**:
- ❌ The code becomes bloated when the language pack is large
- ❌ Not conducive to maintenance

---

### Method 2: Load from directory (recommended for large projects)

**Directory structure**:
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

**Configuration**:
```javascript
import path from 'path';

s.config({
  i18n: {
    localesPath: path.join(__dirname, 'i18n/labels')
  }
});
```

**Language pack file** (`i18n/labels/zh-CN.cjs`):
```javascript
module.exports = {
  //Field label
  'username': 'username',
  'email': 'email address',
  'password': 'password',
  'age': 'age',

  // Nested fields
  'address.city': 'city',
  'address.street': 'street',

  // Custom error message
  'custom.invalidEmail': 'The email format is incorrect',
  'custom.emailTaken': 'This email address has been registered'
};
```

**advantage**:
- ✅ Clear maintenance
- ✅ Support large projects
- ✅ Easy to collaborate

---

### Cache configuration (optional)

```javascript
s.config({
  cache: {
    maxSize: 10000, // Maximum number of cached entries
    ttl: 7200000 // Cache expiration time (ms)
  }
});
```

**Recommended configuration**:

| Project scale | maxSize | Description |
|---------|---------|------|
| Small (< 100 Schema) | 1000 | enough |
| Medium (100-1000) | 5000 (default) | recommend |
| Large (1000-5000) | 10000 | recommend |
| Extra large (>5000) | 20000 | recommend |

---

## Schema definition

### Use key to reference the language pack

```javascript
const userSchema = s({
  // label uses key
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email'),

  // messages use key
  password: s('string:8-32!').label('password').messages({
    'minLength': 'custom.passwordWeak'
  })
});
```

### Nested fields

```javascript
const addressSchema = s({
  address: s({
    city: s('string!').label('address.city'),
    street: s('string!').label('address.street'),
    zipCode: s('string!').label('address.zipCode')
  })
});
```

**Language Pack**:
```javascript
const labels = {
  'address.city': 'city',
  'address.street': 'street',
  'address.zipCode': 'Zip code'
}
```

---

## Front-end integration

### Express middleware

```javascript
import express from 'express';
import { validate } from 'schema-dsl/pure';

const app = express();
app.use(express.json());

// Middleware: extract language parameters (simplified version: query > Accept-Language > default)
app.use((req, res, next) => {
  req.locale = req.query.lang ||
               req.headers['accept-language']?.split(',')[0]?.trim() ||
               'zh-CN';
  next();
});

//API routing
app.post('/api/register', (req, res) => {
  // Use global validate, passing locale
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

### React integration

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
        'Accept-Language': locale // ← Pass language
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!result.success) {
      setErrors(result.errors); // The error message is already in the corresponding language
    }
  };

  return (
    <div>
      {/* Language switching */}
      <select value={locale} onChange={(e) => setLocale(e.target.value)}>
        <option value="zh-CN">Chinese</option>
        <option value="en-US">English</option>
        <option value="ja-JP">Japanese</option>
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
        <button type="submit">Submit</button>
      </form>

      {errors.map(err => (
        <div key={err.path}>{err.message}</div>
      ))}
    </div>
  );
}
```

---

### Vue integration

```vue
<template>
  <div>
    <select v-model="locale">
      <option value="zh-CN">Chinese</option>
      <option value="en-US">English</option>
    </select>

    <form @submit.prevent="handleSubmit">
      <input v-model="form.username" />
      <input v-model="form.email" />
      <button type="submit">Submit</button>
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

## best practices

### 1. Language pack organization

**Recommended Structure**:
```text
i18n/
  ├── labels/ # Field labels
  │   ├── zh-CN.cjs
  │   ├── en-US.jsonc
  │   └── ja-JP.json5
  └── messages/ # Custom message (optional)
      ├── zh-CN.cjs
      └── en-US.json
```

### 2. Naming convention

**Field Label**:
```javascript
const fieldLabels = {
  'username': 'username', // simple field
  'address.city': 'City', // Nested fields
  'order.items[0].name': 'item name' // array field
}
```

**Custom message**:
```javascript
const customMessages = {
  'custom.emailTaken': 'Email has been registered',
  'custom.passwordWeak': 'The password is not strong enough',
  'custom.orderExpired': 'Order has expired'
}
```

### 3. Language detection priority

```javascript
// Recommended priority
const locale =
  req.query.lang || // 1. URL parameters (highest priority)
  req.cookies.lang ||            // 2. Cookie
  req.headers['accept-language']?.split(',')[0]?.trim() || // 3. Accept-Language header (get the first language tag)
  'en-US'; // 4. Default language
```

### 4. Language persistence

**front end**:
```javascript
//Save user language preference
localStorage.setItem('userLanguage', locale);

//Restore language preference
const savedLang = localStorage.getItem('userLanguage') || 'zh-CN';
```

---

## FAQ

### Q1: How to add a new language?

**A**: Create a new language pack file and restart the application

```javascript
// i18n/labels/fr-FR.cjs (French)
module.exports = {
  'username': 'nom utilisateur',
  'email': 'adresse e-mail'
};
```

### Q2: How to deal with missing translations?

**A**: The system will automatically roll back

```text
Search order:
1. User language package (for example `i18n/labels/zh-CN.cjs` / `zh-CN.jsonc`)
2. Built-in language package (`zh-CN` / `en-US` / `ja-JP` / `es-ES` / `fr-FR` preset in the package)
3. Use the key itself
```

### Q3: How much impact does cache configuration have on performance?

**A**: 3-10 times improvement for large projects

```text
Scenario: 3000 Schemas
Original configuration (1000): 33% hit rate
After optimization (5000): 100% hit rate
Performance improvement: 3x
```

### Q4: Does it support dynamic loading of language packs?

**A**: Supported, call `s.config()` after the application starts

```javascript
//Dynamicly add languages
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

## Corresponding sample file

**Example entry**: [i18n-user-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/i18n-user-guide.ts)
**Description**: Overrides `s.config({ i18n: { locales:... } })`’s object configuration method, loaded language list, and runtime switching of different locales.
