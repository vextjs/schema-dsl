/**
 * v2.0.1 新功能测试 — v2 迁移（v1 array-dsl-features.test.js）
 * 数组DSL语法 + Schema复用 + Schema扩展 + 批量验证
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, SchemaUtils, Validator } from '../../src/index.js'

describe('v2.0.1 新功能测试', () => {
  // ========== 1. 数组DSL语法 ==========
  describe('数组DSL语法', () => {
    it('应该支持 array!1-10 语法', () => {
      const schema = dsl({ tags: 'array!1-10' })
      expect((schema as any).properties.tags.type).toBe('array')
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).required).toContain('tags')
    })

    it('应该支持 array:1-10 语法（可选）', () => {
      const schema = dsl({ tags: 'array:1-10' })
      expect((schema as any).properties.tags.type).toBe('array')
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).required ?? []).not.toContain('tags')
    })

    it('应该支持 array!1- 语法（只有最小值）', () => {
      const schema = dsl({ tags: 'array!1-' })
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBeUndefined()
    })

    it('应该支持 array!-10 语法（只有最大值）', () => {
      const schema = dsl({ tags: 'array!-10' })
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).properties.tags.minItems).toBeUndefined()
    })

    it('应该验证数组长度', () => {
      const schema = dsl({ tags: 'array!1-3' })
      expect(validate(schema, { tags: ['a', 'b'] }).valid).toBe(true)
      expect(validate(schema, { tags: [] }).valid).toBe(false)
      expect(validate(schema, { tags: ['a', 'b', 'c', 'd'] }).valid).toBe(false)
    })
  })

  // ========== 2. Schema复用 ==========
  describe('Schema复用', () => {
    it('应该支持reusable创建可复用字段', () => {
      const emailField = SchemaUtils.reusable(() => dsl('email!'))

      const schema1 = dsl({ email: emailField() })
      const schema2 = dsl({ contact: emailField() })

      expect((schema1 as any).properties.email.format).toBe('email')
      expect((schema2 as any).properties.contact.format).toBe('email')
    })

    it('应该支持createLibrary创建字段库', () => {
      const fields = SchemaUtils.createLibrary({
        email: () => 'email!',
        phone: () => 'string:-11',
      })

      const schema = dsl({
        email: fields.email(),
        phone: fields.phone(),
      })

      expect((schema as any).properties.email.format).toBe('email')
      expect((schema as any).properties.phone.maxLength).toBe(11)
    })
  })

  // ========== 3. Schema 扩展 ==========
  describe('Schema扩展', () => {
    it('应该扩展Schema', () => {
      const schema1 = dsl({ name: 'string!' })
      const extended = SchemaUtils.extend(schema1, dsl({ age: 'number' }))

      expect(Object.keys((extended as any).properties)).toHaveLength(2)
      expect((extended as any).properties.name).toBeDefined()
      expect((extended as any).properties.age).toBeDefined()
      expect((extended as any).required).toContain('name')
    })

    it('应该支持pick筛选字段', () => {
      const full = dsl({ name: 'string!', email: 'email!', password: 'string!' })
      const picked = SchemaUtils.pick(full, ['name', 'email'])

      expect(Object.keys((picked as any).properties)).toHaveLength(2)
      expect((picked as any).properties.password).toBeUndefined()
    })

    it('应该支持omit排除字段', () => {
      const full = dsl({ name: 'string!', email: 'email!', password: 'string!' })
      const omitted = SchemaUtils.omit(full, ['password'])

      expect(Object.keys((omitted as any).properties)).toHaveLength(2)
      expect((omitted as any).properties.password).toBeUndefined()
    })
  })

  // ========== 4. 批量验证 ==========
  describe('批量验证', () => {
    it('应该批量验证多条数据', () => {
      const schema = dsl({ email: 'email!' })
      const data = [
        { email: 'valid1@example.com' },
        { email: 'invalid' },
        { email: 'valid2@example.com' },
      ]

      const result = SchemaUtils.validateBatch(schema, data, new Validator())

      expect(result.summary.total).toBe(3)
      expect(result.summary.valid).toBe(2)
      expect(result.summary.invalid).toBe(1)
      expect(result.results).toHaveLength(3)
    })

    it('批量验证应该包含性能统计', () => {
      const schema = dsl({ email: 'email!' })
      const data = [{ email: 'test@example.com' }]

      const result = SchemaUtils.validateBatch(schema, data, new Validator())

      expect(result.summary).toBeDefined()
      expect(typeof result.summary.total).toBe('number')
    })
  })
})
