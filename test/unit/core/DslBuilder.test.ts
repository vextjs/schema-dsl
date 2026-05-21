/**
 * DslBuilder Unit Tests
 * Tests all constraint methods of the chained API and toSchema() / toJsonSchema() output
 */

import { describe, it, expect } from 'vitest'
import { DslBuilder } from '../../../src/core/DslBuilder.js'
import { DslParser } from '../../../src/parser/DslParser.js'

describe('DslBuilder', () => {
  describe('Constructor', () => {
    it('creates instance', () => {
      const b = new DslBuilder('string')
      expect(b).toBeInstanceOf(DslBuilder)
      expect(b._isDslBuilder).toBe(true)
    })

    it('parses basic types', () => {
      expect(new DslBuilder('string').toSchema().type).toBe('string')
      expect(new DslBuilder('number').toSchema().type).toBe('number')
      expect(new DslBuilder('boolean').toSchema().type).toBe('boolean')
    })

    it('required marker ! — toSchema()._required = true', () => {
      const s = new DslBuilder('string!').toSchema()
      expect(s._required).toBe(true)
    })

    it('no ! — toSchema()._required = false', () => {
      const s = new DslBuilder('string').toSchema()
      expect(s._required).toBe(false)
    })

    it('email format', () => {
      const s = new DslBuilder('email!').toSchema()
      expect(s.format).toBe('email')
      expect(s._required).toBe(true)
    })
  })

  describe('Constraint methods — string type chaining', () => {
    it('min() / max() — string type → minLength/maxLength', () => {
      const s = new DslBuilder('string').min(3).max(32).toSchema()
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('length() — exactLength', () => {
      const s = new DslBuilder('string').length(6).toSchema()
      expect(s.exactLength).toBe(6)
    })

    it('min() throws error for number type', () => {
      expect(() => new DslBuilder('number').min(1)).toThrow()
    })

    it('label()', () => {
      const s = new DslBuilder('string').label('Name').toSchema()
      expect(s._label).toBe('Name')
    })

    it('description()', () => {
      const s = new DslBuilder('string').description('Username').toSchema()
      expect(s.description).toBe('Username')
    })

    it('pattern()', () => {
      const s = new DslBuilder('string').pattern(/^[a-z]+$/).toSchema()
      expect(s.pattern).toMatch(/\[a-z\]/)
    })

    it('enum()', () => {
      const s = new DslBuilder('string').enum('a', 'b', 'c').toSchema()
      expect(s.enum).toEqual(['a', 'b', 'c'])
    })

    it('default()', () => {
      const s = new DslBuilder('string').default('hello').toSchema()
      expect(s.default).toBe('hello')
    })

    it('optional() clears required', () => {
      const s = new DslBuilder('string!').optional().toSchema()
      expect(s._required).toBe(false)
    })

    it('required() sets required', () => {
      const s = new DslBuilder('string').required().toSchema()
      expect(s._required).toBe(true)
    })

    it('error() sets custom message', () => {
      const s = new DslBuilder('string!').error({ required: 'Name is required' }).toSchema()
      expect(s._customMessages?.['required']).toBe('Name is required')
    })
  })

  describe('number type constraints (via DSL string)', () => {
    it('number:0-100 → minimum/maximum', () => {
      const s = new DslBuilder('number:0-100').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })

    it('integer:1- → minimum only', () => {
      const s = new DslBuilder('integer:1-').toSchema()
      expect(s.minimum).toBe(1)
    })
  })

  describe('toJsonSchema()', () => {
    it('strips internal keys _label/_required/_customMessages', () => {
      const json = new DslBuilder('string!').label('Name').toJsonSchema()
      expect('_label' in json).toBe(false)
      expect('_required' in json).toBe(false)
      expect('_customMessages' in json).toBe(false)
    })

    it('preserves minLength/maxLength', () => {
      const json = new DslBuilder('string').min(3).max(32).toJsonSchema()
      expect(json.minLength).toBe(3)
      expect(json.maxLength).toBe(32)
    })
  })

  describe('toString()', () => {
    it('returns JSON-serialized JSON Schema (not DSL string)', () => {
      const b = new DslBuilder('email!')
      const str = b.toString()
      // toString() returns JSON.stringify(toJsonSchema())
      const parsed = JSON.parse(str)
      expect(parsed.type).toBe('string')
      expect(parsed.format).toBe('email')
    })
  })

  describe('DSL string constraint direct parsing (DA-03 fix)', () => {
    it('string:6! → exactLength:6 + required', () => {
      const s = new DslBuilder('string:6!').toSchema()
      // string:N → exactLength:N (exact length)
      expect(s.exactLength).toBe(6)
      expect(s._required).toBe(true)
    })

    it('number:0-100! → minimum:0 + maximum:100 + required', () => {
      const s = new DslBuilder('number:0-100!').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
      expect(s._required).toBe(true)
    })
  })

  describe('Parser delegation', () => {
    it('should match DslParser output for dynamic pattern DSL strings', () => {
      const builderSchema = new DslBuilder('passport:cn!').toSchema()
      const parserSchema = DslParser.parseString('passport:cn')

      expect(builderSchema.pattern).toBe(parserSchema.pattern)
      expect(builderSchema._customMessages).toEqual(parserSchema._customMessages)
      expect(builderSchema._required).toBe(true)
    })

    it('should match DslParser output for cross-type union DSL strings', () => {
      const builderSchema = new DslBuilder('types:email|phone').toSchema()
      const parserSchema = DslParser.parseString('types:email|phone')

      expect(builderSchema.oneOf).toEqual(parserSchema.oneOf)
    })
  })
})
