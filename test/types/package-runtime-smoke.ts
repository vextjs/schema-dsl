import {
  createRuntime,
  createSchemaDslAdapter,
  createSchemaDslRuntime,
  type SchemaDslRuntimeConfigureControl,
  type SchemaDslRuntimeStats,
} from 'schema-dsl/runtime'
import { ConditionalBuilder, type JSONSchemaInput } from 'schema-dsl/pure'

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
const runtimeExtendedS = runtime.registerExtensions([
  {
    literal: 'tenant-param-id',
    factoryName: 'tenantParamId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
    },
    schema({ scope }: { scope?: 'tenant' | 'corp' }) {
      return { type: 'string', pattern: `^${scope}_[a-z0-9]+$` }
    },
  },
] as const)

const schema = runtime.compile({
  id: 'tenantId!',
  score: 'tenantScore',
})
const runtimeField = runtime.s.email().require()
const runtimeDslField = runtime.dsl.number().min(1).max(5)
const runtimeParamField = runtimeExtendedS.tenantParamId('corp').require()

// @ts-expect-error Runtime typed extensions preserve enum parameter hints for object params.
runtimeExtendedS.tenantParamId({ scope: 'bad' })

// @ts-expect-error Runtime namespaces expose callable DSL seeds and factories, not root dsl.config().
runtime.s.config({})

runtime.validate(schema, { id: 'tenant_demo', score: 5 })
runtime.validate(schema, { id: 'tenant_demo', score: '5' }, { coerce: false })
runtime.validate(true, { any: 'value' })
runtime.validate(false, { any: 'value' })
const recursiveBooleanSchema: JSONSchemaInput = {
  type: 'object',
  properties: {
    enabled: true,
    disabled: false,
  },
  allOf: [true],
}
runtime.validate(recursiveBooleanSchema, { enabled: 'ok' })
ConditionalBuilder.start(() => true).then(true).else(false).toSchema()
runtimeField.toSchema()
runtimeDslField.toSchema()
runtimeParamField.toSchema()

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
