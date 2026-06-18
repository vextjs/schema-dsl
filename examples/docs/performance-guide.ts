import { s, validate, Validator, SchemaUtils } from '../../dist/pure.js'

// ============================================================
// 1. Pre-compiling schemas — avoid re-parsing DSL every call
//
//    Parsing DSL strings into JSON Schema happens once at startup.
//    At validation time, AJV compiles to a native validator function and
//    caches it (keyed by schema reference). Pre-defining schemas at module
//    level means the DSL → JSON Schema step never runs in hot paths.
// ============================================================

// Define schemas once at module level (parsed once, reused many times)
const userSchema   = s({ name: 'string:2-50!', email: 'email!', age: 'integer:18-120' })
const productSchema = s({ sku: 'alphanum:5-20!', price: 'number:0.01-!', stock: 'integer:0-!' })
const orderSchema   = s({ orderId: 'uuid!', items: 'array<string>!', total: 'number:0.01-!' })

// ============================================================
// 2. Validator with cache — compiled schemas stored in LRU cache
// ============================================================

const cachedValidator = new Validator({
  cache: { maxSize: 100, ttl: 300_000, statsEnabled: true },
} as any)

// Warm cache on startup — compile all known schemas once
function warmCache(): void {
  cachedValidator.validate(userSchema,    {})
  cachedValidator.validate(productSchema, {})
  cachedValidator.validate(orderSchema,   {})
}
warmCache()

const afterWarm = cachedValidator.getCacheStats()
console.log('performance-guide.warm.size    =', afterWarm.size)       // 3 schemas cached
console.log('performance-guide.warm.enabled =', afterWarm.enabled)    // true

// Subsequent validations use cached compiled functions
cachedValidator.validate(userSchema, { name: 'Alice', email: 'alice@example.com', age: 30 })
cachedValidator.validate(userSchema, { name: 'Bob',   email: 'bob@example.com',   age: 25 })

const afterHits = cachedValidator.getCacheStats()
console.log('performance-guide.hits  =', afterHits.hits >= 2)          // true — 2 cache hits
console.log('performance-guide.misses =', afterHits.misses)            // 0 after warmup

// ============================================================
// 3. compile() — obtain a raw AJV validator function
//    Fastest possible path — returns a boolean (not ValidationResult)
// ============================================================

const compiledFn = cachedValidator.compile(userSchema)

// compiledFn is an AJV ValidateFunction — call it like a function
const isValid = compiledFn({ name: 'Alice', email: 'alice@example.com', age: 30 })
console.log('performance-guide.compile.result =', isValid)             // true (boolean)

// For batch operations where you only need pass/fail (no error details)
const batch = [
  { name: 'Alice', email: 'alice@example.com', age: 30 },
  { name: 'B', email: 'bad', age: 15 },
  { name: 'Carol', email: 'carol@example.com', age: 28 },
]
const batchResults = batch.map(data => compiledFn(data))
console.log('performance-guide.compile.batch =', batchResults.join(','))  // 'true,false,true'

// ============================================================
// 4. validateBatch() — validate many records, collect all errors
// ============================================================

const validator = new Validator()
const batchItems = [
  { name: 'Alice', email: 'alice@example.com', age: 30 },
  { name: 'B',     email: 'bad',               age: 15 },  // two errors
  { name: 'Carol', email: 'carol@example.com', age: 28 },
  { name: '',      email: 'x',                 age: -5 },  // three errors
]
const batchOut = validator.validateBatch(userSchema, batchItems)
const passed = batchOut.filter(r => r.valid).length
const failed = batchOut.filter(r => !r.valid).length
const total  = batchOut.length
console.log('performance-guide.batch.passed  =', passed)    // 2
console.log('performance-guide.batch.failed  =', failed)    // 2
console.log('performance-guide.batch.total   =', total)     // 4

// ============================================================
// 5. SchemaUtils.withPerformance — wrap a validator to add timing metrics
// ============================================================

const measuredValidator = SchemaUtils.withPerformance(
  new Validator({ cache: { maxSize: 10, statsEnabled: true } } as any) as any
) as Validator

measuredValidator.validate(userSchema, { name: 'Dave', email: 'dave@example.com', age: 40 })
measuredValidator.validate(userSchema, { name: 'Eve',  email: 'eve@example.com',  age: 22 })

// The wrapped validator adds a .performance property to each result
const timed = (measuredValidator as any).validate(
  userSchema, { name: 'Frank', email: 'frank@example.com', age: 29 }
) as any
console.log('performance-guide.withPerf.valid    =', timed.valid)                  // true
console.log('performance-guide.withPerf.hasPerf  =', 'performance' in timed)       // true
console.log('performance-guide.withPerf.duration =', timed.performance.duration >= 0) // true

// ============================================================
// 6. allErrors vs. early-exit (default) — performance trade-off
// ============================================================

// Default: stop at first error → faster for most real-world cases
const earlyExit = validate(userSchema, { name: '', email: 'bad', age: -1 })
// allErrors: collect all — useful for form validation UX, slower
const allErrors = validate(userSchema, { name: '', email: 'bad', age: -1 }, { allErrors: true })

console.log('performance-guide.earlyExit.errors =', earlyExit.errors?.length)    // 1 (stopped early)
console.log('performance-guide.allErrors.errors =', (allErrors.errors?.length ?? 0) >= 2) // true

// ============================================================
// 7. Avoid schema creation in hot loops — pattern anti-example vs. correct
// ============================================================

// ❌ Anti-pattern (slow): creates a new schema object on every iteration
function validateSlow(records: unknown[]): boolean[] {
  return records.map(r => validate(s({ name: 'string!', age: 'integer!' }), r).valid)
}

// ✅ Correct: schema defined once, reused
const _hotSchema = s({ name: 'string!', age: 'integer!' })
function validateFast(records: unknown[]): boolean[] {
  return records.map(r => validate(_hotSchema, r).valid)
}

const testData = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: '', age: 'bad' },
]
console.log('performance-guide.slow.result =', validateSlow(testData).join(','))   // 'true,true,false'
console.log('performance-guide.fast.result =', validateFast(testData).join(','))   // 'true,true,false'