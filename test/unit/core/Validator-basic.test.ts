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
import { Validator, dsl } from '../../../src/index.js'

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

    it('should validate __proto__ fields produced by object DSL schemas', () => {
      const definition = Object.create(null)
      definition['__proto__!'] = 'string'
      const schema = dsl(definition)

      expect(validator.validate(schema, JSON.parse('{"__proto__":"ok"}')).valid).toBe(true)
      expect(validator.validate(schema, JSON.parse('{"__proto__":123}')).valid).toBe(false)
      expect(validator.validate(schema, {}).valid).toBe(false)
    })

    it('should validate __proto__ fields inside schema applicators after metadata fast-path checks', () => {
      const properties = Object.create(null)
      properties['__proto__'] = { type: 'string' }
      const schema = {
        type: 'object',
        allOf: [{
          type: 'object',
          required: ['__proto__'],
          properties,
        }],
      } as any

      expect(validator.validate(schema, JSON.parse('{"__proto__":"ok"}')).valid).toBe(true)
      expect(validator.validate(schema, JSON.parse('{"__proto__":123}')).valid).toBe(false)
      expect(validator.validate(schema, {}).valid).toBe(false)
    })

    it('quickValidate should validate __proto__ fields inside schema applicators', () => {
      const properties = Object.create(null)
      properties['__proto__'] = { type: 'string' }
      const schema = {
        type: 'object',
        allOf: [{
          type: 'object',
          required: ['__proto__'],
          properties,
        }],
      } as any

      expect(Validator.quickValidate(schema, JSON.parse('{"__proto__":"ok"}'))).toBe(true)
      expect(Validator.quickValidate(schema, JSON.parse('{"__proto__":123}'))).toBe(false)
      expect(Validator.quickValidate(schema, {})).toBe(false)
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

    it('should re-read mutable DslBuilder schemas on every call', () => {
      const builder = dsl('string')

      expect(validator.validate(builder as unknown as Parameters<Validator['validate']>[0], 'hi').valid).toBe(true)

      builder.min(3)

      const updatedResult = validator.validate(builder as unknown as Parameters<Validator['validate']>[0], 'hi')
      expect(updatedResult.valid).toBe(false)
      expect(updatedResult.errors?.[0].keyword).toBe('minLength')
    })

    it('should re-read mutable DslBuilder schemas in validateAsync()', async () => {
      const builder = dsl('string')

      await expect(validator.validateAsync(builder as unknown as Parameters<Validator['validateAsync']>[0], 'hello')).resolves.toBe('hello')

      builder.min(6)

      await expect(validator.validateAsync(builder as unknown as Parameters<Validator['validateAsync']>[0], 'hello')).rejects.toMatchObject({
        errors: [
          expect.objectContaining({ keyword: 'minLength' }),
        ],
      })
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

    it('should pass options to each batch validation item', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      }

      const results = validator.validateBatch(schema, [{ age: '18' }], { smartCoerce: false })

      expect(results[0].valid).toBe(false)
    })

    it('should prewarm the compile cache while preserving per-item validation behavior', () => {
      const batchValidator = new Validator({ cache: { maxSize: 10, statsEnabled: true } })
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      }

      const results = batchValidator.validateBatch(schema, [{ name: 'John' }, { name: 'Jane' }, {}])
      const stats = batchValidator.getCacheStats()

      expect(results.map(result => result.valid)).toEqual([true, true, false])
      expect(stats.size).toBeLessThanOrEqual(1)
      expect(stats.hits).toBeGreaterThanOrEqual(0)
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

    it('Validator.quickValidate() should honor __proto__ own-property schemas', () => {
      const properties = Object.create(null)
      properties['__proto__'] = { type: 'string' }
      const schema = {
        type: 'object',
        required: ['__proto__'],
        properties,
      } as any

      expect(Validator.quickValidate(schema, JSON.parse('{"__proto__":"ok"}'))).toBe(true)
      expect(Validator.quickValidate(schema, JSON.parse('{"__proto__":123}'))).toBe(false)
      expect(Validator.quickValidate(schema, {})).toBe(false)
    })
  })
})
