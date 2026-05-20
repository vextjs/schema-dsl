/**
 * Locale Tests — v2 Migration (v1 Locale.test.js)
 *
 * v2 changes:
 * - getMessage() restores v1's { code, message } object form; use getMessageText() for string assertions
 * - default locale is 'zh-CN' (not 'en-US')
 * - reset() resets to 'zh-CN'
 * - addLocale() stores as `${locale}:${key}` format, does not affect getAvailableLocales() result
 * - setMessages() global message priority is lower than addLocale() locale pack messages
 */

import { describe, it, expect, afterEach } from 'vitest'
import { Locale } from '../../../src/index.js'

describe('Locale', () => {
  afterEach(() => {
    Locale.reset()
  })

  describe('setLocale() / getLocale()', () => {
    it('should set and get current locale', () => {
      Locale.setLocale('en-US')
      expect(Locale.getLocale()).toBe('en-US')
    })

    it('default locale should be zh-CN (v2 default)', () => {
      Locale.reset()
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('addLocale()', () => {
    it('should add custom locale pack messages', () => {
      Locale.addLocale('zh-CN', {
        'string.min': '{{#label}} is too short',
      })

      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '{{#label}} is too short' })
      expect(Locale.getMessageText('string.min')).toBe('{{#label}} is too short')
    })

    it('should support multiple locale packs', () => {
      Locale.addLocale('zh-CN', { 'string.min': 'zh-CN-test' })
      Locale.addLocale('ja-JP', { 'string.min': '\u65e5\u672c\u8a9e\u30e1\u30c3\u30bb\u30fc\u30b8' })

      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('string.min')).toBe('zh-CN-test')

      Locale.setLocale('ja-JP')
      expect(Locale.getMessageText('string.min')).toBe('\u65e5\u672c\u8a9e\u30e1\u30c3\u30bb\u30fc\u30b8')
    })
  })

  describe('setMessages()', () => {
    it('should set global custom messages', () => {
      Locale.setMessages({
        'string.min': 'Global: {{#label}}',
      })

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: 'Global: {{#label}}' })
      expect(Locale.getMessageText('string.min')).toBe('Global: {{#label}}')
    })

    it('should merge multiple settings', () => {
      Locale.setMessages({ 'string.min': 'msg-1' })
      Locale.setMessages({ 'string.max': 'msg-2' })

      expect(Locale.getMessageText('string.min')).toBe('msg-1')
      expect(Locale.getMessageText('string.max')).toBe('msg-2')
    })
  })

  describe('getMessage() Priority', () => {
    it('Priority 1: caller-provided custom messages', () => {
      Locale.setMessages({ 'string.min': 'global-msg' })
      Locale.addLocale('zh-CN', { 'string.min': 'locale-pack-msg' })
      Locale.setLocale('zh-CN')

      const customMessages = { 'string.min': 'custom-msg' }
      const result = Locale.getMessage('string.min', customMessages)
      expect(result).toEqual({ code: 'string.min', message: 'custom-msg' })
    })

    it('Priority 2: addLocale pack messages (higher than setMessages)', () => {
      Locale.addLocale('zh-CN', { 'string.min': 'locale-pack-msg' })
      Locale.setLocale('zh-CN')

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: 'locale-pack-msg' })
    })

    it('Priority 3: global custom messages (setMessages)', () => {
      Locale.setMessages({ 'string.min': 'global-msg' })
      // no locale pack added, using built-in zh-CN
      Locale.setLocale('en-US')  // switch to en-US, does not override zh-CN locale pack messages

      const result = Locale.getMessage('string.min')
      // setMessages stores as locale-agnostic key, takes priority over built-in
      expect(result).toEqual({ code: 'string.min', message: 'global-msg' })
    })

    it('Priority 4: built-in locale messages (zh-CN)', () => {
      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('min')
      expect(result).toEqual(expect.objectContaining({ code: 'min' }))
      expect(Locale.getMessageText('min')).toContain('\u957f\u5ea6\u4e0d\u80fd\u5c11\u4e8e')
    })

    it('Priority 4: built-in locale messages (en-US)', () => {
      Locale.setLocale('en-US')
      const result = Locale.getMessage('min')
      expect(result).toEqual(expect.objectContaining({ code: 'min' }))
      expect(Locale.getMessageText('min')).toContain('length must be at least')
    })

    it('unknown error code should return original string (v2 behavior)', () => {
      const result = Locale.getMessage('unknown.error.xyz')
      expect(typeof result).toBe('string')
      expect(result).toBe('unknown.error.xyz')
    })
  })

  describe('getAvailableLocales()', () => {
    it('should return built-in supported locales', () => {
      const locales = Locale.getAvailableLocales()
      expect(locales).toContain('zh-CN')
      expect(locales).toContain('en-US')
    })
  })

  describe('reset()', () => {
    it('should reset to initial state', () => {
      Locale.setLocale('en-US')
      Locale.addLocale('custom-test', { test: 'value' })
      Locale.setMessages({ test: 'global' })

      Locale.reset()

      // v2 reset: back to zh-CN
      expect(Locale.getLocale()).toBe('zh-CN')
      // customMessages cleared
      expect(Locale.getMessage('test')).toBe('test')
    })
  })
})
