import { dsl, validate, I18nError, Locale } from '../../dist/index.js'

Locale.reset()

Locale.addLocale('zh-CN', {
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元',
  },
} as any)

const registerSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email: dsl('email!').label('邮箱地址'),
})

const validationResult = validate(registerSchema, {
  username: 'ab',
  email: 'bad-email',
})

const businessError = new I18nError(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  402,
  'zh-CN',
)

console.log('error-handling.validation.valid =', validationResult.valid)
console.log(
  'error-handling.validation.errors =',
  validationResult.errors?.map(({ path, keyword, message }) => ({ path, keyword, message })),
)
console.log('error-handling.business.code =', businessError.code)
console.log('error-handling.business.isMatch =', businessError.is('account.insufficientBalance'))
console.log('error-handling.business.message =', businessError.message)
console.log('error-handling.business.json =', JSON.stringify(businessError.toJSON()))