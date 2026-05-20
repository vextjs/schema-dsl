/**
 * Label Translation Tests (v2 TypeScript)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { dsl, Validator, Locale } from '../../src/index.js'

describe('Label Translation', () => {
  const validator = new Validator()

  beforeAll(() => {
    Locale.addLocale('zh-CN', {
      'label.test_field': 'Test Field ZH'
    })
    Locale.addLocale('en-US', {
      'label.test_field': 'Test Field'
    })
  })

  it('should translate label in error message', () => {
    const schema = dsl('string!').label('label.test_field').toSchema()

    // zh-CN
    const resCN = validator.validate(schema, null, { locale: 'zh-CN' }) as any
    expect(resCN.valid).toBe(false)
    expect(resCN.errors[0].message).toContain('Test Field ZH')

    // en-US
    const resEN = validator.validate(schema, null, { locale: 'en-US' }) as any
    expect(resEN.valid).toBe(false)
    expect(resEN.errors[0].message).toContain('Test Field')
  })
})
