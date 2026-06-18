import { s, validate, Locale } from '../../dist/pure.js'

// ============================================================
// Adding a custom locale — define your own error messages
//
// Locale.addLocale(code, messages) registers a new locale.
// Message values support {{#label}} and {{#limit}} interpolation.
// ============================================================

// ============================================================
// 1. Register a Portuguese (Brazil) locale
// ============================================================

Locale.addLocale('pt-BR', {
  required:               '{{#label}} é obrigatório',
  'string.minLength':     '{{#label}} deve ter pelo menos {{#limit}} caracteres',
  'string.maxLength':     '{{#label}} pode ter no máximo {{#limit}} caracteres',
  'string.pattern':       '{{#label}} contém caracteres inválidos',
  'format.email':         '{{#label}} deve ser um endereço de e-mail válido',
  'number.minimum':       '{{#label}} deve ser pelo menos {{#limit}}',
  'number.maximum':       '{{#label}} deve ser no máximo {{#limit}}',
  'integer.minimum':      '{{#label}} deve ser pelo menos {{#limit}}',
  'integer.maximum':      '{{#label}} deve ser no máximo {{#limit}}',
  'type.string':          '{{#label}} deve ser uma string',
  'type.number':          '{{#label}} deve ser um número',
  'enum':                 '{{#label}} deve ser um dos valores: {{#values}}',
} as any)

// ============================================================
// 2. Use the custom locale in validation
// ============================================================

const signupSchema = s({
  username: s('string:3-32!').label('Nome de usuário'),
  email:    s('email!').label('Endereço de e-mail'),
  age:      s('integer:18-120').label('Idade'),
  role:     s('admin|user|guest').label('Cargo'),
})

const ptResult = validate(signupSchema, { username: 'ab', email: 'bad', age: 15, role: 'invalid' }, {
  locale:    'pt-BR',
  allErrors: true,
})
console.log('add-custom-locale.pt.valid       =', ptResult.valid)          // false
console.log('add-custom-locale.pt.errors      =', ptResult.errors?.map(e => e.message))

// ============================================================
// 3. Locale.getMessageText() — resolve a message manually
// ============================================================

const reqMsg  = Locale.getMessageText('required',          { label: 'Nome de usuário' }, 'pt-BR')
const lenMsg  = Locale.getMessageText('string.minLength',  { label: 'Senha', limit: '8' }, 'pt-BR')

console.log('add-custom-locale.getMessageText.required =', typeof reqMsg)  // 'string'
console.log('add-custom-locale.getMessageText.minLength =', typeof lenMsg) // 'string'

// ============================================================
// 4. Locale fallback — unknown locale falls back to en-US
// ============================================================

const fallbackResult = validate(signupSchema, { username: 'ab', email: 'bad' }, {
  locale: 'fr-FR',    // not registered — falls back to en-US
})
console.log('add-custom-locale.fallback.msg   =', typeof fallbackResult.errors?.[0]?.message) // 'string'

// ============================================================
// 5. Verify the locale is registered
// ============================================================

const available = Locale.getAvailableLocales()
console.log('add-custom-locale.available.ptBR =', available.includes('pt-BR'))  // true
console.log('add-custom-locale.available.enUS =', available.includes('en-US'))  // true

// ============================================================
// 6. Override single messages — field-level .error() wins
// ============================================================

const strictForm = s({
  password: s('string:8-64!')
    .label('Senha')
    .error({ minLength: 'A senha precisa ter no mínimo 8 caracteres.' }),
})

const overrideResult = validate(strictForm, { password: 'abc' }, { locale: 'pt-BR' })
// Custom .error() message wins over locale
console.log('add-custom-locale.override.msg   =',
  overrideResult.errors?.[0]?.message?.includes('8 caracteres'))  // true