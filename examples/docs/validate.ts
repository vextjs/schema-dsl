import { s, validate, Validator, Locale } from '../../dist/pure.js'

// ============================================================
// 1. Basic validation and ValidationResult structure
// ============================================================

const userSchema = s({
  username:   'string:3-32!',
  email:      'email!',
  age:        'integer:18-120',
  role:       'admin|user|guest',
  createdAt:  'datetime',
})

const validResult = validate(userSchema, {
  username: 'alice_01',
  email:    'alice@example.com',
  age:      26,
  role:     'user',
})

// ValidationResult shape: { valid, data, errors, errorMessage }
console.log('validate.valid.result.valid =',        validResult.valid)          // true
console.log('validate.valid.result.data =',         validResult.data)           // coerced data
console.log('validate.valid.result.errors.length =', validResult.errors?.length) // 0
console.log('validate.valid.result.errorMessage =',  validResult.errorMessage)  // undefined

const invalidResult = validate(userSchema, {
  username: 'ab',           // too short
  email:    'bad-email',    // invalid format
  age:      12,             // below 18
  role:     'superadmin',   // not in enum
})

// Each ValidationErrorItem: { message, path, keyword, params, field, type }
console.log('validate.invalid.valid =',        invalidResult.valid)
console.log('validate.invalid.errorMessage =', invalidResult.errorMessage) // first error message
console.log('validate.invalid.errors =',
  invalidResult.errors?.map(e => ({ path: e.path, keyword: e.keyword, msg: e.message })))

// ============================================================
// 2. Smart type coercion (smartCoerce — default: true)
// ============================================================

// By default, string "25" is coerced to integer 25
const coercedResult = validate(userSchema, {
  username:   'john_doe',
  email:      'john@example.com',
  age:        '25',   // string → auto-coerced to integer
})
console.log('validate.coerce.valid =',    coercedResult.valid)                    // true
console.log('validate.coerce.age.type =', typeof (coercedResult.data as any)?.age) // 'number'

// Disable coercion: string "25" stays a string → fails integer check
const noCoerceResult = validate(
  userSchema,
  { username: 'john_doe', email: 'john@example.com', age: '25' },
  { smartCoerce: false },
)
console.log('validate.noCoerce.valid =', noCoerceResult.valid) // false — "25" is not integer

// ============================================================
// 3. allErrors — collect every error vs. keep only the first
// ============================================================

const allErrorsResult = validate(
  userSchema,
  { username: 'x', email: 'bad', age: 10, role: 'hacker' },
  { allErrors: true },
)
const firstErrorResult = validate(
  userSchema,
  { username: 'x', email: 'bad', age: 10, role: 'hacker' },
  { allErrors: false },
)

console.log('validate.allErrors.count =',    allErrorsResult.errors?.length)   // all 4 errors
console.log('validate.firstError.count =',   firstErrorResult.errors?.length)  // 1 error

// ============================================================
// 4. Locale — error messages in different languages
// ============================================================

const enResult = validate(userSchema, { username: 'x', email: 'bad' }, { locale: 'en-US' })
const zhResult = validate(userSchema, { username: 'x', email: 'bad' }, { locale: 'zh-CN' })
const jaResult = validate(userSchema, { username: 'x', email: 'bad' }, { locale: 'ja-JP' })

console.log('validate.locale.en =', enResult.errorMessage)
console.log('validate.locale.zh =', zhResult.errorMessage)
console.log('validate.locale.ja =', jaResult.errorMessage)

// ============================================================
// 5. Custom error messages via options.messages
// ============================================================

const customMsgResult = validate(
  userSchema,
  { username: 'x', email: 'bad@', age: 200 },
  {
    messages: {
      'string.min':     'Username must be at least {limit} characters',
      'string.email':   'Please enter a valid email address',
      'number.maximum': 'Age cannot exceed {limit}',
    },
  },
)
console.log('validate.customMessages.errors =',
  customMsgResult.errors?.map(e => e.message))

// ============================================================
// 6. useDefaults — populate missing fields from schema defaults
// ============================================================

const schemaWithDefaults = s({
  username: 'string!',
  theme:    s('light|dark').default('dark'),
  pageSize: s('integer:1-100').default(20),
  active:   s('boolean').default(true),
})

// Without useDefaults: missing fields remain missing
const withoutDefaults = validate(schemaWithDefaults, { username: 'alice' })
console.log('validate.withoutDefaults.theme =', (withoutDefaults.data as any)?.theme)  // undefined

// With useDefaults: defaults are applied during validation
const withDefaults = validate(
  schemaWithDefaults,
  { username: 'alice' },
  // defaults are applied by the DslBuilder .default() mechanism — re-validate to pick them up
)
// Defaults get embedded when build (via Validator with useDefaults AJV option)
const v = new Validator({ useDefaults: true })
const useDefaultsResult = v.validate(schemaWithDefaults, { username: 'alice' })
console.log('validate.useDefaults.theme =',    (useDefaultsResult.data as any)?.theme)    // 'dark'
console.log('validate.useDefaults.pageSize =', (useDefaultsResult.data as any)?.pageSize) // 20
console.log('validate.useDefaults.active =',   (useDefaultsResult.data as any)?.active)   // true

// ============================================================
// 7. Validator class — reusable instance with configured options
// ============================================================

const validator = new Validator({
  allErrors:         true,         // always collect all errors
  coerceTypes:       true,         // AJV native coercion; Validator also has schema-dsl smart coercion by default
  removeAdditional:  'all',        // strip extra fields
  cache: { maxSize: 50, statsEnabled: true },
})

// Validate multiple times — second call hits schema cache
const r1 = validator.validate(userSchema, { username: 'alice', email: 'alice@example.com', age: 25 })
const r2 = validator.validate(userSchema, { username: 'bob',   email: 'bad',               age: 30 })

console.log('validate.Validator.r1.valid =',  r1.valid)  // true
console.log('validate.Validator.r2.valid =',  r2.valid)  // false
console.log('validate.Validator.cache.hits =', validator.getCacheStats().hits >= 1)

// ============================================================
// 8. validateBatch — compile once, validate many items
// ============================================================

const batchResults = validator.validateBatch(userSchema, [
  { username: 'alice', email: 'alice@example.com', age: 25 },
  { username: 'bob',   email: 'bob@example.com',   age: 30 },
  { username: 'x',     email: 'bad',               age: 10 }, // invalid
])

console.log('validate.batch.length =',     batchResults.length)              // 3
console.log('validate.batch.r0.valid =',   batchResults[0].valid)            // true
console.log('validate.batch.r2.valid =',   batchResults[2].valid)            // false
console.log('validate.batch.r2.errors =',  batchResults[2].errors?.length)   // some errors

// ============================================================
// 9. compile() — get a compiled validator function for max speed
// ============================================================

const compiled = validator.compile(userSchema)

// Call compiled function directly — returns boolean
const passRaw = compiled({ username: 'charlie', email: 'c@example.com', age: 20 })
const failRaw = compiled({ username: 'c', email: 'bad', age: 10 })

console.log('validate.compile.pass =', passRaw) // true
console.log('validate.compile.fail =', failRaw) // false
