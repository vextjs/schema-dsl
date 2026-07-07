import { describe, expect, it } from 'vitest'
import {
  compileValidationPlan,
  executeValidationPlan,
} from '../../../src/core/ValidationPlan.js'
import {
  applySmartCoerce,
  getSchemaCoerceCandidates,
  SchemaRuntimeMetadataStore,
} from '../../../src/core/SchemaRuntimeMetadataStore.js'
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
  it('compiles boolean true schemas and rejects non-object or false schemas explicitly', () => {
    const always = compileValidationPlan(true, { cacheKey: 'schema:boolean-true' })

    expect(always.status).toBe('compiled')
    if (always.status !== 'compiled') throw new Error('expected compiled plan')
    expect(executeValidationPlan(always.plan, { anything: ['goes'] })).toEqual({
      status: 'valid',
      data: { anything: ['goes'] },
    })

    expect(compileValidationPlan(false, { cacheKey: 'schema:boolean-false' })).toEqual({
      status: 'unsupported',
      reason: 'unsupported-schema',
    })
    expect(compileValidationPlan(null, { cacheKey: 'schema:null' })).toEqual({
      status: 'unsupported',
      reason: 'non-object-schema',
    })
    expect(compileValidationPlan(['string'], { cacheKey: 'schema:array-input' })).toEqual({
      status: 'unsupported',
      reason: 'non-object-schema',
    })
  })

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

  it('rejects unsupported fast-plan shapes with stable reasons', () => {
    const circular: any = { type: 'object', properties: {} }
    circular.properties.self = circular

    const cases = [
      { schema: { anyOf: [], title: 'empty union' }, reason: 'unsupported-schema' },
      { schema: { anyOf: [{ type: 'string' }], unknown: true }, reason: 'unsupported-keyword' },
      { schema: { type: 'array', minItems: '1' }, reason: 'unsupported-schema' },
      { schema: { type: 'array', items: [{ type: 'string' }] }, reason: 'unsupported-schema' },
      { schema: { type: 'object', required: ['name', 42] }, reason: 'unsupported-schema' },
      { schema: { type: 'object', properties: [] }, reason: 'unsupported-schema' },
      { schema: { enum: [{ value: 'not-scalar' }] }, reason: 'unsupported-enum' },
      { schema: { const: { value: 'not-scalar' } }, reason: 'unsupported-enum' },
      { schema: { type: 'string', minLength: '1' }, reason: 'unsupported-schema' },
      { schema: { type: 'number', exclusiveMinimum: true }, reason: 'unsupported-schema' },
      { schema: { type: 'string', pattern: 42 }, reason: 'unsupported-schema' },
      { schema: { type: 'string', pattern: '[' }, reason: 'invalid-pattern' },
      { schema: { type: 'string', _customValidators: 'not-array' }, reason: 'unsupported-schema' },
      { schema: circular, reason: 'unsupported-schema' },
    ] as const

    for (const entry of cases) {
      expect(compileValidationPlan(entry.schema as any, {
        cacheKey: `schema:unsupported:${entry.reason}`,
      })).toEqual({
        status: 'unsupported',
        reason: entry.reason,
      })
    }
  })

  it('keeps nested defaults out of fast plans before AJV mutation can run', () => {
    expect(compileValidationPlan({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'anonymous' },
          },
        },
      },
    }, { cacheKey: 'schema:nested-default' })).toEqual({
      status: 'unsupported',
      reason: 'contains-default',
    })
  })

  it('validates enum fast paths for every specialized enum size', () => {
    const cases = [
      { values: [], valid: 'none', invalid: 'none' },
      { values: ['one'], valid: 'one', invalid: 'two' },
      { values: ['one', 'two', 'three', 'four'], valid: 'four', invalid: 'five' },
      { values: ['one', 'two', 'three', 'four', 'five'], valid: 'five', invalid: 'six' },
    ]

    for (const entry of cases) {
      const result = compileValidationPlan({ enum: entry.values }, {
        cacheKey: `schema:enum:${entry.values.length}`,
      })

      expect(result.status).toBe('compiled')
      if (result.status !== 'compiled') throw new Error('expected compiled plan')

      expect(executeValidationPlan(result.plan, entry.valid).status).toBe(entry.values.length === 0 ? 'fallback' : 'valid')
      expect(executeValidationPlan(result.plan, entry.invalid)).toEqual({
        status: 'fallback',
        reason: 'data-mismatch',
      })
    }
  })

  it('validates scalar edge cases before taking the fast valid path', () => {
    const number = compileValidationPlan({
      type: ['integer', 'null'],
      minimum: 1,
      maximum: 5,
      exclusiveMinimum: 1,
      exclusiveMaximum: 5,
    }, { cacheKey: 'schema:scalar-number-edges' })
    const string = compileValidationPlan({
      type: 'string',
      const: 'rocky@example.com',
      format: 'email',
    }, { cacheKey: 'schema:scalar-string-edges' })
    const ignoredCustomValidator = compileValidationPlan({
      type: 'string',
      _customValidators: [() => 'would fail in sync mode'],
    }, {
      cacheKey: 'schema:ignored-custom-validator',
      customValidators: 'ignore',
    })

    expect(number.status).toBe('compiled')
    expect(string.status).toBe('compiled')
    expect(ignoredCustomValidator.status).toBe('compiled')
    if (number.status !== 'compiled' || string.status !== 'compiled' || ignoredCustomValidator.status !== 'compiled') {
      throw new Error('expected compiled plan')
    }

    expect(executeValidationPlan(number.plan, 3)).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(number.plan, null)).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(number.plan, Number.POSITIVE_INFINITY)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(number.plan, 1)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(number.plan, 5)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })

    expect(executeValidationPlan(string.plan, 'rocky@example.com')).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(string.plan, 'alice@example.com')).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(string.plan, 'not-an-email')).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(ignoredCustomValidator.plan, 'alice')).toMatchObject({ status: 'valid' })
  })

  it('uses union validators for constrained branches and preserves anyOf or oneOf semantics', () => {
    const anyOf = compileValidationPlan({
      anyOf: [
        { type: 'string', minLength: 3 },
        { type: 'number', minimum: 10 },
      ],
    }, { cacheKey: 'schema:constrained-anyof' })
    const oneOf = compileValidationPlan({
      oneOf: [
        { type: 'number', minimum: 1 },
        { type: 'number', maximum: 10 },
      ],
    }, { cacheKey: 'schema:constrained-oneof' })

    expect(anyOf.status).toBe('compiled')
    expect(oneOf.status).toBe('compiled')
    if (anyOf.status !== 'compiled' || oneOf.status !== 'compiled') throw new Error('expected compiled plan')

    expect(executeValidationPlan(anyOf.plan, 'abc')).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(anyOf.plan, 11)).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(anyOf.plan, false)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(oneOf.plan, 0)).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(oneOf.plan, 11)).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(oneOf.plan, 5)).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
  })

  it('keeps required-only properties and optional property validators in the object fast path', () => {
    const result = compileValidationPlan({
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      required: ['id'],
    }, { cacheKey: 'schema:required-only-object' })

    expect(result.status).toBe('compiled')
    if (result.status !== 'compiled') throw new Error('expected compiled plan')

    expect(executeValidationPlan(result.plan, { id: 1, name: 'rocky' })).toMatchObject({ status: 'valid' })
    expect(executeValidationPlan(result.plan, { id: 1, name: 42 })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, { name: 'rocky' })).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
    })
    expect(executeValidationPlan(result.plan, ['not-object'])).toEqual({
      status: 'fallback',
      reason: 'data-mismatch',
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

    const replaced = store.get(schema, 'schema:test:changed', () => createMetadata('schema:test:changed'))
    expect(replaced).not.toBe(next)
    expect(replaced.cacheKey).toBe('schema:test:changed')
  })

  it('discovers and applies schema smart coercion candidates without mutating unchanged inputs', () => {
    const schema = {
      type: 'object',
      properties: {
        count: { type: 'number' },
        enabled: { type: 'boolean' },
        tags: { type: 'array', items: { type: 'integer' } },
        flags: { type: 'array', items: { type: 'boolean' } },
        profile: {
          type: 'object',
          properties: {
            age: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
          },
        },
        ratio: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        enumNumber: { type: 'number', enum: [1, null] },
        enumStringConflict: { type: 'number', enum: ['1'] },
        mixedUnion: { anyOf: [{ type: 'number' }, { type: 'boolean' }] },
        invalidUnionBranch: { anyOf: [null, { type: 'number' }] },
      },
    }

    const candidates = getSchemaCoerceCandidates(schema as any)

    expect(candidates).toEqual({
      numbers: ['count', 'ratio', 'enumNumber'],
      booleans: ['enabled'],
      arrays: [
        { key: 'tags', itemType: 'integer' },
        { key: 'flags', itemType: 'boolean' },
      ],
      objects: [
        {
          key: 'profile',
          candidates: {
            numbers: ['age'],
            booleans: [],
            arrays: [],
            objects: [],
          },
        },
      ],
    })

    const input = {
      count: ' 42 ',
      enabled: 'TRUE',
      tags: ['1', 'x', 2],
      flags: ['false', 'no'],
      profile: { age: '7' },
      ratio: '3.5',
      enumNumber: '1',
      untouched: 'same',
    }
    const converted = applySmartCoerce(input, candidates)

    expect(converted).toEqual({
      count: 42,
      enabled: true,
      tags: [1, 'x', 2],
      flags: [false, 'no'],
      profile: { age: 7 },
      ratio: 3.5,
      enumNumber: 1,
      untouched: 'same',
    })
    expect(input.count).toBe(' 42 ')

    const emptyCandidates = getSchemaCoerceCandidates({
      type: 'object',
      properties: { name: { type: 'string' } },
    } as any)
    expect(emptyCandidates).toBeNull()
    expect(getSchemaCoerceCandidates(true)).toBeNull()
    expect(applySmartCoerce(input, null)).toBe(input)
    expect(applySmartCoerce(['1'], candidates)).toEqual(['1'])
  })

  it('uses a single-number smart coercion shortcut only when conversion is needed', () => {
    const candidates = getSchemaCoerceCandidates({
      type: 'object',
      properties: {
        count: { type: 'number' },
      },
    } as any)
    const unchanged = { count: 12 }
    const converted = { count: '12' }

    expect(applySmartCoerce(unchanged, candidates)).toBe(unchanged)
    expect(applySmartCoerce(converted, candidates)).toEqual({ count: 12 })
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
