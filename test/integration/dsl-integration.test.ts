/**
 * 集成测试 — v2 模块端到端
 * 注意：不从 src/index.ts 导入，避免 installStringExtensions 在测试环境崩溃
 * 用独立模块直接测试等效功能
 */

import { describe, it, expect } from 'vitest'
import { DslBuilder } from '../../src/core/DslBuilder.js'
import { DslParser } from '../../src/parser/DslParser.js'
import { Validator } from '../../src/core/Validator.js'
import { ConditionalBuilder } from '../../src/core/ConditionalBuilder.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8')) as { version: string }

describe('VERSION', () => {
  it('是合法的 semver 字符串', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('版本为 2.x', () => {
    expect(pkg.version.startsWith('2.')).toBe(true)
  })
})

describe('DslBuilder（等同 dsl(string)）', () => {
  it('返回 DslBuilder 实例', () => {
    const b = new DslBuilder('string!')
    expect(b).toHaveProperty('toSchema')
    expect(b).toHaveProperty('toJsonSchema')
    expect(b._isDslBuilder).toBe(true)
  })

  it('链式调用 label()', () => {
    const b = new DslBuilder('string!').label('姓名')
    expect(b.toSchema()._label).toBe('姓名')
  })

  it('链式 min().max()', () => {
    const s = new DslBuilder('string!').min(3).max(32).toSchema()
    expect(s.minLength).toBe(3)
    expect(s.maxLength).toBe(32)
  })

  it('email!', () => {
    const s = new DslBuilder('email!').toSchema()
    expect(s.format).toBe('email')
    expect(s._required).toBe(true)
  })
})

describe('DslParser.parseObject（等同 dsl(object)）', () => {
  it('扁平映射', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    expect(schema.type).toBe('object')
    expect(schema.properties?.['name']?.type).toBe('string')
  })

  it('required 数组正确', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    expect(schema.required).toContain('name')
    expect(schema.required).not.toContain('age')
  })

  it('嵌套对象 DSL', () => {
    const schema = DslParser.parseObject({ user: { name: 'string!', age: 'number' } })
    expect(schema.properties?.['user']?.type).toBe('object')
  })
})

describe('ConditionalBuilder.start（等同 dsl.if()）', () => {
  it('返回 ConditionalBuilder', () => {
    const cb = ConditionalBuilder.start(() => true)
    expect(cb).toHaveProperty('toSchema')
    expect(cb).toHaveProperty('message')
  })
})

describe('Validator + DslParser 端到端', () => {
  let v: Validator

  v = new Validator()

  it('有效数据通过', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    const result = v.validate(schema, { name: 'Alice', age: 25 })
    expect(result.valid).toBe(true)
  })

  it('无效数据报错', () => {
    const schema = DslParser.parseObject({ name: 'string!' })
    const result = v.validate(schema, {})
    expect(result.valid).toBe(false)
  })

  it('email 格式验证', () => {
    const schema = DslParser.parseObject({ email: 'email!' })
    const ok = v.validate(schema, { email: 'user@example.com' })
    expect(ok.valid).toBe(true)
    const fail = v.validate(schema, { email: 'not-an-email' })
    expect(fail.valid).toBe(false)
  })

  it('number range 验证', () => {
    const schema = DslParser.parseObject({ score: 'number:0-100!' })
    const ok = v.validate(schema, { score: 85 })
    expect(ok.valid).toBe(true)
    const fail = v.validate(schema, { score: 150 })
    expect(fail.valid).toBe(false)
  })
})
