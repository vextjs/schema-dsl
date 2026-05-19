import {
  dsl, validate, validateAsync,
  I18nError, Locale, ErrorFormatter, ValidationError,
} from '../../dist/index.js'

// ============================================================
// 1. ValidationErrorItem structure — path, keyword, message
// ============================================================

const profileSchema = dsl({
  username: dsl('string:3-32!').label('Username'),
  email:    dsl('email!').label('Email'),
  age:      dsl('integer:18-120').label('Age'),
  role:     dsl('admin|user|guest!').label('Role'),
  website:  dsl('url').label('Website'),
})

const invalidData = {
  username: 'ab',           // too short  (minLength)
  email:    'bad-email',    // format     (email)
  age:      15,             // too small  (minimum)
  role:     'owner',        // not in set (enum)
  website:  'not-a-url',    // format     (uri)
}

const result = validate(profileSchema, invalidData, { allErrors: true })
console.log('error-handling.valid =', result.valid) // false

// Each error item — { message, path, keyword, params, field, type }
result.errors?.forEach(err => {
  console.log(`  path=${err.path}  keyword=${err.keyword}  msg="${err.message}"`)
})

// Convenience accessor: first error message
console.log('error-handling.errorMessage =', result.errorMessage)

// ============================================================
// 2. Custom error messages via .error() and .messages()
// ============================================================

const formSchema = dsl({
  username: dsl('string:3-32!')
    .label('Username')
    .error({
      minLength: 'Username must be at least 3 characters',
      maxLength: 'Username cannot exceed 32 characters',
      required:  'Username is required',
    }),

  password: dsl('string:8-64!')
    .label('Password')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .error({
      minLength: 'Password is too short — at least 8 characters required',
      pattern:   'Password must contain uppercase, lowercase and digit',
    }),

  role: dsl('admin|user|guest')
    .label('Role')
    .default('user')
    .error({ enum: 'Role must be admin, user or guest' }),
})

const formResult = validate(formSchema, { username: 'x', password: 'abc', role: 'hacker' }, { allErrors: true })
console.log('error-handling.customMsg.errors =',
  formResult.errors?.map(e => e.message))

// ============================================================
// 3. ErrorFormatter — format errors from any ValidationResult
// ============================================================

const formatter = new ErrorFormatter()

// formatDetailed() → ValidationErrorItem[] — pass AJV raw errors or use 'as any' for pre-formatted items
const detailed = formatter.formatDetailed((result.errors ?? []) as any)
console.log('error-handling.formatter.count =', detailed.length)
// detailed[0]: { path, keyword, message, params }

// Build a flat path → message map manually from ValidationErrorItem[]
const flat: Record<string, string> = {}
for (const err of (result.errors ?? [])) {
  if (!flat[err.path]) flat[err.path] = err.message
}
console.log('error-handling.formatter.flat.username =', typeof flat['username'])   // 'string'
console.log('error-handling.formatter.flat.email =',    typeof flat['email'])       // 'string'

// ErrorFormatter with zh-CN locale — format a single error item
const zhFormatter = new ErrorFormatter('zh-CN')
const zhResult  = validate(profileSchema, { username: 'x', email: 'bad' }, { locale: 'zh-CN', allErrors: true })
const zhFirst   = zhResult.errors?.[0]
const zhMessage = zhFirst ? zhFormatter.format(zhFirst as any) : ''
console.log('error-handling.formatter.zh.message =', typeof zhMessage)  // 'string'

// ============================================================
// 4. I18nError — structured business / domain errors
// ============================================================

// Register custom error codes in zh-CN
Locale.addLocale('zh-CN', {
  'payment.insufficientBalance': {
    code: 40210,
    message: 'Insufficient balance: current ¥{balance}, need ¥{required}',
  },
  'auth.tokenExpired': {
    code: 40101,
    message: 'Session expired — please log in again',
  },
} as any)

// Constructor: new I18nError(key, params, code, locale?)
const balanceError = new I18nError(
  'payment.insufficientBalance',
  { balance: 50, required: 200 },
  40210,
  'en-US',
)

console.log('error-handling.i18n.message =',
  balanceError.message) // 'Insufficient balance: current ¥50, need ¥200'
console.log('error-handling.i18n.code =',    balanceError.code)   // 40210
console.log('error-handling.i18n.is =',      balanceError.is('payment.insufficientBalance')) // true
console.log('error-handling.i18n.is.wrong =', balanceError.is('auth.tokenExpired'))           // false
console.log('error-handling.i18n.json =',     JSON.stringify(balanceError.toJSON()))

// ============================================================
// 5. I18nError.create() — factory without throwing
// ============================================================

const tokenError = I18nError.create('auth.tokenExpired', {}, 40101)
console.log('error-handling.i18n.create.instanceof =', tokenError instanceof I18nError)
console.log('error-handling.i18n.create.code =',       tokenError.code)

// ============================================================
// 6. I18nError.assert() — throw if condition is false
// ============================================================

function withdraw(balance: number, amount: number): void {
  I18nError.assert(
    balance >= amount,
    'payment.insufficientBalance',
    { balance, required: amount },
    40210,
  )
}

try {
  withdraw(50, 200)
} catch (err) {
  if (err instanceof I18nError) {
    console.log('error-handling.i18n.assert.caught =', err.code) // 40210
  }
}

// No throw when condition passes
let threw = false
try { withdraw(500, 100) } catch { threw = true }
console.log('error-handling.i18n.assert.noThrow =', threw) // false

// ============================================================
// 7. ValidationError — thrown by validateAsync on failure
// ============================================================

const strictSchema = dsl({ email: 'email!', username: 'string:3-20!' })

async function tryValidateAsync(): Promise<void> {
  try {
    await validateAsync(strictSchema, { email: 'bad', username: 'x' })
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log('error-handling.ValidationError.instanceof =', true)
      console.log('error-handling.ValidationError.errors.length =', err.errors.length)
      console.log('error-handling.ValidationError.message =',       err.message)
    }
  }
}

await tryValidateAsync()