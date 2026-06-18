import { s, validate, Validator } from '../../dist/pure.js'

// ============================================================
// Home — comprehensive introduction to schema-dsl
// ============================================================

// ============================================================
// 1. Basic schema — string DSL syntax
// ============================================================

const homeSchema = s({
  username: s('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .label('Username')
    .error({ pattern: 'Username may only contain letters, digits and underscores' }),
  email:  'email!',
  age:    'number:18-120',
  roles:  'array:1-3<string>',
  profile: {
    nickname: 'string:2-20',
    website:  'url',
  },
})

// ============================================================
// 2. Valid data
// ============================================================

const validUser = {
  username: 'rocky_01',
  email:    'rocky@example.com',
  age:      28,
  roles:    ['author', 'admin'],
  profile: {
    nickname: 'Rocky',
    website:  'https://example.com',
  },
}

const validResult = validate(homeSchema, validUser)

console.log('home.validate(validUser).valid       =', validResult.valid)   // true
console.log('home.validate(validUser).errorCount  =', validResult.errors?.length ?? 0)  // 0

// ============================================================
// 3. Invalid data — collect all errors
// ============================================================

const invalidUser = {
  username: 'rocky 01',
  email:    'invalid-email',
  age:      12,
  roles:    [],
  profile: {
    nickname: 'R',
    website:  'not-a-url',
  },
}

const invalidResult = validate(homeSchema, invalidUser)

console.log('home.validate(invalidUser).valid     =', invalidResult.valid)    // false
console.log('home.validate(invalidUser).errors    =', invalidResult.errors)

// ============================================================
// 4. Compiled schema — reuse AJV validate function
// ============================================================

const validator = new Validator({ cache: true })
const compiled  = validator.compile(homeSchema, 'home-schema')

console.log('home.compile(validUser)              =', compiled(validUser))    // true
console.log('home.compile(invalidUser)            =', compiled(invalidUser))  // false

if (!compiled(invalidUser) && compiled.errors) {
  console.log('home.compile.errors                  =', compiled.errors)
}

// ============================================================
// 5. allErrors mode
// ============================================================

const allErrValidator = new Validator({ allErrors: true })
const allResult       = allErrValidator.validate(homeSchema, invalidUser)

console.log('home.allErrors.count                 =',
  (allResult.errors?.length ?? 0) >= 3)  // true — multiple failures

// ============================================================
// 6. Nested object schema — inline definition
// ============================================================

const productSchema = s({
  name:  'string:1-128!',
  price: 'number:0-999999!',
  stock: 'integer:0-999999',
  category: {
    id:   'string!',
    name: 'string:1-64!',
  },
})

console.log('home.nested.valid                    =', validate(productSchema, {
  name:     'Schema-DSL Book',
  price:    29.99,
  stock:    100,
  category: { id: 'cat-01', name: 'Books' },
}).valid)  // true