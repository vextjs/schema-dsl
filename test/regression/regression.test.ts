/**
 * 回归测试 — v1 全量核心用例迁移
 *
 * 基于 v1 测试文件迁移的核心回归基线，确保 v2 行为与 v1 公开 API 兼容
 */

import { describe, it, expect } from 'vitest'
import { DslAdapter } from '../../src/adapters/DslAdapter.js'
import { Validator } from '../../src/core/Validator.js'
import { DslBuilder } from '../../src/core/DslBuilder.js'

const validator = new Validator()

// ==================== DslAdapter 回归 ====================

describe('[Regression] DslAdapter — v1 行为兼容', () => {
  describe('parse() / parseString() — 基本类型', () => {
    it('string', () => expect(DslAdapter.parse('string').type).toBe('string'))
    it('number', () => expect(DslAdapter.parse('number').type).toBe('number'))
    it('boolean', () => expect(DslAdapter.parse('boolean').type).toBe('boolean'))
    it('integer', () => expect(DslAdapter.parse('integer').type).toBe('integer'))
    it('email → format:email', () => {
      const s = DslAdapter.parse('email')
      expect(s.type).toBe('string')
      expect(s.format).toBe('email')
    })
    it('url → format:uri', () => expect(DslAdapter.parse('url').format).toBe('uri'))
    it('uuid → format:uuid', () => expect(DslAdapter.parse('uuid').format).toBe('uuid'))
    it('date → format:date', () => expect(DslAdapter.parse('date').format).toBe('date'))
    it('datetime → format:date-time', () => expect(DslAdapter.parse('datetime').format).toBe('date-time'))
  })

  describe('parse() — 约束', () => {
    it('string:3-32 → minLength/maxLength', () => {
      const s = DslAdapter.parse('string:3-32')
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('string:100 → exactLength:100', () => {
      const s = DslAdapter.parse('string:100')
      // string:N → exactLength:N（精确长度）
      expect(s.exactLength).toBe(100)
    })

    it('number:0-100 → minimum/maximum', () => {
      const s = DslAdapter.parse('number:0-100')
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })
  })

  describe('parse() — 必填标记', () => {
    it('string! → _required: true', () => expect(DslAdapter.parse('string!')._required).toBe(true))
    it('string → _required 字段不存在（SchemaCompiler 只在 required=true 时注入）', () => {
      // DslAdapter.parse 底层走 DslParser.parseString，只在 ! 时注入 _required
      expect(DslAdapter.parse('string')._required).toBeFalsy()
    })
    it('email! → required + format', () => {
      const s = DslAdapter.parse('email!')
      expect(s._required).toBe(true)
      expect(s.format).toBe('email')
    })
  })

  describe('parseObject() — 对象 DSL', () => {
    it('required 字段收集到 required[]', () => {
      // BC-2: parseObject() returns ObjectDslBuilder; call .toSchema() for JSONSchema access
      const schema = DslAdapter.parseObject({ name: 'string!', age: 'number' }).toSchema()
      expect(schema.required).toContain('name')
      expect(schema.required).not.toContain('age')
    })

    it('嵌套对象处理', () => {
      const schema = DslAdapter.parseObject({ user: { name: 'string!', age: 'number' } }).toSchema()
      expect(schema.properties?.['user']?.type).toBe('object')
    })
  })
})

// ==================== Validator 回归 ====================

describe('[Regression] Validator — v1 行为兼容', () => {
  it('验证有效对象', () => {
    const schema = {
      type: 'object' as const,
      properties: { name: { type: 'string' as const }, age: { type: 'number' as const } },
      required: ['name'],
    }
    const r = validator.validate(schema, { name: 'John', age: 25 }) as { valid: boolean }
    expect(r.valid).toBe(true)
  })

  it('检测缺少必填字段', () => {
    const schema = {
      type: 'object' as const,
      properties: { name: { type: 'string' as const } },
      required: ['name'],
    }
    const r = validator.validate(schema, { age: 'invalid' }) as { valid: boolean }
    expect(r.valid).toBe(false)
  })

  it('验证字符串长度约束', () => {
    const schema = { type: 'string' as const, minLength: 3, maxLength: 10 }
    expect((validator.validate(schema, 'abc') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'ab') as { valid: boolean }).valid).toBe(false)
    expect((validator.validate(schema, 'abcdefghijk') as { valid: boolean }).valid).toBe(false)
  })

  it('format:email 验证', () => {
    const schema = { type: 'string' as const, format: 'email' }
    expect((validator.validate(schema, 'user@example.com') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'invalid') as { valid: boolean }).valid).toBe(false)
  })

  it('enum 约束', () => {
    const schema = { type: 'string' as const, enum: ['a', 'b', 'c'] }
    expect((validator.validate(schema, 'a') as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, 'd') as { valid: boolean }).valid).toBe(false)
  })

  it('number minimum/maximum', () => {
    const schema = { type: 'number' as const, minimum: 0, maximum: 100 }
    expect((validator.validate(schema, 50) as { valid: boolean }).valid).toBe(true)
    expect((validator.validate(schema, -1) as { valid: boolean }).valid).toBe(false)
    expect((validator.validate(schema, 101) as { valid: boolean }).valid).toBe(false)
  })
})

// ==================== DslBuilder 回归 ====================

describe('[Regression] DslBuilder — v1 行为兼容', () => {
  it('string! 链式，toJsonSchema() 剥离内部键', () => {
    const json = new DslBuilder('string!').label('姓名').toJsonSchema()
    expect('_required' in json).toBe(false)
    expect('_label' in json).toBe(false)
    expect(json.type).toBe('string')
  })

  it('enum() 数组正确', () => {
    const s = new DslBuilder('string').enum('a', 'b').toSchema()
    expect(s.enum).toEqual(['a', 'b'])
  })

  it('default() 值正确', () => {
    const s = new DslBuilder('string').default('hello').toSchema()
    expect(s.default).toBe('hello')
  })

  it('number:0-100! 直接 DSL 解析', () => {
    const s = new DslBuilder('number:0-100!').toSchema()
    expect(s.minimum).toBe(0)
    expect(s.maximum).toBe(100)
    expect(s._required).toBe(true)
  })

  it('toString() 返回 JSON 序列化的 JSON Schema（非原始 DSL）', () => {
    const str = new DslBuilder('email!').toString()
    const parsed = JSON.parse(str) as { type: string; format: string }
    expect(parsed.type).toBe('string')
    expect(parsed.format).toBe('email')
  })
})
