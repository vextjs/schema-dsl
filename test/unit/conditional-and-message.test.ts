/**
 * ConditionalBuilder .and()/.or() 独立消息测试 — v2 迁移（v1 conditional-and-message.test.js）
 */

import { describe, it, expect } from 'vitest'
import { dsl } from '../../src/index.js'

describe('ConditionalBuilder - .and()/.or() 独立消息', () => {
  describe('.and() 独立消息', () => {
    it('应该支持为 .and() 条件设置独立消息', () => {
      const amount = 100
      const account = { tradable_credits: 50 }

      try {
        dsl
          .if((d: any) => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account)

        expect.fail('应该抛出错误')
      } catch (error: any) {
        expect(error.errors[0].message).toBe('INSUFFICIENT_TRADABLE_CREDITS')
      }
    })

    it('第一个条件失败时应该返回第一个消息', () => {
      const amount = 100

      try {
        dsl
          .if((d: any) => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(null)

        expect.fail('应该抛出错误')
      } catch (error: any) {
        expect(error.errors[0].message).toBe('ACCOUNT_NOT_FOUND')
      }
    })

    it('所有条件通过时不应抛错', () => {
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

    it('应该支持多个 .and() 条件各有独立消息', () => {
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

        expect.fail('应该抛出错误')
      } catch (error: any) {
        // status 不是 active → ACCOUNT_INACTIVE
        expect(error.errors[0].message).toBe('ACCOUNT_INACTIVE')
      }
    })
  })

  describe('.or() 独立消息', () => {
    it('应该支持为 .or() 条件设置独立消息', () => {
      const account = { tradable_credits: 50, bonus: 30 }
      const amount = 100

      // 检查失败状态：余额不足 → 抛出对应消息
      try {
        dsl
          .if((d: any) => d.tradable_credits < amount)
          .message('INSUFFICIENT_CREDITS')
          .or((d: any) => d.bonus < amount)
          .message('INSUFFICIENT_BONUS')
          .assert(account)

        expect.fail('应该抛出错误')
      } catch (error: any) {
        // chain-check: 第一个 TRUE 的条件的消息
        expect(error.errors[0].message).toBe('INSUFFICIENT_CREDITS')
      }
    })

    it('or 中任一条件满足时应通过', () => {
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
