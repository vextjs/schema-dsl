/**
 * Validator Core Tests — v2 Migration (v1 Validator.test.js)
 *
 * v2 changes:
 * - ajvOptions not directly exposed (internal _ajvOptions)
 * - constructor configured via ValidatorOptions, not AJV options directly
 * - JSONSchemaCore no longer exported, use JSON Schema objects directly
 * - Validator.create() / Validator.quickValidate() available
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Validator } from '../../../src/index.js'

describe('Validator', () => {
  let validator: InstanceType<typeof Validator>

  beforeEach(() => {
    validator = new Validator()
  })

  describe('Constructor', () => {
    it('should create a Validator instance', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('ajvOptions exposed via public getter (v1 compat)', () => {
      expect('ajvOptions' in validator).toBe(true)
      expect((validator as any).ajvOptions).toBeDefined()
    })

    it('should accept configuration options', () => {
      // v2 configured via ValidatorOptions (smartCoerce, cache, etc.)
      const customValidator = new Validator({ smartCoerce: true })
      expect(customValidator).toBeInstanceOf(Validator)
    })

    it('should support cache: false to disable caching (docs-compatible shorthand)', () => {
      const customValidator = new Validator({ cache: false })
      expect(customValidator.cache.options.enabled).toBe(false)
    })

    it('should support cache: true to enable default cache config (docs-compatible shorthand)', () => {
      const customValidator = new Validator({ cache: true })
      expect(customValidator.cache.options.enabled).toBe(true)
      expect(customValidator.cache.options.maxSize).toBeGreaterThan(0)
    })

    it('should pass cache.statsEnabled through to CacheManager', () => {
      const customValidator = new Validator({
        cache: {
          maxSize: 10,
          statsEnabled: false,
        },
      })

      expect(customValidator.cache.options.maxSize).toBe(10)
      expect(customValidator.cache.options.statsEnabled).toBe(false)
    })
  })

  describe('validate()', () => {
    it('should validate valid data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const data = { name: 'John', age: 25 }
      const result = validator.validate(schema, data)

      expect(result.valid).toBe(true)
      // v1 compat: errors is empty array when valid
      expect(result.errors).toEqual([])
    })

    it('should detect invalid data', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const data = { age: 'invalid' }
      const result = validator.validate(schema, data)

      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('should validate string length constraints', () => {
      const schema = { type: 'string', minLength: 3, maxLength: 10 }

      expect(validator.validate(schema, 'abc').valid).toBe(true)
      expect(validator.validate(schema, 'ab').valid).toBe(false)
      expect(validator.validate(schema, 'abcdefghijk').valid).toBe(false)
    })

    it('should validate numeric range constraints', () => {
      const schema = { type: 'number', minimum: 0, maximum: 100 }

      expect(validator.validate(schema, 50).valid).toBe(true)
      expect(validator.validate(schema, -1).valid).toBe(false)
      expect(validator.validate(schema, 101).valid).toBe(false)
    })

    it('should validate email format', () => {
      const schema = { type: 'string', format: 'email' }

      expect(validator.validate(schema, 'test@example.com').valid).toBe(true)
      expect(validator.validate(schema, 'invalid-email').valid).toBe(false)
    })

    it('should validate enum values', () => {
      const schema = { type: 'string', enum: ['active', 'inactive', 'pending'] }

      expect(validator.validate(schema, 'active').valid).toBe(true)
      expect(validator.validate(schema, 'invalid').valid).toBe(false)
    })
  })

  describe('compile()', () => {
    it('should compile Schema to a validation function', () => {
      const schema = { type: 'string', minLength: 3 }
      const validateFn = validator.compile(schema)
      expect(typeof validateFn).toBe('function')
    })

    it('should cache compiled results', () => {
      const schema = { type: 'string' }
      const cacheKey = 'test-key'

      const fn1 = validator.compile(schema, cacheKey)
      const fn2 = validator.compile(schema, cacheKey)

      expect(fn1).toBe(fn2)
    })
  })

  describe('validateBatch()', () => {
    it('should validate data in batches', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      }

      const dataArray = [{ name: 'John' }, { name: 'Jane' }, { age: 25 }]

      const results = validator.validateBatch(schema, dataArray)

      expect(results).toHaveLength(3)
      expect(results[0].valid).toBe(true)
      expect(results[1].valid).toBe(true)
      expect(results[2].valid).toBe(false)
    })
  })

  describe('addKeyword()', () => {
    it('should add custom keyword', () => {
      validator.addKeyword('isEven', {
        keyword: 'isEven',
        type: 'number',
        validate: (_schema: unknown, data: unknown) => (data as number) % 2 === 0,
      })

      const schema = { type: 'number', isEven: true }

      expect(validator.validate(schema, 4).valid).toBe(true)
      expect(validator.validate(schema, 5).valid).toBe(false)
    })

    it('should be compatible with v1 two-argument syntax without triggering AJV deprecated warnings', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        validator.addKeyword('isPositive', {
          type: 'number',
          validate: (_schema: unknown, data: unknown) => (data as number) > 0,
        } as any)

        const schema = { type: 'number', isPositive: true }

        expect(validator.validate(schema, 1).valid).toBe(true)
        expect(validator.validate(schema, 0).valid).toBe(false)
        expect(warnSpy.mock.calls.flat().join('\n')).not.toContain('these parameters are deprecated')
      } finally {
        warnSpy.mockRestore()
      }
    })
  })

  describe('addFormat()', () => {
    it('should add custom format', () => {
      validator.addFormat('uppercase', /^[A-Z]+$/)

      const schema = { type: 'string', format: 'uppercase' }

      expect(validator.validate(schema, 'ABC').valid).toBe(true)
      expect(validator.validate(schema, 'abc').valid).toBe(false)
    })
  })

  describe('clearCache()', () => {
    it('should recompile after clearing cache', () => {
      const schema = { type: 'string' }
      validator.compile(schema, 'key1')

      validator.clearCache()

      const fn1 = validator.compile(schema, 'key1')
      const fn2 = validator.compile(schema, 'key1')
      expect(fn1).toBe(fn2) // should be equal after re-caching
    })
  })

  describe('Static Methods', () => {
    it('Validator.create() should create an instance', () => {
      const instance = Validator.create()
      expect(instance).toBeInstanceOf(Validator)
    })

    it('Validator.quickValidate() should perform quick validation', () => {
      const schema = { type: 'string' }
      expect(Validator.quickValidate(schema, 'test')).toBe(true)
      expect(Validator.quickValidate(schema, 123)).toBe(false)
    })
  })
})
