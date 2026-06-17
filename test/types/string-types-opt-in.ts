import '../../src/string-types.js'
import type { IDslBuilder, JSONSchema } from '../../src/pure.js'

const field: IDslBuilder = 'email!'.label('Email').required()
const schema: JSONSchema = 'string!'.toJsonSchema()

field.toSchema()
schema.type
