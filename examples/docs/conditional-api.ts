import { dsl, validate, validateAsync, ValidationError } from '../../dist/index.js'

// ============================================================
// 1. dsl.if(fn) — ConditionalBuilder for programmatic conditions
// ============================================================

// Basic: single condition with message
const ageCheck = dsl.if((data: any) => data.age < 18)
  .message('Must be 18 or older to register')

// .check(data) → boolean — true = condition passes (no problem), false = condition triggered
console.log('conditional-api.check.minor =', ageCheck.check({ age: 16 })) // false — blocked
console.log('conditional-api.check.adult =', ageCheck.check({ age: 20 })) // true  — allowed

// .assert(data) — throws ValidationError if condition triggers
try {
  ageCheck.assert({ age: 15 })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('conditional-api.assert.message =', err.message)   // 'Must be 18 or older...'
    console.log('conditional-api.assert.errors =',  err.errors.length)
  }
}

// ============================================================
// 2. .and() and .or() — combine multiple conditions
// ============================================================

// AND: both conditions must match to trigger
const workHoursCheck = dsl.if((data: any) => data.hour < 9)
  .and((data: any) => data.hour > 17)
  .message('Service is only available from 09:00 to 17:00')

console.log('conditional-api.and.inHours =',  workHoursCheck.check({ hour: 12 })) // true
console.log('conditional-api.and.before9 =',  workHoursCheck.check({ hour: 7 }))  // false (blocked)

// OR: either condition triggers
const suspiciousAmount = dsl.if((data: any) => data.amount > 50000)
  .or((data: any) => data.amount < 0)
  .message('Transaction amount is out of allowed range')

console.log('conditional-api.or.normal =',    suspiciousAmount.check({ amount: 1000 })) // true
console.log('conditional-api.or.tooHigh =',   suspiciousAmount.check({ amount: 99999 })) // false
console.log('conditional-api.or.negative =',  suspiciousAmount.check({ amount: -1 }))    // false

// ============================================================
// 3. .require(field) — BC-5: assert another field is truthy
// ============================================================

// If premium=false and trialEndDate is missing, block
const trialCheck = dsl.if((data: any) => !data.premium)
  .require('trialEndDate')
  .message('Trial end date is required for free accounts')

// Missing trialEndDate on free account → triggers
console.log('conditional-api.require.missing =',
  trialCheck.check({ premium: false }))                    // false — blocked
// Present trialEndDate on free account → passes
console.log('conditional-api.require.present =',
  trialCheck.check({ premium: false, trialEndDate: '2025-12-31' })) // true
// Premium account — condition not relevant → passes
console.log('conditional-api.require.premium =',
  trialCheck.check({ premium: true }))                     // true

// ============================================================
// 4. .elseIf() / .then() / .else() — multi-branch schema rules
// ============================================================

// NOTE: .then() and .else() configure schemas for schema-level conditional validation
const rolePermission = dsl.if((data: any) => data.role === 'admin')
  .then({ type: 'object', required: ['adminToken'] } as any)
  .elseIf((data: any) => data.role === 'user')
  .then({ type: 'object', required: ['email'] } as any)
  .else({ type: 'object', required: ['guestId'] } as any)

console.log('conditional-api.branches.built =', typeof rolePermission.toSchema())

// ============================================================
// 5. dsl.if(field, thenSchema, elseSchema) — inline field conditions in object schemas
// ============================================================

// Two-argument form: when field is truthy → use thenSchema, else elseSchema
const subscriptionSchema = dsl({
  premium:      'boolean!',
  maxStorage:   dsl.if('premium', 'integer:0-', 'integer:0-5'),     // premium: unlimited; free: max 5
  badgeLabel:   dsl.if('premium', 'string:1-20'),                    // only validated for premium
  renewalDate:  dsl.if('premium', 'date!'),                          // required for premium only
})

console.log('conditional-api.field.premium.valid =',
  validate(subscriptionSchema, {
    premium: true, maxStorage: 999, badgeLabel: 'Gold', renewalDate: '2025-12-31',
  }).valid)
console.log('conditional-api.field.free.valid =',
  validate(subscriptionSchema, { premium: false, maxStorage: 3 }).valid)
console.log('conditional-api.field.free.overLimit =',
  validate(subscriptionSchema, { premium: false, maxStorage: 10 }).valid) // false

// ============================================================
// 6. dsl.match(field, cases) — switch-like field conditional
// ============================================================

// Value of 'type' field selects which schema applies to 'value'
const contactSchema = dsl({
  type:  'email|phone|social!',
  value: dsl.match('type', {
    email:  'email!',
    phone:  'phone:cn!',
    social: 'string:3-50!',
  }),
})

console.log('conditional-api.match.email =',
  validate(contactSchema, { type: 'email', value: 'user@example.com' }).valid)  // true
console.log('conditional-api.match.phone =',
  validate(contactSchema, { type: 'phone', value: '13800138000' }).valid)        // true
console.log('conditional-api.match.social =',
  validate(contactSchema, { type: 'social', value: '@alice_dev' }).valid)        // true
console.log('conditional-api.match.mismatch =',
  validate(contactSchema, { type: 'email', value: '13800138000' }).valid)        // false

// ============================================================
// 7. Async usage — ConditionalBuilder in validateAsync
// ============================================================

const pricingSchema = dsl({
  tier:          'free|pro|enterprise!',
  maxApiCalls:   dsl.if('tier', 'integer:0-', 'integer:0-1000'), // pro → unlimited; free → capped
  ssoEnabled:    dsl.if('tier', 'boolean'),
})

async function checkPricing(): Promise<void> {
  // Enterprise / Pro: high api call limit allowed
  const proData = await validateAsync(pricingSchema, {
    tier: 'pro', maxApiCalls: 5000, ssoEnabled: true,
  })
  console.log('conditional-api.async.pro.data.tier =', (proData as any).tier)

  // Free: over-limit api calls → fail
  try {
    await validateAsync(pricingSchema, { tier: 'free', maxApiCalls: 2000 })
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log('conditional-api.async.free.blocked =', true)
    }
  }
}

await checkPricing()