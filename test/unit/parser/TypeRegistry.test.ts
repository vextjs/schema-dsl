/**
 * TypeRegistry 单元测试
 * 测试类型注册表的基本类型映射与自定义类型扩展
 */

import { describe, it, expect } from 'vitest'
import { TypeRegistry } from '../../../src/parser/TypeRegistry.js'

describe('TypeRegistry', () => {
  describe('resolve() — 返回 TypeDefinition', () => {
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

  describe('未知类型', () => {
    it('未知类型返回 fallback string', () => {
      const def = TypeRegistry.resolve('nonexistent_xyz')
      expect(def.baseSchema.type).toBe('string')
    })
  })

  describe('toJsonSchema()', () => {
    it('剥离内部键（_label / _required 等）', () => {
      const raw = { type: 'string', _label: '姓名', _required: true }
      const json = TypeRegistry.toJsonSchema(raw)
      expect('_label' in json).toBe(false)
      expect('_required' in json).toBe(false)
      expect(json.type).toBe('string')
    })
  })
})
