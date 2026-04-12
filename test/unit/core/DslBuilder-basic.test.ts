/**
 * DslBuilder 基础测试 — v2 迁移（对应 v1: DslBuilder.test.js）
 *
 * v2 变更：
 * - DslBuilder 从 src/core/DslBuilder.js 导入（带 .js 扩展名）
 * - installStringExtensions 手动调用
 * - .exist → .toBeTruthy()
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { DslBuilder, dsl, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder', () => {
  describe('构造函数', () => {
    it('应该能创建 DslBuilder 实例', () => {
      const builder = new DslBuilder('string')
      expect(builder).toBeInstanceOf(DslBuilder)
    })

    it('应该解析基本类型', () => {
      const builder = new DslBuilder('string')
      expect((builder as any)._baseSchema.type).toBe('string')
    })

    it('应该解析必填标记', () => {
      const builder = new DslBuilder('string!')
      expect((builder as any)._required).toBe(true)
    })
  })

  describe('默认验证器', () => {
    describe('username()', () => {
      it('无参数时应自动设置 3-32 长度', () => {
        const schema = dsl({ username: ('string!' as any).username() })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(32)
      })

      it('应支持字符串范围参数', () => {
        const schema = dsl({ username: ('string!' as any).username('5-20') })
        expect((schema as any).properties.username.minLength).toBe(5)
        expect((schema as any).properties.username.maxLength).toBe(20)
      })

      it('应支持 short 预设', () => {
        const schema = dsl({ username: ('string!' as any).username('short') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(16)
      })

      it('应支持 medium 预设', () => {
        const schema = dsl({ username: ('string!' as any).username('medium') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(32)
      })

      it('应支持 long 预设', () => {
        const schema = dsl({ username: ('string!' as any).username('long') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(64)
      })
    })

    describe('phone()', () => {
      it('应自动设置 cn 手机号长度为 11', () => {
        const schema = dsl({ phone: ('string!' as any).phone('cn') })
        expect((schema as any).properties.phone.minLength).toBe(11)
        expect((schema as any).properties.phone.maxLength).toBe(11)
      })

      it('应自动纠正 number 类型为 string', () => {
        const schema = dsl({ phone: ('number!' as any).phone('cn') })
        expect((schema as any).properties.phone.type).toBe('string')
      })
    })

    describe('password()', () => {
      it('strong 应设置 8-64 长度', () => {
        const schema = dsl({ password: ('string!' as any).password('strong') })
        expect((schema as any).properties.password.minLength).toBe(8)
        expect((schema as any).properties.password.maxLength).toBe(64)
      })

      it('weak 应设置 6-64 长度', () => {
        const schema = dsl({ password: ('string!' as any).password('weak') })
        expect((schema as any).properties.password.minLength).toBe(6)
        expect((schema as any).properties.password.maxLength).toBe(64)
      })
    })
  })

  describe('String 扩展方法', () => {
    it('应支持 .pattern()', () => {
      const schema = dsl({ test: ('string!' as any).pattern(/^test$/) })
      expect((schema as any).properties.test.pattern).toBeTruthy()
    })

    it('应支持 .label()', () => {
      expect(() => {
        ;('string!' as any).label('测试')
      }).not.toThrow()
    })

    it('应支持 .messages()', () => {
      expect(() => {
        ;('string!' as any).messages({ min: 'test' })
      }).not.toThrow()
    })

    it('应支持 .description()', () => {
      expect(() => {
        ;('string!' as any).description('测试描述')
      }).not.toThrow()
    })

    it('应支持 .custom()', () => {
      expect(() => {
        ;('string!' as any).custom(() => {})
      }).not.toThrow()
    })

    it('应支持 .default()', () => {
      const schema = dsl({ name: ('string' as any).default('guest') })
      expect((schema as any).properties.name.default).toBe('guest')
    })
  })
})
