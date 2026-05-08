import { dsl, validate, Locale } from '../../dist/index.js'

Locale.reset()

dsl.config({
  i18n: {
    locales: {
      'pt-BR': {
        username: 'Nome de usuário',
        required: '{{#label}} é obrigatório',
        'string.minLength': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
        'format.email': 'Forneça um {{#label}} válido',
      },
      'de-DE': {
        username: 'Benutzername',
        required: '{{#label}} ist erforderlich',
        'string.minLength': '{{#label}} muss mindestens {{#limit}} Zeichen haben',
        'format.email': 'Bitte geben Sie eine gültige {{#label}} ein',
      },
    },
  },
})

const schema = dsl({
  username: dsl('string:3-32!').label('username'),
  email: dsl('email!').label('email'),
})

const ptResult = validate(schema, { username: 'ab', email: 'bad-email' }, { locale: 'pt-BR' })
const deResult = validate(schema, { username: 'ab', email: 'bad-email' }, { locale: 'de-DE' })

console.log('i18n-user-guide.pt.username =', Locale.getMessageText('username', {}, 'pt-BR'))
console.log('i18n-user-guide.de.username =', Locale.getMessageText('username', {}, 'de-DE'))
console.log('i18n-user-guide.pt.required =', Locale.getMessageText('required', { label: 'username' }, 'pt-BR'))
console.log('i18n-user-guide.de.required =', Locale.getMessageText('required', { label: 'username' }, 'de-DE'))
console.log('i18n-user-guide.pt.valid =', ptResult.valid)
console.log('i18n-user-guide.de.valid =', deResult.valid)