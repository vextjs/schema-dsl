import { dsl, validate } from '../../dist/index.js'

const formSchema = dsl({
  username: dsl('string:3-32!').label('用户名'),
  email: dsl('email!').label('邮箱地址'),
})

type RequestLike = {
  header?: string
  cookie?: string
  session?: string
}

function resolveLocale(request: RequestLike): string {
  return request.header ?? request.cookie ?? request.session ?? 'en-US'
}

function validateForm(request: RequestLike, formData: Record<string, unknown>) {
  const locale = resolveLocale(request)
  const result = validate(formSchema, formData, { locale })

  const fieldErrors = (result.errors ?? []).reduce<Record<string, string>>((accumulator, error, index) => {
    const key = String(error.path ?? `root.${index}`)
    accumulator[key] = error.message ?? 'Validation error'
    return accumulator
  }, {})

  return {
    locale,
    valid: result.valid,
    fieldCount: Object.keys(fieldErrors).length,
  }
}

const headerFirst = validateForm(
  { header: 'zh-CN', cookie: 'en-US', session: 'ja-JP' },
  { username: 'ab', email: 'bad-email' },
)

const cookieFallback = validateForm(
  { cookie: 'en-US' },
  { username: 'ab', email: 'bad-email' },
)

console.log('frontend-i18n.headerFirst.locale =', headerFirst.locale)
console.log('frontend-i18n.headerFirst.valid =', headerFirst.valid)
console.log('frontend-i18n.headerFirst.fieldCount =', headerFirst.fieldCount)
console.log('frontend-i18n.cookieFallback.locale =', cookieFallback.locale)
console.log('frontend-i18n.cookieFallback.valid =', cookieFallback.valid)