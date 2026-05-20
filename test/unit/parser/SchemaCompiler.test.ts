/**
 * SchemaCompiler unit tests
 * Tests final JSON Schema compilation (internal key stripping, assembling required array, etc.)
 */

import { describe, it, expect } from 'vitest'
import { SchemaCompiler } from '../../../src/parser/SchemaCompiler.js'
import { TypeRegistry } from '../../../src/parser/TypeRegistry.js'

describe('SchemaCompiler', () => {
  describe('compile(typeDef, constraints, meta)', () => {
    it('merges baseSchema + constraints', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, { minLength: 3, maxLength: 32 })
      expect(out.type).toBe('string')
      expect(out.minLength).toBe(3)
      expect(out.maxLength).toBe(32)
    })

    it('meta.required injects _required', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, {}, { required: true })
      expect(out._required).toBe(true)
    })

    it('meta.label injects _label', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, {}, { label: '姓名' })
      expect(out._label).toBe('姓名')
    })

    it('constraints override same-name fields in baseSchema', () => {
      const typeDef = TypeRegistry.resolve('email')
      const out = SchemaCompiler.compile(typeDef, { format: 'date' }) // override email format
      expect(out.format).toBe('date')
    })
  })

  describe('toJsonSchema(schema, internalKeys)', () => {
    it('strips internal keys _label/_required', () => {
      const raw = { type: 'string', minLength: 3, _label: '姓名', _required: true }
      const internalKeys = TypeRegistry.getInternalKeys()
      const out = SchemaCompiler.toJsonSchema(raw, internalKeys)
      expect('_label' in out).toBe(false)
      expect('_required' in out).toBe(false)
    })

    it('retains standard keys type/minLength', () => {
      const raw = { type: 'string', minLength: 3, _required: true }
      const internalKeys = TypeRegistry.getInternalKeys()
      const out = SchemaCompiler.toJsonSchema(raw, internalKeys)
      expect(out.type).toBe('string')
      expect(out.minLength).toBe(3)
    })
  })
})
