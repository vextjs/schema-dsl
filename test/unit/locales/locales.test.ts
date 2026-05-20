/**
 * Locale Package Completeness Tests
 * Tests that the zh-CN / en-US / ja-JP packs have consistent, non-empty keys
 */

import { describe, it, expect } from 'vitest'
import zhCN from '../../../src/locales/zh-CN.js'
import enUS from '../../../src/locales/en-US.js'
import jaJP from '../../../src/locales/ja-JP.js'

const REQUIRED_KEYS = [
  'required',
  'type',
  'min',
  'max',
  'pattern',
  'enum',
  'custom',
  'format.email',
  'format.url',
]

describe('Locale Package Completeness', () => {
  describe('zh-CN', () => {
    for (const key of REQUIRED_KEYS) {
      it(`contains key: ${key}`, () => {
        const val = (zhCN as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('en-US', () => {
    for (const key of REQUIRED_KEYS) {
      it(`contains key: ${key}`, () => {
        const val = (enUS as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('ja-JP', () => {
    for (const key of REQUIRED_KEYS) {
      it(`contains key: ${key}`, () => {
        const val = (jaJP as Record<string, unknown>)[key]
        expect(val).toBeTruthy()
      })
    }
  })

  describe('Three-pack key sets are identical', () => {
    it('zh-CN and en-US should have the same key set', () => {
      const zhKeys = new Set(Object.keys(zhCN))
      const enKeys = new Set(Object.keys(enUS))
      const onlyInZh = [...zhKeys].filter(k => !enKeys.has(k))
      const onlyInEn = [...enKeys].filter(k => !zhKeys.has(k))
      expect(onlyInZh).toHaveLength(0)
      expect(onlyInEn).toHaveLength(0)
    })

    it('zh-CN and ja-JP should have the same key set', () => {
      const zhKeys = new Set(Object.keys(zhCN))
      const jaKeys = new Set(Object.keys(jaJP))
      const onlyInZh = [...zhKeys].filter(k => !jaKeys.has(k))
      const onlyInJa = [...jaKeys].filter(k => !zhKeys.has(k))
      expect(onlyInZh).toHaveLength(0)
      expect(onlyInJa).toHaveLength(0)
    })
  })
})
