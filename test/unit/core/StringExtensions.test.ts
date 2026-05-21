/**
 * StringExtensions Complete Tests — v2 Migration
 *
 * v2 changes:
 * - requires explicit call to installStringExtensions(dsl) to install (opt-in)
 * - 'length' and 'trim' removed from extension list (v2 bugfix)
 * - uninstallStringExtensions() can uninstall
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  dsl,
  validate,
  installStringExtensions,
  uninstallStringExtensions,
} from '../../../src/index.js'

describe('StringExtensions - Complete Tests', () => {
  beforeAll(() => {
    installStringExtensions(dsl as any)
  })

  afterAll(() => {
    uninstallStringExtensions()
  })

  describe('Chaining Basics', () => {
    it('should support calling pattern method directly on strings', () => {
      expect(typeof ('string' as any).pattern).toBe('function')
    })

    it('should support calling label method directly on strings', () => {
      expect(typeof ('string' as any).label).toBe('function')
    })

    it('should support calling messages method directly on strings', () => {
      expect(typeof ('string' as any).messages).toBe('function')
    })

    it('should support calling description method directly on strings', () => {
      expect(typeof ('string' as any).description).toBe('function')
    })

    it('should support calling custom method directly on strings', () => {
      expect(typeof ('string' as any).custom).toBe('function')
    })

    it('should support calling default method directly on strings', () => {
      expect(typeof ('string' as any).default).toBe('function')
    })

    it('should support strings with required marker', () => {
      expect(typeof ('string!' as any).pattern).toBe('function')
      expect(typeof ('email!' as any).label).toBe('function')
    })

    it('should support strings with constraints', () => {
      expect(typeof ('string:3-32' as any).pattern).toBe('function')
      expect(typeof ('string:10-!' as any).label).toBe('function')
    })
  })

  describe('.pattern() method', () => {
    it('should add regex validation', () => {
      const schema = dsl({
        username: ('string!' as any).pattern(/^[a-zA-Z0-9_]+$/),
      })
      expect((schema as any).properties.username.pattern).toBeDefined()
    })

    it('should support regex string', () => {
      const schema = dsl({
        code: ('string!' as any).pattern('^[A-Z]{3}$'),
      })
      expect((schema as any).properties.code.pattern).toBeDefined()
    })

    it('should take effect during validation', () => {
      const schema = dsl({
        username: ('string!' as any).pattern(/^[a-z]+$/),
      })
      expect(validate(schema, { username: 'abc' }).valid).toBe(true)
      expect(validate(schema, { username: 'ABC' }).valid).toBe(false)
    })
  })

  describe('.label() method', () => {
    it('should set field label', () => {
      const result = ('string!' as any).label('Username')
      expect(result).toBeDefined()
    })

    it('should support chaining', () => {
      const result = ('string:3-32!' as any).label('Username').pattern(/^[a-z]+$/)
      expect(result).toBeDefined()
    })
  })

  describe('.messages() method', () => {
    it('should set custom error messages', () => {
      const result = ('string:3-32!' as any).messages({
        min: 'At least 3 characters',
        max: 'At most 32 characters',
        required: 'Cannot be empty',
      })
      expect(result).toBeDefined()
    })

    it('should support template variables', () => {
      const result = ('string:3-32!' as any).messages({
        min: 'At least {{#limit}} characters',
      })
      expect(result).toBeDefined()
    })
  })

  describe('.description() method', () => {
    it('should set field description', () => {
      const result = ('string!' as any).description('Username for login')
      expect(result).toBeDefined()
    })

    it('should support multi-line description', () => {
      const result = ('string!' as any).description('Username rules:\n1. 3-32 characters\n2. Letters and digits only')
      expect(result).toBeDefined()
    })
  })

  describe('.custom() method', () => {
    it('should support synchronous validator', () => {
      const result = ('string!' as any).custom((value: string) => {
        if (value === 'admin') return 'Cannot use admin'
        return true
      })
      expect(result).toBeDefined()
    })

    it('should support async validator', () => {
      const result = ('email!' as any).custom(async (_value: string) => {
        return new Promise<boolean>(resolve => setTimeout(() => resolve(true), 10))
      })
      expect(result).toBeDefined()
    })

    it('should support returning error object', () => {
      const result = ('string!' as any).custom((value: string) => {
        if (value === 'test') return { error: 'custom.test', message: 'Cannot use test' }
      })
      expect(result).toBeDefined()
    })
  })

  describe('.default() method', () => {
    it('should set default value', () => {
      const schema = dsl({
        name: ('string' as any).default('guest'),
      })
      expect((schema as any).properties.name.default).toBe('guest')
    })

    it('should support default values of different types', () => {
      const schema = dsl({
        name: ('string' as any).default('guest'),
        age: ('number' as any).default(18),
        active: ('boolean' as any).default(true),
      })
      expect((schema as any).properties.name.default).toBe('guest')
      expect((schema as any).properties.age.default).toBe(18)
      expect((schema as any).properties.active.default).toBe(true)
    })

    it('default value should take effect during validation', () => {
      const schema = dsl({
        role: ('string' as any).default('user'),
      })
      const result = validate(schema, {})
      expect((result.data as any).role).toBe('user')
    })
  })

  describe('Multi-method chaining', () => {
    it('should support pattern + label chaining', () => {
      const schema = dsl({
        username: ('string:3-32!' as any).pattern(/^[a-z]+$/).label('Username'),
      })
      expect((schema as any).properties.username.pattern).toBeDefined()
    })

    it('should support label + description + messages chaining', () => {
      const schema = dsl({
        email: ('email!' as any)
          .label('Email')
          .description('Used for login')
          .messages({ required: 'Email cannot be empty' }),
      })
      expect((schema as any).properties.email.format).toBe('email')
    })

    it('should support chaining all methods', () => {
      const schema = dsl({
        username: ('string:3-32!' as any)
          .pattern(/^[a-z]+$/)
          .label('Username')
          .description('Login username')
          .messages({ required: 'Cannot be empty' })
          .custom((v: string) => v !== 'admin'),
      })
      expect((schema as any).properties.username).toBeDefined()
    })
  })

  describe('Combined with DslBuilder built-in methods', () => {
    it('username() + chained call', () => {
      const schema = dsl({
        username: ('string!' as any).username('5-20').label('Username'),
      })
      expect((schema as any).properties.username.minLength).toBe(5)
      expect((schema as any).properties.username.maxLength).toBe(20)
    })

    it('phone() + chained call', () => {
      const schema = dsl({
        phone: ('string!' as any).phone('cn').label('Phone Number'),
      })
      expect((schema as any).properties.phone.minLength).toBe(11)
    })

    it('password() + chained call', () => {
      const schema = dsl({
        password: ('string!' as any).password('strong').label('Password'),
      })
      expect((schema as any).properties.password.minLength).toBe(8)
    })
  })

  describe('Usage in nested objects', () => {
    it('should work correctly in nested objects', () => {
      const schema = dsl({
        user: {
          username: ('string:3-32!' as any).pattern(/^[a-z]+$/).label('Username'),
          email: ('email!' as any).label('Email'),
          profile: {
            bio: ('string:500' as any).description('Personal bio'),
            website: ('url' as any).label('Personal Website'),
          },
        },
      })
      expect((schema as any).properties.user.properties.username.pattern).toBeDefined()
      expect((schema as any).properties.user.properties.profile.properties.bio).toBeDefined()
    })
  })

  describe('Complete examples', () => {
    it('form validation example', () => {
      const schema = dsl({
        username: ('string:3-32!' as any)
          .pattern(/^[a-zA-Z0-9_]+$/)
          .label('Username')
          .messages({
            pattern: 'Only letters, digits and underscores allowed',
            min: 'At least 3 characters',
            max: 'At most 32 characters',
          }),
        email: ('email!' as any).label('Email Address').description('Used for login and notifications'),
        password: ('string:8-64!' as any)
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .label('Password')
          .messages({ pattern: 'Must contain uppercase, lowercase and digits' }),
        agree: ('boolean!' as any).label('Agree to Terms'),
      })

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Abc123456',
        agree: true,
      }

      const result = validate(schema, validData)
      expect(result.valid).toBe(true)
    })

    it('complex nested example', () => {
      const schema = dsl({
        user: {
          username: ('string!' as any).username('5-20').label('Username'),
          contact: {
            email: ('email!' as any).label('Email'),
            phone: ('string!' as any).phone('cn').label('Phone Number'),
          },
          profile: {
            bio: ('string:500' as any).description('Personal bio'),
            website: ('url' as any).label('Personal Website').default('https://example.com'),
          },
        },
      })

      expect((schema as any).properties.user.properties.contact.properties.phone.minLength).toBe(11)
      expect((schema as any).properties.user.properties.profile.properties.website.default).toBe(
        'https://example.com'
      )
    })
  })

  describe('uninstall', () => {
    it('string extensions no longer available after uninstall', () => {
      uninstallStringExtensions()
      expect(typeof ('string' as any).label).not.toBe('function')
      // reinstall for afterAll cleanup
      installStringExtensions(dsl as any)
    })
  })
})
