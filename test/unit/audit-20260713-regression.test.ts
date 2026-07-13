import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import * as schemaDsl from '../../src/index.js'
import {
  ConditionalBuilder,
  MySQLExporter,
  PluginManager,
  SchemaUtils,
  ValidationError,
  Validator,
  getDefaultValidator,
  resetRuntimeState,
  validate,
  validateAsync,
} from '../../src/index.js'
import { iterConditionalSchemaChildren } from '../../src/core/ir/ConditionalTraversal.js'
import type { ConditionalInternalSchema } from '../../src/core/ConditionalValidator.js'
import { createRuntime } from '../../src/runtime.js'
import type { JSONSchema } from '../../src/types/schema.js'
import customValidatorPlugin from '../../src/plugins/custom-validator.js'

const validationOptions = { coerce: false, smartCoerce: false, format: false }

function conditionalType(type: string): ConditionalInternalSchema {
  return ConditionalBuilder.start(() => true).then(`${type}!`).toSchema()
}

function ownProto(value: unknown): Record<string, unknown> {
  const record: Record<string, unknown> = {}
  Object.defineProperty(record, '__proto__', {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
  return record
}

function ownProtoSchema(): JSONSchema {
  const properties = Object.create(null) as Record<string, JSONSchema>
  properties['__proto__'] = { type: 'number' }
  return { type: 'object', properties, required: ['__proto__'] }
}

afterEach(() => {
  resetRuntimeState()
  delete (globalThis as typeof globalThis & { __schemaDsl_plugins?: Record<string, unknown> }).__schemaDsl_plugins
})

describe('2026-07-13 release audit regressions', () => {
  it('does not let a registered-only manager release another manager plugin lease', () => {
    const uninstall = vi.fn()
    const plugin = { name: 'owned-plugin', install: vi.fn(), uninstall }
    const owner = new PluginManager()
    const observer = new PluginManager()

    owner.register(plugin).install({})
    observer.register(plugin).unregister(plugin.name)

    expect(uninstall).not.toHaveBeenCalled()
    expect(owner.has(plugin.name)).toBe(true)

    const clearObserver = new PluginManager()
    clearObserver.register(plugin).clear()
    expect(uninstall).not.toHaveBeenCalled()

    owner.unregister(plugin.name)
    expect(uninstall).toHaveBeenCalledOnce()
  })

  it('keeps official plugin resources until the installing manager unregisters', () => {
    const owner = new PluginManager()
    const observer = new PluginManager()
    owner.register(customValidatorPlugin).install(schemaDsl, 'custom-validator')
    observer.register(customValidatorPlugin).unregister('custom-validator', schemaDsl)

    expect(getDefaultValidator().getAjv().getKeyword('passwordStrength')).toBeTruthy()
    expect((globalThis as typeof globalThis & {
      __schemaDsl_plugins?: Record<string, unknown>
    }).__schemaDsl_plugins?.['custom-validator']).toBe(customValidatorPlugin)

    owner.unregister('custom-validator', schemaDsl)
    expect(getDefaultValidator().getAjv().getKeyword('passwordStrength')).toBeFalsy()
  })

  it('keeps PluginManager.clear failures observable and retryable', () => {
    const manager = new PluginManager()
    const clearErrors: unknown[] = []
    const cleared = vi.fn()
    manager.on('plugins:clear-error', payload => clearErrors.push(payload))
    manager.on('plugins:cleared', cleared)
    manager.register({
      name: 'failing-owner',
      install() {},
      uninstall() { throw new Error('cleanup failed') },
    })
    manager.register({ name: 'successful-owner', install() {}, uninstall() {} })
    manager.install({})

    expect(() => manager.clear()).toThrow(AggregateError)
    expect(manager.has('failing-owner')).toBe(true)
    expect(manager.has('successful-owner')).toBe(false)
    expect(clearErrors).toEqual([
      expect.objectContaining({
        cleared: ['successful-owner'],
        failures: [expect.objectContaining({ name: 'failing-owner' })],
      }),
    ])
    expect(cleared).not.toHaveBeenCalled()
  })

  it('executes Conditional schemas in Draft 7 additionalItems', () => {
    const schema: JSONSchema = {
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: conditionalType('number'),
    }

    expect(validate(schema, ['head', 1], validationOptions).valid).toBe(true)
    const invalid = validate(schema, ['head', 'bad'], validationOptions)
    expect(invalid.valid).toBe(false)
    expect(invalid.errors?.[0]?.path).toBe('1')

    expect(iterConditionalSchemaChildren(schema as ConditionalInternalSchema).map(entry => entry.path))
      .toContain('/additionalItems')
  })

  it('executes async custom validators in Draft 7 additionalItems', async () => {
    const schema: JSONSchema = {
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: {
        type: 'string',
        _customValidators: [async (value: unknown) => value === 'ok'],
      },
    }

    await expect(validateAsync(schema, ['head', 'ok'], validationOptions)).resolves.toEqual(['head', 'ok'])
    await expect(validateAsync(schema, ['head', 'bad'], validationOptions)).rejects.toMatchObject({
      name: 'ValidationError',
      errors: [expect.objectContaining({ path: '1', keyword: '_customValidators' })],
    } satisfies Partial<ValidationError>)
  })

  it('binds items validators only to entries after prefixItems', async () => {
    const seen: unknown[] = []
    const schema: JSONSchema = {
      type: 'array',
      prefixItems: [conditionalType('string')],
      items: {
        _customValidators: [async (value: unknown) => {
          seen.push(value)
          return typeof value === 'number'
        }],
      },
    }

    await expect(validateAsync(schema, ['head', 1], validationOptions)).resolves.toEqual(['head', 1])
    expect(seen).not.toContain('head')
    expect(seen).toContain(1)

    await expect(validateAsync(schema, ['head', 'bad'], validationOptions)).rejects.toMatchObject({
      errors: [expect.objectContaining({ path: '1' })],
    })
  })

  it('makes nested additionalItems object fields optional', () => {
    const partial = SchemaUtils.partial({
      type: 'array',
      items: [{ type: 'string' }],
      additionalItems: {
        type: 'object',
        properties: { value: { type: 'number' } },
        required: ['value'],
      },
    })

    expect((partial.additionalItems as JSONSchema).required).toBeUndefined()
    expect(validate(partial, ['head', {}], validationOptions).valid).toBe(true)
  })

  it('reports exporter losses nested under additionalItems', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        list: {
          type: 'array',
          items: [{ type: 'string' }],
          additionalItems: { type: 'string', pattern: '^x+$' },
        },
      },
    }
    const exporter = new MySQLExporter()
    const report = exporter.exportWithReport('records', schema)

    expect(report.losses).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '$.properties.list.additionalItems',
        keyword: 'pattern',
      }),
    ]))
    expect(() => exporter.exportWithReport('records', schema, { strict: true }))
      .toThrow('Export would lose unsupported JSON Schema keywords')
  })

  it('validates skipped own-proto fields in tuple and repeated item schemas', () => {
    const tupleSchema: JSONSchema = {
      type: 'array',
      items: [ownProtoSchema()],
      additionalItems: false,
    }
    const repeatedSchema: JSONSchema = {
      type: 'array',
      items: ownProtoSchema(),
    }

    expect(validate(tupleSchema, [ownProto('bad')], validationOptions).valid).toBe(false)
    const repeated = validate(repeatedSchema, [ownProto(1), ownProto('bad')], validationOptions)
    expect(repeated.valid).toBe(false)
    expect(repeated.errors?.some(error => error.path === '1/__proto__')).toBe(true)
    expect(Validator.quickValidate(repeatedSchema, [ownProto(1), ownProto('bad')])).toBe(false)
  })

  it('honors contains ranges while compensating skipped own-proto fields', async () => {
    const contains = ownProtoSchema()
    const zeroRange: JSONSchema = {
      type: 'array',
      contains,
      minContains: 0,
      maxContains: 0,
    }
    const noMatches = [ownProto('bad')]

    expect(validate(zeroRange, noMatches, validationOptions).valid).toBe(true)
    expect(Validator.quickValidate(zeroRange, noMatches)).toBe(true)
    await expect(validateAsync(zeroRange, noMatches, validationOptions)).resolves.toEqual(noMatches)

    const oneMatch = [ownProto(1)]
    expect(validate(zeroRange, oneMatch, validationOptions).valid).toBe(false)
    expect(Validator.quickValidate(zeroRange, oneMatch)).toBe(false)
    await expect(validateAsync(zeroRange, oneMatch, validationOptions)).rejects.toMatchObject({
      errors: [expect.objectContaining({ keyword: 'contains' })],
    })

    const defaultRange: JSONSchema = { type: 'array', contains }
    expect(validate(defaultRange, noMatches, validationOptions).valid).toBe(false)
    expect(Validator.quickValidate(defaultRange, noMatches)).toBe(false)
  })

  it('keeps instance formats while matching skipped-property applicator branches', async () => {
    const validator = new Validator()
    validator.addFormat('tenant-ok', /^ok$/)
    const properties = Object.create(null) as Record<string, JSONSchema>
    Object.defineProperty(properties, '__proto__', {
      value: { type: 'string', format: 'tenant-ok' },
      enumerable: true,
      configurable: true,
      writable: true,
    })
    const matchingItem: JSONSchema = {
      type: 'object',
      properties,
      required: ['__proto__'],
    }
    const data = ownProto('ok')
    const containsSchema: JSONSchema = {
      type: 'array',
      contains: matchingItem,
      minContains: 1,
      maxContains: 1,
    }

    expect(validator.validate(containsSchema, [data], validationOptions).valid).toBe(true)
    await expect(validator.validateAsync(containsSchema, [data], validationOptions)).resolves.toEqual([data])
    expect(validator.validate({ anyOf: [matchingItem, { type: 'number' }] }, data, validationOptions).valid).toBe(true)
  })

  it('evicts warm contains-range projections by their original schema owner', () => {
    const validator = new Validator()
    const schema: JSONSchema = {
      $id: 'urn:schema-dsl:contains-range-owner',
      type: 'array',
      contains: { type: 'number' },
      minContains: 1,
    }

    expect(validator.validate(schema, [1], validationOptions).valid).toBe(true)
    schema.minContains = 0
    schema.maxContains = 0
    expect(validator.validate(schema, [], validationOptions)).toMatchObject({ valid: true, errors: [] })

    const duplicateOwner: JSONSchema = {
      $id: schema.$id,
      type: 'array',
      contains: { type: 'number' },
      minContains: 0,
      maxContains: 1,
    }
    expect(validator.validate(duplicateOwner, [], validationOptions)).toMatchObject({
      valid: false,
      errors: [expect.objectContaining({ code: 'SCHEMA_COMPILE_ERROR' })],
    })
  })

  it('evicts async preflight clones by their original schema owner', async () => {
    const validator = new Validator()
    const schema: JSONSchema = {
      $id: 'urn:schema-dsl:async-preflight-owner',
      type: 'string',
      minLength: 1,
      _customValidators: [async () => true],
    }

    await expect(validator.validateAsync(schema, 'x', validationOptions)).resolves.toBe('x')
    schema.minLength = 2
    await expect(validator.validateAsync(schema, 'xx', validationOptions)).resolves.toBe('xx')
  })

  it('preserves root scope for skipped own-proto fields behind local refs', () => {
    const schema: JSONSchema = {
      $ref: '#/$defs/A~1B~0C',
      $defs: { 'A/B~C': ownProtoSchema() },
    }

    expect(validate(schema, ownProto('bad'), validationOptions).valid).toBe(false)
    expect(Validator.quickValidate(schema, ownProto('bad'))).toBe(false)
  })

  it('classifies Conditional schema children consistently across public validation entries', async () => {
    const conditional = conditionalType('number')
    const notSchema: JSONSchema = { not: conditional }
    const propertySchema: JSONSchema = { properties: { value: conditional } }
    const validator = new Validator()
    const runtime = createRuntime()

    try {
      expect(validator.validate(notSchema, 'bad', validationOptions).valid).toBe(true)
      expect(validate(notSchema, 'bad', validationOptions).valid).toBe(true)
      await expect(validateAsync(notSchema, 'bad', validationOptions)).resolves.toBe('bad')
      expect(runtime.validate(notSchema, 'bad', validationOptions).valid).toBe(true)

      expect(validate(notSchema, 1, validationOptions).valid).toBe(false)
      await expect(validateAsync(notSchema, 1, validationOptions)).rejects.toBeInstanceOf(ValidationError)
      expect(runtime.validate(notSchema, 1, validationOptions).valid).toBe(false)

      expect(validate(propertySchema, { value: 1 }, validationOptions).valid).toBe(true)
      expect(validate(propertySchema, { value: 'bad' }, validationOptions).valid).toBe(false)
    } finally {
      runtime.dispose()
    }
  })

  it('keeps every release gate on the tag-triggered publish commit', () => {
    const workflow = readFileSync(new URL('../../.github/workflows/publish.yml', import.meta.url), 'utf8')
    const requiredCommands = [
      'npm run test:coverage',
      'npm run examples:typecheck',
      'npm run examples:run',
      'npm run build',
      'npm run bench:guard:smoke',
    ]

    for (const command of requiredCommands) {
      expect(workflow).toContain(command)
    }
    expect(workflow).toContain('working-directory: website')
  })
})
