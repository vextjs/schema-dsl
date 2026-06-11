# A complete guide to schema-dsl error handling

> **Update**: 2026-01-30
> **Version**: v1.1.8+
> **Applicable**: Enterprise-level application development

---

## 📋 Table of Contents

1. [Error object structure](#error-object-structure)
2. [I18nError - Multi-language error thrown](#i18nerror---multilingual-error-thrown) 🆕
   - [📖 Overview](#-overview)
   - [🚀 Quick start](#-quick-start)
   - [📚 Core API](#-core-api)
   - [🔧 Configure language pack](#-configure-language-pack)
   - [🌐Default language mechanism](#default-language-mechanism)
   - [Intelligent parameter recognition (v1.1.8)](#intelligent-parameter-recognition-v118)
   - [🌐 Actual scene](#-actual-scene)
   - [📦 Error object structure](#-error-object-structure)
   - [❓ FAQ](#-faq)
3. [Error message customization](#error-message-customization)
4. [Error code system](#error-code-system)
5. [Multi-level error handling](#multi-level-error-handling)
6. [API response design](#api-responsive-design)
7. [Front-end error display](#front-end-error-display)
8. [Error logging](#error-logging)
9. [Best Practice](#best-practices)

---

## I18nError - Multilingual error thrown

<a id="-overview"></a>

### 📖 Overview

`I18nError` is the **unified multi-language error throwing mechanism** provided by schema-dsl, specially designed for enterprise-level applications.

**Core Value**:
- ✅ **Multi-language support**: One set of codes, automatically adapted to Chinese/English/Japanese, etc.
- ✅ **Unified Error Code**: Use the same numerical code across languages, and front-end processing is not affected by language
- ✅ **Parameter Interpolation**: Supports dynamic parameters such as `{{#balance}}`
- ✅ **Framework Integration**: Seamless integration with Express/Koa
- ✅ **TypeScript support**: complete type definitions

**Applicable scenarios**:
- API business logic errors (account does not exist, insufficient balance, insufficient permissions, etc.)
- Multilingual user scenarios (international applications)
- Systems that require unified error codes

**Differences from ValidationError**:
- `ValidationError`: Form validation error (field-level error)
- `I18nError`: Business logic error (application-level error)

---

<a id="-quick-start"></a>

### 🚀 Quick start

#### Get started in 5 minutes

```javascript
const { I18nError, Locale } = require('schema-dsl');

// Step 1: Configure language pack
Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  }
});

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found'
  }
});

// Step 2: Set default language
Locale.setLocale('zh-CN');

// Step 3: Use I18nError
try {
  I18nError.throw('account.notFound');
} catch (error) {
  console.log(error.message); // "Account does not exist"
  console.log(error.code);     // 40001
}
```

---

<a id="-core-api"></a>

### 📚 Core API

#### I18nError.create()

**Create error object (do not throw)**

```javascript
/**
 * @param {string} code - error code (multi-language key)
 * @param {Object|string} paramsOrLocale - parameter object or language code (intelligent recognition)
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {string} locale - locale (optional)
 * @returns {I18nError} error instance
 */
I18nError.create(code, paramsOrLocale?, statusCode?, locale?)
```

**Usage Example**:
```javascript
//Basic usage
const error = I18nError.create('account.notFound');

//With parameters
const error = I18nError.create('account.insufficientBalance', {
  balance: 50,
  required: 100
});

//Specify status code
const error = I18nError.create('user.notFound', {}, 404);

// Specify language at runtime (v1.1.8+)
const error = I18nError.create('account.notFound', 'en-US', 404);
```

---

#### I18nError.throw()

**Throw an error directly**

```javascript
/**
 * @param {string} code - error code
 * @param {Object|string} paramsOrLocale - parameter object or language code
 * @param {number} statusCode - HTTP status code
 * @param {string} locale - locale
 * @throws {I18nError}
 */
I18nError.throw(code, paramsOrLocale?, statusCode?, locale?)
```

**Usage Example**:
```javascript
// Throw an error directly
I18nError.throw('user.noPermission');

//With parameters and status code
I18nError.throw('account.insufficientBalance', { balance: 50, required: 100 }, 400);

// Simplified syntax (v1.1.8+)
I18nError.throw('account.notFound', 'zh-CN', 404);
```

---

#### I18nError.assert()

**Assertion style - throw an error when the condition is not met**

```javascript
/**
 * @param {any} condition - conditional expression (error thrown when falsy)
 * @param {string} code - error code
 * @param {Object|string} paramsOrLocale - parameter object or language code
 * @param {number} statusCode - HTTP status code
 * @param {string} locale - locale
 * @throws {I18nError} thrown when the condition is false
 */
I18nError.assert(condition, code, paramsOrLocale?, statusCode?, locale?)
```

**Usage Example**:
```javascript
function getAccount(id) {
  const account = db.findAccount(id);

  // Assert: The account must exist
  I18nError.assert(account, 'account.notFound', { id });

  // Assertion: The balance must be sufficient
  I18nError.assert(
    account.balance >= 100,
    'account.insufficientBalance',
    { balance: account.balance, required: 100 }
  );

  return account;
}
```

---

#### dsl.error shortcut method

`dsl.error` is a shortcut to `I18nError`, providing the same three methods:

```javascript
const { dsl } = require('schema-dsl');

// Equivalent to I18nError.create()
dsl.error.create('account.notFound');

// Equivalent to I18nError.throw()
dsl.error.throw('order.notPaid');

// Equivalent to I18nError.assert()
dsl.error.assert(order, 'order.notFound');
```

**Recommended usage scenarios**:
- ✅ When used with `dsl()` function (unified style)
- ✅ When importing fewer dependencies (only `dsl` is required)

---

<a id="-configure-language-pack"></a>

### 🔧 Configure language pack

#### Method 1: Use Locale.addLocale() (recommended)

```javascript
const { Locale } = require('schema-dsl');

Locale.addLocale('zh-CN', {
  //String format (simple scenario)
  'user.notFound': 'User does not exist',

  // Object format (recommended, v1.1.5+)
  'account.notFound': {
    code: 40001, // Numeric error code
    message: 'Account does not exist'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current {{#balance}} yuan, need {{#required}} yuan'
  }
});

Locale.addLocale('en-US', {
  'user.notFound': 'User not found',
  'account.notFound': {
    code: 40001, //Same error code
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: {{#balance}}, required {{#required}}'
  }
});
```

---

#### Method 2: Use dsl.config() (batch configuration)

```javascript
const { dsl } = require('schema-dsl');

dsl.config({
  i18n: {
    'zh-CN': {
      'payment.failed': {
        code: 50001,
        message: 'Payment failed: {{#reason}}'
      }
    },
    'en-US': {
      'payment.failed': {
        code: 50001,
        message: 'Payment failed: {{#reason}}'
      }
    }
  }
});
```

---

#### Way 3: Load from directory (large projects)

**Directory structure**:
```text
project/
├── i18n/
│   └── errors/
│       ├── zh-CN.cjs
│       ├── en-US.jsonc
│       └── ja-JP.json5
└── app.js
```

**Configuration**:
```javascript
const path = require('path');

dsl.config({
  i18n: path.join(__dirname, 'i18n/errors')
});
```

**Language pack file** (for example `i18n/errors/zh-CN.cjs`):
```javascript
module.exports = {
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current {{#balance}} yuan, need {{#required}} yuan'
  },
  'user.noPermission': {
    code: 40003,
    message: 'You do not have permission to perform this operation'
  }
};
```

---

### 🌐Default language mechanism

#### Default language settings

**Default**: `'en-US'` (English)

**Global settings**:
```javascript
const { Locale } = require('schema-dsl');

//Switch the default language as needed by the application
Locale.setLocale('zh-CN');

// Get the current language
console.log(Locale.getLocale());  // 'zh-CN'
```

---

#### Language priority rules

```javascript
Runtime locale parameters > global Locale.currentLocale > default 'en-US'
```

**Example**:
```javascript
// Scenario 1: Using global language
Locale.setLocale('zh-CN');
I18nError.throw('account.notFound'); // Use Chinese 'zh-CN'

// Scenario 2: Runtime coverage
Locale.setLocale('zh-CN');
I18nError.throw('account.notFound', 'en-US'); // Override to English 'en-US'

// Scenario 3: Parameter object + runtime language
I18nError.throw('account.insufficientBalance',
  { balance: 50, required: 100 }, // parameter object
  400,
  'ja-JP' //Specify Japanese at runtime
);
```

---

#### Practical Application - API Multilingual Response

```javascript
const express = require('express');
const { I18nError } = require('schema-dsl');

const app = express();

//Middleware: extract client language
app.use((req, res, next) => {
  req.locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  next();
});

//API routing
app.get('/api/account/:id', async (req, res) => {
  try {
    const account = await findAccount(req.params.id);

    // 🎯 Specify language at runtime (according to client request)
    I18nError.assert(account, 'account.notFound', req.locale, 404);

    res.json({ success: true, data: account });
  } catch (error) {
    if (error instanceof I18nError) {
      res.status(error.statusCode).json(error.toJSON());
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});
```

**Effect**:
- Client request header `Accept-Language: zh-CN` → Return Chinese error
- Client request header `Accept-Language: en-US` → Return English error
- No need to modify business code, automatic adaptation

---

### Intelligent parameter recognition (v1.1.8)

**v1.1.8 New**: Support simplified syntax and intelligently identify the second parameter type

#### Simplified syntax

```javascript
const { dsl, Locale } = require('schema-dsl');

//Configure language pack
Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  }
});

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found'
  }
});

// ✅ New: Simplified syntax (recommended)
dsl.error.throw('account.notFound', 'zh-CN');
dsl.error.throw('account.notFound', 'zh-CN', 404);

// ✅ Standard syntax (fully compatible)
dsl.error.throw('account.notFound', {}, 404, 'zh-CN');
dsl.error.throw('account.notFound', { id: '123' }, 404, 'zh-CN');
```

#### Intelligent recognition rules

```javascript
// Rules: Automatically determine the second parameter type
typeof params === 'string' → recognized as language parameters
typeof params === 'object' → recognized as parameter object
params === null/undefined → use default value
```

#### All calling methods

```javascript
// 1. Simplified syntax - only pass the language
dsl.error.throw('account.notFound', 'zh-CN');
dsl.error.create('account.notFound', 'en-US');
dsl.error.assert(account, 'account.notFound', 'zh-CN');

// 2. Simplified syntax - language + status code
dsl.error.throw('account.notFound', 'zh-CN', 404);
dsl.error.assert(account, 'account.notFound', 'zh-CN', 404);

// 3. Standard syntax - object with parameters
dsl.error.throw('account.insufficientBalance',
  { balance: 50, required: 100 },
  400,
  'zh-CN'
);

// 4. Omit all parameters - use global language
dsl.error.throw('account.notFound');
```

#### Practical application

```javascript
// Express API
app.get('/api/account/:id', async (req, res) => {
  try {
    const account = await findAccount(req.params.id);
    const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';

    // 🎯 Simplified syntax: only 2 parameters
    dsl.error.assert(account, 'account.notFound', locale);

    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

<a id="-actual-scene"></a>

### 🌐 Actual scene

#### Express full integration

```javascript
const express = require('express');
const { I18nError, Locale } = require('schema-dsl');

const app = express();
app.use(express.json());

// ========== Configure language pack ==========
Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current {{#balance}} yuan, need {{#required}} yuan'
  }
});

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: {{#balance}}, required {{#required}}'
  }
});

// ========== Middleware: Extract language ==========
app.use((req, res, next) => {
  req.locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  next();
});

// ========== Error handling middleware ==========
app.use((error, req, res, next) => {
  if (error instanceof I18nError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.toJSON()
    });
  }

  // other errors
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

// ========== Business routing ==========
app.get('/api/account/:id', async (req, res, next) => {
  try {
    const account = await findAccount(req.params.id);

    // Use runtime language
    I18nError.assert(account, 'account.notFound', req.locale, 404);

    res.json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
});

app.post('/api/account/transfer', async (req, res, next) => {
  try {
    const { fromId, toId, amount } = req.body;
    const account = await findAccount(fromId);

    I18nError.assert(account, 'account.notFound', req.locale, 404);
    I18nError.assert(
      account.balance >= amount,
      'account.insufficientBalance',
      { balance: account.balance, required: amount },
      400,
      req.locale
    );

    await transferMoney(fromId, toId, amount);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});
```

---

#### Koa full integration

```javascript
const Koa = require('koa');
const { I18nError, Locale } = require('schema-dsl');

const app = new Koa();

// ========== Configure language pack ==========
Locale.addLocale('zh-CN', {
  'user.noPermission': {
    code: 40003,
    message: 'You do not have permission to perform this operation'
  }
});

// ========== Middleware: Extract language ==========
app.use(async (ctx, next) => {
  ctx.locale = ctx.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';
  await next();
});

// ========== Error handling middleware ==========
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    if (error instanceof I18nError) {
      ctx.status = error.statusCode;
      ctx.body = {
        success: false,
        error: error.toJSON()
      };
    } else {
      ctx.status = 500;
      ctx.body = { success: false, message: 'Internal Server Error' };
    }
  }
});

// ========== Business routing ==========
app.use(async (ctx) => {
  if (ctx.path === '/api/admin/users' && ctx.method === 'GET') {
    const user = await getCurrentUser(ctx);

    I18nError.assert(user.role === 'admin', 'user.noPermission', ctx.locale, 403);

    ctx.body = { success: true, data: await getUsers() };
  }
});
```

---

#### Native Node.js HTTP Server

```javascript
const http = require('http');
const { I18nError, Locale } = require('schema-dsl');

//Configure language pack
Locale.addLocale('zh-CN', {
  'order.notPaid': {
    code: 50001,
    message: 'Order not paid'
  }
});

const server = http.createServer((req, res) => {
  try {
    //Extract language
    const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';

    // business logic
    const order = getOrder(req.url);
    I18nError.assert(order && order.paid, 'order.notPaid', locale, 400);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: order }));
  } catch (error) {
    if (error instanceof I18nError) {
      res.writeHead(error.statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.toJSON()
      }));
    } else {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }
});

server.listen(3000);
```

---

#### TypeScript support

```typescript
import { I18nError, Locale } from 'schema-dsl';

// Type-safe language pack configuration
interface ErrorMessages {
  [key: string]: {
    code: number;
    message: string;
  };
}

const zhCN: ErrorMessages = {
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  }
};

Locale.addLocale('zh-CN', zhCN);

// Use type guards
function handleError(error: unknown): void {
  if (error instanceof I18nError) {
    console.log(`Error code: ${error.code}`);
    console.log(`Error message: ${error.message}`);
    console.log(`HTTP status: ${error.statusCode}`);
    console.log(`Language: ${error.locale}`);
  }
}

//Business function
async function getAccount(id: string): Promise<Account> {
  const account = await findAccount(id);

  I18nError.assert(account, 'account.notFound', { id }, 404);

  return account;
}
```

---

<a id="-error-object-structure"></a>

### 📦 Error object structure

#### toJSON() output format

```javascript
try {
  I18nError.throw('account.notFound', {}, 404);
} catch (error) {
  console.log(error.toJSON());
}
```

**Output**:
```json
{
  "error": "I18nError",
  "originalKey": "account.notFound",
  "code": 40001,
  "message": "Account does not exist",
  "params": {},
  "statusCode": 404,
  "locale": "zh-CN"
}
```

**Field description**:
- `error`: fixed to `"I18nError"`
- `originalKey`: Original error key (new in v1.1.5, used for log tracking)
- `code`: Error code (number or string)
- `message`: Translated error message
- `params`: parameter object
- `statusCode`: HTTP status code
- `locale`: Language used

---

#### Error object properties

```javascript
try {
  I18nError.throw('account.insufficientBalance',
    { balance: 50, required: 100 },
    400,
    'zh-CN'
  );
} catch (error) {
  console.log(error.name);          // 'I18nError'
  console.log(error.message); // 'The balance is insufficient, currently 50 yuan, 100 yuan is needed'
  console.log(error.originalKey);   // 'account.insufficientBalance'
  console.log(error.code);          // 40002
  console.log(error.params);        // { balance: 50, required: 100 }
  console.log(error.statusCode);    // 400
  console.log(error.locale);        // 'zh-CN'
  console.log(error.stack); // stack trace
}
```

---

#### is() method - wrong type determination

```javascript
try {
  I18nError.throw('account.notFound');
} catch (error) {
  if (error instanceof I18nError) {
    // Use originalKey to judge
    if (error.is('account.notFound')) {
      console.log('Account does not exist error');
    }

    // Use digital code to judge (v1.1.5+)
    if (error.is(40001)) {
      console.log('There is no error in the account (judged by digital code)');
    }
  }
}
```

---

<a id="-faq"></a>

### ❓ FAQ

#### Q1: How to dynamically switch languages?

**A**: There are two ways:

```javascript
// Method 1: Global switching (affects all subsequent calls)
Locale.setLocale('en-US');
I18nError.throw('account.notFound'); // Use English

// Method 2: Specified at runtime (only affects the current call)
I18nError.throw('account.notFound', 'en-US'); // Use English
I18nError.throw('account.notFound', 'zh-CN'); // Use Chinese
```

**Recommended**: Dynamically specified in the API based on client request headers (see Express example above)

---

#### Q2: What is the difference between string format and object format?

**A**:

| Format | Advantages | Applicable scenarios |
|------|------|---------|
| string | Simple and fast | Internal error, Unicode not required |
| object | Unified error codes, consistent across languages | Exposed to front-end errors, internationalization |

```javascript
//String format
'user.notFound': 'User does not exist'

// Object format (recommended)
'user.notFound': {
  code: 40001, // Unified digital code
  message: 'User does not exist'
}
```

**Recommendation**: Prioritize the use of object format to facilitate unified processing by the front end.

---

#### Q3: How to use parameter interpolation?

**A**: Use `{{#parameterName}}` syntax:

```javascript
// Language pack configuration
Locale.addLocale('zh-CN', {
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current {{#balance}} yuan, need {{#required}} yuan'
  }
});

// use
I18nError.throw('account.insufficientBalance', {
  balance: 50,
  required: 100
});
// Output: "Insufficient balance, current 50 yuan, 100 yuan needed"
```

**Note**: The parameter name must be in the format `{{#parameterName}}` (the pound sign must be present).

---

#### Q4: What is the difference with message() of dsl.if?

**A**:

- `dsl.if().message()`: Used for **data validation errors** (Schema validation)
- `I18nError`: used for **business logic error** (API business logic)

```javascript
// dsl.if - data validation
dsl.if(d => !d).message('user.notFound').assert(user);

// I18nError - business logic
I18nError.assert(user.role === 'admin', 'user.noPermission');
```

**Can be mixed**:
```javascript
function validateAndProcess(user) {
  // Step 1: Data validation (using dsl.if)
  dsl.if(d => !d).message('user.notFound').assert(user);

  // Step 2: Business logic validation (using I18nError)
  I18nError.assert(user.role === 'admin', 'user.noPermission');
}
```

---

#### Q5: How to get all available languages?

**A**:

```javascript
const { Locale } = require('schema-dsl');

const locales = Locale.getAvailableLocales();
console.log(locales);  // ['en-US', 'zh-CN', 'ja-JP', ...]
```

---

#### Q6: How to uniformly handle error codes on the front end?

**A**: Use numeric `code` field:

```javascript
// Front-end error handling
async function apiCall() {
  try {
    const response = await fetch('/api/account');
    const data = await response.json();
  } catch (error) {
    // Unified processing based on digital code (not affected by language)
    switch (error.code) {
      case 40001:
        router.push('/login'); // Account does not exist → Jump to login
        break;
      case 40002:
        showTopUpDialog(); // Insufficient balance → Show recharge pop-up window
        break;
      case 40003:
        showError('Insufficient permissions'); // Insufficient permissions
        break;
      default:
        showError(error.message);
    }
  }
}
```

**Advantages**: Front-end logic is not affected by back-end language switching.

---

#### Q7: What is the default language? How to modify?

**A**:

- **Default language**: `'en-US'` (English)
- **Modification method**:

```javascript
const { Locale } = require('schema-dsl');

//Set the default language according to the application needs at startup
Locale.setLocale('zh-CN');

// Get the current default language
console.log(Locale.getLocale());  // 'zh-CN'
```

**Recommendation**: Set the default language when the application starts (app.js entry).

---

#### Q8: How to deal with unconfigured error keys?

**A**: If the error key is not configured in the language package, the original key will be returned directly:

```javascript
// 'custom.error' is not configured
I18nError.throw('custom.error');
// message: 'custom.error' (returned as is)
```

**suggestion**:
1. Use TypeScript to define incorrect key types and avoid typos
2. Check in the development environment whether all error keys have been configured

---

#### Q9: What built-in languages ​​are supported?

**A**:

| language code | Language name | Support status |
|---------|---------|---------|
| `en-US` | English (United States) | ✅ Built-in |
| `zh-CN` | Simplified Chinese | ✅ Built-in |
| `ja-JP` | Japanese | ✅ Expandable |
| `fr-FR` | French | ✅ Expandable |
| `es-ES` | spanish | ✅ Expandable |

**Custom Language**: Use `Locale.addLocale()` to add any language.

---

#### Q10: How to record error details in the log?

**A**:

```javascript
const winston = require('winston');

app.use((error, req, res, next) => {
  if (error instanceof I18nError) {
    // Record detailed logs
    winston.error('Business error', {
      originalKey: error.originalKey, // Original key (for easy tracking)
      code: error.code, // error code
      message: error.message, // Translated message
      params: error.params, // parameters
      statusCode: error.statusCode,
      locale: error.locale,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    return res.status(error.statusCode).json(error.toJSON());
  }
  next(error);
});
```

**RECOMMENDED**: Use `originalKey` instead of `message` because `message` changes with the language.

---

## error object structure

### infrastructure

The error object structure returned by schema-dsl validation:

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!'.label('username')
});

const result = validate(schema, { username: 'ab' });

//return structure
{
  valid: false,
  errors: [
    {
      path: 'username',
      field: 'username',
      keyword: 'minLength',
      params: { limit: 3 },
      message: 'Username cannot be less than 3 characters long'
    }
  ]
}
```

### Nested object error

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  user: {
    profile: {
      email: 'email!'
    }
  }
});

const result = validate(schema, {
  user: {
    profile: {
      email: 'invalid'
    }
  }
});

//wrong path
console.log(result.errors[0].path);    // 'user/profile/email'
console.log(result.errors[0].message); // 'The email must be a valid email address'
```

### array item error

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  items: 'array<string:3->!'
});

const result = validate(schema, {
  items: ['ab', 'valid']
});

//wrong path
console.log(result.errors[0].path); // 'items/0'
```

---

## Error message customization

### Single field customization

```javascript
const { dsl } = require('schema-dsl');

//Use String to extend custom messages
const schema = dsl({
  username: 'string:3-32!'
    .label('username')
    .messages({
      'min': 'Too short! At least 3 characters'
    })
});
```

### Multi-rule customization

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  email: 'email!'
    .label('email address')
    .messages({
      'format': 'The email format is wrong',
      'required': 'The mailbox cannot be empty'
    })
});
```

### Object level customization

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!'
    .label('username')
    .messages({
      'min': '{{#label}}at least {{#limit}} characters',
      'max': '{{#label}} is at most {{#limit}} characters'
    }),

  email: 'email!'
    .label('mailbox')
    .messages({
      'format': '{{#label}} format is invalid'
    })
});
```

### Global customization

```javascript
const { Locale } = require('schema-dsl');

//Set global message
Locale.setMessages({
  'min': 'The input is too short, {{#limit}} characters are required',
  'format': 'Incorrect format'
});
```

---

## error code system

### Built-in error codes (simplified version)

schema-dsl uniformly formats Ajv's error keywords to make it easier to use:

#### String error code

| Keywords | original keyword | Description | params |
|--------|-----------|------|--------|
| `min` | `minLength` | length less than minimum | { limit: number } |
| `max` | `maxLength` | length greater than maximum | { limit: number } |
| `format` | `format` | Format validation failed | { format: 'email'/'uri'/etc } |
| `pattern` | `pattern` | Regularity does not match | { pattern: string } |
| `enum` | `enum` | not in enumeration value | { allowedValues: array } |

#### Numeric error code

| Keywords | original keyword | Description | params |
|--------|-----------|------|--------|
| `min` | `minimum` | less than minimum | { limit: number } |
| `max` | `maximum` | greater than maximum | { limit: number } |

#### Common error code

| Keywords | Description | params |
|--------|------|--------|
| `required` | Required fields are missing | { missingProperty: string } |
| `type` | type mismatch | { type: string } |

**💡 Tip**: You can customize the error message using simplified keywords (such as `min`) or original keywords (such as `minLength`), and the system will automatically handle the mapping.

### Automatic label translation

If you define `label.{fieldName}` in a language pack, the system will automatically use it as a Label without explicitly calling `.label()`.

```javascript
// language pack
Locale.addLocale('zh-CN', {
  'label.username': 'username',
  'required': '{{#label}} cannot be empty'
});

// Schema
const schema = dsl({
  username: 'string!' // Automatically find label.username
});

// Error message: "Username cannot be empty"
```

### Custom validation errors

```javascript
const { dsl } = require('schema-dsl');

const schema = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      if (value.includes('forbidden')) {
        return 'The content contains prohibited words';
      }
      // No need to return when validation passes
    })
    .label('username')
});
```

---

## Multi-level error handling

### Nested object validation

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  user: {
    name: 'string:1-100!',
    address: {
      country: 'string!'.label('country'),
      city: 'string!'.label('city'),
      street: 'string!'.label('street')
    }
  }
});

const result = validate(schema, {
  user: {
    name: 'John',
    address: {
      country: 'CN'
      // missing city and street
    }
  }
});

// Error example
// result.errors[0].path: 'user/address/city'
// result.errors[1].path: 'user/address/street'
```

### Array validation

```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  items: 'array:1-<string:3->!'
    .label('Product List')
});

const result = validate(schema, {
  items: ['ab', 'valid'] // The first item is too short
});

//wrong path
console.log(result.errors[0].path); // 'items/0'
```

---

## API responsive design

### Standard response format

```javascript
// successful response
{
  success: true,
  code: 'SUCCESS',
  data: { ... }
}

//Verify error response
{
  success: false,
  code: 'VALIDATION_ERROR',
  message: 'Data validation failed',
  errors: [
    {
      field: 'username',
      message: 'must NOT have fewer than 3 characters',
      keyword: 'minLength',
      params: { limit: 3 }
    }
  ]
}

// Server error response
{
  success: false,
  code: 'SERVER_ERROR',
  message: 'Server internal error'
}
```

### Express middleware

```javascript
const { dsl, Validator } = require('schema-dsl');

//Authentication middleware
function validateBody(schema) {
  const validator = new Validator();

  return (req, res, next) => {
    const result = validator.validate(schema, req.body);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Please check the input information',
        errors: result.errors.map(err => ({
          field: err.path.replace(/\//g, '.'),
          message: err.message,
          keyword: err.keyword,
          params: err.params
        }))
      });
    }

    // Validation passed, continue processing
    next();
  };
}

// Usage example
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-64!'
});

app.post('/api/users',
  validateBody(userSchema),
  async (req, res) => {
    const user = await createUser(req.body);
    res.json({ success: true, data: user });
  }
);
```

### Koa middleware

```javascript
const { dsl, Validator } = require('schema-dsl');

function validateBody(schema) {
  const validator = new Validator();

  return async (ctx, next) => {
    const result = validator.validate(schema, ctx.request.body);

    if (!result.valid) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Data validation failed',
        errors: result.errors.map(err => ({
          field: err.path.replace(/\//g, '.'),
          message: err.message,
          keyword: err.keyword
        }))
      };
      return;
    }

    await next();
  };
}

// Usage example
const registerSchema = dsl({
  username: 'string:3-32!'.username(),
  email: 'email!',
  password: 'string!'.password('strong')
});

router.post('/register', validateBody(registerSchema), async (ctx) => {
  ctx.body = { success: true, data: await register(ctx.request.body) };
});
```

---

## Front-end error display

### React example

```javascript
import React, { useState } from 'react';

function RegisterForm() {
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!data.success && data.code === 'VALIDATION_ERROR') {
        //Convert error array to object
        const errorMap = {};
        data.errors.forEach(err => {
          errorMap[err.field] = err.message;
        });
        setErrors(errorMap);
      }

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input name="username" />
        {errors.username && (
          <span className="error">{errors.username}</span>
        )}
      </div>

      <div>
        <input name="email" type="email" />
        {errors.email && (
          <span className="error">{errors.email}</span>
        )}
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
```

### Vue example

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <input v-model="form.username" />
      <span v-if="errors.username" class="error">
        {{ errors.username }}
      </span>
    </div>

    <div>
      <input v-model="form.email" type="email" />
      <span v-if="errors.email" class="error">
        {{ errors.email }}
      </span>
    </div>

    <button type="submit">Register</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
        email: ''
      },
      errors: {}
    };
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        });

        const data = await response.json();

        if (!data.success && data.code === 'VALIDATION_ERROR') {
          this.errors = data.errors.reduce((acc, err) => {
            acc[err.field] = err.message;
            return acc;
          }, {});
        }

      } catch (error) {
        console.error(error);
      }
    }
  }
};
</script>
```

---

## Error logging

### Basic log

```javascript
app.post('/api/register', async (req, res) => {
  const result = await registerSchema.validate(req.body, {
    abortEarly: false
  });

  if (!result.isValid) {
    // Record validation errors
    logger.warn('User registration validation failed', {
      ip: req.ip,
      errors: result.errors,
      data: req.body
    });

    return res.status(400).json({
      success: false,
      errors: result.errors
    });
  }

  // continue processing
});
```

### Structured log

```javascript
const logger = require('winston');

