import { dsl, validate, validateAsync, ValidationError, DslBuilder } from '../../dist/index.js'

// ============================================================
// 1. What validateAsync does
//    - Returns Promise<T>  — resolves to the validated (coerced) data
//    - Throws ValidationError on any validation failure
//    - Runs AJV sync checks first, then async custom validators (BC-6 fix)
// ============================================================

const signupSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'integer:18-120!',
})

// Basic async validation — auto-coercion applies, returns validated data
const data = await validateAsync(signupSchema, {
  username: 'alice_01',
  email:    'alice@example.com',
  age:      '26',            // string coerced to integer
})
console.log('validateAsync.basic.username =', (data as any).username)
console.log('validateAsync.basic.age.type =', typeof (data as any).age)  // 'number'

// Failure: throws ValidationError
try {
  await validateAsync(signupSchema, { username: 'x', email: 'bad', age: 15 })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validateAsync.throw.errors.length =', err.errors.length)
    console.log('validateAsync.throw.errors[0].path =', err.errors[0]?.path)
  }
}

// ============================================================
// 2. Async custom validators via .custom()
//    Return true → pass
//    Return false → fail with default message
//    Return string → fail with that string as message
//    Throw → fail with the thrown error message
// ============================================================

// Simulate async DB / API checks
async function isUsernameAvailable(username: string): Promise<boolean> {
  const takenNames = new Set(['admin', 'root', 'alice'])
  return !takenNames.has(username.toLowerCase())
}

async function isEmailRegistered(email: string): Promise<boolean> {
  const takenEmails = new Set(['taken@example.com', 'duplicate@example.com'])
  return !takenEmails.has(email)
}

const registrationSchema = dsl({
  username: new DslBuilder('string:3-32!')
    .label('Username')
    .custom(async (value: unknown) => {
      const ok = await isUsernameAvailable(value as string)
      return ok || 'Username is already taken — please choose another'
    }),

  email: new DslBuilder('email!')
    .label('Email')
    .custom(async (value: unknown) => {
      const ok = await isEmailRegistered(value as string)
      return ok || 'This email address is already registered'
    }),

  password: new DslBuilder('string:8-64!')
    .label('Password')
    .custom((value: unknown) => {
      const s = value as string
      const hasUpper = /[A-Z]/.test(s)
      const hasLower = /[a-z]/.test(s)
      const hasDigit = /\d/.test(s)
      if (!hasUpper || !hasLower || !hasDigit) {
        return 'Password must contain uppercase, lowercase and at least one digit'
      }
      return true
    }),
})

// Valid input: async checks pass
const regData = await validateAsync(registrationSchema, {
  username: 'new_user',
  email:    'new@example.com',
  password: 'StrongP4ss',
})
console.log('validateAsync.custom.valid.username =', (regData as any).username)

// Taken username: async check fails
try {
  await validateAsync(registrationSchema, {
    username: 'admin',
    email:    'new@example.com',
    password: 'StrongP4ss',
  })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validateAsync.custom.taken.message =', err.errors[0]?.message)
  }
}

// ============================================================
// 3. Multiple chained custom validators — each runs in sequence
// ============================================================

const apiKeySchema = dsl({
  apiKey: new DslBuilder('string:32-64!')
    .custom((value: unknown) => {
      // Sync check: hex string
      const isHex = /^[a-f0-9]+$/.test(value as string)
      return isHex || 'API key must be a lowercase hex string'
    })
    .custom(async (value: unknown) => {
      // Async check: simulate revocation lookup
      const revokedKeys = new Set(['aabbccddaabbccddaabbccddaabbccdd'])
      const isRevoked = revokedKeys.has(value as string)
      return !isRevoked || 'API key has been revoked'
    }),
})

// Valid hex key, not revoked
const keyData = await validateAsync(apiKeySchema, { apiKey: '1234567890abcdef1234567890abcdef' })
console.log('validateAsync.chained.valid.key =', typeof (keyData as any).apiKey)

// Revoked key
try {
  await validateAsync(apiKeySchema, { apiKey: 'aabbccddaabbccddaabbccddaabbccdd' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validateAsync.chained.revoked.message =', err.errors[0]?.message)
  }
}

// ============================================================
// 4. Async validation with coercion, locale and allErrors
// ============================================================

const productSchema = dsl({
  name:  'string:2-100!',
  price: 'number:0.01-!',
  stock: 'integer:0-!',
  sku:   new DslBuilder('alphanum!').custom(async (value: unknown) => {
    // Simulate checking SKU uniqueness in a product catalog
    const existingSkus = new Set(['SKU001', 'SKU002'])
    return !existingSkus.has(value as string) || `SKU '${value}' already exists in catalog`
  }),
})

// Valid product with string→number coercion
const product = await validateAsync(productSchema, {
  name:  'Widget Pro',
  price: '29.99',    // coerced → 29.99
  stock: '100',      // coerced → 100
  sku:   'SKUXYZ99',
})
console.log('validateAsync.product.price.coerced =', (product as any).price)

// Duplicate SKU
try {
  await validateAsync(productSchema, { name: 'Widget', price: 10, stock: 5, sku: 'SKU001' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validateAsync.product.sku.message =', err.errors[0]?.message)
  }
}

// ============================================================
// 5. Using validate() synchronously when no async custom validators exist
// ============================================================

const simpleSchema = dsl({ email: 'email!', name: 'string:2-50!' })

// validate() returns ValidationResult — never throws
const syncResult = validate(simpleSchema, { email: 'x@', name: 'A' })
console.log('validateAsync.sync.compare.valid =',         syncResult.valid)
console.log('validateAsync.sync.compare.errors.length =', syncResult.errors?.length)

// validateAsync on the same schema — same AJV checks, throws instead of returning {valid:false}
try {
  await validateAsync(simpleSchema, { email: 'x@', name: 'A' })
} catch (err) {
  if (err instanceof ValidationError) {
    console.log('validateAsync.vs.sync.threw =', true)
  }
}