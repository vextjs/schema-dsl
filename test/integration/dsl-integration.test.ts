/**
 * Integration Tests — v2 module end-to-end
 * Tests equivalent functionality via individual modules.
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
  it('should be a valid semver string', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('version should start with 2.x', () => {
    expect(pkg.version.startsWith('2.')).toBe(true)
  })
})

describe('DslBuilder (equivalent to dsl(string))', () => {
  it('should return a DslBuilder instance', () => {
    const b = new DslBuilder('string!')
    expect(b).toHaveProperty('toSchema')
    expect(b).toHaveProperty('toJsonSchema')
    expect(b._isDslBuilder).toBe(true)
  })

  it('should support chaining label()', () => {
    const b = new DslBuilder('string!').label('full-name')
    expect(b.toSchema()._label).toBe('full-name')
  })

  it('should support chaining min().max()', () => {
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

describe('DslParser.parseObject (equivalent to dsl(object))', () => {
  it('should map flat fields', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    expect(schema.type).toBe('object')
    expect(schema.properties?.['name']?.type).toBe('string')
  })

  it('should build the required array correctly', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    expect(schema.required).toContain('name')
    expect(schema.required).not.toContain('age')
  })

  it('should handle nested object DSL', () => {
    const schema = DslParser.parseObject({ user: { name: 'string!', age: 'number' } })
    expect(schema.properties?.['user']?.type).toBe('object')
  })
})

describe('ConditionalBuilder.start (equivalent to dsl.if())', () => {
  it('should return a ConditionalBuilder', () => {
    const cb = ConditionalBuilder.start(() => true)
    expect(cb).toHaveProperty('toSchema')
    expect(cb).toHaveProperty('message')
  })
})

describe('Validator + DslParser end-to-end', () => {
  let v: Validator

  v = new Validator()

  it('valid data should pass', () => {
    const schema = DslParser.parseObject({ name: 'string!', age: 'number' })
    const result = v.validate(schema, { name: 'Alice', age: 25 })
    expect(result.valid).toBe(true)
  })

  it('invalid data should fail', () => {
    const schema = DslParser.parseObject({ name: 'string!' })
    const result = v.validate(schema, {})
    expect(result.valid).toBe(false)
  })

  it('email format validation', () => {
    const schema = DslParser.parseObject({ email: 'email!' })
    const ok = v.validate(schema, { email: 'user@example.com' })
    expect(ok.valid).toBe(true)
    const fail = v.validate(schema, { email: 'not-an-email' })
    expect(fail.valid).toBe(false)
  })

  it('number range validation', () => {
    const schema = DslParser.parseObject({ score: 'number:0-100!' })
    const ok = v.validate(schema, { score: 85 })
    expect(ok.valid).toBe(true)
    const fail = v.validate(schema, { score: 150 })
    expect(fail.valid).toBe(false)
  })
})
