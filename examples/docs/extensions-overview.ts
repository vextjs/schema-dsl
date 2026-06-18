import {
  DslBuilder,
  TypeRegistry,
  Validator,
  resetRuntimeState,
  s,
  validate,
  type IDslBuilder,
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

const evenSchema = s({ value: 'evenNumber!' })
console.log('extensions-overview.type.valid =', validate(evenSchema, { value: 4 }).valid)
console.log('extensions-overview.type.invalid =', validate(evenSchema, { value: 5 }).valid)

// 2. Custom namespace factory: discoverable s.xxx() path.
s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
} as any)

const sWithTenant = s as typeof s & { tenantId(): IDslBuilder }
const tenantSchema = s({ tenant: sWithTenant.tenantId().require() })
console.log('extensions-overview.factory.valid =',
  validate(tenantSchema, { tenant: 'tenant_demo' }).valid)

// 3. Runtime-scoped type: isolated app/plugin/tenant state.
const runtime = createRuntime({
  types: {
    runtimeTenantId: { type: 'string', pattern: '^rt_[a-z0-9]+$' },
  },
})

console.log('extensions-overview.runtime.valid =',
  runtime.validate(runtime.s({ tenant: 'runtimeTenantId!' }), { tenant: 'rt_demo' }).valid)

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
