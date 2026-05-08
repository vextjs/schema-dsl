import { dsl, Validator } from '../../dist/index.js'

const validator = new Validator({ cache: true })

const schema = dsl({
  name: 'string:1-50!',
  email: 'email!',
  score: 'number:0-100',
})

const validateUser = validator.compile(schema, 'compile-user')
const reusedValidateUser = validator.compile(schema, 'compile-user')

console.log('compile.sameFunction =', validateUser === reusedValidateUser)

const validData = {
  name: 'Rocky',
  email: 'rocky@example.com',
  score: 95,
}

const invalidData = {
  name: '',
  email: 'bad-email',
  score: 120,
}

const validCompiled = validateUser(validData)
const invalidCompiled = validateUser(invalidData)

console.log('compile.validData =', validCompiled)
console.log('compile.invalidData =', invalidCompiled)
if (!invalidCompiled && validateUser.errors) {
  console.log('compile.errors =', validateUser.errors)
}