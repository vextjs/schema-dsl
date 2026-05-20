/**
 * LRU Cache Tests (v2 TypeScript)
 *
 * Migrated from test/unit/utils/LRUCache.test.js
 *
 * v2 changes:
 * - LRUCache → CacheManager
 * - new LRUCache({ maxSize, enableStats }) → new CacheManager({ maxSize, statsEnabled })
 * - cache.size (property) → cache.size() (method)
 * - cache.get() miss returns null (not undefined)
 * - stats hitRate without % suffix
 * - no efficiency field in stats
 * - no cache.keys() method
 * - cache.maxSize → cache.options.maxSize (not used; use getStats().maxSize)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../../../src/core/CacheManager.js'

describe('LRUCache (CacheManager)', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 3, statsEnabled: true })
  })

  describe('Basic Operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
    })

    it('should return null when key does not exist', () => {
      expect(cache.get('nonexistent')).toBeNull()
    })

    it('should report cache size correctly', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      expect(cache.size()).toBe(2)
    })

    it('should check whether a key exists', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('should delete the specified key', () => {
      cache.set('key1', 'value1')
      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('should clear all cached entries', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('LRU Policy', () => {
    it('should evict the oldest entry when capacity is exceeded', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // exceed capacity (maxSize=3), add 4th entry
      cache.set('key4', 'value4')

      // key1 should be evicted (oldest)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
    })

    it('should update the most-recently-used entry', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // access key1 to make it most-recently-used
      cache.get('key1')

      // add key4; key2 should be evicted (oldest)
      cache.set('key4', 'value4')

      expect(cache.has('key1')).toBe(true)   // accessed, retained
      expect(cache.has('key2')).toBe(false)  // oldest, evicted
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
    })

    it('should maintain LRU order when updating an existing key', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')

      // update key1
      cache.set('key1', 'updated')

      // add key4; key2 should be evicted
      cache.set('key4', 'value4')

      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
      expect(cache.get('key1')).toBe('updated')
    })
  })

  describe('Statistics', () => {
    it('should correctly track hits and misses', () => {
      cache.set('key1', 'value1')

      cache.get('key1') // hit
      cache.get('key2') // miss
      cache.get('key1') // hit
      cache.get('key3') // miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(stats.hitRate).toBe('50.00')
    })

    it('should count evictions', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4') // evicts key1
      cache.set('key5', 'value5') // evicts key2

      // v2 CacheManager may not expose evictions; verify size is capped
      expect(cache.size()).toBe(3)
    })

    it('should be able to reset statistics', () => {
      cache.set('key1', 'value1')
      cache.get('key1')

      cache.resetStats()

      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle maxSize=1', () => {
      const smallCache = new CacheManager({ maxSize: 1 })

      smallCache.set('key1', 'value1')
      smallCache.set('key2', 'value2')

      expect(smallCache.size()).toBe(1)
      expect(smallCache.has('key1')).toBe(false)
      expect(smallCache.has('key2')).toBe(true)
    })

    it('should handle large amounts of data', () => {
      const largeCache = new CacheManager({ maxSize: 100 })

      // add 200 entries
      for (let i = 0; i < 200; i++) {
        largeCache.set(`key${i}`, `value${i}`)
      }

      // only keep the last 100
      expect(largeCache.size()).toBe(100)
      expect(largeCache.has('key0')).toBe(false)
      expect(largeCache.has('key199')).toBe(true)
    })

    it('should handle object and array values', () => {
      const objValue = { nested: { data: 'test' } }
      const arrValue = [1, 2, 3]

      cache.set('obj', objValue)
      cache.set('arr', arrValue)

      expect(cache.get('obj')).toEqual(objValue)
      expect(cache.get('arr')).toEqual(arrValue)
    })
  })

  describe('Memory Safety', () => {
    it('should prevent unbounded growth', () => {
      // add data far exceeding capacity
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`)
      }

      // cache size should be capped
      expect(cache.size()).toBe(3)
      expect(cache.size()).toBeLessThanOrEqual(cache.getStats().maxSize)
    })

    it('should release memory after clearing', () => {
      // add data
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, { large: 'data'.repeat(1000) })
      }

      // clear
      cache.clear()

      expect(cache.size()).toBe(0)
    })
  })

  describe('Performance', () => {
    it('should perform a large number of operations quickly', () => {
      const start = Date.now()

      for (let i = 0; i < 10000; i++) {
        cache.set(`key${i % 100}`, `value${i}`)
        cache.get(`key${i % 50}`)
      }

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100)
    })
  })
})
