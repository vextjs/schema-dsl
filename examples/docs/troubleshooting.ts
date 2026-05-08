import { dsl, validate, Validator } from '../../dist/index.js'

const debugSchema = dsl({
  username: 'string:3-12!',
  email: 'email!',
  age: 'number:18-120',
})

const invalidData = {
  username: 'ab',
  email: 'invalid-email',
  age: 12,
}

const directResult = validate(debugSchema, invalidData)

const validator = new Validator()
const compiled = validator.compile(debugSchema, 'troubleshooting-user')
const compiledValid = compiled(invalidData)

console.log('troubleshooting.validate.valid =', directResult.valid)
console.log(
  'troubleshooting.validate.errors =',
  directResult.errors?.map(({ path, keyword, message }) => ({ path, keyword, message })),
)
console.log('troubleshooting.compile.valid =', compiledValid)
console.log('troubleshooting.compile.errors =', compiled.errors)