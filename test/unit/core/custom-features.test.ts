/**
 * Custom Features & Error Messages Tests — v2 Migration
 *
 * v2 changes: root entry enables string extensions for compatibility
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { dsl, Validator, Locale, installStringExtensions } from '../../../src/index.js'

// Explicit install remains idempotent for callers that keep the v2 setup style.
installStringExtensions(dsl as any)

describe('Custom Features & Error Messages', () => {
  let validator: InstanceType<typeof Validator>

  beforeEach(() => {
    validator = new Validator()
    Locale.setLocale('en-US')
  })

  describe('Custom Validators (.custom)', () => {
    it('should support synchronous validation returning string error', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return 'Cannot be admin'
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Cannot be admin')
    })

    it('should support synchronous validation returning boolean false', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return false
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Validation failed')
    })

    it('should support synchronous validation returning error object', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return { error: 'forbidden', message: 'Access denied' }
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Access denied')
    })

    it('should pass when returning nothing or true', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'user') return
          return true
        }),
      })

      const result = validator.validate(schema, { username: 'user' })
      expect(result.valid).toBe(true)
    })

    it('should throw error for async validator in sync validate', () => {
      const schema = dsl({
        username: ('string!' as any).custom(async (_value: string) => {
          return true
        }),
      })

      const result = validator.validate(schema, { username: 'user' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toContain('Async validation not supported')
    })

    it('should run async validators in validateAsync', async () => {
      const schema = dsl({
        username: ('string!' as any).custom(async (value: string) => {
          return value === 'alice' || 'Username is already taken'
        }),
      })

      await expect(validator.validateAsync(schema, { username: 'alice' })).resolves.toEqual({ username: 'alice' })
      await expect(validator.validateAsync(schema, { username: 'admin' })).rejects.toMatchObject({
        errors: [
          expect.objectContaining({
            path: 'username',
            message: 'Username is already taken',
          }),
        ],
      })
    })

    it('should surface async custom validator exceptions in validateAsync', async () => {
      const schema = dsl({
        username: ('string!' as any).custom(async () => {
          throw new Error('External lookup failed')
        }),
      })

      await expect(validator.validateAsync(schema, { username: 'alice' })).rejects.toMatchObject({
        errors: [
          expect.objectContaining({
            path: 'username',
            message: 'External lookup failed',
          }),
        ],
      })
    })
  })

  describe('Custom Labels & Messages', () => {
    it('should use custom label in required error', () => {
      const schemaWithMsg = dsl({
        username: ('string!' as any)
          .label('Username')
          .messages({ required: '{{#label}} is required' }),
      })

      const result = validator.validate(schemaWithMsg, {})
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Username is required')
    })

    it('should use custom label in min length error', () => {
      const schema = dsl({
        username: ('string:5-!' as any)
          .label('Username')
          .messages({ min: '{{#label}} length must be at least {{#limit}} characters' }),
      })

      const result = validator.validate(schema, { username: 'abc' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Username length must be at least 5 characters')
    })

    it('should support {{#key}} interpolation', () => {
      const schema = dsl({
        age: ('number:18-!' as any)
          .label('Age')
          .messages({ min: '{{#label}} must be greater than {{#limit}}' }),
      })

      const result = validator.validate(schema, { age: 10 })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Age must be greater than 18')
    })
  })

  describe('Dynamic Locale', () => {
    beforeAll(() => {
      Locale.addLocale('zh-CN', {
        required: '{{#label}} is required',
        min: '{{#label}} is too short',
      })
    })

    it('should support locale option in validate', () => {
      const schema = dsl({
        username: ('string:5-!' as any).label('Username'),
      })

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'zh-CN' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Username is too short')
    })

    it('should fallback to default locale', () => {
      const schema = dsl({
        username: ('string:5-!' as any).label('Username'),
      })

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'en-US' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toContain('length must be at least 5')
    })
  })
})
