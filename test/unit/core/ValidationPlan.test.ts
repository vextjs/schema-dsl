import { describe, expect, it } from 'vitest'
import {
  compileValidationPlan,
  executeValidationPlan,
} from '../../../src/core/ValidationPlan.js'
import { SchemaRuntimeMetadataStore } from '../../../src/core/SchemaRuntimeMetadataStore.js'
import type { SchemaRuntimeMetadata } from '../../../src/core/SchemaRuntimeMetadataStore.js'
import { dsl, resetRuntimeState, validate, Validator } from '../../../src/index.js'

function createMetadata(cacheKey: string): SchemaRuntimeMetadata {
  return {
    cacheKey,
    hasConditionals: false,
    hasDeclaredAsyncCustomValidators: false,
    hasAjvSkippedProperties: false,
    coerceCandidates: null,
  }
}

describe('ValidationPlan', () => {
  it('compiles primitive scalar schemas and returns valid only for definite matches', () => {
    const result = compileValidationPlan({ type: 'string' }, { cacheKey: 'schema:test' })

    expect(result.status).toBe('compiled')
    if (result.status !== 'compiled') throw new Error('expected compiled plan')

    expect(executeValidationPlan(result.plan, 'schema-dsl')).toEqual({
      status: 'valid',
      data: 'schema-dsl',
    })
    expect(executeValidationPlan(result.plan, 42)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
  })

  it('supports enum, primitive union, scalar constraints, and homogeneous arrays on the valid path', () => {
    const cases = [
      { schema: { enum: ['admin', 'user'] }, data: 'admin' },
      { schema: { anyOf: [{ type: 'string' }, { type: 'number' }] }, data: 42 },
      { schema: { type: 'string', minLength: 2, maxLength: 8, pattern: '^[a-z]+$' }, data: 'rocky' },
      { schema: { type: 'string', format: 'email' }, data: 'rocky@example.com' },
      { schema: { type: 'string', _customValidators: [(value: unknown) => value !== 'admin' || 'reserved'] }, data: 'alice' },
      { schema: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'number' } }, data: [1, 2, 3] },
      {
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            profile: {
              type: 'object',
              properties: { age: { type: 'number', minimum: 18 } },
              required: ['age'],
            },
          },
          required: ['name', 'profile'],
        },
        data: { name: 'rocky', profile: { age: 33 } },
      },
    ]

    for (const entry of cases) {
      const result = compileValidationPlan(entry.schema, { cacheKey: `schema:${JSON.stringify(entry.schema)}` })
      expect(result.status).toBe('compiled')
      if (result.status !== 'compiled') throw new Error('expected compiled plan')
      expect(executeValidationPlan(result.plan, entry.data)).toMatchObject({ status: 'valid' })
    }
  })

  it('validates required object properties and optional property constraints on the fast path', () => {
    const result = compileValidationPlan({
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', minimum: 18 },
      },
      required: ['name'],
    }, { cacheKey: 'schema:object-required-fast-path' })

    expect(result.status).toBe('compiled')
    if (result.status !== 'compiled') throw new Error('expected compiled plan')

    expect(executeValidationPlan(result.plan, { name: 'al' })).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(result.plan, { name: 'al', age: 20 })).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(result.plan, { age: 20 })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, { name: 'a' })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, { name: 'al', age: 17 })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
  })

  it('keeps deep single-path object plans semantically equivalent to nested validation', () => {
    const result = compileValidationPlan({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            profile: {
              type: 'object',
              properties: {
                age: { type: 'number', minimum: 18 },
              },
              required: ['age'],
            },
          },
          required: ['profile'],
        },
      },
      required: ['user'],
    }, { cacheKey: 'schema:deep-object-path-fast-path' })

    expect(result.status).toBe('compiled')
    if (result.status !== 'compiled') throw new Error('expected compiled plan')

    expect(executeValidationPlan(result.plan, { user: { profile: { age: 33 } } })).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(result.plan, { user: { profile: { age: 17 } } })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, { user: { profile: {} } })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, { user: null })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
  })

  it('falls back for defaults, AJV mutation options, custom formats, and unknown keywords', () => {
    expect(compileValidationPlan({ type: 'object', default: {} }, { cacheKey: 'schema:default' })).toEqual({
      status: 'unsupported',
      reason: 'contains-default',
    })
    expect(compileValidationPlan({ type: 'string' }, {
      cacheKey: 'schema:coerce',
      ajvOptions: { coerceTypes: true, removeAdditional: false },
    })).toEqual({
      status: 'unsupported',
      reason: 'validator-option',
    })
    expect(compileValidationPlan({ type: 'string', format: 'email' }, { cacheKey: 'schema:format' })).toEqual({
      status: 'compiled',
      plan: expect.any(Object),
    })
    expect(compileValidationPlan({ type: 'string', format: 'uuid' }, { cacheKey: 'schema:format' })).toEqual({
      status: 'unsupported',
      reason: 'unsupported-keyword',
    })
    expect(compileValidationPlan({ type: 'number', port: true }, { cacheKey: 'schema:custom' })).toEqual({
      status: 'unsupported',
      reason: 'unsupported-keyword',
    })
    expect(compileValidationPlan({ type: 'string', _customValidators: [async () => true] }, { cacheKey: 'schema:async-custom' })).toEqual({
      status: 'unsupported',
      reason: 'unsupported-schema',
    })
  })

  it('falls back when scalar custom validators reject, throw, or return Promise-like values', () => {
    const cases = [
      { schema: { type: 'string', _customValidators: [() => false] }, data: 'alice' },
      { schema: { type: 'string', _customValidators: [() => 'reserved'] }, data: 'alice' },
      { schema: { type: 'string', _customValidators: [() => ({ error: true })] }, data: 'alice' },
      { schema: { type: 'string', _customValidators: [() => { throw new Error('boom') }] }, data: 'alice' },
      { schema: { type: 'string', _customValidators: [() => Promise.resolve(true)] }, data: 'alice' },
    ]

    for (const entry of cases) {
      const result = compileValidationPlan(entry.schema, { cacheKey: `schema:${Math.random()}` })
      expect(result.status).toBe('compiled')
      if (result.status !== 'compiled') throw new Error('expected compiled plan')
      expect(executeValidationPlan(result.plan, entry.data)).toEqual({
        status: 'fallback',
        reason: 'data-mismatch',
      })
    }
  })

  it('does not run top-level sync custom validators twice when root fast path is enabled', () => {
    let calls = 0
    const result = validate({
      type: 'string',
      _customValidators: [
        () => {
          calls += 1
          return 'rejected'
        },
      ],
    }, 'alice')

    expect(result.valid).toBe(false)
    expect(result.errors?.[0]?.message).toBe('rejected')
    expect(calls).toBe(1)
  })

  it('caches validation plan state with schema runtime metadata and clears it', () => {
    const store = new SchemaRuntimeMetadataStore()
    const schema = { type: 'string' }

    const first = store.get(schema, 'schema:test', () => createMetadata('schema:test'))
    first.validationPlan = null
    first.validationPlanReason = 'phase-1-disabled'

    const cached = store.get(schema, 'schema:test', () => {
      throw new Error('metadata should be cached')
    })

    expect(cached.validationPlan).toBeNull()
    expect(cached.validationPlanReason).toBe('phase-1-disabled')

    store.clear()

    const next = store.get(schema, 'schema:test', () => createMetadata('schema:test'))
    expect(next).not.toBe(first)
    expect(next.validationPlan).toBeUndefined()
    expect(next.validationPlanReason).toBeUndefined()
  })

  it('uses Validator cache lifecycle for validation plans without changing invalid fallback behavior', () => {
    const validator = new Validator({ cache: { maxSize: 4 } })
    const internal = validator as unknown as { _validationPlanCache: Map<string, unknown> }
    const schema = { type: 'string', minLength: 3 }

    expect(validator.validate(schema, 'rocky').valid).toBe(true)
    expect(internal._validationPlanCache.size).toBe(1)

    const invalid = validator.validate(schema, 'no', { format: false })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors?.[0]?.keyword).toBe('minLength')

    validator.clearCache()
    expect(internal._validationPlanCache.size).toBe(0)
  })

  it('invalidates root fast cache when caller-owned raw JSON Schema nested constraints mutate', () => {
    resetRuntimeState()

    try {
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number', minimum: 18 },
        },
        required: ['age'],
      }

      expect(validate(schema, { age: 19 }, { format: false }).valid).toBe(true)

      schema.properties.age.minimum = 21

      const result = validate(schema, { age: 19 }, { format: false })
      expect(result.valid).toBe(false)
      expect(result.errors?.[0]?.keyword).toBe('minimum')
    } finally {
      resetRuntimeState()
    }
  })

  it('invalidates root primitive union direct fast path when caller-owned branch types mutate', () => {
    resetRuntimeState()

    try {
      const schema = {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
        ],
      }

      expect(validate(schema, 'hello', { format: false }).valid).toBe(true)

      schema.anyOf[0]!.type = 'boolean'

      expect(validate(schema, 'hello', { format: false }).valid).toBe(false)
      expect(validate(schema, true, { format: false }).valid).toBe(true)
    } finally {
      resetRuntimeState()
    }
  })

  it('falls back for overlapping oneOf primitive unions instead of accepting ambiguous matches', () => {
    const result = validate({
      oneOf: [
        { type: 'number' },
        { type: 'integer' },
      ],
    }, 42, { format: false })

    expect(result.valid).toBe(false)
    expect(result.errors?.[0]?.keyword).toBe('oneOf')
  })

  it('falls back for constrained primitive unions and preserves error details', () => {
    const result = validate({
      anyOf: [
        { type: 'string', minLength: 3 },
        { type: 'number' },
      ],
    }, 'no', { format: false })

    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(0)
  })

  it('invalidates DslBuilder simple enum direct predicate when enum values mutate', () => {
    resetRuntimeState()

    try {
      const builder = dsl('enum:admin,user')

      expect(validate(builder, 'admin', { format: false }).valid).toBe(true)

      builder.enum('guest')

      expect(validate(builder, 'admin', { format: false }).valid).toBe(false)
      expect(validate(builder, 'guest', { format: false }).valid).toBe(true)
    } finally {
      resetRuntimeState()
    }
  })

  it('does not strip nested conditionals from caller-owned schemas after fast-cache probing', () => {
    resetRuntimeState()

    try {
      const schema = dsl({
        user: {
          age: 'number!',
          role: dsl.if((data: any) => data.user?.age < 18).message('underage user cannot be an admin'),
        },
      }) as any

      expect(validate(schema, { user: { age: 20, role: 'admin' } }, { format: false }).valid).toBe(true)
      expect(schema.properties.user.properties.role?._isConditional).toBe(true)

      const result = validate(schema, { user: { age: 16, role: 'admin' } }, { format: false })
      expect(result.valid).toBe(false)
      expect(result.errors?.[0]?.message).toBe('underage user cannot be an admin')
    } finally {
      resetRuntimeState()
    }
  })
})
