import { dsl, validate } from '../../dist/index.js'

// ============================================================
// Union type guide — OR-type values via regex pattern
//
// DSL does not have a native union type, but you can simulate one
// by using a string type + .pattern() that accepts multiple formats.
//
// This is the recommended pattern for "email OR phone", "http OR https", etc.
// ============================================================

// ============================================================
// 1. Contact — email OR mobile phone
// ============================================================

const contactSchema = dsl({
  contact: dsl('string!')
    .pattern(/^([^\s@]+@[^\s@]+\.[^\s@]+|1[3-9]\d{9})$/)
    .label('Contact')
    .error({ pattern: 'Must be a valid email or Chinese mobile number' }),
})

console.log('union.email.valid             =',
  validate(contactSchema, { contact: 'user@example.com' }).valid)    // true
console.log('union.phone.valid             =',
  validate(contactSchema, { contact: '13800138000' }).valid)         // true
console.log('union.invalid.valid           =',
  validate(contactSchema, { contact: 'not-valid' }).valid)           // false
console.log('union.intlPhone.valid         =',
  validate(contactSchema, { contact: '00447911123456' }).valid)      // false (doesn't match regex)

// ============================================================
// 2. Website — http OR https, plus FTP
// ============================================================

const websiteSchema = dsl({
  website: dsl('string!')
    .pattern(/^(https?|ftp):\/\/.+$/)
    .label('Website'),
})

console.log('union.https.valid             =',
  validate(websiteSchema, { website: 'https://example.com' }).valid)  // true
console.log('union.http.valid              =',
  validate(websiteSchema, { website: 'http://example.com' }).valid)   // true
console.log('union.ftp.valid               =',
  validate(websiteSchema, { website: 'ftp://files.example.com' }).valid)  // true
console.log('union.noProto.valid           =',
  validate(websiteSchema, { website: 'example.com' }).valid)          // false

// ============================================================
// 3. ID field — UUID OR MongoDB ObjectId
// ============================================================

const idSchema = dsl({
  id: dsl('string!')
    .pattern(/^([0-9a-f]{24}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
    .label('ID')
    .error({ pattern: 'Must be a UUID or MongoDB ObjectId' }),
})

const mongoId = '507f1f77bcf86cd799439011'
const uuid    = '123e4567-e89b-12d3-a456-426614174000'

console.log('union.mongoId.valid           =', validate(idSchema, { id: mongoId }).valid)   // true
console.log('union.uuid.valid              =', validate(idSchema, { id: uuid }).valid)      // true
console.log('union.bad.valid               =', validate(idSchema, { id: 'bad' }).valid)     // false

// ============================================================
// 4. Locale-aware error messages
// ============================================================

const enMsg = validate(contactSchema, { contact: 'bad' }, { locale: 'en-US' }).errors?.[0]?.message
const zhMsg = validate(contactSchema, { contact: 'bad' }, { locale: 'zh-CN' }).errors?.[0]?.message

console.log('union.error.en.type           =', typeof enMsg)  // 'string'
console.log('union.error.zh.type           =', typeof zhMsg)  // 'string'

// ============================================================
// 5. Optional union field — field is not required
// ============================================================

const profileSchema = dsl({
  username:  'string:3-32!',
  website:   dsl('string').pattern(/^https?:\/\/.+$/).label('Website'),  // optional
})

console.log('union.optional.noWebsite      =',
  validate(profileSchema, { username: 'alice' }).valid)  // true — website not required
console.log('union.optional.withWebsite    =',
  validate(profileSchema, { username: 'alice', website: 'https://alice.dev' }).valid)  // true