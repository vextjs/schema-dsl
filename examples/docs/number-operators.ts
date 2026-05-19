import { dsl, validate, Validator } from '../../dist/index.js'

// ============================================================
// Number constraint operators
//
// Beyond plain min:max ranges, DSL supports comparison operators:
//   >=N  — value must be >= N   (inclusive lower bound)
//   <=N  — value must be <= N   (inclusive upper bound)
//   >N   — value must be >  N   (exclusive lower bound)
//   <N   — value must be <  N   (exclusive upper bound)
//   =N   — value must equal N   (exact match)
//
// Applies to both 'number' and 'integer' base types.
// ============================================================

// ============================================================
// 1. All five operators, all valid
// ============================================================

const opsSchema = dsl({
  adultAge:   'number:>=18!',     // >= 18
  score:      'number:<100',      // < 100
  maxBonus:   'number:<=20',      // <= 20
  exactLevel: 'number:=5',        // exactly 5
  retryCount: 'integer:>0',       // > 0 (exclusive)
})

const validResult = validate(opsSchema, {
  adultAge:   18,     // exactly 18 is ok
  score:      99.9,   // < 100 is ok
  maxBonus:   20,     // exactly 20 is ok
  exactLevel: 5,      // exact match
  retryCount: 1,      // > 0
})

console.log('number-ops.valid.valid           =', validResult.valid)   // true

// ============================================================
// 2. Boundary violations
// ============================================================

const invalidResult = validate(opsSchema, {
  adultAge:   17,     // fails: < 18
  score:      100,    // fails: = 100, not < 100
  maxBonus:   21,     // fails: > 20
  exactLevel: 4,      // fails: != 5
  retryCount: 0,      // fails: not > 0
}, { allErrors: true })

console.log('number-ops.invalid.valid         =', invalidResult.valid)  // false
console.log('number-ops.invalid.errorCount    =', invalidResult.errors?.length ?? 0)  // >= 5

// ============================================================
// 3. Mixed range + operator syntax
// ============================================================

const mixedSchema = dsl({
  temperature: 'number:-273.15-!',  // >= -273.15 (absolute zero), open upper
  percentage:  'number:0-100!',     // classic closed range [0, 100]
  port:        'integer:1-65535!',  // closed range
  pageSize:    'integer:>0',        // > 0, no upper bound
  discount:    'number:>=0',        // >= 0, no upper bound
})

console.log('number-ops.mixed.valid           =',
  validate(mixedSchema, { temperature: 20, percentage: 50, port: 8080, pageSize: 10, discount: 0.15 }).valid)  // true

console.log('number-ops.mixed.negTemp.valid   =',
  validate(mixedSchema, { temperature: -100, percentage: 50, port: 80, pageSize: 1, discount: 0 }).valid)  // true

// ============================================================
// 4. Coercion with operators — strings become numbers
// ============================================================

const coerceValidator = new Validator({ coerceTypes: true })
const coerced = coerceValidator.validate(opsSchema, {
  adultAge:   '25',
  score:      '80',
  maxBonus:   '15',
  exactLevel: '5',
  retryCount: '3',
})
console.log('number-ops.coerce.valid          =', coerced.valid)   // true

// ============================================================
// 5. Edge cases — exclusive boundaries
// ============================================================

const exclusiveSchema = dsl({
  temp: 'number:>-273.15!',   // absolute zero exclusive
  prob: 'number:>0',          // probability exclusive of 0
})

console.log('number-ops.exclusive.valid       =',
  validate(exclusiveSchema, { temp: -273.14, prob: 0.001 }).valid)  // true

console.log('number-ops.exclusive.atZero      =',
  validate(exclusiveSchema, { temp: -273.15, prob: 0.5 }).valid)    // false (= -273.15 not allowed)