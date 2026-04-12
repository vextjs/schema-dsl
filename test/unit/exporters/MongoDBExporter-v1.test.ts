/**
 * MongoDBExporter 测试 — v2 迁移（v1 MongoDBExporter.test.js）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MongoDBExporter } from '../../../src/index.js'

describe('MongoDBExporter', () => {
  let exporter: InstanceType<typeof MongoDBExporter>

  beforeEach(() => {
    exporter = new MongoDBExporter()
  })

  describe('构造函数', () => {
    it('应该创建 MongoDBExporter 实例', () => {
      expect(exporter).toBeInstanceOf(MongoDBExporter)
    })

    it('应该使用默认选项（strict: false）', () => {
      expect((exporter as any).options.strict).toBe(false)
    })

    it('应该接受自定义选项', () => {
      const customExporter = new MongoDBExporter({ strict: true })
      expect((customExporter as any).options.strict).toBe(true)
    })
  })

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
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

    it('应该转换类型为 bsonType', () => {
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

    it('应该转换字符串约束', () => {
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

    it('应该转换数值约束', () => {
      const jsonSchema = {
        type: 'number',
        minimum: 0,
        maximum: 100,
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.minimum).toBe(0)
      expect((result as any).$jsonSchema.maximum).toBe(100)
    })

    it('应该转换数组约束', () => {
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

    it('应该转换枚举值', () => {
      const jsonSchema = {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.enum).toEqual(['active', 'inactive', 'pending'])
    })

    it('应该保留描述信息', () => {
      const jsonSchema = {
        type: 'string',
        description: 'User name',
      }

      const result = exporter.export(jsonSchema)

      expect((result as any).$jsonSchema.description).toBe('User name')
    })
  })

  describe('generateCreateCommand()', () => {
    it('应该生成 createCollection 命令对象', () => {
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

    it('应该支持严格模式', () => {
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
    it('应该生成可执行的 MongoDB 命令字符串', () => {
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

  describe('静态方法', () => {
    it('MongoDBExporter.export() 应该快速导出', () => {
      const jsonSchema = {
        type: 'object',
        properties: { name: { type: 'string' } },
      }

      const result = MongoDBExporter.export(jsonSchema)

      expect(result).toHaveProperty('$jsonSchema')
    })
  })

  describe('嵌套对象', () => {
    it('应该正确处理嵌套对象', () => {
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
