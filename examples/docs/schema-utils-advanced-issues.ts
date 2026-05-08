import { dsl, SchemaUtils } from '../../dist/index.js'

const builder = dsl('string!').label('用户名') as any
const rawSchema = builder.toSchema() as Record<string, unknown>
const jsonSchema = builder.toJsonSchema() as Record<string, unknown>

const userSchema = dsl({
  name: dsl('string!').label('姓名'),
  password: 'string:8-32!',
})

const omittedSchema = SchemaUtils.omit(userSchema, ['password'])
const clonedSchema = SchemaUtils.clone(userSchema)

console.log('schema-utils-advanced.rawHasLabel =', '_label' in rawSchema)
console.log('schema-utils-advanced.jsonHasLabel =', '_label' in jsonSchema)
console.log('schema-utils-advanced.required =', omittedSchema.required?.join(',') ?? 'none')
console.log('schema-utils-advanced.cloneNewObject =', clonedSchema !== userSchema)