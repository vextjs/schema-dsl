/**
 * Enum Feature Tests (v2 TypeScript)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('Enum - Features', () => {

  describe('Basic Enum Syntax', () => {

    it('should support shorthand form value1|value2 (string enum)', () => {
      const schema = dsl({ status: 'active|inactive|pending' })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'inactive' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
    })

    it('should support enum:value1|value2 format (string enum)', () => {
      const schema = dsl({ status: 'enum:active|inactive|pending' })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
    })

    it('should support required enum marker', () => {
      const schema = dsl({ status: 'active|inactive!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)
    })

  })

  describe('Boolean Enum', () => {

    it('should automatically detect boolean enums', () => {
      const schema = dsl({ isActive: 'true|false' })

      let result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: false }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: 'true' }) as any
      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ isActive: true })

      result = validate(schema, { isActive: 'true' }, { coerce: false }) as any
      expect(result.valid).toBe(false)
    })

    it('should support enum:boolean:true|false format', () => {
      const schema = dsl({ isActive: 'enum:boolean:true|false' })

      let result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: false }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { isActive: 'true' }) as any
      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ isActive: true })

      result = validate(schema, { isActive: 'true' }, { coerce: false }) as any
      expect(result.valid).toBe(false)
    })

    it('should support required boolean enum', () => {
      const schema = dsl({ isActive: 'true|false!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { isActive: true }) as any
      expect(result.valid).toBe(true)
    })

  })

  describe('Number Enum', () => {

    it('should automatically detect number enums', () => {
      const schema = dsl({ priority: '1|2|3' })

      let result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: 2 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: '1' }) as any
      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ priority: 1 })

      result = validate(schema, { priority: '1' }, { coerce: false }) as any
      expect(result.valid).toBe(false)

      result = validate(schema, { priority: 4 }) as any
      expect(result.valid).toBe(false)
    })

    it('should support enum:number:1|2|3 format', () => {
      const schema = dsl({ priority: 'enum:number:1|2|3' })

      let result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { priority: 4 }) as any
      expect(result.valid).toBe(false)
    })

    it('should support enum:integer:1|2|3 format', () => {
      const schema = dsl({ level: 'enum:integer:1|2|3' })

      let result = validate(schema, { level: 1 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { level: 1.5 }) as any
      expect(result.valid).toBe(false)
    })

    it('should support required number enum', () => {
      const schema = dsl({ priority: '1|2|3!' })

      let result = validate(schema, {}) as any
      expect(result.valid).toBe(false)
      expect(result.errors.some((e: any) =>
        e.message.includes('required') ||
        e.keyword === 'required'
      )).toBe(true)

      result = validate(schema, { priority: 1 }) as any
      expect(result.valid).toBe(true)
    })

    it('should support decimal enum', () => {
      const schema = dsl({ rating: '1.0|1.5|2.0|2.5' })

      let result = validate(schema, { rating: 1.5 }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { rating: 3.0 }) as any
      expect(result.valid).toBe(false)
    })

  })

  describe('Error Handling', () => {

    it('should throw error when boolean enum contains invalid value', () => {
      expect(() => {
        dsl({ flag: 'enum:boolean:true|false|maybe' })
      }).toThrow(/Invalid boolean enum value/)
    })

    it('should throw error when number enum contains invalid value', () => {
      expect(() => {
        dsl({ value: 'enum:number:1|2|abc' })
      }).toThrow(/Invalid number enum value/)
    })

  })

  describe('Integration with Other Features', () => {

    it('should support chained methods', () => {
      // v2: use dsl() builder instead of string method chaining
      const schema = dsl({
        status: dsl('active|inactive').label('Status')
      })

      let result = validate(schema, { status: 'active' }) as any
      expect(result.valid).toBe(true)

      result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('Status')
    })

    it('should support custom error messages', () => {
      const schema = dsl({
        status: dsl('active|inactive').messages({
          'string.enum': 'Status must be active or inactive'
        })
      })

      const result = validate(schema, { status: 'unknown' }) as any
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toContain('active or inactive')
    })

    it('should correctly use enums in objects', () => {
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

    it('should correctly use enums in arrays', () => {
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

  describe('Compatibility Tests', () => {

    it('should not affect other types with colons', () => {
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
