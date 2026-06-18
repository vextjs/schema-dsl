import { Locale, s, validate } from '../../dist/pure.js'

// ============================================================
// Multi-language validation — using built-in + custom locales
// ============================================================

// ============================================================
// 1. Available built-in locales
// ============================================================

const locales = Locale.getAvailableLocales()
console.log('multi-language.builtin.includes.en    =', locales.includes('en-US'))  // true
console.log('multi-language.builtin.includes.zh    =', locales.includes('zh-CN'))  // true
console.log('multi-language.builtin.includes.ja    =', locales.includes('ja-JP'))  // true

// ============================================================
// 2. Per-request locale override
// ============================================================

const schema = s({
  email:    s('email!').label('Email'),
  username: s('string:3-32!').label('Username'),
})

Locale.setLocale('zh-CN')

const zhResult = validate(schema, { email: 'bad', username: 'x' })
const enResult = validate(schema, { email: 'bad', username: 'x' }, { locale: 'en-US' })
const jaResult = validate(schema, { email: 'bad', username: 'x' }, { locale: 'ja-JP' })

console.log('multi-language.zh.valid               =', zhResult.valid)   // false
console.log('multi-language.en.valid               =', enResult.valid)   // false
console.log('multi-language.ja.valid               =', jaResult.valid)   // false

// Different locales produce different messages
const zhMsg = zhResult.errors?.[0]?.message ?? ''
const enMsg = enResult.errors?.[0]?.message ?? ''

console.log('multi-language.diff.messages          =', zhMsg !== enMsg)  // true

// ============================================================
// 3. Register a new locale (Spanish)
// ============================================================

Locale.addLocale('es-ES', {
  required:              '{{#label}} es obligatorio',
  'string.minLength':    '{{#label}} debe tener al menos {{#limit}} caracteres',
  'format.email':        'Introduzca un {{#label}} válido',
  'string.maxLength':    '{{#label}} no puede superar {{#limit}} caracteres',
})

const esResult = validate(schema, { email: 'bad' }, { locale: 'es-ES' })

console.log('multi-language.es.valid               =', esResult.valid)   // false
console.log('multi-language.es.message.isString    =', typeof esResult.errors?.[0]?.message)  // 'string'

// Verify Spanish locale is now available
console.log('multi-language.es.available           =',
  Locale.getAvailableLocales().includes('es-ES'))  // true

// ============================================================
// 4. Fall back when locale not registered
//    (Locale falls back to en-US)
// ============================================================

const unknownResult = validate(schema, { email: 'bad' }, { locale: 'xx-XX' })

console.log('multi-language.unknown.stillValid     =', typeof unknownResult.valid)   // 'boolean'
console.log('multi-language.unknown.hasErrors      =', (unknownResult.errors?.length ?? 0) > 0)  // true

// ============================================================
// 5. Locale.getMessageText() — direct message lookup
// ============================================================

const enText = Locale.getMessageText('required', { label: 'Email' }, 'en-US')
const esText = Locale.getMessageText('required', { label: 'Email' }, 'es-ES')

console.log('multi-language.msg.en                 =', enText.length > 0)   // true
console.log('multi-language.msg.es.hasWord         =', esText.includes('Email'))  // true (interpolated)

// ============================================================
// 6. Reset to default locale
// ============================================================

Locale.setLocale('en-US')
console.log('multi-language.reset.locale           =', Locale.getLocale())  // 'en-US'