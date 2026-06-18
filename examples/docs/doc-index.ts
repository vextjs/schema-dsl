import { s, validate, Validator, MarkdownExporter } from '../../dist/pure.js'

// ============================================================
// Documentation index — quick reference for all API surfaces
// ============================================================

// ============================================================
// 1. Quick start — s() + validate()
// ============================================================

const quickStartSchema = s({
  name:  'string:2-32!',
  email: 'email!',
  age:   'number:18-120',
})

const qsValid = validate(quickStartSchema, {
  name:  'Rocky',
  email: 'rocky@example.com',
  age:   28,
})

const qsInvalid = validate(quickStartSchema, {
  name:  'A',
  email: 'not-email',
  age:   10,
})

console.log('doc-index.quickstart.valid           =', qsValid.valid)     // true
console.log('doc-index.quickstart.invalid         =', qsInvalid.valid)   // false
console.log('doc-index.quickstart.errorCount      =',
  (qsInvalid.errors?.length ?? 0) >= 2)  // true

// ============================================================
// 2. Advanced DSL types
// ============================================================

const advancedSchema = s({
  role:      'admin|user|guest',
  score:     'number:>=0',
  tags:      'array:0-10<string:2-20>',
  createdAt: 'datetime',
  meta: {
    source: 'string',
    ip:     'ipv4',
  },
})

const validator = new Validator()
const compiled  = validator.compile(advancedSchema, 'doc-index-advanced')

const advancedValid = compiled({
  role:      'admin',
  score:     98,
  tags:      ['docs', 'guide', 'schema'],
  createdAt: '2026-01-01T00:00:00.000Z',
  meta:      { source: 'web', ip: '127.0.0.1' },
})

console.log('doc-index.advanced.valid             =', advancedValid)  // true
console.log('doc-index.advanced.badRole           =',
  compiled({ role: 'superuser', score: 50, tags: [], createdAt: '2026-01-01T00:00:00Z', meta: { ip: '127.0.0.1' } }))
// false

// ============================================================
// 3. Markdown export — generate API docs from schema
// ============================================================

const markdown = MarkdownExporter.export(quickStartSchema, { title: 'Doc Index Demo' })

console.log('doc-index.markdown.containsTitle     =', markdown.includes('Doc Index Demo'))  // true
console.log('doc-index.markdown.hasProperty       =', markdown.includes('name'))             // true

// ============================================================
// 4. DslBuilder chaining
// ============================================================

const builtField = s('string:3-64!')
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('Username')
  .error({ pattern: 'Only letters, digits and underscores allowed' })
  .description('Unique user handle')

const fieldJson = builtField.toJsonSchema()

console.log('doc-index.builder.type               =', fieldJson.type)        // 'string'
console.log('doc-index.builder.minLength          =', fieldJson.minLength)   // 3
console.log('doc-index.builder.label              =', fieldJson._label)      // 'Username'

// ============================================================
// 5. allErrors mode — collect full error list
// ============================================================

const allErrValidator = new Validator({ allErrors: true })
const multiError      = allErrValidator.validate(quickStartSchema, { name: 'A', email: 'bad', age: 5 })

console.log('doc-index.allErrors.count            =',
  (multiError.errors?.length ?? 0) >= 3)  // true — name + email + age