# Runtime multi-language support - schema-dsl

**Version**: v1.1.8+
**Updated date**: 2026-06-10

---

## 📋 Overview

schema-dsl's `dsl.error` and `I18nError` support **runtime specification of language** without modifying global language settings.

This is particularly useful for **API development**, where error messages in the corresponding language can be dynamically returned based on the language preference of each request (such as the `Accept-Language` request header).

### 🆕 Intelligent parameter recognition (v1.1.8)

**New in v1.1.8**: Support simplified syntax, reduced from 4 parameters to 2 parameters

```javascript
// ✅ New: Simplified syntax (recommended)
dsl.error.throw('account.notFound', 'zh-CN');
dsl.error.throw('account.notFound', 'zh-CN', 404);

// ✅ Standard syntax (fully compatible)
dsl.error.throw('account.notFound', {}, 404, 'zh-CN');
```

**Intelligent recognition rules**:
- The second parameter is `string` → recognized as a language parameter
- The second parameter is `object` → recognized as a parameter object
- The second parameter is `null/undefined/array` → use the default value

### 🎨 Supported template syntax (v1.1.4+)

schema-dsl now supports multiple template syntax formats, providing better compatibility:

| Syntax format | Example | Description | Version |
|---------|------|------|------|
| `{{#variable}}` | `Balance {{#balance}} CNY` | pound sign format (existing) | v1.0.0+ |
| `{{variable}}` | `Balance {{balance}} CNY` | No pound sign format (new) | v1.1.4+ |
| `{variable}` | `Balance {balance} CNY` | Single curly brace (new) | v1.1.4+ |
| mixed format | `{{#user}} bought {{product}} on {date}` | Can mix multiple formats | v1.1.4+ |

**Example**:
```javascript
// All formats are supported
Locale.addLocale('zh-CN', {
  'msg1': 'Insufficient balance, current {{#balance}} yuan', // {{#}} format
  'msg2': 'User {{name}} has logged in', // {{}} format
  'msg3': 'Order {orderId} has been paid', // {} format
  'msg4': '{{#user}} purchased {{product}} on {date}' // Mixed format
});
```

**Backward Compatibility**:
- ✅ Existing `{{#variable}}` formats are fully compatible
- ✅ All unit tests passed
- ✅ No breaking changes

---

## 🎯Three ways to use

### Method 1: Simplified syntax (v1.1.8 recommended)⭐

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

// ✅ Simplified syntax: pass language parameters directly
const error1 = dsl.error.create('account.notFound', 'zh-CN');
console.log(error1.message); // "Account does not exist"

const error2 = dsl.error.create('account.notFound', 'en-US');
console.log(error2.message);  // "Account not found"
```

**Applicable scenarios**:
- No parameter interpolation required
- Most common in API development
- The most concise code

### Method 2: Global language settings (traditional method)

```javascript
const { dsl, Locale } = require('schema-dsl');

//Set global language
Locale.setLocale('zh-CN');

// All subsequent errors will be in Chinese
const error1 = dsl.error.create('account.notFound');
console.log(error1.message); // "Account does not exist"

const error2 = dsl.error.create('user.noPermission');
console.log(error2.message); // "No administrator rights"
```

**Applicable scenarios**:
- Single language application
- No need to switch languages ​​dynamically
- Simple error handling

---

### Method 3: Specify language at runtime (recommended for API)⭐

```javascript
const { dsl, Locale } = require('schema-dsl');

//Keep default language globally
Locale.setLocale('zh-CN');

//Specify the language each time it is called
const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
console.log(error1.message); // "Account does not exist"

const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
console.log(error2.message);  // "Account not found"

