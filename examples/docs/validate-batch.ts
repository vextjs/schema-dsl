import { dsl, validate, Validator } from '../../dist/index.js'

// ============================================================
// validateBatch() — validate multiple records in one call
//
// Returns: ValidationResult<T>[]  (plain array)
// Each item: { valid, data, errors }
// Use .filter(r => r.valid) / .filter(r => !r.valid) to split
// ============================================================

// ============================================================
// 1. Basic batch validation
// ============================================================

const userSchema = dsl({
  username: 'string:3-32!',
  email:    'email!',
  age:      'integer:18-120',
})

const validator = new Validator({ allErrors: true, coerceTypes: true })

const batch = [
  { username: 'alice',  email: 'alice@example.com',  age: 30 },   // valid
  { username: 'b',      email: 'bad-email',           age: 15 },   // 3 errors
  { username: 'carol',  email: 'carol@example.com',  age: 28 },   // valid
  { username: '',       email: 'x',                  age: -5 },   // 3 errors
]

const results = validator.validateBatch(userSchema, batch)

console.log('validateBatch.total   =', results.length)                              // 4
console.log('validateBatch.passed  =', results.filter(r => r.valid).length)         // 2
console.log('validateBatch.failed  =', results.filter(r => !r.valid).length)        // 2

// ============================================================
// 2. Inspect individual results
// ============================================================

results.forEach((result, i) => {
  if (result.valid) {
    console.log(`validateBatch[${i}].valid   =`, result.valid, '→ data:', (result.data as any).username)
  } else {
    console.log(`validateBatch[${i}].invalid =`, result.valid,
      '→ errors:', result.errors?.map(e => e.message).join('; '))
  }
})

// ============================================================
// 3. Collect invalid records with their original index
// ============================================================

const invalidIndexed = results
  .map((r, i) => ({ index: i, result: r }))
  .filter(({ result }) => !result.valid)

console.log('validateBatch.invalidIndices =', invalidIndexed.map(x => x.index).join(','))  // '1,3'

// ============================================================
// 4. Batch with coercion — string inputs normalized to numbers
// ============================================================

const productSchema = dsl({
  sku:   'alphanum:5-20!',
  price: 'number:0.01-!',
  stock: 'integer:0-!',
})

const productBatch = [
  { sku: 'BOOK01',    price: '29.99', stock: '100' },   // coerced — valid
  { sku: 'MG',        price: '-1',    stock: '5'   },   // sku too short + negative price
  { sku: 'WIDGET999', price: '9.99',  stock: '0'   },   // valid (stock 0 is ok, it's 0-!)
]
const productResults = validator.validateBatch(productSchema, productBatch)
console.log('validateBatch.coerce.valid  =',
  productResults.map(r => r.valid).join(','))  // 'true,false,true'

// ============================================================
// 5. Aggregate error summary across a batch
// ============================================================

const allErrors = results
  .flatMap((r, i) => (r.errors ?? []).map(e => ({ record: i, path: e.path, msg: e.message })))

console.log('validateBatch.totalErrors =', allErrors.length)                        // >= 6
console.log('validateBatch.firstErrPath =', allErrors[0]?.path ?? 'n/a')

// ============================================================
// 6. Import batch from a CSV-like source
// ============================================================

const csvRows: Record<string, string>[] = [
  { username: 'dave', email: 'dave@example.com', age: '35' },
  { username: 'eve',  email: 'eve@BAD',           age: '22' },
  { username: 'f',    email: 'frank@example.com', age: '19' },
]

// Process using the standalone validate() helper in a map
const importResults = csvRows.map(row => validate(userSchema, row))
const importPassed  = importResults.filter(r => r.valid).length
const importFailed  = importResults.filter(r => !r.valid).length

console.log('validateBatch.import.passed =', importPassed)   // 2
console.log('validateBatch.import.failed =', importFailed)   // 1