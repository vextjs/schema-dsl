import { dsl, validate, validateAsync, ValidationError } from '../../dist/index.js'

const rawDslSchema = {
  username: dsl('string:3-32!')
    .pattern(/^[a-zA-Z0-9_]+$/)
    .error({ pattern: '只能包含字母、数字和下划线' }),
  email: 'email!',
  age: 'number:18-120',
}

const syncResult = validate(rawDslSchema, {
  username: 'john_doe',
  email: 'john@example.com',
  age: 25,
})

const invalidSyncResult = validate(rawDslSchema, {
  username: 'john doe',
  email: 'bad-email',
  age: 15,
})

console.log('raw-dsl.syncResult.valid =', syncResult.valid)
console.log('raw-dsl.invalidSyncResult.valid =', invalidSyncResult.valid)
console.log('raw-dsl.invalidSyncResult.errors =', invalidSyncResult.errors)

async function main(): Promise<void> {
  const asyncData = await validateAsync(rawDslSchema, {
    username: 'alice_01',
    email: 'alice@example.com',
    age: 30,
  })

  console.log('raw-dsl.validateAsync(valid) =', asyncData)

  try {
    await validateAsync(rawDslSchema, {
      username: 'ab',
      email: 'bad-email',
      age: '16',
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('raw-dsl.validateAsync.errors =', error.errors)
      return
    }

    throw error
  }
}

void main()