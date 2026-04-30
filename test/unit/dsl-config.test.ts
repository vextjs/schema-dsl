/**
 * dsl.config() 和多语言配置测试 — v2 迁移（v1 dsl-config.test.js）
 *
 * v2 变更：
 * - Locale.getMessage() 保持 v1 的 { code, message } 形态；字符串断言使用 Locale.getMessageText()
 * - getDefaultValidator() 不导出，改为 new Validator()
 * - validate(schema, data, {locale}) 不自动应用 Locale 消息（跳过相关测试）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { dsl, Locale, validate } from '../../src/index.js'

describe('dsl.config() - i18n 和 cache 配置', () => {
  beforeEach(() => {
    Locale.reset()
  })

  describe('i18n 配置', () => {
    it('应该支持从对象直接加载语言包', () => {
      dsl.config({
        i18n: {
          'zh-CN': {
            username: '用户名',
            email: '邮箱地址',
          },
          'en-US': {
            username: 'Username',
            email: 'Email Address',
          },
        },
      })

      // 字符串断言使用 getMessageText()
      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('username')).toBe('用户名')
      expect(Locale.getMessageText('email')).toBe('邮箱地址')

      Locale.setLocale('en-US')
      expect(Locale.getMessageText('username')).toBe('Username')
      expect(Locale.getMessageText('email')).toBe('Email Address')
    })

    it('应该兼容 locales 包装层写法', () => {
      dsl.config({
        i18n: {
          locales: {
            'zh-CN': {
              username: '用户名'
            },
            'en-US': {
              username: 'Username'
            }
          }
        }
      })

      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('username')).toBe('用户名')

      Locale.setLocale('en-US')
      expect(Locale.getMessageText('username')).toBe('Username')
    })

    it('应该处理语言包路径不存在的情况（不应抛出错误）', () => {
      expect(() => {
        dsl.config({
          i18n: {
            localesPath: './non-existent-path',
          } as any,
        })
      }).not.toThrow()
    })
  })

  describe('cache 配置', () => {
    it('应该支持自定义缓存大小', () => {
      expect(() => {
        dsl.config({
          cache: {
            maxSize: 10000,
          },
        })
      }).not.toThrow()
    })

    it('应该支持禁用缓存', () => {
      expect(() => {
        dsl.config({
          cache: {
            enabled: false,
          } as any,
        })
      }).not.toThrow()
    })
  })

  describe('基础验证（不依赖 locale 消息注入）', () => {
    it('应该正常验证（config 后验证仍可用）', () => {
      dsl.config({
        i18n: {
          'zh-CN': { username: '用户名' },
        },
      })

      const schema = dsl({ username: 'string:3-32!', email: 'email!' })
      Locale.setLocale('zh-CN')

      const result = validate(schema, { username: 'ab', email: 'invalid' })
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(2)
    })
  })
})
