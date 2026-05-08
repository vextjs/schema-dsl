import { dsl, validateAsync, ValidationError } from '../../dist/index.js'

const registerSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
})

async function isEmailAvailable(email: string): Promise<boolean> {
  return email !== 'taken@example.com'
}

async function main(): Promise<void> {
  const validData = await validateAsync(registerSchema, {
    username: 'alice_01',
    email: 'alice@example.com',
    age: '26',
  })

  console.log('validateAsync(validData) =', validData)
  console.log('businessCheck(validData.email) =', await isEmailAvailable((validData as { email: string }).email))

  try {
    await validateAsync(registerSchema, {
      username: 'ab',
      email: 'bad-email',
      age: '16',
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log('ValidationError.message =', error.message)
      console.log('ValidationError.errors =', error.errors)
      return
    }

    throw error
  }
}

void main()