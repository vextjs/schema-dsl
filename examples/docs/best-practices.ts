import { SchemaUtils, Validator, s, validate } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`best-practices expectation failed: ${label}`)
}

// ============================================================
// Best practices — reusable field library, composable schemas,
// environment-aware configuration
// ============================================================

// ============================================================
// 1. Create a shared field library (single source of truth)
// ============================================================

const fields = SchemaUtils.createLibrary({
  username: () =>
    s('string:3-32!')
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('Username')
      .error({ pattern: 'Username may only contain letters, digits and underscores' }),

  email: () =>
    s('email!')
      .label('Email Address')
      .error({ required: 'Email address is required' }),

  password: () =>
    s('string:8-64!')
      .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
      .label('Password')
      .error({ pattern: 'Password must be at least 8 chars and include letters and numbers' }),

  displayName: () =>
    s('string:2-48')
      .label('Display Name'),

  website: () =>
    s('url')
      .label('Website'),
})

// ============================================================
// 2. Compose schemas from the library
// ============================================================

const registerSchema = s({
  username:    fields.username(),
  email:       fields.email(),
  password:    fields.password(),
  displayName: fields.displayName(),
})

const loginSchema = s({
  username: 'string!',
  password: 'string!',
})

const profileSchema = s({
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
expect('register accepts valid data', regValid.valid)
expect('register rejects invalid data', regInvalid.valid === false)

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

a.default('alpha_user')
b.default('beta_user')

const schemaA = a.toJsonSchema()
const schemaB = b.toJsonSchema()

console.log('best-practices.library.isolated    =',
  schemaA.default !== schemaB.default)  // true — independent builders
expect('field factory returns isolated builders', schemaA.default !== schemaB.default)

// ============================================================
// 7. Precompile hot-path schemas and inspect cache behavior
// ============================================================

const productionValidator = new Validator({
  allErrors: true,
  cache: { maxSize: 128, statsEnabled: true },
})

const validateRegister = productionValidator.compile(registerSchema, 'register-form')
const hotPathValid = validateRegister({
  username: 'hot_path',
  email: 'hot@example.com',
  password: 'Pass2026A',
  displayName: 'Hot Path',
})
const hotPathInvalid = validateRegister({ username: 'x', email: 'bad', password: 'short' })

console.log('best-practices.hotPath.valid       =', hotPathValid)
console.log('best-practices.hotPath.invalid     =', hotPathInvalid)
console.log('best-practices.hotPath.errors      =', validateRegister.errors?.length ?? 0)
expect('precompiled validator accepts valid input', hotPathValid === true)
expect('precompiled validator rejects invalid input', hotPathInvalid === false)

// ============================================================
// 8. Batch import: compile once, validate every record
// ============================================================

const importRows = [
  { username: 'alice_01', email: 'alice@example.com', password: 'Pass2026A' },
  { username: 'root', email: 'root@example.com', password: 'Pass2026A' },
  { username: 'bad user', email: 'bad', password: 'short' },
]

const importResults = productionValidator.validateBatch(registerSchema, importRows)
const importSummary = {
  total: importResults.length,
  valid: importResults.filter(item => item.valid).length,
  invalid: importResults.filter(item => !item.valid).length,
}

console.log('best-practices.batch.summary       =', importSummary)
expect('batch import keeps all rows', importSummary.total === 3)
expect('batch import reports one invalid row', importSummary.invalid === 1)

// ============================================================
// 9. Derive schemas for create/update/public views
// ============================================================

const accountBaseSchema = s({
  username: fields.username(),
  email: fields.email(),
  displayName: fields.displayName(),
})

const accountCreateSchema = SchemaUtils.extend(accountBaseSchema, s({
  password: fields.password(),
}))
const accountUpdateSchema = SchemaUtils.partial(accountCreateSchema)
const accountPublicSchema = SchemaUtils.omit(accountCreateSchema, ['password'])

const createOk = validate(accountCreateSchema, {
  username: 'derived_user',
  email: 'derived@example.com',
  password: 'Pass2026A',
})
const updateOk = validate(accountUpdateSchema, { displayName: 'Renamed User' })
const publicFields = Object.keys(accountPublicSchema.properties ?? {})

console.log('best-practices.derive.create       =', createOk.valid)
console.log('best-practices.derive.update       =', updateOk.valid)
console.log('best-practices.derive.publicFields =', publicFields)
expect('create derived schema validates password', createOk.valid)
expect('partial update schema allows one field', updateOk.valid)
expect('public schema omits password', !publicFields.includes('password'))

// ============================================================
// 10. Wrap validation with lightweight performance metadata
// ============================================================

const monitoredValidator = SchemaUtils.withPerformance(new Validator({ cache: false }) as any) as Validator
const monitoredResult = monitoredValidator.validate(registerSchema, {
  username: 'metric_user',
  email: 'metric@example.com',
  password: 'Pass2026A',
}) as typeof regValid & { performance?: { duration: number; timestamp: string } }

console.log('best-practices.performance.valid   =', monitoredResult.valid)
console.log('best-practices.performance.duration =', monitoredResult.performance?.duration)
expect('performance wrapper preserves validation result', monitoredResult.valid === true)
expect('performance wrapper adds duration', typeof monitoredResult.performance?.duration === 'number')

const cacheStats = productionValidator.getCacheStats()
console.log('best-practices.cache.stats         =', cacheStats.enabled, cacheStats.size)
expect('production validator cache is enabled', cacheStats.enabled)
