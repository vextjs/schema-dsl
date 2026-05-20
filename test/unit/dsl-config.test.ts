/**
 * dsl.config() and i18n Configuration Tests — v2 migration (v1 dsl-config.test.js)
 *
 * v2 changes:
 * - Locale.getMessage() keeps the v1 { code, message } shape; use Locale.getMessageText() for string assertions
 * - getDefaultValidator() is not exported; use new Validator() instead
 * - validate(schema, data, {locale}) does not auto-apply Locale messages (skip related tests)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { dsl, Locale, validate } from '../../src/index.js'

describe('dsl.config() - i18n and Cache Configuration', () => {
  beforeEach(() => {
    Locale.reset()
  })

  describe('i18n Configuration', () => {
    it('should support loading locale packs directly from an object', () => {
      dsl.config({
        i18n: {
          'zh-CN': {
            username: 'Username',
            email: 'Email Address',
          },
          'en-US': {
            username: 'Username',
            email: 'Email Address',
          },
        },
      })

      // use getMessageText() for string assertions
      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('username')).toBe('Username')
      expect(Locale.getMessageText('email')).toBe('Email Address')

      Locale.setLocale('en-US')
      expect(Locale.getMessageText('username')).toBe('Username')
      expect(Locale.getMessageText('email')).toBe('Email Address')
    })

    it('should be compatible with the locales wrapper syntax', () => {
      dsl.config({
        i18n: {
          locales: {
            'zh-CN': {
              username: 'Username'
            },
            'en-US': {
              username: 'Username'
            }
          }
        }
      })

      Locale.setLocale('zh-CN')
      expect(Locale.getMessageText('username')).toBe('Username')

      Locale.setLocale('en-US')
      expect(Locale.getMessageText('username')).toBe('Username')
    })

    it('should handle non-existent locale path without throwing', () => {
      expect(() => {
        dsl.config({
          i18n: {
            localesPath: './non-existent-path',
          } as any,
        })
      }).not.toThrow()
    })
  })

  describe('Cache Configuration', () => {
    it('should support custom cache size', () => {
      expect(() => {
        dsl.config({
          cache: {
            maxSize: 10000,
          },
        })
      }).not.toThrow()
    })

    it('should support disabling cache', () => {
      expect(() => {
        dsl.config({
          cache: {
            enabled: false,
          } as any,
        })
      }).not.toThrow()
    })
  })

  describe('Basic Validation (independent of locale message injection)', () => {
    it('should validate correctly (validation still works after config)', () => {
      dsl.config({
        i18n: {
          'zh-CN': { username: 'Username' },
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
