import { dsl, validate, Locale } from '../../dist/index.js'

Locale.reset()

Locale.addLocale('pt-BR', {
  username: 'Nome de usuário',
  email: 'Endereço de e-mail',
  required: '{{#label}} é obrigatório',
  'string.minLength': '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'format.email': 'Forneça um {{#label}} válido',
} as any)

const userSchema = dsl({
  username: dsl('string:3-32!').label('username'),
  email: dsl('email!').label('email'),
})

const result = validate(
  userSchema,
  {
    username: 'ab',
    email: 'bad-email',
  },
  { locale: 'pt-BR' },
)

console.log('add-custom-locale.username =', Locale.getMessageText('username', {}, 'pt-BR'))
console.log('add-custom-locale.required =', Locale.getMessageText('required', { label: 'email' }, 'pt-BR'))
console.log('add-custom-locale.valid =', result.valid)
console.log('add-custom-locale.errorCount =', result.errors?.length ?? 0)