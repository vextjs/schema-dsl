/**
 * Locale Unit Tests
 * Tests locale registration, lookup, and fallback
 */

import { describe, it, expect, afterEach } from 'vitest'
import { Locale } from '../../../src/core/Locale.js'

describe('Locale', () => {
  afterEach(() => {
    // restore default locale
    Locale.setLocale('zh-CN')
  })

  describe('setLocale() / getLocale()', () => {
    it('set and get current locale', () => {
      Locale.setLocale('en-US')
      expect(Locale.getLocale()).toBe('en-US')
    })

    it('default locale is zh-CN', () => {
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('addLocale()', () => {
    it('can look up after registering custom locale pack', () => {
      Locale.addLocale('custom-test', { greeting: 'Hello' })
      const msg = Locale.getMessage('greeting', {}, 'custom-test')
      expect(msg).toEqual({ code: 'greeting', message: 'Hello' })
      expect(Locale.getMessageText('greeting', {}, 'custom-test')).toBe('Hello')
    })
  })

  describe('getMessage()', () => {
    it('caller custom messages have highest priority', () => {
      const msg = Locale.getMessage('required', { required: 'This is custom' })
      expect(msg).toEqual({ code: 'required', message: 'This is custom' })
    })

    it('unregistered key fallback returns key itself', () => {
      const msg = Locale.getMessage('no_such_key_xyz_abc')
      expect(msg).toBe('no_such_key_xyz_abc')
    })

    it('v1 compatibility: object messages preserve code and message', () => {
      Locale.addLocale('compat-locale', {
        'account.notFound': { code: 40001, message: 'Account not found' },
      })

      expect(Locale.getMessage('account.notFound', {}, 'compat-locale')).toEqual({
        code: 40001,
        message: 'Account not found',
      })
      expect(Locale.getMessageText('account.notFound', {}, 'compat-locale')).toBe('Account not found')
    })
  })

  describe('getAvailableLocales()', () => {
    it('returns array containing zh-CN and en-US', () => {
      const locales = Locale.getAvailableLocales()
      expect(Array.isArray(locales)).toBe(true)
      expect(locales).toContain('zh-CN')
      expect(locales).toContain('en-US')
    })
  })

  describe('isSupportedLocale()', () => {
    it('zh-CN is a supported locale', () => {
      expect(Locale.isSupportedLocale('zh-CN')).toBe(true)
    })

    it('nonexistent-xyz is not supported', () => {
      expect(Locale.isSupportedLocale('nonexistent-xyz')).toBe(false)
    })
  })
})
