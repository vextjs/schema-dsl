/**
 * v1 entry compatibility tests.
 */

import { afterEach, beforeEach, describe, it, expect } from 'vitest'
import defaultDsl, {
  dsl,
  config,
  CONSTANTS,
  ErrorCodes,
  MessageTemplate,
  Locale,
  PluginManager,
  JSONSchemaCore,
  exporters,
  installStringExtensions,
  uninstallStringExtensions,
  validate,
  validateAsync,
  resetRuntimeState,
} from '../../src/index.js'
import type { DslConditionMarker } from '../../src/index.js'

describe('v1 entry compatibility', () => {
  beforeEach(() => {
    uninstallStringExtensions()
  })

  afterEach(() => {
    uninstallStringExtensions()
  })

  it('ESM default export should point to dsl main entry', () => {
    expect(defaultDsl).toBe(dsl)
  })

  it('should export v1 entry legacy symbols', () => {
    expect(typeof config).toBe('function')
    expect(CONSTANTS).toHaveProperty('VALIDATION')
    expect(ErrorCodes).toHaveProperty('VALIDATION_ERROR')
    expect(typeof MessageTemplate).toBe('function')
    expect(typeof PluginManager).toBe('function')
    expect(typeof JSONSchemaCore).toBe('function')
    expect(exporters).toHaveProperty('MongoDBExporter')
  })

  it('root entry import should not install String.prototype extensions', () => {
    expect(typeof ('email!' as any).description).toBe('undefined')
  })

  it('installStringExtensions() should support being called with no arguments', () => {
    uninstallStringExtensions()
    expect(typeof ('email!' as any).label).toBe('undefined')

    installStringExtensions()

    expect(typeof ('email!' as any).label).toBe('function')
    expect(('email!' as any).label('Email').toSchema()).toMatchObject({
      type: 'string',
      format: 'email',
      _label: 'Email',
    })
  })

  it('DslBuilder should expose v1 field marker properties for downstream converters', () => {
    const required = dsl('string!')
    const optional = dsl('string?')

    expect((required as any)._required).toBe(true)
    expect((required as any)._optional).toBe(false)
    expect((optional as any)._required).toBe(false)
    expect((optional as any)._optional).toBe(true)
  })

  it('Locale.getMessage() should retain the v1 { code, message } return shape', () => {
    Locale.addLocale('compat-locale', {
      'compat.key': { code: 40001, message: 'Compat message' },
    })

    expect(Locale.getMessage('compat.key', {}, 'compat-locale')).toEqual({
      code: 40001,
      message: 'Compat message',
    })
    expect(Locale.getMessageText('compat.key', {}, 'compat-locale')).toBe('Compat message')
  })

  it('dsl.if(field, then, else) should generate a v1 allOf conditional structure', () => {
    const conditional = dsl.if('flag', 'string!', 'number!') as DslConditionMarker
    const schema = dsl({
      flag: 'boolean',
      value: conditional,
    }) as any

    expect(schema.properties.value).toEqual({ description: 'Conditional field based on flag' })
    expect(schema.allOf?.[0]).toMatchObject({
      if: { properties: { flag: { const: true } } },
      then: { properties: { value: { type: 'string' } }, required: ['value'] },
      else: { properties: { value: { type: 'number' } }, required: ['value'] },
    })
  })

  it('dsl.match(field, cases) should generate a v1 if/then/else chain', () => {
    const conditional = dsl.match('type', {
      email: 'email!',
      phone: 'string:11!',
      _default: 'string',
    }) as DslConditionMarker
    const schema = dsl({
      type: 'string',
      value: conditional,
    }) as any

    expect(schema.properties.value).toEqual({ description: 'Depends on type' })
    expect(schema.allOf?.[0]).toMatchObject({
      if: { properties: { type: { const: 'email' } } },
      then: { properties: { value: { type: 'string', format: 'email' } }, required: ['value'] },
      else: {
        if: { properties: { type: { const: 'phone' } } },
        then: { properties: { value: { type: 'string', exactLength: 11 } }, required: ['value'] },
        else: { properties: { value: { type: 'string' } } },
      },
    })
  })

  it('dsl._if should exist as a compatibility alias for dsl.if', () => {
    expect(dsl._if).toBe(dsl.if)

    const conditional = dsl._if('flag', 'string!', 'number!') as DslConditionMarker
    const schema = dsl({
      flag: 'boolean',
      value: conditional,
    }) as any

    expect(schema.allOf?.[0]).toMatchObject({
      if: { properties: { flag: { const: true } } },
      then: { properties: { value: { type: 'string' } }, required: ['value'] },
      else: { properties: { value: { type: 'number' } }, required: ['value'] },
    })
  })

  it('dsl main entry should reject invalid definitions and invalid conditional shorthand', () => {
    expect(() => dsl(null as any)).toThrow('[schema-dsl] Invalid DSL definition')
    expect(() => dsl(['string'] as any)).toThrow('[schema-dsl] Invalid DSL definition')
    expect(() => dsl.if('flag' as any)).toThrow('Condition must be a function')
  })

  it('top-level validate() should use root primitive-union fast paths without losing cache invalidation', () => {
    resetRuntimeState()

    try {
      const schema = {
        type: ['integer', 'null'] as unknown[],
        title: 'fast primitive union',
      }

      expect(validate(schema, 1, { coerce: false }).valid).toBe(true)
      expect(validate(schema, null, { coerce: false }).valid).toBe(true)
      expect(validate(schema, Number.POSITIVE_INFINITY, { coerce: false }).valid).toBe(false)

      schema.type = ['boolean', 'null']

      expect(validate(schema, true, { coerce: false }).valid).toBe(true)
      expect(validate(schema, 1, { coerce: false }).valid).toBe(false)
    } finally {
      resetRuntimeState()
    }
  })

  it('top-level validate() should pre-coerce raw JSON Schema object fast paths safely', () => {
    resetRuntimeState()

    try {
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'number' },
          enabled: { type: 'boolean' },
          values: { type: 'array', items: { type: 'integer' } },
          profile: {
            type: 'object',
            properties: {
              age: { type: 'integer' },
            },
            required: ['age'],
          },
        },
        required: ['count', 'enabled', 'values', 'profile'],
      }

      const result = validate(schema, {
        count: '12',
        enabled: 'false',
        values: ['1', '2'],
        profile: { age: '30' },
      })

      expect(result.valid).toBe(true)
      expect(result.data).toEqual({
        count: 12,
        enabled: false,
        values: [1, 2],
        profile: { age: 30 },
      })
      expect(validate(schema, {
        count: 'not-a-number',
        enabled: 'false',
        values: ['1'],
        profile: { age: '30' },
      }).valid).toBe(false)
      expect(validate(schema, {
        count: '12',
        enabled: 'false',
        values: ['1'],
        profile: { age: '30' },
      }, { coerce: false }).valid).toBe(false)
    } finally {
      resetRuntimeState()
    }
  })

  it('top-level validateAsync() should handle simple custom scalar fast paths and errors', async () => {
    await expect(validateAsync({
      type: 'number',
      _customValidators: [(value: unknown) => value === 1],
    }, 1)).resolves.toBe(1)
    await expect(validateAsync({
      type: 'integer',
      _customValidators: [(value: unknown) => value === 2],
    }, 2)).resolves.toBe(2)
    await expect(validateAsync({
      type: 'boolean',
      _customValidators: [(value: unknown) => value === true],
    }, true)).resolves.toBe(true)
    await expect(validateAsync({
      type: 'null',
      _customValidators: [(value: unknown) => value === null],
    }, null)).resolves.toBeNull()

    await expect(validateAsync({
      type: 'number',
      _customValidators: [() => false],
    }, 1)).rejects.toThrow()
    await expect(validateAsync({
      type: 'number',
      _customValidators: [() => 'custom async message'],
    }, 1)).rejects.toThrow('custom async message')
    await expect(validateAsync({
      type: 'number',
      _customValidators: [() => ({ error: true, message: 'object async message' })],
    }, 1)).rejects.toThrow('object async message')
    await expect(validateAsync({
      type: 'number',
      _customValidators: [() => { throw new Error('async boom') }],
    }, 1)).rejects.toThrow('async boom')
  })

  it('top-level validate() should accept a DSL object directly and preserve coerce behaviour', () => {
    const result = validate(
      {
        email: 'email!',
        age: 'number:18-120',
      },
      {
        email: 'test@example.com',
        age: '25',
      },
    )

    expect(result.valid).toBe(true)
    expect(result.data).toEqual({
      email: 'test@example.com',
      age: 25,
    })
  })

  it('dsl(object, options) should retain the v1 optional second-argument shape', () => {
    const schema = dsl(
      {
        email: 'email!',
      },
      {
        allErrors: true,
        locale: 'zh-CN',
      },
    ) as any

    expect(schema).toMatchObject({
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
      },
      required: ['email'],
    })
  })

  it('top-level validateAsync() should accept a DSL object directly', async () => {
    await expect(validateAsync(
      {
        email: 'email!',
        age: 'number:18-120',
      },
      {
        email: 'test@example.com',
        age: 25,
      },
    )).resolves.toEqual({
      email: 'test@example.com',
      age: 25,
    })
  })
})

