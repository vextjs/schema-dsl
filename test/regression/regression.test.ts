/**
 * Regression Tests — full core v1 migration
 *
 * Core regression baseline migrated from v1 test files; ensures v2 behaviour is compatible with the v1 public API
 */

import { describe, it, expect } from 'vitest'
import { DslAdapter } from '../../src/adapters/DslAdapter.js'
import { Validator } from '../../src/core/Validator.js'
import { DslBuilder } from '../../src/core/DslBuilder.js'

const validator = new Validator()

// ==================== DslAdapter Regression ====================

describe('[Regression] DslAdapter — v1 behaviour compatibility', () => {
  describe('parse() / parseString() — basic types', () => {
    it('string', () => expect(DslAdapter.parse('string').type).toBe('string'))
    it('number', () => expect(DslAdapter.parse('number').type).toBe('number'))
    it('boolean', () => expect(DslAdapter.parse('boolean').type).toBe('boolean'))
    it('integer', () => expect(DslAdapter.parse('integer').type).toBe('integer'))
    it('email → format:email', () => {
      const s = DslAdapter.parse('email')
      expect(s.type).toBe('string')
      expect(s.format).toBe('email')
    })
    it('url → format:uri', () => expect(DslAdapter.parse('url').format).toBe('uri'))
    it('uuid → format:uuid', () => expect(DslAdapter.parse('uuid').format).toBe('uuid'))
    it('date → format:date', () => expect(DslAdapter.parse('date').format).toBe('date'))
    it('datetime → format:date-time', () => expect(DslAdapter.parse('datetime').format).toBe('date-time'))
  })

  describe('parse() — constraints', () => {
    it('string:3-32 → minLength/maxLength', () => {
      const s = DslAdapter.parse('string:3-32')
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('string:100 → exactLength:100', () => {
      const s = DslAdapter.parse('string:100')
      // string:N → exactLength:N (exact length)
      expect(s.exactLength).toBe(100)
    })

    it('number:0-100 → minimum/maximum', () => {
      const s = DslAdapter.parse('number:0-100')
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })
  })

  describe('parse() — required marker', () => {
    it('string! → _required: true', () => expect(DslAdapter.parse('string!')._required).toBe(true))
    it('string → _required field absent (SchemaCompiler only injects it when required=true)', () => {
      // DslAdapter.parse internally uses DslParser.parseString, only injects _required on !
      expect(DslAdapter.parse('string')._required).toBeFalsy()
    })
    it('email! → required + format', () => {
      const s = DslAdapter.parse('email!')
      expect(s._required).toBe(true)
      expect(s.format).toBe('email')
    })
  })

  describe('parseObject() — object DSL', () => {
    it('required fields are collected into required[]', () => {
      // BC-2: parseObject() returns ObjectDslBuilder; call .toSchema() for JSONSchema access
      const schema = DslAdapter.parseObject({ name: 'string!', age: 'number' }).toSchema()
      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('age')
    })

    it('nested object handling', () => {
      const schema = DslAdapter.parseObject({ user: { name: 'string!', age: 'number' } }).toSchema()
      expect(schema.properties?.['user']?.type).toBe('object')
    })
  })
})

// ==================== Validator Regression ====================

describe('[Regression] Validator — v1 behaviour compatibility', () => {
  it('should validate a valid object', () => {
    const schema = {
      type: 'object' as const,
      properties: { name: { type: 'string' as const }, age: { type: 'number' as const } },
      required: ['name'],
    }
    const r = validator.validate(schema, { name: 'John', age: 25 }) as { valid: boolean }
    expect(r.valid).toBe(true)
  })

  it('should detect a missing required field', () => {
    const schema = {
      type: 'object' as const,
      properties: { name: { type: 'string' as const } },
      required: ['name'],
    }
    const r = validator.validate(schema, { age: 'invalid' }) as { valid: boolean }
    expect(r.valid).toBe(false)
  })

  it('should validate string length constraints', () => {
    const schema = { type: 'string' as const, minLength: 3, maxLength: 10 }
    expect((validator.validate(schema, 'abc') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'ab') as { valid: boolean }).valid).toBe(false)
    expect((validator.validate(schema, 'abcdefghijk') as { valid: boolean }).valid).toBe(false)
  })

  it('format:email validation', () => {
    const schema = { type: 'string' as const, format: 'email' }
    expect((validator.validate(schema, 'user@example.com') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'invalid') as { valid: boolean }).valid).toBe(false)
  })

  it('enum constraint', () => {
    const schema = { type: 'string' as const, enum: ['a', 'b', 'c'] }
    expect((validator.validate(schema, 'a') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'd') as { valid: boolean }).valid).toBe(false)
  })

  it('number minimum/maximum', () => {
    const schema = { type: 'number' as const, minimum: 0, maximum: 100 }
    expect((validator.validate(schema, 50) as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, -1) as { valid: boolean }).valid).toBe(false)
    expect((validator.validate(schema, 101) as { valid: boolean }).valid).toBe(false)
  })
})

// ==================== DslBuilder Regression ====================

describe('[Regression] DslBuilder — v1 behaviour compatibility', () => {
  it('string! chaining, toJsonSchema() strips internal keys', () => {
    const json = new DslBuilder('string!').label('full-name').toJsonSchema()
    expect('_required' in json).toBe(false)
    expect('_label' in json).toBe(false)
    expect(json.type).toBe('string')
  })

  it('enum() array should be correct', () => {
    const s = new DslBuilder('string').enum('a', 'b').toSchema()
    expect(s.enum).toEqual(['a', 'b'])
  })

  it('default() value should be correct', () => {
    const s = new DslBuilder('string').default('hello').toSchema()
    expect(s.default).toBe('hello')
  })

  it('number:0-100! direct DSL parsing', () => {
    const s = new DslBuilder('number:0-100!').toSchema()
    expect(s.minimum).toBe(0)
    expect(s.maximum).toBe(100)
    expect(s._required).toBe(true)
  })

  it('toString() should return the JSON-serialised JSON Schema (not the original DSL)', () => {
    const str = new DslBuilder('email!').toString()
    const parsed = JSON.parse(str) as { type: string; format: string }
    expect(parsed.type).toBe('string')
    expect(parsed.format).toBe('email')
  })
})
