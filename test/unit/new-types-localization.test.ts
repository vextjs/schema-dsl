/**
 * New Types Localization Tests (v2 TypeScript)
 */

import { describe, it, expect } from 'vitest'
import { dsl, Validator } from '../../src/index.js'

describe('New Types Localization', () => {
  const validator = new Validator()

  it('should return localized error for objectId', () => {
    const schema = dsl('objectId!').toSchema()

    const resCN = validator.validate(schema, 'invalid-id', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u65e0\u6548\u7684 ObjectId')

    const resEN = validator.validate(schema, 'invalid-id', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid ObjectId')
  })

  it('should return localized error for hexColor', () => {
    const schema = dsl('hexColor!').toSchema()

    const resCN = validator.validate(schema, 'invalid-color', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u65e0\u6548\u7684\u5341\u516d\u8fdb\u5236\u989c\u8272\u503c')

    const resEN = validator.validate(schema, 'invalid-color', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid Hex Color')
  })

  it('should return localized error for macAddress', () => {
    const schema = dsl('macAddress!').toSchema()

    const resCN = validator.validate(schema, 'invalid-mac', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u65e0\u6548\u7684 MAC \u5730\u5740')

    const resEN = validator.validate(schema, 'invalid-mac', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid MAC Address')
  })

  it('should return localized error for cron', () => {
    const schema = dsl('cron!').toSchema()

    const resCN = validator.validate(schema, 'invalid-cron', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u65e0\u6548\u7684 Cron \u8868\u8fbe\u5f0f')

    const resEN = validator.validate(schema, 'invalid-cron', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid Cron Expression')
  })

  it('should return localized error for slug', () => {
    const schema = dsl('string!').slug().toSchema()

    const resCN = validator.validate(schema, 'Invalid Slug', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('URL\u522b\u540d\u53ea\u80fd\u5305\u542b\u5c0f\u5199\u5b57\u6bcd、\u6570\u5b57\u548c\u8fde\u5b57\u7b26')

    const resEN = validator.validate(schema, 'Invalid Slug', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('URL slug can only contain lowercase letters, numbers, and hyphens')
  })

  it('should return localized error for username', () => {
    const schema = dsl('string!').username().toSchema()

    const resCN = validator.validate(schema, 'Invalid Username!', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u7528\u6237\u540d\u5fc5\u987b\u4ee5\u5b57\u6bcd\u5f00\u5934，\u53ea\u80fd\u5305\u542b\u5b57\u6bcd、\u6570\u5b57\u548c\u4e0b\u5212\u7ebf')

    const resEN = validator.validate(schema, 'Invalid Username!', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Username must start with a letter and contain only letters, numbers, and underscores')
  })

  it('should return localized error for password', () => {
    const schema = dsl('string!').password('medium').toSchema()

    const resCN = validator.validate(schema, 'abcdefgh', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('\u5bc6\u7801\u81f3\u5c118\u4f4d，\u9700\u5305\u542b\u5b57\u6bcd\u548c\u6570\u5b57')

    const resEN = validator.validate(schema, 'abcdefgh', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Password must be at least 8 characters and contain letters and numbers')
  })
})
