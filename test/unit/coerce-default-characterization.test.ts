import { beforeEach, describe, expect, it } from 'vitest'
import { resetDefaultValidator, validate, validateAsync } from '../../src/index.js'

describe('Top-level validate coerce behavior characterization', () => {
  beforeEach(() => {
    resetDefaultValidator()
  })

  it('should coerce string numbers by default', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      },
      { age: '42' }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ age: 42 })
  })

  it('should preserve strings when the schema explicitly accepts string or number', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          value: { type: ['string', 'number'] },
        },
      },
      { value: '42' }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ value: '42' })
  })

  it('should coerce string booleans by default', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
        },
      },
      { ok: 'true' }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ ok: true })
  })

  it('should disable boolean coercion when coerce is false', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          ok: { type: 'boolean' },
        },
      },
      { ok: 'true' },
      { coerce: false }
    )

    expect(result.valid).toBe(false)
    expect(result.data).toEqual({ ok: 'true' })
    expect(result.errors?.[0].keyword).toBe('type')
  })

  it('should coerce boolean array items by default', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          flags: { type: 'array', items: { type: 'boolean' } },
        },
      },
      { flags: ['true', 'false'] }
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({ flags: [true, false] })
  })

  it('should disable numeric coercion when coerce is false', () => {
    const result = validate(
      {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      },
      { age: '42' },
      { coerce: false }
    )

    expect(result.valid).toBe(false)
    expect(result.data).toEqual({ age: '42' })
    expect(result.errors?.[0].keyword).toBe('type')
  })

  it('should mirror numeric coercion behavior in validateAsync()', async () => {
    await expect(validateAsync(
      {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      },
      { age: '42' }
    )).resolves.toEqual({ age: 42 })
  })
})

