/**
 * 错误消息插值测试 (v2 TypeScript)
 * 确保所有模板变量都能正确替换
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import { dsl, validate, Validator } from '../../src/index.js'
import { ErrorFormatter } from '../../src/core/ErrorFormatter.js'

describe('ErrorFormatter - 参数映射完整性测试', () => {

  describe('enum 错误消息', () => {

    it('应该正确显示枚举值（必填）', () => {
      const schema = dsl({ plan_type: 'enum:pro|basic|free!' })

      // v2: validate() 3rd arg is options (not Validator instance)
      const result = validate(schema, { plan_type: 'premium' }) as any

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBe(1)

      const error = result.errors[0]
      expect(error.keyword).toBe('enum')
      expect(error.message).toContain('pro')
      expect(error.message).toContain('basic')
      expect(error.message).toContain('free')
      expect(error.message).not.toContain('{{#valids}}')
      expect(error.message).not.toContain('{{#allowed}}')
    })

    it('应该正确显示枚举值（可选）', () => {
      const schema = dsl({ plan_type: 'enum:pro|basic?' })

      const result = validate(schema, { plan_type: 'premium' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('pro')
      expect(error.message).toContain('basic')
      expect(error.message).not.toContain('{{#valids}}')
      expect(error.message).not.toContain('{{#allowed}}')
    })

    it('应该支持数字枚举', () => {
      const schema = dsl({ priority: '1|2|3!' })

      // Pass an integer not in the enum (to get enum error, not type error)
      const result = validate(schema, { priority: 5 }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('1')
      expect(error.message).toContain('2')
      expect(error.message).toContain('3')
    })

    it('应该支持中文错误消息', () => {
      const schema = dsl({ status: 'active|inactive!' })

      // v2: locale goes in options (3rd arg)
      const result = validate(schema, { status: 'unknown' }, { locale: 'zh-CN' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('active')
      expect(error.message).toContain('inactive')
      expect(
        error.message.includes('以下值之一') || error.message.includes('必须是')
      ).toBe(true)
    })

  })

  describe('additionalProperties 错误消息', () => {

    it('应该正确显示未知属性名', () => {
      const ajv = new Ajv({ allErrors: true })

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name'],
        additionalProperties: false
      }

      const compiledValidate = ajv.compile(schema)
      const valid = compiledValidate({ name: 'John', age: 30, email: 'john@example.com' })

      expect(valid).toBe(false)
      expect(compiledValidate.errors).toBeTruthy()

      const formatter = new ErrorFormatter('en-US')
      const formatted = formatter.formatDetailed(compiledValidate.errors!)

      expect(formatted.length).toBeGreaterThan(0)
      const error = formatted.find(e => e.keyword === 'additionalProperties')

      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

  })

  describe('required 错误消息', () => {

    it('应该正确显示缺失的字段名', () => {
      const schema = dsl({ name: 'string!', email: 'email!' })

      const result = validate(schema, {}) as any

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)

      const nameError = result.errors.find((e: any) => e.path === 'name')
      expect(nameError).toBeTruthy()
      expect(
        nameError.message.includes('name') ||
        nameError.message.includes('必填') ||
        nameError.message.includes('required')
      ).toBe(true)

      const emailError = result.errors.find((e: any) => e.path === 'email')
      expect(emailError).toBeTruthy()
      expect(
        emailError.message.includes('email') ||
        emailError.message.includes('必填') ||
        emailError.message.includes('required')
      ).toBe(true)
    })

  })

  describe('minLength/maxLength 错误消息', () => {

    it('应该正确显示长度限制', () => {
      const schema = dsl({ username: 'string:3-32!' })

      let result = validate(schema, { username: 'ab' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('3')
      expect(result.errors[0].message).not.toContain('{{#limit}}')

      result = validate(schema, { username: 'a'.repeat(33) }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('32')
      expect(result.errors[0].message).not.toContain('{{#limit}}')
    })

  })

  describe('minimum/maximum 错误消息', () => {

    it('应该正确显示数值范围', () => {
      const schema = dsl({ age: 'number:18-120!' })

      let result = validate(schema, { age: 10 }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('18')
      expect(result.errors[0].message).not.toContain('{{#limit}}')

      result = validate(schema, { age: 150 }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('120')
      expect(result.errors[0].message).not.toContain('{{#limit}}')
    })

  })

  describe('type 错误消息', () => {

    it('应该正确显示期望类型和实际类型', () => {
      const schema = dsl({ age: 'number!' })

      const result = validate(schema, { age: 'not a number' }, { locale: 'en-US' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(
        error.message.includes('number') || error.message.toLowerCase().includes('type')
      ).toBe(true)
      expect(error.message).not.toContain('{{#expected}}')
      expect(error.message).not.toContain('{{#actual}}')
    })

  })

  describe('minItems/maxItems 错误消息', () => {

    it('应该正确显示数组长度限制', () => {
      const schema = dsl({ tags: 'array!1-10' })

      let result = validate(schema, { tags: [] }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('1')
      expect(result.errors[0].message).not.toContain('{{#limit}}')

      result = validate(schema, { tags: Array(11).fill('tag') }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('10')
      expect(result.errors[0].message).not.toContain('{{#limit}}')
    })

  })

  describe('format 错误消息', () => {

    it('应该正确显示格式验证错误', () => {
      const schema = dsl({ email: 'email!' })

      const result = validate(schema, { email: 'invalid-email' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(
        error.message.toLowerCase().includes('email') || error.message.includes('格式')
      ).toBe(true)
      expect(error.message).not.toContain('{{#format}}')
    })

  })

  describe('多语言支持', () => {

    it('应该在不同语言中正确替换变量', () => {
      const schema = dsl({ status: 'active|inactive|pending!' })

      let result = validate(schema, { status: 'unknown' }, { locale: 'en-US' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('active')
      expect(result.errors[0].message).not.toContain('{{')

      result = validate(schema, { status: 'unknown' }, { locale: 'zh-CN' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('active')
      expect(result.errors[0].message).not.toContain('{{')
    })

  })

})
