import { dsl, validate } from '../../dist/index.js'

// ============================================================
// Frontend i18n guide — per-request locale resolution
//
// In web frameworks, locale is typically resolved from:
//   1. Accept-Language request header (highest priority)
//   2. User cookie / session preference
//   3. Fallback default (e.g. 'en-US')
// ============================================================

const formSchema = dsl({
  username: dsl('string:3-32!').label('Username'),
  email:    dsl('email!').label('Email Address'),
})

// ============================================================
// 1. Locale resolution helper
// ============================================================

type RequestLike = {
  header?: string   // Accept-Language
  cookie?: string   // Saved preference
  session?: string  // Session preference
}

function resolveLocale(request: RequestLike): string {
  return request.header ?? request.cookie ?? request.session ?? 'en-US'
}

// ============================================================
// 2. Validate form with per-request locale
// ============================================================

function validateForm(
  request: RequestLike,
  formData: Record<string, unknown>,
) {
  const locale = resolveLocale(request)
  const result = validate(formSchema, formData, { locale })

  const fieldErrors = (result.errors ?? []).reduce<Record<string, string>>(
    (acc, error, index) => {
      const key = String(error.path ?? `root.${index}`)
      acc[key] = error.message ?? 'Validation error'
      return acc
    },
    {},
  )

  return { locale, valid: result.valid, fieldErrors, fieldCount: Object.keys(fieldErrors).length }
}

// ============================================================
// 3. Header has highest priority
// ============================================================

const headerFirst = validateForm(
  { header: 'zh-CN', cookie: 'en-US', session: 'ja-JP' },
  { username: 'ab', email: 'bad-email' },
)

console.log('frontend-i18n.headerFirst.locale     =', headerFirst.locale)      // 'zh-CN'
console.log('frontend-i18n.headerFirst.valid      =', headerFirst.valid)       // false
console.log('frontend-i18n.headerFirst.fieldCount =', headerFirst.fieldCount)  // > 0

// ============================================================
// 4. Cookie fallback when no header
// ============================================================

const cookieFallback = validateForm(
  { cookie: 'en-US' },
  { username: 'ab', email: 'bad-email' },
)

console.log('frontend-i18n.cookie.locale          =', cookieFallback.locale)      // 'en-US'
console.log('frontend-i18n.cookie.valid           =', cookieFallback.valid)       // false

// ============================================================
// 5. Default when no locale preference found
// ============================================================

const defaultLocale = validateForm(
  {},
  { username: 'valid_user', email: 'ok@example.com' },
)

console.log('frontend-i18n.default.locale         =', defaultLocale.locale)  // 'en-US'
console.log('frontend-i18n.default.valid          =', defaultLocale.valid)   // true

// ============================================================
// 6. Valid form data in Japanese locale
// ============================================================

const jaValid = validateForm(
  { header: 'ja-JP' },
  { username: 'user_01', email: 'user@example.com' },
)

console.log('frontend-i18n.ja.locale              =', jaValid.locale)   // 'ja-JP'
console.log('frontend-i18n.ja.valid               =', jaValid.valid)    // true