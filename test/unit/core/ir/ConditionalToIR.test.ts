import { describe, expect, it } from 'vitest'
import { attachConditionalRuntime } from '../../../../src/core/ConditionalRuntime.js'
import { createConditionalIR, collectConditionalAnnotations } from '../../../../src/core/ir/ConditionalToIR.js'
import { ConditionalValidator, type ConditionalInternalSchema } from '../../../../src/core/ConditionalValidator.js'
import { iterConditionalSchemaChildren } from '../../../../src/core/ir/ConditionalTraversal.js'

const createConditionalNumber = (): ConditionalInternalSchema => ({
  _isConditional: true,
  conditions: [{ then: { type: 'number' } }],
  _evaluateCondition: () => ({ result: true }),
})

describe('ConditionalToIR', () => {
  it('represents conditional nodes without replacing ConditionalValidator execution', () => {
    const ir = createConditionalIR({
      type: 'object',
      properties: {
        score: createConditionalNumber(),
      },
      patternProperties: {
        '^x_': createConditionalNumber(),
      },
      additionalProperties: createConditionalNumber(),
      propertyNames: createConditionalNumber(),
      dependentSchemas: {
        score: createConditionalNumber(),
      },
      dependencies: {
        flag: ['score'],
        gate: createConditionalNumber(),
      },
    } as ConditionalInternalSchema)

    const conditionalNodes = Object.values(ir.graph.nodes).filter(node => node.kind === 'conditional')
    expect(conditionalNodes.length).toBeGreaterThanOrEqual(6)
    expect(ir.annotations.filter(annotation => annotation.kind === 'conditional').length).toBeGreaterThanOrEqual(6)

    const root = ir.graph.nodes[ir.root]
    expect(root?.kind).toBe('object')
    if (root?.kind !== 'object') throw new Error('expected object IR')
    expect(root.dependencies.flag).toEqual({
      mode: 'property-list',
      requiredProperties: ['score'],
    })
    expect(root.dependencies.gate?.mode).toBe('schema')
  })

  it('captures runtime-only, DSL string and builder branches as non-public fallbacks', () => {
    const builderBranch = { toSchema: () => ({ type: 'string' }) }
    const ir = createConditionalIR({
      _isConditional: true,
      _runtimeOnlyConditional: true,
      conditions: [
        { then: 'number!' },
        { then: builderBranch },
      ],
      else: { type: 'boolean' },
    } as ConditionalInternalSchema)

    const root = ir.graph.nodes[ir.root]
    expect(root?.kind).toBe('conditional')
    if (root?.kind !== 'conditional') throw new Error('expected conditional IR')
    expect(root.runtimeOnly).toBe(true)
    expect(root.branches.map(branch => branch.source)).toEqual(['dsl-string', 'builder', 'json-schema'])
    expect(ir.fallbacks.map(fallback => fallback.reason)).toEqual(expect.arrayContaining([
      'runtime-only',
      'dsl-branch',
    ]))
  })

  it('uses attached runtime state as the strongest conditional source', () => {
    const schema = attachConditionalRuntime({
      _isConditional: true,
      conditions: [],
    } as ConditionalInternalSchema, {
      conditions: [{ then: { type: 'string' } }],
      elseSchema: { type: 'number' },
      evaluateCondition: () => ({ result: true }),
    }) as ConditionalInternalSchema

    const annotations = collectConditionalAnnotations(schema)
    const ir = createConditionalIR(schema)
    const root = ir.graph.nodes[ir.root]

    expect(annotations[0]?.data).toMatchObject({ conditionCount: 1, hasElse: true })
    expect(root?.kind).toBe('conditional')
    if (root?.kind !== 'conditional') throw new Error('expected conditional IR')
    expect(root.conditionCount).toBe(1)
    expect(root.hasElse).toBe(true)
  })

  it('collects nested conditional annotations across schema applicators', () => {
    const reused = createConditionalNumber()
    const annotations = collectConditionalAnnotations({
      type: 'object',
      properties: {
        score: reused,
      },
      items: [
        createConditionalNumber(),
      ],
      prefixItems: [
        createConditionalNumber(),
      ],
      dependencies: {
        list: ['score'],
        gate: createConditionalNumber(),
      },
      additionalProperties: createConditionalNumber(),
      contains: createConditionalNumber(),
      allOf: [
        reused,
      ],
    } as unknown as ConditionalInternalSchema)

    expect(annotations.map(annotation => annotation.path)).toEqual(expect.arrayContaining([
      '/properties/score',
      '/items/0',
      '/prefixItems/0',
      '/dependencies/gate',
      '/additionalProperties',
      '/contains',
    ]))
    expect(annotations.filter(annotation => annotation.path === '/properties/score')).toHaveLength(1)
  })

  it('shares applicator traversal coverage with ConditionalValidator detection', () => {
    const schema = {
      type: 'object',
      properties: { score: createConditionalNumber() },
      patternProperties: { '^x_': createConditionalNumber() },
      additionalProperties: createConditionalNumber(),
      propertyNames: createConditionalNumber(),
      dependencies: {
        gate: createConditionalNumber(),
        list: ['score'],
      },
      dependentSchemas: { card: createConditionalNumber() },
      definitions: { Legacy: createConditionalNumber() },
      $defs: { Modern: createConditionalNumber() },
      items: [createConditionalNumber()],
      prefixItems: [createConditionalNumber()],
      contains: createConditionalNumber(),
      allOf: [createConditionalNumber()],
      anyOf: [createConditionalNumber()],
      oneOf: [createConditionalNumber()],
      not: createConditionalNumber(),
      if: createConditionalNumber(),
      then: createConditionalNumber(),
      else: createConditionalNumber(),
      unevaluatedItems: createConditionalNumber(),
      unevaluatedProperties: createConditionalNumber(),
    } as unknown as ConditionalInternalSchema

    const paths = iterConditionalSchemaChildren(schema).map(entry => entry.path)
    expect(paths).toEqual(expect.arrayContaining([
      '/properties/score',
      '/patternProperties/^x_',
      '/additionalProperties',
      '/propertyNames',
      '/dependencies/gate',
      '/dependentSchemas/card',
      '/definitions/Legacy',
      '/$defs/Modern',
      '/items/0',
      '/prefixItems/0',
      '/contains',
      '/allOf/0',
      '/anyOf/0',
      '/oneOf/0',
      '/not',
      '/if',
      '/then',
      '/else',
      '/unevaluatedItems',
      '/unevaluatedProperties',
    ]))

    const annotations = collectConditionalAnnotations(schema)
    expect(annotations.length).toBeGreaterThanOrEqual(20)

    const validator = new ConditionalValidator({
      validateSchema: (_schema, data) => ({ valid: true, data, errors: [] }),
      internalError: (_error, data) => ({ valid: false, data, errors: [] }),
    })
    expect(validator.hasAnyConditional(schema)).toBe(true)
  })
})
