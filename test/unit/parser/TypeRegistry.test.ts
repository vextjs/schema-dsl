/**
 * TypeRegistry unit tests
 * Tests basic type mapping and custom type extension of the type registry
 */

import { describe, it, expect } from 'vitest'
import { TypeRegistry } from '../../../src/parser/TypeRegistry.js'

describe('TypeRegistry', () => {
  describe('resolve() — returns TypeDefinition', () => {
    it('string → baseSchema.type: string', () => {
      const def = TypeRegistry.resolve('string')
      expect(def.baseSchema.type).toBe('string')
    })

    it('number → baseSchema.type: number', () => {
      const def = TypeRegistry.resolve('number')
      expect(def.baseSchema.type).toBe('number')
    })

    it('boolean → baseSchema.type: boolean', () => {
      const def = TypeRegistry.resolve('boolean')
      expect(def.baseSchema.type).toBe('boolean')
    })

    it('integer → baseSchema.type: integer', () => {
      const def = TypeRegistry.resolve('integer')
      expect(def.baseSchema.type).toBe('integer')
    })

    it('legacy numeric aliases resolve to JSON Schema numeric types', () => {
      expect(TypeRegistry.resolve('int').baseSchema.type).toBe('integer')
      expect(TypeRegistry.resolve('float').baseSchema.type).toBe('number')
      expect(TypeRegistry.resolve('double').baseSchema.type).toBe('number')
      expect(TypeRegistry.resolve('decimal').baseSchema.type).toBe('number')
    })

    it('email → format:email', () => {
      const def = TypeRegistry.resolve('email')
      expect(def.baseSchema.type).toBe('string')
      expect(def.baseSchema.format).toBe('email')
    })

    it('url → format:uri', () => {
      const def = TypeRegistry.resolve('url')
      expect(def.baseSchema.format).toBe('uri')
    })

    it('date → format:date', () => {
      const def = TypeRegistry.resolve('date')
      expect(def.baseSchema.format).toBe('date')
    })

    it('datetime → format:date-time', () => {
      const def = TypeRegistry.resolve('datetime')
      expect(def.baseSchema.format).toBe('date-time')
    })

    it('legacy aliases resolve to canonical compatible schemas', () => {
      expect(TypeRegistry.resolve('mixed').baseSchema).toEqual({})
      expect(TypeRegistry.resolve('buffer').baseSchema.contentEncoding).toBe('base64')
      expect(TypeRegistry.resolve('objectid').baseSchema.pattern).toBe(TypeRegistry.resolve('objectId').baseSchema.pattern)
    })

    it('uuid → format:uuid', () => {
      const def = TypeRegistry.resolve('uuid')
      expect(def.baseSchema.format).toBe('uuid')
    })

    it('object → type: object', () => {
      const def = TypeRegistry.resolve('object')
      expect(def.baseSchema.type).toBe('object')
    })

    it('array → type: array', () => {
      const def = TypeRegistry.resolve('array')
      expect(def.baseSchema.type).toBe('array')
    })
  })

  describe('unknown types', () => {
    it('unknown type returns fallback string', () => {
      const def = TypeRegistry.resolve('nonexistent_xyz')
      expect(def.baseSchema.type).toBe('string')
    })

    it('unknown type can be collected as a diagnostic without throwing', () => {
      const diagnostics = []
      const def = TypeRegistry.resolve('nonexistent_xyz', {
        unknownType: 'error',
        diagnostics,
        input: 'nonexistent_xyz!',
        path: 'field',
        throwOnError: false,
      })

      expect(def.baseSchema.type).toBe('string')
      expect(diagnostics).toEqual([{
        code: 'UNKNOWN_TYPE',
        severity: 'error',
        path: 'field',
        input: 'nonexistent_xyz!',
        typeName: 'nonexistent_xyz',
        message: '[schema-dsl] Unknown type "nonexistent_xyz", falling back to string',
      }])
    })
  })

  describe('custom and dynamic type registration', () => {
    it('includes dynamic types in entries()', () => {
      TypeRegistry.clearCustomTypes()
      TypeRegistry.registerDynamic('compatDynamic', () => ({ type: 'number', minimum: 1 }))

      const entries = new Map(TypeRegistry.entries())

      expect(entries.get('compatDynamic')?.baseSchema).toEqual({ type: 'number', minimum: 1 })
      TypeRegistry.clearCustomTypes()
    })

    it('lets static and dynamic registrations replace each other deterministically', () => {
      TypeRegistry.clearCustomTypes()

      TypeRegistry.registerDynamic('compatSwap', () => ({ type: 'number', minimum: 1 }))
      expect(TypeRegistry.resolve('compatSwap').baseSchema).toEqual({ type: 'number', minimum: 1 })

      TypeRegistry.register('compatSwap', { type: 'string', minLength: 2 })
      expect(TypeRegistry.resolve('compatSwap').baseSchema).toEqual({ type: 'string', minLength: 2 })

      TypeRegistry.registerDynamic('compatSwap', () => ({ type: 'integer', minimum: 10 }))
      expect(TypeRegistry.resolve('compatSwap').baseSchema).toEqual({ type: 'integer', minimum: 10 })

      TypeRegistry.clearCustomTypes()
    })
  })

  describe('toJsonSchema()', () => {
    it('strips internal keys (_label / _required etc.)', () => {
      const raw = { type: 'string', _label: 'Name', _required: true }
      const json = TypeRegistry.toJsonSchema(raw)
      expect('_label' in json).toBe(false)
      expect('_required' in json).toBe(false)
      expect(json.type).toBe('string')
    })
  })
})
