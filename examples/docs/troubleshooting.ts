import { dsl, validate, Validator, DslBuilder } from '../../dist/index.js'

// ============================================================
// Troubleshooting guide — diagnosing common validation issues
// ============================================================

// ============================================================
// 1. Basic debugging — inspect error details
// ============================================================

const debugSchema = dsl({
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

// Each error has: path, keyword, message
const errorSummary = directResult.errors?.map(({ path, keyword, message }) =>
  ({ path, keyword, message }))

console.log('troubleshooting.basic.errors         =', errorSummary)

// ============================================================
// 2. Compile mode — reuse the AJV validate function
// ============================================================

const validator = new Validator()
// Build a clean JSON Schema for compile() by converting each field explicitly.
// dsl({...}) keeps internal _* markers; compile() needs a plain JSON Schema.
const compileSchema = {
  type:                 'object',
  properties: {
    username: dsl('string:3-12!').toJsonSchema(),
    email:    dsl('email!').toJsonSchema(),
    age:      dsl('number:18-120').toJsonSchema(),
  },
  required:             ['username', 'email'],
  additionalProperties: false,
}
const compiled  = validator.compile(compileSchema as any, 'troubleshooting-user')
const compiledValid = compiled(invalidData)

console.log('troubleshooting.compiled.valid       =', compiledValid)  // false
console.log('troubleshooting.compiled.errors      =', Array.isArray(compiled.errors))  // true

// ============================================================
// 3. allErrors mode — collect all field errors at once
// ============================================================

const strictValidator = new Validator({ allErrors: true })
const allResult = strictValidator.validate(debugSchema, invalidData)

console.log('troubleshooting.allErrors.count      =',
  (allResult.errors?.length ?? 0) >= 3)  // true — username + email + age

// ============================================================
// 4. Inspecting toJsonSchema() output to check the generated schema
// ============================================================

const fieldSchema = dsl('string:3-32!').pattern(/^[a-z]+$/).label('Username')
const jsonSchema  = fieldSchema.toJsonSchema()

console.log('troubleshooting.toJsonSchema.type    =', jsonSchema.type)        // 'string'
console.log('troubleshooting.toJsonSchema.min     =', jsonSchema.minLength)   // 3
console.log('troubleshooting.toJsonSchema.max     =', jsonSchema.maxLength)   // 32
console.log('troubleshooting.toJsonSchema.pattern =', typeof jsonSchema.pattern) // 'string'

// ============================================================
// 5. Detecting optional vs required
// ============================================================

const mixedSchema = dsl({ name: 'string!', bio: 'string' })

// The ! marker makes a field required; detect it by testing validation behavior
const missingName = validate(mixedSchema, { bio: 'hello' })
const missingBio  = validate(mixedSchema, { name: 'alice' })

console.log('troubleshooting.required.nameMissing =',
  missingName.valid)  // false — name is required
console.log('troubleshooting.required.bioMissing  =',
  missingBio.valid)   // true  — bio is optional

// ============================================================
// 6. Type check — confirm built-in type is registered
// ============================================================

console.log('troubleshooting.hasType.email        =', DslBuilder.hasType('email'))   // true
console.log('troubleshooting.hasType.faketype     =', DslBuilder.hasType('xyzabc'))  // false

// ============================================================
// 7. Valid data — confirm fix worked
// ============================================================

const fixedData = {
  username: 'alice',
  email:    'alice@example.com',
  age:      28,
}

console.log('troubleshooting.fixed.valid          =', validate(debugSchema, fixedData).valid)  // true