import { dsl, SchemaHelper } from '../../dist/index.js'

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  profile: {
    bio: 'string:500',
    avatar: 'url',
  },
})

const summary = SchemaHelper.summarizeSchema(userSchema)
const flattened = SchemaHelper.flattenSchema(userSchema)
const requiredFields = SchemaHelper.extractRequiredFields(userSchema)
const schemaId1 = SchemaHelper.generateSchemaId(userSchema)
const schemaId2 = SchemaHelper.generateSchemaId(userSchema)
const clonedSchema = SchemaHelper.cloneSchema(userSchema)

console.log('schema-helper.valid =', SchemaHelper.isValidSchema(userSchema))
console.log('schema-helper.fieldPaths =', SchemaHelper.getFieldPaths(userSchema).join(','))
console.log('schema-helper.required =', requiredFields.join(','))
console.log(
  'schema-helper.summary =',
  JSON.stringify({
    fieldCount: summary.fieldCount,
    requiredCount: summary.requiredCount,
    complexity: summary.complexity,
  }),
)
console.log('schema-helper.flatKeys =', Object.keys(flattened).join(','))
console.log('schema-helper.sameId =', schemaId1 === schemaId2)
console.log('schema-helper.compare =', SchemaHelper.compareSchemas(userSchema, clonedSchema))