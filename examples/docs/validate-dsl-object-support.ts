import { dsl, validate, validateAsync, ValidationError } from '../../dist/index.js'

// ============================================================
// Raw DSL object support — pass plain { field: 'dsl-string' }
// objects directly to validate() / validateAsync()
// ============================================================

// ============================================================
// 1. validate() accepts a plain object with DSL values
// ============================================================

const rawDslSchema = {
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .error({ pattern: 'Letters, digits and underscores only' }),
  email: 'email!',
  age:   'number:18-120',
}

const syncResult = validate(rawDslSchema, {
  username: 'john_doe',
  email:    'john@example.com',
  age:       25,
})

const invalidSyncResult = validate(rawDslSchema, {
  username: 'john doe',     // fails pattern
  email:    'bad-email',    // fails format
  age:       15,             // below minimum
})

console.log('raw-dsl.syncResult.valid         =', syncResult.valid)        // true
console.log('raw-dsl.invalidSyncResult.valid  =', invalidSyncResult.valid) // false
console.log('raw-dsl.invalidSyncResult.errors =', (invalidSyncResult.errors?.length ?? 0) > 0)  // true

// ============================================================
// 2. String DSL values (auto-parsed)
// ============================================================

const stringOnlySchema = {
  name:  'string:1-60!',
  email: 'email!',
  score: 'integer:0-100',
  role:  'admin|user|guest',
}

const r1 = validate(stringOnlySchema, { name: 'Alice', email: 'alice@example.com', role: 'admin' })
const r2 = validate(stringOnlySchema, { name: '', email: 'alice@example.com', role: 'admin' })

console.log('raw-dsl.string.valid             =', r1.valid)   // true
console.log('raw-dsl.string.empty.valid       =', r2.valid)   // false (empty name)

// ============================================================
// 3. Mix of builders and string values (most common pattern)
// ============================================================

const mixedSchema = {
  username: dsl('string:3-32!').label('Username'),
  email:    'email!',
  password: dsl('string:8!').label('Password'),
  terms:    'boolean!',
}

const mixedValid = validate(mixedSchema, {
  username: 'bob_99',
  email:    'bob@example.com',
  password: 'pass1234',
  terms:     true,
})

console.log('raw-dsl.mixed.valid              =', mixedValid.valid)   // true

// ============================================================
// 4. Async validation with raw DSL object
// ============================================================

async function main(): Promise<void> {
  const asyncData = await validateAsync<{ username: string; email: string; age?: number }>(rawDslSchema, {
    username: 'alice_01',
    email:    'alice@example.com',
    age:       30,
  })

  console.log('raw-dsl.validateAsync(valid)     =', asyncData.username)   // 'alice_01'

  try {
    await validateAsync(rawDslSchema, {
      username: 'ab',         // too short
      email:    'bad-email',  // invalid format
      age:      '16',         // wrong type
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('raw-dsl.validateAsync.errCount =', error.getErrorCount())
      return
    }
    throw error
  }
}

void main()

// ============================================================
// 5. Nested raw object schema
// ============================================================

const nestedRaw = {
  user: {
    name:  'string:1-100!',
    email: 'email!',
  },
  post: {
    title:   'string:1-200!',
    content: 'string!',
  },
}

const nestedResult = validate(nestedRaw, {
  user: { name: 'Charlie', email: 'charlie@example.com' },
  post: { title: 'Hello', content: 'World' },
})

console.log('raw-dsl.nested.valid             =', nestedResult.valid)   // true
