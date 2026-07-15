# TypeScript usage guide

**Important**: public TypeScript examples prefer `schema-dsl/pure` + `s` so that schema authoring has no automatic String prototype side effect.

Read this early when choosing between pure DSL strings, DSL seed builders, namespace factories, and optional String extension ergonomics. It explains what TypeScript can infer, what remains runtime-only, and where editor hints are intentionally limited.

## 1. Quick start

### 1.1 Installation

```bash
npm install schema-dsl
```

### 1.2 Basic usage

```typescript
import { s, validate } from 'schema-dsl/pure';

//define Schema
const userSchema = s({
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

### 2.1 Default no-global String types

By default, TypeScript does not receive global `interface String` chain declarations. This keeps native `String` methods such as `trim()` and `toLowerCase()` stable for projects that import `schema-dsl/pure`.

Direct string chaining therefore reports a type error unless you explicitly opt in to `schema-dsl/string-types`:

```typescript
// ❌ TypeScript error by default
const defaultErrorSchema = s({
  email: 'email!'.label('email') // Type error: Property 'label' does not exist on type 'string'
});

// ✅ Default TypeScript path without global String types: use a factory
const defaultBuilderSchema = s({
  email: s.email().label('mailbox').require()
});
```

### 2.2 Recommended authoring entries

Choose one of the three recommended entries according to the authoring goal:

```typescript
import { s } from 'schema-dsl/pure';

// ✅ Pure DSL: shortest configuration, limited editor hints inside the literal
const compactSchema = s({
  email: 'email!',
  username: 'string:3-32!'
});

// ✅ Explicit DSL seed: compact DSL plus builder hints
const emailField = s('email!').label('mailbox').pattern(/custom/);
const reusableSchema = s({ email: emailField });

// ✅ Factory form: strongest TypeScript method discovery
const accountEmail = s.email().label('mailbox').pattern(/custom/).require();
const factorySchema = s({ email: accountEmail });
```

The compatibility `dsl` export remains available, but new public examples use `s` as the short namespace. When imported from `schema-dsl/pure`, `s` supports pure DSL strings, `s('...')`, and `s.xxx()` without installing String extensions.

If the project uses `transformSchemaDsl()` or `schemaDslEsbuildPlugin()` to compile static String chains into builder calls, add the opt-in type entry:

```typescript
import { s } from 'schema-dsl/pure';
import 'schema-dsl/string-types';

const schema = s({
  role: 'admin|user|guest'.label('Role'),
  email: 'email!'.label('Email').require()
});
```

Direct String chains are intentionally not the default path. Use them when the compact source form matters and your project explicitly installs the compile-time or runtime String extension support.

**benefit**:
- ✅ Pure DSL strings remain the shortest schema configuration.
- ✅ `s('...')` keeps DSL syntax while adding complete builder-method hints after the seed.
- ✅ `s.email()` / `s.string()` / `s.number()` give the strongest factory and method discovery.
- ✅ The `schema-dsl/pure` entry does not install String extensions.
- ✅ The transform + `schema-dsl/string-types` path gives String-chain hints only when explicitly requested.
- ✅ Known DSL literals still get lightweight value inference through `InferSchema` / `InferDslString`.

### 2.3 Working principle

```typescript
// s factory and s(string) both return a builder typed with the public IDslBuilder chain contract
const emailBuilder = s.email().require();
const sameBuilderShape = s('email!').label('mailbox');
// ^? IDslBuilder - complete public chain type

// DslBuilder supports all chained methods and has complete type hints
emailBuilder.label('mailbox')
// ^? IDE automatically prompts all available methods
  .pattern(/^[a-z]+@[a-z]+\.[a-z]+$/)
  .error({ required: 'Email required' });
