# Dynamic Multilingual Configuration Guide

## Basic principles

`Validator` of schema-dsl supports dynamically specifying the language during validation without the need for global switching.

### core methods

```javascript
validator.validate(schema, data, {
  locale: 'zh-CN' // Dynamically specify language
});
```

---

## Option 1: Specify language during validation (recommended)✅

This is the **most recommended** solution. There is no need to modify the global state and it supports concurrent requests.

### 1.1 Configuration when the application starts (loading all languages ​​at once)

Use `s.config` to load all custom language packs at once when the app starts.

```javascript
import { s, validate } from 'schema-dsl/pure';
import path from 'path';

// ========== Configuration when the application starts (only executed once) ==========

//Method 1: Pass in the directory path (recommended)⭐
// Node >=18: Automatically scan .js (CommonJS), .cjs, .json, .jsonc, .json5 files in the directory
s.config({
  i18n: path.join(__dirname, 'locales')
});

// For data-only or untrusted locale directories, use:
// s.config({ i18n: path.join(__dirname, 'locales'), codeLocaleFiles: 'deny' });

//Method 2: Directly pass in the object
s.config({
  i18n: {
    'fr-FR': {
      'required': '{{#label}} est requis',
      'string.minLength': '{{#label}} doit contenir au moins {{#limit}} caractères'
    },
    'de-DE': {
      'required': '{{#label}} ist erforderlich',
      'string.minLength': '{{#label}} muss mindestens {{#limit}} Zeichen lang sein'
    }
  }
});

// Description:
// - only executed once when the app starts
// - Automatically merge with the system's built-in language pack (user-defined ones take precedence)
// - No need to reload during runtime, switch directly
```

### 1.2 Switch languages ​​directly during runtime (no need to reload)

```javascript
import { s, validate } from 'schema-dsl/pure';

//define Schema
const schema = s({
  username: 'string:3-32!',
  email: 'email!'
});

// test data
const data = { username: 'ab', email: 'invalid' };

// ========== Switch language directly during runtime ==========

// use Chinese
const result1 = validate(schema, data, { locale: 'zh-CN' });
// Error: "username cannot be less than 3 characters long"

// use french
const result2 = validate(schema, data, { locale: 'fr-FR' });
// Error: "username doit contenir au moins 3 caractères"

// use german
const result3 = validate(schema, data, { locale: 'de-DE' });
// Error: "username muss mindestens 3 Zeichen lang sein"

// Description:
// - No need to reload the language pack
// - Each validation can use a different language
// - supports high concurrency (no global state modification)
```

### 1.3 Obtain the language from the request header (actual application scenario)

```javascript
import express from 'express';
import { s, validate } from 'schema-dsl/pure';
import path from 'path';

const app = express();

// ========== Configuration when the application starts (only executed once) ==========
s.config({
  i18n: path.join(__dirname, 'locales')
});

//define Schema
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!'
});

// ========== Express routing ==========
app.post('/api/user/register', (req, res) => {
  // Get the language preference from the request header
  const locale = parseAcceptLanguage(req.headers['accept-language']);

  //Verify data (switch language directly without reloading)
  const result = validate(userSchema, req.body, { locale });

  if (!result.valid) {
    return res.status(400).json({
      errors: result.errors // Automatically use the user's preferred language
    });
  }

  // Processed successfully...
  res.json({ message: 'User registered successfully' });
});
```

### 1.3 Parsing the Accept-Language header

```javascript
/**
 * Parse the Accept-Language header
 * @param {string} acceptLanguage - the value of the Accept-Language header
 * @returns {string} language code
 */
function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en-US';

  // Accept-Language format: zh-CN,zh;q=0.9,en;q=0.8
  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';');
    const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
    return { code: code.trim(), q };
  });

  // Sort by weight
  languages.sort((a, b) => b.q - a.q);

  //Map to supported languages
  const supportedLocales = ['zh-CN', 'en-US', 'ja-JP'];
  for (const lang of languages) {
    const matched = supportedLocales.find(locale =>
      locale.toLowerCase() === lang.code.toLowerCase() ||
      locale.split('-')[0] === lang.code.split('-')[0]
    );
    if (matched) return matched;
  }

  return 'en-US'; //Default language
}

// use
app.post('/api/user/register', (req, res) => {
  const locale = parseAcceptLanguage(req.headers['accept-language']);

  const result = validator.validate(schema, req.body, { locale });

  // ...
});
```

---

## Option 2: Temporarily switch language

Suitable for a few scenarios.

### 2.1 Use closures to save the original language