function logValidationError(req, result) {
  logger.warn({
    message: 'Authentication failed',
    type: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    ip: req.ip,
    url: req.url,
    method: req.method,
    errors: result.errors.map(err => ({
      path: err.path.replace(/\//g, '.'),
      type: err.type,
      message: err.message
    })),
    // Sensitive data desensitization
    data: maskSensitiveData(req.body)
  });
}
```

---

## best practices

### 1. Use labels to make error messages clearer

```javascript
const { dsl } = require('schema-dsl');

// ✅ Recommendation: use label
const schema = dsl({
  username: 'string:3-32!'.label('username')
});
// The error message will contain the "username" tag

// ❌ Not recommended: do not use label
const schema = dsl({
  username: 'string:3-32!'
});
// The error message only displays the field name "username"
```

### 2. Provide friendly Chinese error messages

```javascript
const { dsl } = require('schema-dsl');

// ✅ Recommended: Customized Chinese message
const schema = dsl({
  username: 'string:3-32!'
    .label('username')
    .messages({
      'minLength': '{{#label}} requires at least {{#limit}} characters',
      'maxLength': '{{#label}} is at most {{#limit}} characters'
    })
});

// ❌ Not recommended: use the default English message
const schema = dsl({
  username: 'string:3-32!'
});
```

### 3. Use custom validation to implement business logic

```javascript
const { dsl } = require('schema-dsl');

// ✅ Recommended: Return error message string
const schema = dsl({
  username: 'string:3-32!'
    .custom((value) => {
      if (value === 'admin') {
        return 'Username has been occupied';
      }
      // No need to return when validation passes
    })
    .label('username')
});
```

### 4. Do not include sensitive data in error logs

```javascript
function maskSensitiveData(data) {
  return {
    ...data,
    password: '***',
    confirmPassword: '***',
    creditCard: data.creditCard ? '****' + data.creditCard.slice(-4) : undefined
  };
}

// use
logger.warn('Validation failed', {
  errors: result.errors,
  data: maskSensitiveData(req.body)
});
```

### 5. Unified error format facilitates front-end processing

```javascript
// Unified error formatting function
function formatValidationErrors(errors) {
  return errors.map(err => ({
    field: err.path.replace(/\//g, '.'),
    message: err.message,
    keyword: err.keyword,
    params: err.params
  }));
}

// use
if (!result.valid) {
  return res.status(400).json({
    success: false,
    code: 'VALIDATION_ERROR',
    errors: formatValidationErrors(result.errors)
  });
}
```

---

## v1.1.5 new feature: object format error configuration

### Overview

Starting from v1.1.5, the language pack supports the object format `{ code, message }` to achieve unified error code management.

### Basic usage

**Language pack configuration**:
```javascript
// i18n/errors/zh-CN.cjs (or any.json/.jsonc/.json5 custom language pack file)
module.exports = {
  // String format (backwards compatible)
  'user.notFound': 'User does not exist',

  // Object format (new in v1.1.5) ✨ - Use numeric error codes
  'account.notFound': {
    code: 40001,
    message: 'Account does not exist'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current balance {{#balance}}, need {{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: 'Order not paid'
  }
};
```

**Usage Example**:
```javascript
const { dsl } = require('schema-dsl');

try {
  dsl.error.throw('account.notFound');
} catch (error) {
  console.log(error.originalKey);  // 'account.notFound'
  console.log(error.code); // 40001 ✨ Numeric error code
  console.log(error.message); // 'Account does not exist'
}
```

### Core features

#### 1. originalKey field (new)

Keep the original key for easy debugging and log tracking:

```javascript
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  error.originalKey // 'account.notFound' (original key)
  error.code // 40001 (numeric error code)
}
```

#### 2. Sharing code in multiple languages

Different languages ​​use the same number `code` to facilitate unified processing by the front end:

```javascript
// zh-CN.cjs
'account.notFound': {
  code: 40001, // ← digital code consistent
  message: 'Account does not exist'
}

// en-US.cjs
'account.notFound': {
  code: 40001, // ← digital code consistent
  message: 'Account not found'
}

// Front-end processing - language independent
switch (error.code) {
  case 40001:
    redirectToLogin();
    break;
  case 40002:
    showTopUpDialog();
    break;
  case 50001:
    showPaymentDialog();
    break;
}
```

#### 3. Enhanced error.is() method

Supports `originalKey` and digital `code` judgments at the same time:

```javascript
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  // Both methods are available
  if (error.is('account.notFound')) { } // ✅ Use originalKey
  if (error.is(40001)) { } // ✅ Use numeric code
}
```

#### 4. toJSON contains originalKey

```javascript
const json = error.toJSON();
// {
//   error: 'I18nError',
// originalKey: 'account.notFound', // ✨ v1.1.5 New
//   code: 'ACCOUNT_NOT_FOUND',
// message: 'Account does not exist',
//   params: {},
//   statusCode: 400,
//   locale: 'zh-CN'
// }
```

### backwards compatible

**Fully Backward Compatible** ✅ - Automatic string format conversion:

```javascript
// String format (original)
'user.notFound': 'User does not exist'

// Automatically convert to object
dsl.error.throw('user.notFound');
// error.code = 'user.notFound' (use key as code)
// error.originalKey = 'user.notFound'
// error.message = 'User does not exist'
```

### best practices

#### 1. When to use object formats

**Recommended to use object format**:
- ✅ Errors that need to be handled uniformly in multiple languages
- ✅ Errors that require unified judgment by the front end
- ✅ Core business errors (account, order, payment, etc.)

**String format can be used**:
- ✅ Simple validation error
- ✅ Internal errors (not exposed to front-end)
- ✅ Errors that do not need to be handled uniformly

#### 2. Error code naming convention

It is recommended to use **numeric error codes**, segmented by module:

```javascript
// Error code specification (5 digits)
// 4xxxx - client error
// 5xxxx - Business logic error
// 6xxxx - System error

'account.notFound': {
  code: 40001, // ✅ Recommended: Account module, serial number 001
  message: 'Account does not exist'
}

'account.insufficientBalance': {
  code: 40002, // Account module, serial number 002
  message: 'Insufficient balance'
}

'order.notPaid': {
  code: 50001, // ✅ Order module, serial number 001
  message: 'Order not paid'
}

'order.cancelled': {
  code: 50002, // Order module, serial number 002
  message: 'Order has been cancelled'
}

'database.connectionError': {
  code: 60001, // ✅ System error
  message: 'Database connection failed'
}
```

**Error code segmentation suggestions**:
- `40001-49999` - ​​Client error (account, permission, parameter validation, etc.)
- `50001-59999` - ​​Business logic error (order, payment, inventory, etc.)
- `60001-69999` - ​​System error (database, service unavailable, etc.)

#### 3. Unified error handling on the front end

```javascript
//API call
try {
  const response = await fetch('/api/account');
  const data = await response.json();
} catch (error) {
  //Use digital code for unified processing, not affected by language
  switch (error.code) {
    case 40001:  // ACCOUNT_NOT_FOUND
      showNotFoundPage();
      break;
    case 40002:  // INSUFFICIENT_BALANCE
      showTopUpDialog(error.params);
      break;
    case 50001:  // ORDER_NOT_PAID
      showPaymentDialog();
      break;
    case 60001:  // SYSTEM_ERROR
      showSystemErrorPage();
      break;
    default:
      showGenericError(error.message);
  }
}
```

**More elegant way - error code mapping**:
```javascript
// errorCodeMap.js
const ERROR_HANDLERS = {
  40001: () => router.push('/account-not-found'),
  40002: (error) => showDialog('topup', error.params),
  50001: (error) => showDialog('payment', error.params),
  60001: () => showSystemErrorPage(),
};

// Unified error handling
function handleError(error) {
  const handler = ERROR_HANDLERS[error.code];
  if (handler) {
    handler(error);
  } else {
    showGenericError(error.message);
  }
}
```

### More information

- [v1.1.5 complete change log](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md)
- [Upgrade Guide](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md#upgrade-guide)
- [Best Practice](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md#best-practice)

---

## Related documents

- [API Reference Document](./api-reference.md)
- [DSL Syntax Guide](./dsl-syntax.md)
- [String extended document](./string-extensions.md)
- [Multi-language configuration](./dynamic-locale.md)
- [v1.1.5 Change Log](https://github.com/vextjs/schema-dsl/blob/main/changelogs/v1.1.5.md)

---

## Corresponding sample file

**Example entry**: [error-handling.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/error-handling.ts)
**Description**: Covers the field errors generated by `validate()`, `I18nError` business error objects, `toJSON()` output and error code judgment.

---

**Last updated**: 2026-05-08
**Version**: v1.1.5
