/**
 * Validator Unit Tests
 * Tests AJV integration, error collection, custom keywords
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Validator } from '../../../src/core/Validator.js'
import { SchemaCompileError } from '../../../src/errors/SchemaCompileError.js'
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
      expect(() => validator.compile({ type: 'definitely-not-json-schema' as any })).toThrow(SchemaCompileError)

      const error = new SchemaCompileError(new Error('bad schema'), { type: 'bad' })
      expect(error.toJSON()).toEqual({
        error: 'SchemaCompileError',
        code: 'SCHEMA_COMPILE_ERROR',
        message: 'Schema compilation failed: bad schema',
      })
    })

    it('returns structured schema errors from validate() without throwing', () => {
      const result = validator.validate({ type: 'definitely-not-json-schema' as any }, 'value')

      expect(result.valid).toBe(false)
      expect(result.errors?.[0]).toMatchObject({
        keyword: 'schema',
        kind: 'schema',
        code: 'SCHEMA_COMPILE_ERROR',
      })
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

    it('invalidates compiled schema cache when schema references change', () => {
      const refSchema = { $ref: 'https://example.test/MutableName' } as any

      validator.addSchema('https://example.test/MutableName', { type: 'string', minLength: 2 })
      expect(validator.validate(refSchema, 'A').valid).toBe(false)

      validator.removeSchema('https://example.test/MutableName')
      validator.addSchema('https://example.test/MutableName', { type: 'string', minLength: 1 })

      expect(validator.validate(refSchema, 'A').valid).toBe(true)
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

    it('normalizes per-call custom validator messages from mixed message table values', async () => {
      const schema = {
        type: 'string',
        _customValidators: [() => false],
      } as any

      await expect(validator.validateAsync(schema, 'value', {
        messages: {
          CUSTOM_VALIDATION_FAILED: { message: 'custom validator rejected' },
          unusedNull: null,
          unusedNumber: 123,
        } as any,
      })).rejects.toThrow('custom validator rejected')
    })

    it('runs custom validators in object and array schema applicator paths', async () => {
      await expect(validator.validateAsync({
        type: 'object',
        patternProperties: {
          '^x_': { type: 'string', _customValidators: [() => 'pattern rejected'] },
        },
      } as any, { x_name: 'Ada' })).rejects.toThrow('pattern rejected')

      await expect(validator.validateAsync({
        type: 'object',
        properties: { known: { type: 'string' } },
        additionalProperties: { type: 'string', _customValidators: [() => 'additional rejected'] },
      } as any, { known: 'ok', extra: 'bad' })).rejects.toThrow('additional rejected')

      await expect(validator.validateAsync({
        type: 'object',
        propertyNames: { _customValidators: [(key: unknown) => key !== 'blocked' || 'property name rejected'] },
      } as any, { blocked: 'value' })).rejects.toThrow('property name rejected')

      await expect(validator.validateAsync({
        type: 'object',
        properties: { creditCard: { type: 'string' } },
        dependencies: {
          creditCard: { _customValidators: [() => 'dependent schema rejected'] },
        },
      } as any, { creditCard: '4111111111111111' })).rejects.toThrow('dependent schema rejected')

      await expect(validator.validateAsync({
        type: 'array',
        contains: { type: 'number', _customValidators: [() => 'contains rejected'] },
      } as any, ['ok', 1])).rejects.toThrow('contains rejected')
    })

    it('treats anyOf and contains custom validators as at-least-one passing semantics', async () => {
      await expect(validator.validateAsync({
        anyOf: [
          { type: 'string', _customValidators: [() => 'first branch rejected'] },
          { type: 'string', minLength: 1, _customValidators: [() => true] },
        ],
      } as any, 'ok')).resolves.toBe('ok')

      await expect(validator.validateAsync({
        type: 'array',
        contains: {
          type: 'number',
          _customValidators: [(value: unknown) => value === 2 || 'not the accepted item'],
        },
      } as any, [1, 2])).resolves.toEqual([1, 2])

      await expect(validator.validateAsync({
        anyOf: [
          { type: 'string', _customValidators: [() => 'first branch rejected'] },
          { type: 'string', minLength: 1, _customValidators: [() => 'second branch rejected'] },
        ],
      } as any, 'ok')).rejects.toThrow('first branch rejected')
    })

    it('runs both dependencies and dependentSchemas custom validators when both are present', async () => {
      const relaxedValidator = new Validator({ strictSchema: false })

      await expect(relaxedValidator.validateAsync({
        type: 'object',
        properties: {
          creditCard: { type: 'string' },
          billingAddress: { type: 'string' },
        },
        dependencies: {
          creditCard: ['billingAddress'],
        },
        dependentSchemas: {
          creditCard: {
            _customValidators: [() => 'dependent schema rejected'],
          },
        },
      } as any, {
        creditCard: '4111111111111111',
        billingAddress: 'No.1 Example Road',
      })).rejects.toThrow('dependent schema rejected')
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
