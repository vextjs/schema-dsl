/**
 * Format Localization Tests (v2 TypeScript)
 * Tests for localization of format validation error messages
 *
 * NOTE: default locale is 'en-US'. Expected messages use {{#label}} which renders
 * as 'value' when validating a non-object scalar value (the default label).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, Validator } from '../../src/index.js'

describe('Format Localization', () => {
  const validator = new Validator()

  it('should return localized error for email', () => {
    const schema = dsl('email!').toSchema()

    const resCN = validator.validate(schema, 'invalid-email', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('value\u5fc5\u987b\u662f\u6709\u6548\u7684\u90ae\u7bb1\u5730\u5740')

    const resEN = validator.validate(schema, 'invalid-email', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('value must be a valid email address')
  })

  it('should return localized error for url', () => {
    const schema = dsl('url!').toSchema()

    const resCN = validator.validate(schema, 'invalid-url', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('value\u5fc5\u987b\u662f\u6709\u6548\u7684URL\u5730\u5740')
  })

  it('should return localized error for ipv4', () => {
    const schema = dsl('ipv4!').toSchema()

    const resCN = validator.validate(schema, '999.999.999.999', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('value\u5fc5\u987b\u662f\u6709\u6548\u7684IPv4\u5730\u5740')
  })
})
