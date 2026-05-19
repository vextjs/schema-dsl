import { dsl, validate } from '../../dist/index.js'

// ============================================================
// label vs description — two distinct metadata fields
//
// label       → human-friendly field name used in error messages
//               ("Email Address is required" instead of ".email is required")
// description → longer documentation string (appears in JSON Schema
//               as `description` and in Markdown exports)
// ============================================================

// ============================================================
// 1. Basic usage: label appears in error messages
// ============================================================

const emailField = dsl('email!')
  .label('Email Address')
  .description('Primary login email — used for account recovery')

const schema = dsl({
  email:    emailField,
  username: dsl('string:3-32!').label('Username').description('Login handle; letters and digits only'),
  age:      dsl('integer:13-120').label('Age').description('Must be at least 13 to register'),
})

const raw = (emailField as any).toSchema() as any

console.log('label-vs-description.label       =', raw._label)           // 'Email Address'
console.log('label-vs-description.description =', raw.description)      // 'Primary login email...'

// ============================================================
// 2. toJsonSchema() exports — label stripped, description kept
// ============================================================

const clean = emailField.toJsonSchema() as any

console.log('label-vs-description.clean.noLabel  =', !('_label' in clean))        // true
console.log('label-vs-description.clean.desc     =', clean.description?.length > 0) // true

// ============================================================
// 3. Error message uses label, not raw path
// ============================================================

const missingResult = validate(schema, { username: 'alice' })
const emailError = missingResult.errors?.[0]?.message ?? ''

// The error message should reference 'Email Address' not just '.email'
console.log('label-vs-description.err.message =', emailError)

// ============================================================
// 4. No label — error falls back to path
// ============================================================

const noLabelSchema = dsl({ email: 'email!' })
const noLabelResult = validate(noLabelSchema, {})

console.log('label-vs-description.noLabel.error =', noLabelResult.errors?.[0]?.message ?? 'none')

// ============================================================
// 5. label vs enum in error messages
// ============================================================

const roleField = dsl('string!').label('User Role').enum(['admin', 'editor', 'viewer'])
const roleSchema = dsl({ role: roleField })

const roleResult = validate(roleSchema, { role: 'superuser' })
console.log('label-vs-description.enum.valid  =', roleResult.valid)         // false
console.log('label-vs-description.enum.error  =', roleResult.errors?.[0]?.message ?? 'none')

// ============================================================
// 6. description survives toJsonSchema() — used by MarkdownExporter
// ============================================================

const { MarkdownExporter } = await import('../../dist/index.js')
const md = MarkdownExporter.export(schema)

console.log('label-vs-description.md.hasDesc =',
  md.includes('Primary login email'))  // true — description in Markdown output