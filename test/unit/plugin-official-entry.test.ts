import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as schemaDsl from '../../src/index.js'
import { DslBuilder, PluginManager, Validator, dsl, getDefaultValidator, resetRuntimeState, validate } from '../../src/index.js'
import customFormatPlugin from '../../src/plugins/custom-format.js'
import customValidatorPlugin from '../../src/plugins/custom-validator.js'
import customTypeExamplePlugin from '../../src/plugins/custom-type-example.js'

describe('Official Plugin Entry Compatibility', () => {
  let pluginManager: PluginManager

  beforeEach(() => {
    pluginManager = new PluginManager()
    resetRuntimeState()
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

  it('should clean custom-format DSL types and AJV formats when uninstalled', () => {
    pluginManager.register(customFormatPlugin)
    pluginManager.install(schemaDsl, 'custom-format')

    const ajv = getDefaultValidator().getAjv() as { formats?: Record<string, unknown> }
    expect(DslBuilder.hasType('phone-cn')).toBe(true)
    expect(ajv.formats?.['phone-cn']).toBeDefined()

    pluginManager.unregister('custom-format', schemaDsl)

    expect(DslBuilder.hasType('phone-cn')).toBe(false)
    expect(ajv.formats?.['phone-cn']).toBeUndefined()
  })

  it('should track custom-format type leases per builder when cores share one Validator', () => {
    const sharedValidator = getDefaultValidator()
    const createBuilder = () => {
      const types = new Map<string, unknown>()
      return {
        types,
        builder: {
          hasType: (name: string) => types.has(name),
          registerType: (name: string, schema: unknown) => types.set(name, schema),
          unregisterType: (name: string) => types.delete(name),
        } as unknown as typeof DslBuilder,
      }
    }
    const first = createBuilder()
    const second = createBuilder()
    const firstCore = { getDefaultValidator: () => sharedValidator, DslBuilder: first.builder }
    const secondCore = { getDefaultValidator: () => sharedValidator, DslBuilder: second.builder }

    customFormatPlugin.install(firstCore)
    customFormatPlugin.install(secondCore)
    expect(first.types.has('phone-cn')).toBe(true)
    expect(second.types.has('phone-cn')).toBe(true)

    customFormatPlugin.uninstall(firstCore)
    expect(first.types.has('phone-cn')).toBe(false)
    expect(second.types.has('phone-cn')).toBe(true)
    expect((sharedValidator.getAjv() as { formats?: Record<string, unknown> }).formats?.['phone-cn']).toBeDefined()

    customFormatPlugin.uninstall(secondCore)
    expect(second.types.has('phone-cn')).toBe(false)
    expect((sharedValidator.getAjv() as { formats?: Record<string, unknown> }).formats?.['phone-cn']).toBeUndefined()
  })

  it('should retain shared-builder custom-format types while another Validator owns a lease', () => {
    const firstValidator = new Validator()
    const secondValidator = new Validator()
    const types = new Map<string, unknown>()
    const sharedBuilder = {
      hasType: (name: string) => types.has(name),
      registerType: (name: string, schema: unknown) => types.set(name, schema),
      unregisterType: (name: string) => types.delete(name),
    } as unknown as typeof DslBuilder
    const firstCore = { getDefaultValidator: () => firstValidator, DslBuilder: sharedBuilder }
    const secondCore = { getDefaultValidator: () => secondValidator, DslBuilder: sharedBuilder }

    customFormatPlugin.install(firstCore)
    customFormatPlugin.install(secondCore)
    expect(types.has('phone-cn')).toBe(true)

    customFormatPlugin.uninstall(firstCore)
    expect(types.has('phone-cn')).toBe(true)
    expect((firstValidator.getAjv() as { formats?: Record<string, unknown> }).formats?.['phone-cn']).toBeUndefined()
    expect((secondValidator.getAjv() as { formats?: Record<string, unknown> }).formats?.['phone-cn']).toBeDefined()

    customFormatPlugin.uninstall(secondCore)
    expect(types.has('phone-cn')).toBe(false)
    expect((secondValidator.getAjv() as { formats?: Record<string, unknown> }).formats?.['phone-cn']).toBeUndefined()
  })

  it('should expose custom-format addFormat behavior including bank-card checksum branches', () => {
    const formats: Record<string, { validate: RegExp | ((value: string) => boolean) }> = {}
    const registeredTypes: Record<string, unknown> = {}
    const fakeAjv = {
      addFormat: (name: string, definition: { validate: RegExp | ((value: string) => boolean) }) => {
        formats[name] = definition
      },
    }
    const fakeBuilder = {
      registerType: (name: string, schema: unknown) => {
        registeredTypes[name] = schema
      },
    } as unknown as typeof DslBuilder

    customFormatPlugin.addCustomFormats(fakeAjv, fakeBuilder)

    expect(formats['phone-cn'].validate).toBeInstanceOf(RegExp)
    expect(registeredTypes['bank-card']).toMatchObject({
      type: 'string',
      minLength: 16,
      maxLength: 19,
    })

    const bankCard = formats['bank-card'].validate
    expect(typeof bankCard).toBe('function')
    if (typeof bankCard !== 'function') throw new Error('expected bank-card function validator')

    expect(bankCard('4111111111111111')).toBe(true)
    expect(bankCard('4111111111111112')).toBe(false)
    expect(bankCard('not-a-card')).toBe(false)
  })

  it('should reject custom-format installation when the core validator API is missing', () => {
    expect(() => customFormatPlugin.install({} as typeof schemaDsl)).toThrow(
      'getDefaultValidator() is not available'
    )
  })

  it('should register order-id type via official custom-type-example plugin entry', () => {
    pluginManager.register(customTypeExamplePlugin)
    pluginManager.install(schemaDsl, 'custom-type-example')

    expect(DslBuilder.hasType('order-id')).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'ORD202401010001' }).valid).toBe(true)
    expect(validate(dsl({ orderId: 'order-id!' }), { orderId: 'BAD' }).valid).toBe(false)
  })

  it('should register dynamic custom-type-example factories lazily', () => {
    pluginManager.register(customTypeExamplePlugin)
    pluginManager.install(schemaDsl, 'custom-type-example')

    expect(validate(dsl({ age: 'dynamic-age!' }), { age: 18 }).valid).toBe(true)
    expect(validate(dsl({ age: 'dynamic-age!' }), { age: -1 }).valid).toBe(false)
  })

  it('should reject custom-type-example installation when registerType is unavailable', () => {
    expect(() => customTypeExamplePlugin.install({
      DslBuilder: {},
    } as unknown as typeof schemaDsl)).toThrow(
      'DslBuilder.registerType is not available'
    )
  })

  it('should clean custom-type-example DSL types when uninstalled', () => {
    pluginManager.register(customTypeExamplePlugin)
    pluginManager.install(schemaDsl, 'custom-type-example')

    expect(DslBuilder.hasType('order-id')).toBe(true)
    expect(DslBuilder.hasType('sku')).toBe(true)

    pluginManager.unregister('custom-type-example', schemaDsl)

    expect(DslBuilder.hasType('order-id')).toBe(false)
    expect(DslBuilder.hasType('sku')).toBe(false)
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

  it('should clean custom-validator global bucket and AJV keywords when uninstalled', () => {
    pluginManager.register(customValidatorPlugin)
    pluginManager.install(schemaDsl, 'custom-validator')

    const ajv = getDefaultValidator().getAjv() as {
      getKeyword?: (name: string) => unknown
    }
    expect(ajv.getKeyword?.('passwordStrength')).toBeTruthy()
    expect(ajv.getKeyword?.('idCard')).toBeTruthy()

    pluginManager.unregister('custom-validator', schemaDsl)

    const globalBucket = (globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }).__schemaDsl_plugins

    expect(globalBucket?.['custom-validator']).toBeUndefined()
    expect(ajv.getKeyword?.('passwordStrength')).toBeFalsy()
    expect(ajv.getKeyword?.('idCard')).toBeFalsy()
  })

  it('should retain the custom-validator global bucket while another Validator owns a lease', () => {
    const firstValidator = new Validator()
    const secondValidator = new Validator()
    const firstCore = { getDefaultValidator: () => firstValidator }
    const secondCore = { getDefaultValidator: () => secondValidator }

    customValidatorPlugin.install(firstCore)
    customValidatorPlugin.install(secondCore)
    customValidatorPlugin.uninstall(firstCore)

    const globalBucket = (globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }).__schemaDsl_plugins
    expect(globalBucket?.['custom-validator']).toBe(customValidatorPlugin)
    expect(secondValidator.getAjv().getKeyword('unique')).toBeTruthy()

    customValidatorPlugin.uninstall(secondCore)
    expect(globalBucket?.['custom-validator']).toBeUndefined()
    expect(secondValidator.getAjv().getKeyword('unique')).toBeFalsy()
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

  it('should reject custom-validator installation when the core validator API is missing', () => {
    expect(() => customValidatorPlugin.install({} as typeof schemaDsl)).toThrow(
      'getDefaultValidator() is not available'
    )
  })

  it('should allow custom-validator uninstall without a core object', () => {
    const globalRecord = globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }
    globalRecord.__schemaDsl_plugins = { 'custom-validator': customValidatorPlugin }

    expect(() => customValidatorPlugin.uninstall(undefined as unknown as typeof schemaDsl)).not.toThrow()
    expect(globalRecord.__schemaDsl_plugins?.['custom-validator']).toBeUndefined()
  })

  it('should skip existing custom-validator AJV keywords and remove only installed keywords', () => {
    const definitions: Record<string, unknown> = {}
    const removed: string[] = []
    const fakeAjv = {
      getKeyword: (name: string) => name === 'unique',
      removeKeyword: (name: string) => removed.push(name),
    }
    const fakeValidator = {
      getAjv: () => fakeAjv,
      addKeyword: vi.fn((name: string, definition: unknown) => {
        definitions[name] = definition
        return fakeValidator
      }),
      clearCache: vi.fn(),
    }
    const fakeCore = {
      getDefaultValidator: () => fakeValidator,
    }

    customValidatorPlugin.addCustomKeywords(fakeValidator as unknown as ReturnType<typeof getDefaultValidator>)

    expect(fakeValidator.addKeyword).not.toHaveBeenCalledWith('unique', expect.anything())
    expect(fakeValidator.addKeyword).toHaveBeenCalledWith('passwordStrength', expect.anything())
    expect(fakeValidator.addKeyword).toHaveBeenCalledWith('idCard', expect.anything())

    customValidatorPlugin.uninstall(fakeCore as unknown as typeof schemaDsl)

    expect(removed).toEqual(['passwordStrength', 'idCard'])
    expect(fakeValidator.clearCache).toHaveBeenCalledTimes(1)
  })

  it('should expose custom-validator keyword behavior for no-op and failure branches', async () => {
    const definitions: Record<string, {
      validate: (schema: unknown, data?: unknown) => boolean | Promise<boolean>
    }> = {}
    const fakeValidator = {
      getAjv: () => ({ getKeyword: () => undefined }),
      addKeyword: vi.fn((name: string, definition: { validate: (schema: unknown, data?: unknown) => boolean | Promise<boolean> }) => {
        definitions[name] = definition
        return fakeValidator
      }),
      clearCache: vi.fn(),
    }

    customValidatorPlugin.addCustomKeywords(fakeValidator as unknown as ReturnType<typeof getDefaultValidator>)

    await expect(definitions.unique.validate(undefined)).resolves.toBe(true)
    await expect(definitions.unique.validate({ table: 'users', field: 'email' })).resolves.toBe(true)

    expect(definitions.passwordStrength.validate(false, 'x')).toBe(true)
    expect(definitions.passwordStrength.validate('unknown', 'x')).toBe(true)
    expect(definitions.passwordStrength.validate('weak', '123456')).toBe(true)
    expect(definitions.passwordStrength.validate('medium', 'Abcdefgh')).toBe(true)
    expect(definitions.passwordStrength.validate('medium', 'weak')).toBe(false)
    expect(definitions.passwordStrength.validate('strong', 'Abcdef1234')).toBe(true)
    expect(definitions.passwordStrength.validate('strong', 'Abcdefgh')).toBe(false)

    expect(definitions.idCard.validate(false, 'bad')).toBe(true)
    expect(definitions.idCard.validate(true, 'bad')).toBe(false)
    expect(definitions.idCard.validate(true, '11010519491231002X')).toBe(true)
    expect(customValidatorPlugin._validateIdCardChecksum('110105194912310021')).toBe(false)
  })

  it('should expose custom-validator lifecycle hooks', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      expect(() => customValidatorPlugin.hooks?.onBeforeValidate?.({})).not.toThrow()
      expect(() => customValidatorPlugin.hooks?.onAfterValidate?.({})).not.toThrow()
      customValidatorPlugin.hooks?.onError?.(new Error('boom'))

      expect(errorSpy).toHaveBeenCalledWith('[custom-validator] Error:', 'boom')
    } finally {
      errorSpy.mockRestore()
    }
  })
})

