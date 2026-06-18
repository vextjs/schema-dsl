import 'schema-dsl/string-types'
import { dsl, s, type IDslBuilder } from 'schema-dsl/pure'

const alias: typeof dsl = s
const field: IDslBuilder = 'email!'.label('Email').require()
const arrayField: IDslBuilder = 'array'.items('string!')
const factoryField: IDslBuilder = s.email().require()
const wrapped: IDslBuilder = dsl('email!')

alias.email().toSchema()
field.toSchema()
arrayField.toSchema()
factoryField.toSchema()
wrapped.toSchema()
