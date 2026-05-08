import { dsl, validate } from '../../dist/index.js'

const numberOperatorSchema = dsl({
  adultAge: 'number:>=18!',
  score: 'number:<100',
  maxBonus: 'number:<=20',
  level: 'number:=5',
  retryCount: 'integer:>0',
})

const validResult = validate(numberOperatorSchema, {
  adultAge: 28,
  score: 99.5,
  maxBonus: 20,
  level: 5,
  retryCount: 3,
})

const invalidResult = validate(numberOperatorSchema, {
  adultAge: 16,
  score: 100,
  maxBonus: 25,
  level: 4,
  retryCount: 0,
})

console.log('number-operators.valid =', validResult.valid)
console.log('number-operators.invalid =', invalidResult.valid)
console.log('number-operators.invalid.errors =', invalidResult.errors)