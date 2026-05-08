import { dsl, Validator } from '../../dist/index.js'

const validator = new Validator({ cache: true })

const batchSchema = dsl({
  email: 'email!',
  score: 'number:0-100',
  status: 'active|inactive',
})

const batchData = [
  { email: 'alice@example.com', score: 92, status: 'active' },
  { email: 'bad-email', score: 110, status: 'active' },
  { email: 'bob@example.com', score: 78, status: 'inactive' },
]

const results = validator.validateBatch(batchSchema, batchData)

results.forEach((result, index) => {
  console.log(`validateBatch[${index}].valid =`, result.valid)
  if (!result.valid) {
    console.log(`validateBatch[${index}].errors =`, result.errors)
  }
})