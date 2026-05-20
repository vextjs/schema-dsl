/**
 * ConditionalBuilder .and()/.or() Independent Message Tests — v2 Migration (v1 conditional-and-message.test.js)
 */

import { describe, it, expect } from 'vitest'
import { dsl } from '../../src/index.js'

describe('ConditionalBuilder - .and()/.or() Independent Messages', () => {
  describe('.and() Independent Messages', () => {
    it('should support setting independent messages for .and() conditions', () => {
      const amount = 100
      const account = { tradable_credits: 50 }

      try {
        dsl
          .if((d: any) => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account)

        expect.fail('should have thrown an error')
      } catch (error: any) {
        // second condition fires: tradable_credits(50) < amount(100) → INSUFFICIENT_TRADABLE_CREDITS
        expect(error.errors[0].message).toBe('INSUFFICIENT_TRADABLE_CREDITS')
      }
    })

    it('should return the first message when the first condition fails', () => {
      const amount = 100

      try {
        dsl
          .if((d: any) => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(null)

        expect.fail('should have thrown an error')
      } catch (error: any) {
        expect(error.errors[0].message).toBe('ACCOUNT_NOT_FOUND')
      }
    })

    it('should not throw when all conditions pass', () => {
      const amount = 100
      const account = { tradable_credits: 150 }

      const result = dsl
        .if((d: any) => !d)
        .message('ACCOUNT_NOT_FOUND')
        .and((d: any) => d.tradable_credits < amount)
        .message('INSUFFICIENT_TRADABLE_CREDITS')
        .validate(account)

      expect(result.valid).toBe(true)
    })

    it('should support multiple .and() conditions each with independent messages', () => {
      const amount = 100
      const account = { tradable_credits: 50, status: 'inactive' }

      try {
        dsl
          .if((d: any) => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and((d: any) => d.status !== 'active')
          .message('ACCOUNT_INACTIVE')
          .and((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account)

        expect.fail('should have thrown an error')
      } catch (error: any) {
        // status is not active → ACCOUNT_INACTIVE
        expect(error.errors[0].message).toBe('ACCOUNT_INACTIVE')
      }
    })
  })

  describe('.or() Independent Messages', () => {
    it('should support setting independent messages for .or() conditions', () => {
      const account = { tradable_credits: 50, bonus: 30 }
      const amount = 100

      // check failure state: insufficient balance → throw corresponding message
      try {
        dsl
          .if((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_CREDITS')
          .or((d: any) => d.bonus < amount)
          .message('INSUFFICIENT_BONUS')
          .assert(account)

        expect.fail('should have thrown an error')
      } catch (error: any) {
        // chain-check: message of the first TRUE condition
        expect(error.errors[0].message).toBe('INSUFFICIENT_CREDITS')
      }
    })

    it('should pass when any .or() condition is satisfied', () => {
      const account = { tradable_credits: 150, bonus: 30 }
      const amount = 100

      const result = dsl
        .if((d: any) => d.tradable_credits >= amount)
        .or((d: any) => d.bonus >= amount)
        .validate(account)

      expect(result.valid).toBe(true)
    })
  })
})
