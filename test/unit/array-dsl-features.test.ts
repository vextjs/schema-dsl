/**
 * v2.0.1 New Feature Tests — v2 Migration (v1 array-dsl-features.test.js)
 * Array DSL Syntax + Schema Reuse + Schema Extension + Batch Validation
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, SchemaUtils, Validator } from '../../src/index.js'

describe('v2.0.1 New Features', () => {
  // ========== 1. Array DSL Syntax ==========
  describe('Array DSL Syntax', () => {
    it('should support array!1-10 syntax', () => {
      const schema = dsl({ tags: 'array!1-10' })
      expect((schema as any).properties.tags.type).toBe('array')
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).required).toContain('tags')
    })

    it('should support array:1-10 syntax (optional)', () => {
      const schema = dsl({ tags: 'array:1-10' })
      expect((schema as any).properties.tags.type).toBe('array')
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).required ?? []).not.toContain('tags')
    })

    it('should support array!1- syntax (minimum only)', () => {
      const schema = dsl({ tags: 'array!1-' })
      expect((schema as any).properties.tags.minItems).toBe(1)
      expect((schema as any).properties.tags.maxItems).toBeUndefined()
    })

    it('should support array!-10 syntax (maximum only)', () => {
      const schema = dsl({ tags: 'array!-10' })
      expect((schema as any).properties.tags.maxItems).toBe(10)
      expect((schema as any).properties.tags.minItems).toBeUndefined()
    })

    it('should validate array length', () => {
      const schema = dsl({ tags: 'array!1-3' })
      expect(validate(schema, { tags: ['a', 'b'] }).valid).toBe(true)
      expect(validate(schema, { tags: [] }).valid).toBe(false)
      expect(validate(schema, { tags: ['a', 'b', 'c', 'd'] }).valid).toBe(false)
    })
  })

  // ========== 2. Schema Reuse ==========
  describe('Schema Reuse', () => {
    it('should support reusable to create reusable fields', () => {
      const emailField = SchemaUtils.reusable(() => dsl('email!'))

      const schema1 = dsl({ email: emailField() })
      const schema2 = dsl({ contact: emailField() })

      expect((schema1 as any).properties.email.format).toBe('email')
      expect((schema2 as any).properties.contact.format).toBe('email')
    })

    it('should support createLibrary to create field library', () => {
      const fields = SchemaUtils.createLibrary({
        email: () => 'email!',
        phone: () => 'string:-11',
      })

      const schema = dsl({
        email: fields.email(),
        phone: fields.phone(),
      })

      expect((schema as any).properties.email.format).toBe('email')
      expect((schema as any).properties.phone.maxLength).toBe(11)
    })
  })

  // ========== 3. Schema Extension ==========
  describe('Schema Extension', () => {
    it('should extend Schema', () => {
      const schema1 = dsl({ name: 'string!' })
      const extended = SchemaUtils.extend(schema1, dsl({ age: 'number' }))

      expect(Object.keys((extended as any).properties)).toHaveLength(2)
      expect((extended as any).properties.name).toBeDefined()
      expect((extended as any).properties.age).toBeDefined()
      expect((extended as any).required).toContain('name')
    })

    it('should support pick to filter fields', () => {
      const full = dsl({ name: 'string!', email: 'email!', password: 'string!' })
      const picked = SchemaUtils.pick(full, ['name', 'email'])

      expect(Object.keys((picked as any).properties)).toHaveLength(2)
      expect((picked as any).properties.password).toBeUndefined()
    })

    it('should support omit to exclude fields', () => {
      const full = dsl({ name: 'string!', email: 'email!', password: 'string!' })
      const omitted = SchemaUtils.omit(full, ['password'])

      expect(Object.keys((omitted as any).properties)).toHaveLength(2)
      expect((omitted as any).properties.password).toBeUndefined()
    })
  })

  // ========== 4. Batch Validation ==========
  describe('Batch Validation', () => {
    it('should batch validate multiple records', () => {
      const schema = dsl({ email: 'email!' })
      const data = [
        { email: 'valid1@example.com' },
        { email: 'invalid' },
        { email: 'valid2@example.com' },
      ]

      const result = SchemaUtils.validateBatch(schema, data, new Validator())

      expect(result.summary.total).toBe(3)
      expect(result.summary.valid).toBe(2)
      expect(result.summary.invalid).toBe(1)
      expect(result.results).toHaveLength(3)
    })

    it('batch validation should include performance statistics', () => {
      const schema = dsl({ email: 'email!' })
      const data = [{ email: 'test@example.com' }]

      const result = SchemaUtils.validateBatch(schema, data, new Validator())

      expect(result.summary).toBeDefined()
      expect(typeof result.summary.total).toBe('number')
    })
  })
})