```javascript
function validateWithLocale(validator, schema, data, locale) {
  const originalLocale = Locale.getLocale();

  try {
    Locale.setLocale(locale);
    return validator.validate(schema, data);
  } finally {
    Locale.setLocale(originalLocale); //Restore original language
  }
}

// use
app.post('/api/user/register', (req, res) => {
  const locale = parseAcceptLanguage(req.headers['accept-language']);

  const result = validateWithLocale(validator, schema, req.body, locale);

  // ...
});
```

---

## Option 3: Express/Koa middleware

Encapsulated as middleware to automatically handle language switching.

### 3.1 Express middleware (recommended)

Through one-time configuration of middleware, subsequent business code does not need to care about language parameters.

```javascript
import { Validator } from 'schema-dsl/pure';
const validator = new Validator();

const schemaIoMiddleware = (req, res, next) => {
  // 1. Automatically obtain the language
  const lang = req.headers['accept-language']?.split(',')[0]?.trim() || 'en-US';
  // Simple matching logic (actually accept-language-parser can be used)
  const locale = lang.includes('zh') ? 'zh-CN' :
                 lang.includes('ja') ? 'ja-JP' :
                 lang.includes('es') ? 'es-ES' :
                 lang.includes('fr') ? 'fr-FR' : 'en-US';

  // 2. Mount the validation method bound to the language
  req.validate = (schema, data) => {
    return validator.validate(schema, data, { locale });
  };

  next();
};

app.use(schemaIoMiddleware);

// Used in business
app.post('/users', (req, res) => {
  // Call directly and automatically use the language parsed by the middleware
  const result = req.validate(userSchema, req.body);

  if (!result.valid) {
    return res.status(400).json({ errors: result.errors });
  }

  // ...
});
```

For a complete example, please refer to [dynamic-locale.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dynamic-locale.ts).

### 3.2 Koa middleware

```javascript
import { Locale, Validator } from 'schema-dsl/pure';

const validator = new Validator();

/**
 * Koa language middleware
 */
function localeMiddleware() {
  return async (ctx, next) => {
    // parse language
    const locale = parseAcceptLanguage(ctx.headers['accept-language']);

    // save to context
    ctx.locale = locale;

    // Reuse the shared Validator to avoid re-creating the instance and cache for each request
    ctx.validate = function(schema, data) {
      return validator.validate(schema, data, { locale: ctx.locale });
    };

    await next();
  };
}

// Apply middleware
app.use(localeMiddleware());

// use
router.post('/api/user/register', async (ctx) => {
  // Automatically use the requested language
  const result = ctx.validate(userSchema, ctx.request.body);

  if (!result.valid) {
    ctx.status = 400;
    ctx.body = { errors: result.errors };
    return;
  }

  // ...
});
```

---

## Complete example

### Express complete example

```javascript
import express from 'express';
import { s, Validator, Locale } from 'schema-dsl/pure';

const app = express();
app.use(express.json());

// ========== 1. Initialize language package ==========

Locale.addLocale('zh-CN', {
  'required': '{{#label}} cannot be empty',
  'min': '{{#label}}at least {{#limit}} characters',
  'max': '{{#label}} is at most {{#limit}} characters',
  'pattern': '{{#label}} format is incorrect',
  'format': 'Please enter a valid {{#label}}'
});

Locale.addLocale('en-US', {
  'required': '{{#label}} is required',
  'min': '{{#label}} must be at least {{#limit}} characters',
  'max': '{{#label}} must be at most {{#limit}} characters',
  'pattern': '{{#label}} format is invalid',
  'format': 'Please enter a valid {{#label}}'
});

// ========== 2. Tool function ==========

function parseAcceptLanguage(acceptLanguage) {
  if (!acceptLanguage) return 'en-US';

  const languages = acceptLanguage.split(',').map(lang => {
    const [code, qValue] = lang.trim().split(';');
    const q = qValue ? parseFloat(qValue.split('=')[1]) : 1.0;
    return { code: code.trim(), q };
  });

  languages.sort((a, b) => b.q - a.q);

  const supportedLocales = ['zh-CN', 'en-US'];
  for (const lang of languages) {
    const matched = supportedLocales.find(locale =>
      locale.toLowerCase() === lang.code.toLowerCase()
    );
    if (matched) return matched;
  }

  return 'en-US';
}

// ========== 3. Middleware ==========

const validator = new Validator();

function localeMiddleware(req, res, next) {
  req.locale = parseAcceptLanguage(req.headers['accept-language']);

  req.validate = function(schema, data) {
    return validator.validate(schema, data, { locale: req.locale });
  };

  next();
}

app.use(localeMiddleware);

// ========== 4. Define Schema ==========

const userSchema = s({
  username: s('string:3-32!').label('username'),
  email: s('email!').label('email address'),
  password: s('string:8-64!').pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('password')
    .messages({
      'pattern': 'Password must contain uppercase and lowercase letters and numbers'
    }),
  age: s('number:18-120').label('age')
});

// ========== 5. API routing ==========

app.post('/api/user/register', (req, res) => {
  // Validate data (automatically use request language)
  const result = req.validate(userSchema, req.body);

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      errors: result.errors,
      locale: req.locale // Return the language used
    });
  }

  // Handle registration logic
  res.json({
    success: true,
    message: req.locale === 'zh-CN'? 'Registration successful': 'Registration successful'
  });
});

// ========== 6. Test ==========

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('\nTest command:');
  console.log('# Chinese error message');
  console.log('curl -X POST http://localhost:3000/api/user/register \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Accept-Language: zh-CN" \\');
  console.log('  -d \'{"username":"ab"}\'');
  console.log('\n# English error message');
  console.log('curl -X POST http://localhost:3000/api/user/register \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -H "Accept-Language: en-US" \\');
  console.log('  -d \'{"username":"ab"}\'');
});
```

