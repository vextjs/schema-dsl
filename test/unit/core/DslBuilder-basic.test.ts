/**
 * DslBuilder Basic Tests — v2 Migration (corresponds to v1: DslBuilder.test.js)
 *
 * v2 Changes:
 * - DslBuilder imported from src/core/DslBuilder.js (with .js extension)
 * - String extensions are available from the root entry
 * - .exist → .toBeTruthy()
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { DslBuilder, dsl, installStringExtensions } from '../../../src/index.js'

beforeAll(() => {
  installStringExtensions(dsl as any)
})

describe('DslBuilder', () => {
  describe('Constructor', () => {
    it('should be able to create a DslBuilder instance', () => {
      const builder = new DslBuilder('string')
      expect(builder).toBeInstanceOf(DslBuilder)
    })

    it('should parse basic types', () => {
      const builder = new DslBuilder('string')
      expect((builder as any)._baseSchema.type).toBe('string')
    })

    it('should parse required marker', () => {
      const builder = new DslBuilder('string!')
      expect((builder as any)._required).toBe(true)
    })
  })

  describe('Default Validators', () => {
    describe('username()', () => {
      it('should automatically set 3-32 length when no arguments', () => {
        const schema = dsl({ username: ('string!' as any).username() })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(32)
      })

      it('should support string range parameters', () => {
        const schema = dsl({ username: ('string!' as any).username('5-20') })
        expect((schema as any).properties.username.minLength).toBe(5)
        expect((schema as any).properties.username.maxLength).toBe(20)
      })

      it('should support short preset', () => {
        const schema = dsl({ username: ('string!' as any).username('short') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(16)
      })

      it('should support medium preset', () => {
        const schema = dsl({ username: ('string!' as any).username('medium') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(32)
      })

      it('should support long preset', () => {
        const schema = dsl({ username: ('string!' as any).username('long') })
        expect((schema as any).properties.username.minLength).toBe(3)
        expect((schema as any).properties.username.maxLength).toBe(64)
      })
    })

    describe('phone()', () => {
      it('should automatically set cn phone number length to 11', () => {
        const schema = dsl({ phone: ('string!' as any).phone('cn') })
        expect((schema as any).properties.phone.minLength).toBe(11)
        expect((schema as any).properties.phone.maxLength).toBe(11)
      })

      it('should automatically correct number type to string', () => {
        const schema = dsl({ phone: ('number!' as any).phone('cn') })
        expect((schema as any).properties.phone.type).toBe('string')
      })
    })

    describe('password()', () => {
      it('strong should set 8-64 length', () => {
        const schema = dsl({ password: ('string!' as any).password('strong') })
        expect((schema as any).properties.password.minLength).toBe(8)
        expect((schema as any).properties.password.maxLength).toBe(64)
      })

      it('weak should set 6-64 length', () => {
        const schema = dsl({ password: ('string!' as any).password('weak') })
        expect((schema as any).properties.password.minLength).toBe(6)
        expect((schema as any).properties.password.maxLength).toBe(64)
      })
    })
  })

  describe('String Extension Methods', () => {
    it('should support .pattern()', () => {
      const schema = dsl({ test: ('string!' as any).pattern(/^test$/) })
      expect((schema as any).properties.test.pattern).toBeTruthy()
    })

    it('should support .label()', () => {
      expect(() => {
        ;('string!' as any).label('Test')
      }).not.toThrow()
    })

    it('should support .messages()', () => {
      expect(() => {
        ;('string!' as any).messages({ min: 'test' })
      }).not.toThrow()
    })

    it('should support .description()', () => {
      expect(() => {
        ;('string!' as any).description('Test description')
      }).not.toThrow()
    })

    it('should support .custom()', () => {
      expect(() => {
        ;('string!' as any).custom(() => {})
      }).not.toThrow()
    })

    it('should support .default()', () => {
      const schema = dsl({ name: ('string' as any).default('guest') })
      expect((schema as any).properties.name.default).toBe('guest')
    })
  })
})
