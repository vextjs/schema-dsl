import { s, validate } from '../../dist/pure.js';

// ============================================================
// All 32 built-in types, grouped by category.
// ============================================================

// ── 1. Primitive types (8) ────────────────────────────────

const primitiveSchema = s({
  a: 'string',    // any string
  b: 'number',    // float or integer
  c: 'integer',   // whole number
  d: 'boolean',   // true/false
  e: 'object',    // plain object {}
  f: 'array',     // any array []
  g: 'null',      // must be null
  h: 'any',       // no type constraint
})
console.log('type-reference.primitives.valid =',
  validate(primitiveSchema, {
    a: 'text', b: 3.14, c: 42, d: true, e: {}, f: [], g: null, h: 'anything',
  }).valid)

// ── 2. Format types (11) ─────────────────────────────────

const formatSchema = s({
  a: 'email',      // user@example.com
  b: 'url',        // https://example.com
  c: 'uri',        // any valid URI
  d: 'uuid',       // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  e: 'ipv4',       // 192.168.1.1
  f: 'ipv6',       // 2001:db8::1
  g: 'ip',         // IPv4 or IPv6
  h: 'hostname',   // example.com
  i: 'date',       // 2024-01-15
  j: 'datetime',   // 2024-01-15T10:00:00Z
  k: 'time',       // 10:00:00
})
console.log('type-reference.formats.valid =',
  validate(formatSchema, {
    a: 'user@example.com',
    b: 'https://example.com',
    c: 'urn:isbn:0451450523',
    d: '550e8400-e29b-41d4-a716-446655440000',
    e: '192.168.1.1',
    f: '2001:db8::1',
    g: '127.0.0.1',
    h: 'example.com',
    i: '2024-01-15',
    j: '2024-01-15T10:00:00Z',
    k: '10:30:00',
  }).valid)

const formatInvalid = validate(formatSchema, {
  a: 'bad-email',
  b: 'not-a-url',
  d: 'not-a-uuid',
  e: '999.999.999.999',
})
console.log('type-reference.formats.invalid =', formatInvalid.valid)
console.log('type-reference.formats.errorCount =', formatInvalid.errors?.length)

// ── 3. Special string types (9) ─────────────────────────

const specialSchema = s({
  a: 'binary',       // base64 encoded binary data
  b: 'objectId',     // MongoDB ObjectId (24-char hex)
  c: 'hexColor',     // #rrggbb or #rgb
  d: 'macAddress',   // 00:1A:2B:3C:4D:5E
  e: 'cron',         // cron expression (5 fields)
  f: 'slug',         // url-friendly slug (e.g. my-post-title)
  g: 'chineseName',  // Chinese full name
  h: 'chinese',      // any Chinese characters
  i: 'emailDomain',  // domain part of an email address
})
console.log('type-reference.special.valid =',
  validate(specialSchema, {
    a: 'SGVsbG8gV29ybGQ=',
    b: '507f1f77bcf86cd799439011',
    c: '#336699',
    d: '00:1A:2B:3C:4D:5E',
    e: '0 9 * * 1',
    f: 'my-post-title',
    g: '\u5f20\u4f1f',
    h: '\u4f60\u597d\u4e16\u754c',
    i: 'example.com',
  }).valid)

// ── 4. Extension types (5) ───────────────────────────────

const extensionSchema = s({
  a: 'alphanum',  // letters and digits only
  b: 'lower',     // lowercase letters only
  c: 'upper',     // uppercase letters only
  d: 'json',      // valid JSON string
  e: 'port',      // integer in [1, 65535]
})
console.log('type-reference.extensions.valid =',
  validate(extensionSchema, {
    a: 'abc123',
    b: 'hello',
    c: 'HELLO',
    d: '{"key":"value"}',
    e: 8080,
  }).valid)
console.log('type-reference.extensions.invalid =',
  validate(extensionSchema, {
    a: 'abc 123',   // space not allowed in alphanum
    b: 'Hello',     // uppercase not allowed in lower
    c: 'hello',     // lowercase not allowed in upper
    d: 'not json',  // invalid JSON
    e: 70000,       // out of port range
  }).valid)

// ── 5. Phone and identity patterns ──────────────────────

const phoneSchema = s({
  cn: 'phone:cn',             // Chinese mobile: 1[3-9]xxxxxxxx
  us: 'phone:us',             // US: (xxx) xxx-xxxx or xxx-xxx-xxxx
  uk: 'phone:uk',             // UK: +44 or 0 followed by number
  intl: 'phone:international', // E.164 international format
})
console.log('type-reference.phone.valid =',
  validate(phoneSchema, {
    cn:   '13800138000',
    us:   '555-123-4567',
    uk:   '+441234567890',
    intl: '+861380013800',
  }).valid)

// Chinese national ID
const idSchema = s({ idCard: 'idCard:cn!' })
console.log('type-reference.idCard.valid =',
  validate(idSchema, { idCard: '110101199003071234' }).valid)
console.log('type-reference.idCard.invalid =',
  validate(idSchema, { idCard: '123456' }).valid)

// Credit card types
const creditCardSchema = s({
  visa:       'creditCard:visa',
  mastercard: 'creditCard:mastercard',
  amex:       'creditCard:amex',
})
console.log('type-reference.creditCard.valid =',
  validate(creditCardSchema, {
    visa:       '4111111111111111',
    mastercard: '5500005555555559',
    amex:       '371449635398431',
  }).valid)

// Other identity patterns
const miscSchema = s({
  plate:    'licensePlate:cn',    // Chinese vehicle plate
  postal:   'postalCode:cn',      // Chinese postal code
  passport: 'passport:cn',        // Chinese passport
})
console.log('type-reference.misc.valid =',
  validate(miscSchema, {
    plate:    '\u7ca4A12345',
    postal:   '100000',
    passport: 'E12345678',
  }).valid)

// ── 6. Types with constraints ────────────────────────────

const constrainedSchema = s({
  email:      'email!',
  serverIp:   'ip!',
  schedule:   'cron',
  httpPort:   'port:1024-65535',
  theme:      'hexColor',
  sessionId:  'uuid!',
  apiUrl:     'url!',
})
const constrainedResult = validate(constrainedSchema, {
  email:     'ops@example.com',
  serverIp:  '10.0.0.1',
  schedule:  '0 9 * * 1-5',
  httpPort:  3000,
  theme:     '#1a2b3c',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  apiUrl:    'https://api.example.com/v2',
})
console.log('type-reference.constrained.valid =', constrainedResult.valid)
console.log('type-reference.errorCount =', constrainedResult.errors?.length ?? 0)