const error3 = dsl.error.create('account.notFound', {}, 404, 'ja-JP');
console.log(error3.message); // "account.notFound" (Japanese not translated)
```

**Applicable scenarios**:
- Multilingual API
- Dynamically return multi-language errors based on request headers
- Multiple languages ​​required in the same request
- Error propagation in microservice architecture

---

## 🔧 API parameters

### dsl.error.create()

```typescript
dsl.error.create(
  code: string, // Error code (such as 'account.notFound')
  params?: object, // Parameter interpolation (such as { balance: 50 })
  statusCode?: number, // HTTP status code (default 400)
  locale?: string // 🆕 runtime language (such as 'en-US')
): I18nError
```

### dsl.error.throw()

```typescript
dsl.error.throw(
  code: string,
  params?: object,
  statusCode?: number,
  locale?: string // 🆕 runtime language
): never
```

### dsl.error.assert()

```typescript
dsl.error.assert(
  condition: any,
  code: string,
  params?: object,
  statusCode?: number,
  locale?: string // 🆕 runtime language
): void
```

---

## 💡 Practical application scenarios

### Scenario 1: Multi-language errors are returned based on request headers in Express/Koa

```javascript
const { dsl } = require('schema-dsl');

function getRequestLocale(acceptLanguage) {
  return acceptLanguage?.split(',')[0]?.trim() || 'zh-CN';
}

// Express middleware
app.get('/api/account/:id', async (req, res, next) => {
  try {
    const account = await getAccount(req.params.id);

    // Get the language based on the request header
    const locale = getRequestLocale(req.headers['accept-language']);

    // throw errors using runtime language
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);

    res.json(account);
  } catch (error) {
    if (error instanceof I18nError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    next(error);
  }
});

//Request example
// Chinese client: Accept-Language: zh-CN
// Response: { "code": "account.notFound", "message": "Account does not exist",... }

// English client: Accept-Language: en-US
// Response: { "code": "account.notFound", "message": "Account not found",... }
```

---

### Scenario 2: Error propagation in microservice architecture

```javascript
const { dsl } = require('schema-dsl');

// Service A: User service
async function getUserService(userId, locale) {
  const user = await db.findUser(userId);

  // pass locale to error
  dsl.error.assert(user, 'user.notFound', { userId }, 404, locale);

  return user;
}

