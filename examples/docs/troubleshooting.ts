import { s, validate, validateAsync, Validator, DslBuilder, ValidationError, MySQLExporter, installStringExtensions, uninstallStringExtensions } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`troubleshooting expectation failed: ${label}`)
}

// ============================================================
// Troubleshooting guide — diagnosing common validation issues
// ============================================================

// ============================================================
// 1. Basic debugging — inspect error details
// ============================================================

const debugSchema = s({
  username: 'string:3-12!',
  email:    'email!',
  age:      'number:18-120',
})

const invalidData = {
  username: 'ab',
  email:    'invalid-email',
  age:      12,
}

const directResult = validate(debugSchema, invalidData)

console.log('troubleshooting.basic.valid          =', directResult.valid)  // false
console.log('troubleshooting.basic.errorCount     =', directResult.errors?.length ?? 0)  // > 0
expect('invalid data should fail', directResult.valid === false)

// Each error has: path, keyword, message
const errorSummary = directResult.errors?.map(({ path, keyword, message }) =>
  ({ path, keyword, message }))

console.log('troubleshooting.basic.errors         =', errorSummary)

// ============================================================
// 2. Compile mode — reuse the AJV validate function
// ============================================================

const validator = new Validator()
// Build a clean JSON Schema for compile() by converting each field explicitly.
// s({...}) keeps internal _* markers; compile() needs a plain JSON Schema.
const compileSchema = {
  type:                 'object',
  properties: {
    username: s('string:3-12!').toJsonSchema(),
    email:    s('email!').toJsonSchema(),
    age:      s('number:18-120').toJsonSchema(),
  },
  required:             ['username', 'email'],
  additionalProperties: false,
}
const compiled  = validator.compile(compileSchema as any, 'troubleshooting-user')
const compiledValid = compiled(invalidData)

console.log('troubleshooting.compiled.valid       =', compiledValid)  // false
console.log('troubleshooting.compiled.errors      =', Array.isArray(compiled.errors))  // true
expect('compiled validator should reject invalid data', compiledValid === false)

// ============================================================
// 3. allErrors mode — collect all field errors at once
// ============================================================

const strictValidator = new Validator({ allErrors: true })
const allResult = strictValidator.validate(debugSchema, invalidData)

console.log('troubleshooting.allErrors.count      =',
  (allResult.errors?.length ?? 0) >= 3)  // true — username + email + age
expect('allErrors mode collects three field errors', (allResult.errors?.length ?? 0) >= 3)

// ============================================================
// 4. Inspecting toJsonSchema() output to check the generated schema
// ============================================================

const fieldSchema = s('string:3-32!').pattern(/^[a-z]+$/).label('Username')
const jsonSchema  = fieldSchema.toJsonSchema()

console.log('troubleshooting.toJsonSchema.type    =', jsonSchema.type)        // 'string'
console.log('troubleshooting.toJsonSchema.min     =', jsonSchema.minLength)   // 3
console.log('troubleshooting.toJsonSchema.max     =', jsonSchema.maxLength)   // 32
console.log('troubleshooting.toJsonSchema.pattern =', typeof jsonSchema.pattern) // 'string'
expect('toJsonSchema exposes generated pattern', typeof jsonSchema.pattern === 'string')

let unsafeRegexRejected = false
try {
  s('string').pattern(/^(a+)+$/)
} catch (err) {
  unsafeRegexRejected = err instanceof Error && err.message.includes('Unsafe regex')
}
console.log('troubleshooting.safeRegex.rejected   =', unsafeRegexRejected)
expect('unsafe regex is rejected', unsafeRegexRejected)

// ============================================================
// 5. Detecting optional vs required
// ============================================================

const mixedSchema = s({ name: 'string!', bio: 'string' })

// The ! marker makes a field required; detect it by testing validation behavior
const missingName = validate(mixedSchema, { bio: 'hello' })
const missingBio  = validate(mixedSchema, { name: 'alice' })

console.log('troubleshooting.required.nameMissing =',
  missingName.valid)  // false — name is required
console.log('troubleshooting.required.bioMissing  =',
  missingBio.valid)   // true  — bio is optional
expect('required field fails when missing', missingName.valid === false)
expect('optional field can be omitted', missingBio.valid === true)

// ============================================================
// 6. Type check — confirm built-in type is registered
// ============================================================

console.log('troubleshooting.hasType.email        =', DslBuilder.hasType('email'))   // true
console.log('troubleshooting.hasType.faketype     =', DslBuilder.hasType('xyzabc'))  // false
expect('built-in email type exists', DslBuilder.hasType('email'))
expect('fake type is not registered', DslBuilder.hasType('xyzabc') === false)

// ============================================================
// 7. Valid data — confirm fix worked
// ============================================================

const fixedData = {
  username: 'alice',
  email:    'alice@example.com',
  age:      28,
}

console.log('troubleshooting.fixed.valid          =', validate(debugSchema, fixedData).valid)  // true
expect('fixed data should validate', validate(debugSchema, fixedData).valid)

// ============================================================
// 8. Async custom validators — use validateAsync(), not sync validate()
// ============================================================

const asyncCustomSchema = s({
  email: s('email!').custom(async value =>
    value !== 'taken@example.com' || 'Email is already taken'),
})

let asyncCustomCaught = false
try {
  await validateAsync(asyncCustomSchema, { email: 'taken@example.com' })
} catch (err) {
  if (err instanceof ValidationError) {
    asyncCustomCaught = err.hasFieldError('email')
  }
}

console.log('troubleshooting.asyncCustom.caught   =', asyncCustomCaught)
expect('validateAsync catches async custom failure', asyncCustomCaught)

// ============================================================
// 9. Cache cleanup — clear compiled schema cache during tests/tenant switches
// ============================================================

validator.validate(compileSchema as any, fixedData)
const cacheBeforeClear = validator.getCacheStats()
validator.clearCache()
const cacheAfterClear = validator.getCacheStats()

console.log('troubleshooting.cache.before         =', cacheBeforeClear.size)
console.log('troubleshooting.cache.after          =', cacheAfterClear.size)
expect('clearCache empties validator cache', cacheAfterClear.size === 0)

// ============================================================
// 10. String extensions — restore after an explicit uninstall
// ============================================================

uninstallStringExtensions()
const labelAfterUninstall = typeof ('email!' as any).label
installStringExtensions()
const labelAfterInstall = typeof ('email!' as any).label

console.log('troubleshooting.stringExt.uninstall =', labelAfterUninstall)
console.log('troubleshooting.stringExt.install   =', labelAfterInstall)
expect('string extensions can be uninstalled', labelAfterUninstall === 'undefined')
expect('string extensions can be installed again', labelAfterInstall === 'function')

// ============================================================
// 11. Exporter errors — capture unsupported SQL mappings explicitly
// ============================================================

let exporterError = ''
try {
  MySQLExporter.export('mixed_values', {
    type: 'object',
    properties: {
      value: {
        anyOf: [
          { type: 'string', maxLength: 64 },
          { type: 'number' },
        ],
      },
    },
    required: ['value'],
  } as any)
} catch (err) {
  exporterError = err instanceof Error ? err.message : String(err)
}

console.log('troubleshooting.exporter.error       =', exporterError)
expect('exporter reports mixed anyOf mapping', exporterError.includes('cannot safely map anyOf'))
