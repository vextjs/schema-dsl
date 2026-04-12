/**
 * MySQLExporter 测试 — v2 迁移（v1 MySQLExporter.test.js）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { MySQLExporter, dsl } from '../../../src/index.js'

describe('MySQLExporter', () => {
  let exporter: InstanceType<typeof MySQLExporter>

  beforeEach(() => {
    exporter = new MySQLExporter()
  })

  describe('构造函数', () => {
    it('应该创建 MySQLExporter 实例', () => {
      expect(exporter).toBeInstanceOf(MySQLExporter)
    })

    it('应该使用默认选项', () => {
      expect((exporter as any).options.engine).toBe('InnoDB')
      expect((exporter as any).options.charset).toBe('utf8mb4')
    })

    it('应该接受自定义选项', () => {
      const customExporter = new MySQLExporter({ engine: 'MyISAM', charset: 'utf8' })
      expect((customExporter as any).options.engine).toBe('MyISAM')
      expect((customExporter as any).options.charset).toBe('utf8')
    })
  })

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const ddl = exporter.export('users', schema)

      expect(ddl).toContain('CREATE TABLE `users`')
      expect(ddl).toContain('`name` VARCHAR(255) NOT NULL')
      expect(ddl).toContain('`age` DOUBLE')
      expect(ddl).toContain('ENGINE=InnoDB')
    })

    it('应该处理主键 (id)', () => {
      const schema = dsl({ id: 'number!', name: 'string' })
      const ddl = exporter.export('users', schema)
      expect(ddl).toContain('PRIMARY KEY (`id`)')
    })

    it('应该处理主键 (_id)', () => {
      const schema = dsl({ _id: 'string!', name: 'string' })
      const ddl = exporter.export('users', schema)
      expect(ddl).toContain('PRIMARY KEY (`_id`)')
    })

    it('应该转换字符串约束（maxLength→TEXT / VARCHAR）', () => {
      // v2: string:-1000 = maxLength 1000, string:-10 = maxLength 10
      const schema = dsl({ bio: 'string:-1000', code: 'string:-10' })
      const ddl = exporter.export('profiles', schema)

      expect(ddl).toContain('`bio` TEXT')      // > 255 → TEXT
      expect(ddl).toContain('`code` VARCHAR(10)')
    })

    it('应该转换数值约束', () => {
      const schema = dsl({ count: 'integer', score: 'number' })
      const ddl = exporter.export('stats', schema)

      expect(ddl).toContain('`count` BIGINT')
      expect(ddl).toContain('`score` DOUBLE')
    })

    it('应该转换布尔值', () => {
      const schema = dsl({ active: 'boolean!' })
      const ddl = exporter.export('flags', schema)
      // v2: boolean → BOOLEAN
      expect(ddl).toContain('`active` BOOLEAN NOT NULL')
    })

    it('应该转换日期', () => {
      const schema = dsl({ created_at: 'date!' })
      const ddl = exporter.export('logs', schema)
      // v2: date DSL → JSON Schema {type:'string',format:'date'} → DATETIME
      expect(ddl).toContain('`created_at` DATETIME NOT NULL')
    })

    it('应该转换对象为JSON', () => {
      const schema = dsl({ meta: 'object' })
      const ddl = exporter.export('data', schema)
      expect(ddl).toContain('`meta` JSON')
    })

    it('应该转换数组为JSON（v2: array 类型 → JSON）', () => {
      // v2 不支持 array<string> 语法，直接使用 type:array schema
      const schema = { type: 'object', properties: { tags: { type: 'array' } } } as any
      const ddl = exporter.export('posts', schema)
      expect(ddl).toContain('`tags` JSON')
    })

    it('应该处理枚举值（v2: enum string → ENUM 类型）', () => {
      const schema = {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      } as any
      const ddl = exporter.export('users', schema)
      // v2: TypeConverter.toMySQLType 检测 enum 数组 → ENUM(...)
      expect(ddl).toContain("`status` ENUM('active', 'inactive')")
    })

    it('应该抛出错误当表名缺失', () => {
      expect(() => exporter.export(null as any, {})).toThrow('Table name is required')
    })

    it('应该抛出错误当Schema不是对象', () => {
      expect(() => exporter.export('users', { type: 'string' } as any)).toThrow(
        'JSON Schema must be an object type'
      )
    })
  })
})
