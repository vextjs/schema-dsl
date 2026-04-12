/**
 * DslBuilder Extensions & Fixes 测试 — v2 迁移
 *
 * v2 变更：
 * - 使用 installStringExtensions（opt-in）
 * - SchemaUtils.createLibrary 仍然可用
 * - DslBuilder.validateNestingDepth 静态方法存在
 */

import { describe, it, expect } from 'vitest'
import { dsl, DslBuilder, SchemaUtils, installStringExtensions } from '../../../src/index.js'

installStringExtensions(dsl as any)

describe('DslBuilder Extensions & Fixes', () => {
  describe('Shortcut Methods', () => {
    it('should support phoneNumber() alias', () => {
      const schema = dsl('string').phoneNumber('cn')
      expect((schema as any)._baseSchema.pattern).toBeTruthy()
      expect((schema as any)._baseSchema.minLength).toBe(11)
    })

    it('should support idCard() for cn', () => {
      const schema = dsl('string').idCard('cn')
      expect((schema as any)._baseSchema.pattern).toBeTruthy()
      expect((schema as any)._baseSchema.minLength).toBe(18)
    })

    it('should throw error for unsupported idCard country', () => {
      expect(() => dsl('string').idCard('us')).toThrow('Unsupported country')
    })

    it('should support slug()', () => {
      const schema = dsl('string').slug()
      expect((schema as any)._baseSchema.pattern).toBe('^[a-z0-9]+(?:-[a-z0-9]+)*$')
    })
  })

  describe('Nesting Depth Check', () => {
    it('should correctly calculate nesting depth (ignoring leaf nodes)', () => {
      const deepSchema = dsl({
        level1: {
          level2: {
            level3: {
              value: 'string',
            },
          },
        },
      })

      const result = DslBuilder.validateNestingDepth(deepSchema, 2)
      expect(result.depth).toBe(3)
      expect(result.valid).toBe(false)
      expect(result.path).toContain('level1.level2.level3')
    })

    it('should pass when depth is within limit', () => {
      const schema = dsl({
        level1: {
          value: 'string',
        },
      })

      const result = DslBuilder.validateNestingDepth(schema, 2)
      expect(result.depth).toBe(1)
      expect(result.valid).toBe(true)
    })
  })

  describe('Schema Reuse', () => {
    it('should support createLibrary and reusable', () => {
      const fields = SchemaUtils.createLibrary({
        email: () => dsl('email!').label('邮箱'),
        phone: () => (dsl('string:11!') as any).phoneNumber('cn').label('手机号'),
      })

      const schema = dsl({
        contactEmail: fields.email(),
        contactPhone: fields.phone(),
      })

      expect((schema as any).properties.contactEmail.format).toBe('email')
      expect((schema as any).properties.contactPhone.minLength).toBe(11)
    })
  })
})
