import { dsl, validate, Validator, SchemaUtils } from '../../dist/index.js'

// ============================================================
// SchemaUtils — schema composition, transformation, and performance
//
// Static methods:
//   reusable(factory)           — create a reusable field factory
//   createLibrary(fragments)    — named field library
//   extend(base, extensions)    — inherit + add fields
//   pick(schema, fields[])      — keep only listed fields
//   omit(schema, fields[])      — exclude listed fields
//   partial(schema, fields?)    — make fields optional
//   clone(schema)               — deep clone
//   withPerformance(validator)  — wrap validator with timing
//   validateBatch(schema, data[], ajv) → { results, summary }
// ============================================================

// ============================================================
// 1. reusable() + createLibrary() — field fragments
// ============================================================

const fields = SchemaUtils.createLibrary({
  email:    () => dsl('email!').label('Email').error({ required: 'Email is required' }),
  username: () => dsl('string:3-32!').label('Username').pattern(/^[a-zA-Z0-9_]+$/),
  password: () => dsl('string:8-64!').label('Password'),
  phone:    () => dsl('string').label('Phone'),
})

// Each call returns a fresh builder — safe to reuse
const schema1 = dsl({ email: fields.email(), username: fields.username() })
const schema2 = dsl({ email: fields.email(), phone: fields.phone() })

console.log('schema-utils.library.schema1.valid =',
  validate(schema1, { email: 'a@b.com', username: 'alice_99' }).valid)   // true
console.log('schema-utils.library.schema2.valid =',
  validate(schema2, { email: 'a@b.com', phone: '123' }).valid)           // true

// ============================================================
// 2. extend() — inherit base schema fields
// ============================================================

const baseEntitySchema = dsl({
  id:        'objectId!',
  createdAt: 'date',
  updatedAt: 'date',
})

const userSchema = SchemaUtils.extend(baseEntitySchema, dsl({
  username: fields.username(),
  email:    fields.email(),
  role:     dsl('admin|user|guest').default('user'),
}))

const r1 = validate(userSchema, {
  id:        '507f1f77bcf86cd799439011',
  createdAt: '2024-01-01',
  updatedAt: '2024-06-01',
  username:  'alice_99',
  email:     'alice@example.com',
})
console.log('schema-utils.extend.valid          =', r1.valid)   // true
console.log('schema-utils.extend.hasId          =',
  'id' in ((userSchema as any).properties ?? {}))               // true

// ============================================================
// 3. pick() — build a subset schema
// ============================================================

const publicProfileSchema = SchemaUtils.pick(userSchema, ['username', 'email'])
const r2 = validate(publicProfileSchema, { username: 'alice_99', email: 'alice@example.com' })
console.log('schema-utils.pick.valid            =', r2.valid)   // true

// Extra fields stripped from required
const r3 = validate(publicProfileSchema, { username: 'alice_99', email: 'alice@example.com', id: 'extra' })
console.log('schema-utils.pick.extraIgnored     =', r3.valid)   // true

// ============================================================
// 4. omit() — remove sensitive or internal fields
// ============================================================

const safeSchema = SchemaUtils.omit(userSchema, ['id', 'createdAt', 'updatedAt'])
const r4 = validate(safeSchema, { username: 'bob_42', email: 'bob@example.com' })
console.log('schema-utils.omit.valid            =', r4.valid)   // true
console.log('schema-utils.omit.noId             =',
  !('id' in ((safeSchema as any).properties ?? {})))             // true

// ============================================================
// 5. partial() — make all fields optional (PATCH request body)
// ============================================================

const patchSchema = SchemaUtils.partial(userSchema)
const r5 = validate(patchSchema, {})   // empty body is valid
console.log('schema-utils.partial.emptyValid    =', r5.valid)   // true

const r6 = validate(patchSchema, { email: 'alice@example.com' })
console.log('schema-utils.partial.singleField   =', r6.valid)   // true

// ============================================================
// 6. clone() — independent deep copy
// ============================================================

const original = dsl({ name: 'string!', age: 'integer' })
const cloned   = SchemaUtils.clone(original)
console.log('schema-utils.clone.independent     =', cloned !== original)          // true
console.log('schema-utils.clone.stillValid      =',
  validate(cloned, { name: 'Alice', age: 30 }).valid)                              // true

// ============================================================
// 7. withPerformance() — time validation calls
// ============================================================

const validator = SchemaUtils.withPerformance(new Validator() as any) as Validator & {
  validate: (...a: any[]) => any
}
const perfResult = validator.validate(userSchema, {
  id:       '507f1f77bcf86cd799439011',
  username: 'perf_test',
  email:    'perf@example.com',
})
console.log('schema-utils.perf.valid            =', perfResult.valid)          // true

// ============================================================
// 8. validateBatch() — bulk validation via raw AJV instance
// ============================================================

const bv = new Validator({ allErrors: true, coerceTypes: true })
const batchOut = SchemaUtils.validateBatch(
  schema1,
  [
    { email: 'a@b.com', username: 'alice_99' },      // valid
    { email: 'bad',     username: 'x'        },      // invalid (2 errors)
    { email: 'c@d.com', username: 'carol_55' },      // valid
  ],
  bv.getAjv(),
)

console.log('schema-utils.batch.total           =', batchOut.summary.total)    // 3
console.log('schema-utils.batch.valid           =', batchOut.summary.valid)    // 2
console.log('schema-utils.batch.invalid         =', batchOut.summary.invalid)  // 1