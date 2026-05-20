/**
 * Validator Unit Tests
 * Tests AJV integration, error collection, custom keywords
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Validator } from '../../../src/core/Validator.js'
import type { ValidationResult } from '../../../src/types/validate.js'

describe('Validator', () => {
  let validator: Validator

  beforeEach(() => {
    validator = new Validator()
  })

  describe('Constructor', () => {
    it('creates an instance', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('accepts custom AJV options', () => {
      const v = new Validator({ strict: false })
      expect(v).toBeInstanceOf(Validator)
    })
  })

  describe('validate() — valid data', () => {
    it('simple object passes', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { name: 'Alice' })
      expect(result.valid).toBe(true)
      // v1 compat: errors is empty array on success
      expect(result.errors ?? []).toHaveLength(0)
    })

    it('nested object passes', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          user: {
            type: 'object' as const,
            properties: { age: { type: 'number' as const } },
          },
        },
      }
      const result = validator.validate(schema, { user: { age: 25 } })
      expect(result.valid).toBe(true)
    })
  })

  describe('validate() — invalid data', () => {
    it('missing required field triggers error', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { age: 1 })
      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('type error triggers error', () => {
      const schema = { type: 'number' as const }
      const result = validator.validate(schema, 'notanumber')
      expect(result.valid).toBe(false)
    })

    it('minLength constraint triggers error', () => {
      const schema = { type: 'string' as const, minLength: 5 }
      const result = validator.validate(schema, 'ab')
      expect(result.valid).toBe(false)
    })

    it('maximum constraint triggers error', () => {
      const schema = { type: 'number' as const, maximum: 10 }
      const result = validator.validate(schema, 99)
      expect(result.valid).toBe(false)
    })

    it('format:email triggers error', () => {
      const schema = { type: 'string' as const, format: 'email' }
      const result = validator.validate(schema, 'not-an-email')
      expect(result.valid).toBe(false)
    })
  })

  describe('validate() — error format', () => {
    it('errors contain message and path', () => {
      const schema = {
        type: 'object' as const,
        properties: { age: { type: 'number' as const } },
        required: ['age'],
      }
      const result = validator.validate(schema, {})
      expect(result.errors?.[0]).toHaveProperty('message')
      expect(result.errors?.[0]).toHaveProperty('path')
    })
  })

  describe('validate() — schema allErrors', () => {
    it('collects all errors (not just the first)', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          age: { type: 'number' as const },
        },
        required: ['name', 'age'],
      }
      const result = validator.validate(schema, {})
      expect(result.errors?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('validateAsync()', () => {
    it('async validate valid data — returns data directly', async () => {
      const schema = { type: 'string' as const, minLength: 1 }
      const result = await validator.validateAsync(schema, 'hello')
      // validateAsync returns raw data on success, not a ValidationResult object
      expect(result).toBe('hello')
    })

    it('async validate invalid data — throws ValidationError', async () => {
      const schema = { type: 'string' as const, minLength: 10 }
      await expect(validator.validateAsync(schema, 'hi')).rejects.toThrow()
    })
  })
})
