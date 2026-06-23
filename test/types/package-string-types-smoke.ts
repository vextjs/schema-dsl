import 'schema-dsl/string-types'
import { dsl, s, type IDslBuilder } from 'schema-dsl/pure'

const alias: typeof dsl = s
const field: IDslBuilder = 'email!'.label('Email').require()
const arrayField: IDslBuilder = 'array'.items('string!')
const objectArrayField: IDslBuilder = s.array({ name: 'string!', quantity: s.number().min(1).require() })
const objectArrayItemsField: IDslBuilder = s.array().items({ name: 'string!' })
const factoryField: IDslBuilder = s.email().require()
const wrapped: IDslBuilder = dsl('email!')

alias.email().toSchema()
field.toSchema()
arrayField.toSchema()
objectArrayField.toSchema()
objectArrayItemsField.toSchema()
field.validate('user@example.com')
factoryField.validate('user@example.com')
factoryField.toSchema()
wrapped.toSchema()

// @ts-expect-error String type opt-in does not add direct .validate() on raw strings.
'email!'.validate('user@example.com')
