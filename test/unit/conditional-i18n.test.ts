/**
 * ConditionalBuilder i18n Support Tests — v2 migration (v1 conditional-i18n.test.js)
 *
 * v2 changes:
 * - Locale.before/after → beforeAll/afterAll
 * - Locale.getMessageText() for string assertions; Locale.getMessage() retains v1 object return
 * - conditional.underAge key needs to be verified in v2 locale files
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { dsl, validate, Locale } from '../../src/index.js'

describe('ConditionalBuilder - i18n Support', () => {
  let originalLocale: string

  beforeAll(() => {
    originalLocale = Locale.getLocale()
  })

  afterAll(() => {
    Locale.setLocale(originalLocale)
  })

  it('should support using i18n keys (Chinese)', () => {
    // v2: conditional.underAge may not be built into the locale file
    // To support it, register via Locale.addLocale() or dsl.config({ i18n: ... })
    Locale.setLocale('zh-CN')

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('conditional.underAge'),
    })

    const result = validate(schema, { age: 16, status: 'active' })
    expect(result.valid).toBe(false)
    expect(result.errors![0].message).toBe('未成年用户不能注册')
  })

  it('should support using string messages directly (without locale key)', () => {
    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('未成年用户不能注册'),
    })

    const result = validate(schema, { age: 16, status: 'active' })
    expect(result.valid).toBe(false)
    expect(result.errors![0].message).toBe('未成年用户不能注册')
  })

  it('should support different conditions using different locale messages', () => {
    Locale.setLocale('zh-CN')

    const schema = dsl({
      type: 'string!',
      value: dsl
        .if((data: any) => data.type === 'age' && data.value < 0)
        .message('年龄不能为负数')
        .and((data: any) => data.type === 'age' && data.value > 150)
        .message('年龄不能超过150'),
    })

    const result = validate(schema, { type: 'age', value: -1 })
    expect(result.valid).toBe(false)
  })

  it('should not be affected by locale setting when condition is not met', () => {
    Locale.setLocale('en-US')

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('Too young'),
    })

    const result = validate(schema, { age: 20, status: 'active' })
    expect(result.valid).toBe(true)
  })
})
