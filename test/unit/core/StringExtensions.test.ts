/**
 * StringExtensions 完整测试 — v2 迁移
 *
 * v2 变更：
 * - 需要显式调用 installStringExtensions(dsl) 安装（opt-in）
 * - 'length' 和 'trim' 从扩展列表移除（v2 bugfix）
 * - uninstallStringExtensions() 可还原
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  dsl,
  validate,
  installStringExtensions,
  uninstallStringExtensions,
} from '../../../src/index.js'

describe('StringExtensions - 完整测试', () => {
  beforeAll(() => {
    installStringExtensions(dsl as any)
  })

  afterAll(() => {
    uninstallStringExtensions(dsl as any)
  })

  describe('链式调用基础', () => {
    it('应支持字符串直接调用 pattern 方法', () => {
      expect(typeof ('string' as any).pattern).toBe('function')
    })

    it('应支持字符串直接调用 label 方法', () => {
      expect(typeof ('string' as any).label).toBe('function')
    })

    it('应支持字符串直接调用 messages 方法', () => {
      expect(typeof ('string' as any).messages).toBe('function')
    })

    it('应支持字符串直接调用 description 方法', () => {
      expect(typeof ('string' as any).description).toBe('function')
    })

    it('应支持字符串直接调用 custom 方法', () => {
      expect(typeof ('string' as any).custom).toBe('function')
    })

    it('应支持字符串直接调用 default 方法', () => {
      expect(typeof ('string' as any).default).toBe('function')
    })

    it('应支持带必填标记的字符串', () => {
      expect(typeof ('string!' as any).pattern).toBe('function')
      expect(typeof ('email!' as any).label).toBe('function')
    })

    it('应支持带约束的字符串', () => {
      expect(typeof ('string:3-32' as any).pattern).toBe('function')
      expect(typeof ('string:10-!' as any).label).toBe('function')
    })
  })

  describe('.pattern() 方法', () => {
    it('应添加正则验证', () => {
      const schema = dsl({
        username: ('string!' as any).pattern(/^[a-zA-Z0-9_]+$/),
      })
      expect((schema as any).properties.username.pattern).toBeDefined()
    })

    it('应支持正则字符串', () => {
      const schema = dsl({
        code: ('string!' as any).pattern('^[A-Z]{3}$'),
      })
      expect((schema as any).properties.code.pattern).toBeDefined()
    })

    it('应在验证时生效', () => {
      const schema = dsl({
        username: ('string!' as any).pattern(/^[a-z]+$/),
      })
      expect(validate(schema, { username: 'abc' }).valid).toBe(true)
      expect(validate(schema, { username: 'ABC' }).valid).toBe(false)
    })
  })

  describe('.label() 方法', () => {
    it('应设置字段标签', () => {
      const result = ('string!' as any).label('用户名')
      expect(result).toBeDefined()
    })

    it('应支持链式调用', () => {
      const result = ('string:3-32!' as any).label('用户名').pattern(/^[a-z]+$/)
      expect(result).toBeDefined()
    })
  })

  describe('.messages() 方法', () => {
    it('应设置自定义错误消息', () => {
      const result = ('string:3-32!' as any).messages({
        min: '最少3个字符',
        max: '最多32个字符',
        required: '不能为空',
      })
      expect(result).toBeDefined()
    })

    it('应支持模板变量', () => {
      const result = ('string:3-32!' as any).messages({
        min: '最少{{#limit}}个字符',
      })
      expect(result).toBeDefined()
    })
  })

  describe('.description() 方法', () => {
    it('应设置字段描述', () => {
      const result = ('string!' as any).description('用于登录的用户名')
      expect(result).toBeDefined()
    })

    it('应支持多行描述', () => {
      const result = ('string!' as any).description('用户名规则：\n1. 3-32个字符\n2. 只能包含字母和数字')
      expect(result).toBeDefined()
    })
  })

  describe('.custom() 方法', () => {
    it('应支持同步验证器', () => {
      const result = ('string!' as any).custom((value: string) => {
        if (value === 'admin') return '不能使用admin'
        return true
      })
      expect(result).toBeDefined()
    })

    it('应支持异步验证器', () => {
      const result = ('email!' as any).custom(async (_value: string) => {
        return new Promise<boolean>(resolve => setTimeout(() => resolve(true), 10))
      })
      expect(result).toBeDefined()
    })

    it('应支持返回错误对象', () => {
      const result = ('string!' as any).custom((value: string) => {
        if (value === 'test') return { error: 'custom.test', message: '不能使用test' }
      })
      expect(result).toBeDefined()
    })
  })

  describe('.default() 方法', () => {
    it('应设置默认值', () => {
      const schema = dsl({
        name: ('string' as any).default('guest'),
      })
      expect((schema as any).properties.name.default).toBe('guest')
    })

    it('应支持不同类型的默认值', () => {
      const schema = dsl({
        name: ('string' as any).default('guest'),
        age: ('number' as any).default(18),
        active: ('boolean' as any).default(true),
      })
      expect((schema as any).properties.name.default).toBe('guest')
      expect((schema as any).properties.age.default).toBe(18)
      expect((schema as any).properties.active.default).toBe(true)
    })

    it('默认值应在验证时生效', () => {
      const schema = dsl({
        role: ('string' as any).default('user'),
      })
      const result = validate(schema, {})
      expect((result.data as any).role).toBe('user')
    })
  })

  describe('多方法链式调用', () => {
    it('应支持 pattern + label 链式', () => {
      const schema = dsl({
        username: ('string:3-32!' as any).pattern(/^[a-z]+$/).label('用户名'),
      })
      expect((schema as any).properties.username.pattern).toBeDefined()
    })

    it('应支持 label + description + messages 链式', () => {
      const schema = dsl({
        email: ('email!' as any)
          .label('邮箱')
          .description('用于登录')
          .messages({ required: '邮箱不能为空' }),
      })
      expect((schema as any).properties.email.format).toBe('email')
    })

    it('应支持所有方法链式', () => {
      const schema = dsl({
        username: ('string:3-32!' as any)
          .pattern(/^[a-z]+$/)
          .label('用户名')
          .description('登录用户名')
          .messages({ required: '不能为空' })
          .custom((v: string) => v !== 'admin'),
      })
      expect((schema as any).properties.username).toBeDefined()
    })
  })

  describe('与 DslBuilder 内置方法结合', () => {
    it('username() + 链式调用', () => {
      const schema = dsl({
        username: ('string!' as any).username('5-20').label('用户名'),
      })
      expect((schema as any).properties.username.minLength).toBe(5)
      expect((schema as any).properties.username.maxLength).toBe(20)
    })

    it('phone() + 链式调用', () => {
      const schema = dsl({
        phone: ('string!' as any).phone('cn').label('手机号'),
      })
      expect((schema as any).properties.phone.minLength).toBe(11)
    })

    it('password() + 链式调用', () => {
      const schema = dsl({
        password: ('string!' as any).password('strong').label('密码'),
      })
      expect((schema as any).properties.password.minLength).toBe(8)
    })
  })

  describe('嵌套对象中使用', () => {
    it('应在嵌套对象中正常工作', () => {
      const schema = dsl({
        user: {
          username: ('string:3-32!' as any).pattern(/^[a-z]+$/).label('用户名'),
          email: ('email!' as any).label('邮箱'),
          profile: {
            bio: ('string:500' as any).description('个人简介'),
            website: ('url' as any).label('个人网站'),
          },
        },
      })
      expect((schema as any).properties.user.properties.username.pattern).toBeDefined()
      expect((schema as any).properties.user.properties.profile.properties.bio).toBeDefined()
    })
  })

  describe('完整示例', () => {
    it('表单验证示例', () => {
      const schema = dsl({
        username: ('string:3-32!' as any)
          .pattern(/^[a-zA-Z0-9_]+$/)
          .label('用户名')
          .messages({
            pattern: '只能包含字母、数字和下划线',
            min: '至少3个字符',
            max: '最多32个字符',
          }),
        email: ('email!' as any).label('邮箱地址').description('用于登录和接收通知'),
        password: ('string:8-64!' as any)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .label('密码')
          .messages({ pattern: '必须包含大小写字母和数字' }),
        agree: ('boolean!' as any).label('同意条款'),
      })

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Abc123456',
        agree: true,
      }

      const result = validate(schema, validData)
      expect(result.valid).toBe(true)
    })

    it('复杂嵌套示例', () => {
      const schema = dsl({
        user: {
          username: ('string!' as any).username('5-20').label('用户名'),
          contact: {
            email: ('email!' as any).label('邮箱'),
            phone: ('string!' as any).phone('cn').label('手机号'),
          },
          profile: {
            bio: ('string:500' as any).description('个人简介'),
            website: ('url' as any).label('个人网站').default('https://example.com'),
          },
        },
      })

      expect((schema as any).properties.user.properties.contact.properties.phone.minLength).toBe(11)
      expect((schema as any).properties.user.properties.profile.properties.website.default).toBe(
        'https://example.com'
      )
    })
  })

  describe('uninstall', () => {
    it('卸载后字符串扩展不再可用', () => {
      uninstallStringExtensions(dsl as any)
      expect(typeof ('string' as any).label).not.toBe('function')
      // reinstall for afterAll cleanup
      installStringExtensions(dsl as any)
    })
  })
})
