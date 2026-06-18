import 'schema-dsl/string-types'
import { dsl, s, type IDslBuilder } from 'schema-dsl/pure'

declare module 'schema-dsl/pure' {
  interface DslNamespaceFactories {
    tenantId(): IDslBuilder
  }

  interface IDslBuilder {
    tenantId(): this
  }
}

declare module 'schema-dsl/string-types' {
  interface SchemaDslStringExtensions {
    tenantId(): IDslBuilder
  }
}

const direct: IDslBuilder = 'string!'.tenantId().label('Tenant')
const wrapped: IDslBuilder = dsl('string!').tenantId().label('Tenant')
const namespaceTenant: IDslBuilder = s.tenantId().require().tenantId()
const dslNamespaceTenant: IDslBuilder = dsl.tenantId().tenantId()

direct.toSchema()
wrapped.toSchema()
namespaceTenant.toSchema()
dslNamespaceTenant.toSchema()
