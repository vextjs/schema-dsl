import { Validator, dsl, validate } from '../../dist/index.js'

// ============================================================
// addKeyword — extend AJV with custom validation keywords
//
// validator.addKeyword(name, definition)
//   type        → 'number' | 'string' | 'array' | 'object' | ...
//   validate    → (schemaValue, data) => boolean
//   keyword then becomes available in any raw JSON Schema object
// ============================================================

const validator = new Validator()

// ============================================================
// 1. isEven — number parity check
// ============================================================

validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0,
})

const evenSchema = { type: 'number', isEven: true }

console.log('add-keyword.even.4       =', validator.validate(evenSchema as any, 4).valid)  // true
console.log('add-keyword.even.5       =', validator.validate(evenSchema as any, 5).valid)  // false

// ============================================================
// 2. isPositive — number sign guard
// ============================================================

validator.addKeyword('isPositive', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) > 0,
})

const positiveSchema = { type: 'number', isPositive: true }

console.log('add-keyword.positive.1   =', validator.validate(positiveSchema as any, 1).valid)    // true
console.log('add-keyword.positive.neg =', validator.validate(positiveSchema as any, -5).valid)   // false
console.log('add-keyword.positive.0   =', validator.validate(positiveSchema as any, 0).valid)    // false

// ============================================================
// 3. maxWords — string word-count cap
// ============================================================

validator.addKeyword('maxWords', {
  type: 'string',
  validate: (schema: unknown, data: unknown) =>
    (data as string).trim().split(/\s+/).filter(Boolean).length <= (schema as number),
})

const titleSchema = { type: 'string', maxWords: 5 }

console.log('add-keyword.words.ok     =', validator.validate(titleSchema as any, 'Short title here').valid)     // true
console.log('add-keyword.words.tooMany =', validator.validate(titleSchema as any, 'one two three four five six').valid)  // false

// ============================================================
// 4. noWhitespace — string format guard
// ============================================================

validator.addKeyword('noWhitespace', {
  type: 'string',
  validate: (_schema: unknown, data: unknown) => !/\s/.test(data as string),
})

const slugSchema = { type: 'string', noWhitespace: true }

console.log('add-keyword.nows.ok      =', validator.validate(slugSchema as any, 'my-slug').valid)     // true
console.log('add-keyword.nows.space   =', validator.validate(slugSchema as any, 'bad slug').valid)    // false

// ============================================================
// 5. Combine keyword with dsl() via the Validator instance
// ============================================================

const priceSchema = dsl({ amount: 'number!', currency: 'string:3-3!' })

// Custom keyword does not interact with dsl() validate() helper
// Use the validator instance directly when you need custom keywords
const combined = { type: 'number', minimum: 0, isPositive: true }

console.log('add-keyword.combined.ok  =', validator.validate(combined as any, 1).valid)    // true
console.log('add-keyword.combined.0   =', validator.validate(combined as any, 0).valid)    // false (isPositive fails)

// dsl schema still validates normally via validate()
console.log('add-keyword.dsl.valid    =',
  validate(priceSchema, { amount: 9.99, currency: 'USD' }).valid)   // true