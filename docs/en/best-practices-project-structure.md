# schema-dsl project best practice examples

Use this page when you are ready to organize schema-dsl in an application rather than in one demo file. It shows where to place shared schemas, how route handlers reuse them, and how to avoid recreating schemas for every request.

## Recommended project structure

```text
your-project/
├── schemas/ # ✅ All schema definitions (loaded when the project starts)
│ ├── index.js # Unified export
│ ├── user.js # User related schema
│ ├── order.js # Order related schema
│ └── product.js # Product related schema
├── routes/
│ ├── user.js # User routing (using schemas/user.js)
│ ├── order.js # Order routing (using schemas/order.js)
│ └── product.js # Product routing (using schemas/product.js)
└── app.js # Main application entrance
```

---

## Complete sample code

### 1. Define Schema (schemas/user.js)

```javascript
import { s } from 'schema-dsl/pure';

/**
 * All schemas related to the user
 *
 * ✅ Convert once when the project starts and reuse directly later.
 * ✅ Avoid repeated conversion for each request
 */
const userSchemas = {
  //Register schema
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('username')
      .messages({
        'string.pattern': 'Username can only contain letters, numbers and underscores',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username can be up to 32 characters'
      }),

    email: s('email!')
      .label('mailbox')
      .messages({
        'string.email': 'Please enter a valid email address'
      }),

    password: s('string!').password('strong')
      .label('password')
      .messages({
        'string.password': 'Password must contain uppercase and lowercase letters, numbers and special characters'
      }),

    age: 'number:18-120',

    phone: s('phone')
      .label('Mobile phone number')
      .messages({
        'string.phone': 'Please enter a valid mobile phone number'
      })
  }),

  // Login schema
  login: s({
    username: 'string!',
    password: 'string!'
  }),

  //Update profile schema
  updateProfile: s({
    nickname: 'string:2-20',
    avatar: 'url',
    bio: 'string:0-500',
    birthday: 'date',
    gender: 'male|female|other'
  }),

  //Change password schema
  changePassword: s({
    oldPassword: 'string!',
    newPassword: s('string!').password('strong')
  })
};

export default userSchemas;
```

### 2. Define Schema (schemas/order.js)

```javascript
import { s } from 'schema-dsl/pure';

const orderSchemas = {
  //Create order
  create: s({
    items: 'array:1-100<object>!',
    shippingAddress: s({
      name: 'string:2-50!',
      phone: 'phone!',
      address: 'string:10-200!',
      zipCode: 'string:6'
    }),
    paymentMethod: 'alipay|wechat|card!',
    couponCode: 'string:6-20'
  }),

  //Update order status
  updateStatus: s({
    status: 'pending|paid|shipped|completed|cancelled!',
    note: 'string:0-500'
  })
};

export default orderSchemas;
```

### 3. Unified export (schemas/index.js)

```javascript
/**
 * Export all schemas uniformly
 *
 * How to use:
 *   import schemas from './schemas/index.js';
 *   const result = validate(schemas.user.register, data);
 */
import userSchemas from './user.js';
import orderSchemas from './order.js';
import productSchemas from './product.js';

export default {
  user: userSchemas,
  order: orderSchemas,
  product: productSchemas
};
```

### 4. Use in routing (routes/user.js)

```javascript
import express from 'express';
const router = express.Router();
import { validate } from 'schema-dsl/pure';
import userSchemas from '../schemas/user';

/**
 * User registration
 *
 * ✅ Use predefined schema, no more repeated conversions
 */
router.post('/register', async (req, res) => {
  // ✅Use directly, best performance
  const result = validate(userSchemas.register, req.body);

  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Data validation failed',
      errors: result.errors
    });
  }

  // Handle registration logic
  try {
    const user = await createUser(result.data);
    res.status(201).json({
      code: 'SUCCESS',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
});

/**
 * User login
 */
router.post('/login', async (req, res) => {
  // ✅Use directly
  const result = validate(userSchemas.login, req.body);

  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      errors: result.errors
    });
  }

  //Process login logic
  // ...
});

/**
 * Update profile
 */
router.put('/profile', authenticate, async (req, res) => {
  // ✅Use directly
  const result = validate(userSchemas.updateProfile, req.body);

  if (!result.valid) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      errors: result.errors
    });
  }

  // Handle update logic
  // ...
});

export default router;
```

### 5. Main application entrance (app.js)

```javascript
import express from 'express';
import userRoutes from './routes/user.js';
import orderRoutes from './routes/order.js';
import productRoutes from './routes/product.js';

const app = express();

// ✅ Load all schemas on app startup (convert only once)
import schemas from './schemas';
console.log('✅ Schemas loaded:', Object.keys(schemas));

// middleware
app.use(express.json());

// routing
app.use('/api/user', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/product', productRoutes);

// Start service
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log('✅ All schemas are loaded and ready to validate');
});

export default app;
```

---

## Performance comparison

### ❌ Not recommended: convert every request

```javascript
// ❌ Error example
router.post('/register', (req, res) => {
  const result = validate(
    { // ❌ Convert on every request
      username: 'string:3-32!',
      email: 'email!',
      password: s('string!').password('strong')
    },
    req.body
  );
  // ...
});
```

