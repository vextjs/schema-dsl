/**
 * ConditionalBuilder Chain Condition Builder Tests — v2 Migration (v1 conditional-builder.test.js)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('ConditionalBuilder - Chain Condition Builder', () => {
  describe('Basic Features', () => {
    it('should support simple condition + message (throw on failure)', () => {
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

    it('should support condition + then (dynamic Schema)', () => {
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

    it('should support optional else (no validation when else is omitted)', () => {
      const schema = dsl({
        userType: 'string!',
        vipLevel: dsl.if((data: any) => data.userType === 'vip').then('active|gold|silver'),
      })

      const result1 = validate(schema, { userType: 'vip', vipLevel: 'gold' })
      expect(result1.valid).toBe(true)

      const result2 = validate(schema, { userType: 'user' })
      expect(result2.valid).toBe(true)
    })

    it('should support multiple .and() chained conditions', () => {
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

  describe('.assert() Method', () => {
    it('should throw error when condition is met', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('未成年')

      expect(() => validator.assert({ age: 16 })).toThrow('未成年')
    })

    it('should not throw error when condition is not met', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('未成年')

      expect(() => validator.assert({ age: 20 })).not.toThrow()
    })
  })

  describe('.validate() Method', () => {
    it('should return validation result object', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('未成年')
        .validate({ age: 16 })

      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('未成年')
    })

    it('should return valid: true when passing', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('未成年')
        .validate({ age: 20 })

      expect(result.valid).toBe(true)
    })
  })

  describe('Nested Scenarios', () => {
    it('should work correctly in nested objects', () => {
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
