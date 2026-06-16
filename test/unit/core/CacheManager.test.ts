/**
 * CacheManager Unit Tests — v2 Migration
 *
 * v2 Changes:
 * - Delegates to cache-hub MemoryCache, no longer exposes options directly
 * - getStats() fields: hits/misses/sets/deletes/clears/hitRate/size/maxSize/enabled
 * - No evictions field (handled internally by cache-hub)
 * - No statsEnabled option
 * - set(key, value, ttl?) third parameter unit is ms
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '../../../src/core/CacheManager.js'

describe('CacheManager', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 3, ttl: 1000 })
  })

  afterEach(() => {
    cache.clear()
  })

  describe('Basic Functionality', () => {
    it('should correctly create a cache instance', () => {
      expect(cache).toBeInstanceOf(CacheManager)
      // v2 has no options property, verify config via getStats()
      const stats = cache.getStats()
      expect(stats.maxSize).toBe(3)
      expect(stats.enabled).toBe(true)
    })

    it('should support set and get operations', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.get('key1')).toBe('value1')
    })

    it('should not cache when disabled', () => {
      const disabledCache = new CacheManager({ enabled: false })
      disabledCache.set('key1', 'value1' as any)
      expect(disabledCache.get('key1')).toBeNull()
    })

    it('should use a non-expiring default TTL', () => {
      const defaultCache = new CacheManager()
      expect(defaultCache.options.ttl).toBe(0)
    })

    it('should synchronize runtime option changes to the inner cache', () => {
      const runtimeCache = new CacheManager({ maxSize: 3, ttl: 1000, statsEnabled: true })
      runtimeCache.set('key1', 'value1' as any)

      runtimeCache.options = { enabled: false, ttl: 0, statsEnabled: false }

      expect(runtimeCache.options).toMatchObject({ enabled: false, ttl: 0, statsEnabled: false })
      expect(runtimeCache.get('key1')).toBeNull()
      expect(runtimeCache.has('key1')).toBe(false)
      expect(runtimeCache.delete('key1')).toBe(false)
      expect(runtimeCache.getStats()).toMatchObject({ enabled: false, hits: 0, misses: 0 })
    })

    it('should return cache size', () => {
      expect(cache.size()).toBe(0)
      cache.set('key1', 'value1' as any)
      expect(cache.size()).toBe(1)
      cache.set('key2', 'value2' as any)
      expect(cache.size()).toBe(2)
    })

    it('should support has check', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('should support delete operation', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.has('key1')).toBe(true)
      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('should support clear', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      expect(cache.size()).toBe(2)
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('LRU Eviction Strategy', () => {
    it('should evict the oldest item when maxSize is exceeded', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      cache.set('key3', 'value3' as any)
      expect(cache.size()).toBe(3)

      cache.set('key4', 'value4' as any)
      expect(cache.size()).toBe(3)
      expect(cache.get('key1')).toBeNull()
      expect(cache.get('key2')).toBe('value2')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })

    it('should update LRU order after access', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      cache.set('key3', 'value3' as any)

      cache.get('key1') // move to most recent

      cache.set('key4', 'value4' as any)
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })
  })

  describe('TTL Expiration Mechanism', () => {
    it('should return null after TTL expiration', async () => {
      const shortCache = new CacheManager({ ttl: 50 })
      shortCache.set('key1', 'value1' as any)
      expect(shortCache.get('key1')).toBe('value1')

      await new Promise(r => setTimeout(r, 80))
      expect(shortCache.get('key1')).toBeNull()
    })

    it('should support custom TTL', async () => {
      cache.set('key1', 'value1' as any, 50)
      expect(cache.get('key1')).toBe('value1')

      await new Promise(r => setTimeout(r, 80))
      expect(cache.get('key1')).toBeNull()
    })

    it('should return normally when not expired', async () => {
      const longCache = new CacheManager({ ttl: 500 })
      longCache.set('key1', 'value1' as any)

      await new Promise(r => setTimeout(r, 100))
      expect(longCache.get('key1')).toBe('value1')
    })
  })

  describe('Statistics', () => {
    it('should correctly record hits and misses', () => {
      cache.set('key1', 'value1' as any)

      cache.get('key1') // hit
      cache.get('key2') // miss
      cache.get('key1') // hit
      cache.get('key3') // miss

      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
      expect(parseFloat(stats.hitRate)).toBeCloseTo(50, 0)
    })

    it('should record sets and deletes', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      cache.delete('key1')

      const stats = cache.getStats()
      expect(stats.sets).toBe(2)
      expect(stats.deletes).toBe(1)
    })

    it('should record clears count', () => {
      cache.set('key1', 'value1' as any)
      cache.clear()
      cache.set('key2', 'value2' as any)
      cache.clear()

      const stats = cache.getStats()
      expect(stats.clears).toBe(2)
    })

    it('should support resetting statistics', () => {
      cache.set('key1', 'value1' as any)
      cache.get('key1')
      cache.get('key2')

      let stats = cache.getStats()
      expect(stats.hits).toBeGreaterThan(0)

      cache.resetStats()
      stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle complex objects as values', () => {
      const complexValue = { nested: { data: [1, 2, 3] } }
      cache.set('key1', complexValue as any)
      expect(cache.get('key1')).toEqual(complexValue)
    })

    it('should handle large amounts of data', () => {
      const bigCache = new CacheManager({ maxSize: 1000 })
      for (let i = 0; i < 1000; i++) {
        bigCache.set(`key${i}`, `value${i}` as any)
      }
      expect(bigCache.size()).toBe(1000)

      bigCache.set('key1000', 'value1000' as any)
      expect(bigCache.size()).toBe(1000)
      expect(bigCache.get('key0')).toBeNull()
    })
  })

  describe('Performance Tests', () => {
    it('should efficiently handle a large number of operations', () => {
      const perfCache = new CacheManager({ maxSize: 100 })
      const start = Date.now()

      for (let i = 0; i < 10000; i++) {
        perfCache.set(`key${i % 100}`, `value${i}` as any)
        perfCache.get(`key${i % 100}`)
      }

      const elapsed = Date.now() - start
      expect(elapsed).toBeLessThan(200)
    })
  })
})
