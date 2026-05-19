import { dsl, validate, Locale } from '../../dist/index.js'

// ============================================================
// i18n user guide — dsl.config() for custom locale messages
// ============================================================

Locale.reset()

// ============================================================
// 1. Register locales via dsl.config()
// ============================================================

dsl.config({
  i18n: {
    locales: {
      'pt-BR': {
        username:           'Nome de usuário',
        email:              'E-mail',
        required:           '{{#label}} é obrigatório',
        'string.minLength': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
        'string.maxLength': '{{#label}} não pode ter mais de {{#limit}} caracteres',
        'format.email':     'Forneça um {{#label}} válido',
      },
      'de-DE': {
        username:           'Benutzername',
        email:              'E-Mail',
        required:           '{{#label}} ist erforderlich',
        'string.minLength': '{{#label}} muss mindestens {{#limit}} Zeichen lang sein',
        'string.maxLength': '{{#label}} darf nicht länger als {{#limit}} Zeichen sein',
        'format.email':     'Bitte geben Sie eine gültige {{#label}} ein',
      },
      'fr-FR': {
        username:           "Nom d'utilisateur",
        email:              'Adresse e-mail',
        required:           '{{#label}} est requis',
        'string.minLength': '{{#label}} doit comporter au moins {{#limit}} caractères',
        'format.email':     'Veuillez saisir une {{#label}} valide',
      },
    },
  },
})

// ============================================================
// 2. Validate with per-locale errors
// ============================================================

const schema = dsl({
  username: dsl('string:3-32!').label('username'),
  email:    dsl('email!').label('email'),
})

const ptResult = validate(schema, { username: 'ab', email: 'bad-email' }, { locale: 'pt-BR' })
const deResult = validate(schema, { username: 'ab', email: 'bad-email' }, { locale: 'de-DE' })
const frResult = validate(schema, { username: 'ab', email: 'bad-email' }, { locale: 'fr-FR' })

console.log('i18n-user-guide.pt.valid           =', ptResult.valid)   // false
console.log('i18n-user-guide.de.valid           =', deResult.valid)   // false
console.log('i18n-user-guide.fr.valid           =', frResult.valid)   // false

// ============================================================
// 3. Direct message lookup via Locale.getMessageText()
// ============================================================

console.log('i18n-user-guide.pt.username        =', Locale.getMessageText('username', {}, 'pt-BR'))
// 'Nome de usuário'

console.log('i18n-user-guide.de.username        =', Locale.getMessageText('username', {}, 'de-DE'))
// 'Benutzername'

console.log('i18n-user-guide.pt.required        =',
  Locale.getMessageText('required', { label: 'username' }, 'pt-BR'))
// 'Nome de usuário é obrigatório'  (label key is interpolated first)

console.log('i18n-user-guide.de.minLength       =',
  Locale.getMessageText('string.minLength', { label: 'username', limit: '3' }, 'de-DE'))

// ============================================================
// 4. Global locale — affects all validate() calls without explicit locale
// ============================================================

Locale.setLocale('pt-BR')
const globalPtResult = validate(schema, { username: 'x' })

console.log('i18n-user-guide.global.locale      =', Locale.getLocale())    // 'pt-BR'
console.log('i18n-user-guide.global.valid       =', globalPtResult.valid)  // false
console.log('i18n-user-guide.global.hasErrors   =', (globalPtResult.errors?.length ?? 0) > 0)  // true

// Restore default
Locale.setLocale('en-US')
console.log('i18n-user-guide.restored.locale    =', Locale.getLocale())   // 'en-US'