/**
 * Validator 单元测试
 * 测试 AJV 集成、错误收集、自定义关键字
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Validator } from '../../../src/core/Validator.js'
import type { ValidationResult } from '../../../src/types/validate.js'

describe('Validator', () => {
  let validator: Validator

  beforeEach(() => {
    validator = new Validator()
  })

  describe('构造函数', () => {
    it('创建实例', () => {
      expect(validator).toBeInstanceOf(Validator)
    })

    it('接受自定义 AJV 选项', () => {
      const v = new Validator({ strict: false })
      expect(v).toBeInstanceOf(Validator)
    })
  })

  describe('validate() — 有效数据', () => {
    it('简单对象通过', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { name: 'Alice' })
      expect(result.valid).toBe(true)
      // v1 compat: 成功时 errors 为空数组
      expect(result.errors ?? []).toHaveLength(0)
    })

    it('嵌套对象通过', () => {
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

  describe('validate() — 无效数据', () => {
    it('缺少必填字段报错', () => {
      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const } },
        required: ['name'],
      }
      const result = validator.validate(schema, { age: 1 })
      expect(result.valid).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it('类型错误报错', () => {
      const schema = { type: 'number' as const }
      const result = validator.validate(schema, 'notanumber')
      expect(result.valid).toBe(false)
    })

    it('minLength 约束报错', () => {
      const schema = { type: 'string' as const, minLength: 5 }
      const result = validator.validate(schema, 'ab')
      expect(result.valid).toBe(false)
    })

    it('maximum 约束报错', () => {
      const schema = { type: 'number' as const, maximum: 10 }
      const result = validator.validate(schema, 99)
      expect(result.valid).toBe(false)
    })

    it('format:email 报错', () => {
      const schema = { type: 'string' as const, format: 'email' }
      const result = validator.validate(schema, 'not-an-email')
      expect(result.valid).toBe(false)
    })
  })

  describe('validate() — 错误格式', () => {
    it('errors 包含 message 和 path', () => {
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
    it('收集所有错误（不仅首个）', () => {
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
    it('异步验证有效数据 — 直接返回数据', async () => {
      const schema = { type: 'string' as const, minLength: 1 }
      const result = await validator.validateAsync(schema, 'hello')
      // validateAsync 成功时返回原始数据，不是 ValidationResult 对象
      expect(result).toBe('hello')
    })

    it('异步验证无效数据 — 抛出 ValidationError', async () => {
      const schema = { type: 'string' as const, minLength: 10 }
      await expect(validator.validateAsync(schema, 'hi')).rejects.toThrow()
    })
  })
})
