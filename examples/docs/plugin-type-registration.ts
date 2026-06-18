import { DslBuilder, TypeRegistry, s, validate } from '../../dist/pure.js'

// ============================================================
// Plugin type registration — TypeRegistry + DslBuilder.registerType()
//
// Two registration surfaces:
//   TypeRegistry.register()  — low-level, full JSON Schema + meta
//   DslBuilder.registerType() — shorthand, raw JSON Schema fragment
// ============================================================

DslBuilder.clearCustomTypes()

// ============================================================
// 1. TypeRegistry — full registration with meta
// ============================================================

TypeRegistry.register('evenNumber', {
  baseSchema: { type: 'number', multipleOf: 2 },
})

TypeRegistry.register('username', {
  baseSchema: { type: 'string', pattern: '^[a-zA-Z0-9_]{3,32}$' },
})

TypeRegistry.register('zipCode', {
  baseSchema: { type: 'string', pattern: '^\\d{5}(-\\d{4})?$' },
})

const evenSchema = s({ value: 'evenNumber!' })
const userSchema = s({ username: 'username!', zip: 'zipCode' })

console.log('type-reg.even.valid              =', validate(evenSchema, { value: 4 }).valid)   // true
console.log('type-reg.even.invalid            =', validate(evenSchema, { value: 3 }).valid)   // false
console.log('type-reg.user.valid              =',
  validate(userSchema, { username: 'alice_01', zip: '10001' }).valid)     // true
console.log('type-reg.user.badUser            =',
  validate(userSchema, { username: 'bad user' }).valid)                    // false

// ============================================================
// 2. DslBuilder.registerType() — shorthand registration
// ============================================================

DslBuilder.registerType('orderCode', {
  type: 'string',
  pattern: '^ORD\\d{6}$',
} as any)

DslBuilder.registerType('sku', {
  type: 'string',
  pattern: '^[A-Z]{3}-\\d{4}$',
} as any)

const orderSchema = s({ id: 'orderCode!', sku: 'sku' })

console.log('type-reg.order.valid             =',
  validate(orderSchema, { id: 'ORD123456' }).valid)        // true
console.log('type-reg.order.invalidFormat     =',
  validate(orderSchema, { id: 'BAD' }).valid)               // false
console.log('type-reg.order.sku.valid         =',
  validate(orderSchema, { id: 'ORD000001', sku: 'ABC-1234' }).valid)  // true

// ============================================================
// 3. Presence / existence checks
// ============================================================

console.log('type-reg.has.evenNumber          =', TypeRegistry.has('evenNumber'))     // true
console.log('type-reg.has.orderCode           =', DslBuilder.hasType('orderCode'))    // true
console.log('type-reg.has.unknown             =', DslBuilder.hasType('unknown'))      // false

// ============================================================
// 4. entries() — list all registered types
// ============================================================

const entries = TypeRegistry.entries()
const keys = Object.keys(entries)
console.log('type-reg.entries.hasEven         =', keys.includes('evenNumber'))    // true
console.log('type-reg.entries.hasUsername     =', keys.includes('username'))      // true

// ============================================================
// 5. Cleanup
// ============================================================

TypeRegistry.unregister('evenNumber')
TypeRegistry.unregister('username')
TypeRegistry.unregister('zipCode')
DslBuilder.clearCustomTypes()

console.log('type-reg.cleaned.evenNumber      =', !TypeRegistry.has('evenNumber'))  // true
console.log('type-reg.cleaned.orderCode       =', !DslBuilder.hasType('orderCode')) // true