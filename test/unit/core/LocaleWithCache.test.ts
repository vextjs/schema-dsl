/**
 * Locale Cache Tests — v2 Migration (v1 LocaleWithCache.test.js)
 *
 * v2 changes: LRUCache is not directly exported; test cache behavior via CacheManager instead.
 * Primarily validates LRU eviction strategy and statistics.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../../../src/core/CacheManager.js'

describe('Locale Pack Cache (CacheManager)', () => {
  let cache: InstanceType<typeof CacheManager>

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 5 })
  })

  describe('Basic Cache Operations', () => {
    it('should cache and retrieve objects', () => {
      const zhCN = {
        required: '必填字段',
        minLength: '长度不能少于{{min}}',
        email: '邮箱格式不正确',
      }

      cache.set('zh-CN', zhCN)
      const cached = cache.get('zh-CN')

      expect(cached).toEqual(zhCN)
      expect((cached as typeof zhCN).required).toBe('必填字段')
    })

    it('multiple locale packs are cached independently', () => {
      const locales: Record<string, Record<string, string>> = {
        'zh-CN': { required: '必填', email: '邮箱' },
        'en-US': { required: 'Required', email: 'Email' },
        'ja-JP': { required: '必須', email: 'メール' },
      }

      Object.entries(locales).forEach(([locale, pack]) => {
        cache.set(locale, pack)
      })

      expect(cache.size()).toBe(3)
      expect((cache.get('zh-CN') as typeof locales['zh-CN']).required).toBe('必填')
      expect((cache.get('en-US') as typeof locales['en-US']).required).toBe('Required')
    })

    it('should correctly track sets and hits', () => {
      cache.set('zh-CN', { required: '[zh-CN] Required' })
      cache.get('zh-CN') // hit
      cache.get('zh-CN') // hit

      cache.set('en-US', { required: '[en-US] Required' })

      const stats = cache.getStats()
      expect(stats.sets).toBe(2)
      expect(stats.hits).toBeGreaterThanOrEqual(2)
    })
  })

  describe('LRU Eviction Policy', () => {
    it('should automatically evict least recently used entries', () => {
      for (let i = 1; i <= 5; i++) {
        cache.set(`lang-${i}`, { required: `Required ${i}` })
      }

      expect(cache.size()).toBe(5)

      cache.set('lang-6', { required: 'Required 6' })

      expect(cache.size()).toBe(5)
      expect(cache.has('lang-1')).toBe(false)
      expect(cache.has('lang-6')).toBe(true)
    })

    it('should keep popular locales in cache', () => {
      const hotLocales = ['zh-CN', 'en-US']
      const coldLocales = ['ja-JP', 'es-ES', 'fr-FR', 'ko-KR']

      hotLocales.forEach(locale => {
        cache.set(locale, { required: `${locale} required` })
      })

      for (let i = 0; i < 5; i++) {
        cache.get('zh-CN')
        cache.get('en-US')
      }

      coldLocales.forEach(locale => {
        cache.set(locale, { required: `${locale} required` })
        cache.get('zh-CN')
        cache.get('en-US')
      })

      expect(cache.has('zh-CN')).toBe(true)
      expect(cache.has('en-US')).toBe(true)
    })
  })

  describe('Concurrent Scenarios (async)', () => {
    it('should handle concurrent locale pack loading', async () => {
      const mockLoadLanguagePack = (locale: string) =>
        new Promise<Record<string, string>>(resolve =>
          setTimeout(() => resolve({ required: `[${locale}] Required` }), 5)
        )

      const getLanguagePack = async (locale: string) => {
        let pack = cache.get(locale)
        if (!pack) {
          pack = await mockLoadLanguagePack(locale)
          cache.set(locale, pack)
        }
        return pack
      }

      const locales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR']
      const promises = Array.from({ length: 10 }, (_, i) =>
        getLanguagePack(locales[i % locales.length])
      )

      const results = await Promise.all(promises)
      expect(results.length).toBe(10)
      expect(cache.size()).toBe(5)
    })
  })

  describe('Memory Efficiency', () => {
    it('locale-pack-level cache has far fewer entries than message-level cache', () => {
      const languagePackCache = new CacheManager({ maxSize: 5 })
      const locales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR']

      locales.forEach(locale => {
        const pack: Record<string, string> = {}
        for (let i = 0; i < 50; i++) {
          pack[`error_${i}`] = `[${locale}] Error message ${i}`
        }
        languagePackCache.set(locale, pack)
      })

      expect(languagePackCache.size()).toBe(5) // 5 entries

      const messageCache = new CacheManager({ maxSize: 250 })
      locales.forEach(locale => {
        for (let i = 0; i < 50; i++) {
          messageCache.set(`${locale}:error_${i}`, `[${locale}] Error message ${i}`)
        }
      })

      expect(messageCache.size()).toBe(250) // 250 entries
      expect(languagePackCache.size()).toBeLessThan(messageCache.size())
    })

    it('should support large numbers of keys but only cache recently used ones', () => {
      const bigCache = new CacheManager({ maxSize: 10 })

      for (let i = 1; i <= 100; i++) {
        bigCache.set(`lang-${i}`, { required: `Lang ${i} Required` })
      }

      expect(bigCache.size()).toBe(10)
      expect(bigCache.has('lang-91')).toBe(true)
      expect(bigCache.has('lang-100')).toBe(true)
      expect(bigCache.has('lang-1')).toBe(false)

      const stats = bigCache.getStats()
      // v2 getStats() does not expose evictions field (internal cache-hub stats)
      expect(stats.sets).toBeGreaterThan(0)
    })
  })
})
