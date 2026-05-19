import { ValidationError, dsl, validate, validateAsync } from '../../dist/index.js'

// ============================================================
// TypeScript generics guide — typed validation results
// ============================================================

// ============================================================
// 1. Type-safe sync validation
// ============================================================

interface UserForm {
  username: string
  email:    string
  password: string
  age?:     number
}

const commonFields = {
  email: dsl('email!')
    .label('Email Address')
    .error({ required: 'Email is required' }),

  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('Username')
    .error({ pattern: 'Username may only contain letters, digits and underscores' }),
}

const userSchema = dsl({
  ...commonFields,
  password: dsl('string:8-64!')
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/)
    .label('Password')
    .error({ pattern: 'Password must be at least 8 chars and contain letters and digits' }),
  age: dsl('number:18-100').label('Age'),
})

const syncResult = validate<UserForm>(userSchema, {
  username: 'demo_user',
  email:    'demo@example.com',
  password: 'Pass1234',
  age:       28,
})

// TypeScript knows data is UserForm when valid
if (syncResult.valid) {
  const _user: UserForm = syncResult.data!
  console.log('typescript-guide.sync.user =', _user.username)   // 'demo_user'
}
console.log('typescript-guide.sync.valid =', syncResult.valid)  // true

// ============================================================
// 2. Async validation with generics
// ============================================================

const asyncResult = await validateAsync<UserForm>(userSchema, {
  username: 'runner_01',
  email:    'runner@example.com',
  password: 'Run2026A',
  age:       30,
})

// validateAsync resolves to the typed data directly (throws on invalid)
console.log('typescript-guide.async.user =', asyncResult.username)  // 'runner_01'

// ============================================================
// 3. ValidationError — structured error access
// ============================================================

try {
  await validateAsync<UserForm>(userSchema, {
    username: 'bad user',   // fails pattern
    email:    'oops',        // fails format
    password: 'short',       // too short
  } as any)
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('typescript-guide.err.count  =', error.getErrorCount())
    console.log('typescript-guide.err.email  =',
      error.getFieldErrors().email !== undefined)  // true — email error present
    console.log('typescript-guide.err.fields =',
      Object.keys(error.getFieldErrors()).sort().join(','))
  } else {
    throw error
  }
}

// ============================================================
// 4. Typed partial schemas — generic flows through
// ============================================================

import { SchemaUtils } from '../../dist/index.js'

interface PublicProfile { username: string; email: string }

const publicSchema = SchemaUtils.pick(userSchema, ['username', 'email'])

const profileResult = validate<PublicProfile>(publicSchema, {
  username: 'alice_01',
  email:    'alice@example.com',
})

if (profileResult.valid) {
  const _p: PublicProfile = profileResult.data!
  console.log('typescript-guide.profile.email =', _p.email)  // 'alice@example.com'
}

console.log('typescript-guide.profile.valid =', profileResult.valid)   // true

// ============================================================
// 5. Nested object typing
// ============================================================

interface Post {
  title:   string
  author:  { name: string; email: string }
  tags:    string[]
  draft:   boolean
}

const postSchema = dsl({
  title:  dsl('string:1-200!').label('Title'),
  author: dsl({
    name:  dsl('string:1-100!').label('Author Name'),
    email: dsl('email!').label('Author Email'),
  }),
  tags:  dsl('array<string:1-40>!'),
  draft: dsl('boolean').label('Draft'),
})

const postResult = validate<Post>(postSchema, {
  title:  'Hello, schema-dsl!',
  author: { name: 'Alice', email: 'alice@example.com' },
  tags:   ['typescript', 'schema', 'validation'],
  draft:   false,
})

console.log('typescript-guide.post.valid   =', postResult.valid)    // true
if (postResult.valid) {
  console.log('typescript-guide.post.tags  =', postResult.data!.tags.join(','))
}