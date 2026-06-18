import { createRuntime } from '../../dist/runtime.js'
import { Locale, TypeRegistry, resetRuntimeState } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`runtime-isolation expectation failed: ${label}`)
}

resetRuntimeState()
Locale.setLocale('en-US')
TypeRegistry.register('tenantId', { type: 'boolean' })

const runtime = createRuntime({
  locale: 'tenant-a',
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
  },
  patterns: {
    phone: {
      zz: { pattern: /^ZZ-\d{2}$/, min: 5, max: 5, key: 'pattern.phone.zz' },
    },
  },
  messages: {
    'pattern.phone.zz': 'Tenant phone format is invalid',
  },
  messageProvider: ({ key, locale, fallback }) =>
    key === 'number.min' ? `[${locale}] {{#label}} must be >= {{#limit}}` : fallback,
})

const schema = runtime.s({
  id: 'tenantId!',
  phone: 'phone:zz',
  age: 'number:18-120',
})

const emailField = runtime.s.email().label('Tenant email').require().toSchema()

runtime.registerExtension({
  literal: 'tenant-user',
  factoryName: 'tenantUser',
  schema: { type: 'string', pattern: '^user_[a-z0-9]+$' },
})

const tenantUserSchema = (
  runtime.s as typeof runtime.s & { tenantUser(): ReturnType<typeof runtime.s.string> }
).tenantUser().require().toSchema()

const ok = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'ZZ-12',
  age: 20,
})

const badAge = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'ZZ-12',
  age: 16,
})

const badPhone = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'AA-12',
  age: 20,
})

const noCoerce = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'ZZ-12',
  age: '20',
}, { coerce: false })

expect('valid tenant payload passes', ok.valid)
expect('runtime messageProvider handles AJV errors', badAge.errorMessage === '[tenant-a] age must be >= 18')
expect('runtime messages handle pattern errors', badPhone.errorMessage === 'Tenant phone format is invalid')
expect('runtime coerce false rejects numeric strings', noCoerce.valid === false)
expect('runtime s alias is shared with runtime dsl', runtime.s === runtime.dsl)
expect('runtime namespace factories use runtime scope', emailField.format === 'email' && emailField._required === true)
expect('runtime custom factories stay scoped', tenantUserSchema.pattern === '^user_[a-z0-9]+$')
expect('global TypeRegistry remains unchanged', TypeRegistry.resolve('tenantId').baseSchema.type === 'boolean')
expect('global Locale remains unchanged', Locale.getLocale() === 'en-US')

runtime.configure({
  messages: {
    'pattern.phone.zz': 'Tenant phone format changed',
  },
}, { mode: 'replace' })

const reloadedPhone = runtime.validate(schema, {
  id: 'tenant_demo',
  phone: 'AA-12',
  age: 20,
})

expect('runtime configure replace updates messages', reloadedPhone.errorMessage === 'Tenant phone format changed')
runtime.clearCache()
expect('runtime cache stats are inspectable', runtime.getStats().validators.defaultCache.size === 0)

runtime.dispose()
expect('runtime dispose marks stats', runtime.getStats().disposed)

console.log('runtime-isolation.ok =', ok.valid)
console.log('runtime-isolation.badAge =', badAge.errorMessage)
console.log('runtime-isolation.badPhone =', badPhone.errorMessage)
console.log('runtime-isolation.namespace =', emailField.format, tenantUserSchema.pattern)
console.log('runtime-isolation.disposed =', runtime.getStats().disposed)

resetRuntimeState()
