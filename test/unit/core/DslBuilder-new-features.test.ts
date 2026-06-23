/**
 * DslBuilder New Features Tests — v2 Migration
 *
 * v2 changes:
 * - Pattern DSL types such as `phone:cn`, `idCard:cn`, and `creditCard:visa` are supported
 * - Chain helpers such as .phone('cn') remain available for builder-style authoring
 * - patterns internal module is not exported; skip direct config tests
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, validate, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder New Features', () => {
  describe('Phone Validation (chain method)', () => {
    it('should validate cn phone via pattern DSL type', () => {
      const schema = dsl('phone:cn!')
      expect(validate(schema, '13800138000').valid).toBe(true)
      expect(validate(schema, '123').valid).toBe(false)
    })

    it('should validate cn phone via .phone() chain', () => {
      const schema = dsl({ phone: (dsl('string!') as any).phone('cn') })
      const valid = validate(schema, { phone: '13800138000' })
      const invalid = validate(schema, { phone: '123' })

      expect(valid.valid).toBe(true)
      expect(invalid.valid).toBe(false)
    })
  })

  describe('ID Card & Credit Card', () => {
    it('should validate idCard via string schema', () => {
      const schema = dsl('idCard:cn!')
      const valid = validate(schema, '110101199003071234')

      expect(valid.valid).toBe(true)
      expect(validate(schema, '123').valid).toBe(false)
    })

    it('should validate creditCard:visa', () => {
      const schema = dsl('creditCard:visa!')
      const valid = validate(schema, '4000123456789012')

      expect(valid.valid).toBe(true)
      expect(validate(schema, '5100123456789012').valid).toBe(false)
    })
  })

  describe('Additional Code Types', () => {
    it('should validate licensePlate:cn', () => {
      const schema = dsl('licensePlate:cn!')
      expect(validate(schema, '\u4eacA88888').valid).toBe(true)
      expect(validate(schema, 'ABC').valid).toBe(false)
    })

    it('should validate postalCode:cn', () => {
      const schema = dsl('postalCode:cn!')
      expect(validate(schema, '100000').valid).toBe(true)
      expect(validate(schema, '123').valid).toBe(false)
    })

    it('should validate passport:cn', () => {
      const schema = dsl('passport:cn!')
      expect(validate(schema, 'E12345678').valid).toBe(true)
      expect(validate(schema, '123').valid).toBe(false)
    })
  })

  describe('New Types', () => {
    it('should validate objectId', () => {
      const schema = dsl('objectId!')
      expect(validate(schema, '507f1f77bcf86cd799439011').valid).toBe(true)
      expect(validate(schema, 'invalid-id').valid).toBe(false)
    })

    it('should validate hexColor', () => {
      const schema = dsl('hexColor!')
      expect(validate(schema, '#fff').valid).toBe(true)
      expect(validate(schema, '#FFFFFF').valid).toBe(true)
      expect(validate(schema, 'red').valid).toBe(false)
    })

    it('should validate macAddress', () => {
      const schema = dsl('macAddress!')
      expect(validate(schema, '00:0a:95:9d:68:16').valid).toBe(true)
      expect(validate(schema, '00-0a-95-9d-68-16').valid).toBe(true)
      expect(validate(schema, 'invalid-mac').valid).toBe(false)
    })

    it('should validate cron', () => {
      const schema = dsl('cron!')
      expect(validate(schema, '* * * * *').valid).toBe(true)
      expect(validate(schema, '*/5 * * * *').valid).toBe(true)
    })
  })
})
