# Guide to adding custom language packs

**Version**: v2.0.8
**Last updated**: 2026-06-10

---

## 📖 Overview

This guide will teach you how to add a custom language pack or extend an existing language for schema-dsl.

> **Node.js Requirements**: `>=18.0.0`
>
> **Language file formats supported by directory loading (Node >=18) by default**: `.js` (CommonJS), `.cjs`, `.json`, `.jsonc`, `.json5`.
> **Recommendation**: If your application is a `type: module` / ESM project, give priority to using `.cjs`, `.json`, `.jsonc`, `.json5`.

---

## 🏗️ Multi-person collaboration: subdirectory splitting language packs (new in v1.2.3)⭐

> **Applicable scenarios**: Multi-person/multi-module development to avoid Git conflicts and code conflicts caused by stacking all language keys in the same file.

### Directory structure

```bash
project/
├── locales/
│ ├── core/ # Public code segment: 1000-1999 (framework layer maintenance)
│   │   ├── zh-CN.cjs
│   │   └── en-US.jsonc
│ ├── account/ # Account module code segment: 10000-10999 (Developer A)
│   │   ├── zh-CN.cjs
│   │   └── en-US.jsonc
│ ├── order/ # Order module code section: 20000-20999 (Developer B)
│   │   ├── zh-CN.json5
│   │   └── en-US.json5
│ └── payment/ # Payment module code segment: 30000-30999 (Developer C)
│       ├── zh-CN.cjs
│       └── en-US.cjs
└── app.js
```

### Each module maintains its own language files independently

```javascript
// locales/account/zh-CN.cjs — Developer A maintains independently without interfering with each other
module.exports = {
  'account.notFound': { code: 10001, message: 'Account does not exist' },
  'account.locked': { code: 10002, message: 'Account has been locked' },
};

// locales/order/zh-CN.json5 — independently maintained by developer B
const orderZhCN = {
  'order.notFound': { code: 20001, message: 'The order does not exist' },
  'order.notPaid': { code: 20002, message: 'Order not paid' },
}
```

### Application startup: one line of configuration, automatic recursive merging

```javascript
// app.js
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// Automatically recursively scan all subdirectories under locales/ and merge the same language files into a complete language package
dsl.config({
  i18n: path.join(__dirname, 'locales')
});
```

> - The subdirectory names (`account/`, `order/`) are only used as the **module organization layer** and do not affect the final language key naming
> - Load order: scan recursively in file system alphabetical order
> - When the same language key is repeated: `WARN` log will be logged by default, and strict mode can be turned on to block startup.

### Strict mode: Block startup when key conflicts (recommended for CI environment)

```javascript
dsl.config({
  i18n: path.join(__dirname, 'locales'),
  strict: true // When keys with the same name conflict, an Error will be thrown directly to prevent silent overwriting.
});

//Conflict example output:
// Error: [schema-dsl] i18n key conflict in locale 'zh-CN'
//Conflict key: account.notFound
// Source file: /project/locales/account/zh-CN.cjs
```

### Code section division suggestions

When multiple people develop, it is recommended to maintain a `locales/CODE-SEGMENTS.md` in the project root directory and agree on the code number segment of each module:

| module | code range | person in charge |
|------|----------|--------|
| core (public) | 1000–1999 | frame group |
| account | 10000–10999 | Developer A |
| order | 20000–20999 | Developer B |
| payment | 30000–30999 | Developer C |

> Non-language files such as `CODE-SEGMENTS.md` / `CODE-SEGMENTS.js` will be automatically skipped, so there is no need to worry about being accidentally loaded.

---



## 🚀 Quick start

### Recommended method: Configure language pack directory (load all languages ​​at once) ⭐

**Correct usage**: Load all language packages at once when the application starts, and switch directly during runtime.

#### Step 1: Create language pack files

```bash
# Project structure
my-project/
├── locales/ # Language pack directory
│ ├── zh-CN.cjs # Chinese (CommonJS / ESM projects are stable)
│ ├── en-US.jsonc # English (with comments / trailing comma)
│ └── pt-BR.json5 # Portuguese (JSON5 style)
└── app.js
```

#### Step 2: Define language package (`locales/pt-BR.json5`)

