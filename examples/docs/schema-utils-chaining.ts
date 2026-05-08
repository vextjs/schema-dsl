import { dsl, validate, SchemaUtils } from '../../dist/index.js'

const baseSchema = dsl({
  id: 'objectId!',
  name: 'string:1-50!',
  email: 'email!',
  password: 'string:8-32!',
  age: 'integer:0-150',
})

const chainedSchema = SchemaUtils
  .omit(baseSchema, ['password'])
  .extend({ avatar: 'url' })
  .pick(['name', 'email', 'avatar'])
  .partial()

const validResult = validate(chainedSchema, {
  name: 'Jane',
  avatar: 'https://example.com/avatar.png',
})

const invalidResult = validate(chainedSchema, {
  name: 'Jane',
  email: 'invalid-email',
  avatar: 'not-a-url',
})

console.log('schema-utils-chaining.keys =', Object.keys(chainedSchema.properties ?? {}).join(','))
console.log('schema-utils-chaining.required =', chainedSchema.required)
console.log('schema-utils-chaining.valid =', validResult.valid)
console.log('schema-utils-chaining.invalid =', invalidResult.valid)