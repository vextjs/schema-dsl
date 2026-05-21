/**
 * i18n Configuration Feature Tests (v2 TypeScript)
 *
 * v2 API differences:
 * - Locale.locales is private; use Locale.getMessageText() or Locale.getAvailableLocales()
 * - Locale.reset() resets to 'en-US'
 * - locale files imported as ES modules from src/locales/
 */

import { describe, it, expect, afterEach } from 'vitest'
import { join } from 'path'
import { dsl, Locale } from '../../src/index.js'
import zhCN from '../../src/locales/zh-CN.js'
import enUS from '../../src/locales/en-US.js'

const missingLocaleDir = join(process.cwd(), 'test', 'unit', 'non-existent-path')

describe('i18n Configuration Features', () => {

  afterEach(() => {
    Locale.reset()
  })

  describe('Configuration Methods', () => {

    it('should support passing an object as config', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'field.username': 'Username',
              'required': 'Required field'
            } as any
          }
        })
      }).not.toThrow()
    })

    it('should support passing a directory path as config', () => {
      expect(() => {
        dsl.config({
          i18n: missingLocaleDir
        })
      }).not.toThrow()
    })

    it('should override default error messages', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'required': 'Custom required message'
            } as any
          }
        })
      }).not.toThrow()
    })

  })

  describe('Error Message Key Existence', () => {

    it('should have format.binary error message (zh-CN)', () => {
      const msg = (zhCN as any)['format.binary']
      expect(msg).toBeTruthy()
      expect(String(msg)).toContain('Base64')
    })

    it('should have format.binary error message (en-US)', () => {
      const msg = (enUS as any)['format.binary']
      expect(msg).toBeTruthy()
      expect(String(msg).toLowerCase()).toContain('base64')
    })

  })

  describe('Enum Error Messages', () => {

    it('should have enum error message (zh-CN)', () => {
      const msg = (zhCN as any)['enum']
      expect(msg).toBeTruthy()
    })

    it('should have string.enum error message (zh-CN)', () => {
      const msg = (zhCN as any)['string.enum']
      expect(msg).toBeTruthy()
    })

  })

  describe('i18n API Completeness', () => {

    it('should support Locale.addLocale method', () => {
      Locale.addLocale('test-lang', {
        'test.key': 'test value'
      })

      // v2: Locale.locales is private; verify via getMessageText
      const message = Locale.getMessageText('test.key', {}, 'test-lang')
      expect(message).toBe('test value')
    })

    it('should support Locale.setLocale method', () => {
      Locale.setLocale('zh-CN')
      expect(Locale.getLocale()).toBe('zh-CN')
    })

    it('should support Locale.reset method', () => {
      Locale.addLocale('custom', { 'key': 'value' })
      Locale.setLocale('custom')

      Locale.reset()

      expect(Locale.getLocale()).toBe('en-US')
      // custom locale should be cleared
      const available = Locale.getAvailableLocales()
      expect(available).not.toContain('custom')
    })

  })

  describe('Configuration Completeness', () => {

    it('dsl.config should support i18n key', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': { 'test': 'value' } as any
          }
        })
      }).not.toThrow()
    })

    it('dsl.config should support string path', () => {
      expect(() => {
        dsl.config({
          i18n: '/non/existent/path'
        })
      }).not.toThrow()
    })

  })

})