```javascript
module.exports = {
  // Generic validation error
  'required': '{{#label}} é obrigatório',
  'type': '{{#label}} deve ser do tipo {{#expected}}',
  'min': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'max': '{{#label}} não pode exceder {{#limit}} caracteres',
  'length': '{{#label}} deve ter exatamente {{#limit}} caracteres',
  'pattern': '{{#label}} formato inválido',
  'enum': '{{#label}} deve ser um dos seguintes valores: {{#allowed}}',

  //Format validation
  'format.email': '{{#label}} deve ser um e-mail válido',
  'format.url': '{{#label}} deve ser uma URL válida',
  'format.uuid': '{{#label}} deve ser um UUID válido',
  'format.date': '{{#label}} deve ser uma data válida (YYYY-MM-DD)',
  'format.datetime': '{{#label}} deve ser uma data/hora válida (ISO 8601)',

  // String validation
  'string.minLength': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'string.maxLength': '{{#label}} não pode exceder {{#limit}} caracteres',
  'string.pattern': '{{#label}} formato inválido',
  'string.alphanum': '{{#label}} deve conter apenas letras e números',

  //Number validation
  'number.base': '{{#label}} deve ser um número',
  'number.min': '{{#label}} não pode ser menor que {{#limit}}',
  'number.max': '{{#label}} não pode ser maior que {{#limit}}',
  'number.integer': '{{#label}} deve ser um inteiro',
  'number.positive': '{{#label}} deve ser um número positivo',
  'number.negative': '{{#label}} deve ser um número negativo',

  // boolean validation
  'boolean.base': '{{#label}} deve ser um booleano',

  // Object validation
  'object.base': '{{#label}} deve ser um objeto',

  // Array validation
  'array.base': '{{#label}} deve ser um array',
  'array.min': '{{#label}} deve ter pelo menos {{#limit}} itens',
  'array.max': '{{#label}} não pode ter mais de {{#limit}} itens',

  // date validation
  'date.base': '{{#label}} deve ser uma data válida',
  'date.min': '{{#label}} não pode ser anterior a {{#limit}}',
  'date.max': '{{#label}} não pode ser posterior a {{#limit}}',

  // Custom mode
  'pattern.phone.cn': 'Número de telefone inválido',
  'pattern.idCard.cn': 'Número de identidade inválido',
  'pattern.creditCard': 'Número de cartão de crédito inválido',
  'pattern.objectId': 'ObjectId inválido',
  'pattern.hexColor': 'Código de cor hexadecimal inválido',
  'pattern.macAddress': 'Endereço MAC inválido',
  'pattern.cron': 'Expressão Cron inválida',
  'pattern.slug': 'Slug deve conter apenas letras minúsculas, números e hífens'
};
```

#### Step 3: Load all languages ​​at once when the app starts

```javascript
const { dsl, validate } = require('schema-dsl');
const path = require('path');

// ========== Configuration when the application starts (only executed once) ==========
dsl.config({
  i18n: path.join(__dirname, 'locales') // Automatically load all language files in the directory
});

// Description:
// 1. Automatically scan `.js` (CommonJS), `.cjs`, `.json`, `.jsonc`, `.json5` in the locales/ directory
// 2. Extract the language code from the file name (such as pt-BR.cjs → pt-BR)
// 3. Automatically load and register all language packages
// 4. The user-defined language pack will be merged with the system default language pack, and the user’s will take precedence.

// ========== Switch language directly during runtime (no need to reload) ==========
const schema = dsl({ username: 'string:3-32!' });

// use Portuguese
const result1 = validate(schema, { username: 'ab' }, { locale: 'pt-BR' });
// Error message: "username deve ter pelo menos 3 caracteres"

// use Chinese
const result2 = validate(schema, { username: 'ab' }, { locale: 'zh-CN' });
// Error message: "username cannot be less than 3 characters long"

// use English
const result3 = validate(schema, { username: 'ab' }, { locale: 'en-US' });
// Error message: "username length must be at least 3"
```

#### Language pack merge strategy

