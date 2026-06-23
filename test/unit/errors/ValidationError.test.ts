import { describe, expect, it } from 'vitest'
import { ValidationError } from '../../../src/errors/ValidationError.js'
import type { ValidationErrorItem } from '../../../src/types/validate.js'

describe('ValidationError', () => {
  const fieldErrors: ValidationErrorItem[] = [
    {
      path: '/email',
      message: 'must be a valid email',
      keyword: 'format',
      params: { format: 'email' },
    },
    {
      path: '/age',
      message: 'must be >= 18',
      keyword: 'minimum',
      params: { limit: 18 },
    },
  ]

  it('formats empty error arrays with a friendly fallback message', () => {
    const error = new ValidationError([], { email: '' }, 422)

    expect(error.name).toBe('ValidationError')
    expect(error.message).toBe('Validation failed - Validation failed')
    expect(error.errors).toEqual([])
    expect(error.data).toEqual({ email: '' })
    expect(error.statusCode).toBe(422)
    expect(error.getErrorCount()).toBe(0)
  })

  it('formats field paths into the main message', () => {
    const error = new ValidationError(fieldErrors)

    expect(error.message).toBe('Validation failed: email: must be a valid email; age: must be >= 18')
  })

  it('keeps a single conditional error message unprefixed', () => {
    const error = new ValidationError([
      {
        path: '',
        message: 'Condition failed',
        keyword: 'conditional',
        params: {},
      },
    ])

    expect(error.message).toBe('Condition failed')
  })

  it('serializes details and optional params for API responses', () => {
    const error = new ValidationError(fieldErrors, undefined, 409)

    expect(error.toJSON()).toEqual({
      error: 'ValidationError',
      message: 'Validation failed: email: must be a valid email; age: must be >= 18',
      statusCode: 409,
      details: [
        {
          field: 'email',
          message: 'must be a valid email',
          keyword: 'format',
          params: { format: 'email' },
        },
        {
          field: 'age',
          message: 'must be >= 18',
          keyword: 'minimum',
          params: { limit: 18 },
        },
      ],
    })
  })

  it('looks up field errors with and without a leading slash', () => {
    const error = new ValidationError(fieldErrors)

    expect(error.getFieldError('email')).toBe(fieldErrors[0])
    expect(error.getFieldError('/age')).toBe(fieldErrors[1])
    expect(error.getFieldError('missing')).toBeNull()
    expect(error.hasFieldError('email')).toBe(true)
    expect(error.hasFieldError('missing')).toBe(false)
  })

  it('returns a field-to-message map while skipping root errors', () => {
    const error = new ValidationError([
      ...fieldErrors,
      { path: '', message: 'root issue', keyword: 'custom', params: {} },
    ])

    expect(error.getFieldErrors()).toEqual({
      email: 'must be a valid email',
      age: 'must be >= 18',
    })
  })
})
