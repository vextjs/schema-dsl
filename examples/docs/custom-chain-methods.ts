import {
  DslBuilder,
  resetRuntimeState,
  s,
  validate,
  type IDslBuilder,
} from '../../dist/pure.js'
import { transformSchemaDsl } from '../../dist/transform.js'

// ============================================================
// Custom chain methods
// ============================================================

resetRuntimeState()
type TenantIdBuilder = IDslBuilder & { tenantId(): IDslBuilder }
const tenantProto = DslBuilder.prototype as unknown as {
  tenantId?: (this: IDslBuilder) => IDslBuilder
}
const originalTenantId = tenantProto.tenantId

tenantProto.tenantId ??= function tenantId(this: IDslBuilder) {
  return this.pattern(/^tenant_[a-z0-9]+$/)
}

const field = (s('string!') as TenantIdBuilder).tenantId().label('Tenant')
const schema = s({ tenant: field })

console.log('custom-chain-methods.builder.valid =',
  validate(schema, { tenant: 'tenant_demo' }).valid)
console.log('custom-chain-methods.builder.invalid =',
  validate(schema, { tenant: 'bad' }).valid)

const transformResult = transformSchemaDsl(
  'export const tenant = "string!".tenantId().label("Tenant")',
  {
    filename: 'tenant-schema.ts',
    additionalMethods: ['tenantId'],
  },
)

const customTypeTransform = transformSchemaDsl(
  'export const tenant = "tenant-id!".tenantId().label("Tenant")',
  {
    filename: 'tenant-type-schema.ts',
    additionalMethods: ['tenantId'],
    additionalTypes: ['tenant-id'],
  },
)

console.log('custom-chain-methods.transform.method =', transformResult.changed)
console.log('custom-chain-methods.transform.type =', customTypeTransform.changed)

if (originalTenantId) {
  tenantProto.tenantId = originalTenantId
} else {
  delete tenantProto.tenantId
}
resetRuntimeState()
