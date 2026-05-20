import { dsl, validate, Locale } from '../../dist/index.js'

// ============================================================
// i18n — internationalized validation messages
//
// schema-dsl ships with zh-CN and en-US built-in.
// Pass { locale: 'zh-CN' } to validate() to switch language.
// ============================================================

// ============================================================
// 1. Built-in locales: en-US and zh-CN
// ============================================================

const profileSchema = dsl({
  username: dsl('string:3-32!').label('Username'),
  email:    dsl('email!').label('Email'),
  age:      dsl('integer:18-120').label('Age'),
})

// English errors
const enResult = validate(profileSchema, { username: 'x', email: 'bad', age: 15 }, {
  locale:    'en-US',
  allErrors: true,
})
console.log('i18n.en.valid          =', enResult.valid)   // false
console.log('i18n.en.msgs           =', enResult.errors?.map(e => e.message))

// Chinese errors
const zhResult = validate(profileSchema, { username: 'x', email: 'bad', age: 15 }, {
  locale:    'zh-CN',
  allErrors: true,
})
console.log('i18n.zh.valid          =', zhResult.valid)   // false
console.log('i18n.zh.msgs           =', zhResult.errors?.map(e => e.message))

// ============================================================
// 2. Custom locale — extend or define from scratch
// ============================================================

Locale.addLocale('de-DE', {
  required:               '{{#label}} ist erforderlich',
  'string.minLength':     '{{#label}} muss mindestens {{#limit}} Zeichen haben',
  'string.maxLength':     '{{#label}} darf maximal {{#limit}} Zeichen haben',
  'format.email':         '{{#label}} muss eine gültige E-Mail sein',
} as any)

const deResult = validate(profileSchema, { username: 'x', email: 'bad@' }, {
  locale:    'de-DE',
  allErrors: true,
})
console.log('i18n.de.msgs           =', deResult.errors?.map(e => e.message))

// ============================================================
// 3. Per-field custom messages override the locale
// ============================================================

const formSchema = dsl({
  username: dsl('string:3-20!')
    .label('username')
    .error({
      minLength: 'username must be at least 3 characters',
      maxLength: 'username must be at most 20 characters',
    }),
  password: dsl('string:8-64!')
    .label('password')
    .error({ minLength: 'password must be at least 8 characters' }),
})

const formResult = validate(formSchema, { username: 'x', password: 'abc' }, {
  locale:    'zh-CN',
  allErrors: true,
})
// Custom .error() messages take precedence over locale messages
console.log('i18n.field.overrides   =', formResult.errors?.map(e => e.message))

// ============================================================
// 4. Locale.getMessageText() — resolve a message key manually
// ============================================================

const msg = Locale.getMessageText('required', { label: 'Email' }, 'en-US')
console.log('i18n.getMessageText    =', typeof msg)  // 'string'

// ============================================================
// 5. Locale.getAvailableLocales() — list loaded locales
// ============================================================

const locales = Locale.getAvailableLocales()
console.log('i18n.available         =', locales.includes('en-US') && locales.includes('zh-CN'))  // true
console.log('i18n.hasCustom         =', locales.includes('de-DE'))                                // true