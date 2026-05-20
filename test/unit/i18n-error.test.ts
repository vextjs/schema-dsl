/**
 * I18nError Multilingual Error Class Tests (v2 TypeScript)
 *
 * v2 differences:
 * - dsl.error.create/throw/assert not implemented in v2 → tests skipped
 * - account.insufficientCredits is string format (no code extraction)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { I18nError, dsl, Locale } from '../../src/index.js'

describe('I18nError - Multilingual Error Class', () => {
  beforeEach(() => {
    Locale.setLocale('zh-CN')
  })

  afterEach(() => {
    Locale.setLocale('zh-CN')
  })

  describe('Basic Features', () => {
    it('should create an error with a translated message', () => {
      const error = new I18nError('account.notFound')

      expect(error).toBeInstanceOf(I18nError)
      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('I18nError')
      expect(error.originalKey).toBe('account.notFound')
      expect(error.code).toBe('ACCOUNT_NOT_FOUND')
      expect(error.message).toBe('账户不存在')
      expect(error.statusCode).toBe(400)
      expect(error.locale).toBe('zh-CN')
    })

    it('should support parameter interpolation', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      })

      expect(error.message).toContain('余额不足')
      expect(error.message).toContain('50')
      expect(error.message).toContain('100')
      expect(error.params).toEqual({ balance: 50, required: 100 })
    })

    it('should support custom status code', () => {
      const error = new I18nError('account.notFound', {}, 404)
      expect(error.statusCode).toBe(404)
    })

    it('should support locale switching', () => {
      let error = new I18nError('account.notFound')
      expect(error.message).toBe('账户不存在')
      expect(error.locale).toBe('zh-CN')

      Locale.setLocale('en-US')
      error = new I18nError('account.notFound')
      expect(error.message).toBe('Account not found')
      expect(error.locale).toBe('en-US')
    })

    it('should support specifying a locale explicitly', () => {
      const error = new I18nError('account.notFound', {}, 400, 'en-US')

      expect(error.message).toBe('Account not found')
      expect(error.locale).toBe('en-US')
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('Static Method - create', () => {
    it('should create an error instance', () => {
      const error = I18nError.create('account.notFound')

      expect(error).toBeInstanceOf(I18nError)
      expect(error.originalKey).toBe('account.notFound')
      expect(error.code).toBe('ACCOUNT_NOT_FOUND')
    })

    it('should support params and status code', () => {
      const error = I18nError.create(
        'account.insufficientBalance',
        { balance: 50, required: 100 },
        402
      )

      expect(error.message).toContain('余额不足')
      expect(error.statusCode).toBe(402)
    })
  })

  describe('Static Method - throw', () => {
    it('should throw an error directly', () => {
      expect(() => {
        I18nError.throw('account.notFound')
      }).toThrow(I18nError)
    })

    it('thrown error should contain correct information', () => {
      try {
        I18nError.throw('account.insufficientBalance', { balance: 50, required: 100 })
        expect.fail('should have thrown an error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(I18nError)
        expect(error.message).toContain('余额不足')
        expect(error.params).toEqual({ balance: 50, required: 100 })
      }
    })
  })

  describe('Static Method - assert', () => {
    it('should not throw when condition is true', () => {
      expect(() => {
        I18nError.assert(true, 'account.notFound')
      }).not.toThrow()
    })

    it('should throw when condition is false', () => {
      expect(() => {
        I18nError.assert(false, 'account.notFound')
      }).toThrow(I18nError)
    })

    it('should support expressions and params', () => {
      const account = { balance: 50 }

      try {
        I18nError.assert(
          account.balance >= 100,
          'account.insufficientBalance',
          { balance: account.balance, required: 100 }
        )
        expect.fail('should have thrown an error')
      } catch (error: any) {
        expect(error).toBeInstanceOf(I18nError)
        expect(error.message).toContain('余额不足')
      }
    })
  })

  describe('Instance Method - is', () => {
    it('should correctly check error code', () => {
      const error = new I18nError('account.notFound')

      expect(error.is('account.notFound')).toBe(true)
      expect(error.is('user.notFound')).toBe(false)
    })
  })

  describe('Instance Method - toJSON', () => {
    it('should return a complete JSON object', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      }, 402)

      const json = error.toJSON()

      expect(json).toEqual({
        error: 'I18nError',
        originalKey: 'account.insufficientBalance',
        code: 'INSUFFICIENT_BALANCE',
        message: error.message,
        params: { balance: 50, required: 100 },
        statusCode: 402,
        locale: 'zh-CN'
      })
    })
  })

  describe('Instance Method - toString', () => {
    it('should return a formatted string', () => {
      const error = new I18nError('account.notFound')
      const str = error.toString()
      expect(str).toBe('I18nError [ACCOUNT_NOT_FOUND]: 账户不存在')
    })
  })

  describe('dsl.error Shorthand Methods', () => {
    it('should provide a create method', () => {
      const error = (dsl as any).error.create('account.notFound')
      expect(error).toBeInstanceOf(I18nError)
      expect(error.originalKey).toBe('account.notFound')
    })

    it('should provide a throw method', () => {
      expect(() => (dsl as any).error.throw('account.notFound')).toThrow(I18nError)
    })

    it('should provide an assert method', () => {
      expect(() => (dsl as any).error.assert(false, 'account.notFound')).toThrow(I18nError)
      expect(() => (dsl as any).error.assert(true, 'account.notFound')).not.toThrow()
    })
  })

  describe('Real-world Scenarios', () => {
    it('Scenario 1: Account Validation', () => {
      function getAccount(id: any) {
        const account: any = id === '123' ? { id: '123', balance: 50, status: 'active' } : null

        I18nError.assert(account, 'account.notFound')
        I18nError.assert(account.status === 'active', 'account.inactive')
        I18nError.assert(
          account.balance >= 100,
          'account.insufficientBalance',
          { balance: account.balance, required: 100 }
        )

        return account
      }

      expect(() => getAccount(null)).toThrow(I18nError)
      try {
        getAccount(null)
      } catch (e: any) {
        expect(e.code).toBe('ACCOUNT_NOT_FOUND')
      }

      expect(() => getAccount('123')).toThrow(I18nError)
      try {
        getAccount('123')
      } catch (e: any) {
        expect(e.code).toBe('INSUFFICIENT_BALANCE')
      }
    })

    it('Scenario 2: User Permission Validation', () => {
      function checkPermission(user: any) {
        I18nError.assert(user, 'user.notFound')
        I18nError.assert(user.role === 'admin', 'user.noPermission')
      }

      const user = { role: 'user' }

      expect(() => checkPermission(user)).toThrow(I18nError)
      try {
        checkPermission(user)
      } catch (e: any) {
        expect(e.message).toBe('没有管理员权限')
      }
    })

    it('Scenario 3: Express Middleware', () => {
      const error = new I18nError('account.notFound', {}, 404)
      const res: any = {
        status(code: number) { this.statusCode = code; return this },
        json(data: any) { this.jsonData = data; return this }
      }

      function errorHandler(err: any, _req: any, response: any) {
        if (err instanceof I18nError) {
          return response.status(err.statusCode).json(err.toJSON())
        }
      }

      errorHandler(error, {}, res)

      expect(res.statusCode).toBe(404)
      expect(res.jsonData).toHaveProperty('code', 'ACCOUNT_NOT_FOUND')
      expect(res.jsonData).toHaveProperty('message', '账户不存在')
    })

    it('Scenario 4: Combined with dsl.if (function condition)', () => {
      function validateUser(user: any) {
        // v2 dsl.if supports function conditions
        dsl.if((d: any) => !d)
          .message('user.notFound')
          .and((d: any) => !d.isVerified)
          .message('user.notVerified')
          .assert(user)

        I18nError.assert(user.role === 'admin', 'user.noPermission')
      }

      const user = { isVerified: true, role: 'user' }

      expect(() => validateUser(user)).toThrow()
      try {
        validateUser(user)
      } catch (e: any) {
        expect(e.message).toBe('没有管理员权限')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle non-existent error codes', () => {
      const error = new I18nError('non.existent.code')
      expect(error.message).toBe('non.existent.code')
    })

    it('should handle empty params', () => {
      const error = new I18nError('account.notFound', null as any)

      expect(error.params).toEqual({})
      expect(error.message).toBe('账户不存在')
    })

    it('should preserve stack trace', () => {
      const error = new I18nError('account.notFound')

      expect(error.stack).toBeTypeOf('string')
      expect(error.stack).toContain('I18nError')
    })
  })

  describe('i18n Parameter Interpolation', () => {
    it('should support Chinese parameters', () => {
      const error = new I18nError('error.notFound', { resource: '用户' })
      expect(error.message).toBe('找不到用户')
    })

    it('should support English parameters', () => {
      Locale.setLocale('en-US')
      const error = new I18nError('error.notFound', { resource: 'User' })
      expect(error.message).toBe('User not found')
    })

    it('should support numeric parameters', () => {
      const error = new I18nError('account.insufficientCredits', {
        credits: 10,
        required: 100
      })

      expect(error.message).toContain('10')
      expect(error.message).toContain('100')
    })
  })

  describe('v1.1.5 - Object Format Support', () => {
    it('should support object format config (with code and message)', () => {
      const error = new I18nError('account.notFound')

      expect(error.originalKey).toBe('account.notFound')
      expect(error.code).toBe('ACCOUNT_NOT_FOUND')
      expect(error.message).toBe('账户不存在')
    })

    it('should support string format (backward compatible)', () => {
      const error = new I18nError('user.notFound')

      expect(error.originalKey).toBe('user.notFound')
      expect(error.code).toBe('user.notFound')
      expect(error.message).toBe('用户不存在')
    })

    it('object format should support parameter interpolation', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      })

      expect(error.originalKey).toBe('account.insufficientBalance')
      expect(error.code).toBe('INSUFFICIENT_BALANCE')
      expect(error.message).toContain('50')
      expect(error.message).toContain('100')
    })

    it('toJSON should include originalKey field', () => {
      const error = new I18nError('account.notFound')
      const json = error.toJSON()

      expect(json).toHaveProperty('originalKey', 'account.notFound')
      expect(json).toHaveProperty('code', 'ACCOUNT_NOT_FOUND')
    })

    it('different locales should share the same code', () => {
      Locale.setLocale('zh-CN')
      const errorZh = new I18nError('account.notFound')
      expect(errorZh.code).toBe('ACCOUNT_NOT_FOUND')
      expect(errorZh.message).toBe('账户不存在')

      Locale.setLocale('en-US')
      const errorEn = new I18nError('account.notFound')
      expect(errorEn.code).toBe('ACCOUNT_NOT_FOUND')
      expect(errorEn.message).toBe('Account not found')
    })

    it('should support mixing object format and string format', () => {
      const error1 = new I18nError('account.notFound')
      expect(error1.code).toBe('ACCOUNT_NOT_FOUND')

      const error2 = new I18nError('user.notFound')
      expect(error2.code).toBe('user.notFound')
    })
  })
})
