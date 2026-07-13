/**
 * Complete Type System Tests — v2 Migration (v1 types-complete.test.js)
 *
 * Tests parsing and validation of all 18+ types (100% compatible with v1)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../../src/index.js'

describe('Complete Type System Tests', () => {
  // ========== Basic Types (8 kinds) ==========
  describe('Basic Types', () => {
    it('should support string type', () => {
      const schema = dsl({ field: 'string' })
      expect((schema as any).properties.field.type).toBe('string')
      expect(validate(schema, { field: 'hello' }).valid).toBe(true)
      expect(validate(schema, { field: 123 }).valid).toBe(false)
    })

    it('should support number type', () => {
      const schema = dsl({ field: 'number' })
      expect((schema as any).properties.field.type).toBe('number')
      expect(validate(schema, { field: 3.14 }).valid).toBe(true)
      expect(validate(schema, { field: 'abc' }).valid).toBe(false)
    })

    it('should support integer type', () => {
      const schema = dsl({ field: 'integer' })
      expect((schema as any).properties.field.type).toBe('integer')
      expect(validate(schema, { field: 42 }).valid).toBe(true)
      expect(validate(schema, { field: 3.14 }).valid).toBe(false)
    })

    it('should support boolean type', () => {
      const schema = dsl({ field: 'boolean' })
      expect((schema as any).properties.field.type).toBe('boolean')
      expect(validate(schema, { field: true }).valid).toBe(true)
      expect(validate(schema, { field: 'true' }).valid).toBe(true)
      expect(validate(schema, { field: 'true' }, { coerce: false }).valid).toBe(false)
    })

    it('should support object type', () => {
      const schema = dsl({ field: 'object' })
      expect((schema as any).properties.field.type).toBe('object')
      expect(validate(schema, { field: { a: 1 } }).valid).toBe(true)
      expect(validate(schema, { field: 'not object' }).valid).toBe(false)
    })

    it('should support array type', () => {
      const schema = dsl({ field: 'array' })
      expect((schema as any).properties.field.type).toBe('array')
      expect(validate(schema, { field: [1, 2, 3] }).valid).toBe(true)
      expect(validate(schema, { field: 'not array' }).valid).toBe(false)
    })

    it('should support null type', () => {
      const schema = dsl({ field: 'null' })
      expect((schema as any).properties.field.type).toBe('null')
      expect(validate(schema, { field: null }).valid).toBe(true)
      expect(validate(schema, { field: 'not null' }).valid).toBe(false)
    })

    it('should support any type', () => {
      const schema = dsl({ field: 'any' })
      expect((schema as any).properties.field.type).toBeUndefined()
      expect(validate(schema, { field: 'string' }).valid).toBe(true)
      expect(validate(schema, { field: 123 }).valid).toBe(true)
      expect(validate(schema, { field: null }).valid).toBe(true)
      expect(validate(schema, { field: { a: 1 } }).valid).toBe(true)
    })
  })

  // ========== Format Types (9 kinds) ==========
  describe('Format Types', () => {
    it('should support email type', () => {
      const schema = dsl({ field: 'email' })
      expect((schema as any).properties.field.type).toBe('string')
      expect((schema as any).properties.field.format).toBe('email')
      expect(validate(schema, { field: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-email' }).valid).toBe(false)
    })

    it('should support url type', () => {
      const schema = dsl({ field: 'url' })
      expect((schema as any).properties.field.format).toBe('uri')
      expect(validate(schema, { field: 'https://example.com' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-url' }).valid).toBe(false)
    })

    it('should support date type', () => {
      const schema = dsl({ field: 'date' })
      expect(validate(schema, { field: '2025-01-01' }).valid).toBe(true)
    })

    it('should support datetime type', () => {
      const schema = dsl({ field: 'datetime' })
      expect(validate(schema, { field: '2025-01-01T10:00:00Z' }).valid).toBe(true)
    })

    it('should support uuid type', () => {
      const schema = dsl({ field: 'uuid' })
      expect(validate(schema, { field: '550e8400-e29b-41d4-a716-446655440000' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-uuid' }).valid).toBe(false)
    })

    it('should support ip type (any IPv4 or IPv6 is valid)', () => {
      // v2 TypeRegistry only has ipv4 / ipv6, no generic ip type
      const schema = dsl({ field: 'ip' })
      expect(validate(schema, { field: '192.168.1.1' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-ip' }).valid).toBe(false)
    })

    it('should support ipv4 type', () => {
      const schema = dsl({ field: 'ipv4' })
      expect(validate(schema, { field: '192.168.1.1' }).valid).toBe(true)
    })

    it('should support ipv6 type', () => {
      const schema = dsl({ field: 'ipv6' })
      expect(validate(schema, { field: '::1' }).valid).toBe(true)
    })

    it('should support hostname type', () => {
      const schema = dsl({ field: 'hostname' })
      expect(validate(schema, { field: 'example.com' }).valid).toBe(true)
    })
  })

  // ========== Enum Types ==========
  describe('Enum Types', () => {
    it('should support string enum (pipe syntax)', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive', 'pending'])
      expect(validate(schema, { status: 'active' }).valid).toBe(true)
      expect(validate(schema, { status: 'invalid' }).valid).toBe(false)
    })

    it('should support required enum', () => {
      const schema = dsl({ status: 'active|inactive!' })
      expect((schema as any).required).toContain('status')
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive'])
    })
  })

  // ========== Constraint Syntax ==========
  describe('Constraint Syntax', () => {
    it('string:N-M should set minLength and maxLength', () => {
      const schema = dsl({ name: 'string:3-32' })
      expect((schema as any).properties.name.minLength).toBe(3)
      expect((schema as any).properties.name.maxLength).toBe(32)
    })

    it('string:N should set exactLength (exact length)', () => {
      const schema = dsl({ code: 'string:6' })
      expect((schema as any).properties.code.exactLength).toBe(6)
    })

    it('string:N- should only set minLength', () => {
      const schema = dsl({ name: 'string:3-' })
      expect((schema as any).properties.name.minLength).toBe(3)
      expect((schema as any).properties.name.maxLength).toBeUndefined()
    })

    it('string:-M should only set maxLength', () => {
      const schema = dsl({ name: 'string:-100' })
      expect((schema as any).properties.name.maxLength).toBe(100)
    })

    it('number:N-M should set minimum and maximum', () => {
      const schema = dsl({ age: 'number:0-150' })
      expect((schema as any).properties.age.minimum).toBe(0)
      expect((schema as any).properties.age.maximum).toBe(150)
    })

    it('! marker should set required', () => {
      const schema = dsl({ name: 'string!' })
      expect((schema as any).required).toContain('name')
    })
  })

  // ========== v2 New Types ==========
  describe('v2 New Types', () => {
    it('should support objectId type', () => {
      const schema = dsl({ id: 'objectId' })
      expect((schema as any).properties.id).toBeDefined()
    })

    it('should support hexColor type', () => {
      const schema = dsl({ color: 'hexColor' })
      expect((schema as any).properties.color).toBeDefined()
      expect(validate(schema, { color: '#ff0000' }).valid).toBe(true)
    })

    it('should support macAddress type', () => {
      const schema = dsl({ mac: 'macAddress' })
      expect((schema as any).properties.mac.pattern).toBeDefined()
      expect(validate(schema, { mac: '00:1A:2B:3C:4D:5E' }).valid).toBe(true)
      expect(validate(schema, { mac: 'not-a-mac' }).valid).toBe(false)
    })

    it('should support cron type', () => {
      const schema = dsl({ schedule: 'cron' })
      expect((schema as any).properties.schedule).toBeDefined()
    })
  })
})
