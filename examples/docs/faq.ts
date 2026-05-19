import { SchemaUtils, Validator, dsl, validate } from '../../dist/index.js'

// ============================================================
// FAQ — frequently asked questions and common patterns
// ============================================================

// ============================================================
// Q1: How do I get all errors at once, not just the first?
//     A: Use Validator with allErrors: true
// ============================================================

const schema = dsl({
  username: 'string:3-32!',
  email:    dsl('email!').label('Email address'),
  age:      'number:18-120',
})

const validator = new Validator({ cache: true, allErrors: true })

const allErrors = validator.validate(schema, {
  username: 'x',
  email:    'bad-email',
  age:      12,
})

console.log('faq.allErrors.valid           =', allErrors.valid)                         // false
console.log('faq.allErrors.count           =', (allErrors.errors?.length ?? 0) >= 2)    // true

// ============================================================
// Q2: How do I validate in a specific language?
//     A: Pass locale option to validate() or validator.validate()
// ============================================================

const localeResult = validator.validate(schema, {
  username: 'faq_user',
  email:    'bad',
}, { locale: 'en-US' })

console.log('faq.locale.valid              =', localeResult.valid)                  // false
console.log('faq.locale.message.isString   =', typeof localeResult.errors?.[0]?.message)  // 'string'

// ============================================================
// Q3: How do I validate multiple records efficiently?
//     A: SchemaUtils.validateBatch() — returns results + summary
// ============================================================

const batch = SchemaUtils.validateBatch(schema, [
  { username: 'faq_user',  email: 'faq@example.com',  age: 30 },
  { username: 'x',         email: 'bad',               age: 12 },
  { username: 'user_two',  email: 'two@example.com',   age: 25 },
], validator.getAjv())

console.log('faq.batch.total               =', batch.summary.total)   // 3
console.log('faq.batch.valid               =', batch.summary.valid)   // 2
console.log('faq.batch.invalid             =', batch.summary.invalid) // 1
console.log('faq.batch.hasDuration         =', batch.summary.duration >= 0)  // true

// ============================================================
// Q4: Does the validator cache schemas?
//     A: Yes — enable via { cache: true }
// ============================================================

// Warm up with first call
validator.validate(schema, { username: 'faq_user', email: 'faq@example.com', age: 28 })

const stats = validator.getCacheStats()

console.log('faq.cache.enabled             =', stats.enabled)   // true
console.log('faq.cache.hits                =', stats.hits >= 0) // true

// ============================================================
// Q5: How do I compile a schema for repeated use?
//     A: validator.compile() returns a reusable AJV validate fn
// ============================================================

const compiled = validator.compile(schema, 'faq-user')

const c1 = compiled({ username: 'faq_user', email: 'faq@example.com', age: 28 })
const c2 = compiled({ username: 'x' })

console.log('faq.compile.valid             =', c1)               // true
console.log('faq.compile.invalid           =', c2)               // false
console.log('faq.compile.errors            =', Array.isArray(compiled.errors) || compiled.errors === null)  // true

// ============================================================
// Q6: Is optional with default different from optional?
//     A: Yes — default fills missing values; optional just skips
// ============================================================

const schemaWithDefault = dsl({
  name:  'string!',
  theme: dsl('light|dark').default('light'),
})

const noTheme = validate(schemaWithDefault, { name: 'Alice' })

console.log('faq.default.valid             =', noTheme.valid)    // true (theme defaults to 'light')