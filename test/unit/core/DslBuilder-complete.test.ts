/**
 * DslBuilder Complete Tests — v2 Migration
 *
 * v2 Changes:
 * - tests explicitly enable String extensions for compatibility coverage
 * - string:N single value → exactLength:N (DA-03 fix)
 * - errors field is undefined on success (not empty array)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, validate, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder - Complete Tests', () => {
  describe('Basic Type Parsing', () => {
    it('should correctly parse all basic types', () => {
      const schema = dsl({
        str: 'string',
        num: 'number',
        int: 'integer',
        bool: 'boolean',
        email: 'email',
        url: 'url',
        uuid: 'uuid',
        date: 'date',
      })

      const p = (schema as any).properties
      expect(p.str.type).toBe('string')
      expect(p.num.type).toBe('number')
      expect(p.int.type).toBe('integer')
      expect(p.bool.type).toBe('boolean')
      expect(p.email.format).toBe('email')
      expect(p.url.format).toBe('uri')
      expect(p.uuid.format).toBe('uuid')
      expect(p.date.format).toBe('date')
    })
  })

  describe('Complete Constraint Tests', () => {
    it('should support string:N exact length syntax', () => {
      const schema = dsl({ code: 'string:6' })
      expect((schema as any).properties.code.exactLength).toBe(6)
    })

    it('should support string:-max explicit syntax', () => {
      const schema = dsl({ bio: 'string:-500' })
      expect((schema as any).properties.bio.maxLength).toBe(500)
    })

    it('should support combination: exact length + required', () => {
      const schema = dsl({ code: 'string:6!' })
      expect((schema as any).properties.code.exactLength).toBe(6)
      expect((schema as any).required).toContain('code')
    })

    it('should support string:min-max range syntax', () => {
      const schema = dsl({ username: 'string:3-32' })
      expect((schema as any).properties.username.minLength).toBe(3)
      expect((schema as any).properties.username.maxLength).toBe(32)
    })

    it('should support string:min- min-only syntax', () => {
      const schema = dsl({ content: 'string:10-' })
      expect((schema as any).properties.content.minLength).toBe(10)
      expect((schema as any).properties.content.maxLength).toBeUndefined()
    })

    it('should support number:min-max numeric range', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect((schema as any).properties.age.minimum).toBe(18)
      expect((schema as any).properties.age.maximum).toBe(120)
    })

    it('should support number:max numeric maximum', () => {
      const schema = dsl({ score: 'number:100' })
      expect((schema as any).properties.score.maximum).toBe(100)
    })

    it('should support number:min- numeric minimum', () => {
      const schema = dsl({ price: 'number:0-' })
      expect((schema as any).properties.price.minimum).toBe(0)
      expect((schema as any).properties.price.maximum).toBeUndefined()
    })
  })

  describe('Required Marker Tests', () => {
    it("should recognize ! required marker", () => {
      const schema = dsl({ username: 'string!' })
      expect((schema as any).required).toContain('username')
    })

    it('should support multiple required fields', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email!',
        age: 'number',
      })
      expect((schema as any).required).toContain('username')
      expect((schema as any).required).toContain('email')
      expect((schema as any).required).not.toContain('age')
    })

    it('should support constraint + required combination', () => {
      const schema = dsl({ username: 'string:3-32!' })
      expect((schema as any).required).toContain('username')
      expect((schema as any).properties.username.minLength).toBe(3)
      expect((schema as any).properties.username.maxLength).toBe(32)
    })
  })

  describe('Enum Value Tests', () => {
    it('should parse simple enum', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive', 'pending'])
    })

    it('should support enum with spaces', () => {
      const schema = dsl({ role: ' admin | user | guest ' })
      expect((schema as any).properties.role.enum).toEqual(['admin', 'user', 'guest'])
    })

    it('should support numeric enum (v2 auto-detects numeric enum)', () => {
      const schema = dsl({ priority: '1|2|3|4|5' })
      expect((schema as any).properties.priority.type).toBe('number')
      expect((schema as any).properties.priority.enum).toEqual([1, 2, 3, 4, 5])
    })

    it('should support required enum', () => {
      const schema = dsl({ status: 'active|inactive!' })
      expect((schema as any).required).toContain('status')
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive'])
    })
  })

  describe('username() Complete Tests', () => {
    it('default should be medium (3-32)', () => {
      const schema = dsl({ u: ('string!' as any).username() })
      expect((schema as any).properties.u.minLength).toBe(3)
      expect((schema as any).properties.u.maxLength).toBe(32)
    })

    it('should support custom range string', () => {
      const tests = [
        { input: '5-20', min: 5, max: 20 },
        { input: '1-10', min: 1, max: 10 },
        { input: '8-16', min: 8, max: 16 },
      ]
      tests.forEach(test => {
        const schema = dsl({ u: ('string!' as any).username(test.input) })
        expect((schema as any).properties.u.minLength).toBe(test.min)
        expect((schema as any).properties.u.maxLength).toBe(test.max)
      })
    })

    it('should support all preset options', () => {
      const presets: Record<string, { min: number; max: number }> = {
        short: { min: 3, max: 16 },
        medium: { min: 3, max: 32 },
        long: { min: 3, max: 64 },
      }
      Object.entries(presets).forEach(([preset, expected]) => {
        const schema = dsl({ u: ('string!' as any).username(preset) })
        expect((schema as any).properties.u.minLength).toBe(expected.min)
        expect((schema as any).properties.u.maxLength).toBe(expected.max)
      })
    })

    it('should add regex validation', () => {
      const schema = dsl({ u: ('string!' as any).username() })
      expect((schema as any).properties.u.pattern).toBeTruthy()
    })
  })

  describe('phone() Complete Tests', () => {
    it('should support common country codes', () => {
      const countries: Record<string, { min: number; max: number }> = {
        cn: { min: 11, max: 11 },
        us: { min: 10, max: 10 },
        hk: { min: 8, max: 8 },
        tw: { min: 10, max: 10 },
      }
      Object.entries(countries).forEach(([country, expected]) => {
        const schema = dsl({ p: ('string!' as any).phone(country) })
        expect((schema as any).properties.p.minLength).toBe(expected.min)
        expect((schema as any).properties.p.maxLength).toBe(expected.max)
      })
    })

    it('should reject number schemas', () => {
      expect(() => ('number!' as any).phone('cn')).toThrow('phone() only applies to string type')
    })

    it('should add regex validation', () => {
      const schema = dsl({ p: ('string!' as any).phone('cn') })
      expect((schema as any).properties.p.pattern).toBeTruthy()
    })
  })

  describe('password() Complete Tests', () => {
    it('should support weak/medium/strong levels', () => {
      const strengths: Record<string, { min: number; max: number }> = {
        weak: { min: 6, max: 64 },
        medium: { min: 8, max: 64 },
        strong: { min: 8, max: 64 },
      }
      Object.entries(strengths).forEach(([strength, expected]) => {
        const schema = dsl({ p: ('string!' as any).password(strength) })
        expect((schema as any).properties.p.minLength).toBe(expected.min)
        expect((schema as any).properties.p.maxLength).toBe(expected.max)
      })
    })

    it('default should be medium', () => {
      const schema = dsl({ p: ('string!' as any).password() })
      expect((schema as any).properties.p.minLength).toBe(8)
    })
  })

  describe('Nested Object Tests', () => {
    it('should support single-level nesting', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!',
        },
      })
      const user = (schema as any).properties.user
      expect(user.type).toBe('object')
      expect(user.properties.name).toBeTruthy()
      expect(user.properties.email).toBeTruthy()
    })

    it('nested object should inherit required markers', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!',
        },
      })
      const user = (schema as any).properties.user
      expect(user.required).toContain('name')
      expect(user.required).toContain('email')
    })
  })

  describe('Array Type Tests', () => {
    it('should support array<type> DSL string syntax', () => {
      const schema = dsl({ tags: 'array<string>' })
      const p = (schema as any).properties
      expect(p.tags.type).toBe('array')
      expect(p.tags.items).toMatchObject({ type: 'string' })
    })

    it('should support array:N-M<type:constraint> full syntax', () => {
      const schema = dsl({ tags: 'array:1-5<string:1-20>!' })
      const p = (schema as any).properties
      expect(p.tags.type).toBe('array')
      expect(p.tags.minItems).toBe(1)
      expect(p.tags.maxItems).toBe(5)
      expect(p.tags.items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
      expect((schema as any).required).toContain('tags')
    })

    it('should support enum array array<enum:x|y|z>', () => {
      const schema = dsl({ roles: 'array<enum:admin|user|guest>' })
      const p = (schema as any).properties
      expect(p.roles.type).toBe('array')
      expect(p.roles.items).toMatchObject({ enum: ['admin', 'user', 'guest'] })
    })
  })

  describe('Validation Tests', () => {
    it('should correctly validate valid data', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
      })
      const result = validate(schema, {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
      })
      expect(result.valid).toBe(true)
    })

    it('should detect missing required fields', () => {
      const schema = dsl({ username: 'string!', email: 'email!' })
      const result = validate(schema, { username: 'john' })
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should detect length constraint violations', () => {
      const schema = dsl({ username: 'string:5-20!' })
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
    })
  })
})
