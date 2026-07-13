import { s, validate } from '../../dist/pure.js'

// ============================================================
// JSON Schema basics — toSchema() vs toJsonSchema()
//
// toSchema()     → returns the internal representation (may include
//                  _label, _customMessages, etc.) — for library internals
// toJsonSchema() → strips all private _* fields — for external consumers
//                  (exporters, documentation, OpenAPI, etc.)
// ============================================================

// ============================================================
// 1. Field-level difference
// ============================================================

const emailField = s('email!')
  .label('Email Address')
  .description('Primary contact email')
  .error({ required: 'Email is required' })

const rawFieldSchema    = (emailField as any).toSchema() as any
const cleanFieldSchema  = emailField.toJsonSchema() as any

// Raw keeps internal tracking fields
console.log('json-schema-basics.raw.label    =', rawFieldSchema._label)          // 'Email Address'
console.log('json-schema-basics.raw.messages =', typeof rawFieldSchema._customMessages)  // 'object'

// Clean has no private keys
const privateKeys = ['_label', '_customMessages', '_description']
console.log('json-schema-basics.clean.pure   =',
  privateKeys.every(k => !(k in cleanFieldSchema)))   // true

// Standard JSON Schema properties are present in both
console.log('json-schema-basics.clean.type   =', cleanFieldSchema.type)         // 'string'
console.log('json-schema-basics.clean.format =', cleanFieldSchema.format)       // 'email'
console.log('json-schema-basics.clean.desc   =', cleanFieldSchema.description)  // 'Primary contact email'

// ============================================================
// 2. Object schema — required array and properties
// ============================================================

const userSchema = s({
  email: s('email!').label('Email'),
  age:   s('integer:18-100').label('Age'),
  bio:   s('string:500').label('Bio'),
}) as any

console.log('json-schema-basics.obj.type     =', userSchema.type)            // 'object'
console.log('json-schema-basics.obj.required =',
  (userSchema.required as string[]).sort().join(','))                          // 'email'
console.log('json-schema-basics.obj.keys     =',
  Object.keys(userSchema.properties ?? {}).sort().join(','))                   // 'age,bio,email'

// ============================================================
// 3. Primitive string schema structure
// ============================================================

const usernameSchema = s('string:3-32!').toJsonSchema() as any

console.log('json-schema-basics.str.type     =', usernameSchema.type)         // 'string'
console.log('json-schema-basics.str.minLen   =', usernameSchema.minLength)    // 3
console.log('json-schema-basics.str.maxLen   =', usernameSchema.maxLength)    // 32

// ============================================================
// 4. Number/integer schema structure
// ============================================================

const ageSchema = s('integer:0-150').toJsonSchema() as any

console.log('json-schema-basics.int.type     =', ageSchema.type)   // 'integer'
console.log('json-schema-basics.int.min      =', ageSchema.minimum) // 0
console.log('json-schema-basics.int.max      =', ageSchema.maximum) // 150

// ============================================================
// 5. Array schema structure
// ============================================================

const tagsSchema = s('array<string:1-50>').toJsonSchema() as any

console.log('json-schema-basics.arr.type     =', tagsSchema.type)             // 'array'
console.log('json-schema-basics.arr.items    =', tagsSchema.items?.type)      // 'string'

// ============================================================
// 6. Draft 7 baseline with contains range extension
// ============================================================

const containsRangeSchema = {
  type: 'array' as const,
  contains: { type: 'number' as const },
  minContains: 2,
  maxContains: 3,
}

const containsRangeValid = validate(containsRangeSchema, [1, 'x', 2])
const containsRangeInvalid = validate(containsRangeSchema, [1, 'x'])

console.log('json-schema-basics.contains.valid   =', containsRangeValid.valid)    // true
console.log('json-schema-basics.contains.invalid =', containsRangeInvalid.valid)  // false

if (!containsRangeValid.valid || containsRangeInvalid.valid) {
  throw new Error('contains range validation contract drifted')
}

// ============================================================
// 7. Validation works with either the builder or the JSON Schema
// ============================================================

const r1 = validate(emailField, 'hello@example.com')
const r2 = validate(cleanFieldSchema, 'hello@example.com')

console.log('json-schema-basics.validate.builder =', r1.valid)      // true
console.log('json-schema-basics.validate.schema  =', r2.valid)      // true
