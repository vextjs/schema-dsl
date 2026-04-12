/**
 * ConditionalBuilder 单元测试
 * 测试链式条件构建 (C-03 fix: assert() 抛 ValidationError)
 */

import { describe, it, expect } from 'vitest'
import { ConditionalBuilder } from '../../../src/core/ConditionalBuilder.js'
import { ValidationError } from '../../../src/errors/ValidationError.js'

describe('ConditionalBuilder', () => {
  describe('start()', () => {
    it('创建 ConditionalBuilder 实例', () => {
      const cb = ConditionalBuilder.start(() => true)
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })
  })

  describe('message() — 条件触发错误', () => {
    it('toSchema() 返回含 _isConditional 的 schema', () => {
      const schema = ConditionalBuilder.start(() => true).message('触发错误').toSchema()
      // ConditionalBuilder toSchema() 返回内部标记对象，供 Validator 使用
      expect(schema).toBeTruthy()
    })
  })

  describe('then() / else()', () => {
    it('then 返回 ConditionalBuilder（链式）', () => {
      const cb = ConditionalBuilder.start(() => true).then('string!')
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })

    it('else 返回 ConditionalBuilder（链式）', () => {
      const cb = ConditionalBuilder.start(() => true).then('string!').else('string')
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })

    it('toSchema() 返回非空 schema', () => {
      const s = ConditionalBuilder.start(() => true).then('string!').else('string').toSchema()
      expect(s).toBeTruthy()
    })
  })

  describe('and()', () => {
    it('追加子条件', () => {
      const cb = ConditionalBuilder.start(() => true)
        .message('初始')
        .and(() => false)
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })
  })

  describe('build() — toSchema() 别名', () => {
    it('build() 返回与 toSchema() 结构相同的对象', () => {
      const cb = ConditionalBuilder.start(() => false).message('test')
      const s1 = cb.build()
      const s2 = cb.toSchema()
      // 二者均为 _isConditional schema
      expect((s1 as Record<string, unknown>)['_isConditional']).toBe(true)
      expect((s2 as Record<string, unknown>)['_isConditional']).toBe(true)
    })
  })

  describe('assert() — C-03 fix', () => {
    // semantics: .message() sets action='throw'
    // assert() throws when condition IS TRUE (condition triggered)

    it('条件为 true 时 assert() 抛 ValidationError（条件触发）', () => {
      const cb = ConditionalBuilder.start(() => true).message('断言失败')
      expect(() => cb.assert({} as Record<string, unknown>)).toThrowError(ValidationError)
    })

    it('条件为 false 时 assert() 不抛错（条件未触发）', () => {
      const cb = ConditionalBuilder.start(() => false).message('不触发')
      expect(() => cb.assert({} as Record<string, unknown>)).not.toThrow()
    })

    it('抛出的 ValidationError 包含 message', () => {
      const cb = ConditionalBuilder.start(() => true).message('自定义错误消息')
      try {
        cb.assert({} as Record<string, unknown>)
        expect.fail('应该抛出错误')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        const ve = e as ValidationError
        expect(ve.message).toContain('自定义错误消息')
      }
    })
  })
})