```javascript
// System built-in zh-CN language pack
const systemZhCN = {
  'required': '{{#label}} is required',
  'string.minLength': '{{#label}} cannot be less than {{#limit}} characters'
};

// User-defined locales/zh-CN.cjs
const userZhCN = {
  'required': '{{#label}} must be filled in', // Override the system default
  'custom.myError': 'Custom error' // Add custom message
};

// Final merge result (deep merge)
const finalZhCN = {
  'required': '{{#label}}must be filled in', // ✅ User priority
  'string.minLength': '{{#label}} cannot be less than {{#limit}} characters', // keep the system default
  'custom.myError': 'Custom error' // Add custom message
};
```

---

### Method 2: Pass in the object directly (suitable for dynamic configuration)

```javascript
const { dsl } = require('schema-dsl');

// Configure when application starts
dsl.config({
  i18n: {
    'pt-BR': require('./locales/pt-BR'),
    'de-DE': require('./locales/de-DE'),
    'ko-KR': require('./locales/ko-KR')
  }
});

//Switch directly during runtime
validate(schema, data, { locale: 'pt-BR' });
validate(schema, data, { locale: 'de-DE' });
```

---

## ⚠️ Error example (not recommended)

### ❌ Error: Loading language packs individually at runtime

```javascript
const { Locale } = require('schema-dsl');

// ❌ Not recommended: dynamically load before each validation
function validateUser(data, locale) {
  if (locale === 'pt-BR') {
    Locale.addLocale('pt-BR', require('./locales/pt-BR')); // Load every time, poor performance
  }
  return validate(schema, data, { locale });
}
```

```javascript
// ✅ Correct: Load once when the app starts
// app.js startup entry
dsl.config({ i18n: './locales' }); // Only load once

//Switch directly during runtime without reloading
function validateUser(data, locale) {
  return validate(schema, data, { locale }); // ✅ Direct switch, good performance
}
```

### Why is "first load, switch at runtime" recommended?

| Way | Load times | performance | Memory | Recommendation |
|------|---------|------|------|--------|
| **Load all for the first time** | 1 time | ⭐⭐⭐⭐⭐ Extremely fast | Low | ✅ Highly recommended |
| Single load at runtime | N times | ⭐⭐ slow | middle | ❌ Not recommended |

---

## 🎯 Full example

```javascript
// ========== app.js (application startup entrance) ==========
const express = require('express');
const { dsl, validate } = require('schema-dsl');
const path = require('path');

//Load all language packs at once when the application starts
dsl.config({
  i18n: path.join(__dirname, 'locales')
});

const app = express();

// ========== routes/user.js (business routing) ==========
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120'
});

app.post('/api/users', (req, res) => {
  // Get user language preference from request header
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';

  // Validation (switch language directly, no loading required)
  const result = validate(userSchema, req.body, { locale });

  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors // Automatically use the user's preferred language
    });
  }

  // Handle the request...
});
```

---

## 📋 Complete list of message keys

### Universal keys

| Key name | Description | Example |
|-----|------|------|
| `required` | Required fields | `{{#label}} é obrigatório` |
| `type` | type error | `{{#label}} deve ser do tipo {{#expected}}` |
| `min` | Minimum length (universal) | `{{#label}} deve ter pelo menos {{#limit}} caracteres` |
| `max` | Maximum length (universal) | `{{#label}} não pode exceder {{#limit}} caracteres` |
| `length` | exact length | `{{#label}} deve ter exatamente {{#limit}} caracteres` |
| `pattern` | pattern matching | `{{#label}} formato inválido` |
| `enum` | enumeration value | `{{#label}} deve ser um dos seguintes: {{#allowed}}` |

### String validation key

| Key name | Description | Available variables |
|-----|------|---------|
| `string.minLength` | minimum length | `{{#label}}`, `{{#limit}}` |
| `string.maxLength` | maximum length | `{{#label}}`, `{{#limit}}` |
| `string.length` | exact length | `{{#label}}`, `{{#limit}}` |
| `string.pattern` | pattern matching | `{{#label}}` |
| `string.alphanum` | Alphanumeric | `{{#label}}` |
| `string.enum` | enumeration value | `{{#label}}`, `{{#valids}}` |

### Numeric validation key

