import { resetRuntimeState, s, validate, type IDslBuilder } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// Framework extension setup
// ============================================================

resetRuntimeState()

export const schemaDslTransformOptions = {
  additionalMethods: ['tenantId'],
  additionalTypes: ['tenant-id'],
} as const

export function installSchemaDslExtensions() {
  s.registerExtension({
    literal: 'tenant-id',
    factoryName: 'tenantId',
    schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
  } as any)
}

export function createAppSchemaRuntime() {
  const runtime = createRuntime({
    types: {
      tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
    },
  })

  runtime.registerExtension({
    literal: 'runtime-tenant-id',
    factoryName: 'runtimeTenantId',
    schema: { type: 'string', pattern: '^rt_[a-z0-9]+$' },
  } as any)

  return runtime
}

installSchemaDslExtensions()

const sWithTenant = s as typeof s & { tenantId(): IDslBuilder }
const appSchema = s({
  tenant: sWithTenant.tenantId().require(),
  owner: 'tenant-id!',
})

console.log('framework-extension-setup.app.valid =',
  validate(appSchema, { tenant: 'tenant_demo', owner: 'tenant_owner' }).valid)

const runtime = createAppSchemaRuntime()
const runtimeS = runtime.s as typeof runtime.s & { runtimeTenantId(): IDslBuilder }
const runtimeSchema = runtime.s({
  tenant: runtimeS.runtimeTenantId().require(),
})

console.log('framework-extension-setup.runtime.valid =',
  runtime.validate(runtimeSchema, { tenant: 'rt_demo' }).valid)
console.log('framework-extension-setup.transform.methods =',
  schemaDslTransformOptions.additionalMethods.includes('tenantId'))

runtime.dispose()
resetRuntimeState()
