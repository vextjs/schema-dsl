import { SchemaUtils, dsl, validate } from '../../dist/index.js'

// ============================================================
// Best practices — reusable field library, composable schemas,
// environment-aware configuration
// ============================================================

// ============================================================
// 1. Create a shared field library (single source of truth)
// ============================================================

const fields = SchemaUtils.createLibrary({
  username: () =>
    dsl('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('Username')
      .error({ pattern: 'Username may only contain letters, digits and underscores' }),

  email: () =>
    dsl('email!')
      .label('Email Address')
      .error({ required: 'Email address is required' }),

  password: () =>
    dsl('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('Password')
      .error({ pattern: 'Password must be at least 8 chars and include letters and numbers' }),

  displayName: () =>
    dsl('string:2-48')
      .label('Display Name'),

  website: () =>
    dsl('url')
      .label('Website'),
})

// ============================================================
// 2. Compose schemas from the library
// ============================================================

const registerSchema = dsl({
  username:    fields.username(),
  email:       fields.email(),
  password:    fields.password(),
  displayName: fields.displayName(),
})

const loginSchema = dsl({
  username: 'string!',
  password: 'string!',
})

const profileSchema = dsl({
  displayName: fields.displayName(),
  email:       fields.email(),
  website:     fields.website(),
})

// ============================================================
// 3. Validate register form
// ============================================================

const regValid = validate(registerSchema, {
  username:    'demo_user',
  email:       'demo@example.com',
  password:    'Pass2026A',
  displayName: 'Demo User',
})

const regInvalid = validate(registerSchema, {
  username: 'bad user',
  email:    'bad',
  password: 'short',
})

console.log('best-practices.register.valid      =', regValid.valid)    // true
console.log('best-practices.register.invalid    =', regInvalid.valid)  // false
console.log('best-practices.register.errorCount =',
  (regInvalid.errors?.length ?? 0) >= 3)  // true — 3+ fields fail

// ============================================================
// 4. Validate login (minimal schema)
// ============================================================

console.log('best-practices.login.valid         =',
  validate(loginSchema, { username: 'demo_user', password: 'Pass2026A' }).valid)  // true

console.log('best-practices.login.missingPass   =',
  validate(loginSchema, { username: 'demo_user' }).valid)  // false

// ============================================================
// 5. Validate profile update
// ============================================================

const profResult = validate(profileSchema, {
  displayName: 'Rocky Dev',
  email:       'rocky@example.com',
  website:     'https://rocky.dev',
})

console.log('best-practices.profile.valid       =', profResult.valid)  // true

// ============================================================
// 6. Field library returns NEW builder each call (no shared state)
// ============================================================

const a = fields.username()
const b = fields.username()

a.label('A Username')
b.label('B Username')

const schemaA = a.toJsonSchema()
const schemaB = b.toJsonSchema()

console.log('best-practices.library.isolated    =',
  schemaA._label !== schemaB._label)  // true — independent builders