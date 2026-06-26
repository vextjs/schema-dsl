/**
 * MongoDBExporter tests — v2 migration (v1 MongoDBExporter.test.js)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MongoDBExporter } from '../../../src/index.js'

describe('MongoDBExporter', () => {
  let exporter: InstanceType<typeof MongoDBExporter>

  beforeEach(() => {
    exporter = new MongoDBExporter()
  })

  describe('constructor', () => {
    it('should create a MongoDBExporter instance', () => {
      expect(exporter).toBeInstanceOf(MongoDBExporter)
    })

    it('should use default options (strict: false)', () => {
      expect((exporter as any).options.strict).toBe(false)
    })

    it('should accept custom options', () => {
      const customExporter = new MongoDBExporter({ strict: true })
      expect((customExporter as any).options.strict).toBe(true)
    })
  })

  describe('export()', () => {
    it('should export basic schema', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      }

      const result = exporter.export(jsonSchema)

      expect(result).toHaveProperty('$jsonSchema')
      expect((result as any).$jsonSchema.bsonType).toBe('object')
      expect((result as any).$jsonSchema.required).toEqual(['name'])
    })

    it('should convert types to bsonType', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
          score: { type: 'number' },
          active: { type: 'boolean' },
        },
      }

      const result = exporter.export(jsonSchema)
      const props = (result as any).$jsonSchema.properties

      expect(props.name.bsonType).toBe('string')
      expect(props.age.bsonType).toBe('int')
      expect(props.score.bsonType).toBe('double')
      expect(props.active.bsonType).toBe('bool')
    })

    it('should export __proto__ properties as own MongoDB schema properties', () => {
      const properties = Object.create(null)
      properties['__proto__'] = { type: 'string' }

      const result = exporter.export({
        type: 'object',
        properties,
        required: ['__proto__'],
      } as any)
      const props = (result as any).$jsonSchema.properties

      expect(Object.prototype.hasOwnProperty.call(props, '__proto__')).toBe(true)
      expect(Object.getPrototypeOf(props)).toBeNull()
      expect(props['__proto__'].bsonType).toBe('string')
    })

    it('should convert string constraints', () => {
      const jsonSchema = {
        type: 'string',
        minLength: 3,
        maxLength: 32,
        pattern: '^[a-z]+$',
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.minLength).toBe(3)
      expect((result as any).$jsonSchema.maxLength).toBe(32)
      expect((result as any).$jsonSchema.pattern).toBe('^[a-z]+$')
    })

    it('should convert numeric constraints', () => {
      const jsonSchema = {
        type: 'number',
        minimum: 0,
        maximum: 100,
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.minimum).toBe(0)
      expect((result as any).$jsonSchema.maximum).toBe(100)
    })

    it('should convert array constraints', () => {
      const jsonSchema = {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 10,
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.bsonType).toBe('array')
      expect((result as any).$jsonSchema.items.bsonType).toBe('string')
      expect((result as any).$jsonSchema.minItems).toBe(1)
      expect((result as any).$jsonSchema.maxItems).toBe(10)
    })

    it('should convert enum values', () => {
      const jsonSchema = {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.enum).toEqual(['active', 'inactive', 'pending'])
    })

    it('should preserve description', () => {
      const jsonSchema = {
        type: 'string',
        description: 'User name',
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.description).toBe('User name')
    })
  })

  describe('generateCreateCommand()', () => {
    it('should generate a createCollection command object', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      }

      const command = exporter.generateCreateCommand('users', jsonSchema)

      expect((command as any).collectionName).toBe('users')
      expect((command as any).options).toHaveProperty('validator')
      expect((command as any).options.validationLevel).toBe('moderate')
      expect((command as any).options.validationAction).toBe('error')
    })

    it('should support strict mode', () => {
      const strictExporter = new MongoDBExporter({ strict: true })
      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      }

      const command = strictExporter.generateCreateCommand('users', jsonSchema)

      expect((command as any).options.validationLevel).toBe('strict')
    })
  })

  describe('generateCommand()', () => {
    it('should generate an executable MongoDB command string', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      const commandStr = exporter.generateCommand('users', jsonSchema)

      expect(typeof commandStr).toBe('string')
      expect(commandStr).toContain('db.createCollection')
      expect(commandStr).toContain('"users"')
    })
  })

  describe('static methods', () => {
    it('MongoDBExporter.export() should export quickly', () => {
      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      }

      const result = MongoDBExporter.export(jsonSchema)

      expect(result).toHaveProperty('$jsonSchema')
    })
  })

  describe('nested objects', () => {
    it('should correctly handle nested objects', () => {
      const jsonSchema = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  bio: { type: 'string' },
                },
              },
            },
          },
        },
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.properties.user.bsonType).toBe('object')
      expect(
        (result as any).$jsonSchema.properties.user.properties.profile.bsonType
      ).toBe('object')
    })
  })
})
