/**
 * Multi-language Error Message Tests (v2 TypeScript)
 * Full coverage of all languages
 */

import { describe, it, expect } from 'vitest'
import Ajv from 'ajv'
import { validate, Validator } from '../../src/index.js'
import { ErrorFormatter } from '../../src/core/ErrorFormatter.js'

describe('ErrorFormatter - Multi-language Completeness Tests', () => {

  describe('enum error messages - all languages', () => {

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

    it('should correctly display enum values (English en-US)', () => {
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

    it('should correctly display enum values (Chinese zh-CN)', () => {
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

    it('should correctly display enum values (Spanish es-ES)', () => {
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

    it('should correctly display enum values (French fr-FR)', () => {
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

    it('should correctly display enum values (Japanese ja-JP)', () => {
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

  describe('additionalProperties error messages - all languages', () => {

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

    it('should correctly display unknown property name (English en-US)', () => {
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

    it('should correctly display unknown property name (Chinese zh-CN)', () => {
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

    it('should correctly display unknown property name (Spanish es-ES)', () => {
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

    it('should correctly display unknown property name (French fr-FR)', () => {
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

    it('should correctly display unknown property name (Japanese ja-JP)', () => {
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