```

`s('string:3-32!')` should not be described as a full type-level parser for the DSL grammar. It gives full type hints for the returned builder methods, while the string literal itself is only inferred at a coarse schema-value level by helper types such as `InferDslString<'string:3-32!'>` -> `string`. Length ranges, regular expressions, custom validators, and localized messages are runtime schema constraints, not TypeScript value refinements.

---

## 3. Best practices for type inference

### 3.1 Comparison of methods

| Way | JavaScript | TypeScript | type inference | Recommendation |
|------|-----------|-----------|---------|--------|
| Pure DSL in `s({})` | ✅ Works | ✅ Stable | ✅ Lightweight DSL literal inference | ⭐⭐⭐⭐⭐ |
| `s('...')` DSL seed | ✅ Works | ✅ Builder method hints | ✅ Builder hints plus lightweight DSL literal inference | ⭐⭐⭐⭐⭐ |
| `s.xxx()` namespace factories | ✅ Works | ✅ Builder method hints | ✅ Strong builder hints without DSL literal parsing | ⭐⭐⭐⭐⭐ |
| direct string without `string-types` | ✅ Runtime works only after String runtime install | ❌ Type error | ❌ Weak | ⭐ |
| direct string with `schema-dsl/string-types` | ✅ Works after explicit runtime/transform support | ✅ Opt-in String-chain hints | ✅ Strong authoring hints; lightweight DSL literal inference | ⭐⭐⭐ |
| `dsl('...')` compatibility alias | ✅ Works | ✅ Builder method hints | ✅ Same builder surface as `s('...')` | ⭐⭐⭐ |

### 3.2 Recommended writing method

#### ✅ Way 1: Pure DSL strings for the shortest configuration

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: 'username:medium!',
  email: 'email!',
  age: 'number:18-100'
});
```

**advantage**:
- ✅ Shortest public authoring form
- ✅ No String extension installation
- ✅ Best for fields that only need built-in DSL constraints

#### ✅ Way 2: Define DSL seeds first and then combine them

```typescript
import { s } from 'schema-dsl/pure';

//Define reusable fields
const emailField = s('email!')
  .label('email address')
  .error({ required: 'Email required' });

const usernameField = s('string:3-32!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('username')
  .error({ pattern: 'Username can only contain letters, numbers and underscores' });

// Use in combination
const registrationSchema = s({
  email: emailField,
  username: usernameField,
  password: s('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('password')
    .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' })
});

const loginSchema = s({
  email: emailField, //reuse
  password: s('string!').label('password')
});
```

**advantage**:
- ✅ Field definitions can be reused
- ✅ The code is more modular
- ✅ Suitable for large projects

#### ✅ Way 3: Use `s` namespace factories when discovery matters most

```typescript
import { s } from 'schema-dsl/pure';

const schema = s({
  username: s.string().min(3).max(32).require()
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username'),

  email: s.email().label('email address').require(),
  age: s.number().min(18).max(100).label('age')
});
```

**advantage**:
- ✅ Complete builder-method hints
- ✅ IDE automatically prompts all factory and builder methods
- ✅ Best for users who prefer discoverable APIs over compact DSL literals

#### ❌ Avoid unconfigured or inconsistent writing styles

```typescript
// ❌ Direct string chains without schema-dsl/string-types
const schema = s({
  email: 'email!'.label('email') // There may be no type hint
});

// ❌ Direct String chains without an explicit compat/register-string runtime opt-in
// Root and pure imports are both side-effect-free in v3.
```

---

## 4. Complete example

### 4.1 User registration form

