import { s, validate, ObjectDslBuilder, type DslDefinition, type JSONSchema } from '../../dist/pure.js'

function objectDsl(definition: DslDefinition): ObjectDslBuilder {
  return new ObjectDslBuilder(s(definition) as JSONSchema)
}

// ============================================================
// ObjectDslBuilder — public chainable wrapper for object-form DSL schemas
//
// Provides a chainable API to configure an object schema:
//   .strict()       — disallow extra properties
//   .requireAll()   — mark all top-level properties as required
//   .toSchema()     — emit the final JSONSchema object
//   .toJsonSchema() — alias for toSchema()
// ============================================================

// ============================================================
// 1. Basic usage — wrap s(object) in ObjectDslBuilder
// ============================================================

const builder = objectDsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'integer:0-150',
})

// Call .toSchema() to get the raw JSON Schema
const schema = builder.toSchema()
console.log('object-dsl-builder.schema.type       =', (schema as any).type)            // 'object'
console.log('object-dsl-builder.schema.properties =',
  typeof (schema as any).properties)                                                    // 'object'

// ============================================================
// 2. .strict() — set additionalProperties: false
// ============================================================

const strictSchema = objectDsl({
  name:  'string:2-50!',
  email: 'email!',
}).strict().toSchema()

// Extra property → invalid in strict mode
console.log('object-dsl-builder.strict.extra.invalid =',
  validate(strictSchema as any, { name: 'Alice', email: 'alice@example.com', role: 'admin' }).valid)  // false

// No extra properties → valid
console.log('object-dsl-builder.strict.clean.valid =',
  validate(strictSchema as any, { name: 'Alice', email: 'alice@example.com' }).valid)                 // true

// ============================================================
// 3. .requireAll() — add all properties to the required array
// ============================================================

const requiredSchema = objectDsl({
  name:    'string:2-50',   // note: no '!' marker — optional in DSL
  email:   'email',
  country: 'string:2-3',
}).requireAll().toSchema()

// All fields now required by requireAll()
console.log('object-dsl-builder.requireAll.missing.invalid =',
  validate(requiredSchema as any, { name: 'Alice', email: 'alice@example.com' }).valid)  // false — country missing
console.log('object-dsl-builder.requireAll.all.valid =',
  validate(requiredSchema as any, { name: 'Alice', email: 'alice@example.com', country: 'US' }).valid) // true

// ============================================================
// 4. Using '!' marker per-field to control required status
//    (DSL-level alternative to .requireAll())
// ============================================================

// Mark only the fields you need with '!' in the DSL string
const partiallyRequired = objectDsl({
  id:          'uuid!',         // required via DSL '!'
  displayName: 'string:1-50!', // required via DSL '!'
  email:       'email',         // optional — no '!'
  bio:         'string:500',    // optional — no '!'
}).toSchema()

console.log('object-dsl-builder.required.count =',
  (partiallyRequired as any).required?.length)  // 2  — only id and displayName

console.log('object-dsl-builder.required.id.missing =',
  validate(partiallyRequired as any, { displayName: 'Alice' }).valid)              // false — id missing
console.log('object-dsl-builder.required.both.valid =',
  validate(partiallyRequired as any, {
    id: '123e4567-e89b-12d3-a456-426614174000', displayName: 'Alice',
  }).valid)                                                                         // true

// ============================================================
// 5. Combining .strict() + .requireAll() + DSL '!' marker
// ============================================================

// All fields required by .requireAll(); extra properties forbidden by .strict()
const strictFullSchema = objectDsl({
  name:  'string:2-50',
  email: 'email',
  role:  'admin|user|guest',
}).strict().requireAll().toSchema()

console.log('object-dsl-builder.strictFull.extra =',
  validate(strictFullSchema as any, {
    name: 'Alice', email: 'alice@example.com', role: 'admin', extra: 'x',
  }).valid)  // false — extra field forbidden

console.log('object-dsl-builder.strictFull.clean =',
  validate(strictFullSchema as any, {
    name: 'Alice', email: 'alice@example.com', role: 'admin',
  }).valid)  // true

// ============================================================
// 6. .toJsonSchema() — alias for .toSchema()
// ============================================================

const jsonSchema = objectDsl({ id: 'uuid!', value: 'string!' }).toJsonSchema()
console.log('object-dsl-builder.toJsonSchema.type =', (jsonSchema as any).type)     // 'object'

// ============================================================
// 7. Chaining all methods together
// ============================================================

const apiInputSchema = objectDsl({
  name:        'string:2-100',
  email:       'email',
  phone:       'phone:cn',
  company:     'string:2-100',
  plan:        'free|pro|enterprise',
  referralCode: 'alphanum:6-12',
})
  .strict()                              // no extra fields
  .requireAll()                          // all fields required
  .toSchema()

console.log('object-dsl-builder.chain.strict       =',
  (apiInputSchema as any).strictSchema)                                                       // true
console.log('object-dsl-builder.chain.requiredAll  =',
  (apiInputSchema as any).requiredAll)                                                        // true

// Valid input (all required, no extras)
console.log('object-dsl-builder.chain.valid =',
  validate(apiInputSchema as any, {
    name: 'Alice Chen', email: 'alice@acme.com', phone: '13800138000',
    company: 'Acme Corp', plan: 'pro', referralCode: 'FRIEND1',
  }).valid)  // true

// Missing field
console.log('object-dsl-builder.chain.missing =',
  validate(apiInputSchema as any, {
    name: 'Alice Chen', email: 'alice@acme.com',
  }).valid)  // false — phone/company/plan/referralCode missing

// ============================================================
// 8. Passing ObjectDslBuilder directly to validate()
//    (automatically resolved via .toSchema() internally)
// ============================================================

const rawBuilder = objectDsl({
  username: 'string:3-32!',
  score:    'integer:0-100',
})

// validate() accepts ObjectDslBuilder directly — calls .toSchema() internally
const directResult = validate(rawBuilder as any, { username: 'bob', score: 85 })
console.log('object-dsl-builder.direct.valid   =', directResult.valid)  // true
console.log('object-dsl-builder.direct.invalid =',
  validate(rawBuilder as any, { username: 'x', score: 200 }).valid)      // false

// ============================================================
// 9. Practical: API endpoint request body validation
// ============================================================

function validateCreateUser(body: unknown): { ok: boolean; data?: unknown; errors?: string[] } {
  const schema = objectDsl({
    username: 'string:3-32',
    email:    'email',
    password: 'string:8-64',
    role:     'customer|seller',
  }).strict().requireAll().toSchema()

  const result = validate(schema as any, body, { allErrors: true })
  if (result.valid) {
    return { ok: true, data: result.data }
  }
  return { ok: false, errors: result.errors?.map(e => String(e.message)) ?? [] }
}

const okResult = validateCreateUser({
  username: 'alice', email: 'alice@example.com', password: 'Passw0rd!', role: 'customer',
})
console.log('object-dsl-builder.api.ok            =', okResult.ok)            // true

const failResult = validateCreateUser({ username: 'x', email: 'bad' })
console.log('object-dsl-builder.api.fail.ok        =', failResult.ok)         // false
console.log('object-dsl-builder.api.fail.errors    =', (failResult.errors?.length ?? 0) >= 1) // true

// Using s({...}) as shorthand — functionally equivalent
const schemaViaShorthand = s({
  productId: 'uuid!',
  quantity:  'integer:1-999!',
  price:     'number:0.01-!',
})
console.log('object-dsl-builder.s.shorthand.type =', typeof schemaViaShorthand)  // 'object'
