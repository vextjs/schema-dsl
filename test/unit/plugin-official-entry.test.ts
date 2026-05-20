import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as schemaDsl from '../../src/index.js'
import { DslBuilder, PluginManager, dsl, resetDefaultValidator, validate } from '../../src/index.js'
import customFormatPlugin from '../../src/plugins/custom-format.js'
import customValidatorPlugin from '../../src/plugins/custom-validator.js'
import customTypeExamplePlugin from '../../src/plugins/custom-type-example.js'

describe('Official Plugin Entry Compatibility', () => {
  let pluginManager: PluginManager

  beforeEach(() => {
    pluginManager = new PluginManager()
    DslBuilder.clearCustomTypes()
    resetDefaultValidator()
    delete (globalThis as typeof globalThis & { __schemaDsl_plugins?: Record<string, unknown> }).__schemaDsl_plugins
  })

  it('should provide a custom-format plugin object consistent with v1', () => {
    expect(customFormatPlugin.name).toBe('custom-format')
    expect(customFormatPlugin.version).toBe('2.0.0')
    expect(customFormatPlugin.description).toContain('Custom format validation plugin')
    expect(typeof customFormatPlugin.install).toBe('function')
    expect(typeof customFormatPlugin.uninstall).toBe('function')
    expect(typeof customFormatPlugin.addCustomFormats).toBe('function')
  })

  it('should register phone-cn type via official custom-format plugin entry', () => {
    pluginManager.register(customFormatPlugin)
    pluginManager.install(schemaDsl, 'custom-format')

    expect(DslBuilder.hasType('phone-cn')).toBe(true)
    expect(validate(dsl({ phone: 'phone-cn!' }), { phone: '13800138000' }).valid).toBe(true)
    expect(validate(dsl({ phone: 'phone-cn!' }), { phone: '123' }).valid).toBe(false)
  })

  it('should register order-id type via official custom-type-example plugin entry', () => {
    pluginManager.register(customTypeExamplePlugin)
    pluginManager.install(schemaDsl, 'custom-type-example')

    expect(DslBuilder.hasType('order-id')).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'ORD202401010001' }).valid).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'BAD' }).valid).toBe(false)
  })

  it('should expose sync keyword capability via official custom-validator plugin entry', () => {
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

  it('should write to v1-style global plugin bucket after installing custom-validator', () => {
    pluginManager.register(customValidatorPlugin)
    pluginManager.install(schemaDsl, 'custom-validator')

    const globalBucket = (globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }).__schemaDsl_plugins

    expect(globalBucket).toBeDefined()
    expect(globalBucket?.['custom-validator']).toBe(customValidatorPlugin)
  })

  it('should install custom-validator without emitting AJV deprecated addKeyword warning', () => {
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

