import { s, validate } from '../../dist/pure.js'

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[label-vs-description] ${message}`)
}

function expectIncludes(value: string, expected: string, message: string): void {
  expect(value.includes(expected), `${message}: expected "${value}" to include "${expected}"`)
}

// ============================================================
// label / description / messages / error — distinct user-facing metadata and message helpers
//
// label       → human-friendly field name used in error messages
//               ("Email Address is required" instead of ".email is required")
// description → longer documentation string (appears in JSON Schema
//               as `description` and in Markdown exports)
// messages    → custom validation messages
// error       → alias of messages()
// ============================================================

// ============================================================
// 1. Basic usage: label appears in error messages
// ============================================================

const emailField = s('email!')
  .label('Email Address')
  .description('Primary login email — used for account recovery')
  .messages({
    required: '{{#label}} is required',
    format: '{{#label}} must be a valid email address',
  })

const schema = s({
  email:    emailField,
  username: s('string:3-32!').label('Username').description('Login handle; letters and digits only'),
  age:      s('integer:13-120').label('Age').description('Must be at least 13 to register'),
})

const raw = (emailField as any).toSchema() as any

expect(raw._label === 'Email Address', 'label should be stored internally as _label')
expect(raw.description === 'Primary login email — used for account recovery', 'description should be stored in JSON Schema metadata')

console.log('label-vs-description.label       =', raw._label)           // 'Email Address'
console.log('label-vs-description.description =', raw.description)      // 'Primary login email...'

// ============================================================
// 2. toJsonSchema() exports — label stripped, description kept
// ============================================================

const clean = emailField.toJsonSchema() as any

expect(!('_label' in clean), 'toJsonSchema() should strip internal _label metadata')
expect(clean.description === raw.description, 'toJsonSchema() should preserve description metadata')

console.log('label-vs-description.clean.noLabel  =', !('_label' in clean))        // true
console.log('label-vs-description.clean.desc     =', clean.description?.length > 0) // true

// ============================================================
// 3. Error message uses label, not raw path
// ============================================================

const missingResult = validate(schema, { username: 'alice' })
const emailError = missingResult.errors?.[0]?.message ?? ''

// The error message should reference 'Email Address' not just '.email'
expect(missingResult.valid === false, 'missing required email should fail validation')
expectIncludes(emailError, 'Email Address', 'label should appear in required error message')
console.log('label-vs-description.err.message =', emailError)

// ============================================================
// 4. No label — error falls back to path
// ============================================================

const noLabelSchema = s({ email: 'email!' })
const noLabelResult = validate(noLabelSchema, {})
const noLabelError = noLabelResult.errors?.[0]?.message ?? ''

expect(noLabelResult.valid === false, 'missing required email without label should fail validation')
expect(!noLabelError.includes('Email Address'), 'unlabeled schema should not reuse another field label')
console.log('label-vs-description.noLabel.error =', noLabelError || 'none')

// ============================================================
// 5. label vs enum in error messages
// ============================================================

const roleField = s('string!').label('User Role').enum(['admin', 'editor', 'viewer'])
const roleSchema = s({ role: roleField })

const roleResult = validate(roleSchema, { role: 'superuser' })
const roleError = roleResult.errors?.[0]?.message ?? ''

expect(roleResult.valid === false, 'enum value outside the allowed list should fail validation')
expectIncludes(roleError, 'User Role', 'label should appear in enum error message')
console.log('label-vs-description.enum.valid  =', roleResult.valid) // false
console.log('label-vs-description.enum.error  =', roleError || 'none')

// ============================================================
// 6. error() is an alias of messages()
// ============================================================

const errorAliasField = s('string!')
  .label('Invite code')
  .pattern(/^INV-[0-9]{4}$/)
  .error({ pattern: '{{#label}} must look like INV-2026' })

const errorAliasResult = validate(s({ code: errorAliasField }), { code: 'bad' })
const errorAliasMessage = errorAliasResult.errors?.[0]?.message ?? ''

expect(errorAliasResult.valid === false, 'error() alias should customize pattern failure')
expectIncludes(errorAliasMessage, 'Invite code', 'error() alias should use label placeholders')
console.log('label-vs-description.errorAlias =', errorAliasMessage)

// ============================================================
// 7. description survives toJsonSchema() — used by MarkdownExporter
// ============================================================

const { MarkdownExporter } = await import('../../dist/index.js')
const md = MarkdownExporter.export(schema)

expectIncludes(md, 'Primary login email', 'Markdown output should include field description')
expectIncludes(md, 'Username', 'Markdown output should include field label as display metadata')

console.log('label-vs-description.md.hasDesc =', md.includes('Primary login email')) // true — description in Markdown output