| Key name | Description | Available variables |
|-----|------|---------|
| `number.base` | type error | `{{#label}}` |
| `number.min` | minimum value | `{{#label}}`, `{{#limit}}` |
| `number.max` | maximum value | `{{#label}}`, `{{#limit}}` |
| `number.integer` | integer | `{{#label}}` |
| `number.positive` | positive number | `{{#label}}` |
| `number.negative` | negative number | `{{#label}}` |
| `number.precision` | decimal precision | `{{#label}}`, `{{#limit}}` |
| `number.port` | port number | `{{#label}}` |

### format validation key

| Key name | Description |
|-----|------|
| `format.email` | Email format |
| `format.url` | URL format |
| `format.uuid` | UUID format |
| `format.date` | date format |
| `format.datetime` | Date time format |
| `format.time` | time format |
| `format.ipv4` | IPv4 address |
| `format.ipv6` | IPv6 address |
| `format.binary` | Base64 encoding |

### Custom mode key

| Key name | Description |
|-----|------|
| `pattern.phone.cn` | China mobile phone number |
| `pattern.phone.us` | US phone number |
| `pattern.idCard.cn` | Chinese ID card |
| `pattern.creditCard` | credit card number |
| `pattern.objectId` | MongoDB ObjectId |
| `pattern.hexColor` | Hexadecimal color |
| `pattern.macAddress` | MAC address |
| `pattern.cron` | Cron expression |
| `pattern.slug` | URL alias |
| `pattern.username` | username |
| `pattern.password.weak` | weak password |
| `pattern.password.medium` | medium password |
| `pattern.password.strong` | Strong password |
| `pattern.password.veryStrong` | Super strong password |

---

## 🎨 Template variables

All error messages support the following template variables:

| variable | Description | Usage example |
|------|------|---------|
| `{{#label}}` | Field labels | `{{#label}} é obrigatório` |
| `{{#limit}}` | Limit value (length/size) | `deve ter pelo menos {{#limit}} caracteres` |
| `{{#allowed}}` | list of allowed values | `deve ser um dos seguintes: {{#allowed}}` |
| `{{#expected}}` | expected type | `deve ser do tipo {{#expected}}` |
| `{{#valids}}` | list of valid values ​​(array) | `deve ser: {{#valids}}` |
| `{{#path}}` | field path | `Erro no campo {{#path}}` |

---

## 📚 Refer to the built-in language pack

You can refer to the built-in language pack as a template:

```javascript
const { Locale } = require('schema-dsl');

// View Chinese language pack
const zhCN = Locale.getMessages('zh-CN');
console.log(zhCN);

// View English language pack
const enUS = Locale.getMessages('en-US');
console.log(enUS);
```

Or view the source code directly:
- Chinese:`src/locales/zh-CN.ts`
- English: `src/locales/en-US.ts`
- Japanese: `src/locales/ja-JP.ts`
- Spanish: `src/locales/es-ES.ts`
- French: `src/locales/fr-FR.ts`

---

## ✅ Best Practices

1. **Completeness**: Make sure all common error message keys are translated
2. **Consistency**: Keep the error message style consistent
3. **Template variables**: Correctly use `{{#label}}`, `{{#limit}}` and other variables
4. **Test**: Test after adding the language pack to ensure that all messages are displayed correctly
5. **Documentation**: Write usage instructions for custom language packs

---

## 🤝 Contribute language packs

If you have added a new language pack for schema-dsl, please submit a Pull Request:

1. Fork project
2. Create a new language file (such as `pt-BR.ts`) in the `src/locales/` directory
3. Complete translation of all message keys
4. Register new language in `src/locales/index.ts`
5. Add test cases (in the `test/unit/locales/` directory)
6. Submit Pull Request

---

## 📞 Support

If you have trouble adding a language pack:

- View [Multi-language Configuration Guide](./i18n.md)
- View [Dynamic Multi-Language Configuration Guide](./dynamic-locale.md)
- Submit Issue: https://github.com/vextjs/schema-dsl/issues

---

## Corresponding sample file

**Example entry**: [add-custom-locale.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/add-custom-locale.ts)
**Description**: Minimal workflow that covers `Locale.addLocale()` registering a new language, reading message text, and performing validation under a custom locale.
