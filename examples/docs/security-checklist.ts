import { dsl, validate } from '../../dist/index.js'

// ============================================================
// Security checklist — safe schema patterns for API inputs
//
// Principles:
//   ✓ Require types (string!, number!) — no silent coercions
//   ✓ Bound lengths — prevent DoS via oversized inputs
//   ✓ Pattern-restrict — reduce injection surface
//   ✓ Enum-restrict — only allow known roles/states
//   ✓ Allowlist URLs — avoid open redirects
// ============================================================

// ============================================================
// 1. API token — strict alphanum + bounded length
// ============================================================

const tokenSchema = dsl({
  apiToken:    dsl('string:20-64!').pattern(/^[A-Za-z0-9_-]+$/).label('API Token'),
  callbackUrl: 'url!',
})

console.log('security.token.valid       =', validate(tokenSchema, {
  apiToken:    'PLACEHOLDER_TOKEN_2026_SAFE',
  callbackUrl: 'https://example.com/hooks/audit',
}).valid)  // true

console.log('security.token.injection   =', validate(tokenSchema, {
  apiToken:    'DROP TABLE users;',
  callbackUrl: 'not-a-url',
}).valid)  // false

// ============================================================
// 2. User registration — role allowlist, bounded fields
// ============================================================

const registrationSchema = dsl({
  username: dsl('string:3-32!').pattern(/^[a-zA-Z0-9_]+$/),
  email:    'email!',
  password: dsl('string:8-128!').pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/),
  role:     'user|moderator',          // never 'admin' from user input
})

console.log('security.register.valid    =', validate(registrationSchema, {
  username: 'safe_user',
  email:    'safe@example.com',
  password: 'Secure123',
  role:     'user',
}).valid)  // true

console.log('security.register.fakeAdmin =', validate(registrationSchema, {
  username: 'hacker',
  email:    'h@example.com',
  password: 'Secure123',
  role:     'admin',           // blocked by enum
}).valid)  // false

// ============================================================
// 3. Search / query input — max length + pattern
// ============================================================

const searchSchema = dsl({
  query:    dsl('string:1-100!').pattern(/^[a-zA-Z0-9 _-]+$/),
  page:     'integer:1-9999!',
  pageSize: 'integer:1-100!',
})

console.log('security.search.valid      =', validate(searchSchema, {
  query:    'rock music',
  page:     1,
  pageSize: 20,
}).valid)  // true

console.log('security.search.injection  =', validate(searchSchema, {
  query:    '<script>alert(1)</script>',
  page:     1,
  pageSize: 20,
}).valid)  // false

// ============================================================
// 4. File upload metadata — mime type allowlist
// ============================================================

const uploadSchema = dsl({
  filename:  dsl('string:1-200!').pattern(/^[a-zA-Z0-9_.-]+$/),
  mimeType:  'image/png|image/jpeg|image/webp|application/pdf',
  sizeBytes: 'integer:1-10485760!',    // 1 byte to 10 MB
})

console.log('security.upload.valid      =', validate(uploadSchema, {
  filename:  'avatar.png',
  mimeType:  'image/png',
  sizeBytes: 204800,
}).valid)  // true

console.log('security.upload.badMime    =', validate(uploadSchema, {
  filename:  'exploit.php',
  mimeType:  'application/x-php',
  sizeBytes: 1024,
}).valid)  // false — mime not in allowlist

console.log('security.upload.tooLarge   =', validate(uploadSchema, {
  filename:  'huge.jpg',
  mimeType:  'image/jpeg',
  sizeBytes: 20_000_000,               // 20 MB — exceeds limit
}).valid)  // false