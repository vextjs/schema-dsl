import { describe, expect, it } from 'vitest'
import { ConditionalBuilder, dsl, validate, validateAsync, Validator } from '../../../../src/index.js'
import { createRuntime } from '../../../../src/runtime.js'
import type { SchemaRuntimeMetadata } from '../../../../src/core/SchemaRuntimeMetadataStore.js'
import type { SchemaIRProjection } from '../../../../src/types/ir.js'
import type { JSONSchemaInput } from '../../../../src/types/schema.js'

type ValidatorIRInternals = {
  _getSchemaCacheKey(schema: object): string
  _getSchemaRuntimeMetadata(schema: JSONSchemaInput & object, cacheKey: string): SchemaRuntimeMetadata
  _getSchemaIRProjection(
    schema: (JSONSchemaInput & object) | null,
    metadata: SchemaRuntimeMetadata
  ): SchemaIRProjection | null
}

function readMetadata(validator: Validator, schema: JSONSchemaInput & object): SchemaRuntimeMetadata {
  const internals = validator as unknown as ValidatorIRInternals
  return internals._getSchemaRuntimeMetadata(schema, internals._getSchemaCacheKey(schema))
}

function createProjection(
  validator: Validator,
  schema: JSONSchemaInput & object,
  metadata: SchemaRuntimeMetadata
): SchemaIRProjection | null {
  return (validator as unknown as ValidatorIRInternals)._getSchemaIRProjection(schema, metadata)
}

describe('Validator IR projection orchestration', () => {
  it('stores a validation-safe IR projection after compiling a safe ValidationPlan', () => {
    const schema: JSONSchemaInput & object = {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
      },
    }
    const validator = new Validator()

    expect(validator.validate(schema, { name: 'Ada' }, { format: false }).valid).toBe(true)

    const metadata = readMetadata(validator, schema)
    expect(metadata.validationPlan).toBeTruthy()
    expect(metadata.validationPlanReason).toBeNull()
    expect(metadata.irProjection?.projections.validation).toMatchObject({
      safe: true,
      fallbackReasons: [],
    })
  })

  it('keeps FastPlan-unsupported schemas on AJV fallback with an unsafe projection', () => {
    const schema: JSONSchemaInput & object = {
      allOf: [
        { type: 'string' },
      ],
    }
    const validator = new Validator()

    expect(validator.validate(schema, 'ok', { format: false }).valid).toBe(true)
    expect(validator.validate(schema, 1, { format: false }).valid).toBe(false)

    const metadata = readMetadata(validator, schema)
    expect(metadata.validationPlan).toBeNull()
    expect(metadata.validationPlanReason).toBe('unsupported-keyword')
    expect(metadata.irProjection?.projections.validation?.safe).toBe(false)
    expect(metadata.irProjection?.projections.validation?.fallbackReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({
        reason: 'validation-plan-fallback',
        message: 'unsupported-keyword',
      }),
    ]))
  })

  it('preserves root, async and runtime public validation behavior', async () => {
    const schema: JSONSchemaInput = {
      allOf: [
        { type: 'string' },
      ],
    }
    const runtime = createRuntime()

    expect(validate(schema, 'ok', { format: false }).valid).toBe(true)
    await expect(validateAsync(schema, 'ok', { format: false })).resolves.toBe('ok')
    expect(runtime.validate(schema, 'ok', { format: false }).valid).toBe(true)

    runtime.dispose()
  })

  it('does not let safe projections bypass format, coercion or sync custom validators', () => {
    const validator = new Validator()

    expect(validator.validate({ type: 'string', format: 'email' }, 'ada@example.com', { format: false }).valid).toBe(true)
    expect(validator.validate({ type: 'string', format: 'email' }, 'not-email', { format: false }).valid).toBe(false)

    const numberSchema = dsl({ age: 'number!' })
    expect(validator.validate(numberSchema, { age: '42' }).valid).toBe(true)
    expect(validator.validate(numberSchema, { age: '42' }, { smartCoerce: false }).valid).toBe(false)

    const customSchema: JSONSchemaInput & object = {
      type: 'string',
      _customValidators: [() => 'custom rejected'],
    } as JSONSchemaInput & object
    expect(validator.validate(customSchema, 'ok').valid).toBe(false)
    expect(readMetadata(validator, customSchema).irProjection?.projections.validation?.safe).toBe(true)
  })

  it('keeps conditional validation lazy while allowing explicit projection creation', () => {
    const validator = new Validator()
    const schema: JSONSchemaInput & object = {
      type: 'object',
      properties: {
        score: ConditionalBuilder.start(() => true).then('number!').toSchema(),
      },
    }

    const result = validator.validate(schema, { score: 'bad' }, { format: false })

    expect(result.valid).toBe(false)
    expect(result.errors?.[0]?.keyword).toBe('type')
    const metadata = readMetadata(validator, schema)
    expect(metadata.hasConditionals).toBe(true)
    expect(metadata.validationPlan).toBeUndefined()
    expect(metadata.irProjection).toBeUndefined()

    const projection = createProjection(validator, schema, metadata)
    expect(projection?.projections.validation?.safe).toBe(false)
    expect(projection?.projections.conditional?.nodes.length).toBeGreaterThan(0)
  })

  it('records unsafe IR fallback metadata when validation plan cache is disabled', () => {
    const schema: JSONSchemaInput & object = {
      allOf: [
        { type: 'string' },
      ],
    }
    const validator = new Validator({ cache: false })

    expect(validator.validate(schema, 'ok', { format: false }).valid).toBe(true)
    expect(validator.validate(schema, 1, { format: false }).valid).toBe(false)

    const metadata = readMetadata(validator, schema)
    expect(metadata.validationPlan).toBeNull()
    expect(metadata.validationPlanReason).toBe('unsupported-keyword')
    expect(metadata.irProjection?.projections.validation?.safe).toBe(false)
  })
})
