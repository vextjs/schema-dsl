import '../../src/string-types.js'
import { dsl, s, type IDslBuilder, type JSONSchema } from '../../src/pure.js'

const alias: typeof dsl = s
const field: IDslBuilder = 'email!'.label('Email').require()
const arrayField: IDslBuilder = 'array'.items('string!')
const objectArrayField: IDslBuilder = s.array({ name: 'string!', quantity: s.number().min(1).require() })
const objectArrayItemsField: IDslBuilder = s.array().items({ name: 'string!' })
const schema: JSONSchema = 'string!'.toJsonSchema()
const factoryField: IDslBuilder = s.email().label('Email').require()
const objectSchema: JSONSchema = s({ email: s.email().require() })

// @ts-expect-error Field builder require() does not accept a field argument.
s.email().require('email')

alias.email().toSchema()
field.toSchema()
arrayField.toSchema()
objectArrayField.toSchema()
objectArrayItemsField.toSchema()
field.validate('user@example.com')
factoryField.validate('user@example.com')
factoryField.toSchema()
schema.type
objectSchema.properties

// @ts-expect-error String type opt-in does not add direct .validate() on raw strings.
'email!'.validate('user@example.com')
