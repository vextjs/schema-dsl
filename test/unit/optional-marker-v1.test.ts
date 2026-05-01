import { describe, expect, it, vi } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('可选标记 v1 兼容', () => {
  it('应该正确解析 string? 且不输出未知类型警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      const schema = dsl({ name: 'string?' })

      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
      expect(validate(schema, {}).valid).toBe(true)
      expect(warnSpy).not.toHaveBeenCalled()
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('应该正确解析 enum:... ? 为可选枚举', () => {
    const schema = dsl({ plan: 'enum:pro|basic?' })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        plan: {
          type: 'string',
          enum: ['pro', 'basic'],
        },
      },
    })
    expect(validate(schema, {}).valid).toBe(true)
    expect(validate(schema, { plan: 'pro' }).valid).toBe(true)
    expect(validate(schema, { plan: 'enterprise' }).valid).toBe(false)
  })

  it('应该正确解析 array<string>? 为可选数组字段', () => {
    const schema = dsl({ tags: 'array<string>?' })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    })
    expect(validate(schema, {}).valid).toBe(true)
    expect(validate(schema, { tags: ['a', 'b'] }).valid).toBe(true)
    expect(validate(schema, { tags: [1] }).valid).toBe(false)
  })

  it('应该正确解析 phone:cn? 为可选模式字段', () => {
    const schema = dsl({ phone: 'phone:cn?' })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        phone: {
          type: 'string',
          pattern: '^1[3-9]\\d{9}$',
          minLength: 11,
          maxLength: 11,
          _customMessages: { pattern: 'pattern.phone.cn' },
        },
      },
    })
    expect(validate(schema, {}).valid).toBe(true)
    expect(validate(schema, { phone: '13800138000' }).valid).toBe(true)
    expect(validate(schema, { phone: '123' }).valid).toBe(false)
  })

  it('应该保留 array!1-10 v1 必填简写兼容', () => {
    const schema = dsl({ items: 'array!1-10' })

    expect(schema).toEqual({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          maxItems: 10,
        },
      },
      required: ['items'],
    })
  })
})

