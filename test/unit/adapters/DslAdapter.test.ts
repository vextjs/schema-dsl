/**
 * DslAdapter tests — v2 migration
 *
 * v2 changes: DslAdapter delegates to DslParser, string:N single value → exactLength:N (DA-03 fix)
 * toCore() depends on JSONSchemaCore (not exported in v2), replaced with SchemaHelper.isValidSchema
 */

import { afterEach, describe, it, expect } from 'vitest'
import { DslAdapter } from '../../../src/adapters/DslAdapter.js'
import { TypeRegistry } from '../../../src/parser/TypeRegistry.js'

const CUSTOM_TYPE_NAMES = ['coverageMoney', 'coverageTenant']

afterEach(() => {
  for (const name of CUSTOM_TYPE_NAMES) {
    TypeRegistry.unregister(name)
  }
})

describe('DslAdapter', () => {
  describe('parseString()', () => {
    it('parses without injecting the v1 _required compatibility marker', () => {
      expect(DslAdapter.parseString('string')).toEqual({ type: 'string' })
    })

    it('throws a clear error for non-string input', () => {
      expect(() => DslAdapter.parseString(undefined as any)).toThrow('DSL must be a string')
    })
  })

  describe('parse() - basic types', () => {
    it('should parse string type', () => {
      const result = DslAdapter.parse('string')
      expect(result.type).toBe('string')
      expect(result._required).toBe(false)
    })

    it('should parse number type', () => {
      const result = DslAdapter.parse('number')
      expect(result.type).toBe('number')
    })

    it('should parse boolean type', () => {
      const result = DslAdapter.parse('boolean')
      expect(result.type).toBe('boolean')
    })
  })

  describe('parse() - constraints', () => {
    it('should parse string length range', () => {
      const result = DslAdapter.parse('string:3-32')
      expect(result).toMatchObject({
        type: 'string',
        minLength: 3,
        maxLength: 32,
      })
    })

    it('should parse number range', () => {
      const result = DslAdapter.parse('number:0-100')
      expect(result).toMatchObject({
        type: 'number',
        minimum: 0,
        maximum: 100,
      })
    })

    it('should parse single-value length (string:N → exactLength)', () => {
      // string:100 → exactLength:100 (exact length)
      const result = DslAdapter.parse('string:100')
      expect(result).toMatchObject({
        type: 'string',
        exactLength: 100,
      })
    })
  })

  describe('parse() - required marker', () => {
    it('should recognize required marker', () => {
      const result = DslAdapter.parse('string:3-32!')
      expect(result._required).toBe(true)
    })

    it('should handle optional fields', () => {
      // v2: without !, _required is not injected (is falsy)
      const result = DslAdapter.parse('string:3-32')
      expect(result._required).toBeFalsy()
    })
  })

  describe('parse() - format types', () => {
    it('should parse email format', () => {
      const result = DslAdapter.parse('email')
      expect(result).toMatchObject({
        type: 'string',
        format: 'email',
      })
    })

    it('should parse url format', () => {
      const result = DslAdapter.parse('url')
      expect(result).toMatchObject({
        type: 'string',
        format: 'uri',
      })
    })

    it('should parse uuid format', () => {
      const result = DslAdapter.parse('uuid')
      expect(result).toMatchObject({
        type: 'string',
        format: 'uuid',
      })
    })

    it('should parse date format', () => {
      const result = DslAdapter.parse('date')
      expect(result).toMatchObject({
        type: 'string',
        format: 'date',
      })
    })
  })

  describe('parse() - enum values', () => {
    it('should parse enum values', () => {
      const result = DslAdapter.parse('active|inactive|pending')
      expect(result).toMatchObject({
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      })
    })

    it('should handle whitespace in enum values', () => {
      const result = DslAdapter.parse('a | b | c')
      expect(result.enum).toEqual(['a', 'b', 'c'])
    })
  })

  describe('parse() - array types', () => {
    it('should parse array<type> DSL string syntax', () => {
      const result = DslAdapter.parse('array<string>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'string' })
    })

    it('should parse array with constraints in object context', () => {
      const result = DslAdapter.parse('array<string:1-20>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
    })

    it('should parse number array in object context', () => {
      const result = DslAdapter.parse('array<number:0-100>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'number', minimum: 0, maximum: 100 })
    })

    it('should parse array:N-M<type> syntax with array length constraints', () => {
      const result = DslAdapter.parse('array:1-5<string:1-20>')
      expect(result.type).toBe('array')
      expect((result as any).minItems).toBe(1)
      expect((result as any).maxItems).toBe(5)
      expect((result as any).items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
    })
  })

  describe('parseObject() - object Schema', () => {
    it('should parse simple object', () => {
      // BC-2: parseObject() returns ObjectDslBuilder; call .toSchema() to get JSONSchema
      const builder = DslAdapter.parseObject({
        name: 'string!',
        age: 'number',
      })
      const result = builder.toSchema()
      expect(result.type).toBe('object')
      expect(result.properties!.name).toEqual({ type: 'string' })
      expect(result.properties!.age).toEqual({ type: 'number' })
      expect(result.required).toEqual(['name'])
    })

    it('should parse complex object', () => {
      const builder = DslAdapter.parseObject({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
        status: 'active|inactive',
      })
      const result = builder.toSchema()
      expect(result.properties!.username).toMatchObject({
        type: 'string',
        minLength: 3,
        maxLength: 32,
      })
      expect(result.properties!.email).toMatchObject({
        type: 'string',
        format: 'email',
      })
      expect((result.properties!.status as any).enum).toEqual(['active', 'inactive'])
      expect(result.required).toEqual(['username', 'email'])
    })

    it('should parse nested object', () => {
      const builder = DslAdapter.parseObject({
        user: {
          name: 'string!',
          profile: {
            bio: 'string:500',
            website: 'url',
          },
        },
      })
      const result = builder.toSchema()
      expect(result.properties!.user.type).toBe('object')
      expect((result.properties!.user as any).properties.name).toEqual({ type: 'string' })
      expect((result.properties!.user as any).properties.profile.type).toBe('object')
    })

    it('should clean up _required marker', () => {
      const builder = DslAdapter.parseObject({
        name: 'string!',
        age: 'number',
      })
      const result = builder.toSchema()
      expect(result.properties!.name).not.toHaveProperty('_required')
      expect(result.properties!.age).not.toHaveProperty('_required')
    })

    it('returns an ObjectDslBuilder with strict, requireAll, toJsonSchema and toString helpers', () => {
      const builder = DslAdapter.parseObject({
        name: 'string',
        age: 'number',
      }).strict().requireAll()

      expect(builder.toSchema()).toMatchObject({
        type: 'object',
        strictSchema: true,
        requiredAll: true,
      })
      expect(builder.toJsonSchema()).not.toHaveProperty('strictSchema')
      expect(builder.toJsonSchema()).not.toHaveProperty('requiredAll')
      expect(JSON.parse(builder.toString())).toMatchObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      })
    })
  })

  describe('v1 compatibility helpers', () => {
    it('creates match and if marker objects', () => {
      expect(DslAdapter.match('role', { admin: 'string!' })).toEqual({
        _isMatch: true,
        field: 'role',
        map: { admin: 'string!' },
      })

      expect(DslAdapter.if('enabled', 'string!', 'number')).toEqual({
        _isIf: true,
        condition: 'enabled',
        then: 'string!',
        else: 'number',
      })
    })

    it('wraps parsed schemas through toCore()', () => {
      expect(DslAdapter.toCore('email!').schema).toMatchObject({
        type: 'string',
        format: 'email',
        _required: true,
      })

      expect(DslAdapter.toCore({ name: 'string!' }).schema).toMatchObject({
        type: 'object',
        required: ['name'],
      })
    })

    it('exposes registered types through typeMap and registerType()', () => {
      DslAdapter.registerType('coverageMoney', { type: 'number', minimum: 0 })
      expect(DslAdapter.parse('coverageMoney')).toMatchObject({ type: 'number', minimum: 0 })

      const typeMap = DslAdapter.typeMap
      expect(typeMap.string).toEqual({ type: 'string' })
      typeMap.coverageTenant = { type: 'string', pattern: '^tenant_[a-z]+$' }
      expect(DslAdapter.parse('coverageTenant')).toMatchObject({
        type: 'string',
        pattern: '^tenant_[a-z]+$',
      })
    })
  })

  describe('edge cases', () => {
    it('should throw error for empty string', () => {
      expect(() => DslAdapter.parse('')).toThrow()
    })

    it('should throw error for null input', () => {
      expect(() => DslAdapter.parse(null as any)).toThrow()
    })

    it('should handle empty object', () => {
      // BC-2: parseObject() returns ObjectDslBuilder; call .toSchema() to get JSONSchema
      const result = DslAdapter.parseObject({}).toSchema()
      expect(result.type).toBe('object')
      expect(result.properties).toEqual({})
    })
  })
})
