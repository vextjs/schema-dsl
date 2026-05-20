/**
 * ConditionalBuilder Shorthand Validation Method Tests — v2 migration (v1 conditional-validate.test.js)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('ConditionalBuilder - Shorthand Validation Methods', () => {
  describe('.validate() Method', () => {
    it('should return complete validation result', () => {
      const result = dsl
        .if((d: any) => d.age < 18)
        .message('Underage users cannot register')
        .validate({ age: 16 })

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toBe('Underage users cannot register')
    })

    it('should support single-line validation', () => {
      const result = dsl.if((d: any) => d.age < 18).message('Underage users cannot register').validate({ age: 16 })
      expect(result.valid).toBe(false)
    })

    it('should support reusing validator', () => {
      const ageValidator = dsl.if((d: any) => d.age < 18).message('Underage')

      const r1 = ageValidator.validate({ age: 16 })
      expect(r1.valid).toBe(false)

      const r2 = ageValidator.validate({ age: 20 })
      expect(r2.valid).toBe(true)
    })

    it('should support then/else', () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl.if((d: any) => d.userType === 'admin').then('email!').else('email'),
      })

      const result = validate(schema, { userType: 'admin', email: 'test@example.com' })
      expect(result.valid).toBe(true)
    })

    it('should support non-object types (string)', () => {
      const result = dsl
        .if((d: any) => typeof d === 'string' && d.includes('@'))
        .then('email')
        .validate('test@example.com')

      expect(result.valid).toBe(true)
    })
  })

  describe('.check() Method', () => {
    it('should return boolean value', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('Underage')

      expect(validator.check({ age: 16 })).toBe(false)
      expect(validator.check({ age: 20 })).toBe(true)
    })
  })

  describe('.assert() Method', () => {
    it('should throw error when condition is met', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('Underage')
      expect(() => validator.assert({ age: 16 })).toThrow('Underage')
    })

    it('should not throw error when condition is not met', () => {
      const validator = dsl.if((d: any) => d.age < 18).message('Underage')
      expect(() => validator.assert({ age: 20 })).not.toThrow()
    })
  })
})
