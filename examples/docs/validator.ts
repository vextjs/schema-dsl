import { dsl, validate, Validator } from '../../dist/index.js'

// ============================================================
// Validator class — stateful wrapper around AJV
//
// Key options:
//   allErrors    — collect all errors (not just the first)
//   coerceTypes  — automatically coerce string "42" → number 42
//   useDefaults  — apply .default() values from the schema
//   cache        — enable schema compilation cache
//
// Key methods:
//   .validate(schema, data, opts?)   → ValidationResult
//   .compile(schema, key?)           → AJV ValidateFunction
//   .validateBatch(schema, items[])  → ValidationResult[]
//   .getCacheStats()                 → CacheStats
//   .getAjv()                        → Ajv instance
// ============================================================

// ============================================================
// 1. Default Validator (allErrors + coerce + defaults + cache)
// ============================================================

const validator = new Validator({
  allErrors:   true,
  useDefaults: true,
  coerceTypes: true,
  cache:       true,
})

const userSchema = dsl({
  name:   'string:2-50!',
  email:  'email!',
  age:    'integer:18-120',
  role:   dsl('string').default('user'),
})

// Valid — role filled by default, age coerced from string
const result = validator.validate(userSchema, { name: 'Alice', email: 'alice@example.com', age: '28' })
console.log('validator.result.valid      =', result.valid)            // true
console.log('validator.result.role       =', (result.data as any).role)     // 'user' (default)
console.log('validator.result.age        =', (result.data as any).age)      // 28 (coerced)

// ============================================================
// 2. allErrors — collect every error, not just the first
// ============================================================

const bad = validator.validate(userSchema, { name: 'X', email: 'not-an-email', age: 15 })
console.log('validator.allErrors.valid   =', bad.valid)               // false
console.log('validator.allErrors.count   =', bad.errors?.length)      // 3 (name, email, age)

// ============================================================
// 3. compile() — pre-compile for hot-path usage
// ============================================================

const validateUser = validator.compile(userSchema, 'user-schema')
const ok = validateUser({ name: 'Bob', email: 'bob@example.com', age: 25 })
console.log('validator.compile.valid     =', ok)                      // true

// Cache hit — same key → same function reference
const validateUser2 = validator.compile(userSchema, 'user-schema')
console.log('validator.compile.cacheHit  =', validateUser === validateUser2)  // true

// ============================================================
// 4. validateBatch() — validate an array of records at once
// ============================================================

const batchData = [
  { name: 'Alice', email: 'alice@example.com', age: 30 },
  { name: 'X',     email: 'bad-email',          age: 12 },
  { name: 'Carol', email: 'carol@example.com',  age: 28 },
]

const batchResults = validator.validateBatch(userSchema, batchData)
console.log('validator.batch.total   =', batchResults.length)                        // 3
console.log('validator.batch.valid   =', batchResults.map(r => r.valid).join(','))   // 'true,false,true'
console.log('validator.batch.errors0 =', (batchResults[1]?.errors?.length ?? 0) > 0) // true

// ============================================================
// 5. getCacheStats() — monitor cache efficiency
// ============================================================

// Warm up cache with a few compiles
for (let i = 0; i < 5; i++) validator.compile(userSchema, 'user-schema')  // all hits

const stats = validator.getCacheStats()
console.log('validator.cacheStats.size   =', stats.size >= 1)             // true
console.log('validator.cacheStats.hits   =', Number(stats.hits) >= 5)     // true

// ============================================================
// 6. getAjv() — access underlying AJV instance directly
// ============================================================

const ajv = validator.getAjv()
console.log('validator.getAjv.type       =', typeof ajv.compile)          // 'function'

// ============================================================
// 7. Strict mode — no extra properties allowed
// ============================================================

const strictValidator = new Validator({ strict: false })  // AJV strict mode OFF (DSL uses own strict)
const strictSchema = dsl({
  id:   'uuid!',
  name: 'string:1-50!',
})

// Extra field ignored (AJV by default passes extra props)
const r1 = strictValidator.validate(strictSchema, { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Alice', extra: 'x' })
console.log('validator.strict.extra.valid =', r1.valid)  // true — extra ignored

// ============================================================
// 8. Per-call locale override
// ============================================================

const enResult = validator.validate(userSchema, { name: 'X', email: 'bad', age: 12 }, { locale: 'en-US' })
const zhResult = validator.validate(userSchema, { name: 'X', email: 'bad', age: 12 }, { locale: 'zh-CN' })
console.log('validator.locale.en.msg     =', typeof enResult.errors?.[0]?.message)  // 'string'
console.log('validator.locale.zh.msg     =', typeof zhResult.errors?.[0]?.message)  // 'string'