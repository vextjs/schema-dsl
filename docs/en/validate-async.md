# validateAsync - asynchronous validation

> Automatically throw an error if validation fails

---

## quick start

```javascript
import { s, validateAsync } from 'schema-dsl/pure';

const userSchema = s({
  name: 'string!',
  email: 'email!',
  age: 'integer:18-120'
});

try {
  const data = await validateAsync(userSchema, {
    name: 'John',
    email: 'john@example.com',
    age: 30
  });

  console.log('Validation successful:', data);
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

<a id="basic-example"></a>

## Basic usage

```javascript
try {
  await validateAsync(userSchema, {
    name: '',
    email: 'invalid'
  });
} catch (error) {
  console.log(error instanceof ValidationError); // true
  console.log(error.getFieldErrors());
  // { email: 'Email format error' }
  // `string!` only means that the field is required; if you want to limit empty strings, you need to superimpose length constraints.
}
```

---

## ValidationError

### property

```javascript
class ValidationError extends Error {
  name: 'ValidationError' // Error name
  message: string // Friendly error message
  errors: Array<Object> //Formatted error item list (path/message/keyword/...)
  data: any // original input data
  statusCode: 400 // HTTP status code
}
```

### method

#### 1. `toJSON()` - ​​Convert to JSON (for API responses)

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const json = error.toJSON();
  // {
  //   error: 'ValidationError',
  // message: 'Validation failed: name: field is required',
  //   statusCode: 400,
  //   details: [
  // { field: 'name', message: 'Field required', keyword: 'required', params: {...} }
  //   ]
  // }
}
```

#### 2. `getFieldError(field)` - ​​Get the error of the specified field

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const nameError = error.getFieldError('name');
  console.log(nameError.message); // 'Field required'
}
```

#### 3. `getFieldErrors()` - ​​Get error mapping for all fields

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  const fieldErrors = error.getFieldErrors();
  // { name: 'Field required', email: 'Email format error' }
}
```

#### 4. `hasFieldError(field)` - ​​Check the field for errors

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  if (error.hasFieldError('email')) {
    console.log('Email format error');
  }
}
```

#### 5. `getErrorCount()` - ​​Get the number of errors

```javascript
try {
  await validateAsync(schema, data);
} catch (error) {
  console.log(`${error.getErrorCount()} errors found`);
}
```

---

## Express integration

### Basic integration

```javascript
import express from 'express';
import { s, validateAsync, ValidationError } from 'schema-dsl/pure';

const app = express();
app.use(express.json());

//define Schema
const userSchema = s({
  name: 'string:1-50!',
  email: 'email!',
  age: 'integer:18-120'
});

//Route processing
app.post('/users', async (req, res, next) => {
  try {
    //Verify request body
    const validData = await validateAsync(userSchema, req.body);

    //Save to database
    const user = await db.users.insert(validData);

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error); // Passed to error handling middleware
  }
});

//Global error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // other errors
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000);
```

### Complete CRUD example

```javascript
import { SchemaUtils } from 'schema-dsl/pure';

// Define complete Schema
const fullUserSchema = s({
  id: 'objectId!',
  name: 'string:1-50!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:18-120',
  createdAt: 'date',
  updatedAt: 'date'
});

// POST /users - create users (excluding system fields)
const createSchema = SchemaUtils
  .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

