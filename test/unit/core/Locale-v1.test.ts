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
        'string.min': '{{#label}}太短了',
      })

      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '{{#label}}太短了' })
      expect(Locale.getMessageText('string.min')).toBe('{{#label}}太短了')
    })

    it('should support multiple locale packs', () => {
      Locale.addLocale('zh-CN', { 'string.min': '中文消息' })
      Locale.addLocale('ja-JP', { 'string.min': '日本語メッセージ' })

      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('string.min')).toBe('中文消息')

      Locale.setLocale('ja-JP')
      expect(Locale.getMessageText('string.min')).toBe('日本語メッセージ')
    })
  })

  describe('setMessages()', () => {
    it('should set global custom messages', () => {
      Locale.setMessages({
        'string.min': '全局消息: {{#label}}',
      })

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '全局消息: {{#label}}' })
      expect(Locale.getMessageText('string.min')).toBe('全局消息: {{#label}}')
    })

    it('should merge multiple settings', () => {
      Locale.setMessages({ 'string.min': '消息1' })
      Locale.setMessages({ 'string.max': '消息2' })

      expect(Locale.getMessageText('string.min')).toBe('消息1')
      expect(Locale.getMessageText('string.max')).toBe('消息2')
    })
  })

  describe('getMessage() Priority', () => {
    it('Priority 1: caller-provided custom messages', () => {
      Locale.setMessages({ 'string.min': '全局消息' })
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' })
      Locale.setLocale('zh-CN')

      const customMessages = { 'string.min': '自定义消息' }
      const result = Locale.getMessage('string.min', customMessages)
      expect(result).toEqual({ code: 'string.min', message: '自定义消息' })
    })

    it('Priority 2: addLocale pack messages (higher than setMessages)', () => {
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' })
      Locale.setLocale('zh-CN')

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '语言包消息' })
    })

    it('Priority 3: global custom messages (setMessages)', () => {
      Locale.setMessages({ 'string.min': '全局消息' })
      // no locale pack added, using built-in zh-CN
      Locale.setLocale('en-US')  // switch to en-US, does not override zh-CN locale pack messages

      const result = Locale.getMessage('string.min')
      // setMessages stores as locale-agnostic key, takes priority over built-in
      expect(result).toEqual({ code: 'string.min', message: '全局消息' })
    })

    it('Priority 4: built-in locale messages (zh-CN)', () => {
      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('min')
      expect(result).toEqual(expect.objectContaining({ code: 'min' }))
      expect(Locale.getMessageText('min')).toContain('长度不能少于')
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
