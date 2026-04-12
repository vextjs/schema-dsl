/**
 * i18n 配置功能测试 (v2 TypeScript)
 *
 * v2 API differences:
 * - Locale.locales is private; use Locale.getMessage() or Locale.getAvailableLocales()
 * - Locale.reset() resets to 'zh-CN' (v1 reset to 'en-US')
 * - locale files imported as ES modules from src/locales/
 */

import { describe, it, expect, afterEach } from 'vitest'
import path from 'path'
import { fileURLToPath } from 'url'
import { dsl, validate, Locale } from '../../src/index.js'
import zhCN from '../../src/locales/zh-CN.js'
import enUS from '../../src/locales/en-US.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('i18n 配置功能', () => {

  afterEach(() => {
    Locale.reset()
  })

  describe('配置方式', () => {

    it('应该支持传入对象配置', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'field.username': '用户名',
              'required': '必填项'
            } as any
          }
        })
      }).not.toThrow()
    })

    it('应该支持传入目录路径配置', () => {
      expect(() => {
        dsl.config({
          i18n: path.join(__dirname, 'non-existent-path')
        })
      }).not.toThrow()
    })

    it('应该覆盖默认错误消息', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'required': '自定义必填消息'
            } as any
          }
        })
      }).not.toThrow()
    })

  })

  describe('错误消息键存在性', () => {

    it('应该有 format.binary 错误消息（zh-CN）', () => {
      const msg = (zhCN as any)['format.binary']
      expect(msg).toBeTruthy()
      expect(String(msg)).toContain('Base64')
    })

    it('应该有 format.binary 错误消息（en-US）', () => {
      const msg = (enUS as any)['format.binary']
      expect(msg).toBeTruthy()
      expect(String(msg).toLowerCase()).toContain('base64')
    })

  })

  describe('枚举错误消息', () => {

    it('应该有 enum 错误消息（zh-CN）', () => {
      const msg = (zhCN as any)['enum']
      expect(msg).toBeTruthy()
    })

    it('应该有 string.enum 错误消息（zh-CN）', () => {
      const msg = (zhCN as any)['string.enum']
      expect(msg).toBeTruthy()
    })

  })

  describe('i18n API 完整性', () => {

    it('应该支持 Locale.addLocale 方法', () => {
      Locale.addLocale('test-lang', {
        'test.key': 'test value'
      })

      // v2: Locale.locales is private; verify via getMessage
      const message = Locale.getMessage('test.key', {}, 'test-lang')
      expect(message).toBe('test value')
    })

    it('应该支持 Locale.setLocale 方法', () => {
      Locale.setLocale('zh-CN')
      expect(Locale.getLocale()).toBe('zh-CN')
    })

    it('应该支持 Locale.reset 方法', () => {
      Locale.addLocale('custom', { 'key': 'value' })
      Locale.setLocale('custom')

      Locale.reset()

      // v2 resets to 'zh-CN' (default locale)
      expect(Locale.getLocale()).toBe('zh-CN')
      // custom locale should be cleared
      const available = Locale.getAvailableLocales()
      expect(available).not.toContain('custom')
    })

  })

  describe('配置完整性', () => {

    it('dsl.config 应该支持 i18n 键', () => {
      expect(() => {
        dsl.config({
          i18n: {
            'zh-CN': { 'test': 'value' } as any
          }
        })
      }).not.toThrow()
    })

    it('dsl.config 应该支持字符串路径', () => {
      expect(() => {
        dsl.config({
          i18n: '/non/existent/path'
        })
      }).not.toThrow()
    })

  })

})
