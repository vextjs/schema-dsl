import {
  createRuntime,
  createSchemaDslAdapter,
  createSchemaDslRuntime,
  type SchemaDslRuntimeConfigureControl,
  type SchemaDslRuntimeStats,
} from 'schema-dsl/runtime'

const runtime = createRuntime({
  strict: true,
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
  },
  messages: {
    missing: { code: 'TENANT_MISSING', message: 'Tenant {{#id}} missing' },
  },
})

const aliasRuntime = createSchemaDslRuntime()
const adapterRuntime = createSchemaDslAdapter()
const control: SchemaDslRuntimeConfigureControl = { mode: 'replace' }

runtime.configure({
  types: {
    tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
  },
  messages: { missing: 'Missing {{#id}}' },
}, control)
runtime.registerType('tenantScore', { type: 'number', minimum: 1 })
runtime.registerDynamicType('tenantDynamic', () => ({ type: 'string', minLength: 3 }))
runtime.registerExtension({
  literal: 'tenant-runtime-id',
  factoryName: 'tenantRuntimeId',
  schema: { type: 'string', pattern: '^runtime_[a-z0-9]+$' },
})

const schema = runtime.compile({
  id: 'tenantId!',
  score: 'tenantScore',
})
const runtimeField = runtime.s.email().require()
const runtimeDslField = runtime.dsl.number().min(1).max(5)

// @ts-expect-error Runtime namespaces expose callable DSL seeds and factories, not root dsl.config().
runtime.s.config({})

runtime.validate(schema, { id: 'tenant_demo', score: 5 })
runtime.validate(schema, { id: 'tenant_demo', score: '5' }, { coerce: false })
runtimeField.toSchema()
runtimeDslField.toSchema()

const error = runtime.createI18nError('missing', { id: 1 })
const code: string | number = error.code
const statusCode: number = error.statusCode
const stats: SchemaDslRuntimeStats = runtime.getStats()
const disposed: boolean = stats.disposed

runtime.clearCache()
runtime.unregisterType('tenantScore')
runtime.dispose()
aliasRuntime.dispose()
adapterRuntime.dispose()

void code
void statusCode
void disposed
