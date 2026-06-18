import { resetRuntimeState, s, validate, type IDslBuilder } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// Custom s.xxx() factories
// ============================================================

resetRuntimeState()

s.registerExtension({
  literal: 'tenant-id',
  factoryName: 'tenantId',
  schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
} as any)

type NamespaceWithTenant = typeof s & { tenantId(): IDslBuilder }
const sWithTenant = s as NamespaceWithTenant

const globalSchema = s({
  tenant: sWithTenant.tenantId().label('Tenant').require(),
  owner: 'tenant-id!',
})

console.log('custom-factories.global.valid =',
  validate(globalSchema, { tenant: 'tenant_demo', owner: 'tenant_owner' }).valid)
console.log('custom-factories.global.invalid =',
  validate(globalSchema, { tenant: 'bad', owner: 'tenant_owner' }).valid)

const runtime = createRuntime()
runtime.registerExtension({
  literal: 'runtime-tenant-id',
  factoryName: 'runtimeTenantId',
  schema: { type: 'string', pattern: '^rt_[a-z0-9]+$' },
} as any)

const runtimeS = runtime.s as typeof runtime.s & { runtimeTenantId(): IDslBuilder }
const runtimeSchema = runtime.s({
  tenant: runtimeS.runtimeTenantId().require(),
})

console.log('custom-factories.runtime.valid =',
  runtime.validate(runtimeSchema, { tenant: 'rt_demo' }).valid)

runtime.dispose()
resetRuntimeState()
