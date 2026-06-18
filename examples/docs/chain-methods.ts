import { s, validate } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// 1. Common methods
// ============================================================

const accountSchema = s({
  email: s.email()
    .label('Email')
    .description('Primary account email')
    .messages({ required: 'Email is required' })
    .require(),
  status: s.enum('active', 'inactive', 'pending').default('active'),
  nickname: s('string:2-20').optional(),
})

const accountResult = validate(accountSchema, { email: 'user@example.com' })
console.log('chain-methods.account.valid =', accountResult.valid)

// ============================================================
// 2. String methods
// ============================================================

const stringSchema = s({
  username: s.string().username('medium').label('Username').require(),
  password: s.string().password('strong').label('Password').require(),
  slug: s.string().slug().label('Slug'),
  token: s.string().jwt().optional(),
  profileJson: s.string().json().optional(),
  startDate: s.string().dateFormat('YYYY-MM-DD').after('2026-01-01'),
})

const stringResult = validate(stringSchema, {
  username: 'alice_01',
  password: 'Password123',
  slug: 'release-notes',
  profileJson: '{"theme":"dark"}',
  startDate: '2026-06-18',
})
console.log('chain-methods.string.valid =', stringResult.valid)

// ============================================================
// 3. Number and array methods
// ============================================================

const productSchema = s({
  price: s.number().min(0.01).max(9999).precision(2),
  quantity: s.integer().min(1).max(100).multiple(1),
  port: s.integer().port(),
  tags: s.array('string:1-30').min(1).max(5).noSparse(),
  nestedTags: s.array().items(s.string().min(1).max(30).require()).min(1).max(5).noSparse(),
  requiredFlags: s.array('string').includesRequired(['terms']),
})

const productResult = validate(productSchema, {
  price: 19.99,
  quantity: 3,
  port: 3000,
  tags: ['docs', 'api'],
  nestedTags: ['docs', 'api'],
  requiredFlags: ['terms', 'newsletter'],
})
console.log('chain-methods.product.valid =', productResult.valid)

// ============================================================
// 4. Output helpers
// ============================================================

const field = s('email!').label('Contact email')
console.log('chain-methods.field.schema.type =', field.toSchema().type)
console.log('chain-methods.field.json.format =', field.toJsonSchema().format)
console.log('chain-methods.field.string.includesEmail =', field.toString().includes('email'))

// ============================================================
// 5. Runtime-scoped builder
// ============================================================

const runtime = createRuntime({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
  },
})

const runtimeSchema = runtime.s({
  tenant: runtime.s.type('tenantId').label('Tenant').require(),
  email: runtime.s.email().label('Tenant email').require(),
})

const runtimeResult = runtime.validate(runtimeSchema, {
  tenant: 'tenant_demo',
  email: 'tenant@example.com',
})
console.log('chain-methods.runtime.valid =', runtimeResult.valid)

runtime.dispose()
