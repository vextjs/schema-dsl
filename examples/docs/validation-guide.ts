import { dsl, validate, Validator } from '../../dist/index.js'

const userSchema = dsl({
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('用户名')
    .error({ pattern: '用户名只能包含字母、数字和下划线' }),
  email: 'email!',
  age: 'integer:18-120',
  country: dsl('string').default('CN'),
})

function formatErrors(errors: Array<{ path?: string; message?: string }>): string {
  return errors.map(error => `[${error.path ?? 'root'}] ${error.message ?? '未知错误'}`).join('\n')
}

const quickResult = validate(userSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
})

console.log('validation-guide.quickResult.valid =', quickResult.valid)
console.log('validation-guide.quickResult.data =', quickResult.data)

const validator = new Validator({
  allErrors: true,
  useDefaults: true,
  coerceTypes: true,
  cache: true,
})

const invalidResult = validator.validate(userSchema, {
  username: 'jd',
  email: 'bad-email',
  age: '16',
})

console.log('validation-guide.invalidResult.valid =', invalidResult.valid)
console.log('validation-guide.formattedErrors =', formatErrors(invalidResult.errors ?? []))

const compiled = validator.compile(userSchema, 'validation-guide-user')
console.log(
  'validation-guide.compiled(valid) =',
  compiled({ username: 'alice_01', email: 'alice@example.com', age: 28 }),
)

const batchResults = validator.validateBatch(userSchema, [
  { username: 'alice_01', email: 'alice@example.com', age: 28 },
  { username: 'ab', email: 'bad-email', age: 16 },
])

console.log('validation-guide.batch valid flags =', batchResults.map(result => result.valid))