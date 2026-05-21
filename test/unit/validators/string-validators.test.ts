/**
 * String validator tests (v2 TypeScript)
 *
 * Migrated from test/unit/validators/string-validators.test.js
 *
 * Tests for String type validators:
 * - min (minimum length)
 * - max (maximum length)
 * - length (exact length, v2 uses exactLength keyword)
 * - alphanum (letters and numbers)
 * - trim (no leading/trailing whitespace)
 * - lowercase (lowercase)
 * - uppercase (uppercase)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, DslBuilder } from '../../../src/index.js'

describe('String Validators - v1.0.2', () => {

  describe('min() - minimum length (AJV native)', () => {
    it('should validate minimum length', () => {
      const schema = dsl({ name: dsl('string!').min(3) })

      expect(validate(schema, { name: 'ab' }).valid).toBe(false)
      expect(validate(schema, { name: 'abc' }).valid).toBe(true)
      expect(validate(schema, { name: 'abcd' }).valid).toBe(true)
    })
  })

  describe('max() - maximum length (AJV native)', () => {
    it('should validate maximum length', () => {
      const schema = dsl({ name: dsl('string!').max(10) })

      expect(validate(schema, { name: '12345678901' }).valid).toBe(false)
      expect(validate(schema, { name: '1234567890' }).valid).toBe(true)
      expect(validate(schema, { name: '123' }).valid).toBe(true)
    })
  })

  describe('length() - exact length', () => {
    it('should validate exact length', () => {
      const schema = dsl({ phone: dsl('string!').length(11) })

      expect(validate(schema, { phone: '1234567890' }).valid).toBe(false)
      expect(validate(schema, { phone: '12345678901' }).valid).toBe(true)
      expect(validate(schema, { phone: '123456789012' }).valid).toBe(false)
    })

    it('should include length limit in error message', () => {
      const schema = dsl({ code: dsl('string!').length(6) })
      const result = validate(schema, { code: '12345' })

      expect(result.valid).toBe(false)
      expect(result.errors![0]).toHaveProperty('keyword', 'exactLength')
    })
  })

  describe('alphanum() - alphanumeric characters', () => {
    it('should only accept letters and numbers', () => {
      const schema = dsl({ code: dsl('string!').alphanum() })

      expect(validate(schema, { code: 'abc123' }).valid).toBe(true)
      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'abc' }).valid).toBe(true)
      expect(validate(schema, { code: '123' }).valid).toBe(true)
    })

    it('should reject special characters', () => {
      const schema = dsl({ code: dsl('string!').alphanum() })

      expect(validate(schema, { code: 'abc-123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc_123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc 123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc@123' }).valid).toBe(false)
    })

    it('should accept empty string', () => {
      const schema = dsl({ code: dsl('string').alphanum() })
      expect(validate(schema, { code: '' }).valid).toBe(true)
    })
  })

  describe('trim() - no leading/trailing whitespace', () => {
    it('should reject strings with leading spaces', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: ' hello' }).valid).toBe(false)
    })

    it('should reject strings with trailing spaces', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: 'hello ' }).valid).toBe(false)
    })

    it('should reject strings with leading and trailing spaces', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: ' hello ' }).valid).toBe(false)
    })

    it('should accept trimmed strings', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: 'hello' }).valid).toBe(true)
      expect(validate(schema, { name: 'hello world' }).valid).toBe(true) // internal spaces are allowed
    })
  })

  describe('lowercase() - lowercase', () => {
    it('should only accept lowercase strings', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: 'hello' }).valid).toBe(true)
      expect(validate(schema, { code: 'hello123' }).valid).toBe(true)
    })

    it('should reject strings containing uppercase letters', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: 'Hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'HELLO' }).valid).toBe(false)
      expect(validate(schema, { code: 'HeLLo' }).valid).toBe(false)
    })

    it('should accept strings without letters', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: '123' }).valid).toBe(true)
      expect(validate(schema, { code: '!@#' }).valid).toBe(true)
    })
  })

  describe('uppercase() - uppercase', () => {
    it('should only accept uppercase strings', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: 'HELLO' }).valid).toBe(true)
      expect(validate(schema, { code: 'HELLO123' }).valid).toBe(true)
    })

    it('should reject strings containing lowercase letters', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: 'Hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'HeLLo' }).valid).toBe(false)
    })

    it('should accept strings without letters', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: '123' }).valid).toBe(true)
      expect(validate(schema, { code: '!@#' }).valid).toBe(true)
    })
  })

  describe('method chaining', () => {
    it('should support chaining multiple validators', () => {
      const schema = dsl({
        code: dsl('string!').length(6).alphanum().uppercase()
      })

      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'abc123' }).valid).toBe(false) // not uppercase
      expect(validate(schema, { code: 'ABC12' }).valid).toBe(false)  // wrong length
      expect(validate(schema, { code: 'ABC-12' }).valid).toBe(false) // contains special characters
    })
  })
})
