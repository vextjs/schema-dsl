import { dsl, validate, SchemaUtils } from '../../dist/index.js'

// ============================================================
// SchemaUtils best practices — real-world field-library pattern
// ============================================================

// ============================================================
// 1. Build a reusable field library
//    createLibrary() returns factory functions; each call gives
//    a fresh builder so mutations don't bleed between schemas.
// ============================================================

const fields = SchemaUtils.createLibrary({
  id:          () => dsl('objectId!').label('ID'),
  username:    () => dsl('string:3-32!').label('Username').pattern(/^[a-zA-Z0-9_]+$/),
  email:       () => dsl('email!').label('Email').description('Primary contact address'),
  password:    () => dsl('string:8-64!').label('Password'),
  displayName: () => dsl('string:1-60').label('Display Name'),
  bio:         () => dsl('string:500').label('Bio'),
  avatar:      () => dsl('url').label('Avatar URL'),
  createdAt:   () => dsl('datetime').label('Created At'),
  role:        () => dsl('string').label('Role').enum(['admin', 'editor', 'viewer']),
})

// ============================================================
// 2. Compose multiple schemas from the same library
// ============================================================

const dbUserSchema = dsl({
  id:          fields.id(),
  username:    fields.username(),
  email:       fields.email(),
  password:    fields.password(),
  role:        fields.role(),
  createdAt:   fields.createdAt(),
})

// For public API — no password, no id (auto-assigned)
const createUserSchema = SchemaUtils.omit(dbUserSchema, ['id', 'createdAt'])
const publicUserSchema = SchemaUtils.omit(dbUserSchema, ['password'])
const updateUserSchema = SchemaUtils
  .pick(dbUserSchema, ['username', 'displayName', 'bio', 'avatar'])
  .partial()

// ============================================================
// 3. Validate with each derived schema
// ============================================================

const createResult = validate(createUserSchema, {
  username: 'john_doe',
  email:    'john@example.com',
  password: 'Secret1234',
  role:     'editor',
})
console.log('best-practices.create.valid     =', createResult.valid)   // true

const publicResult = validate(publicUserSchema, {
  id:        '507f1f77bcf86cd799439011',
  username:  'john_doe',
  email:     'john@example.com',
  role:      'editor',
  createdAt: '2026-05-08T10:00:00Z',
})
console.log('best-practices.public.valid     =', publicResult.valid)   // true

const updateResult = validate(updateUserSchema, {
  username: 'johnny',
})
console.log('best-practices.update.valid     =', updateResult.valid)   // true (partial)

const updateInvalid = validate(updateUserSchema, {
  username: 'x', // too short
})
console.log('best-practices.update.invalid   =', updateInvalid.valid)  // false

// ============================================================
// 4. Extending schemas for specialised roles
// ============================================================

const adminSchema = createUserSchema.extend({ adminNote: 'string:1-200' })

const adminResult = validate(adminSchema, {
  username:  'super_admin',
  email:     'admin@example.com',
  password:  'SuperPass1',
  role:      'admin',
  adminNote: 'Initial setup',
})
console.log('best-practices.admin.valid      =', adminResult.valid)    // true

// ============================================================
// 5. Schema required counts match expectations
// ============================================================

console.log('best-practices.create.required  =',
  (createUserSchema.required ?? []).sort().join(','))   // email,password,role,username
console.log('best-practices.update.required  =',
  updateUserSchema.required)                             // undefined (all partial)