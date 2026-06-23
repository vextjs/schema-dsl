import { describe, expect, it, vi } from 'vitest'
import { ConditionalValidator, type ConditionalInternalSchema } from '../../../src/core/ConditionalValidator.js'
import { CONDITIONAL_RUNTIME_STATE } from '../../../src/core/ConditionalRuntime.js'
import type { JSONSchema } from '../../../src/types/schema.js'
import type { ValidateOptions, ValidationErrorItem, ValidationResult } from '../../../src/types/validate.js'

const issue = (path: string, message: string, keyword = 'conditional'): ValidationErrorItem => ({
  path,
  message,
  keyword,
  params: {},
})

function createValidator(overrides: Partial<ConstructorParameters<typeof ConditionalValidator>[0]> = {}) {
  const validateSchema = vi.fn((schema: JSONSchema, data: unknown): ValidationResult<unknown> => {
    if (schema.type === 'number' && typeof data !== 'number') {
      return { valid: false, data, errors: [issue('value', 'must be number', 'type')], errorMessage: 'must be number' }
    }
    if (schema.type === 'string' && typeof data !== 'string') {
      return { valid: false, data, errors: [issue('value', 'must be string', 'type')], errorMessage: 'must be string' }
    }
    return { valid: true, data, errors: [] }
  })
  const internalError = vi.fn((error: unknown, data: unknown): ValidationResult<unknown> => ({
    valid: false,
    data,
    errors: [issue('', error instanceof Error ? error.message : String(error), 'internal')],
    errorMessage: error instanceof Error ? error.message : String(error),
  }))
  const getMessageText = vi.fn((key: string, params: Record<string, unknown>) => {
    const label = params['label'] ? `${String(params['label'])} ` : ''
    return `${label}${key}`
  })

  const hooks = {
    validateSchema,
    internalError,
    getMessageText,
    parseString: vi.fn((dsl: string) => ({ type: dsl.replace(/[!?].*$/, '') } as JSONSchema)),
    parseObject: vi.fn((dsl: Record<string, unknown>) => ({
      type: 'object',
      properties: Object.fromEntries(Object.keys(dsl).map(key => [key, { type: 'string' }])),
    } as JSONSchema)),
    ...overrides,
  }

  return { validator: new ConditionalValidator(hooks), hooks }
}

