import {
  DslBuilder,
  TypeRegistry,
  Validator,
  registerExtensions,
  resetRuntimeState,
  s as baseS,
  validate,
} from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// Extension overview - choose the right extension layer
// ============================================================

resetRuntimeState()

// 1. Custom DSL type: compact reusable literal.
TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 },
})

const evenSchema = baseS({ value: 'evenNumber!' })
console.log('extensions-overview.type.valid =', validate(evenSchema, { value: 4 }).valid)
console.log('extensions-overview.type.invalid =', validate(evenSchema, { value: 5 }).valid)

// 2. Custom namespace factory: discoverable s.xxx() path.
const s = registerExtensions([
  {
    literal: 'tenant-id',
    factoryName: 'tenantId',
    segmentMode: 'params',
    params: {
      scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
    },
    schema({ scope }) {
      return {
        type: 'string',
        pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$',
      }
    },
  },
] as const)

const tenantSchema = s({
  compact: 'tenant-id:corp!',
  named: s('tenant-id:corp!').label('Tenant'),
  typed: s.tenantId('corp').require(),
})
console.log('extensions-overview.factory.valid =',
  validate(tenantSchema, { compact: 'corp_demo', named: 'corp_owner', typed: 'corp_admin' }).valid)

// 3. Runtime-scoped type: isolated app/plugin/tenant state.
const runtime = createRuntime({
  types: {
    runtimeTenantId: { type: 'string', pattern: '^rt_[a-z0-9]+$' },
  },
})
const runtimeS = runtime.registerExtensions([
  {
    literal: 'runtime-tenant-id',
    factoryName: 'runtimeTenantId',
    schema: { type: 'string', pattern: '^rt_[a-z0-9]+$' },
  },
] as const)

console.log('extensions-overview.runtime.valid =',
  runtime.validate(runtime.s({ tenant: runtimeS.runtimeTenantId().require() }), { tenant: 'rt_demo' }).valid)

runtime.dispose()

// 4. Validation keyword: AJV-level custom rule.
const validator = new Validator()
validator.addKeyword('isEven', {
  type: 'number',
  validate: (_schema: unknown, data: unknown) => Number(data) % 2 === 0,
})

console.log('extensions-overview.keyword.valid =',
  validator.validate({ type: 'number', isEven: true } as any, 8).valid)

// Cleanup global extension state for repeatable docs examples.
TypeRegistry.unregister('evenNumber')
DslBuilder.clearCustomTypes()
resetRuntimeState()
