import { dsl, validate, Locale } from '../../dist/index.js'

// ============================================================
// Dynamic locale — detect the right locale at request time
//
// Common pattern: parse Accept-Language header from HTTP request
// and pass the matched locale to validate().
// ============================================================

// ============================================================
// 1. Accept-Language parser
// ============================================================

/** Parse the Accept-Language header and return the best supported locale. */
function parseAcceptLanguage(header: string | undefined): string {
  const SUPPORTED = new Set<string>(['zh-CN', 'en-US'])

  if (!header) return 'en-US'

  // "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7"  → ['zh-CN','zh','en-US','en']
  const candidates = header
    .split(',')
    .map(part => part.split(';')[0]?.trim() ?? '')
    .filter(Boolean)

  // Exact match first
  const exact = candidates.find(c => SUPPORTED.has(c))
  if (exact) return exact

  // Language-tag match (zh → zh-CN)
  const lang = candidates.find(c => {
    const base = c.split('-')[0]?.toLowerCase()
    if (base === 'zh') return SUPPORTED.has('zh-CN')
    if (base === 'en') return SUPPORTED.has('en-US')
    return false
  })
  if (lang) {
    const base = lang.split('-')[0]?.toLowerCase()
    if (base === 'zh') return 'zh-CN'
    if (base === 'en') return 'en-US'
  }

  return 'en-US'
}

// ============================================================
// 2. Validation with detected locale
// ============================================================

const registerSchema = dsl({
  username: dsl('string:3-32!').label('username'),
  email:    dsl('email!').label('email address'),
  age:      dsl('integer:18-120').label('age'),
})

const badPayload = { username: 'ab', email: 'bad-email', age: 15 }

const zhResult = validate(registerSchema, badPayload, {
  locale:    parseAcceptLanguage('zh-CN,zh;q=0.9,en;q=0.8'),
  allErrors: true,
})

const enResult = validate(registerSchema, badPayload, {
  locale:    parseAcceptLanguage('en-US,en;q=0.8'),
  allErrors: true,
})

const defaultResult = validate(registerSchema, badPayload, {
  locale:    parseAcceptLanguage(undefined),  // no header → en-US
  allErrors: true,
})

console.log('dynamic-locale.zh.locale      =', 'zh-CN')
console.log('dynamic-locale.zh.valid       =', zhResult.valid)          // false
console.log('dynamic-locale.zh.msgs        =', zhResult.errors?.map(e => e.message))

console.log('dynamic-locale.en.locale      =', 'en-US')
console.log('dynamic-locale.en.valid       =', enResult.valid)          // false
console.log('dynamic-locale.en.msgs        =', enResult.errors?.map(e => e.message))

console.log('dynamic-locale.default.locale =', 'en-US')
console.log('dynamic-locale.default.valid  =', defaultResult.valid)     // false

// ============================================================
// 3. Express-style middleware simulation
// ============================================================

interface MockRequest  { headers: { 'accept-language'?: string }; body: unknown }
interface MockResponse { status(code: number): MockResponse; json(data: unknown): void }

function validateMiddleware(schema: ReturnType<typeof dsl>) {
  return (req: MockRequest, res: MockResponse, next: () => void) => {
    const locale = parseAcceptLanguage(req.headers['accept-language'])
    const result = validate(schema, req.body, { locale, allErrors: true })
    if (!result.valid) {
      res.status(422).json({ errors: result.errors?.map(e => ({ path: e.path, message: e.message })) })
      return
    }
    next()
  }
}

const middleware = validateMiddleware(registerSchema)

// Simulate zh-CN request
let capturedStatus = 0
const mockRes = {
  status(code: number) { capturedStatus = code; return mockRes },
  json(data: unknown) { console.log('dynamic-locale.middleware.body  =', JSON.stringify(data).length > 10) },
}
middleware(
  { headers: { 'accept-language': 'zh-CN,zh;q=0.9' }, body: badPayload },
  mockRes,
  () => { console.log('dynamic-locale.middleware.next  = called') },
)
console.log('dynamic-locale.middleware.status =', capturedStatus)  // 422

// ============================================================
// 4. Available locales
// ============================================================

console.log('dynamic-locale.available      =',
  Locale.getAvailableLocales().filter(l => l === 'zh-CN' || l === 'en-US').join(','))  // 'zh-CN,en-US' (order may vary)