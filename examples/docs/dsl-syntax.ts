import { s, validate, validateAsync, ValidationError } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`dsl-syntax expectation failed: ${label}`)
}

// ============================================================
// 1. Primitive types — all base types
// ============================================================

const primitives = s({
  name:     'string',   // optional string (any length)
  count:    'number',   // optional number (float or int)
  qty:      'integer',  // optional integer (whole numbers only)
  active:   'boolean',  // optional boolean
  meta:     'object',   // optional plain object
  list:     'array',    // optional array (any items)
  empty:    'null',     // must be null
  anything: 'any',      // any value, no constraints
})
console.log('dsl-syntax.primitives.valid =',
  validate(primitives, {
    name: 'Alice', count: 3.14, qty: 42, active: true,
    meta: {}, list: [1, 2], empty: null, anything: { x: 1 },
  }).valid)
expect('primitive schema accepts valid data', validate(primitives, {
  name: 'Alice', count: 3.14, qty: 42, active: true,
  meta: {}, list: [1, 2], empty: null, anything: { x: 1 },
}).valid)

// ============================================================
// 2. Required (!) and optional (?) markers
// ============================================================

const markers = s({
  must:   'string!',   // required — validation fails when absent
  may:    'string',    // optional by default — absence is fine
  also:   'string?',   // explicitly optional (same as above)
})

console.log('dsl-syntax.markers.missing.valid =',  validate(markers, {}).valid)        // false
console.log('dsl-syntax.markers.present.valid =',  validate(markers, { must: 'hi' }).valid) // true
expect('required marker rejects missing value', validate(markers, {}).valid === false)

// ============================================================
// 3. String constraints — exact length, range, one-sided
// ============================================================

const strings = s({
  pin:      'string:6',       // exactly 6 characters
  username: 'string:3-20!',   // 3 to 20 characters, required
  bio:      'string:0-500',   // up to 500 characters
  minOnly:  'string:2-',      // at least 2 characters
})

console.log('dsl-syntax.strings.valid =',
  validate(strings, { pin: '123456', username: 'alice', bio: '', minOnly: 'ok' }).valid)
console.log('dsl-syntax.strings.pin.tooShort =',
  validate(strings, { username: 'alice', pin: '12' }).valid) // false

// ============================================================
// 4. Number / integer constraints
// ============================================================

const numbers = s({
  age:      'integer:18-120',   // integer in [18, 120]
  price:    'number:0.01-',     // any positive float
  score:    'number:0-100',     // 0–100 inclusive
  negative: 'number:-100-0',   // –100 to 0
})

console.log('dsl-syntax.numbers.valid =',
  validate(numbers, { age: 25, price: 9.99, score: 92.5, negative: -50 }).valid)
console.log('dsl-syntax.numbers.age.outOfRange =',
  validate(numbers, { age: 17 }).valid) // false — below 18

// ============================================================
// 5. Enum types — pipe-separated values
// ============================================================

const enums = s({
  status:   'active|inactive|pending',          // string enum
  role:     'admin|user|guest!',                // required string enum
  priority: 'enum:number:1|2|3',               // numeric enum
  flag:     'enum:boolean:true|false',          // boolean enum
})

console.log('dsl-syntax.enum.valid =',
  validate(enums, { role: 'admin', status: 'active', priority: 2, flag: true }).valid)
console.log('dsl-syntax.enum.invalid.role =',
  validate(enums, { role: 'superadmin', priority: 5, flag: 'yes' }).valid) // false

// ============================================================
// 6. Array types — typed items and length constraints
// ============================================================

const arrays = s({
  any:      'array',                    // any items
  strings:  'array<string>',            // array of strings
  nums:     'array<integer:1->',        // array of positive integers
  tags:     'array:1-5<string:1-20>',   // 1–5 items, each 1–20 chars
  required: 'array<email>!',            // required array of emails
  choices:  'array<draft|review|done>', // array of enum strings
})

console.log('dsl-syntax.arrays.valid =',
  validate(arrays, {
    any: [1, 'a'],
    strings: ['hello'],
    nums: [1, 2, 3],
    tags: ['ts', 'schema'],
    required: ['a@b.com'],
    choices: ['draft', 'done'],
  }).valid)
console.log('dsl-syntax.arrays.tags.overflow =',
  validate(arrays, { tags: ['a','b','c','d','e','f'], required: ['x@y.com'] }).valid) // false
expect('array overflow is rejected', validate(arrays, { tags: ['a','b','c','d','e','f'], required: ['x@y.com'] }).valid === false)

const advancedArrays = {
  type: 'object',
  properties: {
    matrix: s('array<array<number>>').toJsonSchema(),
    users: s.array({
      name: 'string:1-32!',
      age: 'integer:0-120',
    }).min(1).toSchema(),
  },
}

console.log('dsl-syntax.arrays.matrix =',
  validate(advancedArrays, {
    matrix: [[1, 2], [3, 4]],
    users: [{ name: 'Alice', age: 28 }],
  }).valid)
console.log('dsl-syntax.arrays.object.invalid =',
  validate(advancedArrays, { matrix: [[1]], users: [{ name: '' }] }).valid)
expect('full object-array schema validates nested records',
  validate(advancedArrays, { matrix: [[1, 2]], users: [{ name: 'Alice', age: 28 }] }).valid)

