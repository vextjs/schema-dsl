import { s, validate, installStringExtensions, uninstallStringExtensions } from '../../dist/pure.js'

// ============================================================
// 1. What string extensions do
//    The pure entry does not install String.prototype methods. Install them
//    explicitly when this authoring style is intentional.
// ============================================================

installStringExtensions(s)

// After explicit install, chain methods are available on string literals.
console.log('string-ext.installed.label  =', typeof ('email!' as any).label)     // 'function'
console.log('string-ext.installed.error  =', typeof ('string!' as any).error)    // 'function'
console.log('string-ext.installed.custom =', typeof ('string!' as any).custom)   // 'function'

// ============================================================
// 2. .label() — sets a human-readable display name (used in error messages)
// ============================================================

const nameField = ('string:2-50!' as any).label('Full Name')
const schema = s({ name: nameField })

const result = validate(schema, { name: 'x' })
console.log('string-ext.label.error.message =', result.errors?.[0]?.message)  // mentions minLength

// ============================================================
// 3. .error() — override error messages per keyword
// ============================================================

const emailField = ('email!' as any)
  .label('Email Address')
  .error({ format: 'Please enter a valid email address, e.g. user@example.com' })

const passwordField = ('string:8-64!' as any)
  .label('Password')
  .error({
    minLength: 'Password must be at least 8 characters',
    maxLength: 'Password cannot exceed 64 characters',
  })

// ============================================================
// 4. .description() — adds metadata to the generated schema
// ============================================================

const bioField = ('string:10-500' as any)
  .description('A short biography displayed on the user profile page')

const rawBio = (bioField as any).toSchema?.() ?? bioField
console.log('string-ext.description.meta =', rawBio.description)  // the description string

// ============================================================
// 5. .default() — populate missing fields
// ============================================================

const roleField = ('admin|user|guest' as any).default('user')

const withDefault = validate(s({ role: roleField }), {}, { useDefaults: true })
console.log('string-ext.default.applied =', (withDefault.data as any)?.role)  // 'user'

// ============================================================
// 6. .custom() — attach a custom validator function
// ============================================================

const usernameField = ('string:3-32!' as any)
  .label('Username')
  .custom((value: unknown) => {
    const reserved = ['admin', 'root', 'system']
    return !reserved.includes((value as string).toLowerCase()) ||
      `Username '${value}' is reserved — please choose another`
  })

const usernameSchema = s({ username: usernameField })
console.log('string-ext.custom.valid   =',
  validate(usernameSchema, { username: 'alice' }).valid)     // true
console.log('string-ext.custom.reserved =',
  validate(usernameSchema, { username: 'admin' }).valid)    // false — custom validator fired

// ============================================================
// 7. .pattern() — regular expression constraint
// ============================================================

const accountNameField = ('string:3-32!' as any)
  .label('Account Name')
  .pattern(/^[a-z][a-z0-9_]{2,31}$/)
  .error({ pattern: 'Account name must start with a lowercase letter and use only lowercase letters, digits, or underscores' })

const accountNameSchema = s({ accountName: accountNameField })
console.log('string-ext.pattern.valid   =',
  validate(accountNameSchema, { accountName: 'rocky_dev' }).valid)   // true
console.log('string-ext.pattern.invalid =',
  validate(accountNameSchema, { accountName: 'Rocky Dev' }).valid)   // false — uppercase + spaces

// ============================================================
// 8. .items() — array item schema
// ============================================================

const tagsField = ('array' as any)
  .items('string:1-30')
  .noSparse()
  .includesRequired(['docs'])

const tagsSchema = s({ tags: tagsField })
console.log('string-ext.items.valid     =',
  validate(tagsSchema, { tags: ['docs', 'api'] }).valid)             // true

// ============================================================
// 9. Full profile schema with all extensions combined
// ============================================================

const profileSchema = s({
  username: ('string:3-32!' as any)
    .label('Username')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .error({ pattern: 'Username may only contain letters, digits and underscores' }),

  email: ('email!' as any)
    .label('Email')
    .error({ format: 'Please enter a valid email address' }),

  bio: ('string:10-300' as any)
    .label('Bio')
    .description('Short profile bio'),

  website: ('url' as any)
    .label('Website')
    .error({ format: 'Website must be a valid URL (https://...)' }),

  role: ('admin|user|contributor' as any)
    .label('Role')
    .default('user')
    .error({ enum: 'Role must be admin, user, or contributor' }),
})

const profileValid = validate(profileSchema, {
  username: 'rocky_dev',
  email:    'rocky@example.com',
  bio:      'Full-stack developer building schema tools.',
  website:  'https://rocky.dev',
}, { useDefaults: true })

console.log('string-ext.profile.valid          =', profileValid.valid)               // true
console.log('string-ext.profile.role.default   =', (profileValid.data as any)?.role) // 'user'

const profileInvalid = validate(profileSchema, {
  username: 'bad user!',
  email:    'not-an-email',
  bio:      'Too short',
  website:  'not-a-url',
  role:     'superadmin',
})
console.log('string-ext.profile.invalid.errors =', profileInvalid.errors?.length)    // 5

// ============================================================
// 10. Uninstall / reinstall lifecycle
// ============================================================

uninstallStringExtensions()
console.log('string-ext.uninstalled.label    =', typeof ('email!' as any).label)     // 'undefined'
console.log('string-ext.uninstalled.error    =', typeof ('string!' as any).error)    // 'undefined'

// Reinstall works cleanly
installStringExtensions()
console.log('string-ext.reinstalled.label    =', typeof ('email!' as any).label)     // 'function'

uninstallStringExtensions()
console.log('string-ext.cleanup.label        =', typeof ('email!' as any).label)     // 'undefined'
