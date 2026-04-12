/**
 * ConditionalBuilder 非对象类型支持测试 — v2 迁移（v1 conditional-non-object.test.js）
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('ConditionalBuilder - 非对象类型支持', () => {
  describe('顶层条件（直接验证值）', () => {
    it('应该支持直接验证字符串', () => {
      const schema = dsl
        .if((data: any) => typeof data === 'string' && data.length > 10)
        .then('string:1-20')
        .else('string:1-10')

      const result1 = validate(schema, 'hello world!')
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, 'hello')
      expect(result2.valid).toBe(true)

      const result3 = validate(schema, 'this is a very long string that exceeds limit')
      expect(result3.valid).toBe(false)
    })

    it('应该支持直接验证数组', () => {
      const schema = dsl
        .if((data: any) => Array.isArray(data) && data.length > 5)
        .message('数组最多5个元素')

      const result1 = validate(schema, [1, 2, 3])
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, [1, 2, 3, 4, 5, 6])
      expect(result2.valid).toBe(false)
      expect(result2.errors![0].message).toBe('数组最多5个元素')
    })

    it('应该支持直接验证数字', () => {
      const schema = dsl
        .if((data: any) => typeof data === 'number' && data < 0)
        .message('不允许负数')

      const result1 = validate(schema, 10)
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, -5)
      expect(result2.valid).toBe(false)
      expect(result2.errors![0].message).toBe('不允许负数')
    })

    it('应该支持直接验证布尔值', () => {
      const schema = dsl.if((data: any) => data === false).message('必须为 true')

      const result1 = validate(schema, true)
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, false)
      expect(result2.valid).toBe(false)
      expect(result2.errors![0].message).toBe('必须为 true')
    })
  })

  describe('条件内使用非对象Schema', () => {
    it('应该在 then/else 中使用字符串Schema', () => {
      const schema = dsl
        .if((data: any) => typeof data === 'string' && data.includes('@'))
        .then('email')
        .else('string')

      const result1 = validate(schema, 'test@example.com')
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, 'not-email@')
      expect(result2.valid).toBe(false)
    })
  })
})
