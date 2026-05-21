import { describe, expect, it } from 'vitest'
import { TypeConverter } from '../../../src/index.js'

describe('TypeConverter - MySQL integer sizing', () => {
  it('should use TINYINT when minimum and maximum both fit the signed tinyint range', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -128,
      maximum: 127,
    })).toBe('TINYINT')
  })

  it('should use SMALLINT when minimum and maximum both fit the signed smallint range', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -32768,
      maximum: 32767,
    })).toBe('SMALLINT')
  })

  it('should promote to INT when the minimum exceeds SMALLINT capacity even if maximum is small', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -40000,
      maximum: 100,
    })).toBe('INT')
  })

  it('should stay conservative when only one bound is provided', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      maximum: 100,
    })).toBe('BIGINT')

    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -100,
    })).toBe('BIGINT')
  })
})

