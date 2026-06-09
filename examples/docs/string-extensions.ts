import { dsl, validate, installStringExtensions, uninstallStringExtensions } from '../../dist/index.js'

// ============================================================
// 1. What string extensions do
//    The root entry installs a non-enumerable String.prototype chain API by
//    default, so DSL string literals behave like builders in JavaScript.
// ============================================================

// Before uninstall — chain methods are available on string literals by default
console.log('string-ext.installed.label  =', typeof ('email!' as any).label)     // 'function'
console.log('string-ext.installed.error  =', typeof ('string!' as any).error)    // 'function'
console.log('string-ext.installed.custom =', typeof ('string!' as any).custom)   // 'function'

// ============================================================
// 2. .label() — sets a human-readable display name (used in error messages)
// ============================================================

const nameField = ('string:2-50!' as any).label('Full Name')
const schema = dsl({ name: nameField })

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

const withDefault = validate(dsl({ role: roleField }), {}, { useDefaults: true })
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

const usernameSchema = dsl({ username: usernameField })
console.log('string-ext.custom.valid   =',
  validate(usernameSchema, { username: 'alice' }).valid)     // true
console.log('string-ext.custom.reserved =',
  validate(usernameSchema, { username: 'admin' }).valid)    // false — custom validator fired

// ============================================================
// 7. .pattern() — regular expression constraint
// ============================================================

const slugField = ('string:3-80!' as any)
  .label('Slug')
  .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .error({ pattern: 'Slug may only contain lowercase letters, digits, and hyphens' })

const slugSchema = dsl({ slug: slugField })
console.log('string-ext.pattern.valid   =',
  validate(slugSchema, { slug: 'my-blog-post' }).valid)   // true
console.log('string-ext.pattern.invalid =',
  validate(slugSchema, { slug: 'My Blog Post' }).valid)   // false — uppercase + spaces

// ============================================================
// 8. Full profile schema with all extensions combined
// ============================================================

const profileSchema = dsl({
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
// 9. Uninstall / reinstall lifecycle
// ============================================================

uninstallStringExtensions()
console.log('string-ext.uninstalled.label    =', typeof ('email!' as any).label)     // 'undefined'
console.log('string-ext.uninstalled.error    =', typeof ('string!' as any).error)    // 'undefined'

// Reinstall works cleanly
installStringExtensions()
console.log('string-ext.reinstalled.label    =', typeof ('email!' as any).label)     // 'function'