// Service B: API Gateway
app.get('/api/users/:id', async (req, res) => {
  try {
    const locale = getRequestLocale(req.headers['accept-language']);

    // Call user service, passing locale
    const user = await getUserService(req.params.id, locale);

    res.json(user);
  } catch (error) {
    // The error is already in the correct language
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

### Scenario 3: Multiple languages ​​used in the same request

```javascript
const { dsl } = require('schema-dsl');

// Batch validation, returning errors in different languages ​​for different users
async function batchValidateAccounts(requests) {
  const results = [];

  for (const req of requests) {
    try {
      const account = await getAccount(req.accountId);

      //Each user uses their own language preference
      dsl.error.assert(
        account.balance >= req.amount,
        'account.insufficientBalance',
        { balance: account.balance, required: req.amount },
        400,
        req.locale // Language preference for each user
      );

      results.push({ success: true, accountId: req.accountId });
    } catch (error) {
      results.push({
        success: false,
        accountId: req.accountId,
        error: error.toJSON() // The error already corresponds to the user's language
      });
    }
  }

  return results;
}

// Call example
const results = await batchValidateAccounts([
  { accountId: '001', amount: 100, locale: 'zh-CN' }, // Chinese users
  { accountId: '002', amount: 200, locale: 'en-US' }, // English users
  { accountId: '003', amount: 300, locale: 'ja-JP' } // Japanese users
]);

// Result: Each user receives an error message in the corresponding language
```

---

### Scenario 4: Multilingual errors in GraphQL Resolver

```javascript
const { dsl } = require('schema-dsl');

const resolvers = {
  Query: {
    account: async (_, { id }, context) => {
      // Get user language preference from context
      const locale = context.user?.locale || 'zh-CN';

      const account = await getAccount(id);

      // Use runtime language
      dsl.error.assert(account, 'account.notFound', {}, 404, locale);

      return account;
    }
  }
};
```

---

## 🔍 Runtime language vs global language

### Comparison table

| characteristic | global language | runtime language |
|------|---------|-----------|
| Setting method | `Locale.setLocale('zh-CN')` | `dsl.error.create(..., locale)` |
| scope of influence | All global errors | Only current errors |
| Whether to change the global state | ✅ Yes | ❌ No |
| Applicable scenarios | Single language application | Multilingual API |
| Concurrency safety | ⚠️Note | ✅ Completely safe |
| Recommended for | Simple application | API/Microservices |

### Concurrency safety

**Global Language** (not recommended for multi-language APIs):

```javascript
// ❌ Concurrency is not safe
app.get('/api/account/:id', async (req, res) => {
  //Modify global state
  Locale.setLocale(req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN');

  // If there are multiple requests at the same time, the languages ​​will interfere with each other
  const error = dsl.error.create('account.notFound');
  // The error message may be in the wrong language!
});
```

**Runtime Language** (recommended):

```javascript
// ✅ Concurrency safety
app.get('/api/account/:id', async (req, res) => {
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';

  //Do not modify the global state, each request is independent
  const error = dsl.error.create('account.notFound', {}, 404, locale);
  // Error messages are always in the correct language
});
```

---

## 📊 Test validation

### Runtime language testing

```javascript
const { dsl, Locale } = require('schema-dsl');

//Set global to Chinese
Locale.setLocale('zh-CN');

//Test 1: Specify different languages ​​at run time
const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
const error3 = dsl.error.create('account.notFound', {}, 404, 'ja-JP');

console.log(error1.message); // "Account does not exist"
console.log(error2.message);  // "Account not found"
console.log(error3.message);  // "account.notFound"

//Test 2: Verify that the global language has not been changed
const currentLocale = Locale.getLocale();
console.log(currentLocale);  // "zh-CN"

const error4 = dsl.error.create('user.noPermission'); // Do not specify locale
console.log(error4.message); // "No administrator rights" (use global language)
```

### Runtime language with parameters

```javascript
const error1 = dsl.error.create(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  400,
  'zh-CN'
);
console.log(error1.message); // "Insufficient balance, current balance is 50, 100 is needed"

const error2 = dsl.error.create(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  400,
  'en-US'
);
console.log(error2.message);  // "Insufficient balance, current: 50, required: 100"
```

---

## 🎯 Best Practices

### 1. Always use runtime language in API development

```javascript
// ✅ Recommended
app.get('/api/account/:id', async (req, res) => {
  const locale = req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN';

  try {
    const account = await getAccount(req.params.id);
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);
    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});

// ❌ Not recommended
app.get('/api/account/:id', async (req, res) => {
  Locale.setLocale(req.headers['accept-language']?.split(',')[0]?.trim() || 'zh-CN'); // Concurrency is not safe
  // ...
});
```

### 2. Unified encapsulation language acquisition logic

```javascript
// Utility function
function getUserLocale(req) {
  return req.user?.locale ||
         req.headers['accept-language']?.split(',')[0]?.trim() ||
         'zh-CN';
}

// Used in business code
app.get('/api/account/:id', async (req, res) => {
  const locale = getUserLocale(req);

  try {
    const account = await getAccount(req.params.id);
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);
    res.json(account);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

### 3. Pass locale between microservices

```javascript
// Service A: underlying service
async function getUser(userId, options = {}) {
  const user = await db.findUser(userId);

  dsl.error.assert(
    user,
    'user.notFound',
    { userId },
    404,
    options.locale //Receive locale parameter
  );

  return user;
}

// Service B: API Gateway
app.get('/api/users/:id', async (req, res) => {
  const locale = getUserLocale(req);

  try {
    const user = await getUser(req.params.id, { locale });
    res.json(user);
  } catch (error) {
    res.status(error.statusCode).json(error.toJSON());
  }
});
```

---

## 📝 Backwards compatible

✅ **Fully backwards compatible**

- Existing code does not need to be modified
- `locale` Parameters are optional parameters
- Use the global language when `locale` is not passed
- Relevant unit tests have been covered

---

## 🔗 Related documents

- [Multi-language Configuration Guide](./i18n.md)
- [Complete Guide to Error Handling](./error-handling.md)
- [I18nError API Reference](./api-reference.md)

---

## Corresponding sample file

**Example entry**: [runtime-locale-support.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/runtime-locale-support.ts)
**Description**: Overrides the key behavior of specifying locale creation error objects at runtime, parameter interpolation, and "local language switching does not pollute the global state".

---

**Last updated**: 2026-06-10
**Author**: schema-dsl Team
