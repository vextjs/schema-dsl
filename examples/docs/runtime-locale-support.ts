import { dsl, Locale, I18nError } from '../../dist/index.js'

// ============================================================
// Runtime locale support — custom business error messages
//
// Use I18nError for application-level errors (auth, payments, etc.)
// Use Locale.addLocale() to register translations at startup
// ============================================================

Locale.reset()

// ============================================================
// 1. Register business error translations for multiple locales
// ============================================================

Locale.addLocale('zh-CN', {
  'account.notFound': {
    code: 40001,
    message: 'account not found',
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'insufficient balance, current {{#balance}}, required {{#required}}',
  },
  'account.locked': {
    code: 40003,
    message: 'account is locked',
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
  'account.locked': {
    code: 40003,
    message: 'Account is locked',
  },
} as any)

Locale.setLocale('zh-CN')

// ============================================================
// 2. Create I18nError instances (correct API — NOT dsl.error.create)
// ============================================================

const zhNotFound = I18nError.create('account.notFound', 'zh-CN')
const enNotFound = I18nError.create('account.notFound', 'en-US')

console.log('runtime-locale.globalLocale        =', Locale.getLocale())          // 'zh-CN'
console.log('runtime-locale.zh.message          =', zhNotFound.message)          // 'account not found'
console.log('runtime-locale.en.message          =', enNotFound.message)          // 'Account not found'
console.log('runtime-locale.code.same           =', zhNotFound.code === enNotFound.code)  // true — same error code

// ============================================================
// 3. Parameterised error messages
// ============================================================

const balanceError = new I18nError(
  'account.insufficientBalance',
  { balance: 50, required: 100 },
  402,
  'en-US',
)

console.log('runtime-locale.balance.code        =', balanceError.code)         // 40002
console.log('runtime-locale.balance.statusCode  =', balanceError.statusCode)  // 402
console.log('runtime-locale.balance.hasBalance  =',
  balanceError.message.includes('50'))  // true — interpolated

// ============================================================
// 4. I18nError.throw() — shorthand for throw new I18nError(...)
// ============================================================

try {
  I18nError.throw('account.locked', 'en-US', 403)
} catch (e) {
  const err = e as I18nError
  console.log('runtime-locale.throw.message       =', err.message)      // 'Account is locked'
  console.log('runtime-locale.throw.statusCode    =', err.statusCode)   // 403
}

// ============================================================
// 5. I18nError.assert() — conditional throw
// ============================================================

function transferFunds(balance: number, amount: number): void {
  I18nError.assert(balance >= amount, 'account.insufficientBalance',
    { balance, required: amount }, 402, 'en-US')
  // transfer logic here...
}

try {
  transferFunds(30, 100)
} catch (e) {
  const err = e as I18nError
  console.log('runtime-locale.assert.triggered    =', err.code === 40002)  // true
}

// ============================================================
// 6. err.is() — error code check without instanceof juggling
// ============================================================

const testErr = I18nError.create('account.notFound', 'en-US')
console.log('runtime-locale.is.notFound         =', testErr.is('account.notFound'))         // true
console.log('runtime-locale.is.otherCode        =', testErr.is('account.locked'))           // false

// ============================================================
// 7. toJSON() — serialisable structure for API responses
// ============================================================

const errJson = testErr.toJSON()
console.log('runtime-locale.toJSON.hasCode      =', 'code' in errJson)     // true
console.log('runtime-locale.toJSON.hasMessage   =', 'message' in errJson)  // true