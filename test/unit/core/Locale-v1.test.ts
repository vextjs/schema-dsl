/**
 * Locale 测试 — v2 迁移（v1 Locale.test.js）
 *
 * v2 变更：
 * - getMessage() 恢复 v1 的 { code, message } 对象形态；字符串断言使用 getMessageText()
 * - 默认 locale 是 'zh-CN'（不是 'en-US'）
 * - reset() 重置为 'zh-CN'
 * - addLocale() 存储为 `${locale}:${key}` 格式，不增加 getAvailableLocales() 结果
 * - setMessages() 全局消息优先级低于 addLocale() 的语言包消息
 */

import { describe, it, expect, afterEach } from 'vitest'
import { Locale } from '../../../src/index.js'

describe('Locale', () => {
  afterEach(() => {
    Locale.reset()
  })

  describe('setLocale() / getLocale()', () => {
    it('应该设置和获取当前语言', () => {
      Locale.setLocale('en-US')
      expect(Locale.getLocale()).toBe('en-US')
    })

    it('默认语言应该是 zh-CN（v2 默认）', () => {
      Locale.reset()
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('addLocale()', () => {
    it('应该添加自定义语言包消息', () => {
      Locale.addLocale('zh-CN', {
        'string.min': '{{#label}}太短了',
      })

      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '{{#label}}太短了' })
      expect(Locale.getMessageText('string.min')).toBe('{{#label}}太短了')
    })

    it('应该支持多个语言包', () => {
      Locale.addLocale('zh-CN', { 'string.min': '中文消息' })
      Locale.addLocale('ja-JP', { 'string.min': '日本語メッセージ' })

      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('string.min')).toBe('中文消息')

      Locale.setLocale('ja-JP')
      expect(Locale.getMessageText('string.min')).toBe('日本語メッセージ')
    })
  })

  describe('setMessages()', () => {
    it('应该设置全局自定义消息', () => {
      Locale.setMessages({
        'string.min': '全局消息: {{#label}}',
      })

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '全局消息: {{#label}}' })
      expect(Locale.getMessageText('string.min')).toBe('全局消息: {{#label}}')
    })

    it('应该合并多次设置', () => {
      Locale.setMessages({ 'string.min': '消息1' })
      Locale.setMessages({ 'string.max': '消息2' })

      expect(Locale.getMessageText('string.min')).toBe('消息1')
      expect(Locale.getMessageText('string.max')).toBe('消息2')
    })
  })

  describe('getMessage() 优先级', () => {
    it('优先级1: 调用方传入的自定义消息', () => {
      Locale.setMessages({ 'string.min': '全局消息' })
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' })
      Locale.setLocale('zh-CN')

      const customMessages = { 'string.min': '自定义消息' }
      const result = Locale.getMessage('string.min', customMessages)
      expect(result).toEqual({ code: 'string.min', message: '自定义消息' })
    })

    it('优先级2: addLocale 语言包消息（高于 setMessages）', () => {
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' })
      Locale.setLocale('zh-CN')

      const result = Locale.getMessage('string.min')
      expect(result).toEqual({ code: 'string.min', message: '语言包消息' })
    })

    it('优先级3: 全局自定义消息（setMessages）', () => {
      Locale.setMessages({ 'string.min': '全局消息' })
      // 不添加语言包，用内置 zh-CN
      Locale.setLocale('en-US')  // 切到 en-US，不覆盖 zh-CN 语言包消息

      const result = Locale.getMessage('string.min')
      // setMessages 存为 locale-agnostic key，优先于内置
      expect(result).toEqual({ code: 'string.min', message: '全局消息' })
    })

    it('优先级4: 内置语言包消息（zh-CN）', () => {
      Locale.setLocale('zh-CN')
      const result = Locale.getMessage('min')
      expect(result).toEqual(expect.objectContaining({ code: 'min' }))
      expect(Locale.getMessageText('min')).toContain('长度不能少于')
    })

    it('优先级4: 内置语言包消息（en-US）', () => {
      Locale.setLocale('en-US')
      const result = Locale.getMessage('min')
      expect(result).toEqual(expect.objectContaining({ code: 'min' }))
      expect(Locale.getMessageText('min')).toContain('length must be at least')
    })

    it('未知错误码应该返回原字符串（v2 行为）', () => {
      const result = Locale.getMessage('unknown.error.xyz')
      expect(typeof result).toBe('string')
      expect(result).toBe('unknown.error.xyz')
    })
  })

  describe('getAvailableLocales()', () => {
    it('应该返回内置支持的语言', () => {
      const locales = Locale.getAvailableLocales()
      expect(locales).toContain('zh-CN')
      expect(locales).toContain('en-US')
    })
  })

  describe('reset()', () => {
    it('应该重置到初始状态', () => {
      Locale.setLocale('en-US')
      Locale.addLocale('custom-test', { test: 'value' })
      Locale.setMessages({ test: 'global' })

      Locale.reset()

      // v2 reset: 回到 zh-CN
      expect(Locale.getLocale()).toBe('zh-CN')
      // customMessages 清空
      expect(Locale.getMessage('test')).toBe('test')
    })
  })
})
