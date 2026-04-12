/**
 * ConditionalBuilder 快捷验证方法测试 — v2 迁移（v1 conditional-validate.test.js）
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('ConditionalBuilder - 快捷验证方法', () => {
  describe('.validate() 方法', () => {
    it('应该返回完整验证结果', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('未成年用户不能注册')
        .validate({ age: 16 })

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('未成年用户不能注册')
    })

    it('应该支持一行代码验证', () => {
      const result = dsl.if((d: any) => d.age < 18).message('未成年用户不能注册').validate({ age: 16 })
      expect(result.valid).toBe(false)
    })

    it('应该支持复用验证器', () => {
      const ageValidator = dsl.if((d: any) => d.age < 18).message('未成年')

      const r1 = ageValidator.validate({ age: 16 })
      expect(r1.valid).toBe(false)

      const r2 = ageValidator.validate({ age: 20 })
      expect(r2.valid).toBe(true)
    })

    it('应该支持 then/else', () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl.if((d: any) => d.userType === 'admin').then('email!').else('email'),
      })

      const result = validate(schema, { userType: 'admin', email: 'test@example.com' })
      expect(result.valid).toBe(true)
    })

    it('应该支持非对象类型（字符串）', () => {
      const result = dsl
        .if((d: any) => typeof d === 'string' && d.includes('@'))
        .then('email')
        .validate('test@example.com')

      expect(result.valid).toBe(true)
    })
  })

  describe('.check() 方法', () => {
    it('应该返回布尔值', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('未成年')

      expect(validator.check({ age: 16 })).toBe(false)
      expect(validator.check({ age: 20 })).toBe(true)
    })
  })

  describe('.assert() 方法', () => {
    it('条件成立时应该抛出错误', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('未成年')
      expect(() => validator.assert({ age: 16 })).toThrow('未成年')
    })

    it('条件不成立时不应抛出错误', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('未成年')
      expect(() => validator.assert({ age: 20 })).not.toThrow()
    })
  })
})
