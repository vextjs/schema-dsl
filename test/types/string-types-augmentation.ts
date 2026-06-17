import '../../src/string-types.js'
import { dsl, type IDslBuilder } from '../../src/pure.js'

declare module '../../src/types/dsl.js' {
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

tenant.toSchema()
builderTenant.toSchema()
