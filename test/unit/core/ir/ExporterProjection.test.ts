import { describe, expect, it } from 'vitest'
import { createExporterLossProjection } from '../../../../src/core/ir/ExporterProjection.js'
import type { JSONSchema } from '../../../../src/types/schema.js'

describe('ExporterProjection', () => {
  it('creates IR and exporter loss metadata with public report-compatible paths', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          format: 'email',
          if: { const: 'admin' },
          then: { minLength: 5 },
        },
        meta: {
          type: 'object',
          patternProperties: {
            '^x_': { type: 'string', pattern: '^ok$' },
          },
        },
        list: {
          type: 'array',
          contains: { const: 'needle' },
          prefixItems: [
            { type: 'string', pattern: '^first$' },
          ],
        },
      },
      dependencies: {
        legacyFlag: ['legacyValue'],
      },
      dependentSchemas: {
        enabled: {
          properties: {
            marker: { type: 'string', const: 'on' },
          },
        },
      },
      allOf: [
        { not: { required: ['blocked'] } },
      ],
    }

    const projection = createExporterLossProjection(schema, 'mysql', [
      'allOf',
      'if',
      'then',
      'not',
      'const',
      'format',
      'pattern',
      'minLength',
      'patternProperties',
      'contains',
      'prefixItems',
      'dependentSchemas',
      'dependencies',
    ])
    const lossKeys = projection.lossMetadata.map(loss => `${loss.target}:${loss.path}:${loss.keyword}`)

    expect(projection.ir.kind).toBe('schema-ir')
    expect(projection.projection.projections.exporter?.lossMetadata).toBe(projection.lossMetadata)
    expect(lossKeys).toEqual(expect.arrayContaining([
      'mysql:$:allOf',
      'mysql:$:dependencies',
      'mysql:$:dependentSchemas',
      'mysql:$.properties.name:format',
      'mysql:$.properties.name:if',
      'mysql:$.properties.name:then',
      'mysql:$.properties.name.if:const',
      'mysql:$.properties.name.then:minLength',
      'mysql:$.properties.meta:patternProperties',
      'mysql:$.properties.meta.patternProperties.^x_:pattern',
      'mysql:$.properties.list:contains',
      'mysql:$.properties.list:prefixItems',
      'mysql:$.properties.list.contains:const',
      'mysql:$.properties.list.prefixItems[0]:pattern',
      'mysql:$.dependentSchemas.enabled.properties.marker:const',
      'mysql:$.allOf[0]:not',
    ]))
    expect(projection.lossMetadata.every(loss => loss.status === 'unsupported')).toBe(true)
  })

  it('keeps target-specific unsupported keyword decisions', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2 },
        age: { type: 'number', minimum: 18, maximum: 99 },
        email: { type: 'string', format: 'email' },
      },
    }

    const mysql = createExporterLossProjection(schema, 'mysql', ['minimum', 'maximum', 'minLength', 'format'])
    const postgresql = createExporterLossProjection(schema, 'postgresql', ['format'])

    expect(mysql.lossMetadata.map(loss => `${loss.path}:${loss.keyword}`)).toEqual(expect.arrayContaining([
      '$.properties.name:minLength',
      '$.properties.age:minimum',
      '$.properties.age:maximum',
      '$.properties.email:format',
    ]))
    expect(postgresql.lossMetadata.map(loss => `${loss.path}:${loss.keyword}`)).toEqual([
      '$.properties.email:format',
    ])
  })

  it('resolves local refs and avoids circular traversal loops', () => {
    const schema = {
      type: 'object',
      properties: {
        dynamic: { $ref: '#/$defs/Dynamic' },
        name: { type: 'string', pattern: '^x-' },
      },
      $defs: {
        Dynamic: {
          type: 'string',
          const: 'x-ray',
          pattern: '^x-',
        },
      },
    } as JSONSchema & { properties: Record<string, unknown> }
    schema.properties['self'] = schema

    const projection = createExporterLossProjection(schema, 'mongodb', ['$ref', '$defs', 'const', 'pattern'])
    const lossKeys = projection.lossMetadata.map(loss => `${loss.path}:${loss.keyword}`)

    expect(projection.ir.graph.cycles.length).toBeGreaterThan(0)
    expect(lossKeys).toEqual(expect.arrayContaining([
      '$:$defs',
      '$.properties.dynamic:$ref',
      '$.properties.dynamic.$ref(#/$defs/Dynamic):const',
      '$.properties.dynamic.$ref(#/$defs/Dynamic):pattern',
      '$.properties.name:pattern',
      '$.$defs.Dynamic:const',
      '$.$defs.Dynamic:pattern',
    ]))
  })
})
