import { describe, expect, it } from 'vitest'
import { PostgreSQLExporter } from '../../../../src/exporters/index.js'
import { createJsonSchemaIR } from '../../../../src/core/ir/JsonSchemaToIR.js'
import type { IRLossMetadata } from '../../../../src/types/ir.js'
import { validate, validateAsync, Validator } from '../../../../src/index.js'

describe('IR golden parity fixtures', () => {
  it('expresses public validation fixtures without changing public validation behavior', async () => {
    const fixtures = [
      { schema: { type: 'string', minLength: 2 }, validData: 'ok', invalidData: 'x' },
      { schema: { type: 'array', items: { type: 'number' } }, validData: [1, 2], invalidData: [1, 'x'] },
      {
        schema: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        },
        validData: { name: 'Ada' },
        invalidData: {},
      },
    ]

    for (const fixture of fixtures) {
      const ir = createJsonSchemaIR(fixture.schema)
      expect(ir.graph.nodes[ir.root]?.kind).not.toBe('fallback')
      expect(validate(fixture.schema, fixture.validData, { format: false }).valid).toBe(true)
      expect(validate(fixture.schema, fixture.invalidData, { format: false }).valid).toBe(false)
      expect(new Validator().validate(fixture.schema, fixture.validData, { format: false }).valid).toBe(true)
    }

    await expect(validateAsync({ type: 'string' }, 'ok', { format: false })).resolves.toBe('ok')
  })

  it('keeps exporter loss metadata shape aligned with exporter reports', () => {
    const schema = {
      type: 'object',
      properties: {
        name: { type: 'string', pattern: '^[a-z]+$' },
      },
    }
    const report = new PostgreSQLExporter().exportWithReport('users', schema)
    const lossMetadata: IRLossMetadata[] = report.losses.map(loss => ({
      path: loss.path,
      keyword: loss.keyword,
      target: 'postgresql',
      status: 'unsupported',
    }))

    expect(lossMetadata).toEqual(expect.arrayContaining([
      expect.objectContaining({
        path: '$.properties.name',
        keyword: 'pattern',
        target: 'postgresql',
        status: 'unsupported',
      }),
    ]))
  })

  it('keeps runtime-only and static type-drift boundaries explicit', () => {
    const ir = createJsonSchemaIR({
      type: 'string',
      format: 'email',
      _customValidators: [() => true],
    })
    const root = ir.graph.nodes[ir.root]

    expect(root?.kind).toBe('scalar')
    if (root?.kind !== 'scalar') throw new Error('expected scalar IR')
    expect(root.constraints.format).toBe('email')
    expect(root.runtimeValidators?.[0]).toMatchObject({ mode: 'sync', identity: 'anonymous#0' })
    expect(ir.annotations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'runtime-metadata' }),
    ]))
  })
})
