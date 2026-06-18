import { s, validate, Validator } from '../../dist/pure.js'

// ============================================================
// Multi-type support — all primitive and format types in one place
//
// Primitives:   string, number, integer, boolean, object, array, null, any
// Format types: email, url, uri, uuid, ipv4, ipv6, ip, hostname,
//               date, datetime, time
// Special str:  binary, objectId, hexColor, macAddress, cron, slug,
//               chineseName, chinese, emailDomain
// Extensions:   alphanum, lower, upper, json, port
// ============================================================

// ============================================================
// 1. Core type demo
// ============================================================

const coreSchema = s({
  name:      s('string:1-50!').label('Name'),
  age:       s('integer:0-150').label('Age'),
  score:     s('number:0-100').label('Score'),
  active:    s('boolean!').label('Active'),
  birthday:  s('date?').label('Birthday'),
  tags:      s('array<string:1-20>?').label('Tags'),
  status:    s('active|inactive').label('Status'),
  meta:      s('object?').label('Meta'),
})

const coreValid = validate(coreSchema, {
  name: 'Alice', age: 30, score: 97.5, active: true,
  birthday: '2024-01-15', tags: ['alpha', 'beta'],
  status: 'active', meta: { src: 'web' },
})
console.log('multi-type.core.valid            =', coreValid.valid)   // true

// ============================================================
// 2. Format types
// ============================================================

const formatSchema = s({
  email:    'email!',
  website:  'url',
  uuid:     'uuid',
  ipv4:     'ipv4',
  ipv6:     'ipv6',
  hostName: 'hostname',
  date:     'date',
  datetime: 'datetime',
  time:     'time',
})

const formatValid = validate(formatSchema, {
  email:    'user@example.com',
  website:  'https://example.com',
  uuid:     '123e4567-e89b-12d3-a456-426614174000',
  ipv4:     '192.168.1.1',
  ipv6:     '2001:0db8:85a3::8a2e:0370:7334',
  hostName: 'api.example.com',
  date:     '2024-01-15',
  datetime: '2024-01-15T12:00:00Z',
  time:     '12:00:00',
})
console.log('multi-type.format.valid          =', formatValid.valid)  // true

// ============================================================
// 3. Special strings
// ============================================================

const specialSchema = s({
  hex:     'hexColor',
  slug:    'slug',
  port:    'port',
  lower:   'lower',
  upper:   'upper',
})

const specialValid = validate(specialSchema, {
  hex:   '#FF5733',
  slug:  'my-blog-post',
  port:  '8080',
  lower: 'hello-world',
  upper: 'HELLO',
})
console.log('multi-type.special.valid         =', specialValid.valid)  // true

// ============================================================
// 4. Array types
// ============================================================

const arrSchema = s({
  emails:  'array<email>!',
  scores:  'array<number:0-100>',
  ids:     'array<uuid>',
  tags:    'array<slug>',
})

const arrValid = validate(arrSchema, {
  emails: ['a@b.com', 'c@d.com'],
  scores: [85.5, 92, 70],
  ids:    ['123e4567-e89b-12d3-a456-426614174000'],
  tags:   ['node-js', 'typescript'],
})
console.log('multi-type.array.valid           =', arrValid.valid)   // true

// Bad array element
const arrInvalid = validate(arrSchema, {
  emails: ['not-an-email', 'good@example.com'],
  scores: [101, 80],  // 101 > 100
})
console.log('multi-type.array.invalid         =', arrInvalid.valid)  // false

// ============================================================
// 5. Coercion — string inputs for numeric/boolean fields
// ============================================================

const coerceValidator = new Validator({ coerceTypes: true })
const coerced = coerceValidator.validate(coreSchema, {
  name: 'Bob', age: '25', score: '88.5', active: 'true',
})
console.log('multi-type.coerce.valid          =', coerced.valid)               // true
console.log('multi-type.coerce.age            =', (coerced.data as any)?.age)  // 25 (number)

// ============================================================
// 6. any type — passes any non-null value
// ============================================================

const anySchema = s({ data: 'any!', meta: 'any' })
console.log('multi-type.any.obj.valid         =', validate(anySchema, { data: { x: 1 } }).valid)        // true
console.log('multi-type.any.str.valid         =', validate(anySchema, { data: 'hello' }).valid)          // true
console.log('multi-type.any.num.valid         =', validate(anySchema, { data: 42 }).valid)               // true