import { dsl, Validator } from '../../dist/index.js'

const validator = new Validator({
  allErrors: true,
  useDefaults: true,
  coerceTypes: true,
  cache: true,
})

const schema = dsl({
  email: 'email!',
  age: 'integer:18-120',
  status: dsl('string').default('active'),
})

const singleResult = validator.validate(schema, {
  email: 'user@example.com',
  age: '24',
})

console.log('validator.singleResult.valid =', singleResult.valid)
console.log('validator.singleResult.data =', singleResult.data)

const compiled1 = validator.compile(schema, 'validator-demo')
const compiled2 = validator.compile(schema, 'validator-demo')
console.log('validator.compile cache hit =', compiled1 === compiled2)

const batchResults = validator.validateBatch(schema, [
  { email: 'a@example.com', age: 30, status: 'active' },
  { email: 'bad-email', age: 12, status: 'inactive' },
])

console.log('validator.batch valid flags =', batchResults.map(result => result.valid))