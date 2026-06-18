import { s, validate, validateAsync, ValidationError } from '../../dist/pure.js'

function expect(label: string, condition: boolean): void {
  if (!condition) throw new Error(`conditional-api expectation failed: ${label}`)
}

// ============================================================
// 1. s.if(fn) — ConditionalBuilder for programmatic conditions
// ============================================================

// Basic: single condition with message
const ageCheck = s.if((data: any) => data.age < 18)
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

// AND: all conditions must match to trigger the shared message
const crossBorderCheck = s.if((data: any) => data.amount > 10000)
  .and((data: any) => data.country !== 'CN')
  .message('Large cross-border transfers require review')

console.log('conditional-api.and.normal =',      crossBorderCheck.check({ amount: 9000, country: 'US' }))  // true
console.log('conditional-api.and.domestic =',    crossBorderCheck.check({ amount: 20000, country: 'CN' })) // true
console.log('conditional-api.and.crossBorder =', crossBorderCheck.check({ amount: 20000, country: 'US' })) // false
expect('and requires all predicates', crossBorderCheck.check({ amount: 20000, country: 'US' }) === false)

// OR: either condition triggers
const suspiciousAmount = s.if((data: any) => data.amount > 50000)
  .or((data: any) => data.amount < 0)
  .message('Transaction amount is out of allowed range')

console.log('conditional-api.or.normal =',    suspiciousAmount.check({ amount: 1000 })) // true
console.log('conditional-api.or.tooHigh =',   suspiciousAmount.check({ amount: 99999 })) // false
console.log('conditional-api.or.negative =',  suspiciousAmount.check({ amount: -1 }))    // false
expect('or rejects negative amount', suspiciousAmount.check({ amount: -1 }) === false)

// Independent messages: each failed predicate can explain a different branch
const withdrawalCheck = s.if((data: any) => !data)
  .message('Account not found')
  .and((data: any) => data.status !== 'active')
  .message('Account is not active')
  .and((data: any) => data.balance < data.amount)
  .message('Insufficient account balance')

try {
  withdrawalCheck.assert({ status: 'frozen', balance: 500, amount: 100 })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('conditional-api.independentMessage.status =', err.message)
    expect('independent .and message', err.message.includes('Account is not active'))
  }
}

// ============================================================
// 3. .require(field) — BC-5: assert another field is truthy
// ============================================================

// If premium=false and trialEndDate is missing, block
const trialCheck = s.if((data: any) => !data.premium)
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
const rolePermission = s.if((data: any) => data.role === 'admin')
  .then({ type: 'object', required: ['adminToken'] } as any)
  .elseIf((data: any) => data.role === 'user')
  .then({ type: 'object', required: ['email'] } as any)
  .else({ type: 'object', required: ['guestId'] } as any)

const rolePermissionSchema = rolePermission.toSchema()
const rolePermissionBuilt = rolePermission.build()
console.log('conditional-api.branches.toSchema =', typeof rolePermissionSchema)
console.log('conditional-api.branches.build =', typeof rolePermissionBuilt)
expect('build is a toSchema alias', rolePermissionBuilt._isConditional === rolePermissionSchema._isConditional)

// ============================================================
// 5. s.if(field, thenSchema, elseSchema) — inline field conditions in object schemas
// ============================================================

// Two-argument form: when field is truthy → use thenSchema, else elseSchema
const subscriptionSchema = s({
  premium:      'boolean!',
  maxStorage:   s.if('premium', 'integer:0-', 'integer:0-5'),     // premium: unlimited; free: max 5
  badgeLabel:   s.if('premium', 'string:1-20'),                    // only validated for premium
  renewalDate:  s.if('premium', 'date!'),                          // required for premium only
})

console.log('conditional-api.field.premium.valid =',
  validate(subscriptionSchema, {
    premium: true, maxStorage: 999, badgeLabel: 'Gold', renewalDate: '2025-12-31',
  }).valid)
console.log('conditional-api.field.free.valid =',
  validate(subscriptionSchema, { premium: false, maxStorage: 3 }).valid)
console.log('conditional-api.field.free.overLimit =',
  validate(subscriptionSchema, { premium: false, maxStorage: 10 }).valid) // false
expect('field conditional rejects free over-limit storage',
  validate(subscriptionSchema, { premium: false, maxStorage: 10 }).valid === false)

// ============================================================
// 6. s.match(field, cases) — switch-like field conditional
// ============================================================

// Value of 'type' field selects which schema applies to 'value'
const contactSchema = s({
  type:  'email|phone|social!',
  value: s.match('type', {
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
expect('match rejects email branch mismatch',
  validate(contactSchema, { type: 'email', value: '13800138000' }).valid === false)

// ============================================================
// 7. ConditionalBuilder.validate() / validateAsync() — result-style usage
// ============================================================

const accessCheck = s.if((data: any) => data.status === 'banned')
  .message('Banned accounts cannot access this resource')

const accessOk = accessCheck.validate({ status: 'active' })
const accessBlocked = accessCheck.validate({ status: 'banned' })
const asyncBlocked = await accessCheck.validateAsync({ status: 'banned' })

console.log('conditional-api.builder.validate.ok =', accessOk.valid)             // true
console.log('conditional-api.builder.validate.blocked =', accessBlocked.valid)   // false
console.log('conditional-api.builder.validateAsync.blocked =', asyncBlocked.valid) // false
expect('builder validate blocks banned status', accessBlocked.valid === false)

// ============================================================
// 8. Async usage — ConditionalBuilder in validateAsync
// ============================================================

const pricingSchema = s({
  premium:      'boolean!',
  tier:         'free|pro|enterprise!',
  maxApiCalls:  s.if('premium', 'integer:0-', 'integer:0-1000'), // premium → unlimited; free → capped
  ssoEnabled:   s.if('premium', 'boolean'),
})

async function checkPricing(): Promise<void> {
  // Premium plans: high api call limit allowed
  const proData = await validateAsync(pricingSchema, {
    premium: true, tier: 'pro', maxApiCalls: 5000, ssoEnabled: true,
  })
  console.log('conditional-api.async.pro.data.tier =', (proData as any).tier)

  // Free plans: over-limit api calls → fail
  try {
    await validateAsync(pricingSchema, { premium: false, tier: 'free', maxApiCalls: 2000 })
  } catch (err) {
    if (err instanceof ValidationError) {
      console.log('conditional-api.async.free.blocked =', true)
    }
  }
}

await checkPricing()
