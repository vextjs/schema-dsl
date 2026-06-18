import { afterEach, describe, expect, it } from 'vitest'

import {
  defineExtension,
  dsl,
  registerExtension,
  resetRuntimeState,
  s,
  TypeRegistry,
} from '../../src/pure.js'

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

    expect(s.enum('admin', 'user', 'guest').toSchema()).toMatchObject({
      type: 'string',
      enum: ['admin', 'user', 'guest'],
    })
    expect(s.enum(['admin', 'user', 'guest']).toSchema()).toMatchObject(s.enum('admin', 'user', 'guest').toSchema())
    expect(s('admin|user|guest').toSchema()).toMatchObject(s.enum('admin', 'user', 'guest').toSchema())
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

    for (const schema of [namespaceSchema, builderSchema]) {
      const nestedItems = ((schema.items as Record<string, unknown>).items as Array<Record<string, unknown>>)
      expect(nestedItems[0]._required).toBeUndefined()
      expect(nestedItems[1]._required).toBeUndefined()
    }
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

    expect(() => defineExtension({
      literal: 'tenant-id',
      exposeStringChain: true,
    })).toThrow(/requires transformMethods or a valid factoryName/)

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