describe('ConditionalValidator', () => {
  it('detects conditional schemas recursively', () => {
    const { validator } = createValidator()

    expect(validator.hasAnyConditional({ properties: {} })).toBe(false)
    expect(validator.hasAnyConditional({
      properties: {
        profile: {
          type: 'object',
          properties: {
            code: { _isConditional: true },
          },
        },
      },
    } as ConditionalInternalSchema)).toBe(true)
    expect(validator.hasAnyConditional({
      type: 'array',
      items: { _isConditional: true },
    } as ConditionalInternalSchema)).toBe(true)
    expect(validator.hasAnyConditional({
      allOf: [{ properties: { code: { _isConditional: true } } }],
    } as ConditionalInternalSchema)).toBe(true)
  })

  it('aggregates base, field and nested conditional errors with normalized paths', () => {
    const baseError = issue('name', 'name invalid', 'type')
    const { validator, hooks } = createValidator({
      validateSchema: vi.fn((schema: JSONSchema, data: unknown): ValidationResult<unknown> => {
        if ((schema as any).properties?.name) {
          return { valid: false, data, errors: [baseError], errorMessage: baseError.message }
        }
        if (schema.type === 'number' && typeof data !== 'number') {
          return { valid: false, data, errors: [issue('value', 'must be number', 'type')], errorMessage: 'must be number' }
        }
        return { valid: true, data, errors: [] }
      }),
    })
    const schema: ConditionalInternalSchema = {
      type: 'object',
      required: ['name', 'score'],
      properties: {
        name: { type: 'string' },
        score: {
          _isConditional: true,
          conditions: [{ then: { type: 'number' } }],
          _evaluateCondition: () => ({ result: true }),
        },
        profile: {
          type: 'object',
          properties: {
            code: {
              _isConditional: true,
              conditions: [{ then: { type: 'number' } }],
              _evaluateCondition: () => ({ result: true }),
            },
          },
        },
      },
    }

    const result = validator.validateWithConditionals(schema, {
      name: 123,
      score: 'bad',
      profile: { code: 'bad' },
    }, {})

    expect(result.valid).toBe(false)
    expect(result.errors?.map(error => error.path)).toEqual(['name', 'score', 'profile/code'])
    expect(hooks.validateSchema).toHaveBeenCalled()
  })

  it('validates missing nested conditional objects through a partial schema', () => {
    const nestedMissing = issue('/profile', 'profile required', 'required')
    const { validator } = createValidator({
      validateSchema: vi.fn((schema: JSONSchema, data: unknown): ValidationResult<unknown> => {
        if ((schema as any).properties?.profile) {
          return { valid: false, data, errors: [nestedMissing], errorMessage: nestedMissing.message }
        }
        return { valid: true, data, errors: [] }
      }),
    })
    const schema: ConditionalInternalSchema = {
      type: 'object',
      required: ['profile'],
      properties: {
        profile: {
          type: 'object',
          properties: {
            code: { _isConditional: true },
          },
        },
      },
    }

    const result = validator.validateWithConditionals(schema, {}, {})

    expect(result.valid).toBe(false)
    expect(result.errors).toEqual([nestedMissing])
  })

  it('runs conditional schemas in array items and composite branches', () => {
    const { validator } = createValidator()
    const conditionalNumber: ConditionalInternalSchema = {
      _isConditional: true,
      conditions: [{ then: { type: 'number' } }],
      _evaluateCondition: () => ({ result: true }),
    }

    const arrayResult = validator.validateWithConditionals({
      type: 'array',
      items: conditionalNumber,
    } as ConditionalInternalSchema, ['bad'], {})

    const compositeResult = validator.validateWithConditionals({
      type: 'object',
      allOf: [{
        properties: {
          score: conditionalNumber,
        },
      }],
    } as ConditionalInternalSchema, { score: 'bad' }, {})

    expect(arrayResult.valid).toBe(false)
    expect(arrayResult.errors?.[0]?.path).toBe('0')
    expect(compositeResult.valid).toBe(false)
    expect(compositeResult.errors?.[0]?.path).toBe('score')
  })

  it('reports serialized runtime-only conditional schemas explicitly', () => {
    const { validator } = createValidator()

    const result = validator.validateConditional({
      _runtimeOnlyConditional: true,
      conditions: [],
    }, {}, null, 'value', {})

    expect(result.valid).toBe(false)
    expect(result.errors?.[0].message).toContain('runtime-only')
  })

  it('handles throw, requirement-failed, null else and internal error branches', () => {
    const { validator, hooks } = createValidator()

    expect(validator.validateConditional({
      conditions: [{ action: 'throw', message: 'blocked', type: 'flag' }],
      _evaluateCondition: () => ({ result: true, failedMessage: 'blocked-now' }),
    }, {}, null, 'value', {}).errorMessage).toBe('blocked-now')

    expect(validator.validateConditional({
      conditions: [{ message: 'required when enabled' }],
      _evaluateCondition: () => ({ result: false, requirementFailed: true }),
    }, {}, null, 'value', {}).errorMessage).toBe('required when enabled')

    expect(validator.validateConditional({
      conditions: [{ then: { type: 'number' } }],
      _evaluateCondition: () => ({ result: false }),
      else: null,
    }, {}, null, 'value', {}).valid).toBe(true)

    const internal = validator.validateConditional({
      conditions: [{ then: { type: 'number' } }],
      _evaluateCondition: () => {
        throw new Error('condition error')
      },
    }, {}, null, 'value', {})
    expect(internal.valid).toBe(false)
    expect(hooks.internalError).toHaveBeenCalled()
  })

  it('executes string, builder, nested conditional and object-definition then branches', () => {
    const { validator, hooks } = createValidator()
    const builder = { toSchema: () => ({ type: 'number' }) }
    const nested: ConditionalInternalSchema = {
      _isConditional: true,
      conditions: [{ then: { type: 'string' } }],
      _evaluateCondition: () => ({ result: true }),
    }

    expect(validator.validateConditional({
      conditions: [{ then: 'number!' }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, null, 1, {}).valid).toBe(true)
    expect(hooks.parseString).toHaveBeenCalledWith('number!', undefined)

    expect(validator.validateConditional({
      conditions: [{ then: builder }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, null, 1, {}).valid).toBe(true)

    expect(validator.validateConditional({
      conditions: [{ then: nested }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, null, 'ok', {}).valid).toBe(true)

    expect(validator.validateConditional({
      conditions: [{ then: { name: 'string' } }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, null, { name: 'Ada' }, {}).valid).toBe(true)
    expect(hooks.parseObject).toHaveBeenCalledWith({ name: 'string' }, undefined)
  })

  it('does not parse JSON Schema metadata then branches as DSL objects', () => {
    const { validator, hooks } = createValidator()

    const result = validator.validateConditional({
      conditions: [{ then: { type: 'object', title: 'Plain object schema' } }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, null, {}, {})

    expect(result.valid).toBe(true)
    expect(hooks.parseObject).not.toHaveBeenCalled()
  })

  it('allows optional empty values and formats required missing messages', () => {
    const { validator } = createValidator()
    const optional = validator.validateConditional({
      conditions: [{ then: { type: 'string' } }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, 'nickname', '', {})
    const required = validator.validateConditional({
      conditions: [{
        then: {
          type: 'string',
          _required: true,
          _label: 'Email',
          _customMessages: { required: 'custom required' },
        },
      }],
      _evaluateCondition: () => ({ result: true }),
    }, {}, 'email', undefined, { messages: { required: 'default required' } } as ValidateOptions)

    expect(optional.valid).toBe(true)
    expect(required.valid).toBe(false)
    expect(required.errorMessage).toBe('Email custom required')
  })

  it('uses attached runtime state before serializable condition fields', () => {
    const { validator } = createValidator()
    const schema = {
      conditions: [{ then: { type: 'number' } }],
      _evaluateCondition: () => ({ result: false }),
      [CONDITIONAL_RUNTIME_STATE]: {
        conditions: [{ then: { type: 'string' } }],
        elseSchema: { type: 'number' },
        evaluateCondition: () => ({ result: true }),
      },
    } as ConditionalInternalSchema

    expect(validator.validateConditional(schema, {}, null, 'ok', {}).valid).toBe(true)
  })
})