app.post('/users', async (req, res, next) => {
  try {
    const data = await validateAsync(createSchema, req.body);
    const user = await db.users.insert({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// GET /users/:id - Query users (the business layer explicitly removes sensitive fields)
const publicSchema = SchemaUtils
  .pick(fullUserSchema, ['id', 'name', 'email', 'age', 'createdAt', 'updatedAt']);

app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await db.users.findById(req.params.id);
    const { password, ...publicUser } = user;
    import { validate } from 'schema-dsl/pure';
    const result = validate(publicSchema, publicUser);
    res.json(result.data);
  } catch (error) {
    next(error);
  }
});

// PATCH /users/:id - update user (partial authentication)
const updateSchema = SchemaUtils
  .pick(fullUserSchema, ['name', 'age'])
  .partial();

app.patch('/users/:id', async (req, res, next) => {
  try {
    const data = await validateAsync(updateSchema, req.body);
    const user = await db.users.updateById(req.params.id, {
      ...data,
      updatedAt: new Date()
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// PUT /users/:id - replace user (excludes system fields)
const replaceSchema = SchemaUtils
  .omit(fullUserSchema, ['id', 'createdAt', 'updatedAt']);

app.put('/users/:id', async (req, res, next) => {
  try {
    const data = await validateAsync(replaceSchema, req.body);
    const user = await db.users.replaceById(req.params.id, {
      ...data,
      updatedAt: new Date()
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
});
```

> ⚠️ `SchemaUtils` is currently only responsible for generating derived schemas (such as `pick()` / `omit()` / `partial()` / `extend()`), and will not automatically delete extra fields on the runtime object. When returning a public response, please explicitly project the data at the business layer first, and then use `validate()` to verify the projection result.

---

## Error handling

### Custom error format

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    // Custom error response format
    return res.status(422).json({
      code: 'VALIDATION_FAILED',
      message: 'Data validation failed',
      timestamp: new Date().toISOString(),
      fields: error.getFieldErrors()
    });
  }

  next(error);
});
```

### Classification error handling

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    const fieldErrors = error.getFieldErrors();

    // Email format error
    if (error.hasFieldError('email')) {
      return res.status(400).json({
        code: 'INVALID_EMAIL',
        message: 'Email format error',
        field: 'email'
      });
    }

    // Other validation errors
    return res.status(400).json(error.toJSON());
  }

  next(error);
});
```

### logging

```javascript
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    // Record validation error log
    logger.warn('Validation failed', {
      url: req.url,
      method: req.method,
      errors: error.errors,
      data: error.data
    });

    return res.status(error.statusCode).json(error.toJSON());
  }

  next(error);
});
```

---

## Complete example

### User Registration API

```javascript
import express from 'express';
import bcrypt from 'bcrypt';
import { s, validateAsync, ValidationError, SchemaUtils } from 'schema-dsl/pure';

const app = express();
app.use(express.json());

//Basic user Schema
const baseUserSchema = s({
  id: 'objectId!',
  username: 'string:3-32!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:18-120',
  createdAt: 'date',
  updatedAt: 'date'
});

// Register Schema (exclude system fields)
const registerSchema = SchemaUtils
  .omit(baseUserSchema, ['id', 'createdAt', 'updatedAt']);

//Registration interface
app.post('/register', async (req, res, next) => {
  try {
    // 1. Verify request data
    const data = await validateAsync(registerSchema, req.body);

    // 2. Check if the user exists
    const existingUser = await db.users.findOne({ email: data.email });
    if (existingUser) {
      return res.status(409).json({
        code: 'USER_EXISTS',
        message: 'Email has been registered'
      });
    }

    // 3. Encrypt password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 4. Save user
    const user = await db.users.insert({
      ...data,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 5. Return public information (explicit projection first, then verify according to the public Schema)
    const publicSchema = SchemaUtils
      .pick(baseUserSchema, ['id', 'username', 'email', 'age', 'createdAt', 'updatedAt']);

    const { password, ...publicUser } = user;

    import { validate } from 'schema-dsl/pure';
    const result = validate(publicSchema, publicUser);

    res.status(201).json({
      success: true,
      user: result.data
    });

  } catch (error) {
    next(error);
  }
});

//Global error handling
app.use((error, req, res, next) => {
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

---

## API reference

### validateAsync(schema, data, options?)
**Parameters**:
- `schema` - ​​JSON Schema or DslBuilder instance
- `data` - ​​Data to be validated
- `options` - ​​Authentication options (optional)
  - `locale` - ​​Language settings (such as 'zh-CN', 'en-US')
  - `format` - ​​Whether there is a formatting error (default true)

**return value**:
- Validation passed: return processed data
- Authentication failed: throw `ValidationError`

**Example**:
```javascript
//Basic usage
const data = await validateAsync(schema, inputData);

//Specify language
const data = await validateAsync(schema, inputData, { locale: 'zh-CN' });

// Not formatting error
const data = await validateAsync(schema, inputData, { format: false });
```

### ValidationError class

**Constructor**:
```javascript
new ValidationError(errors, data)
```

**property**:
- `name: 'ValidationError'`
- `message: string` - ​​Friendly error message
- `errors: Array<Object>` - ​​Formatted list of error items (such as `path`, `message`, `keyword`, `params`)
- `data: any` - ​​raw input data
- `statusCode: 400` - ​​HTTP status code

**method**:
- `toJSON()` - ​​Convert to JSON format
- `getFieldError(field)` - ​​Gets the error for the specified field
- `getFieldErrors()` - ​​Get error mapping for all fields
- `hasFieldError(field)` - ​​Check the field for errors
- `getErrorCount()` - ​​Get the number of errors

---

## Related documents

- [SchemaUtils chain call](schema-utils-chaining.md) - Schema reuse simplified method
- [validate.md](validate.md) - Traditional synchronous validation method
- [error-handling.md](error-handling.md) - Error handling guide
- [validate-async complete example](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate-async.ts) - Top-level `validateAsync()`, `ValidationError` and async `.custom()` examples

---

## Corresponding sample file

**Example entry**: [validate-async.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/validate-async.ts)
**Description**: Covers the success path of `validateAsync()`, `ValidationError` capture, Promise-returning `.custom()`, and the optional method of business layer asynchronous checking after structure validation.

---

**Version**: v2.0.9
**Updated date**: 2026-06-10
**Author**: schema-dsl Team
