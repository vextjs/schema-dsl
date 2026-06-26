/**
 * DslParser unit tests
 * Covers string parsing + object parsing + negative tests
 */

import { describe, it, expect } from 'vitest'
import { DslParser } from '../../../src/parser/DslParser.js'

describe('DslParser', () => {
  describe('parseString() — basic types', () => {
    it('string', () => {
      const s = DslParser.parseString('string')
      expect(s.type).toBe('string')
    })

    it('number', () => {
      const s = DslParser.parseString('number')
      expect(s.type).toBe('number')
    })

    it('boolean', () => {
      const s = DslParser.parseString('boolean')
      expect(s.type).toBe('boolean')
    })

    it('email', () => {
      const s = DslParser.parseString('email')
      expect(s.type).toBe('string')
      expect(s.format).toBe('email')
    })

    it('url', () => {
      const s = DslParser.parseString('url')
      expect(s.format).toBe('uri')
    })

    it('uuid', () => {
      const s = DslParser.parseString('uuid')
      expect(s.format).toBe('uuid')
    })

    it('date', () => {
      const s = DslParser.parseString('date')
      expect(s.format).toBe('date')
    })
  })

  describe('parseString() — length/range constraints', () => {
    it('string:3-32 → minLength/maxLength', () => {
      const s = DslParser.parseString('string:3-32')
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('string:100 → exactLength:100', () => {
      const s = DslParser.parseString('string:100')
      // string:N → exactLength:N (exact length)
      expect(s.exactLength).toBe(100)
    })

    it('number:0-100 → minimum/maximum', () => {
      const s = DslParser.parseString('number:0-100')
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })

    it('number:1- → minimum only (DA-01 fix)', () => {
      const s = DslParser.parseString('number:1-')
      expect(s.minimum).toBe(1)
      expect(s.maximum).toBeUndefined()
    })

    it('string:2- → minLength only', () => {
      const s = DslParser.parseString('string:2-')
      expect(s.minLength).toBe(2)
      expect(s.maxLength).toBeUndefined()
    })
  })

  describe('parseString() — required marker', () => {
    it('string! → _required: true', () => {
      const s = DslParser.parseString('string!')
      expect(s._required).toBe(true)
    })

    it('string (no !) → _required field absent', () => {
      const s = DslParser.parseString('string')
      // SchemaCompiler only injects _required when required=true
      expect(s._required).toBeFalsy()
    })

    it('email! → required + format', () => {
      const s = DslParser.parseString('email!')
      expect(s._required).toBe(true)
      expect(s.format).toBe('email')
    })

    it('number:0-100! → required + range', () => {
      const s = DslParser.parseString('number:0-100!')
      expect(s._required).toBe(true)
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })
  })

  describe('parseObject() — object DSL', () => {
    it('flat field mapping', () => {
      const schema = DslParser.parseObject({
        name: 'string!',
        age: 'number',
      })
      expect(schema.type).toBe('object')
      expect(schema.properties?.['name']?.type).toBe('string')
      expect(schema.properties?.['age']?.type).toBe('number')
    })

    it('required[] collects required fields', () => {
      const schema = DslParser.parseObject({
        name: 'string!',
        age: 'number',
        email: 'email!',
      })
      expect(schema.required).toContain('name')
      expect(schema.required).toContain('email')
      expect(schema.required).not.toContain('age')
    })

    it('nested objects', () => {
      const schema = DslParser.parseObject({
        user: {
          name: 'string!',
          age: 'number',
        },
      })
      expect(schema.properties?.['user']?.type).toBe('object')
      expect(schema.properties?.['user']?.properties?.['name']?.type).toBe('string')
    })

    it('empty object → no required array', () => {
      const schema = DslParser.parseObject({ name: 'string' })
      expect(schema.required ?? []).not.toContain('name')
    })

    it('preserves __proto__ as an own schema property', () => {
      const input = Object.create(null) as Record<string, string>
      input['__proto__!'] = 'string'

      const schema = DslParser.parseObject(input)

      expect(Object.prototype.hasOwnProperty.call(schema.properties, '__proto__')).toBe(true)
      expect(Object.getPrototypeOf(schema.properties)).toBeNull()
      expect(schema.properties?.['__proto__']?.type).toBe('string')
      expect(schema.required).toContain('__proto__')
    })
  })

  describe('parseString() — negative tests', () => {
    it('empty string does not throw, returns a valid schema', () => {
      expect(() => DslParser.parseString('')).not.toThrow()
    })

    it('very large constraint number does not crash', () => {
      const s = DslParser.parseString('string:0-99999999')
      expect(s.maxLength).toBe(99999999)
    })
  })
})
