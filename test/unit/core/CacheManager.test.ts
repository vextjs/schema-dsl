/**
 * CacheManager 单元测试 — v2 迁移
 *
 * v2 变更：
 * - 委托 cache-hub MemoryCache，不再直接暴露 options 属性
 * - getStats() 字段：hits/misses/sets/deletes/clears/hitRate/size/maxSize/enabled
 * - 无 evictions 字段（cache-hub 内部处理）
 * - 无 statsEnabled 选项
 * - set(key, value, ttl?) 第三参数单位 ms
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '../../../src/core/CacheManager.js'

describe('CacheManager - 缓存管理器', () => {
  let cache: CacheManager

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 3, ttl: 1000 })
  })

  afterEach(() => {
    cache.clear()
  })

  describe('基础功能', () => {
    it('应该正确创建缓存实例', () => {
      expect(cache).toBeInstanceOf(CacheManager)
      // v2 无 options 属性，通过 getStats() 验证配置生效
      const stats = cache.getStats()
      expect(stats.maxSize).toBe(3)
      expect(stats.enabled).toBe(true)
    })

    it('应该支持 set 和 get 操作', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.get('key1')).toBe('value1')
    })

    it('应该在禁用时不缓存', () => {
      const disabledCache = new CacheManager({ enabled: false })
      disabledCache.set('key1', 'value1' as any)
      expect(disabledCache.get('key1')).toBeNull()
    })

    it('应该返回缓存大小', () => {
      expect(cache.size()).toBe(0)
      cache.set('key1', 'value1' as any)
      expect(cache.size()).toBe(1)
      cache.set('key2', 'value2' as any)
      expect(cache.size()).toBe(2)
    })

    it('应该支持 has 检查', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.has('key1')).toBe(true)
      expect(cache.has('key2')).toBe(false)
    })

    it('应该支持 delete 操作', () => {
      cache.set('key1', 'value1' as any)
      expect(cache.has('key1')).toBe(true)
      cache.delete('key1')
      expect(cache.has('key1')).toBe(false)
    })

    it('应该支持 clear 清空', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      expect(cache.size()).toBe(2)
      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('LRU 淘汰策略', () => {
    it('应该在超过 maxSize 时淘汰最早的项', () => {
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

    it('访问后应该更新 LRU 顺序', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      cache.set('key3', 'value3' as any)

      cache.get('key1') // 移到最新

      cache.set('key4', 'value4' as any)
      expect(cache.get('key2')).toBeNull()
      expect(cache.get('key1')).toBe('value1')
      expect(cache.get('key3')).toBe('value3')
      expect(cache.get('key4')).toBe('value4')
    })
  })

  describe('TTL 过期机制', () => {
    it('应该在 TTL 过期后返回 null', async () => {
      const shortCache = new CacheManager({ ttl: 50 })
      shortCache.set('key1', 'value1' as any)
      expect(shortCache.get('key1')).toBe('value1')

      await new Promise(r => setTimeout(r, 80))
      expect(shortCache.get('key1')).toBeNull()
    })

    it('应该支持自定义 TTL', async () => {
      cache.set('key1', 'value1' as any, 50)
      expect(cache.get('key1')).toBe('value1')

      await new Promise(r => setTimeout(r, 80))
      expect(cache.get('key1')).toBeNull()
    })

    it('应该在未过期时正常返回', async () => {
      const longCache = new CacheManager({ ttl: 500 })
      longCache.set('key1', 'value1' as any)

      await new Promise(r => setTimeout(r, 100))
      expect(longCache.get('key1')).toBe('value1')
    })
  })

  describe('统计信息', () => {
    it('应该正确记录 hits 和 misses', () => {
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

    it('应该记录 sets 和 deletes', () => {
      cache.set('key1', 'value1' as any)
      cache.set('key2', 'value2' as any)
      cache.delete('key1')

      const stats = cache.getStats()
      expect(stats.sets).toBe(2)
      expect(stats.deletes).toBe(1)
    })

    it('应该记录 clears 次数', () => {
      cache.set('key1', 'value1' as any)
      cache.clear()
      cache.set('key2', 'value2' as any)
      cache.clear()

      const stats = cache.getStats()
      expect(stats.clears).toBe(2)
    })

    it('应该支持重置统计', () => {
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

  describe('边界情况', () => {
    it('应该处理复杂对象作为值', () => {
      const complexValue = { nested: { data: [1, 2, 3] } }
      cache.set('key1', complexValue as any)
      expect(cache.get('key1')).toEqual(complexValue)
    })

    it('应该处理大量数据', () => {
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

  describe('性能测试', () => {
    it('应该高效处理大量操作', () => {
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
