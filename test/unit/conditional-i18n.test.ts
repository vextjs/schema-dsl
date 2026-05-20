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
    expect(result.errors![0].message).toBe('\u672a\u6210\u5e74\u7528\u6237\u4e0d\u80fd\u6ce8\u518c')
  })

  it('should support using string messages directly (without locale key)', () => {
    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('Underage users cannot register'),
    })

    const result = validate(schema, { age: 16, status: 'active' })
    expect(result.valid).toBe(false)
    expect(result.errors![0].message).toBe('Underage users cannot register')
  })

  it('should support different conditions using different locale messages', () => {
    Locale.setLocale('zh-CN')

    const schema = dsl({
      type: 'string!',
      value: dsl
        .if((data: any) => data.type === 'age' && data.value < 0)
        .message('Age cannot be negative')
        .and((data: any) => data.type === 'age' && data.value > 150)
        .message('Age cannot exceed 150'),
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
