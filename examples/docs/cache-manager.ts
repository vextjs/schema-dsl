import { CacheManager, Validator, s } from '../../dist/pure.js'

// ============================================================
// 1. CacheManager basics — LRU eviction, TTL, stats
// ============================================================

// Create a cache with maxSize=3, 60-second TTL, and stats tracking
const cache = new CacheManager({
  maxSize: 3,
  ttl: 60_000,        // 60 seconds in ms
  statsEnabled: true,
})

// Populate up to capacity
cache.set('schema:user',    { compiled: 'user-schema' })
cache.set('schema:product', { compiled: 'product-schema' })
cache.set('schema:order',   { compiled: 'order-schema' })

// Access 'user' to make it recently used
cache.get('schema:user')   // hit — promotes 'user' to MRU position
cache.get('schema:user')   // hit again

// Insert a 4th entry — LRU ('product') gets evicted
cache.set('schema:payment', { compiled: 'payment-schema' })

console.log('cache-manager.size             =', cache.getStats().size)       // 3
console.log('cache-manager.user.present     =', cache.has('schema:user'))    // true — recently accessed
console.log('cache-manager.product.evicted  =', cache.has('schema:product')) // false — evicted
console.log('cache-manager.order.present    =', cache.has('schema:order'))   // true
console.log('cache-manager.payment.present  =', cache.has('schema:payment')) // true

// ============================================================
// 2. Stats: hits, misses, hitRate, size
// ============================================================

const stats1 = cache.getStats()
console.log('cache-manager.stats.hits     =', stats1.hits)        // 2 (two gets on 'user')
console.log('cache-manager.stats.misses   =', stats1.misses)      // 0 (all hits above)
console.log('cache-manager.stats.hitRate  =', stats1.hitRate)      // 1.0 (100% hit rate so far)

// Attempt a lookup on evicted key → miss
cache.get('schema:product')  // miss
const stats2 = cache.getStats()
console.log('cache-manager.stats.misses.after =', stats2.misses)   // 1
console.log('cache-manager.stats.hitRate.drop =', parseFloat(stats2.hitRate) < 1) // true — rate dropped

// Reset stats counters (size preserved)
cache.resetStats()
const statsReset = cache.getStats()
console.log('cache-manager.reset.hits  =', statsReset.hits)   // 0
console.log('cache-manager.reset.size  =', statsReset.size)   // 3 — entries still there

// ============================================================
// 3. Manual operations — set, get, has, delete, clear
// ============================================================

const cache2 = new CacheManager({ maxSize: 10, statsEnabled: false })

cache2.set('a', { value: 1 })
cache2.set('b', { value: 2 })
cache2.set('c', { value: 3 })

console.log('cache-manager.manual.get     =', (cache2.get('a') as any)?.value)  // 1
console.log('cache-manager.manual.has     =', cache2.has('b'))                  // true
console.log('cache-manager.manual.delete  =', cache2.delete('b'))               // true
console.log('cache-manager.manual.hasGone =', cache2.has('b'))                  // false

cache2.clear()
console.log('cache-manager.manual.clearSize =', cache2.getStats().size)         // 0

// ============================================================
// 4. Validator with built-in cache integration
// ============================================================

const schema = s({ email: 'email!', age: 'integer:18-120' })

// Pass cache options directly to the Validator constructor
const validator = new Validator({
  cache: { maxSize: 50, ttl: 120_000, statsEnabled: true },
} as any)

// First call — schema compiled and cached
validator.validate(schema, { email: 'alice@example.com', age: 28 })
// Second call — cache hit (schema not re-compiled)
validator.validate(schema, { email: 'bob@example.com', age: 35 })
// Third call with bad data — still a cache hit for the schema itself
validator.validate(schema, { email: 'bad', age: 16 })

const validatorStats = validator.getCacheStats()
console.log('cache-manager.validator.enabled  =', validatorStats.enabled)   // true
console.log('cache-manager.validator.hits     =', validatorStats.hits >= 1)  // true

// ============================================================
// 5. TTL expiry simulation (synthetic — demonstrates the API)
// ============================================================

// Create a cache with a very short TTL (for testing use a custom mock; here we show the API)
const shortCache = new CacheManager({ maxSize: 5, ttl: 1000, statsEnabled: true })
shortCache.set('temp', 'temporary-value')
console.log('cache-manager.ttl.present =', shortCache.has('temp'))  // true

// In production, the entry would expire after 1000ms; force clear to simulate
shortCache.clear()
console.log('cache-manager.ttl.cleared =', shortCache.has('temp'))  // false