// ============================================================
// 7. Union types — value can be one of several types
// ============================================================

const unions = s({
  id:    'types:string:1-36|integer:1-',     // string OR positive integer
  value: 'types:string:1-10|number:0-100',   // short string OR number in range
})

console.log('dsl-syntax.union.string =',  validate(unions, { id: 'abc-123', value: 'hello' }).valid)
console.log('dsl-syntax.union.number =',  validate(unions, { id: 42, value: 50 }).valid)
console.log('dsl-syntax.union.invalid =', validate(unions, { id: -1, value: true }).valid) // false
expect('union rejects values outside every branch', validate(unions, { id: -1, value: true }).valid === false)

// ============================================================
// 8. Nested objects
// ============================================================

const nested = s({
  user: {
    name: 'string:2-50!',
    contact: {
      email: 'email!',
      phone: 'string:10-15',
    },
    prefs: {
      theme: 'light|dark',
      lang:  'en|zh|ja',
    },
  },
})

console.log('dsl-syntax.nested.valid =',
  validate(nested, {
    user: {
      name: 'Alice',
      contact: { email: 'alice@example.com', phone: '13800138000' },
      prefs:   { theme: 'dark', lang: 'en' },
    },
  }).valid)

// ============================================================
// 9. DslBuilder chain methods — composable constraints
// ============================================================

const chainSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-z0-9_]+$/)
    .label('Username')
    .description('Lowercase letters, digits and underscores')
    .error({ pattern: 'Username: only a-z, 0-9 and _ allowed' }),

  password: s('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .label('Password')
    .error({ pattern: 'Must contain upper, lower, digit and special char' }),

  bio: s('string:0-200')
    .optional()
    .default('')
    .description('Short profile bio'),

  score: s('number:0-100').default(0).label('User score'),
})

const chainValid   = validate(chainSchema, { username: 'alice_01', password: 'Alice123@' })
const chainInvalid = validate(chainSchema, { username: 'Alice 01', password: 'short' })

console.log('dsl-syntax.chain.valid =',          chainValid.valid)
console.log('dsl-syntax.chain.bio.default =',    (chainValid.data as Record<string, unknown>)?.bio) // ''
console.log('dsl-syntax.chain.invalid.valid =',  chainInvalid.valid)
console.log('dsl-syntax.chain.invalid.errors =', chainInvalid.errors?.map(e => `${e.path}:${e.keyword}`))
expect('chain schema applies defaults', (chainValid.data as Record<string, unknown>)?.bio === '')
expect('chain schema rejects invalid username/password', chainInvalid.valid === false)

const syncCustomSchema = s({
  username: s('string:3-32!')
    .custom(value => value !== 'admin' || 'Reserved username'),
})
console.log('dsl-syntax.custom.sync.valid =',
  validate(syncCustomSchema, { username: 'alice' }).valid)
console.log('dsl-syntax.custom.sync.invalid =',
  validate(syncCustomSchema, { username: 'admin' }).valid)
expect('sync custom validator rejects reserved value',
  validate(syncCustomSchema, { username: 'admin' }).valid === false)

const asyncCustomSchema = s({
  email: s('email!').custom(async value =>
    value !== 'taken@example.com' || 'Email already exists'),
})

let asyncCustomRejected = false
try {
  await validateAsync(asyncCustomSchema, { email: 'taken@example.com' })
} catch (err) {
  if (err instanceof ValidationError) asyncCustomRejected = err.hasFieldError('email')
}
console.log('dsl-syntax.custom.async.invalid =', asyncCustomRejected)
expect('async custom validator requires validateAsync', asyncCustomRejected)

// ============================================================
// 10. Conditional fields — s.if and s.match
// ============================================================

// s.if(fieldName, thenSchema, elseSchema)
// When the named field is truthy, use thenSchema; else use elseSchema
const subscriptionSchema = s({
  premium: 'boolean!',
  maxDownloads: s.if('premium', 'integer:0-', 'integer:0-5'),
  badge:        s.if('premium', 'string:1-20'),
})

console.log('dsl-syntax.if.premium.true =',
  validate(subscriptionSchema, { premium: true, maxDownloads: 999, badge: 'Gold' }).valid)
console.log('dsl-syntax.if.premium.false.underLimit =',
  validate(subscriptionSchema, { premium: false, maxDownloads: 3 }).valid)
console.log('dsl-syntax.if.premium.false.overLimit =',
  validate(subscriptionSchema, { premium: false, maxDownloads: 10 }).valid) // false
expect('s.if rejects false branch over limit',
  validate(subscriptionSchema, { premium: false, maxDownloads: 10 }).valid === false)

// s.match(fieldName, { value: schema, ... })
// Selects the schema based on the value of the named field
const contactSchema = s({
  type:  'email|phone!',
  value: s.match('type', {
    email: 'email!',
    phone: 'phone:cn!',
  }),
})

console.log('dsl-syntax.match.email =',
  validate(contactSchema, { type: 'email', value: 'user@example.com' }).valid)
console.log('dsl-syntax.match.phone =',
  validate(contactSchema, { type: 'phone', value: '13800138000' }).valid)
console.log('dsl-syntax.match.mismatch =',
  validate(contactSchema, { type: 'email', value: '13800138000' }).valid)
expect('s.match rejects branch mismatch',
  validate(contactSchema, { type: 'email', value: '13800138000' }).valid === false)
