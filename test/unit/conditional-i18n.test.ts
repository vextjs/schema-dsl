/**
 * ConditionalBuilder 多语言支持测试 — v2 迁移（v1 conditional-i18n.test.js）
 *
 * v2 变更：
 * - Locale.before/after → beforeAll/afterAll
 * - Locale.getMessage() 返回 string（非对象）
 * - conditional.underAge key 需要验证是否在 v2 locale 文件中
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { dsl, validate, Locale } from '../../src/index.js'

describe('ConditionalBuilder - 多语言支持', () => {
  let originalLocale: string

  beforeAll(() => {
    originalLocale = Locale.getLocale()
  })

  afterAll(() => {
    Locale.setLocale(originalLocale)
  })

  it('应该支持使用多语言 key（中文）', () => {
    // v2: conditional.underAge 可能未内置在 locale 文件中
    // 如需支持，需通过 Locale.addLocale() 或 dsl.config({ i18n: ... }) 注册
    Locale.setLocale('zh-CN')

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('conditional.underAge'),
    })

    const result = validate(schema, { age: 16, status: 'active' })
    expect(result.valid).toBe(false)
    expect(result.errors![0].message).toBe('未成年用户不能注册')
  })

  it('应该支持直接使用字符串消息（不依赖 locale key）', () => {
    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('未成年用户不能注册'),
    })

    const result = validate(schema, { age: 16, status: 'active' })
    expect(result.valid).toBe(false)
    expect(result.errors![0].message).toBe('未成年用户不能注册')
  })

  it('应该支持不同条件使用不同语言消息', () => {
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

  it('条件不满足时不应受语言设置影响', () => {
    Locale.setLocale('en-US')

    const schema = dsl({
      age: 'number!',
      status: dsl.if((data: any) => data.age < 18).message('Too young'),
    })

    const result = validate(schema, { age: 20, status: 'active' })
    expect(result.valid).toBe(true)
  })
})
