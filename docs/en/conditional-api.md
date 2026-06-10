# Chained Condition API - ConditionalBuilder

> **Version**: schema-dsl v2.0.7
> **Updated date**: 2026-06-10
> **Status**: ✅ Stable

---

## 📋 Table of Contents

- [Overview](#overview)
- [🆕 v1.1.1 new features](#-v111-new-features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Usage Scenario](#usage-scenarios)
- [Best Practice](#best-practices)
- [FAQ](#faq)

---

## Overview

`ConditionalBuilder` Provides a smooth chained conditional judgment API, similar to JavaScript’s if-else statement, which is used to dynamically adjust validation rules based on actual data during validation.

> Key semantics: When you use the "return on failure" mode such as `.message()` / `.assert()` / `.check()`, the conditional function should be written as **failure condition**, because the condition will be judged as failure if it returns `true`.

### Core features

- ✅ **Chain Call** - Fluent API, similar to JavaScript if-else
- ✅ **Runtime execution** - judge based on actual data during validation
- ✅ **Multiple condition combination** - supports and/or logical combination
- ✅ **🆕 Independent Message** - v1.1.1+ Each.and()/.or() can have independent error message
- ✅ **else optional** - If you don’t write else, it will not be validated.
- ✅ **Simplified Design** - message automatically throws errors, no need to throwError()
- ✅ **Fully Compatible** - Does not affect existing APIs

---

## 🆕 v1.1.1 new features

### Independent message support - `.and()/.or()` can be called later `.message()`

**Each condition can have its own error message**

Starting from v1.1.1, it is supported to call `.message()` after `.and()` and `.or()` to set an independent error message to make the error prompt more precise.

#### Basic usage

```javascript
const { dsl } = require('schema-dsl');

// ✅ v1.1.1+ new feature: independent message for each condition
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// How it works:
// - first condition is true → return 'ACCOUNT_NOT_FOUND'
// - second condition is true → return 'INSUFFICIENT_TRADABLE_CREDITS'
// - all conditions are false → validation successful
```

#### Multiple.and() conditions

```javascript
//Multiple layers of validation, with clear error messages for each layer
dsl.if(d => !d)
  .message('ACCOUNT_NOT_FOUND')
  .and(d => d.status !== 'active')
  .message('ACCOUNT_INACTIVE')
  .and(d => d.tradable_credits < amount)
  .message('INSUFFICIENT_TRADABLE_CREDITS')
  .assert(account);

// Check in sequence, the first true condition returns its message
```

#### .or() conditionally independent messages

```javascript
// OR conditions also support independent messages
dsl.if(d => d.age < 18)
  .message('Underage users cannot register')
  .or(d => d.isBlocked)
  .message('Account has been banned')
  .assert(data);

// If any condition is true, it fails and the corresponding message is returned.
```

#### chain check mode

v1.1.1 introduced **Chain Check Mode**, which is automatically enabled when the following conditions are met:

1. Use `.message()` mode (not `.then()`/`.else()`)
2. The root condition is `.message()`
3. There are `.and()` conditions
4. No `.or()` condition

**Chain check mode features**:
- Check each condition in turn
- The first condition `true` fails and its message is returned
- Validation passes when all conditions are `false`

**Example comparison**:

```javascript
// ✅ Enable chain checking (pure AND scenario)
dsl.if(d => !d).message('A').and(d => d < 100).message('B')

// ❌ Not enabled (has.or(), uses traditional AND/OR logic)
dsl.if(d => !d).message('A').and(d => d < 100).or(d => d > 200).message('B')

// ❌ Not enabled (use.then()/.else(), not message mode)
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').then('email!')
```

#### backward compatibility

**100% backward compatible**, does not affect existing code:

```javascript
// ✅Original usage continues to work
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').message('does not meet the conditions')

// ✅ It’s okay not to call.message() after.and()
dsl.if(d =>!d).message('Overall error').and(d => d < 100).assert(50)
// → Use global message 'Global error'
```

#### Practical application scenarios

**Scenario 1: Account Validation**
```javascript
function validateAccount(account, amount) {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.status !== 'active')
    .message('ACCOUNT_INACTIVE')
    .and(d => d.balance < amount)
    .message('INSUFFICIENT_BALANCE')
    .assert(account);
}

// Each failure point has a clear error message
```

**Scenario 2: User permission validation**
```javascript
function validateUserPermission(user) {
  dsl.if(d => d.role !== 'admin')
    .message('NO_ADMIN_PERMISSION')
    .and(d => !d.isVerified)
    .message('USER_NOT_VERIFIED')
    .and(d => d.isBanned)
    .message('USER_BANNED')
    .assert(user);
}
```

**Scenario 3: Order status check**
```javascript
function validateOrder(order) {
  dsl.if(d => d.status !== 'paid')
    .message('ORDER_NOT_PAID')
    .and(d => !d.payment)
    .message('PAYMENT_INFO_MISSING')
    .and(d => !d.shippingAddress)
    .message('SHIPPING_ADDRESS_MISSING')
    .assert(order);
}
```

---

## Differences from existing methods

`dsl.if()` provides two usage methods, automatically selected according to the parameter type:

| Way | Parameter type | execution timing | use | Example |
|------|---------|---------|------|------|
| **Method 1** | string | When Schema is defined | static boolean condition | `dsl.if('isVip', thenSchema, elseSchema)` |
| **Method 2** | function | When verifying | Dynamic condition judgment | `dsl.if((data) => data.age >= 18).then(...)` |

**Method 1** (field conditions): static judgment based on field values
```javascript
// Example: Select different validation rules based on isVip field value
dsl.if('isVip', 'number:0-50', 'number:0-10')
```

**Method 2** (function condition): dynamic judgment based on complete data
```javascript
// Example: Dynamic selection based on the combination logic of multiple fields
dsl.if((data) => data.age >= 18 && data.role === 'admin')
  .then('email!')
  .else('email')
```

In addition, `dsl.match()` is suitable for multi-value mapping scenarios:
```javascript
// Example: Map different validation rules based on type field value
dsl.match('type', {
  email: 'email!',
  phone: 'string:11!',
  _default: 'string'
})
```

---

## quick start

### Basic usage

```javascript
const { dsl, validate } = require('schema-dsl');

// Method 1: Traditional method (requires validate function)
const schema1 = dsl({
  age: 'number!',
  status: dsl.if((data) => data.age < 18)
    .message('Underage users cannot register')
});

validate(schema1, { age: 16, status: 'active' });
// => { valid: false, errors: [{ message: 'Underage users cannot register' }], data: { age: 16, status: 'active' } }

// ✅ Method 2: Shortcut (one line of code validation)
const result = dsl.if((data) => data.age < 18)
  .message('Underage users cannot register')
  .validate({ age: 16 });
// => { valid: false, errors: [{ message: 'Underage users cannot register' }], data: { age: 16 } }

// ✅ Method 3:.check() quick judgment
const isValid = dsl.if((data) => data.age < 18)
  .message('Underage users cannot register')
  .check({ age: 16 });
// => false

// 2. Condition + then/else (dynamic Schema)
const result = dsl.if((data) => data.userType === 'admin')
  .then('email!') // Required by administrator
  .else('email') // Optional for ordinary users
  .validate({ userType: 'admin', email: 'admin@example.com' });

// 3. else optional
const result = dsl.if((data) => data.userType === 'vip')
  .then('enum:gold|silver|bronze!')
  // Do not write else, non-vip users will not be validated
  .validate({ userType: 'user' });

// 4. Reuse validator
const ageValidator = dsl.if(d => d.age < 18).message('Underage users cannot register');
const r1 = ageValidator.validate({ age: 16 }); // failed
const r2 = ageValidator.validate({ age: 20 }); // Pass
```

### Multiple condition combinations

```javascript
// 1. AND condition
const result = dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .message('Only adult administrators can operate')
  .validate({ age: 20, userType: 'user' });

// 2. OR condition
const result = dsl.if((data) => data.age < 18)
  .or((data) => data.status === 'blocked')
  .message('Registration not allowed')
  .validate({ age: 16, status: 'active' });

// 3. Complex combination
const result = dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .or((data) => data.status === 'vip')
  .then('email!')
  .else('email')
  .validate(data);
```

### elseIf branch

```javascript
const validator = dsl.if((data) => data.userType === 'admin')
  .then('array<string>!')
  .elseIf((data) => data.userType === 'vip')
  .then('array<string>')
  .elseIf((data) => data.userType === 'user')
  .then('array')
  .else(null); // Visitors do not verify

const r1 = validator.validate({ userType: 'admin', permissions: ['read', 'write'] });
const r2 = validator.validate({ userType: 'vip' });
const r3 = validator.validate({ userType: 'guest' });
```

---

## API reference

### dsl.if(condition)

Create a chained conditional builder.
**Parameters**:
- `condition` {Function} - conditional function, receiving complete data object
  - Parameter: `(data: any) => boolean`
  - Return: `boolean` - ​​true means the condition is met

**Returns**: `ConditionalBuilder` - ​​builder instance

**Example**:
```javascript
dsl.if((data) => data.age >= 18)
dsl.if((data) => data.userType === 'admin')
dsl.if((data) => data.status === 'active' && data.validated)
```

---

### .and(condition)

Add an AND condition (combine with the previous condition).

> **v1.1.1+** Support calling `.message()` after `.and()` to set independent error messages
**Parameters**:
- `condition` {Function} - conditional function

**Return**: `this` - ​​supports chain calls

**Basic example**:
```javascript
// Traditional usage: all conditions share one message
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .message('Does not meet conditions')
```

**v1.1.1+ Standalone Message**:
```javascript
// ✅ Each condition has its own error message
dsl.if((data) => !data)
  .message('Account does not exist')
  .and((data) => data.balance < 100)
  .message('Insufficient balance')
  .assert(account);

// How it works:
// - The first condition is true → return 'account does not exist'
// - The second condition is true → return 'Insufficient balance'
// - all conditions are false → validation successful
```

**Multiple.and() conditions**:
```javascript
// Supports multiple.and() conditions, each with independent messages
dsl.if(d => !d)
  .message('NOT_FOUND')
  .and(d => d.status !== 'active')
  .message('INACTIVE')
  .and(d => d.balance < 100)
  .message('INSUFFICIENT')
  .assert(account);

// Check in sequence, the first true condition returns its message
```

**logic**:
- Traditional mode: `(condition1 AND condition2)` - ​​all conditions must be true to fail
- Chain check mode (v1.1.1+): Check in sequence, the first one that is true fails

**Chain check mode trigger conditions**:
1. Use `.message()` mode
2. The root condition is `.message()`
3. There are `.and()` conditions
4. No `.or()` condition

---

### .or(condition)

Add an OR condition (combine with the previous condition).

> **v1.1.1+** Support calling `.message()` after `.or()` to set independent error messages
**Parameters**:
- `condition` {Function} - conditional function

**Return**: `this` - ​​supports chain calls

**Basic example**:
```javascript
// Traditional usage: all conditions share one message
dsl.if((data) => data.age < 18)
  .or((data) => data.status === 'blocked')
  .message('Registration not allowed')
```

**v1.1.1+ Standalone Message**:
```javascript
// ✅ Each OR condition has its own error message
dsl.if(d => d.age < 18)
  .message('Underage users cannot register')
  .or(d => d.isBlocked)
  .message('Account has been banned')
  .assert(data);

// How it works:
// - The first condition is true → return 'Underage users cannot register'
// - The second condition is true → returns 'Account has been banned'
// - all conditions are false → validation successful
```

**Logic**: `(condition1 OR condition2)` - ​​Fails if any condition is true

**Notice**:
- Chained check mode will not be enabled if `.or()` condition is present
- Use traditional AND/OR combinational logic

---

### .build()

Output the current `ConditionalBuilder` into a schema object that can be directly passed to `Validator` / `validate()` for use.

`.build()` is an alias of `.toSchema()`, suitable for use when you want to get the final schema explicitly.

```javascript
const { dsl, validate } = require('schema-dsl');

const conditionalSchema = dsl.if(data => data.age >= 18)
  .then('email!')
  .else('email')
  .build();

const result = validate(conditionalSchema, 'user@example.com');
console.log(result.valid);
```

---

### .elseIf(condition)

Add else-if branch.
**Parameters**:
- `condition` {Function} - conditional function

**Return**: `this` - ​​supports chain calls

**Example**:
```javascript
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .elseIf((data) => data.userType === 'vip')
  .then('email')
  .else(null)
```

**Note**: Must be called after `.if()`

---

### .message(msg)

Set error message (supports multi-language keys).

> **v1.1.1+** Support setting independent messages for `.and()` and `.or()` conditions
**Parameters**:
- `msg` {string} - error message or multilingual key

**Return**: `this` - ​​supports chain calls

**Behavior**: This error is automatically thrown when the condition is true (no need for `.throwError()`)

**Basic example**:
```javascript
dsl.if((data) => data.age < 18)
  .message('Underage users cannot register')

//Support multi-language key
dsl.if((data) => data.age < 18)
  .message('error.underage')
```

**v1.1.1+ Set independent message for.and()**:
```javascript
// ✅ Each condition has its own error message
dsl.if((data) => !data)
  .message('Account does not exist')
  .and((data) => data.balance < 100)
  .message('Insufficient balance')
  .assert(account);
```

**v1.1.1+ Set independent message for.or()**:
```javascript
// ✅ OR conditions also support independent messages
dsl.if(d => d.age < 18)
  .message('underage')
  .or(d => d.isBlocked)
  .message('Banned')
  .assert(data);
```

**Chain check mode description** (v1.1.1+):

Chained check mode is automatically enabled when the following conditions are met:
1. Use `.message()` mode (not `.then()`/`.else()`)
2. The root condition is `.message()`
3. There are `.and()` conditions
4. No `.or()` condition

```javascript
// ✅ Enable chain checking (pure AND scenario)
dsl.if(d => !d).message('A').and(d => d < 100).message('B')

// ❌ Not enabled (with.or())
dsl.if(d => !d).message('A').and(d => d < 100).or(d => d > 200).message('B')

// ❌ Not enabled (use.then()/.else())
dsl.if(d => d.age >= 18).and(d => d.role === 'admin').then('email!')
```

---

### .then(schema)

Set the Schema when the conditions are met.
**Parameters**:
- `schema` {string|DslBuilder|JSONSchema} - DSL string or Schema object

**Return**: `this` - ​​supports chain calls

**Example**:
```javascript
// DSL string
dsl.if((data) => data.userType === 'admin')
  .then('email!')

// DslBuilder instance
dsl.if((data) => data.userType === 'admin')
  .then(dsl('email!').label('Administrator's email'))

// JSON Schema object
dsl.if((data) => data.userType === 'admin')
  .then({ type: 'string', format: 'email' })
```

---

### .else(schema)

Set the default Schema (when all conditions are not met).
**Parameters**:
- `schema` {string|DslBuilder|JSONSchema|null} - DSL string, Schema object, or null

**Return**: `this` - ​​supports chain calls

**Feature**: Optional, if you don’t write else, it won’t be validated.

**Example**:
```javascript
//Explicitly specify else
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else('email')

// else is null (explicitly skip validation)
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else(null)

// Don't write else (implicitly skip validation)
dsl.if((data) => data.userType === 'admin')
  .then('email!')
```

---

### .validate(data, options)

Quick validation method - returns complete validation results.
**Parameters**:
- `data` {*} - Data to be validated (any type)
- `options` {Object} - Authentication options (optional)
  - `locale` {string} - locale (e.g. 'zh-CN', 'en-US')
  - `messages` {Object} - Custom error message

**Return**: `Object` - ​​Validation result `{ valid, errors, data }`

**Feature**: One line of code to complete validation, no external `validate()` function required

**Example**:
```javascript
// One line of code validation
const result = dsl.if(d => d.age < 18)
  .message('Underage users cannot register')
  .validate({ age: 16 });
// => { valid: false, errors: [...], data }

//Reuse validator
const ageValidator = dsl.if(d => d.age < 18).message('underage');
const r1 = ageValidator.validate({ age: 16 });  // false
const r2 = ageValidator.validate({ age: 20 });  // true

//Support validation options
const result = dsl.if(d => d.age < 18)
  .message('conditional.underAge')
  .validate({ age: 16 }, { locale: 'zh-CN' });

// Validate non-object types
const result = dsl.if(d => d.includes('@'))
  .then('email!')
  .validate('test@example.com');
```

---

### .validateAsync(data, options)

Asynchronous validation method - automatically throws an exception on failure.
**Parameters**:
- `data` {*} - Data to be validated
- `options` {Object} - Authentication options (optional)

**Return**: `Promise<*>` - ​​If the validation passes, the data will be returned, if it fails, an exception will be thrown.

**Throws**: `ValidationError` - ​​Validation failure throws exception

**Features**: Suitable for async/await scenarios, automatically throwing errors on failure

**Example**:
```javascript
// Asynchronous validation, automatically throwing an error if it fails
try {
  const data = await dsl.if(d => d.age < 18)
    .message('Underage users cannot register')
    .validateAsync({ age: 16 });
} catch (error) {
  console.log(error.message); // "Underage users cannot register"
  console.log(error.errors); // Detailed error information
}

// Express middleware
app.post('/register', async (req, res, next) => {
  try {
    await dsl.if(d => d.age < 18)
      .message('Underage users cannot register')
      .validateAsync(req.body);

    // Validation passed, continue processing...
    const user = await createUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

//Reuse validator
const ageValidator = dsl.if(d => d.age < 18).message('underage');

try {
  await ageValidator.validateAsync({ age: 16 });
} catch (error) {
  // Handle errors
}
```

---

### .assert(data, options)

Assertion method - synchronous validation, if it fails, an error will be thrown directly.
**Parameters**:
- `data` {*} - Data to be validated
- `options` {Object} - Authentication options (optional)

**Return**: `*` - ​​Return data after validation

**Throws**: `ValidationError` - ​​Throws `ValidationError` directly when validation fails

**Feature**: Synchronous version of assertion validation, suitable for fast failure scenarios

**Example**:
```javascript
// Assertion validation, if it fails, an error will be thrown directly
try {
  dsl.if(d => d.age < 18)
    .message('Underage users cannot register')
    .assert({ age: 16 });
} catch (error) {
  console.log(error.message); // "Underage users cannot register"
}

// Quick assertion in function
function registerUser(userData) {
  // Assertion validation
  dsl.if(d => d.age < 18)
    .message('Underage users cannot register')
    .assert(userData);

  dsl.if(d => !d.email)
    .message('Mailbox cannot be empty')
    .assert(userData);

  // Validation passed, continue processing...
  return createUser(userData);
}

// chained assertions
function validateAndCreate(data) {
  dsl.if(d => d.age < 18).message('underage').assert(data);
  dsl.if(d =>!d.email).message('Email required').assert(data);
  dsl.if(d =>!d.username).message('Username required').assert(data);

  return createUser(data);
}
```

---

### .check(data)

Quick check method - returns only boolean.
**Parameters**:
- `data` {*} - Data to be validated

**Return**: `boolean` - ​​Validation passed

**Features**: More concise than `.validate()`, suitable for scenarios where only true and false needs to be determined

**Example**:
```javascript
//Quick judgment
const isValid = dsl.if(d => d.age < 18)
  .message('underage')
  .check({ age: 16 });
// => false

// Assert scenario
if (!validator.check(userData)) {
  console.log('Validation failed');
}

// Loop validation
const users = [{ age: 16 }, { age: 20 }, { age: 17 }];
const adults = users.filter(u =>
  !dsl.if(d => d.age < 18).message('underage').check(u)
);
```

---

## Usage scenarios

### Scenario 1: User registration - quick validation

Use the `.validate()` method to quickly verify user registration data.

```javascript
//Create a reusable validator
const validators = {
  age: dsl.if(d => d.age < 18).message('Underage users cannot register'),
  email: dsl.if(d => d.userType === 'admin')
    .message('The administrator must provide an email address')
};

// Quick validation (one line of code)
function registerUser(userData) {
  //Verify age
  const ageResult = validators.age.validate(userData);
  if (!ageResult.valid) {
    return { error: ageResult.errors[0].message };
  }

  //Verify email
  const emailResult = validators.email.validate(userData);
  if (!emailResult.valid) {
    return { error: emailResult.errors[0].message };
  }

  return { success: true };
}

// use
registerUser({ username: 'test', age: 16 });
// => { error: 'Underage users cannot register' }
```

### Scenario 2: Batch data validation - using.check()

Use the `.check()` method to quickly filter qualified data.

```javascript
const users = [
  { name: 'Zhang San', age: 16 },
  { name: 'Li Si', age: 20 },
  { name: 'Wang Wu', age: 17 },
  { name: 'Zhao Liu', age: 25 }
];

//Create validator
const canRegister = dsl.if(d => d.age < 18)
  .message('underage');

// ✅ Use.check() to filter
const validUsers = users.filter(u => !canRegister.check(u));
// => [{ name: 'Li Si', age: 20 }, { name: 'Zhao Liu', age: 25 }]

// ✅ Use.check() statistics
const minorCount = users.filter(u => canRegister.check(u)).length;
console.log(`Underage users: ${minorCount}`);
// => "Underage users: 2 people"
```

### Scenario 3: Real-time validation of forms

```javascript
// Front-end form validation
const formValidators = {
  username: dsl.if(d => d.length < 3)
    .message('Username must be at least 3 characters'),

  password: dsl.if(d => d.length < 8)
    .message('Password must be at least 8 characters')
};

// Real-time validation (when inputting)
function onUsernameChange(value) {
  const isValid = formValidators.username.check(value);
  if (!isValid) {
    showError('Username must be at least 3 characters');
  } else {
    clearError();
  }
}

// Submit validation
function onSubmit(formData) {
  const usernameResult = formValidators.username.validate(formData.username);
  const passwordResult = formValidators.password.validate(formData.password);

  if (!usernameResult.valid) {
    return alert(usernameResult.errors[0].message);
  }

  if (!passwordResult.valid) {
    return alert(passwordResult.errors[0].message);
  }

  // Submit form...
}
```

### Scenario 4: User permission check

```javascript
// Permission validator
const hasPermission = dsl.if(d => d.role === 'admin')
  .or(d => d.role === 'moderator')
  .message('Insufficient permissions');

// middleware
function checkPermission(req, res, next) {
  if (!hasPermission.check(req.user)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
}

// routing
app.delete('/users/:id', checkPermission, deleteUser);
```

### Scenario 5: Validate different fields based on age and user type (contrast with traditional methods)

```javascript
// Traditional way (requires validate function)
const schema = dsl({
  username: 'string:3-32!',
  age: 'number:1-120!',
  userType: 'enum:admin|vip|user!',

  // Minors are prohibited from registering
  ageCheck: dsl.if((data) => data.age < 18)
    .message('Underage users cannot register'),

  //The administrator must have an email address
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!')
    .else('email'),

  // VIP users must have a mobile phone number
  phone: dsl.if((data) => data.userType === 'vip')
    .then('string:11!')
    .else(null),

  // Administrators and VIPs can set nicknames
  nickname: dsl.if((data) => data.userType === 'admin')
    .or((data) => data.userType === 'vip')
    .then('string:2-20')
    .else(null)
});

// test
validate(schema, {
  username: 'admin1',
  age: 25,
  userType: 'admin',
  email: 'admin@example.com'
});
// => { valid: true }
```

### Scenario 2: Product release

Validate different fields based on product type.

```javascript
const schema = dsl({
  title: 'string:1-100!',
  price: 'number:0-!',
  type: 'enum:physical|digital|service!',

  // Physical products require weight and dimensions
  weight: dsl.if((data) => data.type === 'physical')
    .then('number:0-!')
    .else(null),

  dimensions: dsl.if((data) => data.type === 'physical')
    .then('string!')
    .else(null),

  // Digital products require a download link
  downloadUrl: dsl.if((data) => data.type === 'digital')
    .then('url!')
    .else(null),

  // Service class requires service duration
  duration: dsl.if((data) => data.type === 'service')
    .then('number:1-!')
    .else(null)
});

// physical goods
validate(schema, {
  title: 'Laptop',
  price: 5999,
  type: 'physical',
  weight: 1.5,
  dimensions: '30x20x2cm'
});
// => { valid: true }

//Digital goods
validate(schema, {
  title: 'e-book',
  price: 29.9,
  type: 'digital',
  downloadUrl: 'https://example.com/download'
});
// => { valid: true }
```

### Scenario 3: Permission control

Control access based on user role and status.

```javascript
const schema = dsl({
  userId: 'string!',
  role: 'enum:admin|moderator|user!',
  status: 'enum:active|suspended|banned!',

  // Banned users are prohibited from operating
  accessCheck: dsl.if((data) => data.status === 'banned')
    .message('Your account has been banned'),

  // Pause user can only view
  operationType: dsl.if((data) => data.status === 'suspended')
    .then('enum:view!')
    .else('enum:view|edit|delete!'),

  // Administrators can access all resources
  resourceIds: dsl.if((data) => data.role === 'admin')
    .then('array<string>') // optional
    .else('array<string>!') // required
});
```

---

## best practices

### 1. Keep conditional functions simple

❌ **Not recommended**:
```javascript
dsl.if((data) => {
  const user = getUserFromDB(data.userId); // Synchronous database query
  return user.level > 5;
})
```

✅ **Recommended**:
```javascript
dsl.if((data) => data.userLevel > 5)
```

**Reason**: Conditional functions should only read data objects and should not have side effects or perform time-consuming operations.

---

### 2. Use meaningful field names

❌ **Not recommended**:
```javascript
const schema = dsl({
  field1: 'string!',
  check1: dsl.if((data) => data.field1 === 'admin')
    .message('Error')
});
```

✅ **Recommended**:
```javascript
const schema = dsl({
  userType: 'string!',
  ageVerification: dsl.if((data) => data.age < 18)
    .message('Underage users cannot register')
});
```

---

### 3. Fair use else

When conditions are not met and different validation rules are required, use `.else()`:

```javascript
dsl.if((data) => data.userType === 'admin')
  .then('email!')
  .else('email') // Different validation rules
```

When the conditions are not met, validation is not required and `.else()` is omitted:

```javascript
dsl.if((data) => data.userType === 'vip')
  .then('string:6!')
  // Do not write else, non-vip users will not be validated
```

---

### 4. Use the internal logic of the function first for multiple condition combinations

Simple conditions can be composed directly inside functions:

```javascript
// ✅ Recommended (concise)
dsl.if((data) => data.age >= 18 && data.userType === 'admin')
  .then('email!')

// ⚠️ Available but a little cumbersome
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .then('email!')
```

Use `.and()` / `.or()` when complex logic or maintainability is required:

```javascript
// ✅ Recommended (high readability)
dsl.if((data) => data.age >= 18)
  .and((data) => data.userType === 'admin')
  .and((data) => data.validated)
  .or((data) => data.isSuperUser)
  .then('email!')
```

---

### 5. Error messages are clear and unambiguous

❌ **Not recommended**:
```javascript
dsl.if((data) => data.age < 18)
  .message('Error')
```

✅ **Recommended**:
```javascript
dsl.if((data) => data.age < 18)
  .message('Underage users cannot register')
```

✅ **BETTER** (Supports multiple languages):
```javascript
dsl.if((data) => data.age < 18)
  .message('error.user.underage')
```

---

## FAQ

### Q1: When will the conditional function be executed?

**A**: Executed when calling `validate()`, not when defining Schema.

```javascript
const schema = dsl({
  email: dsl.if((data) => data.userType === 'admin')
    .then('email!') // ← will not be executed here
});

validate(schema, data); // ← conditional function is executed here
```

---

### Q2: What data can the conditional function access?

**A**: Can access the complete data object.

```javascript
const schema = dsl({
  age: 'number!',
  userType: 'string!',
  status: 'string!',
  email: dsl.if((data) => {
    // All fields can be accessed
    return data.age >= 18 && data.userType === 'admin' && data.status === 'active';
  }).then('email!')
});
```

---

### Q3: How to deal with conditional functions throwing errors?

**A**: If the conditional function throws an error, it will be captured and regarded as the condition is not met.

```javascript
const schema = dsl({
  obj: 'object!',
  result: dsl.if((data) => data.obj.nested.value > 10)
    .then('string!')
    .else(null)
});

// data.obj.nested does not exist, access will throw an error
validate(schema, { obj: {} });
// => { valid: true } If the condition is not met, execute else(null)
```

**Suggestion**: Do defensive checks in conditional functions:

```javascript
dsl.if((data) => data.obj?.nested?.value > 10)
  .then('string!')
```

---

### Q4: Can dsl.if() be nested?

**A**: Yes, nesting is supported.

```javascript
const schema = dsl({
  userType: 'string!',
  age: 'number!',
  email: dsl.if((data) => data.userType === 'admin')
    .then(
      dsl.if((data) => data.age >= 18)
        .then('email!')
        .else('email')
    )
    .else('email')
});
```

---

### Q5: How to use it with the existing dsl.match() method?

**A**: Can be mixed, choose the most suitable method.

```javascript
const schema = dsl({
  // Static value mapping - use match
  userType: 'enum:admin|vip|user!',
  level: dsl.match('userType', {
    admin: 'enum:high!',
    vip: 'enum:medium!',
    user: 'enum:low!'
  }),

  // Dynamic conditional judgment - use if
  email: dsl.if((data) => data.userType === 'admin' && data.level === 'high')
    .then('email!')
    .else('email')
});
```

**Selection Suggestions**:
- **Simple Value Mapping** → Use `dsl.match()`
- **Complex conditional logic** → Use `dsl.if()`

---

### Q6: Are non-object types (strings, arrays, numbers, etc.) supported?

**A**: Fully support! Any type of value can be validated directly.

```javascript
//Example 1: Directly verify the string
const stringSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:1-50');

validate(stringSchema, 'test@example.com'); // ✅ as email validation
validate(stringSchema, 'just a text'); // ✅ Validate as a normal string

//Example 2: Directly verify the array
const arraySchema = dsl.if((data) => Array.isArray(data) && data.length > 5)
  .message('Array can have up to 5 elements');

validate(arraySchema, [1, 2, 3]); // ✅ Passed
validate(arraySchema, [1, 2, 3, 4, 5, 6]); // ❌ failed

// Example 3: Verify numbers directly
const numberSchema = dsl.if((data) => typeof data === 'number' && data < 0)
  .message('Negative numbers are not allowed');

validate(numberSchema, 10); // ✅ Passed
validate(numberSchema, -5); // ❌ failed

//Example 4: Automatically identify the type (email or mobile phone number)
const contactSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:11!');

validate(contactSchema, 'user@example.com'); // ✅ as email validation
validate(contactSchema, '13800138000'); // ✅ Verify as mobile phone number
```

**Full Example**: See `test/unit/conditional-non-object.test.ts`

---

### Q7: How is the performance?

**A**: Excellent performance, conditional function execution is very fast.

- The conditional function is a pure JavaScript function and executes quickly
- Traverse the condition chain only once and stop when the first matching condition is found.
- Support cache optimization (WeakMap)

**Performance Tips**:
- Avoid performing time-consuming operations (database queries, API calls) in conditional functions
- Put the most common conditions first (if instead of elseIf)

---

## Change log

### v1.1.1 (2026-01-05)

- ✅ Added `ConditionalBuilder` category
- ✅ Added `dsl.if()` chain condition API
- ✅Supports and/or multiple condition combinations
- ✅ Support elseIf multiple branches
- ✅ message automatically throws errors (no need to throwError)
- ✅ else optional (if you don’t write it, it won’t be validated)
- ❌ Remove invalid old conditional method type definitions

---

## Related documents

- [Quick Start](./quick-start.md)
- [Validation Guide](./validation-guide.md)
- [API Reference](./api-reference.md)
- [Best Practice](./best-practices.md)

---

## Corresponding sample file

**Example entry**: [conditional-api.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/conditional-api.ts)
**Description**: Also overrides `.check()` / `.assert()` in failed predicate mode, as well as field name version `dsl.if(field, then, else)` and `dsl.match()` mapping.
