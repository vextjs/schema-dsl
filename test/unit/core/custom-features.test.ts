/**
 * Custom Features & Error Messages 测试 — v2 迁移
 *
 * v2 变更：使用 installStringExtensions 启用字符串扩展（opt-in）
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { dsl, Validator, Locale, installStringExtensions } from '../../../src/index.js'

// v2: 手动安装字符串扩展
installStringExtensions(dsl as any)

describe('Custom Features & Error Messages', () => {
  let validator: InstanceType<typeof Validator>

  beforeEach(() => {
    validator = new Validator()
    Locale.setLocale('en-US')
  })

  describe('Custom Validators (.custom)', () => {
    it('should support synchronous validation returning string error', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return 'Cannot be admin'
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Cannot be admin')
    })

    it('should support synchronous validation returning boolean false', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return false
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Validation failed')
    })

    it('should support synchronous validation returning error object', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'admin') return { error: 'forbidden', message: 'Access denied' }
        }),
      })

      const result = validator.validate(schema, { username: 'admin' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Access denied')
    })

    it('should pass when returning nothing or true', () => {
      const schema = dsl({
        username: ('string!' as any).custom((value: string) => {
          if (value === 'user') return
          return true
        }),
      })

      const result = validator.validate(schema, { username: 'user' })
      expect(result.valid).toBe(true)
    })

    it('should throw error for async validator in sync validate', () => {
      const schema = dsl({
        username: ('string!' as any).custom(async (_value: string) => {
          return true
        }),
      })

      const result = validator.validate(schema, { username: 'user' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toContain('Async validation not supported')
    })
  })

  describe('Custom Labels & Messages', () => {
    it('should use custom label in required error', () => {
      const schemaWithMsg = dsl({
        username: ('string!' as any)
          .label('用户名')
          .messages({ required: '{{#label}}不能为空' }),
      })

      const result = validator.validate(schemaWithMsg, {})
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('用户名不能为空')
    })

    it('should use custom label in min length error', () => {
      const schema = dsl({
        username: ('string:5-!' as any)
          .label('用户名')
          .messages({ min: '{{#label}}长度不能少于{{#limit}}位' }),
      })

      const result = validator.validate(schema, { username: 'abc' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('用户名长度不能少于5位')
    })

    it('should support {{#key}} interpolation', () => {
      const schema = dsl({
        age: ('number:18-!' as any)
          .label('年龄')
          .messages({ min: '{{#label}}必须大于{{#limit}}' }),
      })

      const result = validator.validate(schema, { age: 10 })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('年龄必须大于18')
    })
  })

  describe('Dynamic Locale', () => {
    beforeAll(() => {
      Locale.addLocale('zh-CN', {
        required: '{{#label}}是必填项',
        min: '{{#label}}太短',
      })
    })

    it('should support locale option in validate', () => {
      const schema = dsl({
        username: ('string:5-!' as any).label('用户名'),
      })

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'zh-CN' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('用户名太短')
    })

    it('should fallback to default locale', () => {
      const schema = dsl({
        username: ('string:5-!' as any).label('Username'),
      })

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'en-US' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toContain('length must be at least 5')
    })
  })
})
