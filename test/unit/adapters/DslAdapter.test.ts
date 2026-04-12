/**
 * DslAdapter 测试 — v2 迁移
 *
 * v2 变更：DslAdapter 委托 DslParser 实现，string:N 单值 → exactLength:N（DA-03 fix）
 * toCore() 依赖 JSONSchemaCore（v2 不导出），用 SchemaHelper.isValidSchema 替代
 */

import { describe, it, expect } from 'vitest'
import { DslAdapter } from '../../../src/adapters/DslAdapter.js'

describe('DslAdapter', () => {
  describe('parse() - 基本类型', () => {
    it('应该解析字符串类型', () => {
      const result = DslAdapter.parse('string')
      expect(result.type).toBe('string')
    })

    it('应该解析数字类型', () => {
      const result = DslAdapter.parse('number')
      expect(result.type).toBe('number')
    })

    it('应该解析布尔类型', () => {
      const result = DslAdapter.parse('boolean')
      expect(result.type).toBe('boolean')
    })
  })

  describe('parse() - 约束条件', () => {
    it('应该解析字符串长度范围', () => {
      const result = DslAdapter.parse('string:3-32')
      expect(result).toMatchObject({
        type: 'string',
        minLength: 3,
        maxLength: 32,
      })
    })

    it('应该解析数字范围', () => {
      const result = DslAdapter.parse('number:0-100')
      expect(result).toMatchObject({
        type: 'number',
        minimum: 0,
        maximum: 100,
      })
    })

    it('应该解析单值长度（string:N → exactLength）', () => {
      // string:100 → exactLength:100（精确长度）
      const result = DslAdapter.parse('string:100')
      expect(result).toMatchObject({
        type: 'string',
        exactLength: 100,
      })
    })
  })

  describe('parse() - 必填标记', () => {
    it('应该识别必填标记', () => {
      const result = DslAdapter.parse('string:3-32!')
      expect(result._required).toBe(true)
    })

    it('应该处理可选字段', () => {
      // v2: 无 ! 时 _required 不注入（为 falsy）
      const result = DslAdapter.parse('string:3-32')
      expect(result._required).toBeFalsy()
    })
  })

  describe('parse() - 格式类型', () => {
    it('应该解析 email 格式', () => {
      const result = DslAdapter.parse('email')
      expect(result).toMatchObject({
        type: 'string',
        format: 'email',
      })
    })

    it('应该解析 url 格式', () => {
      const result = DslAdapter.parse('url')
      expect(result).toMatchObject({
        type: 'string',
        format: 'uri',
      })
    })

    it('应该解析 uuid 格式', () => {
      const result = DslAdapter.parse('uuid')
      expect(result).toMatchObject({
        type: 'string',
        format: 'uuid',
      })
    })

    it('应该解析 date 格式', () => {
      const result = DslAdapter.parse('date')
      expect(result).toMatchObject({
        type: 'string',
        format: 'date',
      })
    })
  })

  describe('parse() - 枚举值', () => {
    it('应该解析枚举值', () => {
      const result = DslAdapter.parse('active|inactive|pending')
      expect(result).toMatchObject({
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      })
    })

    it('应该处理枚举值的空格', () => {
      const result = DslAdapter.parse('a | b | c')
      expect(result.enum).toEqual(['a', 'b', 'c'])
    })
  })

  describe('parse() - 数组类型', () => {
    it('应该解析 array<type> DSL 字符串语法', () => {
      const result = DslAdapter.parse('array<string>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'string' })
    })

    it('应该在对象上下文中解析带约束的数组', () => {
      const result = DslAdapter.parse('array<string:1-20>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
    })

    it('应该在对象上下文中解析数字数组', () => {
      const result = DslAdapter.parse('array<number:0-100>')
      expect(result.type).toBe('array')
      expect((result as any).items).toMatchObject({ type: 'number', minimum: 0, maximum: 100 })
    })

    it('应该解析带数组长度约束的 array:N-M<type> 语法', () => {
      const result = DslAdapter.parse('array:1-5<string:1-20>')
      expect(result.type).toBe('array')
      expect((result as any).minItems).toBe(1)
      expect((result as any).maxItems).toBe(5)
      expect((result as any).items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
    })
  })

  describe('parseObject() - 对象Schema', () => {
    it('应该解析简单对象', () => {
      const result = DslAdapter.parseObject({
        name: 'string!',
        age: 'number',
      })
      expect(result.type).toBe('object')
      expect(result.properties!.name).toEqual({ type: 'string' })
      expect(result.properties!.age).toEqual({ type: 'number' })
      expect(result.required).toEqual(['name'])
    })

    it('应该解析复杂对象', () => {
      const result = DslAdapter.parseObject({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
        status: 'active|inactive',
      })
      expect(result.properties!.username).toMatchObject({
        type: 'string',
        minLength: 3,
        maxLength: 32,
      })
      expect(result.properties!.email).toMatchObject({
        type: 'string',
        format: 'email',
      })
      expect((result.properties!.status as any).enum).toEqual(['active', 'inactive'])
      expect(result.required).toEqual(['username', 'email'])
    })

    it('应该解析嵌套对象', () => {
      const result = DslAdapter.parseObject({
        user: {
          name: 'string!',
          profile: {
            bio: 'string:500',
            website: 'url',
          },
        },
      })
      expect(result.properties!.user.type).toBe('object')
      expect((result.properties!.user as any).properties.name).toEqual({ type: 'string' })
      expect((result.properties!.user as any).properties.profile.type).toBe('object')
    })

    it('应该清理 _required 标记', () => {
      const result = DslAdapter.parseObject({
        name: 'string!',
        age: 'number',
      })
      expect(result.properties!.name).not.toHaveProperty('_required')
      expect(result.properties!.age).not.toHaveProperty('_required')
    })
  })

  describe('边界情况', () => {
    it('应该对空字符串抛出错误', () => {
      expect(() => DslAdapter.parse('')).toThrow()
    })

    it('应该对 null 输入抛出错误', () => {
      expect(() => DslAdapter.parse(null as any)).toThrow()
    })

    it('应该处理空对象', () => {
      const result = DslAdapter.parseObject({})
      expect(result.type).toBe('object')
      expect(result.properties).toEqual({})
    })
  })
})
