/**
 * Locale 缓存测试 — v2 迁移（v1 LocaleWithCache.test.js）
 *
 * v2 变更：LRUCache 不直接导出；改为通过 CacheManager 测试缓存行为。
 * 主要验证 LRU 驱逐策略和统计功能。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CacheManager } from '../../../src/index.js'

describe('Locale 语言包缓存（CacheManager）', () => {
  let cache: InstanceType<typeof CacheManager>

  beforeEach(() => {
    cache = new CacheManager({ maxSize: 5 })
  })

  describe('基础缓存操作', () => {
    it('应该缓存和获取对象', () => {
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

    it('多个语言包各自独立缓存', () => {
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

    it('应该正确统计 set 和 hits', () => {
      cache.set('zh-CN', { required: '[zh-CN] Required' })
      cache.get('zh-CN') // hit
      cache.get('zh-CN') // hit

      cache.set('en-US', { required: '[en-US] Required' })

      const stats = cache.getStats()
      expect(stats.sets).toBe(2)
      expect(stats.hits).toBeGreaterThanOrEqual(2)
    })
  })

  describe('LRU 驱逐策略', () => {
    it('应该自动驱逐最少使用的条目', () => {
      for (let i = 1; i <= 5; i++) {
        cache.set(`lang-${i}`, { required: `Required ${i}` })
      }

      expect(cache.size()).toBe(5)

      cache.set('lang-6', { required: 'Required 6' })

      expect(cache.size()).toBe(5)
      expect(cache.has('lang-1')).toBe(false)
      expect(cache.has('lang-6')).toBe(true)
    })

    it('应该保持热门语言在缓存中', () => {
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

  describe('并发场景（异步）', () => {
    it('应该处理并发的语言包加载', async () => {
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

  describe('内存效率', () => {
    it('语言包级缓存条目数远少于消息级缓存', () => {
      const languagePackCache = new CacheManager({ maxSize: 5 })
      const locales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR']

      locales.forEach(locale => {
        const pack: Record<string, string> = {}
        for (let i = 0; i < 50; i++) {
          pack[`error_${i}`] = `[${locale}] Error message ${i}`
        }
        languagePackCache.set(locale, pack)
      })

      expect(languagePackCache.size()).toBe(5) // 5 个条目

      const messageCache = new CacheManager({ maxSize: 250 })
      locales.forEach(locale => {
        for (let i = 0; i < 50; i++) {
          messageCache.set(`${locale}:error_${i}`, `[${locale}] Error message ${i}`)
        }
      })

      expect(messageCache.size()).toBe(250) // 250 个条目
      expect(languagePackCache.size()).toBeLessThan(messageCache.size())
    })

    it('应该支持大量 key 但只缓存最近使用的', () => {
      const bigCache = new CacheManager({ maxSize: 10 })

      for (let i = 1; i <= 100; i++) {
        bigCache.set(`lang-${i}`, { required: `Lang ${i} Required` })
      }

      expect(bigCache.size()).toBe(10)
      expect(bigCache.has('lang-91')).toBe(true)
      expect(bigCache.has('lang-100')).toBe(true)
      expect(bigCache.has('lang-1')).toBe(false)

      const stats = bigCache.getStats()
      // v2 getStats() 未暴露 evictions 字段（内部 cache-hub 统计）
      expect(stats.sets).toBeGreaterThan(0)
    })
  })
})
