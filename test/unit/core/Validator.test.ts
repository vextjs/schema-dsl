/**
 * Validator Unit Tests
 * Tests AJV integration, error collection, custom keywords
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Validator } from '../../../src/core/Validator.js'
import type { ValidationResult } from '../../../src/types/validate.js'

describe('Validator', () => {
  let validator: Validator

  beforeEach(() => {
    validator = new Validator()
  })

  describe('Constructor', () => {
    it('creates an instance', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('accepts custom AJV options', () => {
      const v = new Validator({ strict: false, allErrors: false, cache: { maxSize: 3, ttl: 100, statsEnabled: true }, allowUnionTypes: true })
      expect(v).toBeInstanceOf(Validator)
      expect(v.ajvOptions).toMatchObject({
        allErrors: false,
        verbose: true,
        allowUnionTypes: true,
      })
    })
  })

  describe('compile() and extension APIs', () => {
    it('wraps schema compilation failures with context', () => {
      expect(() => validator.compile({ type: 'definitely-not-json-schema' as any })).toThrow('Schema compilation failed')
    })

    it('adds custom keywords, formats and schema references', () => {
      validator
        .addKeyword('startsWithX', {
          type: 'string',
          schemaType: 'boolean',
          validate: (schema: unknown, data: unknown) => !schema || String(data).startsWith('x'),
        })
        .addFormat('starts-with-y', /^y/)
        .addSchema('https://example.test/Name', { type: 'string', minLength: 2 })

      expect(validator.validate({ type: 'string', startsWithX: true } as any, 'x-ray').valid).toBe(true)
      expect(validator.validate({ type: 'string', startsWithX: true } as any, 'ray').valid).toBe(false)
      expect(validator.validate({ type: 'string', format: 'starts-with-y' }, 'yes').valid).toBe(true)
      expect(validator.validate({ $ref: 'https://example.test/Name' } as any, 'A').valid).toBe(false)

      validator.removeSchema('https://example.test/Name')
      expect(validator.getAjv()).toBeDefined()
      expect(validator.cache).toBeDefined()
      validator.clearCache()
    })

    it('wraps invalid custom keyword definitions', () => {
      expect(() => validator.addKeyword('type', { keyword: 'type' } as any)).toThrow("Failed to add keyword 'type'")
    })
  })

  describe('validate() — valid data', () => {
    it('simple object passes', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { name: 'Alice' })
      expect(result.valid).toBe(true)
      // v1 compat: errors is empty array on success
      expect(result.errors ?? []).toHaveLength(0)
    })

    it('nested object passes', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          user: {
            type: 'object' as const,
            properties: { age: { type: 'number' as const } },
          },
        },
      }
      const result = validator.validate(schema, { user: { age: 25 } })
      expect(result.valid).toBe(true)
    })
  })

  describe('validate() — invalid data', () => {
    it('missing required field triggers error', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { age: 1 })
      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('type error triggers error', () => {
      const schema = { type: 'number' as const }
      const result = validator.validate(schema, 'notanumber')
      expect(result.valid).toBe(false)
    })

    it('minLength constraint triggers error', () => {
      const schema = { type: 'string' as const, minLength: 5 }
      const result = validator.validate(schema, 'ab')
      expect(result.valid).toBe(false)
    })

    it('maximum constraint triggers error', () => {
      const schema = { type: 'number' as const, maximum: 10 }
      const result = validator.validate(schema, 99)
      expect(result.valid).toBe(false)
    })

    it('format:email triggers error', () => {
      const schema = { type: 'string' as const, format: 'email' }
      const result = validator.validate(schema, 'not-an-email')
      expect(result.valid).toBe(false)
    })
  })

  describe('validate() — error format', () => {
    it('errors contain message and path', () => {
      const schema = {
        type: 'object' as const,
        properties: { age: { type: 'number' as const } },
        required: ['age'],
      }
      const result = validator.validate(schema, {})
      expect(result.errors?.[0]).toHaveProperty('message')
      expect(result.errors?.[0]).toHaveProperty('path')
    })
  })

  describe('validate() — schema allErrors', () => {
    it('collects all errors (not just the first)', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          age: { type: 'number' as const },
        },
        required: ['name', 'age'],
      }
      const result = validator.validate(schema, {})
      expect(result.errors?.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('validateAsync()', () => {
    it('async validate valid data — returns data directly', async () => {
      const schema = { type: 'string' as const, minLength: 1 }
      const result = await validator.validateAsync(schema, 'hello')
      // validateAsync returns raw data on success, not a ValidationResult object
      expect(result).toBe('hello')
    })

    it('async validate invalid data — throws ValidationError', async () => {
      const schema = { type: 'string' as const, minLength: 10 }
      await expect(validator.validateAsync(schema, 'hi')).rejects.toThrow()
    })

    it('runs async custom validators on root, properties, arrays and composition branches', async () => {
      const schema = {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            _customValidators: [(value: unknown) => value === 'Ada' || 'name rejected'],
          },
          tags: {
            type: 'array',
            items: {
              type: 'string',
              _customValidators: [(value: unknown) => Promise.resolve(value !== 'bad' || { error: true, message: 'bad tag' })],
            },
          },
        },
        allOf: [
          {
            type: 'object',
            _customValidators: [(value: unknown) => ((value as any).enabled === true ? true : false)],
          },
        ],
        anyOf: [
          {
            type: 'object',
            properties: { kind: { const: 'user' } },
            _customValidators: [() => true],
          },
          {
            type: 'object',
            properties: { kind: { const: 'admin' } },
            _customValidators: [() => 'admin rejected'],
          },
        ],
      } as any

      await expect(validator.validateAsync(schema, {
        name: 'Ada',
        tags: ['ok'],
        enabled: true,
        kind: 'user',
      })).resolves.toMatchObject({ name: 'Ada' })

      await expect(validator.validateAsync(schema, {
        name: 'Grace',
        tags: ['ok'],
        enabled: true,
        kind: 'user',
      })).rejects.toThrow('name rejected')

      await expect(validator.validateAsync(schema, {
        name: 'Ada',
        tags: ['bad'],
        enabled: true,
        kind: 'user',
      })).rejects.toThrow('bad tag')

      await expect(validator.validateAsync(schema, {
        name: 'Ada',
        tags: ['ok'],
        enabled: false,
        kind: 'user',
      })).rejects.toThrow('Validation failed')
    })

    it('runs tuple item, oneOf and conditional branch custom validators', async () => {
      const schema = {
        type: 'array',
        items: [
          { type: 'string', _customValidators: [() => true] },
          { type: 'number', _customValidators: [() => ({ error: true })] },
        ],
        minItems: 2,
        maxItems: 2,
      } as any
      await expect(validator.validateAsync(schema, ['ok', 1])).rejects.toThrow('Validation failed')

      const unionSchema = {
        oneOf: [
          { type: 'string', _customValidators: [() => true] },
          { type: 'number', _customValidators: [() => 'number rejected'] },
        ],
      } as any
      await expect(validator.validateAsync(unionSchema, 1)).rejects.toThrow('number rejected')

      const conditionalSchema = {
        if: { type: 'string' },
        then: { _customValidators: [() => 'then rejected'] },
        else: { _customValidators: [() => 'else rejected'] },
      } as any
      await expect(validator.validateAsync(conditionalSchema, 'value')).rejects.toThrow('then rejected')
      await expect(validator.validateAsync(conditionalSchema, 1)).rejects.toThrow('else rejected')
    })

    it('preserves custom validator errors from thrown non-Error values', async () => {
      const schema = {
        type: 'string',
        _customValidators: [() => { throw 'plain failure' }],
      } as any

      await expect(validator.validateAsync(schema, 'value')).rejects.toThrow('plain failure')
    })
  })
})
