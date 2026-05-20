/**
 * Error Message Filter Optimization Tests (v2 TypeScript)
 *
 * v2 fully supports dsl.if('fieldName', ...) and dsl.match('fieldName', ...) API,
 * with behavior consistent with v1.
 */

import { describe, it, expect } from 'vitest'
import { dsl, validate } from '../../src/index.js'

describe('Error Message Filter Optimization (v1.0.7)', () => {
  describe('Remove Redundant if-then Wrapper Errors', () => {

    it('should only show specific field errors, not duplicate "must match then schema"', () => {
      const schema = dsl({
        payment_type: 'string',
        enabled: 'boolean',
        credit_price: dsl.if('enabled',
          dsl.match('payment_type', {
            'credit': (dsl('integer:1-10000!') as any).label('Credit price'),
            '_default': 'integer:1-10000',
          }),
          'integer:1-10000'
        ),
      })

      const result = validate(schema, {
        payment_type: 'credit',
        enabled: true,
        // credit_price is missing
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0].message).toContain('Credit price')
      const msg = result.errors![0].message
      expect(msg.includes('required') || msg.includes('不能为空')).toBe(true)
      expect(result.errors![0].message).not.toContain('must match')
    })

    it('should filter out duplicate if errors from multiple nesting levels', () => {
      const schema = dsl({
        level1: 'boolean',
        level2: 'boolean',
        value: dsl.if('level1',
          dsl.if('level2', 'integer:1-10!', 'integer:11-20!'),
          'integer:21-30!'
        ),
      })

      const result = validate(schema, {
        level1: true,
        level2: true,
        value: 100,
      })

      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeLessThanOrEqual(2)

      const hasIfError = result.errors!.some(err => err.keyword === 'if')
      expect(hasIfError).toBe(false)
    })

    it('should not show if wrapper errors for type errors either', () => {
      const schema = dsl({
        flag: 'boolean!',
        value: dsl.if('flag', 'integer!', 'string!'),
      })

      const result = validate(schema, {
        flag: true,
        value: 'not a number',
      })

      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThanOrEqual(1)

      const hasTypeError = result.errors!.some(err => err.keyword === 'type')
      expect(hasTypeError).toBe(true)

      const hasIfError = result.errors!.some(err => err.keyword === 'if')
      expect(hasIfError).toBe(false)
    })

    it('should display type errors when only if errors exist', () => {
      const schema = dsl({
        flag: 'boolean',
        value: dsl.if('flag', 'string', 'integer'),
      })

      const result = validate(schema, {
        flag: 'invalid',
        value: [],
      })

      expect(result.valid).toBe(false)
      expect(result.errors!.length).toBeGreaterThan(0)

      const hasFlagError = result.errors!.some(err => err.path === 'flag')
      expect(hasFlagError).toBe(true)

      const hasIfError = result.errors!.some(err => err.keyword === 'if')
      expect(hasIfError).toBe(false)
    })

    it('should display all errors when multiple field errors exist, without if errors', () => {
      const schema = dsl({
        enabled: 'boolean',
        name: dsl.if('enabled', 'string:3-10!', 'string'),
        age: dsl.if('enabled', 'integer:18-100!', 'integer'),
      })

      const result = validate(schema, {
        enabled: true,
        name: 'ab',
        age: 15,
      })

      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(2)

      const ifErrors = result.errors!.filter(err => err.keyword === 'if')
      expect(ifErrors).toHaveLength(0)
    })

  })
})
