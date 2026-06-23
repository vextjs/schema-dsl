/**
 * Locale Package Completeness Tests
 * Tests that the zh-CN / en-US / ja-JP packs have consistent, non-empty keys
 */

import { describe, it, expect } from 'vitest'
import zhCN from '../../../src/locales/zh-CN.js'
import enUS from '../../../src/locales/en-US.js'
import jaJP from '../../../src/locales/ja-JP.js'
import esES from '../../../src/locales/es-ES.js'
import frFR from '../../../src/locales/fr-FR.js'
import locales, {
  enUS as exportedEnUS,
  esES as exportedEsES,
  frFR as exportedFrFR,
  getMessage,
  getMessageCode,
  getMessages,
  getMessageString,
  getSupportedLocales,
  isSupportedLocale,
  jaJP as exportedJaJP,
  zhCN as exportedZhCN,
} from '../../../src/locales/index.js'
import type { LocaleKey } from '../../../src/locales/types.js'

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

  describe('Public locale registry API', () => {
    it('should expose all built-in locale packs through named and default exports', () => {
      expect(exportedZhCN).toBe(zhCN)
      expect(exportedEnUS).toBe(enUS)
      expect(exportedJaJP).toBe(jaJP)
      expect(exportedEsES).toBe(esES)
      expect(exportedFrFR).toBe(frFR)
      expect(locales['zh-CN']).toBe(zhCN)
      expect(locales['en-US']).toBe(enUS)
      expect(locales['ja-JP']).toBe(jaJP)
      expect(locales['es-ES']).toBe(esES)
      expect(locales['fr-FR']).toBe(frFR)
    })

    it('should report supported locales and reject unknown locale names', () => {
      expect(getSupportedLocales().sort()).toEqual(['en-US', 'es-ES', 'fr-FR', 'ja-JP', 'zh-CN'].sort())
      expect(isSupportedLocale('zh-CN')).toBe(true)
      expect(isSupportedLocale('de-DE')).toBe(false)
    })

    it('should resolve locale messages with locale and English fallback chains', () => {
      expect(getMessage('required', 'zh-CN')).toBe(zhCN.required)
      expect(getMessage('required', 'de-DE')).toBe(enUS.required)
      expect(getMessage('required')).toBe(enUS.required)
      expect(getMessage('missing.key' as LocaleKey, 'en-US')).toBe('missing.key')
    })

    it('should unwrap string and object locale messages consistently', () => {
      expect(getMessageString('required', 'en-US')).toBe(enUS.required)
      expect(getMessageString('account.notFound', 'en-US')).toBe('Account not found')
      expect(getMessageCode('account.notFound', 'zh-CN')).toBe('ACCOUNT_NOT_FOUND')
      expect(getMessageCode('required', 'zh-CN')).toBeUndefined()
      expect(getMessageCode('missing.key' as LocaleKey, 'en-US')).toBeUndefined()
    })

    it('should return complete message maps and fall back to en-US for unknown locales', () => {
      expect(getMessages('fr-FR')).toBe(frFR)
      expect(getMessages('unknown-locale')).toBe(enUS)
      expect(getMessages()).toBe(enUS)
    })
  })
})
