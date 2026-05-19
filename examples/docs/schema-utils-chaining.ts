import { dsl, validate, SchemaUtils } from '../../dist/index.js'

// ============================================================
// SchemaUtils chaining — compose schemas with transform chains
// ============================================================

// ============================================================
// 1. The base "god" schema — all fields defined once
// ============================================================

const baseSchema = dsl({
  id:        'objectId!',
  username:  dsl('string:3-32!').label('Username').pattern(/^[a-zA-Z0-9_]+$/),
  email:     dsl('email!').label('Email'),
  password:  dsl('string:8-32!').label('Password'),
  age:       dsl('integer:0-150').label('Age'),
  bio:       dsl('string:500').label('Bio'),
})

// ============================================================
// 2. Basic chain: omit → extend → pick → partial
// ============================================================

const publicProfileSchema = SchemaUtils
  .omit(baseSchema, ['password'])          // drop password
  .extend({ avatar: dsl('url').label('Avatar') })  // add avatar
  .pick(['username', 'email', 'avatar'])   // keep only three fields
  .partial()                               // make all optional

console.log('chaining.keys    =',
  Object.keys(publicProfileSchema.properties ?? {}).join(','))   // 'username,email,avatar'
console.log('chaining.req     =', publicProfileSchema.required)  // undefined (all optional)

// ============================================================
// 3. Multiple derived schemas from one base
// ============================================================

const createSchema = SchemaUtils.omit(baseSchema, ['id'])
const readSchema   = SchemaUtils.omit(baseSchema, ['password'])
const updateSchema = SchemaUtils.pick(baseSchema, ['username', 'email', 'bio']).partial()
const patchSchema  = SchemaUtils.partial(baseSchema)

// create requires username + email + password
console.log('chaining.create.valid   =',
  validate(createSchema, {
    username: 'alice_01', email: 'alice@example.com', password: 'secret123',
  }).valid)   // true

// read exposes id but not password
console.log('chaining.read.noPassword =',
  !('password' in (readSchema.properties ?? {})))   // true

// update is fully optional
console.log('chaining.update.req      =', updateSchema.required)   // undefined

// patch makes every field optional
console.log('chaining.patch.hasReq    =', !!patchSchema.required && patchSchema.required.length > 0)  // false

// ============================================================
// 4. Chain immutability — base schema is never modified
// ============================================================

const derived = SchemaUtils.omit(baseSchema, ['password'])

// Derived has fewer fields; base is unchanged
console.log('chaining.base.hasPassword  =', 'password' in (baseSchema.properties ?? {}))   // true
console.log('chaining.derived.noPass    =', !('password' in (derived.properties ?? {})))   // true
console.log('chaining.base !== derived  =', baseSchema !== derived)                         // true

// ============================================================
// 5. Validation with chained schema
// ============================================================

const profileValid = validate(publicProfileSchema, {
  username: 'bob',
  avatar:   'https://cdn.example.com/bob.png',
})
const profileInvalid = validate(publicProfileSchema, {
  email: 'not-an-email',
})
console.log('chaining.validate.valid    =', profileValid.valid)    // true
console.log('chaining.validate.invalid  =', profileInvalid.valid)  // false