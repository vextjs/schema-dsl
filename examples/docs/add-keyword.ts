import { Validator, s, validate } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`add-keyword expectation failed: ${label}`)
}

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
  schemaType: 'boolean',
  validate: (enabled: unknown, data: unknown) => !enabled || (data as number) % 2 === 0,
})

const evenSchema = { type: 'number', isEven: true }

console.log('add-keyword.even.4       =', validator.validate(evenSchema as any, 4).valid)  // true
console.log('add-keyword.even.5       =', validator.validate(evenSchema as any, 5).valid)  // false
expect('isEven accepts even number', validator.validate(evenSchema as any, 4).valid)
expect('isEven rejects odd number', validator.validate(evenSchema as any, 5).valid === false)

// ============================================================
// 2. isPositive — number sign guard
// ============================================================

validator.addKeyword('isPositive', {
  type: 'number',
  schemaType: 'boolean',
  validate: (enabled: unknown, data: unknown) => !enabled || (data as number) > 0,
})

const positiveSchema = { type: 'number', isPositive: true }

console.log('add-keyword.positive.1   =', validator.validate(positiveSchema as any, 1).valid)    // true
console.log('add-keyword.positive.neg =', validator.validate(positiveSchema as any, -5).valid)   // false
console.log('add-keyword.positive.0   =', validator.validate(positiveSchema as any, 0).valid)    // false
expect('isPositive rejects zero', validator.validate(positiveSchema as any, 0).valid === false)

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
expect('maxWords rejects long title', validator.validate(titleSchema as any, 'one two three four five six').valid === false)

// ============================================================
// 4. noWhitespace — string format guard
// ============================================================

validator.addKeyword('noWhitespace', {
  type: 'string',
  schemaType: 'boolean',
  validate: (enabled: unknown, data: unknown) => !enabled || !/\s/.test(data as string),
})

const slugSchema = { type: 'string', noWhitespace: true }

console.log('add-keyword.nows.ok      =', validator.validate(slugSchema as any, 'my-slug').valid)     // true
console.log('add-keyword.nows.space   =', validator.validate(slugSchema as any, 'bad slug').valid)    // false
expect('noWhitespace rejects spaces', validator.validate(slugSchema as any, 'bad slug').valid === false)

// ============================================================
// 5. Combine keyword with s() via the Validator instance
// ============================================================

const priceSchema = s({ amount: 'number!', currency: 'string:3-3!' })

// Custom keyword does not interact with s() validate() helper
// Use the validator instance directly when you need custom keywords
const combined = { type: 'number', minimum: 0, isPositive: true }

console.log('add-keyword.combined.ok  =', validator.validate(combined as any, 1).valid)    // true
console.log('add-keyword.combined.0   =', validator.validate(combined as any, 0).valid)    // false (isPositive fails)
expect('combined keywords reject zero', validator.validate(combined as any, 0).valid === false)

// dsl schema still validates normally via validate()
console.log('add-keyword.s.valid    =',
  validate(priceSchema, { amount: 9.99, currency: 'USD' }).valid)   // true

// ============================================================
// 6. Object schema composition — custom keywords on fields
// ============================================================

const invoiceSchema = {
  type: 'object',
  properties: {
    amount: { type: 'number', minimum: 0, isPositive: true, isEven: true },
    title: { type: 'string', maxWords: 5, noWhitespace: false },
  },
  required: ['amount', 'title'],
}

const invoiceOk = validator.validate(invoiceSchema as any, { amount: 20, title: 'Quarterly service invoice' })
const invoiceBad = validator.validate(invoiceSchema as any, { amount: 21, title: 'one two three four five six' })

console.log('add-keyword.invoice.ok    =', invoiceOk.valid)
console.log('add-keyword.invoice.bad   =', invoiceBad.valid)
console.log('add-keyword.invoice.error =', invoiceBad.errors?.[0]?.keyword)
expect('object schema accepts valid invoice', invoiceOk.valid)
expect('object schema rejects custom keyword failures', invoiceBad.valid === false)

// ============================================================
// 7. Batch validation with custom keywords
// ============================================================

const invoiceRows = [
  { amount: 20, title: 'Annual invoice' },
  { amount: 21, title: 'Odd amount' },
  { amount: 22, title: 'one two three four five six' },
]
const invoiceBatch = validator.validateBatch(invoiceSchema as any, invoiceRows)

console.log('add-keyword.batch.flags   =', invoiceBatch.map(r => r.valid).join(','))
expect('batch validation preserves keyword behavior',
  invoiceBatch.map(r => r.valid).join(',') === 'true,false,false')

// ============================================================
// 8. Duplicate registration — addKeyword surfaces AJV errors
// ============================================================

let duplicateError = ''
try {
  validator.addKeyword('isEven', {
    type: 'number',
    validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0,
  })
} catch (err) {
  duplicateError = err instanceof Error ? err.message : String(err)
}

console.log('add-keyword.duplicate    =', duplicateError)
expect('duplicate keyword registration throws', duplicateError.includes("Failed to add keyword 'isEven'"))
