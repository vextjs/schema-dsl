import { dsl, validate, installStringExtensions, uninstallStringExtensions } from '../../dist/index.js'

installStringExtensions()

const emailField = ('email!' as any)
  .label('邮箱地址')
  .messages({ format: '请输入有效的邮箱地址' })

const usernameField = ('string:3-32!' as any)
  .pattern(/^[a-zA-Z0-9_]+$/)
  .label('用户名')
  .messages({ pattern: '用户名只能包含字母、数字和下划线' })

const bioField = ('string:10-120' as any)
  .description('个人简介')

const profileSchema = dsl({
  email: emailField,
  username: usernameField,
  bio: bioField,
})

const validResult = validate(profileSchema, {
  email: 'rocky@example.com',
  username: 'rocky_01',
  bio: 'Schema-DSL string extensions keep complex string fields readable.',
})

const invalidResult = validate(profileSchema, {
  email: 'bad-email',
  username: 'rocky 01',
  bio: 'too short',
})

console.log('string-extensions.valid =', validResult.valid)
console.log('string-extensions.invalid =', invalidResult.valid)
console.log('string-extensions.invalid.errors =', invalidResult.errors)
console.log('string-extensions.hasLabelBeforeUninstall =', typeof ('email!' as any).label === 'function')

uninstallStringExtensions()
console.log('string-extensions.hasLabelAfterUninstall =', typeof ('email!' as any).label === 'function')

installStringExtensions()
console.log('string-extensions.hasLabelAfterReinstall =', typeof ('email!' as any).label === 'function')