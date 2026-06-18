import { DslBuilder, s, validate } from '../../dist/pure.js'

// Register a custom type used in later examples
DslBuilder.clearCustomTypes()
DslBuilder.registerType('order-id', {
  type: 'string',
  pattern: '^ORD[0-9]{12}$',
  minLength: 15,
  maxLength: 15,
} as any)

// ============================================================
// 1. Basic union with '|' — string or number aliases
// ============================================================

// Pipe-separated DSL is a string-value enum (not a type union)
const statusSchema = s({ status: 'active|inactive|pending!' })
console.log('union-types.pipe.active  =', validate(statusSchema, { status: 'active' }).valid)   // true
console.log('union-types.pipe.missing =', validate(statusSchema, { status: 'gone' }).valid)     // false

// ============================================================
// 2. types: prefix — true type union (oneOf-based)
// ============================================================

// A field that accepts either a string or a number
const flexSchema = s({ value: 'types:string:3-10|number:0-100!' })
const rawFlex = ((flexSchema as any).toSchema?.() ?? flexSchema) as any

console.log('union-types.types.oneOf.count =', rawFlex.properties.value.oneOf?.length)  // 2
console.log('union-types.types.string.valid =',
  validate(flexSchema, { value: 'hello' }).valid)     // true — valid string
console.log('union-types.types.number.valid =',
  validate(flexSchema, { value: 42 }).valid)          // true — valid number
console.log('union-types.types.string.toolong =',
  validate(flexSchema, { value: 'too-long-value' }).valid)  // false — string exceeds max 10
console.log('union-types.types.number.toolarge =',
  validate(flexSchema, { value: 200 }).valid)         // false — number > 100
console.log('union-types.types.boolean.invalid =',
  validate(flexSchema, { value: true }).valid)        // false — boolean not in union

// ============================================================
// 3. Built-in type union — uuid or custom order-id
// ============================================================

const identifierSchema = s({ id: 'types:uuid|order-id!' })

console.log('union-types.custom.uuid.valid =',
  validate(identifierSchema, { id: '123e4567-e89b-12d3-a456-426614174000' }).valid)  // true
console.log('union-types.custom.orderId.valid =',
  validate(identifierSchema, { id: 'ORD202401010001' }).valid)                        // true
console.log('union-types.custom.invalid =',
  validate(identifierSchema, { id: 'BAD_VALUE' }).valid)                              // false

// ============================================================
// 4. Nested object with union fields
// ============================================================

const eventSchema = s({
  id:        'types:uuid|order-id!',
  payload:   'types:string:1-500|object!',       // can be raw string or structured object
  timestamp: 'types:datetime|number:0-!',        // ISO string or Unix epoch
  severity:  'types:integer:1-3|string:1-10',   // numeric level or named severity
})

console.log('union-types.nested.strPayload =',
  validate(eventSchema, {
    id:        '123e4567-e89b-12d3-a456-426614174000',
    payload:   'Something happened',
    timestamp: '2025-01-15T10:30:00Z',
    severity:  2,
  }).valid)  // true

console.log('union-types.nested.objPayload =',
  validate(eventSchema, {
    id:        'ORD202401010001',
    payload:   { code: 500, detail: 'Server Error' },
    timestamp: 1705315800000,
    severity:  'critical',
  }).valid)  // true

// ============================================================
// 5. Array of union types
// ============================================================

const mixedListSchema = s({
  items: 'array<types:string:1-50|integer:0->!',
})

console.log('union-types.array.strings =',
  validate(mixedListSchema, { items: ['alpha', 'beta', 'gamma'] }).valid)  // true
console.log('union-types.array.numbers =',
  validate(mixedListSchema, { items: [1, 2, 3] }).valid)                   // true
console.log('union-types.array.mixed =',
  validate(mixedListSchema, { items: ['alpha', 42, 'gamma'] }).valid)      // true — mixed OK
console.log('union-types.array.invalid =',
  validate(mixedListSchema, { items: [true, null] }).valid)                // false

// ============================================================
// 6. Union field with custom error message
// ============================================================

const paymentSchema = s({
  amount: s('types:integer:1-|number:0.01-!')
    .label('Payment Amount')
    .error({ oneOf: 'Amount must be a positive integer or decimal number' }),
})

const paymentResult = validate(paymentSchema, { amount: 'free' })
console.log('union-types.custom.error.valid   =', paymentResult.valid)             // false
console.log('union-types.custom.error.message =', paymentResult.errors?.[0]?.message)

// ============================================================
// 7. Optional union type with default
// ============================================================

const configSchema = s({
  timeout: s('types:integer:100-60000|string:1-10').default(5000),
  retries: s('types:integer:0-10|string:1-5').default(3),
})

const withDefaults = validate(configSchema, {}, { useDefaults: true })
console.log('union-types.defaults.timeout =', (withDefaults.data as any)?.timeout)  // 5000
console.log('union-types.defaults.retries =', (withDefaults.data as any)?.retries)  // 3

// Cleanup
DslBuilder.clearCustomTypes()