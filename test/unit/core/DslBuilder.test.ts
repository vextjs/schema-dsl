/**
 * DslBuilder 单元测试
 * 测试链式 API 的全部约束方法与 toSchema() / toJsonSchema() 输出
 */

import { describe, it, expect } from 'vitest'
import { DslBuilder } from '../../../src/core/DslBuilder.js'

describe('DslBuilder', () => {
  describe('构造函数', () => {
    it('创建实例', () => {
      const b = new DslBuilder('string')
      expect(b).toBeInstanceOf(DslBuilder)
      expect(b._isDslBuilder).toBe(true)
    })

    it('解析基本类型', () => {
      expect(new DslBuilder('string').toSchema().type).toBe('string')
      expect(new DslBuilder('number').toSchema().type).toBe('number')
      expect(new DslBuilder('boolean').toSchema().type).toBe('boolean')
    })

    it('必填标记 ! — toSchema()._required = true', () => {
      const s = new DslBuilder('string!').toSchema()
      expect(s._required).toBe(true)
    })

    it('无 ! — toSchema()._required = false', () => {
      const s = new DslBuilder('string').toSchema()
      expect(s._required).toBe(false)
    })

    it('email 格式', () => {
      const s = new DslBuilder('email!').toSchema()
      expect(s.format).toBe('email')
      expect(s._required).toBe(true)
    })
  })

  describe('约束方法 — string 类型链式', () => {
    it('min() / max() — string 类型 → minLength/maxLength', () => {
      const s = new DslBuilder('string').min(3).max(32).toSchema()
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('length() — exactLength', () => {
      const s = new DslBuilder('string').length(6).toSchema()
      expect(s.exactLength).toBe(6)
    })

    it('min() 对 number 类型抛出错误', () => {
      expect(() => new DslBuilder('number').min(1)).toThrow()
    })

    it('label()', () => {
      const s = new DslBuilder('string').label('姓名').toSchema()
      expect(s._label).toBe('姓名')
    })

    it('description()', () => {
      const s = new DslBuilder('string').description('用户名称').toSchema()
      expect(s.description).toBe('用户名称')
    })

    it('pattern()', () => {
      const s = new DslBuilder('string').pattern(/^[a-z]+$/).toSchema()
      expect(s.pattern).toMatch(/\[a-z\]/)
    })

    it('enum()', () => {
      const s = new DslBuilder('string').enum('a', 'b', 'c').toSchema()
      expect(s.enum).toEqual(['a', 'b', 'c'])
    })

    it('default()', () => {
      const s = new DslBuilder('string').default('hello').toSchema()
      expect(s.default).toBe('hello')
    })

    it('optional() 清除必填', () => {
      const s = new DslBuilder('string!').optional().toSchema()
      expect(s._required).toBe(false)
    })

    it('required() 设置必填', () => {
      const s = new DslBuilder('string').required().toSchema()
      expect(s._required).toBe(true)
    })

    it('error() 设置自定义消息', () => {
      const s = new DslBuilder('string!').error({ required: '请输入姓名' }).toSchema()
      expect(s._customMessages?.['required']).toBe('请输入姓名')
    })
  })

  describe('number 类型约束（通过 DSL 字符串）', () => {
    it('number:0-100 → minimum/maximum', () => {
      const s = new DslBuilder('number:0-100').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })

    it('integer:1- → minimum only', () => {
      const s = new DslBuilder('integer:1-').toSchema()
      expect(s.minimum).toBe(1)
    })
  })

  describe('toJsonSchema()', () => {
    it('剥离内部键 _label/_required/_customMessages', () => {
      const json = new DslBuilder('string!').label('姓名').toJsonSchema()
      expect('_label' in json).toBe(false)
      expect('_required' in json).toBe(false)
      expect('_customMessages' in json).toBe(false)
    })

    it('保留 minLength/maxLength', () => {
      const json = new DslBuilder('string').min(3).max(32).toJsonSchema()
      expect(json.minLength).toBe(3)
      expect(json.maxLength).toBe(32)
    })
  })

  describe('toString()', () => {
    it('返回 JSON 序列化的 JSON Schema（非 DSL 字符串）', () => {
      const b = new DslBuilder('email!')
      const str = b.toString()
      // toString() 返回 JSON.stringify(toJsonSchema())
      const parsed = JSON.parse(str)
      expect(parsed.type).toBe('string')
      expect(parsed.format).toBe('email')
    })
  })

  describe('DSL 字符串约束直接解析（DA-03 fix）', () => {
    it('string:6! → exactLength:6 + required', () => {
      const s = new DslBuilder('string:6!').toSchema()
      // string:N → exactLength:N（精确长度）
      expect(s.exactLength).toBe(6)
      expect(s._required).toBe(true)
    })

    it('number:0-100! → minimum:0 + maximum:100 + required', () => {
      const s = new DslBuilder('number:0-100!').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
      expect(s._required).toBe(true)
    })
  })
})
