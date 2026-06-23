import { describe, expect, it, afterEach } from 'vitest'
import { createRuntime, createSchemaDslAdapter, createSchemaDslRuntime } from '../../src/runtime.js'
import { dsl, Locale, PATTERNS, resetRuntimeState, s as globalS, TypeRegistry } from '../../src/index.js'
import { DslBuilder } from '../../src/core/DslBuilder.js'

afterEach(() => {
  resetRuntimeState()
})

describe('schema-dsl/runtime isolation', () => {
  it('exports confirmed runtime factory aliases', () => {
    expect(createSchemaDslRuntime).toBe(createRuntime)
    expect(createSchemaDslAdapter).toBe(createRuntime)
  })

  it('keeps runtime custom types isolated from the global TypeRegistry', () => {
    TypeRegistry.register('tenantLocal', { type: 'boolean' })

    const runtimeA = createRuntime({
      types: {
        tenantLocal: { type: 'string', pattern: '^tenant-a$' },
      },
    })
    const runtimeB = createRuntime({
      types: {
        tenantLocal: { type: 'number', minimum: 10 },
      },
    })

    expect(runtimeA.compile('tenantLocal')).toMatchObject({ type: 'string', pattern: '^tenant-a$' })
    expect(runtimeB.compile('tenantLocal')).toMatchObject({ type: 'number', minimum: 10 })
    expect(TypeRegistry.resolve('tenantLocal').baseSchema).toMatchObject({ type: 'boolean' })
  })

  it('preserves customMessages returned by runtime typeResolver', () => {
    const runtime = createRuntime({
      typeResolver: (typeName) =>
        typeName === 'tenantCode'
          ? {
            baseSchema: { type: 'string', pattern: '^TNT-[0-9]+$' },
            customMessages: { pattern: 'tenant.code.invalid' },
          }
          : null,
      messages: {
        'tenant.code.invalid': 'Tenant code is invalid',
      },
    })

    const result = runtime.validate(runtime.compile('tenantCode'), 'bad')

    expect(result.valid).toBe(false)
    expect(result.errorMessage).toBe('Tenant code is invalid')
  })

  it('keeps runtime pattern overrides out of global DSL parsing and chain methods', () => {
    const runtime = createRuntime({
      patterns: {
        phone: {
          zz: {
            pattern: /^ZZ-\d{2}$/,
            min: 5,
            max: 5,
            key: 'pattern.phone.zz',
          },
        },
      },
    })

    expect(runtime.compile('phone:zz')).toMatchObject({
      type: 'string',
      pattern: '^ZZ-\\d{2}$',
      minLength: 5,
      maxLength: 5,
    })

    const chain = runtime.compileField('string') as DslBuilder
    expect(chain.phone('zz').toSchema()).toMatchObject({ pattern: '^ZZ-\\d{2}$' })
    expect(() => dsl('phone:zz')).toThrow('[schema-dsl] Unsupported country/variant "zz" for type "phone"')
  })

  it('uses built-in pattern defaults instead of mutable global PATTERNS for new runtimes', () => {
    PATTERNS.phone.cn = { pattern: /^changed$/, min: 7, max: 7, key: 'pattern.phone.cn' }

    const runtime = createRuntime()

    expect(runtime.compile('phone:cn')).toMatchObject({
      type: 'string',
      pattern: '^1[3-9]\\d{9}$',
      minLength: 11,
      maxLength: 11,
    })
    expect((dsl('phone:cn') as DslBuilder).toSchema()).toMatchObject({
      pattern: '^changed$',
      minLength: 7,
      maxLength: 7,
    })
  })

  it('applies messageProvider to standard AJV errors per runtime call without changing Locale', () => {
    Locale.setLocale('en-US')
    const runtime = createRuntime({
      locale: 'tenant-a',
      messageProvider: ({ key, locale }) =>
        key === 'number.min' ? `provider:${locale}:{{#label}}:{{#limit}}` : undefined,
    })

    const result = runtime.validate({ age: 'number:10-20!' }, { age: 5 })

    expect(result.valid).toBe(false)
    expect(result.errorMessage).toBe('provider:tenant-a:age:10')
    expect(Locale.getLocale()).toBe('en-US')
  })

  it('applies messageProvider to custom keywords and async custom validators', async () => {
    const runtime = createRuntime({
      locale: 'tenant-b',
      messageProvider: ({ key, locale }) =>
        key === 'string.length' || key === 'CUSTOM_VALIDATION_FAILED'
          ? `provider:${locale}:${key}`
          : undefined,
    })

    const exactLength = runtime.validate(runtime.compileField('string:3'), 'ab')
    expect(exactLength.valid).toBe(false)
    expect(exactLength.errorMessage).toBe('provider:tenant-b:string.length')

    const schema = (runtime.compileField('string') as DslBuilder)
      .custom(async () => false)
      .toSchema()

    await expect(runtime.validateAsync(schema, 'ok')).rejects.toMatchObject({
      errors: [
        expect.objectContaining({
          message: 'provider:tenant-b:CUSTOM_VALIDATION_FAILED',
        }),
      ],
    })
  })

  it('creates localized I18nError instances without reading global Locale state', () => {
    Locale.setLocale('zh-CN')
    const runtime = createRuntime({
      locale: 'tenant-c',
      messages: {
        'account.missing': { code: 'TENANT_ACCOUNT_MISSING', message: 'Tenant account {{#id}} missing' },
      },
    })

    const error = runtime.createI18nError('account.missing', { id: 42 }, 404)

    expect(error).toMatchObject({
      message: 'Tenant account 42 missing',
      code: 'TENANT_ACCOUNT_MISSING',
      locale: 'tenant-c',
      statusCode: 404,
    })
    expect(Locale.getLocale()).toBe('zh-CN')
  })

  it('honors the top-level validate coerce:false alias in runtime validate calls', () => {
    const runtime = createRuntime()
    const schema = runtime.compile({ age: 'number:18-120' })

    const coerced = runtime.validate(schema, { age: '20' })
    const strict = runtime.validate(schema, { age: '20' }, { coerce: false })

    expect(coerced.valid).toBe(true)
    expect(strict.valid).toBe(false)
    expect(strict.errors?.[0]?.keyword).toBe('type')
  })

  it('normalizes DSL object inputs and boolean schemas consistently with root validate', () => {
    const runtime = createRuntime()
    const keywordFieldSchema = { properties: { enabled: 'boolean!' } }

    expect(runtime.validate(keywordFieldSchema, { properties: { enabled: true } }).valid).toBe(true)
    expect(runtime.validate(keywordFieldSchema, { properties: {} }).valid).toBe(false)
    expect(runtime.validate(true, { any: 'value' }).valid).toBe(true)
    expect(runtime.validate(false, { any: 'value' }).valid).toBe(false)
  })

  it('exposes scoped s and dsl namespace factories without leaking to global namespace', () => {
    const runtime = createRuntime()

    expect(runtime.s).toBe(runtime.dsl)
    expect(runtime.s.email().require().toSchema()).toMatchObject({
      type: 'string',
      format: 'email',
      _required: true,
    })
    expect(runtime.dsl.number().min(1).max(5).toSchema()).toMatchObject({
      type: 'number',
      minimum: 1,
      maximum: 5,
    })

    runtime.registerExtension({
      literal: 'tenant-runtime-id',
      factoryName: 'tenantRuntimeId',
      schema: { type: 'string', pattern: '^runtime_[a-z0-9]+$' },
    })

    expect(runtime.s('tenant-runtime-id!').toSchema()).toMatchObject({
      type: 'string',
      pattern: '^runtime_[a-z0-9]+$',
      _required: true,
    })
    expect((runtime.s as unknown as { tenantRuntimeId(): DslBuilder }).tenantRuntimeId().require().toSchema()).toMatchObject(
      runtime.s('tenant-runtime-id!').toSchema()
    )
    expect((globalS as unknown as { tenantRuntimeId?: unknown }).tenantRuntimeId).toBeUndefined()
    expect(TypeRegistry.has('tenant-runtime-id')).toBe(false)
  })

  it('keeps parameterized runtime extensions scoped to the runtime registry', () => {
    const runtime = createRuntime()
    const runtimeS = runtime.registerExtensions([
      {
        literal: 'tenant-runtime-id',
        factoryName: 'tenantRuntimeId',
        segmentMode: 'params',
        params: {
          scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
        },
        schema({ scope }) {
          return {
            type: 'string',
            pattern: scope === 'corp' ? '^rt_corp_[a-z0-9]+$' : '^rt_tenant_[a-z0-9]+$',
          }
        },
      },
    ] as const)

    expect(runtimeS).toBe(runtime.s)
    expect(runtime.compile({ tenant: 'tenant-runtime-id:corp!' })).toMatchObject({
      required: ['tenant'],
      properties: {
        tenant: { type: 'string', pattern: '^rt_corp_[a-z0-9]+$' },
      },
    })
    expect(runtimeS.tenantRuntimeId('corp').require().toSchema()).toMatchObject({
      type: 'string',
      pattern: '^rt_corp_[a-z0-9]+$',
      _required: true,
    })
    expect((globalS as unknown as { tenantRuntimeId?: unknown }).tenantRuntimeId).toBeUndefined()
    expect(TypeRegistry.has('tenant-runtime-id')).toBe(false)
  })

  it('clears scoped namespace extension factories on runtime reset and replace', () => {
    const runtime = createRuntime({ strict: true })

    runtime.registerExtension({
      literal: 'tenant-runtime-id',
      factoryName: 'tenantRuntimeId',
      schema: { type: 'string', pattern: '^runtime_[a-z0-9]+$' },
    })

    expect((runtime.s as unknown as { tenantRuntimeId(): DslBuilder }).tenantRuntimeId().toSchema()).toMatchObject({
      type: 'string',
      pattern: '^runtime_[a-z0-9]+$',
    })

    runtime.configure({ strict: true }, { mode: 'replace' })

    expect((runtime.s as unknown as { tenantRuntimeId?: unknown }).tenantRuntimeId).toBeUndefined()
    expect(() => runtime.compile('tenant-runtime-id')).toThrow(/Unknown type "tenant-runtime-id"/)

    runtime.registerExtension({
      literal: 'tenant-runtime-id',
      factoryName: 'tenantRuntimeId',
      schema: { type: 'string', pattern: '^runtime_[a-z0-9]+$' },
    })

    runtime.configure({ strict: true }, { mode: 'reset' })

    expect((runtime.s as unknown as { tenantRuntimeId?: unknown }).tenantRuntimeId).toBeUndefined()
    expect(() => runtime.compile('tenant-runtime-id')).toThrow(/Unknown type "tenant-runtime-id"/)
  })

  it('supports runtime configure, registration, cache stats and reset lifecycle', () => {
    const runtime = createRuntime({
      strict: true,
      locale: 'tenant-old',
      messages: { one: 'one old' },
      types: {
        tenantOld: { type: 'string', pattern: '^old$' },
      },
      patterns: {
        phone: {
          old: { pattern: /^OLD-\d{2}$/, min: 6, max: 6, key: 'pattern.phone.old' },
        },
      },
      validator: {
        cache: { maxSize: 10 },
      },
    })

    runtime.validate({ id: 'string!' }, { id: 'ok' })
    expect(runtime.getStats()).toMatchObject({
      disposed: false,
      locale: 'tenant-old',
      messageKeyCount: 1,
      customTypeCount: 1,
    })
    expect(runtime.compile('tenantOld')).toMatchObject({ type: 'string', pattern: '^old$' })
    expect(runtime.compile('phone:old')).toMatchObject({ pattern: '^OLD-\\d{2}$' })

    runtime.configure({
      strict: true,
      locale: 'tenant-new',
      messages: { two: 'two new' },
      types: {
        tenantNew: { type: 'number', minimum: 2 },
      },
      patterns: {
        phone: {
          fresh: { pattern: /^NEW-\d{2}$/, min: 6, max: 6, key: 'pattern.phone.fresh' },
        },
      },
    }, { mode: 'replace' })

    expect(runtime.createI18nError('one').message).toBe('one')
    expect(runtime.createI18nError('two').message).toBe('two new')
    expect(runtime.compile('tenantNew')).toMatchObject({ type: 'number', minimum: 2 })
    expect(() => runtime.compile('tenantOld')).toThrow(/Unknown type "tenantOld"/)
    expect(runtime.compile('phone:fresh')).toMatchObject({ pattern: '^NEW-\\d{2}$' })
    expect(() => runtime.compile('phone:old')).toThrow('[schema-dsl] Unsupported country/variant "old" for type "phone"')

    runtime.registerType('runtimeLater', { type: 'integer', minimum: 5 })
    runtime.registerDynamicType('runtimeDynamic', () => ({ type: 'string', minLength: 3 }))
    expect(runtime.compile('runtimeLater')).toMatchObject({ type: 'integer', minimum: 5 })
    expect(runtime.compile('runtimeDynamic')).toMatchObject({ type: 'string', minLength: 3 })
    runtime.unregisterType('runtimeLater')
    expect(() => runtime.compile('runtimeLater')).toThrow(/Unknown type "runtimeLater"/)

    runtime.clearCache()
    expect(runtime.getStats().validators.defaultCache.size).toBe(0)

    runtime.configure({}, { mode: 'reset' })
    expect(runtime.getStats()).toMatchObject({
      disposed: false,
      locale: 'en-US',
      messageKeyCount: 0,
      customTypeCount: 0,
      dynamicTypeCount: 0,
    })
    expect(runtime.compile('phone:cn')).toMatchObject({ pattern: '^1[3-9]\\d{9}$' })
  })

  it('disposes runtime state and rejects use-after-dispose', async () => {
    const runtime = createRuntime({
      messages: { gone: 'gone' },
      types: { transient: { type: 'string' } },
    })
    const builder = runtime.compileField('transient') as DslBuilder
    await expect(builder.validate('ok')).resolves.toMatchObject({ valid: true })

    runtime.dispose()
    runtime.dispose()

    expect(runtime.getStats()).toMatchObject({
      disposed: true,
      messageKeyCount: 0,
      customTypeCount: 0,
      dynamicTypeCount: 0,
      patternGroupCount: 0,
      patternEntryCount: 0,
    })
    expect(() => runtime.compile('string')).toThrow('[schema-dsl/runtime] Runtime has been disposed')
    expect(() => runtime.s.email()).toThrow('[schema-dsl/runtime] Runtime has been disposed')
    expect(() => runtime.validate({ type: 'string' }, 'ok')).toThrow('[schema-dsl/runtime] Runtime has been disposed')
    expect(() => runtime.clearCache()).toThrow('[schema-dsl/runtime] Runtime has been disposed')
    await expect(builder.validate('ok')).rejects.toThrow('[schema-dsl/runtime] Runtime has been disposed')
  })
})
