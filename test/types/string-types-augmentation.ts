import '../../src/string-types.js'
import { dsl, s, type IDslBuilder } from '../../src/pure.js'

declare module '../../src/types/dsl.js' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder
  }

  interface IDslBuilder {
    tenantId(): this
  }
}

declare module '../../src/string-types.js' {
  interface SchemaDslStringExtensions {
    tenantId(): IDslBuilder
  }
}

const tenant: IDslBuilder = 'string!'.tenantId().label('Tenant')
const builderTenant: IDslBuilder = dsl('string!').tenantId().label('Tenant')
const namespaceTenant: IDslBuilder = s.tenantId().require().tenantId()
const dslNamespaceTenant: IDslBuilder = dsl.tenantId().tenantId()

tenant.toSchema()
builderTenant.toSchema()
namespaceTenant.toSchema()
dslNamespaceTenant.toSchema()
