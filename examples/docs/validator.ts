import { s, validate, validateAsync, ValidationError, Validator } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`validator expectation failed: ${label}`)
}

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

const userSchema = s({
  name:   'string:2-50!',
  email:  'email!',
  age:    'integer:18-120',
  role:   s('string').default('user'),
})

// Valid — role filled by default, age coerced from string
const result = validator.validate(userSchema, { name: 'Alice', email: 'alice@example.com', age: '28' })
console.log('validator.result.valid      =', result.valid)            // true
console.log('validator.result.role       =', (result.data as any).role)     // 'user' (default)
console.log('validator.result.age        =', (result.data as any).age)      // 28 (coerced)
expect('validator applies default role', (result.data as any).role === 'user')
expect('validator coerces age', typeof (result.data as any).age === 'number')

// ============================================================
// 2. allErrors — collect every error, not just the first
// ============================================================

const bad = validator.validate(userSchema, { name: 'X', email: 'not-an-email', age: 15 })
console.log('validator.allErrors.valid   =', bad.valid)               // false
console.log('validator.allErrors.count   =', bad.errors?.length)      // 3 (name, email, age)
expect('allErrors returns multiple validation issues', (bad.errors?.length ?? 0) >= 3)

try {
  await validateAsync(userSchema, { name: 'X', email: 'bad', age: 15 })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validator.validateAsync.count =', err.getErrorCount())
    expect('validateAsync throws ValidationError', err.hasFieldError('email'))
  }
}

// ============================================================
// 3. compile() — pre-compile for hot-path usage
// ============================================================

const validateUser = validator.compile(userSchema, 'user-schema')
const ok = validateUser({ name: 'Bob', email: 'bob@example.com', age: 25 })
console.log('validator.compile.valid     =', ok)                      // true
expect('compiled validator accepts valid user', ok === true)

// Cache hit — same key → same function reference
const validateUser2 = validator.compile(userSchema, 'user-schema')
console.log('validator.compile.cacheHit  =', validateUser === validateUser2)  // true
expect('compile cache returns same function for same key', validateUser === validateUser2)

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
expect('validateBatch validates every row', batchResults.length === 3)
expect('validateBatch reports invalid middle row', batchResults[1]?.valid === false)

// ============================================================
// 5. getCacheStats() — monitor cache efficiency
// ============================================================

// Warm up cache with a few compiles
for (let i = 0; i < 5; i++) validator.compile(userSchema, 'user-schema')  // all hits

const stats = validator.getCacheStats()
console.log('validator.cacheStats.size   =', stats.size >= 1)             // true
console.log('validator.cacheStats.hits   =', Number(stats.hits) >= 5)     // true
expect('cache stats are enabled', stats.enabled)

// ============================================================
// 6. getAjv() — access underlying AJV instance directly
// ============================================================

const ajv = validator.getAjv()
console.log('validator.getAjv.type       =', typeof ajv.compile)          // 'function'
expect('getAjv exposes compile function', typeof ajv.compile === 'function')

// ============================================================
// 7. addFormat() / addKeyword() — extend one Validator instance
// ============================================================

validator.addFormat('ticket-code', /^TCK-\d{4}$/)
const ticketResult = validator.validate({
  type: 'object',
  properties: { ticket: { type: 'string', format: 'ticket-code' } },
  required: ['ticket'],
}, { ticket: 'TCK-2026' })

validator.addKeyword('startsWithPrefix', {
  type: 'string',
  schemaType: 'string',
  validate: (prefix: unknown, data: unknown) =>
    typeof prefix === 'string' && typeof data === 'string' && data.startsWith(prefix),
} as any)
const prefixedResult = validator.validate({
  type: 'object',
  properties: { id: { type: 'string', startsWithPrefix: 'USR-' } },
  required: ['id'],
} as any, { id: 'USR-001' })

console.log('validator.addFormat.valid   =', ticketResult.valid)
console.log('validator.addKeyword.valid  =', prefixedResult.valid)
expect('custom format validates ticket code', ticketResult.valid)
expect('custom keyword validates prefix', prefixedResult.valid)

// ============================================================
// 8. addSchema() / removeSchema() — reference schemas by URI
// ============================================================

validator.addSchema('AddressRef', {
  type: 'object',
  properties: { city: { type: 'string', minLength: 2 } },
  required: ['city'],
})

const refSchema = {
  type: 'object',
  properties: { address: { $ref: 'AddressRef' } },
  required: ['address'],
}
const refOk = validator.validate(refSchema as any, { address: { city: 'Shanghai' } })
validator.removeSchema('AddressRef')

console.log('validator.addSchema.valid   =', refOk.valid)
expect('schema reference validates before removal', refOk.valid)

// ============================================================
// 9. Strict mode — no extra properties allowed
// ============================================================

const strictValidator = new Validator({ strict: false })  // AJV strict mode OFF (DSL uses own strict)
const strictSchema = s({
  id:   'uuid!',
  name: 'string:1-50!',
})

// Extra field ignored (AJV by default passes extra props)
const r1 = strictValidator.validate(strictSchema, { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Alice', extra: 'x' })
console.log('validator.strict.extra.valid =', r1.valid)  // true — extra ignored
expect('extra properties are allowed by default', r1.valid)

// ============================================================
// 10. Per-call locale override
// ============================================================

const enResult = validator.validate(userSchema, { name: 'X', email: 'bad', age: 12 }, { locale: 'en-US' })
const zhResult = validator.validate(userSchema, { name: 'X', email: 'bad', age: 12 }, { locale: 'zh-CN' })
console.log('validator.locale.en.msg     =', typeof enResult.errors?.[0]?.message)  // 'string'
console.log('validator.locale.zh.msg     =', typeof zhResult.errors?.[0]?.message)  // 'string'
expect('locale override returns formatted messages', typeof zhResult.errors?.[0]?.message === 'string')

// ============================================================
// 11. Static helpers and cleanup
// ============================================================

const factoryValidator = Validator.create({ cache: false })
const quickValid = Validator.quickValidate(userSchema, {
  name: 'Quick',
  email: 'quick@example.com',
  age: 30,
})
const factoryResult = factoryValidator.validate(userSchema, {
  name: 'Factory',
  email: 'factory@example.com',
  age: 31,
})

validator.clearCache()
const afterClear = validator.getCacheStats()

console.log('validator.static.quickValid =', quickValid)
console.log('validator.static.create     =', factoryResult.valid)
console.log('validator.cache.clear       =', afterClear.size)
expect('Validator.quickValidate accepts valid data', quickValid)
expect('Validator.create returns working validator', factoryResult.valid)
expect('clearCache removes compiled entries', afterClear.size === 0)
