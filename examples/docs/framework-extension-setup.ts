import { registerExtensions, resetRuntimeState, validate } from '../../dist/pure.js'
import { createRuntime } from '../../dist/runtime.js'

// ============================================================
// Framework extension setup
// ============================================================

resetRuntimeState()

export const s = registerExtensions([
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

export const schemaDslTransformOptions = {
  additionalMethods: ['tenantId'],
  additionalTypes: ['tenant-id'],
} as const

export function installSchemaDslExtensions() {
  return s
}

export function createAppSchemaRuntime() {
  const runtime = createRuntime({
    types: {
      tenantId: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
    },
  })

  const runtimeS = runtime.registerExtensions([
    {
      literal: 'runtime-tenant-id',
      factoryName: 'runtimeTenantId',
      segmentMode: 'params',
      params: {
        scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
      },
      schema({ scope }) {
        return {
          type: 'string',
          pattern: scope === 'corp' ? '^rt_corp_[a-z0-9]+$' : '^rt_tenant_[a-z0-9]+$',
        }
      },
    },
  ] as const)

  return { runtime, s: runtimeS }
}

installSchemaDslExtensions()

const appSchema = s({
  tenant: s.tenantId('corp').require(),
  owner: 'tenant-id:corp!',
})

console.log('framework-extension-setup.app.valid =',
  validate(appSchema, { tenant: 'corp_demo', owner: 'corp_owner' }).valid)

const { runtime, s: runtimeS } = createAppSchemaRuntime()
const runtimeSchema = runtimeS({
  tenant: runtimeS.runtimeTenantId('corp').require(),
})

console.log('framework-extension-setup.runtime.valid =',
  runtime.validate(runtimeSchema, { tenant: 'rt_corp_demo' }).valid)
console.log('framework-extension-setup.transform.methods =',
  schemaDslTransformOptions.additionalMethods.includes('tenantId'))

runtime.dispose()
resetRuntimeState()