```typescript
import { s, validateAsync, ValidationError } from 'schema-dsl/pure';

//define Schema
const registrationSchema = s({
  profile: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('username')
      .error({ pattern: 'Can only contain letters, numbers and underscores' }),

    email: s('email!')
      .label('email address')
      .error({ required: 'Email required' }),

    password: s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('password')
      .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' }),

    age: s('number:18-100')
      .label('age')
  }),

  settings: s({
    emailNotify: s('boolean')
      .default(true)
      .label('Email Notification'),

    language: s('string')
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
import { ValidationError, s, validateAsync } from 'schema-dsl/pure';
import express from 'express';

const app = express();
app.use(express.json());

//Define API Schema
const createUserSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username'),

  email: s('email!').label('mailbox'),

  role: s('string')
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
import { s } from 'schema-dsl/pure';

//Define common fields
const commonFields = {
  email: s('email!')
    .label('email address')
    .error({ required: 'Email required' }),

  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('username')
    .error({ pattern: 'Username can only contain letters, numbers and underscores' }),

  password: s('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('password')
    .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' })
};

//Registration form
const registrationSchema = s({
  ...commonFields,
  confirmPassword: s('string!')
    .label('Confirm password')
});

//Login form
const loginSchema = s({
  email: commonFields.email,
  password: s('string!').label('password') // No strong password validation is required when logging in
});

// Password reset form
const resetPasswordSchema = s({
  email: commonFields.email,
  newPassword: commonFields.password,
  confirmPassword: s('string!').label('Confirm new password')
});
```

---

## 5. FAQ

### 5.1 Why are there no type hints for string chain calls in TypeScript?

**Cause**: TypeScript has restrictions on type inference for the global `String.prototype` extension.

**Solution**: Use `s('...')` to wrap the string:

```typescript
// ❌ May be silent
'email!'.label('email')

// ✅ Full Tips
s('email!').label('mailbox')
```

### 5.2 Do JavaScript users need to change the way they write?

Existing JavaScript users that need direct String chains must add `schema-dsl/compat` or `schema-dsl/register-string`. Root and pure imports are both side-effect-free:

```javascript
import { s } from 'schema-dsl/pure';

const schema = s({
  email: s('email!').label('mailbox'),
  age: 'number:18-100'
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

Just use `s('...')`:

```typescript
const schema = s({
  email: s('email!').label('mailbox') // ✅ Normal in strict mode
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
const schema = s({
  username: s('string:3-32!').label('username')
});

const result = await validateAsync(schema, data);
if (result.username === 'admin') {
  throw new Error('Username already exists');
}
```

The advantage of this writing method is that schema-dsl is still responsible for structure validation, and rules such as business uniqueness and database duplication checking continue to remain in the TypeScript business layer, avoiding the need to stuff external dependencies into field declarations.

### 6.2 Condition validation

```typescript
const schema = s({
  userType: s('string!').label('user type'),

  // Use s.match() to dynamically verify based on the userType field
  companyName: s.match('userType', {
    'company': 'string!', // Required for enterprise users
    '_default': 'string' // Optional for individual users
  })
});
```

### 6.3 Schema reuse and extension

```typescript
import { SchemaUtils, s } from 'schema-dsl/pure';

//Basic user Schema
const baseUserSchema = s({
  username: s('string:3-32!').label('username'),
  email: s('email!').label('mailbox')
});

//Expand to administrator Schema
const adminSchema = SchemaUtils.extend(baseUserSchema, {
  role: s('string!').default('admin').label('role'),
  permissions: s('array<string>').label('permission list')
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
const schema = s({
  email: s('email!').label('mailbox')
});

// Multiple verifications will reuse the default Validator's compilation cache.
await validateAsync(schema, data1);
await validateAsync(schema, data2);
await validateAsync(schema, data3);
```

### 7.2 Cache configuration

```typescript
import { s } from 'schema-dsl/pure';

//Configure cache size
s.config({
  cache: {
    maxSize: 5000, //Number of cache entries
    ttl: 60000 // Expiration time (milliseconds)
  }
});
```

---

## 8. Summary of best practices

1. ✅ **Choose the authoring entry by goal: pure DSL in `s({})`, `s('...')`, or `s.xxx()`**
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
**Description**: Shows the three recommended TypeScript authoring entries, `validate<T>()` / `validateAsync<T>()`, and `ValidationError` field error reading.

---
