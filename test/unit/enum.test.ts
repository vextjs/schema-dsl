/**
 * 枚举功能测试 (v2 TypeScript)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('Enum - 枚举功能', () => {

  describe('基础枚举语法', () => {

    it('应该支持简写形式 value1|value2（字符串枚举）', () => {
      const schema = dsl({ status: 'active|inactive|pending' })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'inactive' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持 enum:value1|value2 格式（字符串枚举）', () => {
      const schema = dsl({ status: 'enum:active|inactive|pending' })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持枚举必填标记', () => {
      const schema = dsl({ status: 'active|inactive!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)
    })

  })

  describe('布尔值枚举', () => {

    it('应该自动识别布尔值枚举', () => {
      const schema = dsl({ isActive: 'true|false' })

      let result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: false }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: 'true' }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持 enum:boolean:true|false 格式', () => {
      const schema = dsl({ isActive: 'enum:boolean:true|false' })

      let result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: false }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: 'true' }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持布尔值枚举必填', () => {
      const schema = dsl({ isActive: 'true|false!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)
    })

  })

  describe('数字枚举', () => {

    it('应该自动识别数字枚举', () => {
      const schema = dsl({ priority: '1|2|3' })

      let result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: 2 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: '1' }) as any
      expect(result.valid).toBe(false)

      result = validate(schema, { priority: 4 }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持 enum:number:1|2|3 格式', () => {
      const schema = dsl({ priority: 'enum:number:1|2|3' })

      let result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: 4 }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持 enum:integer:1|2|3 格式', () => {
      const schema = dsl({ level: 'enum:integer:1|2|3' })

      let result = validate(schema, { level: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { level: 1.5 }) as any
      expect(result.valid).toBe(false)
    })

    it('应该支持数字枚举必填', () => {
      const schema = dsl({ priority: '1|2|3!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('必填') ||
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)
    })

    it('应该支持小数枚举', () => {
      const schema = dsl({ rating: '1.0|1.5|2.0|2.5' })

      let result = validate(schema, { rating: 1.5 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { rating: 3.0 }) as any
      expect(result.valid).toBe(false)
    })

  })

  describe('错误处理', () => {

    it('应该在布尔值枚举包含无效值时抛出错误', () => {
      expect(() => {
        dsl({ flag: 'enum:boolean:true|false|maybe' })
      }).toThrow(/Invalid boolean enum value/)
    })

    it('应该在数字枚举包含无效值时抛出错误', () => {
      expect(() => {
        dsl({ value: 'enum:number:1|2|abc' })
      }).toThrow(/Invalid number enum value/)
    })

  })

  describe('与其他功能配合', () => {

    it('应该支持链式方法', () => {
      // v2: use dsl() builder instead of string method chaining
      const schema = dsl({
        status: dsl('active|inactive').label('状态')
      })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('状态')
    })

    it('应该支持自定义错误消息', () => {
      const schema = dsl({
        status: dsl('active|inactive').messages({
          'string.enum': '状态必须是 active 或 inactive'
        })
      })

      const result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('active 或 inactive')
    })

    it('应该在对象中正确使用枚举', () => {
      // v2: use dsl('active|inactive').default('active') instead of string method chaining
      const schema = dsl({
        user: {
          name: 'string:2-32!',
          role: 'admin|user|guest!',
          status: dsl('active|inactive').default('active'),
          level: '1|2|3'
        }
      })

      const result = validate(schema, {
        user: {
          name: 'John',
          role: 'admin',
          level: 2
        }
      }) as any
      expect(result.valid).toBe(true)
    })

    it('应该在数组中正确使用枚举', () => {
      const schema = dsl({
        tags: 'array<enum:public|private|draft>'
      })

      let result = validate(schema, {
        tags: ['public', 'private']
      }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, {
        tags: ['public', 'unknown']
      }) as any
      expect(result.valid).toBe(false)
    })

  })

  describe('兼容性测试', () => {

    it('应该不影响带冒号的其他类型', () => {
      const schema = dsl({
        username: 'string:3-32',
        age: 'number:18-120',
        phone: 'phone:cn'
      })

      const result = validate(schema, {
        username: 'john',
        age: 25,
        phone: '13800138000'
      }) as any
      expect(result.valid).toBe(true)
    })

  })

})
