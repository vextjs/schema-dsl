/**
 * 多语言错误消息测试 (v2 TypeScript)
 * 完整覆盖所有语言
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import { validate, Validator } from '../../src/index.js'
import { ErrorFormatter } from '../../src/core/ErrorFormatter.js'

describe('ErrorFormatter - 多语言完整性测试', () => {

  describe('enum 错误消息 - 所有语言', () => {

    const schema = {
      type: 'object',
      properties: {
        plan_type: {
          type: 'string',
          enum: ['pro', 'basic', 'free']
        }
      }
    }

    const validator = new Validator()
    const compiledSchema = validator.compile(schema)
    const testData = { plan_type: 'premium' }

    it('应该正确显示枚举值（英文 en-US）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('en-US')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('pro')
      expect(errors[0].message).toContain('basic')
      expect(errors[0].message).toContain('free')
      expect(errors[0].message).not.toContain('{{#valids}}')
      expect(errors[0].message).not.toContain('{{#allowed}}')
    })

    it('应该正确显示枚举值（中文 zh-CN）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('zh-CN')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('pro')
      expect(errors[0].message).toContain('basic')
      expect(errors[0].message).toContain('free')
      expect(errors[0].message).not.toContain('{{#valids}}')
    })

    it('应该正确显示枚举值（西班牙语 es-ES）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('es-ES')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('pro')
      expect(errors[0].message).toContain('basic')
      expect(errors[0].message).toContain('free')
      expect(errors[0].message).not.toContain('{{#valids}}')
    })

    it('应该正确显示枚举值（法语 fr-FR）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('fr-FR')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('pro')
      expect(errors[0].message).toContain('basic')
      expect(errors[0].message).toContain('free')
      expect(errors[0].message).not.toContain('{{#valids}}')
    })

    it('应该正确显示枚举值（日语 ja-JP）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('ja-JP')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      expect(errors.length).toBe(1)
      expect(errors[0].message).toContain('pro')
      expect(errors[0].message).toContain('basic')
      expect(errors[0].message).toContain('free')
      expect(errors[0].message).not.toContain('{{#valids}}')
    })

  })

  describe('additionalProperties 错误消息 - 所有语言', () => {

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

    const compiledSchema = ajv.compile(schema)
    const testData = { name: 'John', age: 30, email: 'john@example.com' }

    it('应该正确显示未知属性名（英文 en-US）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('en-US')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      const error = errors.find(e => e.keyword === 'additionalProperties')
      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

    it('应该正确显示未知属性名（中文 zh-CN）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('zh-CN')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      const error = errors.find(e => e.keyword === 'additionalProperties')
      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

    it('应该正确显示未知属性名（西班牙语 es-ES）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('es-ES')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      const error = errors.find(e => e.keyword === 'additionalProperties')
      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

    it('应该正确显示未知属性名（法语 fr-FR）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('fr-FR')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      const error = errors.find(e => e.keyword === 'additionalProperties')
      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

    it('应该正确显示未知属性名（日语 ja-JP）', () => {
      const valid = compiledSchema(testData)
      expect(valid).toBe(false)

      const formatter = new ErrorFormatter('ja-JP')
      const errors = formatter.formatDetailed(compiledSchema.errors!)

      const error = errors.find(e => e.keyword === 'additionalProperties')
      expect(error).toBeTruthy()
      if (error) {
        expect(error.message).toContain('email')
        expect(error.message).not.toContain('{{#key}}')
      }
    })

  })

})
