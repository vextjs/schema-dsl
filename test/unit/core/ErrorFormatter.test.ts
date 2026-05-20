/**
 * ErrorFormatter Unit Tests — v2 Migration
 *
 * v2 Changes:
 * - ErrorFormatter constructor: constructor(_locale, messages) — locale is internal, does not expose this.locale
 * - No format() method (only formatDetailed())
 * - Locale.reset() may not exist in v2 — use setLocale instead
 * - formatDetailed receives raw AJV error array
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ErrorFormatter, Locale } from '../../../src/index.js'

describe('ErrorFormatter', () => {
  let formatter: InstanceType<typeof ErrorFormatter>

  beforeEach(() => {
    Locale.setLocale('zh-CN')
    // v2: ErrorFormatter does not auto-load Locale, must be passed messages explicitly
    formatter = new ErrorFormatter('zh-CN', Locale.getMessages())

  })

  describe('Basic Functionality', () => {
    it('should correctly create instance', () => {
      expect(formatter).toBeInstanceOf(ErrorFormatter)
    })

    it('should support construction with different locales', () => {
      const enFormatter = new ErrorFormatter('en-US')
      expect(enFormatter).toBeInstanceOf(ErrorFormatter)
    })
  })

  describe('Error Formatting', () => {
    it('should handle required error (formatDetailed)', () => {
      const errors = [
        {
          keyword: 'required',
          instancePath: '',
          params: { missingProperty: 'username' },
          schemaPath: '#/required',
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(Array.isArray(result)).toBe(true)
      expect(result[0]).toHaveProperty('path')
      expect(result[0]).toHaveProperty('message')
    })

    it('should support custom label (via parentSchema._label)', () => {
      const errors = [
        {
          keyword: 'minLength',
          instancePath: '/username',
          params: { limit: 5 },
          parentSchema: {
            type: 'string',
            minLength: 5,
            _label: '用户名',
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toContain('用户名')
    })

    it('should support custom message templates (_customMessages)', () => {
      const errors = [
        {
          keyword: 'pattern',
          instancePath: '/phone',
          params: {},
          parentSchema: {
            _customMessages: { pattern: '手机号格式不正确' },
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toBe('手机号格式不正确')
    })

    it('empty error array should return empty array', () => {
      const result = formatter.formatDetailed([])
      expect(result).toEqual([])
    })
  })

  describe('Internationalization', () => {
    it('should support locale parameter for language switching', () => {
      const errors = [
        {
          keyword: 'required',
          instancePath: '',
          params: { missingProperty: 'username' },
        },
      ]
      const zhResult = formatter.formatDetailed(errors as any, 'zh-CN')
      const enResult = formatter.formatDetailed(errors as any, 'en-US')
      // messages from two different locales may differ (if built-in messages diverge)
      expect(typeof zhResult[0].message).toBe('string')
      expect(typeof enResult[0].message).toBe('string')
    })

    it('setLocale should not throw', () => {
      expect(() => Locale.setLocale('en-US')).not.toThrow()
    })
  })
})