---

## best practices

### 1. Centralized management of language packs

```javascript
// locales/index.js
import zhCN from './zh-CN.cjs';
import enUS from './en-US.cjs';
import jaJP from './ja-JP.cjs';

export default {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP
};

// locales/zh-CN.json
{
  "required": "{{#label}} cannot be empty",
  "min": "{{#label}} is at least {{#limit}} characters",
  "max": "{{#label}} is at most {{#limit}} characters",
  "pattern": "{{#label}} format is incorrect",
  "format": "Please enter a valid {{#label}}"
}

// initialization
import locales from './locales/index.js';
Object.entries(locales).forEach(([locale, messages]) => {
  Locale.addLocale(locale, messages);
});
```

### 2. Supported language list

```javascript
const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'ja-JP'];

function getSupportedLocale(requestLocale) {
  return SUPPORTED_LOCALES.includes(requestLocale)
    ? requestLocale
    : 'en-US';
}
```

### 3. Cache validator

```javascript
// cache validators for each language
const validators = {
  'zh-CN': new Validator(),
  'en-US': new Validator(),
  'ja-JP': new Validator()
};

function getValidator(locale) {
  return validators[locale] || validators['en-US'];
}

// use
const result = getValidator(req.locale).validate(
  schema,
  data,
  { locale: req.locale }
);
```

### 4. Error response standardization

```javascript
function sendValidationError(res, result, locale) {
  res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    message: locale === 'zh-CN'? 'Validation failed': 'Validation failed',
    errors: result.errors,
    locale: locale
  });
}

// use
if (!result.valid) {
  return sendValidationError(res, result, req.locale);
}
```

---

## Plan comparison

| plan | advantage | shortcoming | Recommendation |
|------|------|------|--------|
| **Option 1: Specify during validation** | ✅ No race issues<br>✅ Support concurrency<br>✅ Simple code | - | ⭐⭐⭐⭐⭐ |
| Option 2: Temporary switch | ✅ Simple to implement | ⚠️ Concurrency race problem | ⭐⭐⭐ |
| Option 3: Middleware | ✅ Automation<br>✅ Unified management<br>✅ Reusable shared Validator cache | - | ⭐⭐⭐⭐⭐ |

**Recommended**: Option 1 + Option 3 (Middleware Encapsulation)

---

## FAQ

### Q1: How to deal with unsupported languages?

**A**: Fall back to default language

Do not directly pass the original `Accept-Language` header to `locale`; common values ​​​​in browsers will have `q=` weights, which should be parsed first and then rolled back.

```javascript
function parseAcceptLanguage(acceptLanguage) {
  //... parsing logic
  return supportedLocale || 'en-US'; // Default English
}
```

### Q2: Does it support dynamic loading of language packs?

**A**: Support

```javascript
async function loadLocale(locale) {
  if (!Locale.getAvailableLocales().includes(locale)) {
    const messages = await import(`./locales/${locale}.json`);
    Locale.addLocale(locale, messages);
  }
}

// use
app.use(async (req, res, next) => {
  await loadLocale(req.locale);
  next();
});
```

### Q3: How to customize error messages for certain fields?

**A**: Use `.messages()` method

```javascript
const schema = s({
  password: s('string:8-64!').label('password')
    .messages({
      'required': req.locale === 'zh-CN'
        ? 'Please enter password'
        : 'Please enter password',
      'min': req.locale === 'zh-CN'
        ? 'Password is too short, at least 8 characters'
        : 'Password is too short, at least 8 characters'
    })
});
```

---

## Related documents

- [String extension](./string-extensions.md#string-extension-documentation)
- [Locale API](./api-reference.md#locale)
- [Validator API](./api-reference.md#validator-class)

---

## Corresponding sample file

**Example entry**: [dynamic-locale.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/dynamic-locale.ts)
**Description**: Covers `Accept-Language` parsing, runtime locale selection, and validation entries for the same schema in different request languages.

---
