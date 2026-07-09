import { describe, expect, it } from 'vitest'
import { createJsonSchemaIR } from '../../../../src/core/ir/JsonSchemaToIR.js'
import {
  createExecutionPlanProjection,
  createRuntimeMetadataAnnotations,
} from '../../../../src/core/ir/RuntimeMetadataToIR.js'
import type { SchemaRuntimeMetadata } from '../../../../src/core/SchemaRuntimeMetadataStore.js'

describe('RuntimeMetadataToIR', () => {
  it('turns runtime metadata into IR annotations', () => {
    const metadata: SchemaRuntimeMetadata = {
      cacheKey: 'schema:test',
      hasConditionals: true,
      hasDeclaredAsyncCustomValidators: true,
      hasAjvSkippedProperties: false,
      coerceCandidates: {
        numbers: ['age'],
        booleans: ['enabled'],
        arrays: [{ key: 'scores', itemType: 'number' }],
        objects: [{ key: 'profile', candidates: { numbers: ['level'], booleans: [], arrays: [], objects: [] } }],
      },
      validationPlanReason: 'contains-default',
    }

    const annotations = createRuntimeMetadataAnnotations(metadata, '/user')

    expect(annotations).toEqual([
      expect.objectContaining({ kind: 'runtime-metadata', path: '/user' }),
      expect.objectContaining({
        kind: 'coerce',
        data: expect.objectContaining({
          numbers: ['age'],
          booleans: ['enabled'],
          arrays: ['scores'],
          objects: ['profile'],
        }),
      }),
      expect.objectContaining({
        kind: 'validation-plan',
        data: { compiled: false, reason: 'contains-default' },
      }),
    ])
  })

  it('creates an execution projection without taking over runtime validation', () => {
    const ir = createJsonSchemaIR({
      type: 'object',
      properties: {
        age: { type: 'number' },
      },
    })
    const projection = createExecutionPlanProjection(ir)

    expect(projection.kind).toBe('ir-execution-plan')
    expect(projection.sourceIrVersion).toBe(1)
    expect(projection.projections.validation).toMatchObject({ safe: true, fallbackReasons: [] })
    expect(projection.projections.typeInference?.runtimeOnly).toEqual(expect.arrayContaining([
      'custom-validator',
      'conditional',
      'async-validator',
    ]))
  })
})
