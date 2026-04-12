/**
 * DslBuilder v1.0.2 Extensions 测试 — v2 迁移
 *
 * v2 变更：
 * - alphanum/lower/upper/json/port 不再是 DSL 字符串类型（'alphanum:3-20!'）
 * - 改为通过 DslBuilder 链式方法 .alphanum()/.lowercase()/.uppercase()/.json()
 * - exactLength 替代 maxLength 用于单值约束（DA-03）
 * - installStringExtensions 手动调用
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, validate, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder - v1.0.2 扩展验证器', () => {
  describe('链式方法替代 DSL 类型字符串', () => {
    it('应该支持 .alphanum() 链式方法', () => {
      const schema = dsl({ username: (dsl('string:3-20!') as any).alphanum() })
      const p = (schema as any).properties.username
      expect(p.type).toBe('string')
      expect(p.alphanum).toBe(true)
      expect(p.minLength).toBe(3)
      expect(p.maxLength).toBe(20)
    })

    it('应该支持 .lowercase() 链式方法', () => {
      const schema = dsl({ email: (dsl('string!') as any).lowercase() })
      expect((schema as any).properties.email.type).toBe('string')
      expect((schema as any).properties.email.lowercase).toBe(true)
    })

    it('应该支持 .uppercase() 链式方法', () => {
      const schema = dsl({ country: (dsl('string!') as any).uppercase().length(2) })
      const p = (schema as any).properties.country
      expect(p.type).toBe('string')
      expect(p.uppercase).toBe(true)
    })

    it('应该支持 .json() 链式方法', () => {
      const schema = dsl({ config: (dsl('string!') as any).json() })
      expect((schema as any).properties.config.type).toBe('string')
      expect((schema as any).properties.config.jsonString).toBe(true)
    })

    it('应该支持 .port() 链式方法', () => {
      const schema = dsl({ port: (dsl('integer!') as any).port() })
      expect((schema as any).properties.port.type).toBe('integer')
      expect((schema as any).properties.port.port).toBe(true)
    })
  })

  describe('链式调用', () => {
    it('应该支持 .dateGreater() 链式调用', () => {
      const schema = dsl({ endDate: ('string!' as any).dateGreater('2025-01-01') })
      expect((schema as any).properties.endDate.dateGreater).toBe('2025-01-01')
    })

    it('应该支持 .dateLess() 链式调用', () => {
      const schema = dsl({ startDate: ('string!' as any).dateLess('2025-12-31') })
      expect((schema as any).properties.startDate.dateLess).toBe('2025-12-31')
    })

    it('应该支持 .label() + .alphanum() 组合', () => {
      const schema = dsl({
        username: (dsl('string:3-20!') as any).alphanum().label('用户名'),
      })
      const p = (schema as any).properties.username
      expect(p.alphanum).toBe(true)
      expect(p.minLength).toBe(3)
      expect(p.maxLength).toBe(20)
    })
  })

  describe('验证功能', () => {
    it('alphanum 应该验证字母和数字', () => {
      const schema = dsl({ username: (dsl('string!') as any).alphanum() })
      expect(validate(schema, { username: 'user123' }).valid).toBe(true)
      expect(validate(schema, { username: 'user_123' }).valid).toBe(false)
    })

    it('lowercase 应该验证小写', () => {
      const schema = dsl({ email: (dsl('string!') as any).lowercase() })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'Test@example.com' }).valid).toBe(false)
    })

    it('uppercase 应该验证大写', () => {
      const schema = dsl({ country: (dsl('string:2!') as any).uppercase() })
      expect(validate(schema, { country: 'CN' }).valid).toBe(true)
      expect(validate(schema, { country: 'cn' }).valid).toBe(false)
    })

    it('port 应该验证端口号', () => {
      const schema = dsl({ port: (dsl('integer!') as any).port() })
      expect(validate(schema, { port: 3000 }).valid).toBe(true)
      expect(validate(schema, { port: 0 }).valid).toBe(false)
      expect(validate(schema, { port: 65536 }).valid).toBe(false)
    })
  })

  describe('组合使用', () => {
    it('应该支持 .alphanum() + 单值长度', () => {
      const schema = dsl({ code: (dsl('string:6!') as any).alphanum() })
      expect((schema as any).properties.code.alphanum).toBe(true)
      expect((schema as any).properties.code.exactLength).toBe(6)

      expect(validate(schema, { code: 'ABC123' }).valid).toBe(true)
      expect(validate(schema, { code: 'ABC1234' }).valid).toBe(false) // exceeds exactLength:6
    })

    it('应该支持 .alphanum() + .label()', () => {
      const schema = dsl({
        username: (dsl('string:3-20!') as any).alphanum().label('用户名'),
      })
      expect(validate(schema, { username: 'user123' }).valid).toBe(true)
      expect(validate(schema, { username: 'user_123' }).valid).toBe(false)
    })
  })
})
