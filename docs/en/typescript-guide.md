# TypeScript usage guide

> **Version**: schema-dsl v2.0.8
> **Updated date**: 2026-06-10
> **Important**: v1.0.6 removed the global String type extension to avoid type pollution

---

## 📋 Table of Contents

1. [Quick Start](#1-quick-start)
2. [Chained calls in TypeScript](#2-chained-calls-in-typescript)
3. [Best Practices in Type Deduction](#3-best-practices-for-type-inference)
4. [Complete example](#4-complete-example)
5. [FAQ](#5-faq)

---

## 1. Quick start

### 1.1 Installation

```bash
npm install schema-dsl
```

### 1.2 Basic usage

```typescript
import { dsl, validate } from 'schema-dsl';

//define Schema
const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-100'
});

//Verify data
const result = validate(userSchema, {
  username: 'testuser',
  email: 'test@example.com',
  age: 25
});

if (result.valid) {
  console.log('Validation passed:', result.data);
} else {
  console.log('Validation failed:', result.errors);
}
```

---

## 2. Chained calls in TypeScript

### 2.1 Important changes (v1.0.6)

**v1.0.6 removed the global `interface String` extension** for the following reasons:
- ❌ Global type extension will pollute the native String type
- ❌ Causes type inference errors for native methods such as `trim()` and `toLowerCase()`
- ❌ Affects type safety of all projects using TypeScript

**Result**: Directly calling string chain in TypeScript will report a type error:

```typescript
// ❌ An error will be reported in TypeScript (v1.0.6+)
const schema = dsl({
  email: 'email!'.label('email') // Type error: Property 'label' does not exist on type 'string'
});

// ✅ Use dsl() package in TypeScript, and string chaining can be done directly in JavaScript
const schema = dsl({
  email: dsl('email!').label('mailbox')
});
```

### 2.2 Correct usage ⭐⭐⭐

**In TypeScript, the `dsl()` function must be used to wrap the string** in order to obtain type hints and chained calls:

```typescript
// ✅ Correct: Use dsl() wrapper (required for v1.0.6+)
const schema = dsl({
  email: dsl('email!').label('mailbox').pattern(/custom/)
});

// ✅ You can also define it first and then use it
const emailField = dsl('email!').label('mailbox');
const schema = dsl({ email: emailField });
```

**benefit**:
- ✅ Get complete type inference and IDE auto-tips
- ✅ Does not pollute the native String type (`trim()` correctly returns `string`)
- ✅ Better type safety and development experience

### 2.3 Working principle

```typescript
// dsl(string) returns DslBuilder instance
const emailBuilder = dsl('email!');
// ^? DslBuilder - complete type definition

// DslBuilder supports all chained methods and has complete type hints
emailBuilder.label('mailbox')
// ^? IDE automatically prompts all available methods
  .pattern(/^[a-z]+@[a-z]+\.[a-z]+$/)
  .error({ required: 'Email required' });

> ℹ️ The current type declaration gives priority to covering stable chain APIs, such as `label()`, `pattern()`, `error()`, `default()`.
> Some runtime extension methods are still available, but if the type declaration is not exposed, it is recommended to rewrite the above stable combination in TypeScript code first.
```

---

## 3. Best practices for type inference

### 3.1 Comparison of methods

| Way | JavaScript | TypeScript | type inference | Recommendation |
|------|-----------|-----------|---------|--------|
| direct string | ✅ Perfect | ⚠️ There may be no prompt | ❌ weak | ⭐⭐ |
| dsl() package | ✅ Perfect | ✅ Perfect | ✅ Strong | ⭐⭐⭐⭐⭐ |
| Define before using | ✅ Perfect | ✅ Perfect | ✅ Strong | ⭐⭐⭐⭐ |

### 3.2 Recommended writing method

#### ✅ Way 1: Use dsl() wrapper inline (most recommended)

```typescript
const schema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username'),
    .error({ pattern: 'Can only contain letters, numbers and underscores' }),

  email: dsl('email!')
    .label('email address')
    .error({ required: 'Email required' }),

  age: dsl('number:18-100')
    .label('age')
});
```

**advantage**:
- ✅ Complete type deduction
- ✅ IDE automatically prompts all methods
- ✅ The code is compact and the logic is clear

#### ✅ Method 2: Define fields first and then combine them (suitable for reuse)

```typescript
//Define reusable fields
const emailField = dsl('email!')
  .label('email address')
  .error({ required: 'Email required' });

const usernameField = dsl('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('username')
  .error({ pattern: 'Username can only contain letters, numbers and underscores' });

// Use in combination
const registrationSchema = dsl({
  email: emailField,
  username: usernameField,
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('password')
    .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' })
});

const loginSchema = dsl({
  email: emailField, //reuse
  password: dsl('string!').label('password')
});
```

**advantage**:
- ✅ Field definitions can be reused
- ✅ The code is more modular
- ✅ Suitable for large projects

#### ❌ Not recommended writing method

```typescript
// ❌ Directly use string chain calls in TypeScript
const schema = dsl({
  email: 'email!'.label('email') // There may be no type hint
});

// ❌ Mixed usage (inconsistent)
const schema = dsl({
  email: 'email!'.label('email'), // String expansion
  username: dsl('string!').label('username') // dsl package
});
```

---

## 4. Complete example

### 4.1 User registration form

```typescript
import { dsl, validateAsync, ValidationError } from 'schema-dsl';

//define Schema
const registrationSchema = dsl({
  profile: dsl({
    username: dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('username')
      .error({ pattern: 'Can only contain letters, numbers and underscores' }),

    email: dsl('email!')
      .label('email address')
      .error({ required: 'Email required' }),

    password: dsl('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('password')
      .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' }),

    age: dsl('number:18-100')
      .label('age')
  }),

  settings: dsl({
    emailNotify: dsl('boolean')
      .default(true)
      .label('Email Notification'),

    language: dsl('string')
      .default('zh-CN')
      .label('Language settings')
  })
});

// Asynchronous validation (recommended)
async function registerUser(data: any) {
  try {
    const validData = await validateAsync(registrationSchema, data);
    console.log('Registration successful:', validData);
    return validData;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('Validation failed:');
      error.errors.forEach(err => {
        console.log(`  - ${err.path}: ${err.message}`);
      });
      throw error;
    }
    throw error;
  }
}

// use
registerUser({
  profile: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'StrongPass123!',
    age: 25
  },
  settings: {
    emailNotify: true,
    language: 'en-US'
  }
});
```

### 4.2 API request validation

```typescript
import { ValidationError, dsl, validateAsync } from 'schema-dsl';
import express from 'express';

const app = express();
app.use(express.json());

//Define API Schema
const createUserSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username'),

  email: dsl('email!').label('mailbox'),

  role: dsl('string')
    .default('user')
    .label('role')
});

// Use middleware
app.post('/api/users', async (req, res) => {
  try {
    const validData = await validateAsync(createUserSchema, req.body);

    //Create user logic
    const user = await createUser(validData);

    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    } else {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});
```

### 4.3 Form field reuse

```typescript
import { dsl } from 'schema-dsl';

//Define common fields
const commonFields = {
  email: dsl('email!')
    .label('email address')
    .error({ required: 'Email required' }),

  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .error({ pattern: 'Username can only contain letters, numbers and underscores' }),

  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('password')
    .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' })
};

//Registration form
const registrationSchema = dsl({
  ...commonFields,
  confirmPassword: dsl('string!')
    .label('Confirm password')
});

//Login form
const loginSchema = dsl({
  email: commonFields.email,
  password: dsl('string!').label('password') // No strong password validation is required when logging in
});

// Password reset form
const resetPasswordSchema = dsl({
  email: commonFields.email,
  newPassword: commonFields.password,
  confirmPassword: dsl('string!').label('Confirm new password')
});
```

---

## 5. FAQ

### 5.1 Why are there no type hints for string chain calls in TypeScript?

**Cause**: TypeScript has restrictions on type inference for the global `String.prototype` extension.

**Solution**: Use `dsl()` to wrap the string:

```typescript
// ❌ May be silent
'email!'.label('email')

// ✅ Full Tips
dsl('email!').label('mailbox')
```

### 5.2 Do JavaScript users need to change the way they write?

JavaScript users can directly call string chains by default after importing `schema-dsl`, which is compatible with v1.1.x usage habits:

```javascript
const schema = dsl({
  email: 'email!'.label('mailbox')
});
```

If you don’t want to keep the `String.prototype` extension, you can uninstall it actively and then use the `dsl()` package:

```javascript
const { dsl, uninstallStringExtensions } = require('schema-dsl');
uninstallStringExtensions();

const schema = dsl({
  email: dsl('email!').label('mailbox')
});
```

### 5.3 How to use it in strict mode?

Enabling strict mode in `tsconfig.json` is no problem either:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

Just use the `dsl()` package:

```typescript
const schema = dsl({
  email: dsl('email!').label('mailbox') // ✅ Normal in strict mode
});
```

### 5.4 How to obtain the validated data type?

Use generic parameters:

```typescript
interface User {
  username: string;
  email: string;
  age?: number;
}

// Synchronous validation
const result = validate<User>(userSchema, data);
if (result.valid) {
  const user: User = result.data; // ✅ Type safety
}

// Asynchronous validation
const validUser = await validateAsync<User>(userSchema, data);
// ^?User - complete type deduction
```

### 5.5 How to handle validation errors for nested objects?

```typescript
try {
  await validateAsync(schema, data);
} catch (error) {
  if (error instanceof ValidationError) {
    // Method 1: Iterate through all errors
    error.errors.forEach(err => {
      console.log(`${err.path}: ${err.message}`);
      // Output: profile.username: username must be at least 3 characters
    });

    // Method 2: Get specific field errors
    const usernameError = error.getFieldError('profile.username');
    if (usernameError) {
      console.log(usernameError.message);
    }

    // Method 3: Get all field error mappings
    const fieldErrors = error.getFieldErrors();
    // { 'profile.username': {...}, 'profile.email': {...} }
  }
}
```

---

## 6. Advanced techniques

### 6.1 Additional business rules

```typescript
const schema = dsl({
  username: dsl('string:3-32!').label('username')
});

const result = await validateAsync(schema, data);
if (result.username === 'admin') {
  throw new Error('Username already exists');
}
```

The advantage of this writing method is that schema-dsl is still responsible for structure validation, and rules such as business uniqueness and database duplication checking continue to remain in the TypeScript business layer, avoiding the need to stuff external dependencies into field declarations.

### 6.2 Condition validation

```typescript
const schema = dsl({
  userType: dsl('string!').label('user type'),

  // Use dsl.match() to dynamically verify based on the userType field
  companyName: dsl.match('userType', {
    'company': 'string!', // Required for enterprise users
    '_default': 'string' // Optional for individual users
  })
});
```

### 6.3 Schema reuse and extension

```typescript
import { SchemaUtils } from 'schema-dsl';

//Basic user Schema
const baseUserSchema = dsl({
  username: dsl('string:3-32!').label('username'),
  email: dsl('email!').label('mailbox')
});

//Expand to administrator Schema
const adminSchema = SchemaUtils.extend(baseUserSchema, {
  role: dsl('string!').default('admin').label('role'),
  permissions: dsl('array<string>').label('permission list')
});

// Select only some fields
const publicUserSchema = SchemaUtils.pick(
  baseUserSchema,
  ['username']
);
```

---

## 7. Performance optimization

### 7.1 Reuse Schema and default cache

```typescript
const schema = dsl({
  email: dsl('email!').label('mailbox')
});

// Multiple verifications will reuse the default Validator's compilation cache.
await validateAsync(schema, data1);
await validateAsync(schema, data2);
await validateAsync(schema, data3);
```

### 7.2 Cache configuration

```typescript
import { dsl } from 'schema-dsl';

//Configure cache size
dsl.config({
  cache: {
    maxSize: 5000, //Number of cache entries
    ttl: 60000 // Expiration time (milliseconds)
  }
});
```

---

## 8. Summary of best practices

1. ✅ **Always use `dsl()` to wrap strings in TypeScript**
2. ✅ **Use `validateAsync` for asynchronous validation**
3. ✅ **Add generic type parameters for validation results**
4. ✅ **Reuse common field definitions**
5. ✅ **Use `ValidationError` type guard to handle errors**
6. ✅ **Provide user-friendly error messages**
7. ✅ **Reuse commonly used Schema objects to make the default cache hit**

---

## 9. Related resources

- [API Reference Document](./api-reference.md)
- [Complete Guide to DSL Syntax](./dsl-syntax.md)
- [Validation Rules Reference](./validation-guide.md)
- [Error Handling Guide](./error-handling.md)
- [GitHub repository](https://github.com/vextjs/schema-dsl)

---

## Corresponding sample file

**Example entry**: [typescript-guide.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/typescript-guide.ts)
**Description**: Shows the recommended `dsl()` package writing method, `validate<T>()` / `validateAsync<T>()`, and `ValidationError` field error reading method recommended under TypeScript.

---

**Updated date**: 2026-06-10
**Document version**: v2.0.8
