/**
 * DslParser 单元测试
 * 覆盖字符串解析 + 对象解析 + 负向测试
 */

import { describe, it, expect } from 'vitest'
import { DslParser } from '../../../src/parser/DslParser.js'

describe('DslParser', () => {
  describe('parseString() — 基本类型', () => {
    it('string', () => {
      const s = DslParser.parseString('string')
      expect(s.type).toBe('string')
    })

    it('number', () => {
      const s = DslParser.parseString('number')
      expect(s.type).toBe('number')
    })

    it('boolean', () => {
      const s = DslParser.parseString('boolean')
      expect(s.type).toBe('boolean')
    })

    it('email', () => {
      const s = DslParser.parseString('email')
      expect(s.type).toBe('string')
      expect(s.format).toBe('email')
    })

    it('url', () => {
      const s = DslParser.parseString('url')
      expect(s.format).toBe('uri')
    })

    it('uuid', () => {
      const s = DslParser.parseString('uuid')
      expect(s.format).toBe('uuid')
    })

    it('date', () => {
      const s = DslParser.parseString('date')
      expect(s.format).toBe('date')
    })
  })

  describe('parseString() — 长度/范围约束', () => {
    it('string:3-32 → minLength/maxLength', () => {
      const s = DslParser.parseString('string:3-32')
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('string:100 → exactLength:100', () => {
      const s = DslParser.parseString('string:100')
      // string:N → exactLength:N（精确长度）
      expect(s.exactLength).toBe(100)
    })

    it('number:0-100 → minimum/maximum', () => {
      const s = DslParser.parseString('number:0-100')
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })

    it('number:1- → minimum only (DA-01 fix)', () => {
      const s = DslParser.parseString('number:1-')
      expect(s.minimum).toBe(1)
      expect(s.maximum).toBeUndefined()
    })

    it('string:2- → minLength only', () => {
      const s = DslParser.parseString('string:2-')
      expect(s.minLength).toBe(2)
      expect(s.maxLength).toBeUndefined()
    })
  })

  describe('parseString() — 必填标记', () => {
    it('string! → _required: true', () => {
      const s = DslParser.parseString('string!')
      expect(s._required).toBe(true)
    })

    it('string (no !) → _required 字段不存在', () => {
      const s = DslParser.parseString('string')
      // SchemaCompiler 只在 required=true 时注入 _required
      expect(s._required).toBeFalsy()
    })

    it('email! → required + format', () => {
      const s = DslParser.parseString('email!')
      expect(s._required).toBe(true)
      expect(s.format).toBe('email')
    })

    it('number:0-100! → required + range', () => {
      const s = DslParser.parseString('number:0-100!')
      expect(s._required).toBe(true)
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })
  })

  describe('parseObject() — 对象 DSL', () => {
    it('扁平字段映射', () => {
      const schema = DslParser.parseObject({
        name: 'string!',
        age: 'number',
      })
      expect(schema.type).toBe('object')
      expect(schema.properties?.['name']?.type).toBe('string')
      expect(schema.properties?.['age']?.type).toBe('number')
    })

    it('required[] 收集必填字段', () => {
      const schema = DslParser.parseObject({
        name: 'string!',
        age: 'number',
        email: 'email!',
      })
      expect(schema.required).toContain('name')
      expect(schema.required).toContain('email')
      expect(schema.required).not.toContain('age')
    })

    it('嵌套对象', () => {
      const schema = DslParser.parseObject({
        user: {
          name: 'string!',
          age: 'number',
        },
      })
      expect(schema.properties?.['user']?.type).toBe('object')
      expect(schema.properties?.['user']?.properties?.['name']?.type).toBe('string')
    })

    it('空对象 → 无 required 数组', () => {
      const schema = DslParser.parseObject({ name: 'string' })
      expect(schema.required ?? []).not.toContain('name')
    })
  })

  describe('parseString() — 负向测试', () => {
    it('空字符串不抛错，返回合理 schema', () => {
      expect(() => DslParser.parseString('')).not.toThrow()
    })

    it('超大约束数字不崩溃', () => {
      const s = DslParser.parseString('string:0-99999999')
      expect(s.maxLength).toBe(99999999)
    })
  })
})
