import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'

import {
  MarkdownExporter,
  MongoDBExporter,
  MySQLExporter,
  PluginManager,
  PostgreSQLExporter,
  Locale,
  SchemaHelper,
  SchemaUtils,
  ValidationError,
  Validator,
  getDefaultValidator,
  resetRuntimeState,
  s,
  validate,
} from '../../src/index.js'
import { createRuntime } from '../../src/runtime.js'
import { DslParser } from '../../src/parser/DslParser.js'
import { createSchemaCacheKey } from '../../src/core/SchemaCacheKey.js'
import type { JSONSchema } from '../../src/types/schema.js'
import type { CacheOptions } from '../../src/types/config.js'
import type { ValidateOptions } from '../../src/types/validate.js'
import { readFileSync } from 'node:fs'

function objectSurface(value: unknown, seen = new WeakSet<object>()): unknown {
  if (!value || typeof value !== 'object' || seen.has(value)) return null
  seen.add(value)

  const descriptors = Object.getOwnPropertyDescriptors(value)
  const entries = Reflect.ownKeys(descriptors).map(key => {
    const descriptor = descriptors[key as keyof typeof descriptors]
    return {
      key: typeof key === 'symbol' ? key.toString() : key,
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      writable: 'writable' in descriptor ? descriptor.writable : undefined,
      getter: descriptor.get,
      setter: descriptor.set,
      value: 'value' in descriptor && (typeof descriptor.value !== 'object' || descriptor.value === null)
        ? descriptor.value
        : undefined,
    }
  })

  return {
    entries,
    children: Reflect.ownKeys(value).map(key => objectSurface(
      (value as Record<PropertyKey, unknown>)[key],
      seen,
    )),
  }
}

