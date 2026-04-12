/**
 * 完整类型系统测试 — v2 迁移（v1 types-complete.test.js）
 *
 * 测试所有 18+ 种类型的解析和验证（100% 兼容 v1）
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../../src/index.js'

describe('完整类型系统测试', () => {
  // ========== 基本类型（8种）==========
  describe('基本类型', () => {
    it('应该支持 string 类型', () => {
      const schema = dsl({ field: 'string' })
      expect((schema as any).properties.field.type).toBe('string')
      expect(validate(schema, { field: 'hello' }).valid).toBe(true)
      expect(validate(schema, { field: 123 }).valid).toBe(false)
    })

    it('应该支持 number 类型', () => {
      const schema = dsl({ field: 'number' })
      expect((schema as any).properties.field.type).toBe('number')
      expect(validate(schema, { field: 3.14 }).valid).toBe(true)
      expect(validate(schema, { field: 'abc' }).valid).toBe(false)
    })

    it('应该支持 integer 类型', () => {
      const schema = dsl({ field: 'integer' })
      expect((schema as any).properties.field.type).toBe('integer')
      expect(validate(schema, { field: 42 }).valid).toBe(true)
      expect(validate(schema, { field: 3.14 }).valid).toBe(false)
    })

    it('应该支持 boolean 类型', () => {
      const schema = dsl({ field: 'boolean' })
      expect((schema as any).properties.field.type).toBe('boolean')
      expect(validate(schema, { field: true }).valid).toBe(true)
      expect(validate(schema, { field: 'true' }).valid).toBe(false)
    })

    it('应该支持 object 类型', () => {
      const schema = dsl({ field: 'object' })
      expect((schema as any).properties.field.type).toBe('object')
      expect(validate(schema, { field: { a: 1 } }).valid).toBe(true)
      expect(validate(schema, { field: 'not object' }).valid).toBe(false)
    })

    it('应该支持 array 类型', () => {
      const schema = dsl({ field: 'array' })
      expect((schema as any).properties.field.type).toBe('array')
      expect(validate(schema, { field: [1, 2, 3] }).valid).toBe(true)
      expect(validate(schema, { field: 'not array' }).valid).toBe(false)
    })

    it('应该支持 null 类型', () => {
      const schema = dsl({ field: 'null' })
      expect((schema as any).properties.field.type).toBe('null')
      expect(validate(schema, { field: null }).valid).toBe(true)
      expect(validate(schema, { field: 'not null' }).valid).toBe(false)
    })

    it('应该支持 any 类型', () => {
      const schema = dsl({ field: 'any' })
      expect((schema as any).properties.field.type).toBeUndefined()
      expect(validate(schema, { field: 'string' }).valid).toBe(true)
      expect(validate(schema, { field: 123 }).valid).toBe(true)
      expect(validate(schema, { field: null }).valid).toBe(true)
      expect(validate(schema, { field: { a: 1 } }).valid).toBe(true)
    })
  })

  // ========== 格式类型（9种）==========
  describe('格式类型', () => {
    it('应该支持 email 类型', () => {
      const schema = dsl({ field: 'email' })
      expect((schema as any).properties.field.type).toBe('string')
      expect((schema as any).properties.field.format).toBe('email')
      expect(validate(schema, { field: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-email' }).valid).toBe(false)
    })

    it('应该支持 url 类型', () => {
      const schema = dsl({ field: 'url' })
      expect((schema as any).properties.field.format).toBe('uri')
      expect(validate(schema, { field: 'https://example.com' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-url' }).valid).toBe(false)
    })

    it('应该支持 date 类型', () => {
      const schema = dsl({ field: 'date' })
      expect(validate(schema, { field: '2025-01-01' }).valid).toBe(true)
    })

    it('应该支持 datetime 类型', () => {
      const schema = dsl({ field: 'datetime' })
      expect(validate(schema, { field: '2025-01-01T10:00:00Z' }).valid).toBe(true)
    })

    it('应该支持 uuid 类型', () => {
      const schema = dsl({ field: 'uuid' })
      expect(validate(schema, { field: '550e8400-e29b-41d4-a716-446655440000' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-uuid' }).valid).toBe(false)
    })

    it('应该支持 ip 类型（任意 IPv4 或 IPv6 均合法）', () => {
      // v2 TypeRegistry 只有 ipv4 / ipv6，无通用 ip 类型
      const schema = dsl({ field: 'ip' })
      expect(validate(schema, { field: '192.168.1.1' }).valid).toBe(true)
      expect(validate(schema, { field: 'not-ip' }).valid).toBe(false)
    })

    it('应该支持 ipv4 类型', () => {
      const schema = dsl({ field: 'ipv4' })
      expect(validate(schema, { field: '192.168.1.1' }).valid).toBe(true)
    })

    it('应该支持 ipv6 类型', () => {
      const schema = dsl({ field: 'ipv6' })
      expect(validate(schema, { field: '::1' }).valid).toBe(true)
    })

    it('应该支持 hostname 类型', () => {
      const schema = dsl({ field: 'hostname' })
      expect(validate(schema, { field: 'example.com' }).valid).toBe(true)
    })
  })

  // ========== 枚举类型 ==========
  describe('枚举类型', () => {
    it('应该支持字符串枚举（pipe 语法）', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive', 'pending'])
      expect(validate(schema, { status: 'active' }).valid).toBe(true)
      expect(validate(schema, { status: 'invalid' }).valid).toBe(false)
    })

    it('应该支持必填枚举', () => {
      const schema = dsl({ status: 'active|inactive!' })
      expect((schema as any).required).toContain('status')
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive'])
    })
  })

  // ========== 约束语法 ==========
  describe('约束语法', () => {
    it('string:N-M 应设置 minLength 和 maxLength', () => {
      const schema = dsl({ name: 'string:3-32' })
      expect((schema as any).properties.name.minLength).toBe(3)
      expect((schema as any).properties.name.maxLength).toBe(32)
    })

    it('string:N 应设置 exactLength（精确长度）', () => {
      const schema = dsl({ code: 'string:6' })
      expect((schema as any).properties.code.exactLength).toBe(6)
    })

    it('string:N- 应只设置 minLength', () => {
      const schema = dsl({ name: 'string:3-' })
      expect((schema as any).properties.name.minLength).toBe(3)
      expect((schema as any).properties.name.maxLength).toBeUndefined()
    })

    it('string:-M 应只设置 maxLength', () => {
      const schema = dsl({ name: 'string:-100' })
      expect((schema as any).properties.name.maxLength).toBe(100)
    })

    it('number:N-M 应设置 minimum 和 maximum', () => {
      const schema = dsl({ age: 'number:0-150' })
      expect((schema as any).properties.age.minimum).toBe(0)
      expect((schema as any).properties.age.maximum).toBe(150)
    })

    it('! 标记应设置必填', () => {
      const schema = dsl({ name: 'string!' })
      expect((schema as any).required).toContain('name')
    })
  })

  // ========== v2 新类型 ==========
  describe('v2 新类型', () => {
    it('应该支持 objectId 类型', () => {
      const schema = dsl({ id: 'objectId' })
      expect((schema as any).properties.id).toBeDefined()
    })

    it('应该支持 hexColor 类型', () => {
      const schema = dsl({ color: 'hexColor' })
      expect((schema as any).properties.color).toBeDefined()
      expect(validate(schema, { color: '#ff0000' }).valid).toBe(true)
    })

    it('应该支持 mac 类型', () => {
      const schema = dsl({ mac: 'mac' })
      expect((schema as any).properties.mac).toBeDefined()
    })

    it('应该支持 cron 类型', () => {
      const schema = dsl({ schedule: 'cron' })
      expect((schema as any).properties.schedule).toBeDefined()
    })
  })
})
