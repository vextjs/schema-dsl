/**
 * String 验证器测试 (v2 TypeScript)
 *
 * 迁移自 test/unit/validators/string-validators.test.js
 *
 * 测试 String 类型验证器：
 * - min (最小长度)
 * - max (最大长度)
 * - length (精确长度，v2 使用 exactLength 关键字)
 * - alphanum (字母和数字)
 * - trim (无前后空格)
 * - lowercase (小写)
 * - uppercase (大写)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, DslBuilder } from '../../../src/index.js'

describe('String Validators - v1.0.2', () => {

  describe('min() - 最小长度（AJV原生）', () => {
    it('应该验证最小长度', () => {
      const schema = dsl({ name: dsl('string!').min(3) })

      expect(validate(schema, { name: 'ab' }).valid).toBe(false)
      expect(validate(schema, { name: 'abc' }).valid).toBe(true)
      expect(validate(schema, { name: 'abcd' }).valid).toBe(true)
    })
  })

  describe('max() - 最大长度（AJV原生）', () => {
    it('应该验证最大长度', () => {
      const schema = dsl({ name: dsl('string!').max(10) })

      expect(validate(schema, { name: '12345678901' }).valid).toBe(false)
      expect(validate(schema, { name: '1234567890' }).valid).toBe(true)
      expect(validate(schema, { name: '123' }).valid).toBe(true)
    })
  })

  describe('length() - 精确长度', () => {
    it('应该验证精确长度', () => {
      const schema = dsl({ phone: dsl('string!').length(11) })

      expect(validate(schema, { phone: '1234567890' }).valid).toBe(false)
      expect(validate(schema, { phone: '12345678901' }).valid).toBe(true)
      expect(validate(schema, { phone: '123456789012' }).valid).toBe(false)
    })

    it('应该在错误消息中包含长度限制', () => {
      const schema = dsl({ code: dsl('string!').length(6) })
      const result = validate(schema, { code: '12345' })

      expect(result.valid).toBe(false)
      expect(result.errors[0]).toHaveProperty('keyword', 'exactLength')
    })
  })

  describe('alphanum() - 字母和数字', () => {
    it('应该只接受字母和数字', () => {
      const schema = dsl({ code: dsl('string!').alphanum() })

      expect(validate(schema, { code: 'abc123' }).valid).toBe(true)
      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'abc' }).valid).toBe(true)
      expect(validate(schema, { code: '123' }).valid).toBe(true)
    })

    it('应该拒绝特殊字符', () => {
      const schema = dsl({ code: dsl('string!').alphanum() })

      expect(validate(schema, { code: 'abc-123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc_123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc 123' }).valid).toBe(false)
      expect(validate(schema, { code: 'abc@123' }).valid).toBe(false)
    })

    it('应该接受空字符串', () => {
      const schema = dsl({ code: dsl('string').alphanum() })
      expect(validate(schema, { code: '' }).valid).toBe(true)
    })
  })

  describe('trim() - 无前后空格', () => {
    it('应该拒绝包含前导空格的字符串', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: ' hello' }).valid).toBe(false)
    })

    it('应该拒绝包含尾随空格的字符串', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: 'hello ' }).valid).toBe(false)
    })

    it('应该拒绝包含前后空格的字符串', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: ' hello ' }).valid).toBe(false)
    })

    it('应该接受已修剪的字符串', () => {
      const schema = dsl({ name: dsl('string!').trim() })

      expect(validate(schema, { name: 'hello' }).valid).toBe(true)
      expect(validate(schema, { name: 'hello world' }).valid).toBe(true) // 中间空格允许
    })
  })

  describe('lowercase() - 小写', () => {
    it('应该只接受小写字符串', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: 'hello' }).valid).toBe(true)
      expect(validate(schema, { code: 'hello123' }).valid).toBe(true)
    })

    it('应该拒绝包含大写字母的字符串', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: 'Hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'HELLO' }).valid).toBe(false)
      expect(validate(schema, { code: 'HeLLo' }).valid).toBe(false)
    })

    it('应该接受没有字母的字符串', () => {
      const schema = dsl({ code: dsl('string!').lowercase() })

      expect(validate(schema, { code: '123' }).valid).toBe(true)
      expect(validate(schema, { code: '!@#' }).valid).toBe(true)
    })
  })

  describe('uppercase() - 大写', () => {
    it('应该只接受大写字符串', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: 'HELLO' }).valid).toBe(true)
      expect(validate(schema, { code: 'HELLO123' }).valid).toBe(true)
    })

    it('应该拒绝包含小写字母的字符串', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: 'Hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'hello' }).valid).toBe(false)
      expect(validate(schema, { code: 'HeLLo' }).valid).toBe(false)
    })

    it('应该接受没有字母的字符串', () => {
      const schema = dsl({ code: dsl('string!').uppercase() })

      expect(validate(schema, { code: '123' }).valid).toBe(true)
      expect(validate(schema, { code: '!@#' }).valid).toBe(true)
    })
  })

  describe('链式调用', () => {
    it('应该支持多个验证器链式调用', () => {
      const schema = dsl({
        code: dsl('string!').length(6).alphanum().uppercase()
      })

      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'abc123' }).valid).toBe(false) // 不是大写
      expect(validate(schema, { code: 'ABC12' }).valid).toBe(false)  // 长度不对
      expect(validate(schema, { code: 'ABC-12' }).valid).toBe(false) // 包含特殊字符
    })
  })
})
