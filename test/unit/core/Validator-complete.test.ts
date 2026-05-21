/**
 * Validator Complete Tests — v2 Migration (v1 Validator-complete.test.js)
 *
 * v2 changes:
 * - string extensions (.username()/.phone()/.password()) require installStringExtensions
 * - array<string:1-20> syntax not supported, use 'array' instead
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { dsl, validate, installStringExtensions, uninstallStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

afterAll(() => {
  uninstallStringExtensions()
})

describe('Validator - Complete Validation Tests', () => {
  describe('Boundary Condition Validation', () => {
    it('should correctly validate string minimum length boundary', () => {
      const schema = dsl({ username: 'string:3-32' })
      expect(validate(schema, { username: 'ab' }).valid).toBe(false)
      expect(validate(schema, { username: 'abc' }).valid).toBe(true)
    })

    it('should correctly validate string maximum length boundary', () => {
      const schema = dsl({ username: 'string:3-32' })
      const str32 = 'a'.repeat(32)
      const str33 = 'a'.repeat(33)
      expect(validate(schema, { username: str32 }).valid).toBe(true)
      expect(validate(schema, { username: str33 }).valid).toBe(false)
    })

    it('should correctly validate number minimum value boundary', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect(validate(schema, { age: 17 }).valid).toBe(false)
      expect(validate(schema, { age: 18 }).valid).toBe(true)
    })

    it('should correctly validate number maximum value boundary', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect(validate(schema, { age: 120 }).valid).toBe(true)
      expect(validate(schema, { age: 121 }).valid).toBe(false)
    })
  })

  describe('Type Validation', () => {
    it('should detect string type errors', () => {
      const schema = dsl({ name: 'string!' })
      expect(validate(schema, { name: 123 }).valid).toBe(false)
      expect(validate(schema, { name: true }).valid).toBe(false)
      expect(validate(schema, { name: [] }).valid).toBe(false)
      expect(validate(schema, { name: {} }).valid).toBe(false)
    })

    it('should detect number type errors', () => {
      const schema = dsl({ age: 'number!' })
      expect(validate(schema, { age: 'abc' }).valid).toBe(false)
      expect(validate(schema, { age: true }).valid).toBe(false)
      expect(validate(schema, { age: [] }).valid).toBe(false)
    })

    it('should detect boolean type errors', () => {
      const schema = dsl({ active: 'boolean!' })
      expect(validate(schema, { active: 'true' }).valid).toBe(true)
      expect(validate(schema, { active: 'true' }, { coerce: false }).valid).toBe(false)
      expect(validate(schema, { active: 1 }).valid).toBe(false)
      expect(validate(schema, { active: [] }).valid).toBe(false)
    })

    it('should validate integer type', () => {
      const schema = dsl({ count: 'integer!' })
      expect(validate(schema, { count: 10 }).valid).toBe(true)
      expect(validate(schema, { count: 10.5 }).valid).toBe(false)
    })
  })

  describe('Format Validation', () => {
    it('should validate email format', () => {
      const schema = dsl({ email: 'email!' })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'invalid-email' }).valid).toBe(false)
    })

    it('should validate url format', () => {
      const schema = dsl({ website: 'url!' })
      expect(validate(schema, { website: 'https://example.com' }).valid).toBe(true)
      expect(validate(schema, { website: 'not-a-url' }).valid).toBe(false)
    })

    it('should validate uuid format', () => {
      const schema = dsl({ id: 'uuid!' })
      expect(validate(schema, { id: '550e8400-e29b-41d4-a716-446655440000' }).valid).toBe(true)
      expect(validate(schema, { id: 'not-uuid' }).valid).toBe(false)
    })
  })

  describe('Nested Object Validation', () => {
    it('should validate nested object structure', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          age: 'number:0-150',
        },
      })
      expect(validate(schema, { user: { name: 'John', age: 25 } }).valid).toBe(true)
      expect(validate(schema, { user: { age: 25 } }).valid).toBe(false)
    })

    it('should validate deep nesting', () => {
      const schema = dsl({
        a: {
          b: {
            c: 'string!',
          },
        },
      })
      expect(validate(schema, { a: { b: { c: 'deep' } } }).valid).toBe(true)
      expect(validate(schema, { a: { b: {} } }).valid).toBe(false)
    })
  })

  describe('Required Field Validation', () => {
    it('should detect missing required fields', () => {
      const schema = dsl({ name: 'string!', email: 'email!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(2)
    })

    it('should pass when optional fields are not provided', () => {
      const schema = dsl({ name: 'string!' })
      expect(validate(schema, { name: 'John' }).valid).toBe(true)
    })
  })

  describe('Enum Value Validation', () => {
    it('should validate enum values', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect(validate(schema, { status: 'active' }).valid).toBe(true)
      expect(validate(schema, { status: 'unknown' }).valid).toBe(false)
    })
  })

  describe('Complex Scenarios', () => {
    it('should validate complex form (v2 does not support array<string> syntax, use array instead)', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120!',
        gender: 'male|female',
        website: 'url',
        bio: 'string:-500',    // string:-500 → maxLength:500
        tags: 'array',
      })

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
        gender: 'male',
        website: 'https://example.com',
        bio: 'Hello world',
        tags: ['javascript', 'nodejs'],
      }

      expect(validate(schema, validData).valid).toBe(true)
    })

    it('should detect multiple errors in complex form', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120!',
      })

      const invalidData = {
        username: 'ab',     // too short
        email: 'invalid',   // invalid format
        age: 150,           // out of range
      }

      const result = validate(schema, invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Default validator validation (requires installStringExtensions)', () => {
    it('should validate username format', () => {
      const schema = dsl({
        username: ('string!' as any).username(),
      })

      expect(validate(schema, { username: 'john_doe' }).valid).toBe(true)
      expect(validate(schema, { username: 'ab' }).valid).toBe(false)
      expect(validate(schema, { username: 'a'.repeat(33) }).valid).toBe(false)
    })

    it('should validate phone format', () => {
      const schema = dsl({
        phone: ('string!' as any).phone('cn'),
      })

      expect(validate(schema, { phone: '13800138000' }).valid).toBe(true)
      expect(validate(schema, { phone: '1380013800' }).valid).toBe(false)
      expect(validate(schema, { phone: '138001380000' }).valid).toBe(false)
    })

    it('should validate password strength', () => {
      const schema = dsl({
        password: ('string!' as any).password('strong'),
      })

      expect(validate(schema, { password: 'Abc123456' }).valid).toBe(true)
      expect(validate(schema, { password: 'abc123' }).valid).toBe(false)
      expect(validate(schema, { password: 'abc' }).valid).toBe(false)
    })
  })

  describe('Special Cases', () => {
    it('should handle empty object', () => {
      const schema = dsl({ name: 'string' })
      expect(validate(schema, {}).valid).toBe(true)
    })

    it('should handle null values (type error)', () => {
      const schema = dsl({ name: 'string' })
      expect(validate(schema, { name: null }).valid).toBe(false)
    })

    it('should handle additional fields (allowed by default)', () => {
      const schema = dsl({ name: 'string!' })
      const result = validate(schema, { name: 'John', extra: 'field' })
      expect(result.valid).toBe(true)
    })
  })
})
