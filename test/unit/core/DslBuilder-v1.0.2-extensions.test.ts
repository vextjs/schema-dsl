/**
 * DslBuilder v1.0.2 Extensions Tests — v2 Migration
 *
 * v2 Changes:
 * - alphanum/lower/upper/json/port are no longer DSL string types ('alphanum:3-20!')
 * - Changed to DslBuilder chained methods .alphanum()/.lowercase()/.uppercase()/.json()
 * - exactLength replaces maxLength for single-value constraints (DA-03)
 * - tests explicitly enable String extensions for compatibility coverage
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, validate, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder - v1.0.2 Extension Validators', () => {
  describe('Chained methods replacing DSL type strings', () => {
    it('should support .alphanum() chained method', () => {
      const schema = dsl({ username: (dsl('string:3-20!') as any).alphanum() })
      const p = (schema as any).properties.username
      expect(p.type).toBe('string')
      expect(p.alphanum).toBe(true)
      expect(p.minLength).toBe(3)
      expect(p.maxLength).toBe(20)
    })

    it('should support .lowercase() chained method', () => {
      const schema = dsl({ email: (dsl('string!') as any).lowercase() })
      expect((schema as any).properties.email.type).toBe('string')
      expect((schema as any).properties.email.lowercase).toBe(true)
    })

    it('should support .uppercase() chained method', () => {
      const schema = dsl({ country: (dsl('string!') as any).uppercase().length(2) })
      const p = (schema as any).properties.country
      expect(p.type).toBe('string')
      expect(p.uppercase).toBe(true)
    })

    it('should support .json() chained method', () => {
      const schema = dsl({ config: (dsl('string!') as any).json() })
      expect((schema as any).properties.config.type).toBe('string')
      expect((schema as any).properties.config.jsonString).toBe(true)
    })

    it('should support .port() chained method', () => {
      const schema = dsl({ port: (dsl('integer!') as any).port() })
      expect((schema as any).properties.port.type).toBe('integer')
      expect((schema as any).properties.port.port).toBe(true)
    })
  })

  describe('Chained Calls', () => {
    it('should support .dateGreater() chained call', () => {
      const schema = dsl({ endDate: ('string!' as any).dateGreater('2025-01-01') })
      expect((schema as any).properties.endDate.dateGreater).toBe('2025-01-01')
    })

    it('should support .dateLess() chained call', () => {
      const schema = dsl({ startDate: ('string!' as any).dateLess('2025-12-31') })
      expect((schema as any).properties.startDate.dateLess).toBe('2025-12-31')
    })

    it('should support .label() + .alphanum() combination', () => {
      const schema = dsl({
        username: (dsl('string:3-20!') as any).alphanum().label('Username'),
      })
      const p = (schema as any).properties.username
      expect(p.alphanum).toBe(true)
      expect(p.minLength).toBe(3)
      expect(p.maxLength).toBe(20)
    })
  })

  describe('Validation', () => {
    it('alphanum should validate letters and digits', () => {
      const schema = dsl({ username: (dsl('string!') as any).alphanum() })
      expect(validate(schema, { username: 'user123' }).valid).toBe(true)
      expect(validate(schema, { username: 'user_123' }).valid).toBe(false)
    })

    it('lowercase should validate lowercase', () => {
      const schema = dsl({ email: (dsl('string!') as any).lowercase() })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'Test@example.com' }).valid).toBe(false)
    })

    it('uppercase should validate uppercase', () => {
      const schema = dsl({ country: (dsl('string:2!') as any).uppercase() })
      expect(validate(schema, { country: 'CN' }).valid).toBe(true)
      expect(validate(schema, { country: 'cn' }).valid).toBe(false)
    })

    it('port should validate port numbers', () => {
      const schema = dsl({ port: (dsl('integer!') as any).port() })
      expect(validate(schema, { port: 3000 }).valid).toBe(true)
      expect(validate(schema, { port: 0 }).valid).toBe(false)
      expect(validate(schema, { port: 65536 }).valid).toBe(false)
    })
  })

  describe('Combined Usage', () => {
    it('should support .alphanum() + single-value length', () => {
      const schema = dsl({ code: (dsl('string:6!') as any).alphanum() })
      expect((schema as any).properties.code.alphanum).toBe(true)
      expect((schema as any).properties.code.exactLength).toBe(6)

      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'ABC1234' }).valid).toBe(false) // exceeds exactLength:6
    })

    it('should support .alphanum() + .label()', () => {
      const schema = dsl({
        username: (dsl('string:3-20!') as any).alphanum().label('Username'),
      })
      expect(validate(schema, { username: 'user123' }).valid).toBe(true)
      expect(validate(schema, { username: 'user_123' }).valid).toBe(false)
    })
  })
})
