/**
 * v1 entry compatibility tests.
 */

import { describe, it, expect } from 'vitest'
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
} from '../../src/index.js'
import type { DslConditionMarker } from '../../src/index.js'

describe('v1 entry compatibility', () => {
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

  it('root entry import should install String.prototype extensions by default', () => {
    expect(typeof ('email!' as any).description).toBe('function')
    expect(('email!' as any).description('Email field').toSchema()).toMatchObject({
      type: 'string',
      format: 'email',
      description: 'Email field',
    })
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

