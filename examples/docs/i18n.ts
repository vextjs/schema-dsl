import { dsl, validate, Locale } from '../../dist/index.js'

Locale.addLocale('demo', {
  'format.email': '{{#label}}格式错误（demo）',
  required: '{{#label}}不能为空（demo）',
})

const i18nSchema = dsl({
  email: ('email!' as any).label('邮箱地址'),
  status: ('active|inactive' as any)
    .label('状态')
    .messages({ enum: '状态只能是 active 或 inactive' }),
})

const zhResult = validate(i18nSchema, { email: 'bad-email', status: 'archived' }, { locale: 'zh-CN' })
const enResult = validate(i18nSchema, { email: 'bad-email', status: 'archived' }, { locale: 'en-US' })
const demoResult = validate(
  dsl({ email: ('email!' as any).label('邮箱地址') }),
  { email: 'bad-email' },
  { locale: 'demo' },
)

console.log('i18n.zh-CN.valid =', zhResult.valid)
console.log('i18n.zh-CN.errors =', zhResult.errors)
console.log('i18n.en-US.valid =', enResult.valid)
console.log('i18n.en-US.errors =', enResult.errors)
console.log('i18n.demo.valid =', demoResult.valid)
console.log('i18n.demo.errors =', demoResult.errors)