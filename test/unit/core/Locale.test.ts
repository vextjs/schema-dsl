/**
 * Locale 单元测试
 * 测试语言包注册、查找、fallback
 */

import { describe, it, expect, afterEach } from 'vitest'
import { Locale } from '../../../src/core/Locale.js'

describe('Locale', () => {
  afterEach(() => {
    // 恢复默认语言
    Locale.setLocale('zh-CN')
  })

  describe('setLocale() / getLocale()', () => {
    it('设置并读取当前语言', () => {
      Locale.setLocale('en-US')
      expect(Locale.getLocale()).toBe('en-US')
    })

    it('默认语言为 zh-CN', () => {
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('addLocale()', () => {
    it('注册自定义语言包后可查找', () => {
      Locale.addLocale('custom-test', { greeting: 'Hello' })
      const msg = Locale.getMessage('greeting', {}, 'custom-test')
      expect(msg).toBe('Hello')
    })
  })

  describe('getMessage()', () => {
    it('caller 自定义消息优先级最高', () => {
      const msg = Locale.getMessage('required', { required: '这是自定义' })
      expect(msg).toBe('这是自定义')
    })

    it('未注册 key fallback 返回 key 本身', () => {
      const msg = Locale.getMessage('no_such_key_xyz_abc')
      expect(msg).toBe('no_such_key_xyz_abc')
    })
  })

  describe('getAvailableLocales()', () => {
    it('返回数组，包含 zh-CN 和 en-US', () => {
      const locales = Locale.getAvailableLocales()
      expect(Array.isArray(locales)).toBe(true)
      expect(locales).toContain('zh-CN')
      expect(locales).toContain('en-US')
    })
  })

  describe('isSupportedLocale()', () => {
    it('zh-CN 是支持的语言', () => {
      expect(Locale.isSupportedLocale('zh-CN')).toBe(true)
    })

    it('nonexistent-xyz 不支持', () => {
      expect(Locale.isSupportedLocale('nonexistent-xyz')).toBe(false)
    })
  })
})
