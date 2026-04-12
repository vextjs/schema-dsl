/**
 * Validator 完整测试 — v2 迁移（v1 Validator-complete.test.js）
 *
 * v2 变更：
 * - 字符串扩展（.username()/.phone()/.password()）需要 installStringExtensions
 * - array<string:1-20> 语法不支持，改为 'array'
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { dsl, validate, installStringExtensions, uninstallStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

afterAll(() => {
  uninstallStringExtensions(dsl as any)
})

describe('Validator - 完整验证测试', () => {
  describe('边界条件验证', () => {
    it('应正确验证字符串最小长度边界', () => {
      const schema = dsl({ username: 'string:3-32' })
      expect(validate(schema, { username: 'ab' }).valid).toBe(false)
      expect(validate(schema, { username: 'abc' }).valid).toBe(true)
    })

    it('应正确验证字符串最大长度边界', () => {
      const schema = dsl({ username: 'string:3-32' })
      const str32 = 'a'.repeat(32)
      const str33 = 'a'.repeat(33)
      expect(validate(schema, { username: str32 }).valid).toBe(true)
      expect(validate(schema, { username: str33 }).valid).toBe(false)
    })

    it('应正确验证数字最小值边界', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect(validate(schema, { age: 17 }).valid).toBe(false)
      expect(validate(schema, { age: 18 }).valid).toBe(true)
    })

    it('应正确验证数字最大值边界', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect(validate(schema, { age: 120 }).valid).toBe(true)
      expect(validate(schema, { age: 121 }).valid).toBe(false)
    })
  })

  describe('类型验证', () => {
    it('应检测字符串类型错误', () => {
      const schema = dsl({ name: 'string!' })
      expect(validate(schema, { name: 123 }).valid).toBe(false)
      expect(validate(schema, { name: true }).valid).toBe(false)
      expect(validate(schema, { name: [] }).valid).toBe(false)
      expect(validate(schema, { name: {} }).valid).toBe(false)
    })

    it('应检测数字类型错误', () => {
      const schema = dsl({ age: 'number!' })
      expect(validate(schema, { age: 'abc' }).valid).toBe(false)
      expect(validate(schema, { age: true }).valid).toBe(false)
      expect(validate(schema, { age: [] }).valid).toBe(false)
    })

    it('应检测布尔类型错误', () => {
      const schema = dsl({ active: 'boolean!' })
      expect(validate(schema, { active: 'true' }).valid).toBe(false)
      expect(validate(schema, { active: 1 }).valid).toBe(false)
      expect(validate(schema, { active: [] }).valid).toBe(false)
    })

    it('应检测整数类型', () => {
      const schema = dsl({ count: 'integer!' })
      expect(validate(schema, { count: 10 }).valid).toBe(true)
      expect(validate(schema, { count: 10.5 }).valid).toBe(false)
    })
  })

  describe('格式验证', () => {
    it('应验证 email 格式', () => {
      const schema = dsl({ email: 'email!' })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'invalid-email' }).valid).toBe(false)
    })

    it('应验证 url 格式', () => {
      const schema = dsl({ website: 'url!' })
      expect(validate(schema, { website: 'https://example.com' }).valid).toBe(true)
      expect(validate(schema, { website: 'not-a-url' }).valid).toBe(false)
    })

    it('应验证 uuid 格式', () => {
      const schema = dsl({ id: 'uuid!' })
      expect(validate(schema, { id: '550e8400-e29b-41d4-a716-446655440000' }).valid).toBe(true)
      expect(validate(schema, { id: 'not-uuid' }).valid).toBe(false)
    })
  })

  describe('嵌套对象验证', () => {
    it('应验证嵌套对象结构', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          age: 'number:0-150',
        },
      })
      expect(validate(schema, { user: { name: 'John', age: 25 } }).valid).toBe(true)
      expect(validate(schema, { user: { age: 25 } }).valid).toBe(false)
    })

    it('应验证深层嵌套', () => {
      const schema = dsl({
        a: {
          b: {
            c: 'string!',
          },
        },
      })
      expect(validate(schema, { a: { b: { c: 'deep' } } }).valid).toBe(true)
      expect(validate(schema, { a: { b: {} } }).valid).toBe(false)
    })
  })

  describe('必填字段验证', () => {
    it('应检测缺失的必填字段', () => {
      const schema = dsl({ name: 'string!', email: 'email!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(2)
    })

    it('可选字段不提供时应通过', () => {
      const schema = dsl({ name: 'string!' })
      expect(validate(schema, { name: 'John' }).valid).toBe(true)
    })
  })

  describe('枚举值验证', () => {
    it('应验证枚举值', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect(validate(schema, { status: 'active' }).valid).toBe(true)
      expect(validate(schema, { status: 'unknown' }).valid).toBe(false)
    })
  })

  describe('复杂场景', () => {
    it('应验证复杂表单（v2 不支持 array<string> 语法，用 array 代替）', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120!',
        gender: 'male|female',
        website: 'url',
        bio: 'string:-500',    // string:-500 → maxLength:500
        tags: 'array',
      })

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
        gender: 'male',
        website: 'https://example.com',
        bio: 'Hello world',
        tags: ['javascript', 'nodejs'],
      }

      expect(validate(schema, validData).valid).toBe(true)
    })

    it('应检测复杂表单的多个错误', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120!',
      })

      const invalidData = {
        username: 'ab',     // 太短
        email: 'invalid',   // 格式错误
        age: 150,           // 超出范围
      }

      const result = validate(schema, invalidData)
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('默认验证器验证（需要 installStringExtensions）', () => {
    it('应验证 username 格式', () => {
      const schema = dsl({
        username: ('string!' as any).username(),
      })

      expect(validate(schema, { username: 'john_doe' }).valid).toBe(true)
      expect(validate(schema, { username: 'ab' }).valid).toBe(false)
      expect(validate(schema, { username: 'a'.repeat(33) }).valid).toBe(false)
    })

    it('应验证 phone 格式', () => {
      const schema = dsl({
        phone: ('string!' as any).phone('cn'),
      })

      expect(validate(schema, { phone: '13800138000' }).valid).toBe(true)
      expect(validate(schema, { phone: '1380013800' }).valid).toBe(false)
      expect(validate(schema, { phone: '138001380000' }).valid).toBe(false)
    })

    it('应验证 password 强度', () => {
      const schema = dsl({
        password: ('string!' as any).password('strong'),
      })

      expect(validate(schema, { password: 'Abc123456' }).valid).toBe(true)
      expect(validate(schema, { password: 'abc123' }).valid).toBe(false)
      expect(validate(schema, { password: 'abc' }).valid).toBe(false)
    })
  })

  describe('特殊情况', () => {
    it('应处理空对象', () => {
      const schema = dsl({ name: 'string' })
      expect(validate(schema, {}).valid).toBe(true)
    })

    it('应处理 null 值（类型错误）', () => {
      const schema = dsl({ name: 'string' })
      expect(validate(schema, { name: null }).valid).toBe(false)
    })

    it('应处理额外字段（默认允许）', () => {
      const schema = dsl({ name: 'string!' })
      const result = validate(schema, { name: 'John', extra: 'field' })
      expect(result.valid).toBe(true)
    })
  })
})
