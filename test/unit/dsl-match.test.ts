/**
 * DSL Match Syntax Tests — v2 migration (v1 dsl-match.test.js)
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('DSL Match Syntax (v2.1.0)', () => {
  // v2 dsl.match(fieldName, cases) fully supports field name syntax (consistent with v1 behavior)
  // v2 dsl.if(fieldName, thenSchema, elseSchema) supports field name strings (truthy check)
  describe('dsl.match', () => {
    it('should support basic match syntax', () => {
      const schema = dsl({
        type: 'string',
        value: dsl.match('type', {
          email: 'email!',
          phone: 'string:11!',
          _default: 'string',
        }),
      })

      expect(validate(schema, { type: 'email', value: 'test@example.com' }).valid).toBe(true)
      expect(validate(schema, { type: 'email', value: 'invalid-email' }).valid).toBe(false)

      expect(validate(schema, { type: 'phone', value: '13800138000' }).valid).toBe(true)
      expect(validate(schema, { type: 'phone', value: '123456789012' }).valid).toBe(false)

      expect(validate(schema, { type: 'other', value: 'any string' }).valid).toBe(true)
    })

    it('should support non-ASCII values (with quotes)', () => {
      const schema = dsl({
        level: 'string',
        discount: dsl.match('level', {
          普通用户: 'number:0-5',
          'VIP-1': 'number:0-20',
          100: 'number:0-50',
        }),
      })

      expect(validate(schema, { level: '普通用户', discount: 3 }).valid).toBe(true)
      expect(validate(schema, { level: '普通用户', discount: 10 }).valid).toBe(false)

      expect(validate(schema, { level: 'VIP-1', discount: 15 }).valid).toBe(true)
      expect(validate(schema, { level: '100', discount: 40 }).valid).toBe(true)
    })

    it('should support nested objects as rules', () => {
      const schema = dsl({
        type: 'string',
        config: dsl.match('type', {
          db: { host: 'string!', port: 'number!' },
          api: { url: 'url!', token: 'string' },
        }),
      })

      expect(validate(schema, { type: 'db', config: { host: 'localhost', port: 3306 } }).valid).toBe(true)
      expect(validate(schema, { type: 'api', config: { url: 'https://api.example.com' } }).valid).toBe(true)
    })
  })

  describe('dsl.if field name syntax', () => {
    it('should support dsl.if(fieldName, thenSchema, elseSchema)', () => {
      const schema = dsl({
        isVip: 'boolean',
        discount: dsl.if('isVip', 'number:0-50', 'number:0-10'),
      })

      expect(validate(schema, { isVip: true, discount: 40 }).valid).toBe(true)
      expect(validate(schema, { isVip: false, discount: 40 }).valid).toBe(false)
      expect(validate(schema, { isVip: false, discount: 5 }).valid).toBe(true)
    })
  })

  describe('dsl() Wrapping (v1.0.6)', () => {
    it('should support using dsl() wrapping in dsl.match values', () => {
      const schema = dsl({
        payment_type: 'string',
        price: dsl.match('payment_type', {
          cash: dsl('number:0.99-1000!').label('现金价格').messages({ required: '价格必填' }),
          card: dsl('number:0.99-2000!').label('刷卡价格'),
          _default: 'number:0.99-1000',
        }),
      })

      expect(validate(schema, { payment_type: 'cash', price: 100 }).valid).toBe(true)

      const result = validate(schema, { payment_type: 'cash' })
      expect(result.valid).toBe(false)
      expect(result.errors![0].message).toContain('价格必填')

      expect(validate(schema, { payment_type: 'card', price: 1500 }).valid).toBe(true)
    })

    it('should support dsl.if nested inside dsl.match', () => {
      const schema = dsl({
        enabled: 'boolean',
        payment_type: 'string',
        price: dsl.if(
          'enabled',
          dsl.match('payment_type', {
            cash: dsl('number:0.99-1000!').label('现金价格'),
            _default: dsl('number:0.99-1000').label('默认价格'),
          }),
          dsl('number:0.99-500').label('禁用时价格')
        ),
      })

      expect(validate(schema, { enabled: true, payment_type: 'cash', price: 100 }).valid).toBe(true)
      expect(validate(schema, { enabled: true, payment_type: 'cash' }).valid).toBe(false)
      expect(validate(schema, { enabled: false, price: 100 }).valid).toBe(true)
      expect(validate(schema, { enabled: false, price: 600 }).valid).toBe(false)
    })
  })
})
