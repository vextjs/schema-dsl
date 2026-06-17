import 'schema-dsl/string-types'
import { dsl, type IDslBuilder } from 'schema-dsl/pure'

declare module 'schema-dsl/pure' {
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

direct.toSchema()
wrapped.toSchema()
