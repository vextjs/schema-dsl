import { describe, expect, it } from 'vitest'
import { compileValidationPlan } from '../../../../src/core/ValidationPlan.js'
import { createJsonSchemaIR } from '../../../../src/core/ir/JsonSchemaToIR.js'
import { createExecutionPlanProjection } from '../../../../src/core/ir/RuntimeMetadataToIR.js'

describe('ValidationPlan projection contract', () => {
  it('keeps safe scalar, enum, union, array and object schemas aligned with ValidationPlan', () => {
    const cases = [
      { type: 'string', minLength: 2 },
      { enum: ['admin', 'user'] },
      { anyOf: [{ type: 'string' }, { type: 'number' }] },
      { type: 'array', items: { type: 'number' } },
      {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      },
    ]

    for (const schema of cases) {
      const plan = compileValidationPlan(schema, { cacheKey: JSON.stringify(schema) })
      const ir = createJsonSchemaIR(schema)
      const projection = createExecutionPlanProjection(ir, {
        cacheKey: JSON.stringify(schema),
        hasConditionals: false,
        hasDeclaredAsyncCustomValidators: false,
        hasAjvSkippedProperties: false,
        coerceCandidates: null,
        validationPlan: plan.status === 'compiled' ? plan.plan : null,
        validationPlanReason: plan.status === 'unsupported' ? plan.reason : null,
      })

      expect(plan.status).toBe('compiled')
      expect(projection.projections.validation?.safe).toBe(true)
    }
  })

  it('records validation-plan fallback reasons instead of expanding FastPlan as a second truth source', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'anonymous' },
      },
    }
    const plan = compileValidationPlan(schema, { cacheKey: 'schema:default' })
    const ir = createJsonSchemaIR(schema)
    const projection = createExecutionPlanProjection(ir, {
      cacheKey: 'schema:default',
      hasConditionals: false,
      hasDeclaredAsyncCustomValidators: false,
      hasAjvSkippedProperties: false,
      coerceCandidates: null,
      validationPlan: null,
      validationPlanReason: plan.status === 'unsupported' ? plan.reason : null,
    })

    expect(plan).toEqual({ status: 'unsupported', reason: 'contains-default' })
    expect(projection.projections.validation?.safe).toBe(false)
    expect(projection.projections.validation?.fallbackReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: 'validation-plan-fallback',
        message: 'contains-default',
      }),
    ]))
  })

  it('does not mark IR-only but FastPlan-unsupported shapes as validation safe', () => {
    const unsupportedSchemas = [
      false,
      { allOf: [{ type: 'string' }] },
      { not: { type: 'string' } },
      { type: 'array', items: [{ type: 'string' }] },
      { type: 'array', prefixItems: [{ type: 'number' }] },
      { type: 'array', contains: { type: 'number' } },
      { type: 'object', patternProperties: { '^x_': { type: 'string' } } },
      { $ref: '#/$defs/Value', $defs: { Value: { type: 'string' } } },
    ]

    for (const schema of unsupportedSchemas) {
      const plan = compileValidationPlan(schema, { cacheKey: JSON.stringify(schema) })
      const projection = createExecutionPlanProjection(createJsonSchemaIR(schema))

      expect(plan.status).toBe('unsupported')
      expect(projection.projections.validation?.safe).toBe(false)
    }
  })
})
