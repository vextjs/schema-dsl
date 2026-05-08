import { dsl, validate, Locale } from '../../dist/index.js'

Locale.reset()

const registerSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email: dsl('email!').label('邮箱地址'),
})

function parseAcceptLanguage(acceptLanguage?: string): string {
  if (!acceptLanguage) return 'en-US'

  const supported = new Set(['zh-CN', 'en-US'])
  const candidates = acceptLanguage
    .split(',')
    .map(part => part.split(';')[0]?.trim())
    .filter(Boolean) as string[]

  return candidates.find(locale => supported.has(locale)) ?? 'en-US'
}

function validateRequest(acceptLanguage: string | undefined, body: Record<string, unknown>) {
  const locale = parseAcceptLanguage(acceptLanguage)
  const result = validate(registerSchema, body, { locale })

  return {
    locale,
    valid: result.valid,
    errorCount: result.errors?.length ?? 0,
  }
}

const zhRequest = validateRequest('zh-CN,zh;q=0.9,en;q=0.8', {
  username: 'ab',
  email: 'bad-email',
})

const enRequest = validateRequest('en-US,en;q=0.8', {
  username: 'ab',
  email: 'bad-email',
})

console.log('dynamic-locale.zh.locale =', zhRequest.locale)
console.log('dynamic-locale.zh.valid =', zhRequest.valid)
console.log('dynamic-locale.en.locale =', enRequest.locale)
console.log('dynamic-locale.en.valid =', enRequest.valid)
console.log(
  'dynamic-locale.available =',
  Locale.getAvailableLocales().filter(locale => locale === 'zh-CN' || locale === 'en-US').join(','),
)