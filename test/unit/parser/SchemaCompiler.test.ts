/**
 * SchemaCompiler 单元测试
 * 测试最终 JSON Schema 编译（内部键剥离、组装 required 数组等）
 */

import { describe, it, expect } from 'vitest'
import { SchemaCompiler } from '../../../src/parser/SchemaCompiler.js'
import { TypeRegistry } from '../../../src/parser/TypeRegistry.js'

describe('SchemaCompiler', () => {
  describe('compile(typeDef, constraints, meta)', () => {
    it('合并 baseSchema + constraints', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, { minLength: 3, maxLength: 32 })
      expect(out.type).toBe('string')
      expect(out.minLength).toBe(3)
      expect(out.maxLength).toBe(32)
    })

    it('meta.required 注入 _required', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, {}, { required: true })
      expect(out._required).toBe(true)
    })

    it('meta.label 注入 _label', () => {
      const typeDef = TypeRegistry.resolve('string')
      const out = SchemaCompiler.compile(typeDef, {}, { label: '姓名' })
      expect(out._label).toBe('姓名')
    })

    it('constraints 覆盖 baseSchema 同名字段', () => {
      const typeDef = TypeRegistry.resolve('email')
      const out = SchemaCompiler.compile(typeDef, { format: 'date' }) // 覆盖 email format
      expect(out.format).toBe('date')
    })
  })

  describe('toJsonSchema(schema, internalKeys)', () => {
    it('剥离内部键 _label/_required', () => {
      const raw = { type: 'string', minLength: 3, _label: '姓名', _required: true }
      const internalKeys = TypeRegistry.getInternalKeys()
      const out = SchemaCompiler.toJsonSchema(raw, internalKeys)
      expect('_label' in out).toBe(false)
      expect('_required' in out).toBe(false)
    })

    it('保留标准键 type/minLength', () => {
      const raw = { type: 'string', minLength: 3, _required: true }
      const internalKeys = TypeRegistry.getInternalKeys()
      const out = SchemaCompiler.toJsonSchema(raw, internalKeys)
      expect(out.type).toBe('string')
      expect(out.minLength).toBe(3)
    })
  })
})
