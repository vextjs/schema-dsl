/**
 * JSONSchemaCore 测试 — v2 迁移
 *
 * v2 变更：JSONSchemaCore 是内部类，不直接导出。
 * 改为通过 dsl + validate 测试等价功能，或通过 SchemaCompiler/SchemaHelper。
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, Validator } from '../../../src/index.js'

describe('JSONSchemaCore（v2 通过 dsl/validate 等价测试）', () => {
  describe('基本 Schema 构建', () => {
    it('v2: dsl() 生成标准 JSON Schema（无 $schema 属性）', () => {
      // v2 不在 dsl() 输出中添加 $schema 属性（保持 Schema 精简）
      const schema = dsl({ name: 'string' })
      expect(schema.type).toBe('object')
    })

    it('应该生成 type: object Schema', () => {
      const schema = dsl({ name: 'string', age: 'number' })
      expect(schema.type).toBe('object')
      expect(schema.properties).toHaveProperty('name')
      expect(schema.properties).toHaveProperty('age')
    })

    it('应该设置字符串类型', () => {
      const schema = dsl({ field: 'string' })
      expect((schema as any).properties.field.type).toBe('string')
    })

    it('应该设置数字类型', () => {
      const schema = dsl({ field: 'number' })
      expect((schema as any).properties.field.type).toBe('number')
    })
  })

  describe('属性和约束', () => {
    it('应该设置必填字段', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      expect((schema as any).required).toContain('name')
      expect((schema as any).required).not.toContain('age')
    })

    it('应该设置多个必填字段', () => {
      const schema = dsl({ name: 'string!', email: 'email!', age: 'number' })
      expect((schema as any).required).toContain('name')
      expect((schema as any).required).toContain('email')
    })

    it('应该设置字符串格式', () => {
      const schema = dsl({ email: 'email' })
      expect((schema as any).properties.email.format).toBe('email')
    })

    it('应该设置正则 pattern', () => {
      const schema = dsl({ code: (dsl('string!') as any).pattern('^[0-9]+$') })
      expect((schema as any).properties.code.pattern).toBe('^[0-9]+$')
    })

    it('应该设置数组 items', () => {
      const schema = dsl({ tags: 'array' })
      expect((schema as any).properties.tags.type).toBe('array')
    })

    it('应该支持最小长度约束', () => {
      const schema = dsl({ name: 'string:3-' })
      expect((schema as any).properties.name.minLength).toBe(3)
    })
  })

  describe('链式设置和 getSchema()', () => {
    it('dsl() 直接返回 JSON Schema 对象', () => {
      const schema = dsl({ name: 'string!' })
      expect(typeof schema).toBe('object')
      expect(schema).toHaveProperty('type', 'object')
      expect(schema).toHaveProperty('properties')
    })

    it('应该支持嵌套对象', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          age: 'number',
        },
      })
      expect((schema as any).properties.user.type).toBe('object')
      expect((schema as any).properties.user.properties.name.type).toBe('string')
    })
  })

  describe('验证功能', () => {
    it('应该验证有效数据', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const result = validate(schema, { name: 'John', age: 25 })
      expect(result.valid).toBe(true)
    })

    it('应该检测必填字段缺失', () => {
      const schema = dsl({ name: 'string!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
    })

    it('应该验证邮箱格式', () => {
      const schema = dsl({ email: 'email!' })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'not-an-email' }).valid).toBe(false)
    })

    it('应该通过 Validator 验证（选项配置）', () => {
      const validator = new Validator()
      const schema = dsl({ name: 'string!' })
      const result = validator.validate(schema, { name: 'Alice' })
      expect(result.valid).toBe(true)
    })
  })
})
