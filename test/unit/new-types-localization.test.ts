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
    expect(resCN.errors[0].message).toBe('无效的 ObjectId')

    const resEN = validator.validate(schema, 'invalid-id', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid ObjectId')
  })

  it('should return localized error for hexColor', () => {
    const schema = dsl('hexColor!').toSchema()

    const resCN = validator.validate(schema, 'invalid-color', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('无效的十六进制颜色值')

    const resEN = validator.validate(schema, 'invalid-color', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid Hex Color')
  })

  it('should return localized error for macAddress', () => {
    const schema = dsl('macAddress!').toSchema()

    const resCN = validator.validate(schema, 'invalid-mac', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('无效的 MAC 地址')

    const resEN = validator.validate(schema, 'invalid-mac', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid MAC Address')
  })

  it('should return localized error for cron', () => {
    const schema = dsl('cron!').toSchema()

    const resCN = validator.validate(schema, 'invalid-cron', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('无效的 Cron 表达式')

    const resEN = validator.validate(schema, 'invalid-cron', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Invalid Cron Expression')
  })

  it('should return localized error for slug', () => {
    const schema = dsl('string!').slug().toSchema()

    const resCN = validator.validate(schema, 'Invalid Slug', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('URL别名只能包含小写字母、数字和连字符')

    const resEN = validator.validate(schema, 'Invalid Slug', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('URL slug can only contain lowercase letters, numbers, and hyphens')
  })

  it('should return localized error for username', () => {
    const schema = dsl('string!').username().toSchema()

    const resCN = validator.validate(schema, 'Invalid Username!', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('用户名必须以字母开头，只能包含字母、数字和下划线')

    const resEN = validator.validate(schema, 'Invalid Username!', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Username must start with a letter and contain only letters, numbers, and underscores')
  })

  it('should return localized error for password', () => {
    const schema = dsl('string!').password('medium').toSchema()

    const resCN = validator.validate(schema, 'abcdefgh', { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toBe('密码至少8位，需包含字母和数字')

    const resEN = validator.validate(schema, 'abcdefgh', { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toBe('Password must be at least 8 characters and contain letters and numbers')
  })
})
