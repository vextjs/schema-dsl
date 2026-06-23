import * as schemaDsl from '../../dist/pure.js'
import { DslBuilder, Locale, PluginManager, Validator, s, registerExtension, resetRuntimeState, validate, type IDslBuilder } from '../../dist/pure.js'
import customTypeExamplePlugin from '../../dist/plugins/custom-type-example.js'
import { transformSchemaDsl } from '../../dist/transform.js'

// ============================================================
// Custom extensions guide — addKeyword, registerType, plugins
// ============================================================

resetRuntimeState()

// ============================================================
// 1. Custom keyword via Validator.addKeyword()
//    The keyword receives (schema_value, data) and returns boolean.
// ============================================================

const validator = new Validator()

validator.addKeyword('isPositive', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) > 0,
})

validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0,
})

validator.addKeyword('maxWords', {
  type: 'string',
  validate: (schema: unknown, data: unknown) =>
    (data as string).trim().split(/\s+/).length <= (schema as number),
})

const positiveSchema = { type: 'number', isPositive: true }
const evenSchema     = { type: 'number', isEven: true }
const wordsSchema    = { type: 'string', maxWords: 5 }

console.log('custom-extensions.positive.valid    =', validator.validate(positiveSchema as any, 1).valid)   // true
console.log('custom-extensions.positive.invalid  =', validator.validate(positiveSchema as any, 0).valid)   // false
console.log('custom-extensions.even.valid        =', validator.validate(evenSchema as any, 4).valid)        // true
console.log('custom-extensions.even.invalid      =', validator.validate(evenSchema as any, 3).valid)        // false
console.log('custom-extensions.words.valid       =', validator.validate(wordsSchema as any, 'one two').valid)     // true
console.log('custom-extensions.words.invalid     =', validator.validate(wordsSchema as any, 'one two three four five six').valid) // false

// ============================================================
// 2. Custom type via registerExtension()
//    A type extends any JSON Schema and can also expose s.xxx().
// ============================================================

DslBuilder.registerType('invoice-id', {
  type: 'string',
  pattern: '^INV-\\d{4}$',
} as any)

type NamespaceWithCurrency = typeof s & { currencyCode(): IDslBuilder }
type NamespaceWithTenant = typeof s & { tenantId(): IDslBuilder }

registerExtension({
  literal: 'currency-code',
  factoryName: 'currencyCode',
  schema: { type: 'string', pattern: '^[A-Z]{3}$' },
} as any)

registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
} as any)

const currencyFactory = (s as NamespaceWithCurrency).currencyCode()
const tenantFactory = (s as NamespaceWithTenant).tenantId().require()
const tenantSeed = s('tenant-id!').label('Tenant')
const invoiceSchema  = s({ id: 'invoice-id!', currency: currencyFactory.require() })
const tenantSchema = s({ tenant: tenantSeed, tenantFactory })
const invoiceTransform = transformSchemaDsl(
  'export const id = "invoice-id!".label("Invoice")',
  {
    filename: 'schema.ts',
    additionalTypes: ['invoice-id'],
  },
)
console.log('custom-extensions.invoice.valid     =',
  validate(invoiceSchema, { id: 'INV-2026', currency: 'USD' }).valid)   // true
console.log('custom-extensions.invoice.badId     =',
  validate(invoiceSchema, { id: 'BAD' }).valid)                          // false
console.log('custom-extensions.hasType.invoice   =', DslBuilder.hasType('invoice-id'))     // true
console.log('custom-extensions.hasType.currency  =', DslBuilder.hasType('currency-code'))  // true
console.log('custom-extensions.factory.currency  =', currencyFactory.toSchema().pattern === '^[A-Z]{3}$') // true
console.log('custom-extensions.transform.custom  =', invoiceTransform.changed)             // true
console.log('custom-extensions.tenant.valid      =',
  validate(tenantSchema, { tenant: 'tenant_demo', tenantFactory: 'tenant_demo' }).valid)    // true
console.log('custom-extensions.factory.tenant    =', tenantFactory.toSchema().pattern === '^tenant_[a-z0-9]+$') // true

// ============================================================
// 3. Custom locale message for a custom type
// ============================================================

Locale.addLocale('pt-BR', {
  'custom.invoiceId': 'ID de fatura inválido',
})

console.log('custom-extensions.locale.pt         =',
  Locale.getMessageText('custom.invoiceId', {}, 'pt-BR'))  // 'ID de fatura inválido'

// ============================================================
// 4. Plugin system — install a named plugin
// ============================================================

const pluginManager = new PluginManager()
pluginManager.register(customTypeExamplePlugin)
pluginManager.install(schemaDsl, 'custom-type-example')

console.log('custom-extensions.plugin.valid      =',
  validate(s({ orderId: 'order-id!' }), { orderId: 'ORD202401010001' }).valid)  // true

// ============================================================
// 5. Cleanup (important in test environments)
// ============================================================

resetRuntimeState()

console.log('custom-extensions.cleared           =', !DslBuilder.hasType('invoice-id'))  // true
