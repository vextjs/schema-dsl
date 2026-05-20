/**
 * ErrorCodes Unit Tests — v2 Migration
 *
 * v2 Changes:
 * - ErrorCodes module is not exported externally (uses KEYWORD_MAP internally)
 * - Validates error code functionality indirectly through validation behavior
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, Validator } from '../../../src/index.js'

describe('ErrorCodes', () => {
  describe('Error Code Validation (via validation behavior)', () => {
    it('should produce required error', () => {
      const schema = dsl({ username: 'string!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
      const err = result.errors![0]
      expect(err).toHaveProperty('path')
      expect(err).toHaveProperty('message')
    })

    it('should produce minLength error', () => {
      const schema = dsl({ username: 'string:5-!' })
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('Validator Error Structure', () => {
    it('error object should contain path and message', () => {
      const validator = new Validator()
      const schema = dsl({ age: 'number!' })
      const result = validator.validate(schema, {})
      expect(result.valid).toBe(false)
      const err = result.errors![0]
      expect(typeof err.path).toBe('string')
      expect(typeof err.message).toBe('string')
    })
  })
})
