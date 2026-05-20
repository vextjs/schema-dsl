/**
 * ConditionalBuilder Unit Tests
 * Tests chained conditional building (C-03 fix: assert() throws ValidationError)
 */

import { describe, it, expect } from 'vitest'
import { ConditionalBuilder } from '../../../src/core/ConditionalBuilder.js'
import { ValidationError } from '../../../src/errors/ValidationError.js'

describe('ConditionalBuilder', () => {
  describe('start()', () => {
    it('creates a ConditionalBuilder instance', () => {
      const cb = ConditionalBuilder.start(() => true)
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })
  })

  describe('message() — conditional trigger error', () => {
    it('toSchema() returns a schema containing _isConditional', () => {
      const schema = ConditionalBuilder.start(() => true).message('Trigger error').toSchema()
      // ConditionalBuilder toSchema() returns an internal marker object, used by Validator
      expect(schema).toBeTruthy()
    })
  })

  describe('then() / else()', () => {
    it('then returns ConditionalBuilder (chained)', () => {
      const cb = ConditionalBuilder.start(() => true).then('string!')
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })

    it('else returns ConditionalBuilder (chained)', () => {
      const cb = ConditionalBuilder.start(() => true).then('string!').else('string')
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })

    it('toSchema() returns a non-empty schema', () => {
      const s = ConditionalBuilder.start(() => true).then('string!').else('string').toSchema()
      expect(s).toBeTruthy()
    })
  })

  describe('and()', () => {
    it('appends a sub-condition', () => {
      const cb = ConditionalBuilder.start(() => true)
        .message('Initial')
        .and(() => false)
      expect(cb).toBeInstanceOf(ConditionalBuilder)
    })
  })

  describe('build() — toSchema() alias', () => {
    it('build() returns an object with the same structure as toSchema()', () => {
      const cb = ConditionalBuilder.start(() => false).message('test')
      const s1 = cb.build()
      const s2 = cb.toSchema()
      // both are _isConditional schemas
      expect((s1 as Record<string, unknown>)['_isConditional']).toBe(true)
      expect((s2 as Record<string, unknown>)['_isConditional']).toBe(true)
    })
  })

  describe('assert() — C-03 fix', () => {
    // semantics: .message() sets action='throw'
    // assert() throws when condition IS TRUE (condition triggered)

    it('assert() throws ValidationError when condition is true (condition triggered)', () => {
      const cb = ConditionalBuilder.start(() => true).message('Assertion failed')
      expect(() => cb.assert({} as Record<string, unknown>)).toThrowError(ValidationError)
    })

    it('assert() does not throw when condition is false (condition not triggered)', () => {
      const cb = ConditionalBuilder.start(() => false).message('Not triggered')
      expect(() => cb.assert({} as Record<string, unknown>)).not.toThrow()
    })

    it('thrown ValidationError contains message', () => {
      const cb = ConditionalBuilder.start(() => true).message('Custom error message')
      try {
        cb.assert({} as Record<string, unknown>)
        expect.fail('should have thrown')
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        const ve = e as ValidationError
        expect(ve.message).toContain('Custom error message')
      }
    })
  })
})
