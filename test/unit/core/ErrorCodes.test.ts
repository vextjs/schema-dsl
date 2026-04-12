/**
 * ErrorCodes 单元测试 — v2 迁移
 *
 * v2 变更：
 * - ErrorCodes 模块未对外导出（内部使用 KEYWORD_MAP）
 * - 通过验证行为间接验证错误代码功能
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, Validator } from '../../../src/index.js'

describe('ErrorCodes', () => {
  describe('错误代码验证（通过验证行为）', () => {
    it('应该产生 required 错误', () => {
      const schema = dsl({ username: 'string!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
      const err = result.errors![0]
      expect(err).toHaveProperty('path')
      expect(err).toHaveProperty('message')
    })

    it('应该产生 minLength 错误', () => {
      const schema = dsl({ username: 'string:5-!' })
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('验证器返回错误结构', () => {
    it('错误对象应包含 path 和 message', () => {
      const validator = new Validator()
      const schema = dsl({ age: 'number!' })
      const result = validator.validate(schema, {})
      expect(result.valid).toBe(false)
      const err = result.errors![0]
      expect(typeof err.path).toBe('string')
      expect(typeof err.message).toBe('string')
    })
  })
})
