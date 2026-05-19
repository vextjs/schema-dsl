import { TypeConverter, Validator, dsl, validate } from '../../dist/index.js'

// ============================================================
// API reference — primary exports and their usage
// ============================================================

// ============================================================
// 1. validate() — synchronous validation
// ============================================================

const userSchema = dsl({
  email:   'email!',
  age:     'number:18-100',
  role:    'admin|user|guest',
})

const syncResult = validate(userSchema, {
  email: 'user@example.com',
  age:   20,
  role:  'user',
})

console.log('api.sync.valid               =', syncResult.valid)    // true
console.log('api.sync.errors              =', syncResult.errors?.length ?? 0)  // 0

const syncFail = validate(userSchema, {
  email: 'not-an-email',
  age:   10,
  role:  'unknown',
})

console.log('api.sync.invalid             =', syncFail.valid)      // false
console.log('api.sync.errorCount          =', (syncFail.errors?.length ?? 0) >= 2)   // true

// ============================================================
// 2. validateAsync() — async validation (for async custom validators)
// ============================================================

const validator    = new Validator()
const asyncResult  = await validator.validateAsync(userSchema, {
  email: 'admin@example.com',
  age:   30,
  role:  'admin',
})

console.log('api.async.valid              =', typeof asyncResult === 'object' && asyncResult !== null)    // true

// ============================================================
// 3. Validator instance — lifecycle management
// ============================================================

const cachedValidator = new Validator({ cache: true, allErrors: true })

cachedValidator.validate(userSchema, { email: 'x@x.com', age: 21, role: 'user' })
cachedValidator.validate(userSchema, { email: 'y@y.com', age: 22, role: 'guest' })

const stats = cachedValidator.getCacheStats()

console.log('api.cache.enabled            =', stats.enabled)   // true
console.log('api.cache.hits               =', stats.hits >= 1) // true (same schema used twice)

// ============================================================
// 4. TypeConverter — DSL type → DB type mapping
// ============================================================

console.log('api.converter.integer.mongo  =', TypeConverter.toMongoDBType('integer'))     // 'int'
console.log('api.converter.string.mysql   =', TypeConverter.toMySQLType('string'))        // 'VARCHAR(255)'
console.log('api.converter.boolean.pg     =', TypeConverter.toPostgreSQLType('boolean'))  // 'BOOLEAN'
console.log('api.converter.datetime.pg    =', TypeConverter.toPostgreSQLType('datetime')) // 'TIMESTAMPTZ'
console.log('api.converter.email.pg       =', TypeConverter.toPostgreSQLType('email'))    // 'TEXT' or 'VARCHAR'

// ============================================================
// 5. compile() — reusable AJV validate function
// ============================================================

const compiled = validator.compile(userSchema, 'api-user')

console.log('api.compile.valid            =',
  compiled({ email: 'ok@example.com', age: 25, role: 'user' }))  // true

console.log('api.compile.invalid          =',
  compiled({ email: 'bad' }))  // false

// ============================================================
// 6. toJsonSchema() — get raw JSON Schema
// ============================================================

const fieldBuilder = dsl('string:3-64!').pattern(/^[a-zA-Z0-9_]+$/).label('Username')
const jsonSchema   = fieldBuilder.toJsonSchema()

console.log('api.toJsonSchema.type        =', jsonSchema.type)          // 'string'
console.log('api.toJsonSchema.minLength   =', jsonSchema.minLength)     // 3
console.log('api.toJsonSchema.pattern     =', typeof jsonSchema.pattern) // 'string'