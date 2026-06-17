import 'schema-dsl/string-types'
import { dsl, type DslBuilder, type IDslBuilder } from 'schema-dsl/pure'

const field: IDslBuilder = 'email!'.label('Email')
const concrete: DslBuilder = dsl('email!')

field.toSchema()
concrete.toSchema()
