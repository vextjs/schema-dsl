import { dsl, validate, Validator } from '../../dist/index.js'

// ============================================================
// Validation guide — from quick usage to production patterns
// ============================================================

// ============================================================
// 1. Quick one-liner: validate()
// ============================================================

const quickSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'integer:18-120',
})

const ok = validate(quickSchema, { username: 'alice', email: 'alice@example.com', age: 28 })
console.log('validation-guide.quick.valid        =', ok.valid)   // true
console.log('validation-guide.quick.data.age     =', (ok.data as any)?.age)  // 28

// ============================================================
// 2. allErrors — collect every problem, not just the first
// ============================================================

const failAll = validate(quickSchema, { username: 'x', email: 'bad', age: 12 }, { allErrors: true })
console.log('validation-guide.allErrors.valid    =', failAll.valid)              // false
console.log('validation-guide.allErrors.count    =', failAll.errors?.length)     // 3

// ============================================================
// 3. Stateful Validator with coercion + defaults
// ============================================================

const validator = new Validator({
  allErrors:   true,
  coerceTypes: true,
  useDefaults: true,
  cache:       true,
})

const fullSchema = dsl({
  username: dsl('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/).label('Username')
    .error({ pattern: 'Username may only contain letters, digits, and underscores' }),
  email:    dsl('email!').label('Email'),
  age:      dsl('integer:18-120').label('Age'),
  country:  dsl('string').default('US'),
})

// Coercion: '28' → 28 — valid with defaults
const r1 = validator.validate(fullSchema, { username: 'alice_01', email: 'alice@example.com', age: '28' })
console.log('validation-guide.coerce.valid       =', r1.valid)                   // true
console.log('validation-guide.coerce.age         =', (r1.data as any)?.age)      // 28  (number)
console.log('validation-guide.coerce.country     =', (r1.data as any)?.country)  // 'US' (default)

// ============================================================
// 4. Per-field custom errors
// ============================================================

const r2 = validator.validate(fullSchema, { username: 'bad user', email: 'not-email', age: '16' })
console.log('validation-guide.custom.valid       =', r2.valid)                   // false
// Pattern error uses our custom message
const patternErr = r2.errors?.find(e => e.path === '/username')
console.log('validation-guide.custom.patternMsg  =', patternErr?.message?.includes('letters'))  // true

// ============================================================
// 5. compile() — pre-compile for hot-path
// ============================================================

const validateFn = validator.compile(fullSchema, 'validation-guide-full')
console.log('validation-guide.compile.valid      =',
  validateFn({ username: 'bob_42', email: 'bob@example.com', age: 30 }))         // true
console.log('validation-guide.compile.invalid    =',
  validateFn({ username: 'x',      email: 'bad',             age: 12 }))         // false

// ============================================================
// 6. validateBatch()
// ============================================================

const batchData = [
  { username: 'alice_01', email: 'alice@example.com', age: 28 },
  { username: 'ab',       email: 'bad-email',          age: 16 },
  { username: 'carol_99', email: 'carol@example.com',  age: 22 },
]
const batchResults = validator.validateBatch(fullSchema, batchData)
console.log('validation-guide.batch.total        =', batchResults.length)                         // 3
console.log('validation-guide.batch.validFlags   =', batchResults.map(r => r.valid).join(','))    // 'true,false,true'
console.log('validation-guide.batch.passed       =', batchResults.filter(r => r.valid).length)    // 2

// ============================================================
// 7. Locale-aware errors
// ============================================================

const enErrors = validator.validate(fullSchema, { username: 'x', email: 'bad', age: 12 }, { locale: 'en-US' })
const zhErrors = validator.validate(fullSchema, { username: 'x', email: 'bad', age: 12 }, { locale: 'zh-CN' })

console.log('validation-guide.locale.en          =', typeof enErrors.errors?.[0]?.message)  // 'string'
console.log('validation-guide.locale.zh          =', typeof zhErrors.errors?.[0]?.message)  // 'string'

// ============================================================
// 8. Practical helper: format errors for API response
// ============================================================

function formatApiErrors(errors: Array<{ path?: string; message?: string }>) {
  return errors.map(e => ({ field: e.path?.replace(/^\//, '') ?? 'root', message: e.message ?? 'Invalid' }))
}

const apiErrors = formatApiErrors(r2.errors ?? [])
console.log('validation-guide.apiErrors.first    =', apiErrors[0]?.field)       // field name
console.log('validation-guide.apiErrors.msg      =', typeof apiErrors[0]?.message)  // 'string'