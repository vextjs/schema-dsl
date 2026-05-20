import { describe, expect, it, vi } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('Optional Marker v1 Compatibility', () => {
  it('should correctly parse string? without emitting unknown type warning', () => {
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

  it('should correctly parse enum:...? as optional enum', () => {
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

  it('should correctly parse array<string>? as optional array field', () => {
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

  it('should correctly parse phone:cn? as optional pattern field', () => {
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

  it('should preserve array!1-10 v1 required shorthand compatibility', () => {
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

