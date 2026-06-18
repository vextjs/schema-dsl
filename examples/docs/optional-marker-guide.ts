import { s, validate } from '../../dist/pure.js'

// ============================================================
// Optional marker guide — controlling field optionality
//
// By default a field is OPTIONAL unless marked required with !
//
// Key markers:
//   'type!'   → field is required (value is mandatory)
//   'type?'   → field is explicitly optional (same as default)
//   'key?':   → key itself is optional in an object DSL map
//
// Enum types ('a|b|c') are optional unless marked 'a|b|c!'
// ============================================================

// ============================================================
// 1. Required (!) vs. optional (default) vs. explicit (?)
// ============================================================

const profileSchema = s({
  username:    'string:3-32!',   // required
  displayName: 'string:1-50',    // optional (no ! or ?)
  email:       'email?',         // optional (explicit ?)
  website:     'url?',           // optional
  bio:         'string:0-500',   // optional
})

// Only username is required
console.log('optional.base.valid          =',
  validate(profileSchema, { username: 'alice' }).valid)          // true

console.log('optional.base.allFields      =',
  validate(profileSchema, { username: 'alice', displayName: 'Alice', email: 'a@b.com', website: 'https://a.com', bio: 'Hi' }).valid)  // true

console.log('optional.base.missingReq     =',
  validate(profileSchema, {}).valid)                              // false

// ============================================================
// 2. Optional object key — 'field?': { ... }
// ============================================================

const addressSchema = s({
  'street!':  'string:5-100',    // required
  'city!':    'string:2-50',     // required
  'state':    'string:2-10',     // optional field, no ? on key
  'zipCode?': 'string:3-10',     // optional key
  'country':  'string:2-3',      // optional
})

console.log('optional.obj.requiredOnly    =',
  validate(addressSchema, { street: '123 Main St', city: 'Springfield' }).valid)  // true

console.log('optional.obj.full            =',
  validate(addressSchema, { street: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701' }).valid)  // true

console.log('optional.obj.missingRequired =',
  validate(addressSchema, { city: 'Springfield' }).valid)         // false

// ============================================================
// 3. Enum types — optional by default
// ============================================================

const orderSchema = s({
  id:     'uuid!',                            // required
  status: 'pending|processing|shipped',       // optional enum
  tier:   'standard|premium|enterprise!',     // required enum
})

console.log('optional.enum.noStatus       =',
  validate(orderSchema, { id: '123e4567-e89b-12d3-a456-426614174000', tier: 'standard' }).valid)  // true

console.log('optional.enum.withStatus     =',
  validate(orderSchema, { id: '123e4567-e89b-12d3-a456-426614174000', tier: 'premium', status: 'pending' }).valid)  // true

console.log('optional.enum.missingTier    =',
  validate(orderSchema, { id: '123e4567-e89b-12d3-a456-426614174000' }).valid)  // false

// ============================================================
// 4. Optional nested object
// ============================================================

const userWithOptionalAddress = s({
  name:      'string!',
  'address?': {
    street: 'string:5-100!',
    city:   'string:2-50!',
  },
})

console.log('optional.nested.noAddress    =',
  validate(userWithOptionalAddress, { name: 'Alice' }).valid)  // true

console.log('optional.nested.withAddress  =',
  validate(userWithOptionalAddress, { name: 'Alice', address: { street: '123 Main St', city: 'Springfield' } }).valid)  // true

console.log('optional.nested.badAddress   =',
  validate(userWithOptionalAddress, { name: 'Alice', address: { street: 'X' } }).valid)  // false (street too short + missing city)

// ============================================================
// 5. default() — fill in missing optional fields
// ============================================================

const settingsSchema = s({
  theme:       s('string').default('light'),
  language:    s('string').default('en-US'),
  pageSize:    s('integer').default(20),
  emailAlerts: s('boolean').default(true),
})

const settingsResult = validate(settingsSchema, {})  // empty → all defaults applied
console.log('optional.defaults.valid      =', settingsResult.valid)  // true
console.log('optional.defaults.theme      =', (settingsResult.data as any)?.theme)      // 'light'
console.log('optional.defaults.pageSize   =', (settingsResult.data as any)?.pageSize)   // 20