**Performance Issues**:
- ❌ Perform DSL → JSON Schema conversion on every request
- ❌ 1000 requests = 1000 conversions
- ❌ Performance loss is obvious when concurrency is high
- ❌ If the request changes the schema shape, cache hits become unlikely and memory/CPU pressure rises

### ✅ Recommended: Convert when project starts

```javascript
// ✅ Correct example
import userSchemas from '../schemas/user.js'; // ✅ Load at startup

router.post('/register', (req, res) => {
  const result = validate(
    userSchemas.register, // ✅ Use directly
    req.body
  );
  // ...
});
```

**Performance Advantages**:
- ✅ 1 conversion on launch
- ✅ 1000 requests = 0 conversions
- ✅ Best performance during high concurrency

### Cache and memory boundary

Stable request-time DSL is normally a performance concern rather than a memory leak. When the schema structure is the same, the validator can reuse the compile cache even if a handler creates a fresh object. It is still slower than converting at startup because the DSL object must be normalized again.

The memory risk appears when a long-running service accepts or constructs an unbounded number of unique schema shapes:

```javascript
// ❌ Avoid: request-specific field names create a new schema shape every time
router.post('/dynamic', (req, res) => {
  const schema = s({ [`field_${req.id}`]: 'string!' });
  const result = validate(schema, req.body);
  // ...
});
```

The cache works for repeated structures; it is not a substitute for bounding dynamic schema cardinality.

Also avoid creating `new Validator()` inside normal request handlers. It is not usually a retained-memory leak when the instance is not stored, but it discards the AJV instance and compilation cache for every request.

---

## Summary of usage scenarios

| scene | Recommended method | code example | reason |
|------|---------|---------|------|
| **Production API** | ✅ Configure when project starts | `import schemas from './schemas/index.js'` | Avoid converting every request |
| **High concurrency service** | ✅ Configure when project starts | Same as above | 3-5% performance loss will be magnified |
| **Microservices** | ✅ Configure when project starts | Same as above | Ensure stable response time |
| **Single shot script** | ✅ Use DSL objects directly (supported by the current version of convenience functions) | `validate({ email: 'email!' }, data)` | Only executed once, performance impact is negligible |
| **Prototype Development** | ✅ Use DSL objects directly (supported by the current version of convenience functions) | Same as above | Iterate quickly without worrying about performance |
| **Test code** | ✅ Use DSL objects directly (supported by the current version of convenience functions) | Same as above | Simple, clear and easy to maintain |

---

## Common mistakes

### ❌ Mistake 1: Defining schema in routing file

```javascript
// ❌ Not recommended
router.post('/register', (req, res) => {
  const schema = s({ // ❌ Created on every request
    username: 'string:3-32!',
    email: 'email!'
  });

  const result = validate(schema, req.body);
  // ...
});
```

**Problem**: Creating a new schema object for each request is a waste of performance.

### ❌ Mistake 2: Defining schema inside a function

```javascript
// ❌ Not recommended
function validateUser(data) {
  const schema = s({ // ❌ Created with each call
    username: 'string:3-32!',
    email: 'email!'
  });

  return validate(schema, data);
}
```

**Problem**: Each time the function is called, a new schema is created, which should be mentioned outside the function.

### ✅ Correct: defined at the top of the module

```javascript
// ✅ Recommendation: Create once when the module is loaded
const userSchema = s({
  username: 'string:3-32!',
  email: 'email!'
});

router.post('/register', (req, res) => {
  const result = validate(userSchema, req.body); // ✅ Use directly
  // ...
});
```

---

## TypeScript support

```typescript
// schemas/user.ts
import { s } from 'schema-dsl/pure';

export const userSchemas = {
  register: s({
    username: s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .error({ pattern: 'Can only contain letters, numbers and underscores' }),
    email: 'email!',
    password: s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .error({ pattern: 'Password must be at least 8 characters and must contain letters and numbers' }),
    age: 'number:18-120'
  }),

  login: s({
    username: 'string!',
    password: 'string!'
  })
};

// routes/user.ts
import { validate } from 'schema-dsl/pure';
import { userSchemas } from '../schemas/user';

router.post('/register', (req, res) => {
  const result = validate(userSchemas.register, req.body);
  // ...
});
```

---

## Summarize

**✅Best Practices**:
1. Define all schemas in a separate `schemas/` directory
2. Load when the project starts and convert once
3. Used directly in routing without conversion
4. Suitable for production environments and high concurrency scenarios

**✅Performance Advantages**:
- Avoid duplication of conversions for each request
- Schema reuse, smaller memory footprint
- Response time is more stable

**✅ Code Advantages**:
- Centrally manage all validation rules
- Easy to maintain and modify
- Type safety (TypeScript)

---

## Corresponding sample file

**Example entry**: [best-practices-project-structure.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/best-practices-project-structure.ts)
**Description**: Use a minimal `userSchemas` object to simulate the centralized definition/routing multiplexing structure and directly verify the two paths of registration and login.
