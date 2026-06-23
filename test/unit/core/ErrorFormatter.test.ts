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
      expect(enFormatter.locale).toBe('en-US')
    })

    it('should normalize LocaleMessage objects and preserve custom messages across locale format calls', () => {
      const f = new ErrorFormatter('en-US', {
        'label.email': { message: 'Email Address' } as any,
        required: { message: '{{#label}} required custom' } as any,
        nullable: undefined,
      })

      const message = f.format({
        keyword: 'required',
        instancePath: '',
        params: { missingProperty: 'email' },
        parentSchema: {
          properties: {
            email: { _label: 'label.email' },
          },
        },
      } as any, 'zh-CN')

      expect(message).toBe('Email Address required custom')
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
            _label: 'Username',
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toContain('Username')
    })

    it('should support custom message templates (_customMessages)', () => {
      const errors = [
        {
          keyword: 'pattern',
          instancePath: '/phone',
          params: {},
          parentSchema: {
            _customMessages: { pattern: 'Invalid phone number format' },
          },
        },
      ]
      const result = formatter.formatDetailed(errors as any)
      expect(result[0].message).toBe('Invalid phone number format')
    })

    it('empty error array should return empty array', () => {
      const result = formatter.formatDetailed([])
      expect(result).toEqual([])
    })

    it('filters wrapper errors when concrete errors are present', () => {
      const result = formatter.formatDetailed([
        { keyword: 'if', instancePath: '', params: {}, message: 'if failed' },
        { keyword: 'anyOf', instancePath: '', params: {}, message: 'anyOf failed' },
        { keyword: 'minLength', instancePath: '/name', params: { limit: 3 }, parentSchema: { type: 'string' } },
      ] as any)

      expect(result).toHaveLength(1)
      expect(result[0].keyword).toBe('minLength')
    })

    it('uses detailed fallback interpolation values for primitive, array and null data', () => {
      const f = new ErrorFormatter('en-US', {
        default: '{{#label}} expected {{#expected}} got {{#actual}} value {{#value}} allowed {{#allowed}} key {{#key}}',
      })

      expect(f.formatDetailed([{
        keyword: 'unknownKeyword',
        instancePath: '/items',
        params: { type: 'string', allowedValues: ['a', 'b'], additionalProperty: 'extra' },
        data: ['x'],
        parentSchema: { type: 'array' },
      }] as any)[0].message).toContain('got array')

      expect(f.formatDetailed([{
        keyword: 'unknownKeyword',
        instancePath: '/items',
        params: { type: 'string' },
        data: null,
        parentSchema: { type: 'string' },
      }] as any)[0].message).toContain('got null')
    })

    it('uses already-merged custom messages without rebuilding the message table', () => {
      const result = formatter.formatDetailed([
        {
          keyword: 'format',
          instancePath: '/site',
          params: { format: 'uri' },
          parentSchema: { type: 'string' },
        },
      ] as any, 'zh-CN', { 'format.url': 'custom url message for {{#label}}' }, true)

      expect(result[0].message).toContain('custom url message')
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

    it('setLocale(), addMessage() and addMessages() update subsequent formatting', () => {
      formatter.setLocale('en-US')
      formatter.addMessage('required', '{{#label}} required once')
      expect(formatter.format({
        keyword: 'required',
        instancePath: '',
        params: { missingProperty: 'email' },
      } as any)).toBe('email required once')

      formatter.addMessages({ required: '{{#label}} required twice' })
      expect(formatter.format({
        type: 'required',
        path: 'email',
        params: { missingProperty: 'email' },
      })).toBe('email required twice')
    })
  })
})
