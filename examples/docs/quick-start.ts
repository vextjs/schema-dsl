import { dsl, validate, Validator } from '../../dist/index.js'

const registerSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({
      pattern: '只能包含字母、数字和下划线',
    }),
  email: dsl('email!').label('邮箱地址'),
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .label('密码')
    .error({
      pattern: '必须包含大小写字母和数字',
    }),
  age: 'number:18-120',
  role: 'user|admin',
})

const validUser = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user',
}

const invalidUser = {
  username: 'john$',
  email: 'not-an-email',
  password: 'password',
  age: 16,
  role: 'guest',
}

const quickResult = validate(registerSchema, validUser)
const invalidResult = validate(registerSchema, invalidUser)

console.log('validate(validUser).valid =', quickResult.valid)
console.log('validate(invalidUser).valid =', invalidResult.valid)
if (!invalidResult.valid) {
  console.log('validate(invalidUser).errors =', invalidResult.errors)
}

const validator = new Validator()
const compiled = validator.compile(registerSchema)

console.log('compile(validUser) =', compiled(validUser))
console.log('compile(invalidUser) =', compiled(invalidUser))