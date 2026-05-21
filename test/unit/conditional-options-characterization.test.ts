import { describe, expect, it } from 'vitest'
import { dsl } from '../../src/index.js'

describe('ConditionalBuilder - per-call options characterization', () => {
  it('should honor allErrors for each validate() call', () => {
    const conditional = dsl
      .if(() => true)
      .then({
        type: 'string',
        minLength: 5,
        pattern: '^[A-Z]+$',
      })

    const singleError = conditional.validate('ab', { allErrors: false })
    expect(singleError.valid).toBe(false)
    expect(singleError.errors).toHaveLength(1)
    expect(singleError.errors?.map(error => error.keyword)).toEqual(['minLength'])

    const allErrors = conditional.validate('ab', { allErrors: true })
    expect(allErrors.valid).toBe(false)
    expect(allErrors.errors?.map(error => error.keyword)).toEqual(['minLength', 'pattern'])
  })

  it('should honor useDefaults for each validate() call', () => {
    const conditional = dsl
      .if(() => true)
      .then({
        type: 'object',
        properties: {
          name: { type: 'string', default: 'fallback' },
        },
      })

    const firstInput: Record<string, unknown> = {}
    const firstResult = conditional.validate(firstInput, { useDefaults: false })
    expect(firstResult.valid).toBe(true)
    expect(firstResult.data).toEqual({})
    expect(firstInput).toEqual({})

    const secondInput: Record<string, unknown> = {}
    const secondResult = conditional.validate(secondInput, { useDefaults: true })
    expect(secondResult.valid).toBe(true)
    expect(secondResult.data).toEqual({ name: 'fallback' })
    expect(secondInput).toEqual({ name: 'fallback' })
  })

  it('should honor per-call options in validateAsync()', async () => {
    const conditional = dsl
      .if(() => true)
      .then({
        type: 'object',
        properties: {
          name: { type: 'string', default: 'fallback' },
        },
      })

    const firstInput: Record<string, unknown> = {}
    const firstResult = await conditional.validateAsync(firstInput, { useDefaults: false })
    expect(firstResult.valid).toBe(true)
    expect(firstResult.data).toEqual({})

    const secondInput: Record<string, unknown> = {}
    const secondResult = await conditional.validateAsync(secondInput, { useDefaults: true })
    expect(secondResult.valid).toBe(true)
    expect(secondResult.data).toEqual({ name: 'fallback' })
    expect(secondInput).toEqual({ name: 'fallback' })
  })
})


