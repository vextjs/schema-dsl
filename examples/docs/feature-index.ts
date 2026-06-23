import { s, validate, validateAsync, Validator, ValidationError, SchemaUtils, TypeConverter, MarkdownExporter, MongoDBExporter, MySQLExporter, PostgreSQLExporter, resetRuntimeState, type IDslBuilder } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`feature-index expectation failed: ${label}`)
}

// ============================================================
// Feature index — all major features in one file
// ============================================================

// ============================================================
// 1. DSL string types + chaining
// ============================================================

const userSchema = s({
  username: s('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/).label('Username'),
  email:    s('email!').label('Email Address'),
  role:     'admin|user|guest',
  score:    'number:>=0',
  tags:     'array:1-5<string:1-20>',
})

const validResult = validate(userSchema, {
  username: 'feature_user',
  email:    'feature@example.com',
  role:     'admin',
  score:    88,
  tags:     ['typescript', 'schema'],
})

console.log('feature-index.validate.valid             =', validResult.valid)  // true
expect('main user schema validates', validResult.valid)

// ============================================================
// 2. Validation errors — all fields at once
// ============================================================

const invalidResult = validate(userSchema, {
  username: 'bad user',
  email:    'not-an-email',
  role:     'owner',
  score:    -1,
})

console.log('feature-index.validate.invalid           =', invalidResult.valid)   // false
console.log('feature-index.validate.errorCount        =',
  (invalidResult.errors?.length ?? 0) >= 3)  // true
expect('main user schema rejects invalid input', invalidResult.valid === false)

// ============================================================
// 3. Validator instance — compile, batch, cache
// ============================================================

const featureValidator = new Validator({
  allErrors: true,
  cache: { maxSize: 64, statsEnabled: true },
})
const compiledUser = featureValidator.compile(userSchema, 'feature-index-user')
const compiledValid = compiledUser({
  username: 'compiled_user',
  email: 'compiled@example.com',
  role: 'user',
  score: 91,
  tags: ['docs'],
})
const batchUsers = featureValidator.validateBatch(userSchema, [
  { username: 'batch_one', email: 'one@example.com', role: 'user', score: 1, tags: ['one'] },
  { username: 'bad user', email: 'bad', role: 'owner', score: -1 },
])
const featureCache = featureValidator.getCacheStats()

console.log('feature-index.validator.compile          =', compiledValid)
console.log('feature-index.validator.batch            =', batchUsers.map(r => r.valid))
console.log('feature-index.validator.cache            =', featureCache.enabled)
expect('compiled feature validator passes', compiledValid === true)
expect('feature batch includes invalid row', batchUsers[1]?.valid === false)

// ============================================================
// 4. Conditional fields — s.match()
// ============================================================

const contactSchema = s({
  contactType: 'email|phone!',
  contact: s.match('contactType', {
    email: 'email!',
    phone: 'phone:cn!',
  }),
})

const contactOk = validate(contactSchema, { contactType: 'email', contact: 'user@example.com' })
const contactBad = validate(contactSchema, { contactType: 'email', contact: '13800138000' })

console.log('feature-index.conditional.valid          =', contactOk.valid)
console.log('feature-index.conditional.invalid        =', contactBad.valid)
expect('conditional schema accepts matching branch', contactOk.valid)
expect('conditional schema rejects branch mismatch', contactBad.valid === false)

// ============================================================
// 5. Async custom validators
// ============================================================

const asyncSignupSchema = s({
  email: s('email!').custom(async value =>
    value !== 'taken@example.com' || 'Email already exists'),
})

let asyncFailure = false
try {
  await validateAsync(asyncSignupSchema, { email: 'taken@example.com' })
} catch (err) {
  if (err instanceof ValidationError) {
    asyncFailure = err.hasFieldError('email')
  }
}

console.log('feature-index.async.failure              =', asyncFailure)
expect('async custom validator failure is observable', asyncFailure)

// ============================================================
// 6. Schema utilities and type conversion
// ============================================================

const publicUserSchema = SchemaUtils.pick(userSchema, ['username', 'email'])
const publicUserUpdateSchema = SchemaUtils.partial(publicUserSchema)
const mongoStringType = TypeConverter.toMongoDBType('string')

console.log('feature-index.utils.publicFields         =', Object.keys(publicUserSchema.properties ?? {}))
console.log('feature-index.utils.partialRequired      =', publicUserUpdateSchema.required?.length ?? 0)
console.log('feature-index.utils.mongoType            =', mongoStringType)
expect('SchemaUtils.pick selects two public fields', Object.keys(publicUserSchema.properties ?? {}).length === 2)
expect('SchemaUtils.partial removes required fields', (publicUserUpdateSchema.required?.length ?? 0) === 0)
expect('TypeConverter maps string to MongoDB string', mongoStringType === 'string')

// ============================================================
// 7. Markdown export
// ============================================================

const markdown = MarkdownExporter.export(userSchema, { title: 'User API Schema' })

console.log('feature-index.markdown.containsTitle     =', markdown.includes('User API Schema'))  // true
console.log('feature-index.markdown.hasFields         =', markdown.includes('username'))          // true
expect('Markdown export includes title and fields', markdown.includes('User API Schema') && markdown.includes('username'))

// ============================================================
// 8. MongoDB export
// ============================================================

const mongo = MongoDBExporter.export(userSchema)
const mongoSchema = mongo as { $jsonSchema?: { bsonType?: string } }

console.log('feature-index.mongo.hasJsonSchema        =', Boolean(mongoSchema.$jsonSchema))      // true
console.log('feature-index.mongo.rootType             =', mongoSchema.$jsonSchema?.bsonType)     // 'object'
expect('MongoDB export has root $jsonSchema', Boolean(mongoSchema.$jsonSchema))

// ============================================================
// 9. MySQL export
// ============================================================

const mysql = MySQLExporter.export('feature_users', userSchema)

console.log('feature-index.mysql.containsCreateTable  =', mysql.includes('CREATE TABLE'))       // true
console.log('feature-index.mysql.containsTableName    =', mysql.includes('feature_users'))      // true
expect('MySQL export creates table', mysql.includes('CREATE TABLE') && mysql.includes('feature_users'))

// ============================================================
// 10. PostgreSQL export
// ============================================================

const postgres = PostgreSQLExporter.export('feature_users', userSchema)

console.log('feature-index.postgres.containsCreate    =', postgres.includes('CREATE TABLE'))    // true
expect('PostgreSQL export creates table', postgres.includes('CREATE TABLE'))

// ============================================================
// 11. Nested object schema
// ============================================================

const nestedSchema = s({
  user: {
    profile: {
      firstName: 'string:1-64!',
      lastName:  'string:1-64!',
    },
    contact: {
      email: 'email!',
      phone: 'phone:cn',
    },
  },
})

console.log('feature-index.nested.valid               =', validate(nestedSchema, {
  user: {
    profile:  { firstName: 'Rocky', lastName: 'Dev' },
    contact:  { email: 'rocky@example.com', phone: '13800138000' },
  },
}).valid)  // true
expect('nested schema validates valid nested data', validate(nestedSchema, {
  user: {
    profile: { firstName: 'Rocky', lastName: 'Dev' },
    contact: { email: 'rocky@example.com', phone: '13800138000' },
  },
}).valid)

// ============================================================
// 12. Custom DSL type + factory
// ============================================================

s.registerExtension({
  literal: 'feature-tenant-id',
  factoryName: 'featureTenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
} as any)

const sWithFeatureTenant = s as typeof s & { featureTenantId(): IDslBuilder }
const extensionSchema = s({
  tenant: sWithFeatureTenant.featureTenantId().require(),
})

const extensionValid = validate(extensionSchema, { tenant: 'tenant_demo' })

console.log('feature-index.extension.valid           =', extensionValid.valid)
expect('custom DSL type factory validates', extensionValid.valid)

resetRuntimeState()
