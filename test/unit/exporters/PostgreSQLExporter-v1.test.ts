/**
 * PostgreSQLExporter 测试 — v2 迁移（v1 PostgreSQLExporter.test.js）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PostgreSQLExporter, dsl } from '../../../src/index.js'

describe('PostgreSQLExporter', () => {
  let exporter: InstanceType<typeof PostgreSQLExporter>

  beforeEach(() => {
    exporter = new PostgreSQLExporter({ quoteIdentifiers: true })
  })

  describe('构造函数', () => {
    it('应该创建 PostgreSQLExporter 实例', () => {
      expect(exporter).toBeInstanceOf(PostgreSQLExporter)
    })

    it('应该使用默认选项', () => {
      expect((exporter as any).options.schema).toBe('public')
    })

    it('应该接受自定义选项', () => {
      const customExporter = new PostgreSQLExporter({ schema: 'app' })
      expect((customExporter as any).options.schema).toBe('app')
    })
  })

  describe('export()', () => {
    it('应该导出基本 Schema', () => {
      const schema = dsl({ name: 'string!', age: 'number' })
      const ddl = exporter.export('users', schema)

      // v2: quoteIdentifiers=true 时标识符使用双引号，string 无 maxLength → VARCHAR(255)
      expect(ddl).toContain('CREATE TABLE "public"."users"')
      expect(ddl).toContain('"name" VARCHAR(255) NOT NULL')
      expect(ddl).toContain('"age" DOUBLE PRECISION')
    })

    it('应该处理主键 (id)', () => {
      const schema = dsl({ id: 'number!', name: 'string' })
      const ddl = exporter.export('users', schema)
      // v2: 主键标识符也使用双引号
      expect(ddl).toContain('PRIMARY KEY ("id")')
    })

    it('应该转换字符串约束', () => {
      const schema = dsl({ bio: 'string:-1000', code: 'string:-10' })
      const ddl = exporter.export('profiles', schema)

      // v2: maxLength > 255 → TEXT, maxLength ≤ 255 → VARCHAR(N)
      expect(ddl).toContain('"bio" TEXT')
      expect(ddl).toContain('"code" VARCHAR(10)')
    })

    it('应该转换数值约束', () => {
      const schema = dsl({ count: 'integer', score: 'number' })
      const ddl = exporter.export('stats', schema)

      // v2: integer → BIGINT
      expect(ddl).toContain('"count" BIGINT')
      expect(ddl).toContain('"score" DOUBLE PRECISION')
    })

    it('应该转换布尔值', () => {
      const schema = dsl({ active: 'boolean!' })
      const ddl = exporter.export('flags', schema)
      expect(ddl).toContain('"active" BOOLEAN NOT NULL')
    })

    it('应该转换日期', () => {
      const schema = dsl({ created_at: 'date!' })
      const ddl = exporter.export('logs', schema)
      // v2: date DSL → {type:'string',format:'date'} → DATE
      expect(ddl).toContain('"created_at" DATE NOT NULL')
    })

    it('应该转换对象为JSONB', () => {
      const schema = dsl({ meta: 'object' })
      const ddl = exporter.export('data', schema)
      expect(ddl).toContain('"meta" JSONB')
    })

    it('应该转换数组为JSONB（v2: array 类型 → JSONB）', () => {
      const schema = { type: 'object', properties: { tags: { type: 'array' } } } as any
      const ddl = exporter.export('posts', schema)
      expect(ddl).toContain('"tags" JSONB')
    })

    it('应该添加表注释', () => {
      const schema = dsl({ name: 'string' }) as any
      schema.description = 'User table'
      const ddl = exporter.export('users', schema)
      // v2: 使用带引号的标识符
      expect(ddl).toContain(`COMMENT ON TABLE "public"."users" IS 'User table'`)
    })

    it('应该添加列注释', () => {
      const schema = dsl({ name: 'string' }) as any
      schema.properties.name.description = 'User name'
      const ddl = exporter.export('users', schema)
      // v2: 使用带引号的三段式 schema.table.column
      expect(ddl).toContain(`COMMENT ON COLUMN "public"."users"."name" IS 'User name'`)
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
