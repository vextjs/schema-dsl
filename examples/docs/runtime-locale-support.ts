import { dsl, Locale, I18nError } from '../../dist/index.js'

Locale.reset()

Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: '账户不存在',
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前{{#balance}}元，需要{{#required}}元',
  },
} as any)

Locale.addLocale('en-US', {
  'account.notFound': {
    code: 40001,
    message: 'Account not found',
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance, current {{#balance}}, required {{#required}}',
  },
} as any)

Locale.setLocale('zh-CN')

const zhError = (dsl as any).error.create('account.notFound', 'zh-CN')
const enError = (dsl as any).error.create('account.notFound', 'en-US')
const balanceError = new I18nError(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  402,
  'en-US',
)

console.log('runtime-locale.globalLocale =', Locale.getLocale())
console.log('runtime-locale.zh.message =', zhError.message)
console.log('runtime-locale.en.message =', enError.message)
console.log('runtime-locale.balance.code =', balanceError.code)
console.log('runtime-locale.balance.message =', balanceError.message)