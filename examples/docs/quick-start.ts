import { s, validate, validateAsync, Validator, ValidationError } from '../../dist/pure.js'

// ============================================================
// 1. Minimal schema — verify a single field
// ============================================================

const emailOnly = s({ email: 'email!' })
console.log('quick-start.emailOnly.valid =',
  validate(emailOnly, { email: 'user@example.com' }).valid)
console.log('quick-start.emailOnly.invalid =',
  validate(emailOnly, { email: 'bad' }).valid)

// ============================================================
// 2. User registration schema — multiple field types + chain API
// ============================================================

const registerSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('Username')
    .error({ pattern: 'Only letters, digits and underscores are allowed' }),
  email: s('email!').label('Email address'),
  password: s('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('Password')
    .error({ pattern: 'Must contain uppercase, lowercase and a digit' }),
  age: 'number:18-120',
  role: 'user|admin',
  newsletter: s.boolean().default(false),
})

const validUser = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user',
}

const invalidUser = {
  username: 'john$',       // invalid pattern
  email: 'not-an-email',   // invalid format
  password: 'password',    // missing uppercase + digit
  age: 16,                 // below minimum
  role: 'guest',           // not in enum
}

const validResult = validate(registerSchema, validUser)
const invalidResult = validate(registerSchema, invalidUser)

console.log('quick-start.validUser.valid =', validResult.valid)
console.log('quick-start.validUser.data =', validResult.data)
console.log('quick-start.invalidUser.valid =', invalidResult.valid)
console.log('quick-start.invalidUser.errorCount =', invalidResult.errors?.length)
console.log('quick-start.invalidUser.errors =',
  invalidResult.errors?.map(({ path, keyword, message }) => ({ path, keyword, message })))

// ============================================================
// 3. String coercion — form/query-string data often arrives as strings
// ============================================================

const orderSchema = s({
  quantity: 'integer:1-100!',
  price: 'number:0.01-',
  discount: 'number:0-100',
})

// String values from HTML forms are automatically coerced to numbers
const fromForm = validate(orderSchema, { quantity: '3', price: '29.99', discount: '10' })
console.log('quick-start.coerce.valid =', fromForm.valid)
console.log('quick-start.coerce.quantity =',
  (fromForm.data as Record<string, unknown>)?.quantity) // number 3, not string '3'

// Disable coercion when strict type checking is needed
const strictResult = validate(
  orderSchema,
  { quantity: '3', price: '29.99' },
  { coerce: false },
)
console.log('quick-start.noCoerce.valid =', strictResult.valid) // false — strings rejected

// ============================================================
// 4. Nested objects and arrays
// ============================================================

const postSchema = s({
  title: 'string:5-200!',
  content: 'string:10-50000!',
  tags: 'array:1-5<string:1-30>',
  published: 'boolean',
  author: {
    name: 'string:2-50!',
    email: 'email',
    avatar: 'url',
  },
  stats: {
    views: 'integer:0-',
    likes: 'integer:0-',
  },
})

const validPost = {
  title: 'Getting started with schema-dsl',
  content: 'This comprehensive guide shows how to use schema-dsl for all your validation needs.',
  tags: ['tutorial', 'typescript'],
  published: false,
  author: {
    name: 'Alice',
    email: 'alice@example.com',
    avatar: 'https://example.com/avatar.png',
  },
  stats: { views: 0, likes: 0 },
}

console.log('quick-start.post.valid =', validate(postSchema, validPost).valid)

const invalidPost = validate(postSchema, {
  title: 'Hi',                         // too short (< 5 chars)
  content: 'Short',                    // too short (< 10 chars)
  tags: [],                            // empty array violates min:1
  author: { name: 'B', email: 'bad' }, // name too short, email invalid
  stats: { views: -1, likes: 0 },      // views below minimum
})
console.log('quick-start.post.invalid.valid =', invalidPost.valid)
console.log('quick-start.post.invalid.errors =',
  invalidPost.errors?.map(e => `${e.path}: ${e.keyword}`))

// ============================================================
// 5. Validator class — reusable instance with extended options
// ============================================================

const validator = new Validator({
  allErrors: true,    // collect all errors, not just the first
  useDefaults: true,  // apply schema default values to output data
  cache: true,        // cache compiled schemas for performance
})

// Validate a batch of records and collect per-item results
const batchResults = validator.validateBatch(registerSchema, [
  { username: 'alice_01', email: 'alice@example.com', password: 'Alice123', age: 28, role: 'user' },
  { username: 'bob_02',   email: 'bob@example.com',   password: 'Bob456Xx', age: 35, role: 'admin' },
  { username: 'ab',       email: 'bad',               password: 'short',   age: 16, role: 'guest' },
])
console.log('quick-start.batch.results =', batchResults.map(r => r.valid))

// ============================================================
// 6. Pre-compiled function — zero parse overhead, best for hot paths
// ============================================================

// compile() returns a raw boolean function — fastest possible check
const compiled = validator.compile(registerSchema, 'user-register')
console.log('quick-start.compiled.valid =',   compiled(validUser))
console.log('quick-start.compiled.invalid =', compiled(invalidUser))
console.log('quick-start.compiled.isFunction =', typeof compiled === 'function')

// ============================================================
// 7. Async validation — throws ValidationError on failure
// ============================================================

async function main(): Promise<void> {
  const result = await validateAsync(registerSchema, validUser)
  console.log('quick-start.async.valid.username =',
    (result as { username: string }).username)

  try {
    await validateAsync(registerSchema, invalidUser)
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log('quick-start.async.invalid.caught =', true)
      console.log('quick-start.async.invalid.errorCount =', err.errors.length)
    } else {
      throw err
    }
  }
}

void main()
