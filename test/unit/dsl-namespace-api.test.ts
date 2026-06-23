import { afterEach, describe, expect, it } from 'vitest'

import {
  compileWithDiagnostics,
  defineExtension,
  dsl,
  registerExtension,
  registerExtensions,
  resetRuntimeState,
  s,
  TypeRegistry,
  validate,
} from '../../src/pure.js'
import { DslExtensionRegistry } from '../../src/parser/DslExtensionRegistry.js'

afterEach(() => {
  resetRuntimeState()
})

describe('dsl namespace API', () => {
  it('exports s as the same namespace object as dsl', () => {
    expect(s).toBe(dsl)
    expect(s.config).toBe(dsl.config)
    expect(s.if).toBe(dsl.if)
    expect(s.match).toBe(dsl.match)
    expect(s.error).toBe(dsl.error)
  })

  it('keeps literal, dsl(), s(), and factory email schemas equivalent', () => {
    const expected = {
      type: 'string',
      format: 'email',
      pattern: 'custom',
      _label: '邮箱',
      _required: true,
    }

    expect(dsl('email!').label('邮箱').pattern(/custom/).toSchema()).toMatchObject(expected)
    expect(s('email!').label('邮箱').pattern(/custom/).toSchema()).toMatchObject(expected)
    expect(s.email().label('邮箱').pattern(/custom/).require().toSchema()).toMatchObject(expected)
    expect(dsl.email().label('邮箱').pattern(/custom/).require().toSchema()).toMatchObject(expected)
  })

  it('supports generalized factory equivalents for common DSL literals', () => {
    expect(s.string().min(3).max(32).require().toSchema()).toMatchObject({
      type: 'string',
      minLength: 3,
      maxLength: 32,
      _required: true,
    })
    expect(s('string:3-32!').toSchema()).toMatchObject(s.string().min(3).max(32).require().toSchema())

    expect(s.number().min(18).max(120).toSchema()).toMatchObject({
      type: 'number',
      minimum: 18,
      maximum: 120,
      _required: false,
    })
    expect(s('number:18-120').toSchema()).toMatchObject(s.number().min(18).max(120).toSchema())

    expect(s.array(s.string().require()).toSchema()).toMatchObject({
      type: 'array',
      items: { type: 'string' },
      _required: false,
    })
    expect((s.array(s.string().require()).toSchema().items as Record<string, unknown>)._required).toBeUndefined()
    expect(s('array<string>').toSchema()).toMatchObject(s.array('string').toSchema())

    const objectArraySchema = s.array({
      name: 'string!',
      quantity: s.number().min(1).require(),
    }).require().toSchema()
    expect(objectArraySchema).toMatchObject({
      type: 'array',
      _required: true,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number', minimum: 1 },
        },
        required: ['name', 'quantity'],
      },
    })
    expect(validate(s({ lines: s.array({ name: 'string!', quantity: s.number().min(1).require() }).require() }), {
      lines: [{ name: 'apple', quantity: 2 }],
    }).valid).toBe(true)
    expect(validate(s({ lines: s.array({ name: 'string!', quantity: s.number().min(1).require() }).require() }), {
      lines: [{ quantity: 2 }],
    }).valid).toBe(false)
    expect(s.array({ type: 'string', minLength: 2 }).toSchema()).toMatchObject({
      type: 'array',
      items: { type: 'string', minLength: 2 },
    })
    expect(s.array({ enum: ['small', 'large'] } as any).toSchema()).toMatchObject({
      type: 'array',
      items: { enum: ['small', 'large'] },
    })
    expect(s.array().items({ minimum: 1 } as any).toSchema()).toMatchObject({
      type: 'array',
      items: { minimum: 1 },
    })

    expect(s.enum('admin', 'user', 'guest').toSchema()).toMatchObject({
      type: 'string',
      enum: ['admin', 'user', 'guest'],
    })
    expect(s.enum(['admin', 'user', 'guest']).toSchema()).toMatchObject(s.enum('admin', 'user', 'guest').toSchema())
    expect(s('admin|user|guest').toSchema()).toMatchObject(s.enum('admin', 'user', 'guest').toSchema())
  })

  it('registers one parameterized extension definition for DSL seeds and typed factories', () => {
    const localS = registerExtensions([
      {
        literal: 'tenant-id',
        factoryName: 'tenantId',
        segmentMode: 'params',
        params: {
          scope: {
            kind: 'enum',
            values: ['tenant', 'corp'],
            default: 'tenant',
            description: 'Identifier namespace',
          },
        },
        schema({ scope }) {
          return {
            type: 'string',
            pattern: scope === 'corp' ? '^corp_[a-z0-9]+$' : '^tenant_[a-z0-9]+$',
          }
        },
      },
    ] as const)

    expect(localS).toBe(s)
    expect(localS('tenant-id!').toSchema()).toMatchObject({
      type: 'string',
      pattern: '^tenant_[a-z0-9]+$',
      _required: true,
    })
    expect(localS('tenant-id:corp!').label('租户').toSchema()).toMatchObject({
      type: 'string',
      pattern: '^corp_[a-z0-9]+$',
      _label: '租户',
      _required: true,
    })
    expect(localS.tenantId('corp').label('租户').require().toSchema()).toMatchObject(
      localS('tenant-id:corp!').label('租户').toSchema()
    )

    const schema = localS({
      compact: 'tenant-id:corp!',
      named: localS('tenant-id:corp!').label('负责人'),
      typed: localS.tenantId('corp').label('管理员').require(),
    })

    expect(schema.required).toEqual(['compact', 'named', 'typed'])
    expect(schema.properties?.compact).toMatchObject({ pattern: '^corp_[a-z0-9]+$' })
    expect(schema.properties?.named).toMatchObject({ _label: '负责人' })
  })

  it('supports factory-only params without allowing multiple DSL colon params', () => {
    const localS = registerExtensions([
      {
        literal: 'prefixed-code',
        factoryName: 'prefixedCode',
        segmentMode: 'params',
        params: {
          prefix: {
            kind: 'string',
            default: 'USR',
          },
          length: {
            kind: 'number',
            default: 8,
            factoryOnly: true,
          },
        },
        schema({ prefix = 'USR', length = 8 }) {
          return {
            type: 'string',
            pattern: `^${prefix}_[A-Z0-9]{${length}}$`,
          }
        },
      },
    ] as const)

    expect(localS('prefixed-code:INV!').toSchema()).toMatchObject({
      type: 'string',
      pattern: '^INV_[A-Z0-9]{8}$',
      _required: true,
    })
    expect(localS.prefixedCode({ prefix: 'INV', length: 10 }).require().toSchema()).toMatchObject({
      type: 'string',
      pattern: '^INV_[A-Z0-9]{10}$',
      _required: true,
    })
  })

  it('keeps range constraints on the existing dash syntax for constraint-mode extensions', () => {
    const localS = registerExtensions([
      {
        literal: 'age-range',
        factoryName: 'ageRange',
        segmentMode: 'constraint',
        schema: { type: 'number' },
        factory(min: number, max: number) {
          return `age-range:${min}-${max}`
        },
      },
    ] as const)

    expect(localS('age-range:18-65!').toSchema()).toMatchObject({
      type: 'number',
      minimum: 18,
      maximum: 65,
      _required: true,
    })
    expect(localS.ageRange(18, 65).require().toSchema()).toMatchObject(localS('age-range:18-65!').toSchema())

    const result = compileWithDiagnostics('age-range:18,65!')
    expect(result.diagnostics[0]).toMatchObject({
      code: 'INVALID_CONSTRAINT',
      constraint: '18,65',
    })
    expect(result.schema).toMatchObject({ type: 'number' })
  })

  it('returns structured diagnostics for extension param errors', () => {
    registerExtensions([
      {
        literal: 'tenant-id',
        factoryName: 'tenantId',
        segmentMode: 'params',
        params: {
          scope: { kind: 'enum', values: ['tenant', 'corp'], default: 'tenant' },
        },
        schema({ scope }) {
          return { type: 'string', pattern: `^${scope}_[a-z0-9]+$` }
        },
      },
    ] as const)

    const invalid = compileWithDiagnostics('tenant-id:bad!')
    expect(invalid.schema).toMatchObject({ type: 'string' })
    expect(invalid.diagnostics[0]).toMatchObject({
      code: 'EXTENSION_PARAM_INVALID',
      typeName: 'tenant-id',
      constraint: 'bad',
      param: 'scope',
    })

    const mixed = compileWithDiagnostics('tenant-id:corp>=0!')
    expect(mixed.diagnostics[0]).toMatchObject({
      code: 'EXTENSION_PARAM_CONSTRAINT_MIXED',
      typeName: 'tenant-id',
      constraint: 'corp>=0',
    })
  })

  it('validates extension definition shape before registration', () => {
    expect(() => defineExtension(null as never)).toThrow(/requires an extension definition object/)
    expect(() => defineExtension({ literal: '123bad', schema: { type: 'string' } })).toThrow(/literal must use/)
    expect(() => defineExtension({ factoryName: 'tenant-id', schema: { type: 'string' } })).toThrow(/valid JavaScript identifier/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      segmentMode: 'unknown' as never,
      schema: { type: 'string' },
    })).toThrow(/Invalid extension segmentMode/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      params: [] as never,
      schema: { type: 'string' },
    })).toThrow(/extension params must be an object/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      params: { 'bad-name': { kind: 'string' } } as never,
      schema: { type: 'string' },
    })).toThrow(/Invalid extension param/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      params: { scope: 'tenant' } as never,
      schema: { type: 'string' },
    })).toThrow(/definition must be an object/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      params: { scope: { kind: 'object' } } as never,
      schema: { type: 'string' },
    })).toThrow(/kind must be/)
    expect(() => defineExtension({
      literal: 'tenant-id',
      params: { scope: { kind: 'enum', values: [] } },
      schema: { type: 'string' },
    })).toThrow(/non-empty values array/)
  })

  it('normalizes extension factory and DSL parameters with useful failures', () => {
    const localS = registerExtensions([
      {
        literal: 'feature-flag',
        factoryName: 'featureFlag',
        segmentMode: 'params',
        params: {
          enabled: { kind: 'boolean', default: false },
          rollout: { kind: 'number', default: 0, factoryOnly: true },
          channel: { kind: 'enum', values: ['stable', 'beta'] as const, default: 'stable', factoryOnly: true },
        },
        schema({ enabled, rollout, channel }) {
          return {
            type: 'string',
            pattern: `^${channel}_${enabled ? 'on' : 'off'}_${rollout}$`,
          }
        },
      },
      {
        literal: 'status-code',
        factoryName: 'statusCode',
        segmentMode: 'params',
        params: {
          code: { kind: 'enum', values: [200, 404] as const, default: 200 },
        },
        schema({ code }) {
          return { type: 'number', const: code }
        },
      },
      {
        literal: 'toggle-state',
        factoryName: 'toggleState',
        segmentMode: 'params',
        params: {
          state: { kind: 'enum', values: [true, false] as const, default: true },
        },
        schema({ state }) {
          return { type: 'boolean', const: state }
        },
      },
      {
        literal: 'required-param',
        factoryName: 'requiredParam',
        segmentMode: 'params',
        params: {
          value: { kind: 'string', required: true },
        },
        schema({ value }) {
          return { type: 'string', const: value }
        },
      },
    ] as const)

    expect(localS('feature-flag:true!').toSchema()).toMatchObject({
      pattern: '^stable_on_0$',
      _required: true,
    })
    expect(localS.featureFlag({ enabled: 'true', rollout: '25', channel: 'beta' }).toSchema()).toMatchObject({
      pattern: '^beta_on_25$',
    })
    expect(localS.statusCode('404').toSchema()).toMatchObject({ const: 404 })
    expect(localS.toggleState('false').toSchema()).toMatchObject({ const: false })

    expect(() => localS.featureFlag({ extra: true })).toThrow(/unknown param "extra"/)
    expect(() => localS.featureFlag('true', '25', 'beta', 'extra')).toThrow(/too many factory arguments/)
    expect(() => localS.featureFlag({ enabled: 'maybe' })).toThrow(/expects true or false/)
    expect(() => localS.featureFlag({ rollout: '' })).toThrow(/expects a finite number/)
    expect(() => localS.statusCode('500')).toThrow(/must be one of/)
    expect(() => localS.requiredParam()).toThrow(/requires param "value"/)

    const unsupportedSegment = compileWithDiagnostics('feature-flag:true,25!')
    expect(unsupportedSegment.diagnostics[0]).toMatchObject({
      code: 'EXTENSION_PARAM_INVALID',
      param: 'enabled',
    })
  })

  it('keeps extension registration atomic and reports schema contract errors', () => {
    const registry = new DslExtensionRegistry()
    const registered = registry.register({
      literal: 'tenant-id',
      factoryName: 'tenantId',
      schema: { type: 'string' },
    })

    expect(registry.getByLiteral('tenant-id')).toBe(registered)
    expect(registry.getByFactoryName('tenantId')).toBe(registered)
    expect(() => registry.register({
      literal: 'tenant-id',
      factoryName: 'tenantOtherId',
      schema: { type: 'string' },
    })).toThrow(/already exists/)
    expect(registry.getByFactoryName('tenantOtherId')).toBeUndefined()
    expect(() => registry.register({
      literal: 'tenant-other',
      factoryName: 'tenantId',
      schema: { type: 'string' },
    })).toThrow(/already exists/)
    expect(() => registry.register({
      literal: 'schema-less',
      factoryName: 'schemaLess',
    })).toThrow(/requires schema/)

    registerExtension({
      literal: 'bad-schema',
      factoryName: 'badSchema',
      schema: () => null as never,
    })
    expect(() => s('bad-schema').toSchema()).toThrow(/schema must return a JSON Schema object/)
  })

  it('supports custom factories that return DSL strings, builders, or JSON schema objects', () => {
    registerExtensions([
      {
        factoryName: 'factoryString',
        factory(min: number, max: number) {
          return `string:${min}-${max}`
        },
      },
      {
        factoryName: 'factoryBuilder',
        factory() {
          return s.string().min(2).max(4)
        },
      },
      {
        factoryName: 'factorySchema',
        factory(pattern: string) {
          return { type: 'string', pattern }
        },
      },
    ] as const)

    expect(s.factoryString(2, 8).toSchema()).toMatchObject({ minLength: 2, maxLength: 8 })
    expect(s.factoryBuilder().require().toSchema()).toMatchObject({ minLength: 2, maxLength: 4, _required: true })
    expect(s.factorySchema('^json$').toSchema()).toMatchObject({ type: 'string', pattern: '^json$' })
  })

  it('handles extension segment-mode boundaries and non-diagnostic schema failures', () => {
    registerExtensions([
      {
        literal: 'no-segment',
        factoryName: 'noSegment',
        segmentMode: 'none',
        schema: { type: 'string' },
      },
      {
        literal: 'throws-schema',
        factoryName: 'throwsSchema',
        segmentMode: 'params',
        params: {
          value: { kind: 'string', default: 'x' },
        },
        schema() {
          throw new Error('schema failed')
        },
      },
    ] as const)

    const noSegment = compileWithDiagnostics('no-segment:value')
    expect(noSegment.schema).toMatchObject({ type: 'string' })
    expect(noSegment.diagnostics[0]).toMatchObject({
      code: 'EXTENSION_SEGMENT_UNSUPPORTED',
      typeName: 'no-segment',
    })

    expect(() => compileWithDiagnostics('throws-schema:x')).toThrow(/schema failed/)
  })

  it('clears extension registry and custom factories in resetRuntimeState', () => {
    registerExtensions([
      {
        literal: 'tenant-id',
        factoryName: 'tenantId',
        schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
      },
    ] as const)

    expect(s('tenant-id!').toSchema()).toMatchObject({ pattern: '^tenant_[a-z0-9]+$' })
    resetRuntimeState()

    expect((s as unknown as { tenantId?: unknown }).tenantId).toBeUndefined()
    const result = compileWithDiagnostics('tenant-id!')
    expect(result.diagnostics[0]).toMatchObject({
      code: 'UNKNOWN_TYPE',
      typeName: 'tenant-id',
    })
  })

  it('strips nested required markers from array item schemas, including tuple items', () => {
    const tupleItem = {
      type: 'array',
      items: [
        s.string().require().toSchema(),
        s.number().require().toSchema(),
      ],
    }

    const namespaceSchema = s.array(tupleItem).toSchema()
    const builderSchema = dsl('array').items(tupleItem).toSchema()
    const dslObjectItemSchema = dsl('array').items({
      code: 'string!',
      amount: 'number:1-999!',
    }).toSchema()

    for (const schema of [namespaceSchema, builderSchema]) {
      const nestedItems = ((schema.items as Record<string, unknown>).items as Array<Record<string, unknown>>)
      expect(nestedItems[0]._required).toBeUndefined()
      expect(nestedItems[1]._required).toBeUndefined()
    }
    expect(dslObjectItemSchema.items).toMatchObject({
      type: 'object',
      properties: {
        code: { type: 'string' },
        amount: { type: 'number', minimum: 1, maximum: 999 },
      },
      required: ['code', 'amount'],
    })
  })

  it('supports field require() without changing conditional require(field)', () => {
    expect(s.email().require().toSchema()).toMatchObject({ _required: true })
    expect(s.email().required().toSchema()).toMatchObject(s.email().require().toSchema())
    expect(() => (s.email().require as unknown as (field: string) => unknown)('field')).toThrow(/does not accept arguments/)

    const conditional = dsl.if((data) => Boolean((data as { active?: boolean }).active)).require('approvedAt')
    expect(conditional.check({ active: true, approvedAt: '2026-06-18' })).toBe(true)
    expect(conditional.toSchema()).toMatchObject({ _isConditional: true })
  })

  it('registers explicit custom factories on both s and dsl', () => {
    registerExtension({
      literal: 'tenant-id',
      factoryName: 'tenantId',
      schema: { type: 'string', pattern: '^tenant_[a-z0-9]+$' },
    })

    expect(s('tenant-id!').toSchema()).toMatchObject({
      type: 'string',
      pattern: '^tenant_[a-z0-9]+$',
      _required: true,
    })
    expect(s.type('tenant-id').require().toSchema()).toMatchObject(s('tenant-id!').toSchema())
    expect((s as unknown as { tenantId(): ReturnType<typeof s.string> }).tenantId().require().toSchema()).toMatchObject(s('tenant-id!').toSchema())
    expect((dsl as unknown as { tenantId(): ReturnType<typeof s.string> }).tenantId).toBe((s as unknown as { tenantId(): ReturnType<typeof s.string> }).tenantId)
  })

  it('normalizes extension definitions without registering them', () => {
    const extension = defineExtension({
      literal: 'tenant-id',
      factoryName: 'tenantId',
      transformMethods: ['tenantId'],
    })

    expect(extension).toMatchObject({
      literal: 'tenant-id',
      factoryName: 'tenantId',
      transformMethods: ['tenantId'],
    })
    expect((s as unknown as { tenantId?: unknown }).tenantId).toBeUndefined()
  })

  it('derives transform methods for explicit String-chain extension metadata', () => {
    expect(defineExtension({
      literal: 'tenant-id',
      factoryName: 'tenantId',
      exposeStringChain: true,
    }).transformMethods).toEqual(['tenantId'])

    expect(defineExtension({
      literal: 'tenant-id',
      exposeStringChain: true,
      transformMethods: ['tenantId'],
    }).transformMethods).toEqual(['tenantId'])

    expect(defineExtension({
      literal: 'tenant-id',
      exposeStringChain: true,
    }).transformMethods).toEqual(['tenantId'])

    expect(() => defineExtension({
      literal: 'tenant-id',
      factoryName: 'tenant-id',
    })).toThrow(/valid JavaScript identifier/)
  })

  it('rejects namespace factory name conflicts', () => {
    expect(() => registerExtension({
      literal: 'tenant-email',
      factoryName: 'email',
      schema: { type: 'string' },
    })).toThrow(/factory "email"/)

    expect(() => registerExtension({
      literal: 'tenant-config',
      factoryName: 'config',
      schema: { type: 'string' },
    })).toThrow(/reserved/)

    expect(() => registerExtension({
      literal: 'tenant-label',
      factoryName: 'label',
      schema: { type: 'string' },
    })).toThrow(/reserved/)

    expect(() => registerExtension({
      literal: 'tenant-require',
      factoryName: 'require',
      schema: { type: 'string' },
    })).toThrow(/reserved/)

    expect(() => registerExtension({
      literal: 'tenant-dashed',
      factoryName: 'tenant-id',
      schema: { type: 'string' },
    })).toThrow(/valid JavaScript identifier/)

    expect(() => registerExtension({
      literal: 'tenant-leading-number',
      factoryName: '123tenant',
      schema: { type: 'string' },
    })).toThrow(/valid JavaScript identifier/)

    expect(TypeRegistry.has('tenant-email')).toBe(false)
    expect(TypeRegistry.has('tenant-dashed')).toBe(false)
  })
})
