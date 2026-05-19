import { dsl, validate, Validator } from '../../dist/index.js'

// ============================================================
// compile() — pre-compile a schema to a reusable validate function
//
// Why compile?
//   - AJV schema compilation is relatively expensive; compile() caches
//     the result so repeated calls return the same function instantly
//   - Hot paths (API request handlers, event loops) benefit greatly
//   - Optional cache key lets you reuse across validator instances
// ============================================================

// ============================================================
// 1. Basic compile() — returns an AJV ValidateFunction
//    result: true (valid) / false (invalid); errors on .errors
// ============================================================

const validator = new Validator({ allErrors: true, coerceTypes: true, cache: true })

const userSchema = dsl({
  name:  'string:1-50!',
  email: 'email!',
  age:   'integer:18-120',
  score: 'number:0-100',
})

const validateUser = validator.compile(userSchema, 'user-v1')

// Valid data
const ok = validateUser({ name: 'Alice', email: 'alice@example.com', age: 30, score: 95 })
console.log('compile.valid          =', ok)            // true
console.log('compile.valid.errors   =', validateUser.errors)  // null

// Invalid data
const fail = validateUser({ name: '', email: 'bad', age: 16, score: 110 })
console.log('compile.invalid        =', fail)           // false
console.log('compile.invalid.errors =', validateUser.errors?.length)  // 4

// ============================================================
// 2. Cache hit — same key returns the identical function reference
// ============================================================

const validateUser2 = validator.compile(userSchema, 'user-v1')
console.log('compile.cacheHit =', validateUser === validateUser2)  // true

// ============================================================
// 3. Different keys — produce independent compiled functions
// ============================================================

const productSchema = dsl({
  sku:   'alphanum:5-20!',
  price: 'number:0.01-!',
  stock: 'integer:0-!',
})

const validateProduct = validator.compile(productSchema, 'product-v1')
console.log('compile.independent =', validateUser !== validateProduct)  // true

const productOk = validateProduct({ sku: 'SKU001', price: 9.99, stock: 100 })
console.log('compile.product.valid =', productOk)  // true

// ============================================================
// 4. Compiled function with coerceTypes — string inputs become numbers
// ============================================================

const orderSchema = dsl({
  quantity: 'integer:1-999!',
  total:    'number:0.01-!',
})
const validateOrder = validator.compile(orderSchema, 'order-v1')

// Strings coerced to numbers
const coerced = validateOrder({ quantity: '5', total: '49.99' })
console.log('compile.coerce.valid =', coerced)  // true (coerced from strings)

// ============================================================
// 5. Hot-path usage — compile once, validate many
// ============================================================

const logEntrySchema = dsl({
  level:   'info|warn|error!',
  message: 'string:1-1000!',
  ts:      'integer:0-!',
})
const validateLog = validator.compile(logEntrySchema, 'log-entry')

const logBatch = [
  { level: 'info',  message: 'Server started', ts: 1710000000000 },
  { level: 'warn',  message: 'High memory usage', ts: 1710000001000 },
  { level: 'error', message: 'DB connection failed', ts: 1710000002000 },
  { level: 'debug', message: 'Should fail', ts: -1 },  // invalid level + ts
]

const logResults = logBatch.map(entry => ({ entry: entry.level, valid: validateLog(entry) }))
console.log('compile.batch.results =',
  logResults.map(r => `${r.entry}:${r.valid}`).join(' '))  // info:true warn:true error:true debug:false

// ============================================================
// 6. No-cache mode — fresh compilation every time
//    (useful for testing, or dynamic schemas that change)
// ============================================================

const noCache = new Validator({ cache: false })
const schemaA = dsl({ x: 'string!' })
const fn1 = noCache.compile(schemaA)
const fn2 = noCache.compile(schemaA)
console.log('compile.noCache.sameRef =', fn1 === fn2)  // false — different objects

// ============================================================
// 7. validate() vs compile() — when to use which
//    validate() internally compiles + caches with a schema-hash key
//    compile() lets you control the key explicitly for predictable hits
// ============================================================

const s = dsl({ n: 'integer:0-100' })
const via_validate = validate(s, { n: 50 })
const via_compile  = validator.compile(s, 'num-test')({ n: 50 })
console.log('compile.validate.equiv  =', via_validate.valid)   // true
console.log('compile.compile.equiv   =', via_compile)          // true