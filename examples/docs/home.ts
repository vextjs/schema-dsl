import { dsl, validate, Validator } from '../../dist/index.js'

const homeSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名只能包含字母、数字和下划线' }),
  email: 'email!',
  age: 'number:18-120',
  roles: 'array:1-3<string>',
  profile: {
    nickname: 'string:2-20',
    website: 'url',
  },
})

const validUser = {
  username: 'rocky_01',
  email: 'rocky@example.com',
  age: 28,
  roles: ['author', 'admin'],
  profile: {
    nickname: 'Rocky',
    website: 'https://example.com',
  },
}

const invalidUser = {
  username: 'rocky 01',
  email: 'invalid-email',
  age: 12,
  roles: [],
  profile: {
    nickname: 'R',
    website: 'not-a-url',
  },
}

const validResult = validate(homeSchema, validUser)
const invalidResult = validate(homeSchema, invalidUser)

console.log('home.validate(validUser).valid =', validResult.valid)
console.log('home.validate(invalidUser).valid =', invalidResult.valid)
console.log('home.validate(invalidUser).errors =', invalidResult.errors)

const validator = new Validator({ cache: true })
const compiled = validator.compile(homeSchema, 'home-schema')
const compiledValid = compiled(validUser)
const compiledInvalid = compiled(invalidUser)

console.log('home.compile(validUser) =', compiledValid)
console.log('home.compile(invalidUser) =', compiledInvalid)
if (!compiledInvalid && compiled.errors) {
  console.log('home.compile.errors =', compiled.errors)
}