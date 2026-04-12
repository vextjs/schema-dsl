/**
 * I18nError 多语言错误类测试 (v2 TypeScript)
 *
 * v2 differences:
 * - dsl.error.create/throw/assert not implemented in v2 → tests skipped
 * - account.insufficientCredits is string format (no code extraction)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { I18nError, dsl, Locale } from '../../src/index.js'

describe('I18nError - 多语言错误类', () => {
  beforeEach(() => {
    Locale.setLocale('zh-CN')
  })

  afterEach(() => {
    Locale.setLocale('zh-CN')
  })

  describe('基础功能', () => {
    it('应该创建包含翻译消息的错误', () => {
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

    it('应该支持参数插值', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      })

      expect(error.message).toContain('余额不足')
      expect(error.message).toContain('50')
      expect(error.message).toContain('100')
      expect(error.params).toEqual({ balance: 50, required: 100 })
    })

    it('应该支持自定义状态码', () => {
      const error = new I18nError('account.notFound', {}, 404)
      expect(error.statusCode).toBe(404)
    })

    it('应该支持多语言切换', () => {
      let error = new I18nError('account.notFound')
      expect(error.message).toBe('账户不存在')
      expect(error.locale).toBe('zh-CN')

      Locale.setLocale('en-US')
      error = new I18nError('account.notFound')
      expect(error.message).toBe('Account not found')
      expect(error.locale).toBe('en-US')
    })

    it('应该支持指定语言', () => {
      const error = new I18nError('account.notFound', {}, 400, 'en-US')

      expect(error.message).toBe('Account not found')
      expect(error.locale).toBe('en-US')
      expect(Locale.getLocale()).toBe('zh-CN')
    })
  })

  describe('静态方法 - create', () => {
    it('应该创建错误实例', () => {
      const error = I18nError.create('account.notFound')

      expect(error).toBeInstanceOf(I18nError)
      expect(error.originalKey).toBe('account.notFound')
      expect(error.code).toBe('ACCOUNT_NOT_FOUND')
    })

    it('应该支持参数和状态码', () => {
      const error = I18nError.create(
        'account.insufficientBalance',
        { balance: 50, required: 100 },
        402
      )

      expect(error.message).toContain('余额不足')
      expect(error.statusCode).toBe(402)
    })
  })

  describe('静态方法 - throw', () => {
    it('应该直接抛出错误', () => {
      expect(() => {
        I18nError.throw('account.notFound')
      }).toThrow(I18nError)
    })

    it('抛出的错误应包含正确信息', () => {
      try {
        I18nError.throw('account.insufficientBalance', { balance: 50, required: 100 })
        expect.fail('应该抛出错误')
      } catch (error: any) {
        expect(error).toBeInstanceOf(I18nError)
        expect(error.message).toContain('余额不足')
        expect(error.params).toEqual({ balance: 50, required: 100 })
      }
    })
  })

  describe('静态方法 - assert', () => {
    it('条件为真时不应抛错', () => {
      expect(() => {
        I18nError.assert(true, 'account.notFound')
      }).not.toThrow()
    })

    it('条件为假时应抛错', () => {
      expect(() => {
        I18nError.assert(false, 'account.notFound')
      }).toThrow(I18nError)
    })

    it('应该支持表达式和参数', () => {
      const account = { balance: 50 }

      try {
        I18nError.assert(
          account.balance >= 100,
          'account.insufficientBalance',
          { balance: account.balance, required: 100 }
        )
        expect.fail('应该抛出错误')
      } catch (error: any) {
        expect(error).toBeInstanceOf(I18nError)
        expect(error.message).toContain('余额不足')
      }
    })
  })

  describe('实例方法 - is', () => {
    it('应该正确判断错误代码', () => {
      const error = new I18nError('account.notFound')

      expect(error.is('account.notFound')).toBe(true)
      expect(error.is('user.notFound')).toBe(false)
    })
  })

  describe('实例方法 - toJSON', () => {
    it('应该返回完整的JSON对象', () => {
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

  describe('实例方法 - toString', () => {
    it('应该返回格式化的字符串', () => {
      const error = new I18nError('account.notFound')
      const str = error.toString()
      expect(str).toBe('I18nError [ACCOUNT_NOT_FOUND]: 账户不存在')
    })
  })

  describe('dsl.error 快捷方法', () => {
    it('应该提供 create 方法', () => {
      const error = (dsl as any).error.create('account.notFound')
      expect(error).toBeInstanceOf(I18nError)
      expect(error.originalKey).toBe('account.notFound')
    })

    it('应该提供 throw 方法', () => {
      expect(() => (dsl as any).error.throw('account.notFound')).toThrow(I18nError)
    })

    it('应该提供 assert 方法', () => {
      expect(() => (dsl as any).error.assert(false, 'account.notFound')).toThrow(I18nError)
      expect(() => (dsl as any).error.assert(true, 'account.notFound')).not.toThrow()
    })
  })

  describe('实际应用场景', () => {
    it('场景1: 账户验证', () => {
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

    it('场景2: 用户权限验证', () => {
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

    it('场景3: Express 中间件', () => {
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

    it('场景4: 与 dsl.if 结合使用（函数条件）', () => {
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

  describe('边界情况', () => {
    it('应该处理不存在的错误代码', () => {
      const error = new I18nError('non.existent.code')
      expect(error.message).toBe('non.existent.code')
    })

    it('应该处理空参数', () => {
      const error = new I18nError('account.notFound', null as any)

      expect(error.params).toEqual({})
      expect(error.message).toBe('账户不存在')
    })

    it('应该保持堆栈跟踪', () => {
      const error = new I18nError('account.notFound')

      expect(error.stack).toBeTypeOf('string')
      expect(error.stack).toContain('I18nError')
    })
  })

  describe('多语言参数插值', () => {
    it('应该支持中文参数', () => {
      const error = new I18nError('error.notFound', { resource: '用户' })
      expect(error.message).toBe('找不到用户')
    })

    it('应该支持英文参数', () => {
      Locale.setLocale('en-US')
      const error = new I18nError('error.notFound', { resource: 'User' })
      expect(error.message).toBe('User not found')
    })

    it('应该支持数字参数', () => {
      const error = new I18nError('account.insufficientCredits', {
        credits: 10,
        required: 100
      })

      expect(error.message).toContain('10')
      expect(error.message).toContain('100')
    })
  })

  describe('v1.1.5 - 对象格式支持', () => {
    it('应该支持对象格式配置（带 code 和 message）', () => {
      const error = new I18nError('account.notFound')

      expect(error.originalKey).toBe('account.notFound')
      expect(error.code).toBe('ACCOUNT_NOT_FOUND')
      expect(error.message).toBe('账户不存在')
    })

    it('应该支持字符串格式（向后兼容）', () => {
      const error = new I18nError('user.notFound')

      expect(error.originalKey).toBe('user.notFound')
      expect(error.code).toBe('user.notFound')
      expect(error.message).toBe('用户不存在')
    })

    it('对象格式应该支持参数插值', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      })

      expect(error.originalKey).toBe('account.insufficientBalance')
      expect(error.code).toBe('INSUFFICIENT_BALANCE')
      expect(error.message).toContain('50')
      expect(error.message).toContain('100')
    })

    it('toJSON 应该包含 originalKey 字段', () => {
      const error = new I18nError('account.notFound')
      const json = error.toJSON()

      expect(json).toHaveProperty('originalKey', 'account.notFound')
      expect(json).toHaveProperty('code', 'ACCOUNT_NOT_FOUND')
    })

    it('多语言应该共享相同的 code', () => {
      Locale.setLocale('zh-CN')
      const errorZh = new I18nError('account.notFound')
      expect(errorZh.code).toBe('ACCOUNT_NOT_FOUND')
      expect(errorZh.message).toBe('账户不存在')

      Locale.setLocale('en-US')
      const errorEn = new I18nError('account.notFound')
      expect(errorEn.code).toBe('ACCOUNT_NOT_FOUND')
      expect(errorEn.message).toBe('Account not found')
    })

    it('应该支持混合使用对象格式和字符串格式', () => {
      const error1 = new I18nError('account.notFound')
      expect(error1.code).toBe('ACCOUNT_NOT_FOUND')

      const error2 = new I18nError('user.notFound')
      expect(error2.code).toBe('user.notFound')
    })
  })
})
