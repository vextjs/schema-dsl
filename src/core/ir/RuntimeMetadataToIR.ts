import type { SchemaRuntimeMetadata } from '../SchemaRuntimeMetadataStore.js'
import type { IRAnnotation, IREdgeKind, RuleIR, SchemaIR, SchemaIRProjection } from '../../types/ir.js'

export function createRuntimeMetadataAnnotations(
  metadata: SchemaRuntimeMetadata,
  path = '',
): IRAnnotation[] {
  const annotations: IRAnnotation[] = []

  annotations.push({
    kind: 'runtime-metadata',
    path,
    data: {
      cacheKey: metadata.cacheKey,
      hasConditionals: metadata.hasConditionals,
      hasDeclaredAsyncCustomValidators: metadata.hasDeclaredAsyncCustomValidators,
      hasAjvSkippedProperties: metadata.hasAjvSkippedProperties,
    },
  })

  if (metadata.coerceCandidates) {
    annotations.push({
      kind: 'coerce',
      path,
      data: {
        numbers: metadata.coerceCandidates.numbers,
        booleans: metadata.coerceCandidates.booleans,
        arrays: metadata.coerceCandidates.arrays.map(item => item.key),
        objects: metadata.coerceCandidates.objects.map(item => item.key),
      },
    })
  }

  if (metadata.validationPlan || metadata.validationPlanReason) {
    annotations.push({
      kind: 'validation-plan',
      path,
      data: {
        compiled: !!metadata.validationPlan,
        reason: metadata.validationPlanReason ?? null,
      },
    })
  }

  return annotations
}

export function createExecutionPlanProjection(
  ir: SchemaIR,
  metadata?: SchemaRuntimeMetadata,
): SchemaIRProjection {
  const conditionalNodes = Object.values(ir.graph.nodes)
    .filter(node => node.kind === 'conditional')
    .map(node => node.id)
  const validationFallbacks = metadata?.validationPlanReason
    ? ir.fallbacks.concat({
      reason: 'validation-plan-fallback',
      path: '',
      message: metadata.validationPlanReason,
    })
    : ir.fallbacks
  const validationSafe = metadata
    ? !!metadata.validationPlan && validationFallbacks.length === 0
    : validationFallbacks.length === 0 && isValidationProjectionSafe(ir)

  return {
    kind: 'ir-execution-plan',
    sourceIrVersion: ir.version,
    projections: {
      validation: {
        safe: validationSafe,
        fallbackReasons: validationFallbacks,
      },
      conditional: {
        nodes: conditionalNodes,
        fallbackReasons: ir.fallbacks.filter(fallback => fallback.reason === 'runtime-only' || fallback.reason === 'dsl-branch'),
      },
      exporter: {
        lossMetadata: [],
      },
      typeInference: {
        staticCoverage: ['scalar', 'literal', 'enum', 'array', 'object', 'union'],
        runtimeOnly: ['format', 'pattern', 'range', 'custom-validator', 'conditional', 'async-validator'],
      },
    },
  }
}

const VALIDATION_SAFE_EDGE_KINDS = new Set<IREdgeKind>([
  'property',
  'item',
  'composition',
])

function isValidationProjectionSafe(ir: SchemaIR): boolean {
  for (const edge of ir.graph.edges) {
    if (!VALIDATION_SAFE_EDGE_KINDS.has(edge.kind)) return false
  }
  return Object.values(ir.graph.nodes).every(isValidationSafeNode)
}

function isValidationSafeNode(node: RuleIR): boolean {
  switch (node.kind) {
    case 'always':
      return true
    case 'never':
      return false
    case 'scalar':
      return isValidationSafeScalar(node)
    case 'array':
      return node.prefixItems.length === 0
        && node.contains === undefined
        && node.uniqueItems === undefined
        && !Array.isArray(node.items)
        && node.items !== false
    case 'object':
      return Object.keys(node.patternProperties).length === 0
        && Object.keys(node.dependencies).length === 0
        && node.additionalProperties === undefined
        && node.propertyNames === undefined
    case 'composition':
      return node.mode === 'anyOf' || node.mode === 'oneOf'
    default:
      return false
  }
}

function isValidationSafeScalar(node: Extract<RuleIR, { kind: 'scalar' }>): boolean {
  const { constraints } = node
  if (constraints.multipleOf !== undefined) return false
  if (constraints.format !== undefined && constraints.format !== 'email') return false
  if (constraints.exclusiveMinimum === false || constraints.exclusiveMaximum === false) return false
  return true
}
