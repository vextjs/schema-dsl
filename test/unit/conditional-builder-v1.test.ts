/**
 * ConditionalBuilder 链式条件构建器测试 — v2 迁移（v1 conditional-builder.test.js）
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('ConditionalBuilder - 链式条件构建器', () => {
  describe('基础功能', () => {
    it('应该支持简单条件 + message（不满足抛错）', () => {
      const schema = dsl({
        age: 'number!',
        status: dsl.if((data: any) => data.age < 18).message('未成年用户不能注册'),
      })

      const result1 = validate(schema, { age: 20, status: 'active' })
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, { age: 16, status: 'active' })
      expect(result2.valid).toBe(false)
      expect(result2.errors![0].message).toBe('未成年用户不能注册')
    })

    it('应该支持条件 + then（动态Schema）', () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl.if((data: any) => data.userType === 'admin').then('email!').else('email'),
      })

      const result1 = validate(schema, { userType: 'admin', email: '' })
      expect(result1.valid).toBe(false)

      const result2 = validate(schema, { userType: 'admin', email: 'admin@example.com' })
      expect(result2.valid).toBe(true)

      const result3 = validate(schema, { userType: 'user', email: '' })
      expect(result3.valid).toBe(true)
    })

    it('应该支持 else 可选（不写 else 就不验证）', () => {
      const schema = dsl({
        userType: 'string!',
        vipLevel: dsl.if((data: any) => data.userType === 'vip').then('active|gold|silver'),
      })

      const result1 = validate(schema, { userType: 'vip', vipLevel: 'gold' })
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, { userType: 'user' })
      expect(result2.valid).toBe(true)
    })

    it('应该支持多个 .and() 链式条件', () => {
      const schema = dsl({
        age: 'number!',
        income: 'number!',
        loanAmount: dsl
          .if((data: any) => data.age < 18)
          .message('未成年不能申请贷款')
          .and((data: any) => data.income < 3000)
          .message('收入不足不能申请贷款'),
      })

      const result1 = validate(schema, { age: 25, income: 5000, loanAmount: null })
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, { age: 16, income: 5000, loanAmount: null })
      expect(result2.valid).toBe(false)
      expect(result2.errors![0].message).toBe('未成年不能申请贷款')
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

  describe('.validate() 方法', () => {
    it('应该返回验证结果对象', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('未成年')
        .validate({ age: 16 })

      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('未成年')
    })

    it('通过时返回 valid: true', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('未成年')
        .validate({ age: 20 })

      expect(result.valid).toBe(true)
    })
  })

  describe('嵌套场景', () => {
    it('应该在嵌套对象中正常工作', () => {
      const schema = dsl({
        user: {
          age: 'number!',
          role: dsl.if((data: any) => data.user?.age < 18).message('未成年不能成为管理员'),
        },
      })

      const result1 = validate(schema, { user: { age: 20, role: 'admin' } })
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, { user: { age: 16, role: 'admin' } })
      expect(result2.valid).toBe(false)
    })
  })
})
