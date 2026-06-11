# CacheManager cache manager

> **Module**: `src/core/CacheManager.ts` (Public export: `require('schema-dsl').CacheManager`)

> **Purpose**: High-performance Schema compilation cache, supporting LRU eviction and TTL expiration

---

## 📑 Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Configuration Options](#configuration-options)
- [Statistics](#statistics)
- [Cache Boundaries](#cache-boundaries)
- [Best Practice](#best-practices)

---

## Overview

`CacheManager` is the internal caching system of schema-dsl, which is used to cache the compiled Schema validation function to avoid the performance overhead caused by repeated compilation.

### Core functions

- ✅ LRU (least recently used) elimination strategy
- ✅ TTL (time to live) expiration mechanism
- ✅ Hit rate statistics
- ✅ Configurable cache size
- ✅ Automatically clear expired cache

---

## quick start

```javascript
const { CacheManager } = require('schema-dsl');

//Create cache instance
const cache = new CacheManager({
  maxSize: 5000, //Default maximum cache size
  ttl: 3600000 // Expires in 1 hour
});

// store cache
cache.set('user-schema', compiledValidator);

// Get cache
const validator = cache.get('user-schema');
if (validator) {
  console.log('cache hit');
} else {
  console.log('cache miss');
}

// View statistics
console.log(cache.getStats());
```

---

## API reference

### Constructor

```javascript
new CacheManager(options)
```
**Parameters**:

| Parameter | type | default value | Description |
|------|------|--------|------|
| `options.maxSize` | number | `5000` | Maximum number of cache entries |
| `options.ttl` | number | `3600000` | Cache lifetime (milliseconds) |
| `options.enabled` | boolean | `true` | Whether to enable caching |
| `options.statsEnabled` | boolean | `true` | Whether to enable statistics |

---

### `get(key)`

Get cached value.

```javascript
const value = cache.get('my-key');
```

**Return Value**:
- Hit: Returns the cached value
- Missed or expired: return `null`

**Behavior**:
- Update access time (LRU)
- Increase access count
- Move entry to end of queue

---

### `set(key, value, ttl?)`

Set cache value.

```javascript
// Use default TTL
cache.set('key', value);

// Use custom TTL (5 minutes)
cache.set('key', value, 300000);
```

**Behavior**:
- If maximum capacity is reached, automatically retire the oldest unused entries
- Record creation time and access time

---

### `delete(key)`

Delete cache entries.

```javascript
const deleted = cache.delete('key');
console.log(deleted); // true or false
```

---

### `has(key)`

Check cache exists (do not update access time).

```javascript
if (cache.has('key')) {
  console.log('cache exists');
}
```

---

### `clear()`

Clear all caches.

```javascript
cache.clear();
```

---

### `getStats()`

Get cache statistics.

```javascript
const stats = cache.getStats();
console.log(stats);
// {
// hits: 150, // Number of hits
// misses: 30, // Number of misses
// evictions: 10, // Number of eliminations
// sets: 100, // Number of settings
// deletes: 5, // Number of deletes
// clears: 1, // Number of clears
// hitRate: '83.33', // Hit rate percentage string
// size: 80, // Current cache number
// maxSize: 5000, // maximum capacity
// enabled: true // Whether to enable caching
// }
```

---

### `resetStats()`

Reset statistics.

```javascript
cache.resetStats();
```

---

### `size()`

Get the current number of cache entries.

```javascript
console.log(`Current cache: ${cache.size()} items`);
```

---

## Configuration options

### cache size

```javascript
// Small application (save memory)
const smallCache = new CacheManager({ maxSize: 50 });

// Large applications (higher performance)
const largeCache = new CacheManager({ maxSize: 500 });
```

### TTL settings

```javascript
// Short-term caching (5 minutes)
const shortCache = new CacheManager({ ttl: 5 * 60 * 1000 });

// Long term cache (24 hours)
const longCache = new CacheManager({ ttl: 24 * 60 * 60 * 1000 });

// Never expires
const permanentCache = new CacheManager({ ttl: 0 });
```

### Disable caching

```javascript
// Development environment may need to disable caching
const noCache = new CacheManager({ enabled: false });
```

---

## Statistics

### Hit rate analysis

```javascript
function analyzeCachePerformance(cache) {
  const stats = cache.getStats();

  console.log('=== Cache performance analysis ===');
  console.log(`Number of hits: ${stats.hits}`);
  console.log(`Number of misses: ${stats.misses}`);
  console.log(`Hit rate: ${stats.hitRate}%`);
  console.log(`Cache usage: ${(stats.size / stats.maxSize * 100).toFixed(1)}%`);
  console.log(`Number of eliminations: ${stats.evictions}`);

  //Performance recommendations
  if (Number(stats.hitRate) < 50) {
    console.log('⚠️ The hit rate is low, consider increasing the cache size');
  }
  if (stats.evictions > stats.sets * 0.5) {
    console.log('⚠️ The elimination rate is high, consider increasing the cache size or TTL');
  }
}
```

### Monitoring dashboard

```javascript
function printCacheDashboard(cache) {
  const stats = cache.getStats();
  const hitRate = `${stats.hitRate}%`;
  const usage = (stats.size / stats.maxSize * 100).toFixed(1);

  console.log('┌─────────────────────────────┐');
  console.log('│ Cache Status Dashboard │');
  console.log('├─────────────────────────────┤');
  console.log(`│ Hit rate: ${hitRate.padStart(8)} │`);
  console.log(`│ Usage rate: ${usage.padStart(6)}% │`);
  console.log(`│ Current entry: ${String(stats.size).padStart(6)} │`);
  console.log(`│ Maximum capacity: ${String(stats.maxSize).padStart(6)} │`);
  console.log('└─────────────────────────────┘');
}
```

---

## Cache boundaries

`CacheManager` stores compiled validators for repeated schema cache keys. It reduces repeated AJV compilation, but it does not make unlimited dynamic schema shapes free.

- Stable schema structure + reused `Validator` instance: cache hits are expected.
- `new Validator()` on every request: each instance starts with a new cache, so previous hits are lost.
- A different schema shape on every request: cache misses and evictions are expected even with a large `maxSize`.

If low hit rate is caused by high-cardinality dynamic schemas, prefer bounding or reusing schema shapes. Increasing `maxSize` only helps when entries are likely to be reused.

---

## best practices

### 1. Set the cache size appropriately

```javascript
// Estimated based on Schema quantity
// If there are 50 different schemas, set 100 to have margin
const cache = new CacheManager({ maxSize: 100 });
```

### 2. Disable caching in the development environment

```javascript
const cache = new CacheManager({
  enabled: process.env.NODE_ENV !== 'development'
});
```

### 3. Check performance regularly

```javascript
setInterval(() => {
  const stats = cache.getStats();
  if (Number(stats.hitRate) < 80) {
    console.warn('cache hit rate is less than 80%');
  }
}, 60000);
```

### 4. Clear cache when Schema is updated

```javascript
function updateSchema(name, newSchema) {
  //Update Schema
  schemas[name] = newSchema;

  //Clear related cache
  cache.delete(`schema:${name}`);
}
```

---

## LRU elimination mechanism

When the cache reaches maximum capacity, the oldest unused entries are automatically evicted:

```text
Cache operation sequence:
1. set('A', ...) → [A]
2. set('B', ...) → [A, B]
3. set('C',...) → [A, B, C] (reach maxSize=3)
4. get('A') → [B, C, A] (A is moved to the end)
5. set('D',...) → [C, A, D] (B is eliminated)
```

---

## Related documents

- [Validator](validate.md)
- [Performance Optimization Guide](validation-guide.md#performance-optimization)
- [API Reference](api-reference.md)

---

## Corresponding sample file

**Example entry**: [cache-manager.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/cache-manager.ts)
**DESCRIPTION**: Covers the actual behavior of `set/get/has`, LRU eviction, statistics reading, and `resetStats()`.
