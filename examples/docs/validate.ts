import { dsl, validate } from '../../dist/index.js'

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  loginCount: 'integer:0-',
})

const coercedResult = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: '25',
  loginCount: '3',
})

const noCoerceResult = validate(
  userSchema,
  {
    username: 'john_doe',
    email: 'john@example.com',
    age: '25',
    loginCount: '3',
  },
  { coerce: false },
)

const invalidResult = validate(
  userSchema,
  {
    username: 'jd',
    email: 'bad-email',
    age: 17,
    loginCount: -1,
  },
  { locale: 'zh-CN' },
)

console.log('validate.coercedResult.valid =', coercedResult.valid)
console.log('validate.coercedResult.data =', coercedResult.data)
console.log('validate.noCoerceResult.valid =', noCoerceResult.valid)
console.log('validate.invalidResult.valid =', invalidResult.valid)
console.log('validate.invalidResult.errors =', invalidResult.errors)