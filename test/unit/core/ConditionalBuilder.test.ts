/**
 * ConditionalBuilder Unit Tests
 * Tests chained conditional building (C-03 fix: assert() throws ValidationError)
 */

import { describe, it, expect } from 'vitest'
import { ConditionalBuilder } from '../../../src/core/ConditionalBuilder.js'
import { ValidationError } from '../../../src/errors/ValidationError.js'
import { Validator } from '../../../src/core/Validator.js'

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

    it('supports require(field) as a v1-compatible truthy-field condition', () => {
      const cb = ConditionalBuilder.start(() => false).require('accepted')

      expect(cb.check({ accepted: true })).toBe(true)
      expect(cb.check({ accepted: false })).toBe(true)
    })
  })

  describe('condition forms and guard rails', () => {
    it('accepts a string field name as the root condition', () => {
      const cb = ConditionalBuilder.start('enabled').message('enabled is not allowed')

      expect(cb.check({ enabled: false })).toBe(true)
      expect(cb.check({ enabled: true })).toBe(false)
    })

    it('throws clear errors for invalid chain order or argument types', () => {
      const cb = new ConditionalBuilder()

      expect(() => cb.if(null as any)).toThrow('Condition must be a function')
      expect(() => new ConditionalBuilder().and(() => true)).toThrow('.and() must follow')
      expect(() => new ConditionalBuilder().or(() => true)).toThrow('.or() must follow')
      expect(() => new ConditionalBuilder().elseIf(() => true)).toThrow('.elseIf() must follow')
      expect(() => new ConditionalBuilder().message(123 as any)).toThrow('Message must be a string')
      expect(() => new ConditionalBuilder().message('missing if')).toThrow('.message() must follow')
      expect(() => new ConditionalBuilder().then('string')).toThrow('.then() must follow')
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

  describe('toSchema() runtime metadata', () => {
    it('should keep function conditions out of enumerable JSON schema fields', () => {
      const schema = ConditionalBuilder.start((data: unknown) => Boolean((data as { enabled?: boolean }).enabled))
        .then('string!')
        .toSchema()

      const serialized = JSON.stringify(schema)

      expect(serialized).toContain('_runtimeOnlyConditional')
      expect(serialized).not.toContain('_evaluateCondition')
      expect(serialized).not.toContain('conditions')
      expect(serialized).not.toContain('function')
    })

    it('should fail explicitly when a runtime-only conditional schema is restored from JSON', () => {
      const schema = ConditionalBuilder.start((data: unknown) => Boolean((data as { enabled?: boolean }).enabled))
        .then('string!')
        .toSchema()
      const restored = JSON.parse(JSON.stringify(schema))
      const validator = new Validator()

      const result = validator.validate(restored, 'value')

      expect(result.valid).toBe(false)
      expect(result.errors?.[0].keyword).toBe('conditional')
      expect(result.errors?.[0].message).toContain('runtime-only')
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

    it('uses the first triggered message in chain-check mode', () => {
      const cb = ConditionalBuilder.start((data: unknown) => Boolean((data as { root?: boolean }).root))
        .message('root failed')
        .and((data: unknown) => Boolean((data as { child?: boolean }).child))
        .message('child failed')

      expect(() => cb.assert({ root: true, child: false })).toThrow('root failed')
      expect(() => cb.assert({ root: false, child: true })).toThrow('child failed')
      expect(() => cb.assert({ root: false, child: false })).not.toThrow()
    })

    it('supports shared AND message mode', () => {
      const cb = ConditionalBuilder.start((data: unknown) => Boolean((data as { a?: boolean }).a))
        .and((data: unknown) => Boolean((data as { b?: boolean }).b))
        .message('both failed')

      expect(cb.check({ a: true, b: false })).toBe(true)
      expect(cb.check({ a: true, b: true })).toBe(false)
      expect(() => cb.assert({ a: true, b: true })).toThrow('both failed')
    })

    it('supports OR message mode with grouped boolean evaluation', () => {
      const cb = ConditionalBuilder.start((data: unknown) => Boolean((data as { a?: boolean }).a))
        .and((data: unknown) => Boolean((data as { b?: boolean }).b))
        .or((data: unknown) => Boolean((data as { c?: boolean }).c))
        .message('any group failed')

      expect(cb.check({ a: true, b: false, c: false })).toBe(true)
      expect(cb.check({ a: true, b: true, c: false })).toBe(false)
      expect(cb.check({ a: false, b: false, c: true })).toBe(false)
      expect(() => cb.assert({ c: true })).toThrow('any group failed')
    })

    it('treats thrown condition functions as not matched', () => {
      const cb = ConditionalBuilder.start(() => {
        throw new Error('condition blew up')
      }).message('should not surface')

      expect(cb.check({})).toBe(true)
      expect(() => cb.assert({})).not.toThrow()
    })
  })

  describe('validate() and validateAsync()', () => {
    it('validates then/else schemas in non-message mode', () => {
      const cb = ConditionalBuilder.start((data: unknown) => typeof data === 'string')
        .then({ type: 'string', minLength: 3 })
        .else({ type: 'number', minimum: 10 })

      expect(cb.validate('abc').valid).toBe(true)
      expect(cb.validate('a').valid).toBe(false)
      expect(cb.validate(12).valid).toBe(true)
      expect(cb.validate(1).valid).toBe(false)
    })

    it('adapts validateAsync success and ValidationError failure to ValidationResult', async () => {
      const cb = ConditionalBuilder.start((data: unknown) => typeof data === 'string')
        .then({ type: 'string', minLength: 3 })

      await expect(cb.validateAsync('abcd')).resolves.toMatchObject({ valid: true, data: 'abcd', errors: [] })
      await expect(cb.validateAsync('a')).resolves.toMatchObject({ valid: false, data: undefined })
    })

    it('normalizes constructor options for validator cache keys', () => {
      const cb = ConditionalBuilder.start(() => false).then({ type: 'string' })
      const optsA = { custom: { b: 2, a: 1 }, fn: function namedValidator() { return true }, big: 1n }
      const optsB = { big: 1n, fn: function namedValidator() { return true }, custom: { a: 1, b: 2 } }

      expect(cb.validate('ok', optsA).valid).toBe(true)
      expect(cb.validate('ok', optsB).valid).toBe(true)
    })
  })
})
