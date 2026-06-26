/**
 * JSONSchemaCore Tests — v2 Migration
 *
 * v2 changes: JSONSchemaCore is an internal class and is not directly exported.
 * Use dsl + validate to test equivalent functionality, or via SchemaCompiler/SchemaHelper.
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate, Validator } from '../../../src/index.js'
import { JSONSchemaCore } from '../../../src/core/JSONSchemaCore.js'

describe('JSONSchemaCore direct compatibility facade', () => {
  it('builds object schemas through the v1-compatible chain API', () => {
    const core = new JSONSchemaCore()
      .type('object')
      .property('name', { type: 'string' })
      .properties({ age: { type: 'integer' } })
      .required('name')

    expect(core.toSchema()).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name'],
    })
    expect(core.getSchema()).toBe(core.toSchema())
  })

  it('treats __proto__ as a normal property name in the v1-compatible chain API', () => {
    const core = new JSONSchemaCore()
      .type('object')
      .property('__proto__', { type: 'string' })
      .properties({ name: { type: 'string' } })
      .required('__proto__')

    const schema = core.toSchema()

    expect(Object.getPrototypeOf(schema.properties)).toBeNull()
    expect(Object.prototype.hasOwnProperty.call(schema.properties, '__proto__')).toBe(true)
    expect(schema.properties?.['__proto__']).toEqual({ type: 'string' })
    expect(core.validate(JSON.parse('{"__proto__":"ok","name":"Ada"}')).valid).toBe(true)
    expect(core.validate(JSON.parse('{"__proto__":123,"name":"Ada"}')).valid).toBe(false)
    expect(core.validate({ name: 'Ada' }).valid).toBe(false)
  })

  it('supports scalar decorators and validation through the facade', () => {
    const core = new JSONSchemaCore({ type: 'string' })
      .format('email')
      .pattern(/^[^@]+@example\.com$/)

    expect(core.toSchema()).toEqual({
      type: 'string',
      format: 'email',
      pattern: '^[^@]+@example\\.com$',
    })
    expect(core.validate('user@example.com').valid).toBe(true)
    expect(core.validate('user@test.com').valid).toBe(false)
  })

  it('supports array items and array-form required input', () => {
    const core = new JSONSchemaCore()
      .type('array')
      .items({ type: 'number' })
      .required(['items'])

    expect(core.toSchema()).toEqual({
      type: 'array',
      items: { type: 'number' },
      required: ['items'],
    })
  })
})

describe('JSONSchemaCore (v2 equivalent tests via dsl/validate)', () => {
  describe('Basic Schema Building', () => {
    it('v2: dsl() generates standard JSON Schema (no $schema property)', () => {
      // v2 does not add $schema property to dsl() output (keeps Schema lean)
      const schema = dsl({ name: 'string' })
      expect(schema.type).toBe('object')
    })

    it('should generate type: object Schema', () => {
      const schema = dsl({ name: 'string', age: 'number' })
      expect(schema.type).toBe('object')
      expect(schema.properties).toHaveProperty('name')
      expect(schema.properties).toHaveProperty('age')
    })

    it('should set string type', () => {
      const schema = dsl({ field: 'string' })
      expect((schema as any).properties.field.type).toBe('string')
    })

    it('should set number type', () => {
      const schema = dsl({ field: 'number' })
      expect((schema as any).properties.field.type).toBe('number')
    })
  })

  describe('Properties and Constraints', () => {
    it('should set required fields', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      expect((schema as any).required).toContain('name')
      expect((schema as any).required).not.toContain('age')
    })

    it('should set multiple required fields', () => {
      const schema = dsl({ name: 'string!', email: 'email!', age: 'number' })
      expect((schema as any).required).toContain('name')
      expect((schema as any).required).toContain('email')
    })

    it('should set string format', () => {
      const schema = dsl({ email: 'email' })
      expect((schema as any).properties.email.format).toBe('email')
    })

    it('should set regex pattern', () => {
      const schema = dsl({ code: (dsl('string!') as any).pattern('^[0-9]+$') })
      expect((schema as any).properties.code.pattern).toBe('^[0-9]+$')
    })

    it('should set array items', () => {
      const schema = dsl({ tags: 'array' })
      expect((schema as any).properties.tags.type).toBe('array')
    })

    it('should support minimum length constraint', () => {
      const schema = dsl({ name: 'string:3-' })
      expect((schema as any).properties.name.minLength).toBe(3)
    })
  })

  describe('Chained settings and getSchema()', () => {
    it('dsl() directly returns a JSON Schema object', () => {
      const schema = dsl({ name: 'string!' })
      expect(typeof schema).toBe('object')
      expect(schema).toHaveProperty('type', 'object')
      expect(schema).toHaveProperty('properties')
    })

    it('should support nested objects', () => {
      const schema = dsl({
        user: {
          name: 'string!',
          age: 'number',
        },
      })
      expect((schema as any).properties.user.type).toBe('object')
      expect((schema as any).properties.user.properties.name.type).toBe('string')
    })
  })

  describe('Validation', () => {
    it('should validate valid data', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const result = validate(schema, { name: 'John', age: 25 })
      expect(result.valid).toBe(true)
    })

    it('should detect missing required fields', () => {
      const schema = dsl({ name: 'string!' })
      const result = validate(schema, {})
      expect(result.valid).toBe(false)
    })

    it('should validate email format', () => {
      const schema = dsl({ email: 'email!' })
      expect(validate(schema, { email: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { email: 'not-an-email' }).valid).toBe(false)
    })

    it('should validate via Validator (options configuration)', () => {
      const validator = new Validator()
      const schema = dsl({ name: 'string!' })
      const result = validator.validate(schema, { name: 'Alice' })
      expect(result.valid).toBe(true)
    })
  })
})
