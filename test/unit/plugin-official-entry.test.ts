import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as schemaDsl from '../../src/index.js'
import { DslBuilder, PluginManager, dsl, resetDefaultValidator, validate } from '../../src/index.js'
import customFormatPlugin from '../../src/plugins/custom-format.js'
import customValidatorPlugin from '../../src/plugins/custom-validator.js'
import customTypeExamplePlugin from '../../src/plugins/custom-type-example.js'

describe('官方插件入口兼容', () => {
  let pluginManager: PluginManager

  beforeEach(() => {
    pluginManager = new PluginManager()
    DslBuilder.clearCustomTypes()
    resetDefaultValidator()
    delete (globalThis as typeof globalThis & { __schemaDsl_plugins?: Record<string, unknown> }).__schemaDsl_plugins
  })

  it('应该提供与 v1 一致的 custom-format 插件对象', () => {
    expect(customFormatPlugin.name).toBe('custom-format')
    expect(customFormatPlugin.version).toBe('2.0.0')
    expect(customFormatPlugin.description).toContain('自定义格式验证插件')
    expect(typeof customFormatPlugin.install).toBe('function')
    expect(typeof customFormatPlugin.uninstall).toBe('function')
    expect(typeof customFormatPlugin.addCustomFormats).toBe('function')
  })

  it('应该通过官方 custom-format 插件入口注册 phone-cn 类型', () => {
    pluginManager.register(customFormatPlugin)
    pluginManager.install(schemaDsl, 'custom-format')

    expect(DslBuilder.hasType('phone-cn')).toBe(true)
    expect(validate(dsl({ phone: 'phone-cn!' }), { phone: '13800138000' }).valid).toBe(true)
    expect(validate(dsl({ phone: 'phone-cn!' }), { phone: '123' }).valid).toBe(false)
  })

  it('应该通过官方 custom-type-example 插件入口注册 order-id 类型', () => {
    pluginManager.register(customTypeExamplePlugin)
    pluginManager.install(schemaDsl, 'custom-type-example')

    expect(DslBuilder.hasType('order-id')).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'ORD202401010001' }).valid).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'BAD' }).valid).toBe(false)
  })

  it('应该通过官方 custom-validator 插件入口暴露同步关键字能力', () => {
    pluginManager.register(customValidatorPlugin)
    pluginManager.install(schemaDsl, 'custom-validator')

    const schema = {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          passwordStrength: 'strong',
        },
      },
      required: ['password'],
    }

    expect(validate(schema, { password: 'Abcdef1234' }).valid).toBe(true)
    expect(validate(schema, { password: 'weak' }).valid).toBe(false)
  })

  it('应该在安装 custom-validator 后写入 v1 风格全局插件桶', () => {
    pluginManager.register(customValidatorPlugin)
    pluginManager.install(schemaDsl, 'custom-validator')

    const globalBucket = (globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }).__schemaDsl_plugins

    expect(globalBucket).toBeDefined()
    expect(globalBucket?.['custom-validator']).toBe(customValidatorPlugin)
  })

  it('应该安装 custom-validator 且不输出 AJV deprecated addKeyword 警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    try {
      pluginManager.register(customValidatorPlugin)
      pluginManager.install(schemaDsl, 'custom-validator')

      expect(warnSpy.mock.calls.flat().join('\n')).not.toContain('these parameters are deprecated')
    } finally {
      warnSpy.mockRestore()
    }
  })
})

