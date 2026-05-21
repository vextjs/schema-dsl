/**
 * Error Message Interpolation Tests (v2 TypeScript)
 * Ensure all template variables are correctly substituted
 */

import { describe, it, expect } from 'vitest'
import { Ajv } from 'ajv'
import { dsl, validate, Validator } from '../../src/index.js'
import { ErrorFormatter } from '../../src/core/ErrorFormatter.js'

describe('ErrorFormatter - Parameter Mapping Completeness Tests', () => {

  describe('enum error messages', () => {

    it('should correctly display enum values (required)', () => {
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

    it('should correctly display enum values (optional)', () => {
      const schema = dsl({ plan_type: 'enum:pro|basic?' })

      const result = validate(schema, { plan_type: 'premium' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('pro')
      expect(error.message).toContain('basic')
      expect(error.message).not.toContain('{{#valids}}')
      expect(error.message).not.toContain('{{#allowed}}')
    })

    it('should support number enum', () => {
      const schema = dsl({ priority: '1|2|3!' })

      // Pass an integer not in the enum (to get enum error, not type error)
      const result = validate(schema, { priority: 5 }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('1')
      expect(error.message).toContain('2')
      expect(error.message).toContain('3')
    })

    it('should support Chinese error messages', () => {
      const schema = dsl({ status: 'active|inactive!' })

      // v2: locale goes in options (3rd arg)
      const result = validate(schema, { status: 'unknown' }, { locale: 'zh-CN' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(error.message).toContain('active')
      expect(error.message).toContain('inactive')
      expect(
        error.message.includes('\u4ee5\u4e0b\u503c\u4e4b\u4e00') || error.message.includes('\u5fc5\u987b\u662f')
      ).toBe(true)
    })

  })

  describe('additionalProperties error messages', () => {

    it('should correctly display unknown property name', () => {
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

  describe('required error messages', () => {

    it('should correctly display missing field names', () => {
      const schema = dsl({ name: 'string!', email: 'email!' })

      const result = validate(schema, {}) as any

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(2)

      const nameError = result.errors.find((e: any) => e.path === 'name')
      expect(nameError).toBeTruthy()
      expect(
        nameError.message.includes('name') ||
        nameError.message.includes('\u5fc5\u586b') ||
        nameError.message.includes('required')
      ).toBe(true)

      const emailError = result.errors.find((e: any) => e.path === 'email')
      expect(emailError).toBeTruthy()
      expect(
        emailError.message.includes('email') ||
        emailError.message.includes('\u5fc5\u586b') ||
        emailError.message.includes('required')
      ).toBe(true)
    })

  })

  describe('minLength/maxLength error messages', () => {

    it('should correctly display length limits', () => {
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

  describe('minimum/maximum error messages', () => {

    it('should correctly display numeric range', () => {
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

  describe('type error messages', () => {

    it('should correctly display expected type and actual type', () => {
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

  describe('minItems/maxItems error messages', () => {

    it('should correctly display array length limits', () => {
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

  describe('format error messages', () => {

    it('should correctly display format validation error', () => {
      const schema = dsl({ email: 'email!' })

      const result = validate(schema, { email: 'invalid-email' }) as any

      expect(result.valid).toBe(false)
      const error = result.errors[0]
      expect(
        error.message.toLowerCase().includes('email') || error.message.includes('\u683c\u5f0f')
      ).toBe(true)
      expect(error.message).not.toContain('{{#format}}')
    })

  })

  describe('i18n Support', () => {

    it('should correctly substitute variables in different locales', () => {
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
