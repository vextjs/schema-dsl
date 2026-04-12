/**
 * DslBuilder 完整测试 — v2 迁移
 *
 * v2 变更：
 * - installStringExtensions 需手动调用
 * - string:N 单值 → exactLength:N（DA-03 fix）
 * - errors 字段在成功时为 undefined（not empty array）
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, validate, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder - 完整测试', () => {
  describe('基本类型解析', () => {
    it('应该正确解析所有基本类型', () => {
      const schema = dsl({
        str: 'string',
        num: 'number',
        int: 'integer',
        bool: 'boolean',
        email: 'email',
        url: 'url',
        uuid: 'uuid',
        date: 'date',
      })

      const p = (schema as any).properties
      expect(p.str.type).toBe('string')
      expect(p.num.type).toBe('number')
      expect(p.int.type).toBe('integer')
      expect(p.bool.type).toBe('boolean')
      expect(p.email.format).toBe('email')
      expect(p.url.format).toBe('uri')
      expect(p.uuid.format).toBe('uuid')
      expect(p.date.format).toBe('date')
    })
  })

  describe('约束条件完整测试', () => {
    it('应该支持 string:N 精确长度语法', () => {
      const schema = dsl({ code: 'string:6' })
      expect((schema as any).properties.code.exactLength).toBe(6)
    })

    it('应该支持 string:-max 明确语法', () => {
      const schema = dsl({ bio: 'string:-500' })
      expect((schema as any).properties.bio.maxLength).toBe(500)
    })

    it('应该支持组合：精确长度+必填', () => {
      const schema = dsl({ code: 'string:6!' })
      expect((schema as any).properties.code.exactLength).toBe(6)
      expect((schema as any).required).toContain('code')
    })

    it('应该支持 string:min-max 范围语法', () => {
      const schema = dsl({ username: 'string:3-32' })
      expect((schema as any).properties.username.minLength).toBe(3)
      expect((schema as any).properties.username.maxLength).toBe(32)
    })

    it('应该支持 string:min- 只限最小语法', () => {
      const schema = dsl({ content: 'string:10-' })
      expect((schema as any).properties.content.minLength).toBe(10)
      expect((schema as any).properties.content.maxLength).toBeUndefined()
    })

    it('应该支持 number:min-max 数字范围', () => {
      const schema = dsl({ age: 'number:18-120' })
      expect((schema as any).properties.age.minimum).toBe(18)
      expect((schema as any).properties.age.maximum).toBe(120)
    })

    it('应该支持 number:max 数字最大值', () => {
      const schema = dsl({ score: 'number:100' })
      expect((schema as any).properties.score.maximum).toBe(100)
    })

    it('应该支持 number:min- 数字最小值', () => {
      const schema = dsl({ price: 'number:0-' })
      expect((schema as any).properties.price.minimum).toBe(0)
      expect((schema as any).properties.price.maximum).toBeUndefined()
    })
  })

  describe('必填标记测试', () => {
    it('应该识别 ! 必填标记', () => {
      const schema = dsl({ username: 'string!' })
      expect((schema as any).required).toContain('username')
    })

    it('应该支持多个必填字段', () => {
      const schema = dsl({
        username: 'string!',
        email: 'email!',
        age: 'number',
      })
      expect((schema as any).required).toContain('username')
      expect((schema as any).required).toContain('email')
      expect((schema as any).required).not.toContain('age')
    })

    it('应该支持约束+必填组合', () => {
      const schema = dsl({ username: 'string:3-32!' })
      expect((schema as any).required).toContain('username')
      expect((schema as any).properties.username.minLength).toBe(3)
      expect((schema as any).properties.username.maxLength).toBe(32)
    })
  })

  describe('枚举值测试', () => {
    it('应该解析简单枚举', () => {
      const schema = dsl({ status: 'active|inactive|pending' })
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive', 'pending'])
    })

    it('应该支持带空格的枚举', () => {
      const schema = dsl({ role: ' admin | user | guest ' })
      expect((schema as any).properties.role.enum).toEqual(['admin', 'user', 'guest'])
    })

    it('应该支持数字枚举（v2 自动识别数字枚举）', () => {
      const schema = dsl({ priority: '1|2|3|4|5' })
      expect((schema as any).properties.priority.type).toBe('number')
      expect((schema as any).properties.priority.enum).toEqual([1, 2, 3, 4, 5])
    })

    it('应该支持必填枚举', () => {
      const schema = dsl({ status: 'active|inactive!' })
      expect((schema as any).required).toContain('status')
      expect((schema as any).properties.status.enum).toEqual(['active', 'inactive'])
    })
  })

  describe('username() 完整测试', () => {
    it('默认应为 medium (3-32)', () => {
      const schema = dsl({ u: ('string!' as any).username() })
      expect((schema as any).properties.u.minLength).toBe(3)
      expect((schema as any).properties.u.maxLength).toBe(32)
    })

    it('应支持自定义范围字符串', () => {
      const tests = [
        { input: '5-20', min: 5, max: 20 },
        { input: '1-10', min: 1, max: 10 },
        { input: '8-16', min: 8, max: 16 },
      ]
      tests.forEach(test => {
        const schema = dsl({ u: ('string!' as any).username(test.input) })
        expect((schema as any).properties.u.minLength).toBe(test.min)
        expect((schema as any).properties.u.maxLength).toBe(test.max)
      })
    })

    it('应支持所有预设选项', () => {
      const presets: Record<string, { min: number; max: number }> = {
        short: { min: 3, max: 16 },
        medium: { min: 3, max: 32 },
        long: { min: 3, max: 64 },
      }
      Object.entries(presets).forEach(([preset, expected]) => {
        const schema = dsl({ u: ('string!' as any).username(preset) })
        expect((schema as any).properties.u.minLength).toBe(expected.min)
        expect((schema as any).properties.u.maxLength).toBe(expected.max)
      })
    })

    it('应该添加正则验证', () => {
      const schema = dsl({ u: ('string!' as any).username() })
      expect((schema as any).properties.u.pattern).toBeTruthy()
    })
  })

  describe('phone() 完整测试', () => {
    it('应支持常见国家代码', () => {
      const countries: Record<string, { min: number; max: number }> = {
        cn: { min: 11, max: 11 },
        us: { min: 10, max: 10 },
        hk: { min: 8, max: 8 },
        tw: { min: 10, max: 10 },
      }
      Object.entries(countries).forEach(([country, expected]) => {
        const schema = dsl({ p: ('string!' as any).phone(country) })
        expect((schema as any).properties.p.minLength).toBe(expected.min)
        expect((schema as any).properties.p.maxLength).toBe(expected.max)
      })
    })

    it('应自动纠正 number 为 string', () => {
      const schema = dsl({ p: ('number!' as any).phone('cn') })
      expect((schema as any).properties.p.type).toBe('string')
      expect((schema as any).properties.p.minimum).toBeUndefined()
      expect((schema as any).properties.p.maximum).toBeUndefined()
    })

    it('应该添加正则验证', () => {
      const schema = dsl({ p: ('string!' as any).phone('cn') })
      expect((schema as any).properties.p.pattern).toBeTruthy()
    })
  })

  describe('password() 完整测试', () => {
    it('应支持 weak/medium/strong 级别', () => {
      const strengths: Record<string, { min: number; max: number }> = {
        weak: { min: 6, max: 64 },
        medium: { min: 8, max: 64 },
        strong: { min: 8, max: 64 },
      }
      Object.entries(strengths).forEach(([strength, expected]) => {
        const schema = dsl({ p: ('string!' as any).password(strength) })
        expect((schema as any).properties.p.minLength).toBe(expected.min)
        expect((schema as any).properties.p.maxLength).toBe(expected.max)
      })
    })

    it('默认应为 medium', () => {
      const schema = dsl({ p: ('string!' as any).password() })
      expect((schema as any).properties.p.minLength).toBe(8)
    })
  })

  describe('嵌套对象测试', () => {
    it('应支持单层嵌套', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!',
        },
      })
      const user = (schema as any).properties.user
      expect(user.type).toBe('object')
      expect(user.properties.name).toBeTruthy()
      expect(user.properties.email).toBeTruthy()
    })

    it('嵌套对象应继承必填标记', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!',
        },
      })
      const user = (schema as any).properties.user
      expect(user.required).toContain('name')
      expect(user.required).toContain('email')
    })
  })

  describe('数组类型测试', () => {
    it('应该支持 array<type> DSL 字符串语法', () => {
      const schema = dsl({ tags: 'array<string>' })
      const p = (schema as any).properties
      expect(p.tags.type).toBe('array')
      expect(p.tags.items).toMatchObject({ type: 'string' })
    })

    it('应该支持 array:N-M<type:constraint> 完整语法', () => {
      const schema = dsl({ tags: 'array:1-5<string:1-20>!' })
      const p = (schema as any).properties
      expect(p.tags.type).toBe('array')
      expect(p.tags.minItems).toBe(1)
      expect(p.tags.maxItems).toBe(5)
      expect(p.tags.items).toMatchObject({ type: 'string', minLength: 1, maxLength: 20 })
      expect((schema as any).required).toContain('tags')
    })

    it('应该支持枚举数组 array<enum:x|y|z>', () => {
      const schema = dsl({ roles: 'array<enum:admin|user|guest>' })
      const p = (schema as any).properties
      expect(p.roles.type).toBe('array')
      expect(p.roles.items).toMatchObject({ enum: ['admin', 'user', 'guest'] })
    })
  })

  describe('验证功能测试', () => {
    it('应正确验证有效数据', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
      })
      const result = validate(schema, {
        username: 'john_doe',
        email: 'john@example.com',
        age: 25,
      })
      expect(result.valid).toBe(true)
    })

    it('应检测缺失的必填字段', () => {
      const schema = dsl({ username: 'string!', email: 'email!' })
      const result = validate(schema, { username: 'john' })
      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)
    })

    it('应检测长度约束违规', () => {
      const schema = dsl({ username: 'string:5-20!' })
      const result = validate(schema, { username: 'ab' })
      expect(result.valid).toBe(false)
    })
  })
})
