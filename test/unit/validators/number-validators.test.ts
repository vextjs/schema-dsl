/**
 * Number validator tests (v2 TypeScript)
 *
 * Migrated from test/unit/validators/number-validators.test.js
 *
 * Tests for Number type validators:
 * - precision (decimal places)
 * - multiple (multiples, AJV native multipleOf)
 * - port (port number)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, DslBuilder } from '../../../src/index.js'

describe('Number Validators - v1.0.2', () => {

  describe('precision() - decimal places', () => {
    it('should validate decimal places', () => {
      const schema = dsl({ price: dsl('number!').precision(2) })

      expect(validate(schema, { price: 10.99 }).valid).toBe(true)
      expect(validate(schema, { price: 10.9 }).valid).toBe(true)
      expect(validate(schema, { price: 10 }).valid).toBe(true)
    })

    it('should reject decimal places exceeding the limit', () => {
      const schema = dsl({ price: dsl('number!').precision(2) })

      expect(validate(schema, { price: 10.999 }).valid).toBe(false)
      expect(validate(schema, { price: 10.12345 }).valid).toBe(false)
    })

    it('should include precision limit in error message', () => {
      const schema = dsl({ price: dsl('number!').precision(2) })
      const result = validate(schema, { price: 10.999 })

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toHaveProperty('keyword', 'precision')
    })
  })

  describe('multiple() - multiples (AJV native multipleOf)', () => {
    it('should validate multiple relationship', () => {
      const schema = dsl({ count: dsl('number!').multiple(5) })

      expect(validate(schema, { count: 5 }).valid).toBe(true)
      expect(validate(schema, { count: 10 }).valid).toBe(true)
      expect(validate(schema, { count: 15 }).valid).toBe(true)
    })

    it('should reject non-multiples', () => {
      const schema = dsl({ count: dsl('number!').multiple(5) })

      expect(validate(schema, { count: 3 }).valid).toBe(false)
      expect(validate(schema, { count: 7 }).valid).toBe(false)
      expect(validate(schema, { count: 12 }).valid).toBe(false)
    })

    it('should support fractional multiples', () => {
      const schema = dsl({ value: dsl('number!').multiple(0.5) })

      expect(validate(schema, { value: 1.5 }).valid).toBe(true)
      expect(validate(schema, { value: 2.0 }).valid).toBe(true)
      expect(validate(schema, { value: 2.5 }).valid).toBe(true)
      expect(validate(schema, { value: 1.3 }).valid).toBe(false)
    })
  })

  describe('port() - port number', () => {
    it('should accept valid port numbers', () => {
      const schema = dsl({ port: dsl('integer!').port() })

      expect(validate(schema, { port: 1 }).valid).toBe(true)
      expect(validate(schema, { port: 80 }).valid).toBe(true)
      expect(validate(schema, { port: 443 }).valid).toBe(true)
      expect(validate(schema, { port: 8080 }).valid).toBe(true)
      expect(validate(schema, { port: 65535 }).valid).toBe(true)
    })

    it('should reject out-of-range port numbers', () => {
      const schema = dsl({ port: dsl('integer!').port() })

      expect(validate(schema, { port: 0 }).valid).toBe(false)
      expect(validate(schema, { port: -1 }).valid).toBe(false)
      expect(validate(schema, { port: 65536 }).valid).toBe(false)
      expect(validate(schema, { port: 100000 }).valid).toBe(false)
    })

    it('should reject non-integer port numbers', () => {
      const schema = dsl({ port: dsl('number!').port() })

      expect(validate(schema, { port: 80.5 }).valid).toBe(false)
      expect(validate(schema, { port: 443.9 }).valid).toBe(false)
    })

    it('should indicate port validation in error message', () => {
      const schema = dsl({ port: dsl('integer!').port() })
      const result = validate(schema, { port: 70000 })

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toHaveProperty('keyword', 'port')
    })
  })

  describe('method chaining', () => {
    it('should support chaining multiple validators', () => {
      const schema = dsl({
        percentage: dsl('number!').multiple(0.01).precision(2)
      })

      expect(validate(schema, { percentage: 12.34 }).valid).toBe(true)
      expect(validate(schema, { percentage: 12.345 }).valid).toBe(false) // precision exceeded
      expect(validate(schema, { percentage: 12.35 }).valid).toBe(true)
    })
  })
})
