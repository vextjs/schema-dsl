/**
 * v1 entry compatibility tests.
 */

import { describe, it, expect } from 'vitest'
import {
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
} from '../../src/index.js'
import type { DslConditionMarker } from '../../src/index.js'

describe('v1 entry compatibility', () => {
  it('应该导出 v1 主入口 legacy 符号', () => {
    expect(typeof config).toBe('function')
    expect(CONSTANTS).toHaveProperty('VALIDATION')
    expect(ErrorCodes).toHaveProperty('VALIDATION_ERROR')
    expect(typeof MessageTemplate).toBe('function')
    expect(typeof PluginManager).toBe('function')
    expect(typeof JSONSchemaCore).toBe('function')
    expect(exporters).toHaveProperty('MongoDBExporter')
  })

  it('installStringExtensions() 应该支持无参数调用', () => {
    uninstallStringExtensions()
    expect(typeof ('email!' as any).label).toBe('undefined')

    installStringExtensions()

    expect(typeof ('email!' as any).label).toBe('function')
    expect(('email!' as any).label('邮箱').toSchema()).toMatchObject({
      type: 'string',
      format: 'email',
      _label: '邮箱',
    })
  })

  it('Locale.getMessage() 应该保持 v1 的 { code, message } 返回形态', () => {
    Locale.addLocale('compat-locale', {
      'compat.key': { code: 40001, message: '兼容消息' },
    })

    expect(Locale.getMessage('compat.key', {}, 'compat-locale')).toEqual({
      code: 40001,
      message: '兼容消息',
    })
    expect(Locale.getMessageText('compat.key', {}, 'compat-locale')).toBe('兼容消息')
  })

  it('dsl.if(field, then, else) 应该生成 v1 allOf 条件结构', () => {
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

  it('dsl.match(field, cases) 应该生成 v1 if/then/else 链', () => {
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
})