describe('2026-07-10 audit regressions: correctness contracts', () => {
  afterEach(() => resetRuntimeState())

  it('keeps constructor-owned ValidateOptions fields explicitly typed for source compatibility', () => {
    expectTypeOf<ValidateOptions['removeAdditional']>().toEqualTypeOf<boolean | 'all' | 'failing' | undefined>()
    expectTypeOf<ValidateOptions['cache']>().toEqualTypeOf<boolean | CacheOptions | undefined>()
    expectTypeOf<ValidateOptions['strict']>().toEqualTypeOf<boolean | undefined>()
  })

  it('builds current sources before every supported benchmark entry', () => {
    const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as {
      scripts: Record<string, string>
    }
    const benchmarkEntries = Object.entries(packageJson.scripts)
      .filter(([name]) => name === 'bench' || (name.startsWith('bench:') && name !== 'bench:prepare'))

    expect(benchmarkEntries.length).toBeGreaterThan(0)
    for (const [name, command] of benchmarkEntries) {
      expect(command, name).toMatch(/^npm run bench:prepare && /)
    }
  })

  it('preserves child benchmark diagnostics when the performance guard fails', () => {
    const guardSource = readFileSync(
      new URL('../../scripts/check-performance-regression.mjs', import.meta.url),
      'utf8',
    )

    expect(guardSource).toContain("stdio: ['ignore', 'pipe', 'pipe']")
    expect(guardSource).toContain('Performance benchmark ${mode} run ${run + 1}/${baseline.runs} failed')
    expect(guardSource).not.toContain("stdio: 'ignore'")
  })

  it('does not mutate caller-owned raw schemas while keeping mutation invalidation correct', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        value: { type: 'number' },
      },
      required: ['value'],
    }
    const peer = SchemaHelper.cloneSchema(schema)
    const surfaceBefore = objectSurface(schema)
    const jsonBefore = JSON.stringify(schema)
    const idBefore = SchemaHelper.generateSchemaId(schema)

    expect(validate(schema, { value: 1 }).valid).toBe(true)
    expect(objectSurface(schema)).toEqual(surfaceBefore)
    expect(JSON.stringify(schema)).toBe(jsonBefore)
    expect(SchemaHelper.generateSchemaId(schema)).toBe(idBefore)
    expect(SchemaHelper.compareSchemas(schema, peer)).toBe(true)

    const valueSchema = schema.properties?.value
    if (!valueSchema || typeof valueSchema !== 'object') throw new Error('value schema missing')
    valueSchema.type = 'string'

    expect(validate(schema, { value: 1 }).valid).toBe(false)
    expect(validate(schema, { value: 'one' }).valid).toBe(true)
  })

  it('rejects meta-schema-invalid inputs before a validation plan can return success', () => {
    const invalidSchemas: JSONSchema[] = [
      { type: 'string', minLength: -1 },
      { type: 'array', minItems: 1.5 },
      { type: 'object', properties: { id: { type: 'string' } }, required: ['id', 'id'] },
      { type: ['string', 'string'] as unknown as 'string' },
      { enum: [1, 1] },
      { type: 'number', exclusiveMinimum: true as unknown as number },
    ]

    const data = ['value', [], { id: 'x' }, 'value', 1, 2]
    const validator = new Validator()
    for (let index = 0; index < invalidSchemas.length; index++) {
      const schema = invalidSchemas[index]
      expect(validator.getAjv().validateSchema(schema), JSON.stringify(schema)).toBe(false)
      expect(validate(schema, data[index]).valid, JSON.stringify(schema)).toBe(false)
      expect(validator.validate(schema, data[index]).valid, JSON.stringify(schema)).toBe(false)
    }
  })

  it('invalidates SchemaDslRuntime normalization when a caller-owned raw schema changes', () => {
    const runtime = createRuntime()
    const schema: JSONSchema = {
      type: 'object',
      properties: { value: { type: 'number' } },
      required: ['value'],
    }

    expect(runtime.validate(schema, { value: 1 }).valid).toBe(true)
    const valueSchema = schema.properties?.value
    if (!valueSchema || typeof valueSchema !== 'object') throw new Error('value schema missing')
    valueSchema.type = 'string'

    expect(runtime.validate(schema, { value: 1 }).valid).toBe(false)
    expect(runtime.validate(schema, { value: 'one' }).valid).toBe(true)
    runtime.dispose()
  })

  it('evicts AJV identity caches when a caller-owned raw schema changes structural key', () => {
    const validator = new Validator()
    const definitions: Record<string, JSONSchema> = {
      Value: { type: 'number' },
    }
    const schema: JSONSchema = {
      type: 'object',
      properties: { value: { $ref: '#/$defs/Value' } },
      required: ['value'],
      $defs: definitions,
    }

    expect(validator.validate(schema, { value: 1 }).valid).toBe(true)
    definitions.Value = { type: 'string', minLength: 2 }
    expect(validator.validate(schema, { value: 1 }).valid).toBe(false)
    expect(validator.validate(schema, { value: 'ok' }).valid).toBe(true)
  })

  it('invalidates every public generated schema cache without poisoning structural peers', () => {
    const generated = s({ value: 'number!' }) as JSONSchema
    const peer = s({ value: 'number!' }) as JSONSchema

    expect(validate(generated, { value: 1 }).valid).toBe(true)
    expect(validate(peer, { value: 1 }).valid).toBe(true)

    const generatedValue = generated.properties?.value
    if (!generatedValue || typeof generatedValue !== 'object') throw new Error('generated value schema missing')
    generatedValue.type = 'string'

    expect(validate(generated, { value: 1 }).valid).toBe(false)
    expect(validate(generated, { value: 'one' }).valid).toBe(true)
    expect(validate(peer, { value: 1 }).valid).toBe(true)
    expect(validate(peer, { value: 'one' }).valid).toBe(false)

    const enumSchema = s({ value: 'enum:a,b!' }) as JSONSchema
    expect(validate(enumSchema, { value: 'c' }).valid).toBe(false)
    const enumValues = enumSchema.properties?.value
    if (!enumValues || typeof enumValues !== 'object' || !Array.isArray(enumValues.enum)) {
      throw new Error('generated enum schema missing')
    }
    enumValues.enum.push('c')
    expect(validate(enumSchema, { value: 'c' }).valid).toBe(true)

    const directSchema = s({ value: 'number!' }) as JSONSchema
    const directValidator = new Validator()
    expect(directValidator.validate(directSchema, { value: 1 }).valid).toBe(true)
    const directValue = directSchema.properties?.value
    if (!directValue || typeof directValue !== 'object') throw new Error('direct value schema missing')
    directValue.type = 'string'
    expect(directValidator.validate(directSchema, { value: 1 }).valid).toBe(false)
    expect(directValidator.validate(directSchema, { value: 'one' }).valid).toBe(true)

    const cloned = SchemaUtils.clone(s({ value: 'number!' }) as JSONSchema)
    expect(validate(cloned, { value: 1 }).valid).toBe(true)
    const clonedValue = cloned.properties?.value
    if (!clonedValue || typeof clonedValue !== 'object') throw new Error('cloned value schema missing')
    clonedValue.type = 'string'
    expect(validate(cloned, { value: 1 }).valid).toBe(false)
    expect(validate(cloned, { value: 'one' }).valid).toBe(true)

    const runtime = createRuntime()
    const runtimeSchema = runtime.compile({ value: 'number!' })
    expect(runtime.validate(runtimeSchema, { value: 1 }).valid).toBe(true)
    const runtimeValue = runtimeSchema.properties?.value
    if (!runtimeValue || typeof runtimeValue !== 'object') throw new Error('runtime value schema missing')
    runtimeValue.type = 'string'
    expect(runtime.validate(runtimeSchema, { value: 1 }).valid).toBe(false)
    expect(runtime.validate(runtimeSchema, { value: 'one' }).valid).toBe(true)
    runtime.dispose()
  })

  it('invalidates a generated schema when an injected child changes through its saved raw alias', () => {
    const schema = s({ value: 'number!' }) as JSONSchema
    const externalChild: JSONSchema = { type: 'number' }
    if (!schema.properties) throw new Error('generated properties missing')
    schema.properties.value = externalChild

    expect(validate(schema, { value: 1 }).valid).toBe(true)
    externalChild.type = 'string'
    expect(validate(schema, { value: 1 }).valid).toBe(false)
    expect(validate(schema, { value: 'ok' }).valid).toBe(true)

    const directSchema = s({ value: 'number!' }) as JSONSchema
    const directChild: JSONSchema = { type: 'number' }
    if (!directSchema.properties) throw new Error('direct properties missing')
    directSchema.properties.value = directChild
    const validator = new Validator()
    expect(validator.validate(directSchema, { value: 1 }).valid).toBe(true)
    directChild.type = 'string'
    expect(validator.validate(directSchema, { value: 1 }).valid).toBe(false)

    const runtime = createRuntime()
    const runtimeSchema = runtime.compile({ value: 'number!' })
    const runtimeChild: JSONSchema = { type: 'number' }
    if (!runtimeSchema.properties) throw new Error('runtime properties missing')
    runtimeSchema.properties.value = runtimeChild
    expect(runtime.validate(runtimeSchema, { value: 1 }).valid).toBe(true)
    runtimeChild.type = 'string'
    expect(runtime.validate(runtimeSchema, { value: 1 }).valid).toBe(false)
    runtime.dispose()
  })

  it('does not reuse a generated root fast entry after the public cache is disabled', () => {
    const schema = s({ value: 'number!' }) as JSONSchema
    expect(validate(schema, { value: 1 }).valid).toBe(true)

    const validator = getDefaultValidator()
    const originalValidate = validator.validate.bind(validator)
    let calls = 0
    validator.validate = ((...args: Parameters<Validator['validate']>) => {
      calls++
      return originalValidate(...args)
    }) as Validator['validate']
    validator.cache.options = { enabled: false }

    expect(validate(schema, { value: 1 }).valid).toBe(true)
    expect(calls).toBe(1)
  })

  it('computes async custom validator truth inside oneOf, not, if, and contains', async () => {
    const validator = new Validator()
    const accepts = (expected: string) => async (value: unknown) => value === expected

    await expect(validator.validateAsync({
      oneOf: [
        { type: 'string', _customValidators: [accepts('left')] },
        { type: 'string', _customValidators: [accepts('right')] },
      ],
    } as JSONSchema, 'left')).resolves.toBe('left')

    await expect(validator.validateAsync({
      not: { type: 'string', _customValidators: [async () => false] },
    } as JSONSchema, 'value')).resolves.toBe('value')

    await expect(validator.validateAsync({
      if: { type: 'string', _customValidators: [async () => false] },
      then: { _customValidators: [async () => 'wrong branch'] },
      else: { _customValidators: [async () => true] },
    } as JSONSchema, 'value')).resolves.toBe('value')

    await expect(validator.validateAsync({
      type: 'array',
      contains: { type: 'string', _customValidators: [accepts('ok')] },
      minContains: 2,
    } as JSONSchema, ['ok', 'bad'])).rejects.toThrow()

    await expect(validator.validateAsync({
      if: false,
      then: true,
      else: false,
    }, 'value')).rejects.toThrow()
    await expect(validator.validateAsync({
      if: true,
      then: false,
      else: true,
    }, 'value')).rejects.toThrow()
    await expect(validator.validateAsync({
      type: 'array',
      contains: false,
    }, [])).rejects.toThrow()
    await expect(validator.validateAsync({
      type: 'array',
      contains: null,
    } as unknown as JSONSchema, [])).rejects.toThrow()

    const referencedBranch: JSONSchema = {
      oneOf: [{ $ref: '#/$defs/Accepted' }, { type: 'number' }],
      $defs: {
        Accepted: {
          type: 'string',
          _customValidators: [accepts('ok')],
        },
      },
    }
    await expect(validator.validateAsync(referencedBranch, 'ok')).resolves.toBe('ok')
    await expect(validator.validateAsync(referencedBranch, 'bad')).rejects.toThrow()

    const identifiedReferencedBranch: JSONSchema = {
      $id: 'https://schema-dsl.test/async-root',
      oneOf: [{ $ref: '#/$defs/Alias' }, { type: 'number' }],
      $defs: {
        Alias: { $ref: '#/$defs/Accepted' },
        Accepted: {
          type: 'string',
          _customValidators: [accepts('ok')],
        },
      },
    }
    await expect(validator.validateAsync(identifiedReferencedBranch, 'ok')).resolves.toBe('ok')
    await expect(validator.validateAsync(identifiedReferencedBranch, 'bad')).rejects.toThrow()

    const rootCoercionSchema: JSONSchema = {
      type: 'object',
      properties: {
        value: {
          oneOf: [{
            type: 'number',
            _customValidators: [async value => typeof value === 'number'],
          }],
        },
      },
      required: ['value'],
    }
    await expect(validator.validateAsync(rootCoercionSchema, { value: '42' })).resolves.toEqual({ value: 42 })

    const noBranchCoercion: JSONSchema = {
      not: {
        type: 'object',
        properties: { value: { type: 'number' } },
        required: ['value'],
      },
    }
    expect(validator.validate(noBranchCoercion, { value: '42' }).valid).toBe(true)
    await expect(validator.validateAsync(noBranchCoercion, { value: '42' })).resolves.toEqual({ value: '42' })

    const ignoredOneOfDefault: JSONSchema = {
      oneOf: [{
        type: 'object',
        properties: { value: { type: 'number', default: 1 } },
        required: ['value'],
      }, { type: 'string' }],
      _customValidators: [async () => true],
    }
    const ignoredDefaultData = {}
    await expect(validator.validateAsync(ignoredOneOfDefault, ignoredDefaultData)).rejects.toThrow()
    expect(ignoredDefaultData).toEqual({})

    const selectedElseDefault: JSONSchema = {
      type: 'object',
      if: { type: 'object', required: ['kind'] },
      then: true,
      else: { type: 'object', properties: { fallback: { type: 'number', default: 2 } } },
      _customValidators: [async () => true],
    }
    await expect(validator.validateAsync(selectedElseDefault, {})).resolves.toEqual({ fallback: 2 })
  })

  it('enforces minContains and maxContains across compile, sync, and async entry points', async () => {
    const validator = new Validator()
    const rangeSchema: JSONSchema = {
      type: 'array',
      contains: { type: 'string' },
      minContains: 2,
      maxContains: 2,
    }

    expect(validator.validate(rangeSchema, ['a', 'b']).valid).toBe(true)

    const tooFew = validator.validate(rangeSchema, ['a', 1])
    expect(tooFew.valid).toBe(false)
    expect(tooFew.errors?.[0]).toMatchObject({
      keyword: 'contains',
      path: 'value',
      params: { minContains: 2, maxContains: 2, matches: 1 },
    })

    const tooMany = validator.validate(rangeSchema, ['a', 'b', 'c'])
    expect(tooMany.valid).toBe(false)
    expect(tooMany.errors?.[0]).toMatchObject({
      keyword: 'contains',
      params: { minContains: 2, maxContains: 2, matches: 3 },
    })

    expect(validator.validate({
      type: 'array',
      contains: { type: 'string' },
      minContains: 0,
    }, [1, 2]).valid).toBe(true)

    const compiled = validator.compile(rangeSchema)
    expect(compiled(['a', 'b'])).toBe(true)
    expect(compiled(['a'])).toBe(false)
    expect(compiled.errors?.[0]).toMatchObject({
      keyword: 'contains',
      params: { minContains: 2, maxContains: 2, matches: 1 },
    })

    const asyncSchema: JSONSchema = {
      type: 'array',
      contains: {
        type: 'string',
        _customValidators: [async value => value === 'ok'],
      },
      minContains: 2,
      maxContains: 2,
    }
    await expect(validator.validateAsync(asyncSchema, ['ok', 'ok'])).resolves.toEqual(['ok', 'ok'])

    try {
      await validator.validateAsync(asyncSchema, ['ok', 'bad'])
      throw new Error('expected validateAsync to reject')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).errors[0]).toMatchObject({
        keyword: 'contains',
        path: '',
      })
    }

    const constantData = {
      minContains: 2,
      contains: { type: 'string' },
    }
    const constSchema: JSONSchema = { const: constantData }
    expect(validator.validate(constSchema, constantData).valid).toBe(true)
    expect(validator.validate(constSchema, { ...constantData, minContains: 1 }).valid).toBe(false)
  })

  it('projects composition and schema dependencies without creating impossible schemas', () => {
    const schema: JSONSchema = {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        password: { type: 'string' },
      },
      required: ['name', 'password'],
      allOf: [{ required: ['password'] }],
      dependencies: {
        name: {
          properties: { password: { type: 'string', minLength: 8 } },
          required: ['password'],
        },
      },
    }

    const picked = SchemaUtils.pick(schema, ['name'])
    expect(validate(picked, { name: 'Ada' }).valid).toBe(true)

    const omitted = SchemaUtils.omit(schema, ['password'])
    expect(validate(omitted, { name: 'Ada' }).valid).toBe(true)

    const partial = SchemaUtils.partial(schema)
    expect(validate(partial, {}).valid).toBe(true)

    const closedDependency = SchemaUtils.pick(schema, ['name', 'password'])
    expect(closedDependency.dependencies?.name).toBeDefined()
    expect(validate(closedDependency, { name: 'Ada', password: 'short' }).valid).toBe(false)

    expect(() => SchemaUtils.pick({
      type: 'object',
      properties: {
        name: { type: 'string' },
        password: { type: 'string' },
      },
      anyOf: [{
        dependencies: {
          name: { required: ['password'] },
        },
      }],
    }, ['name'])).toThrow(/omitted field "password"/)
  })

  it('derives omit fields from the complete object-level composition surface', () => {
    const allOfOnly = SchemaUtils.omit({
      type: 'object',
      allOf: [{
        properties: {
          removed: { type: 'string' },
          kept: { type: 'number' },
        },
        required: ['removed', 'kept'],
      }],
    }, ['removed'])

    expect(validate(allOfOnly, {}).valid).toBe(false)
    expect(validate(allOfOnly, { kept: 1 }).valid).toBe(true)
    expect(validate(allOfOnly, { kept: 'one' }).valid).toBe(false)

    const dependent = SchemaUtils.omit({
      type: 'object',
      properties: { trigger: { type: 'boolean' } },
      dependentSchemas: {
        trigger: {
          properties: { kept: { type: 'number' }, removed: { type: 'string' } },
          required: ['kept', 'removed'],
        },
      },
    }, ['removed'])

    expect(dependent.dependentSchemas?.trigger).toBeDefined()
    expect((dependent.dependentSchemas?.trigger as JSONSchema).required).toEqual(['kept'])

    const draft7Dependency = SchemaUtils.omit({
      type: 'object',
      properties: { trigger: { type: 'boolean' } },
      dependencies: {
        trigger: {
          properties: { kept: { type: 'number' }, removed: { type: 'string' } },
          required: ['kept', 'removed'],
        },
      },
    }, ['removed'])
    expect(validate(draft7Dependency, { trigger: true }).valid).toBe(false)
    expect(validate(draft7Dependency, { trigger: true, kept: 1 }).valid).toBe(true)

    const anyOfOnly: JSONSchema = {
      type: 'object',
      anyOf: [{ properties: { kept: { type: 'number' } }, required: ['kept'] }],
    }
    expect(() => SchemaUtils.omit(anyOfOnly, ['missing'])).not.toThrow()
    expect(validate(SchemaUtils.omit(anyOfOnly, ['missing']), {}).valid).toBe(false)
  })

  it('reports target-aware recursive Boolean Schema losses and enforces strict reports', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        always: true,
        never: false,
      },
    }

    for (const report of [
      new MySQLExporter().exportWithReport('records', schema),
      new PostgreSQLExporter().exportWithReport('records', schema),
    ]) {
      expect(report.losses.map(loss => `${loss.path}:${loss.keyword}`)).toEqual(expect.arrayContaining([
        '$.properties.always:$booleanSchema',
        '$.properties.never:$booleanSchema',
      ]))
    }

    const mongo = new MongoDBExporter().exportWithReport(schema)
    expect(mongo.losses.map(loss => `${loss.path}:${loss.keyword}`)).toContain(
      '$.properties.never:$booleanSchema',
    )
    expect(mongo.losses.map(loss => `${loss.path}:${loss.keyword}`)).not.toContain(
      '$.properties.always:$booleanSchema',
    )

    expect(new MarkdownExporter().exportWithReport(schema).losses).toEqual([])
    expect(() => new MySQLExporter().exportWithReport('records', schema, { strict: true })).toThrow(
      'Export would lose unsupported JSON Schema keywords',
    )

    const malformedPercentRef = new MySQLExporter().exportWithReport('records', {
      type: 'object',
      properties: { escaped: { $ref: '#/$defs/%' } },
      $defs: { '%': { not: { type: 'null' } } },
    })
    expect(malformedPercentRef.losses.some(loss => loss.keyword === 'not')).toBe(true)
  })

  it('keeps failed PluginManager.clear entries registered for an explicit retry', () => {
    const manager = new PluginManager()
    let fail = true
    manager.register({
      name: 'retryable',
      install: () => {},
      uninstall: () => {
        if (fail) throw new Error('temporary failure')
      },
    })
    manager.register({ name: 'clean', install: () => {}, uninstall: () => {} })
    manager.install({})

    expect(() => manager.clear()).toThrow(AggregateError)
    expect(manager.has('retryable')).toBe(true)
    expect(manager.has('clean')).toBe(false)

    fail = false
    expect(() => manager.clear()).not.toThrow()
    expect(manager.size).toBe(0)
  })

  it('keeps plugin aliases and synchronous lifecycle hook failures observable', () => {
    const manager = new PluginManager()
    const hookErrors: unknown[] = []
    manager.on('hook:error', event => hookErrors.push(event))
    manager.hook('onBeforeRegister', () => {
      throw new Error('observer failure')
    })

    manager.register({ name: 'alias-target', install: () => {}, uninstall: () => {} })
    expect(manager.pluginCount).toBe(1)
    expect(hookErrors).toHaveLength(1)
    expect(manager.uninstall('alias-target')).toBe(manager)
    expect(manager.pluginCount).toBe(0)
  })

  it('applies and resets defaultLocale and cache configuration through s.config()', () => {
    s.config({ defaultLocale: 'zh-CN', cache: { maxSize: 7, enabled: true } })
    expect(Locale.getLocale()).toBe('zh-CN')
    expect(getDefaultValidator().cache.options.maxSize).toBe(7)

    resetRuntimeState()
    expect(Locale.getLocale()).toBe('en-US')
    expect(getDefaultValidator().cache.options.maxSize).not.toBe(7)
  })

  it('preserves Validator call types and exposes performance metadata at runtime', () => {
    const monitored = SchemaUtils.withPerformance(new Validator())
    expectTypeOf(monitored).toMatchTypeOf<Validator>()
    const result = monitored.validate({ type: 'string' }, 'value')

    expect(result.valid).toBe(true)
    expect(result.performance.duration).toBeGreaterThanOrEqual(0)
    expect(Number.isNaN(Date.parse(result.performance.timestamp))).toBe(false)
  })

  it('rejects protected built-in names in isolated runtimes instead of ignoring overrides', () => {
    const runtime = createRuntime()
    expect(() => runtime.registerType(' ', { type: 'number' })).toThrow(
      'type name must be a non-empty string',
    )
    expect(() => runtime.registerType('string', { type: 'number' })).toThrow(
      'cannot override protected built-in type "string"',
    )
    expect(() => runtime.registerDynamicType('number', () => ({ type: 'string' }))).toThrow(
      'cannot override protected built-in type "number"',
    )
    runtime.dispose()
  })

  it('keeps top-level custom validator object and promise return contracts on the sync path', () => {
    const objectFailure = validate({
      type: 'string',
      _customValidators: [() => ({ error: true, message: 'object failure' })],
    } as JSONSchema, 'value')
    expect(objectFailure.valid).toBe(false)
    expect(objectFailure.errorMessage).toBe('object failure')

    const asyncFailure = validate({
      type: 'string',
      _customValidators: [() => Promise.resolve(true)],
    } as JSONSchema, 'value')
    expect(asyncFailure.valid).toBe(false)
    expect(asyncFailure.errorMessage).toBe(Locale.getMessageText('ASYNC_VALIDATION_NOT_SUPPORTED'))
  })

  it('reports parser cycles, excessive depth, and oversized strings as SchemaCompileError', () => {
    const cyclic: Record<string, unknown> = {}
    cyclic.self = cyclic
    expect(() => DslParser.parseObject(cyclic as never)).toThrowError(expect.objectContaining({
      name: 'SchemaCompileError',
      code: 'SCHEMA_COMPILE_ERROR',
    }))

    let nested = 'string'
    for (let index = 0; index < 260; index++) nested = `array<${nested}>`
    expect(() => DslParser.parseString(nested)).toThrow(/maximum depth of 256/)
    expect(() => DslParser.parseString(`string:${'x'.repeat(100_001)}`)).toThrow(
      /maximum length of 100000/,
    )

    const cyclicArray: unknown[] = []
    cyclicArray.push(cyclicArray)
    expect(createSchemaCacheKey({ allOf: cyclicArray })).toBeNull()
  })
})
