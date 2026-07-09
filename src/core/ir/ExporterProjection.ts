import type { JSONSchemaInput } from '../../types/schema.js'
import type { IRLossMetadata, SchemaIR, SchemaIRProjection } from '../../types/ir.js'
import { createJsonSchemaIR } from './JsonSchemaToIR.js'

export type ExporterIRTarget = IRLossMetadata['target']

export interface ExporterLossProjection {
  ir: SchemaIR
  projection: SchemaIRProjection
  lossMetadata: IRLossMetadata[]
}

export function createExporterLossProjection(
  schema: JSONSchemaInput,
  target: ExporterIRTarget,
  unsupportedKeywords: readonly string[],
): ExporterLossProjection {
  const ir = createJsonSchemaIR(schema)
  const lossMetadata = collectUnsupportedKeywordLossMetadata(schema, target, unsupportedKeywords)

  return {
    ir,
    lossMetadata,
    projection: {
      kind: 'ir-execution-plan',
      sourceIrVersion: ir.version,
      projections: {
        exporter: { lossMetadata },
      },
    },
  }
}

export function collectUnsupportedKeywordLossMetadata(
  schema: JSONSchemaInput,
  target: ExporterIRTarget,
  unsupportedKeywords: readonly string[],
): IRLossMetadata[] {
  return collectUnsupportedKeywordLosses(schema, target, unsupportedKeywords)
}

function collectUnsupportedKeywordLosses(
  schema: JSONSchemaInput,
  target: ExporterIRTarget,
  unsupportedKeywords: readonly string[],
  path = '$',
  rootSchema: JSONSchemaInput = schema,
  seen = new WeakSet<object>(),
  seenRefs = new Set<string>(),
): IRLossMetadata[] {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return []

  const schemaObject = schema as object
  if (seen.has(schemaObject)) return []
  seen.add(schemaObject)

  const unsupported = new Set(unsupportedKeywords)
  const losses: IRLossMetadata[] = []
  const record = schema as Record<string, unknown>

  try {
    for (const keyword of unsupported) {
      if (record[keyword] !== undefined) {
        losses.push({
          path,
          keyword,
          target,
          status: 'unsupported',
        })
      }
    }

    const ref = record['$ref']
    if (typeof ref === 'string' && !seenRefs.has(ref)) {
      const resolved = resolveLocalRef(rootSchema, ref)
      if (resolved !== undefined && resolved !== schema) {
        seenRefs.add(ref)
        losses.push(...collectUnsupportedKeywordLosses(
          resolved as JSONSchemaInput,
          target,
          unsupportedKeywords,
          `${path}.$ref(${ref})`,
          rootSchema,
          seen,
          seenRefs,
        ))
        seenRefs.delete(ref)
      }
    }

    for (const key of ['properties', 'patternProperties', 'dependentSchemas', 'dependencies', 'definitions', '$defs']) {
      const children = record[key]
      if (!children || typeof children !== 'object' || Array.isArray(children)) continue
      for (const [childKey, child] of Object.entries(children as Record<string, unknown>)) {
        if (Array.isArray(child)) continue
        losses.push(...collectUnsupportedKeywordLosses(
          child as JSONSchemaInput,
          target,
          unsupportedKeywords,
          `${path}.${key}.${childKey}`,
          rootSchema,
          seen,
          seenRefs,
        ))
      }
    }

    for (const key of ['items', 'prefixItems']) {
      const children = record[key]
      if (Array.isArray(children)) {
        children.forEach((child, index) => {
          losses.push(...collectUnsupportedKeywordLosses(
            child as JSONSchemaInput,
            target,
            unsupportedKeywords,
            `${path}.${key}[${index}]`,
            rootSchema,
            seen,
            seenRefs,
          ))
        })
      } else if (children !== undefined) {
        losses.push(...collectUnsupportedKeywordLosses(
          children as JSONSchemaInput,
          target,
          unsupportedKeywords,
          `${path}.${key}`,
          rootSchema,
          seen,
          seenRefs,
        ))
      }
    }

    for (const key of ['allOf', 'anyOf', 'oneOf']) {
      const children = record[key]
      if (Array.isArray(children)) {
        children.forEach((child, index) => {
          losses.push(...collectUnsupportedKeywordLosses(
            child as JSONSchemaInput,
            target,
            unsupportedKeywords,
            `${path}.${key}[${index}]`,
            rootSchema,
            seen,
            seenRefs,
          ))
        })
      }
    }

    for (const key of ['additionalProperties', 'propertyNames', 'contains', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
      const child = record[key]
      if (child !== undefined) {
        losses.push(...collectUnsupportedKeywordLosses(
          child as JSONSchemaInput,
          target,
          unsupportedKeywords,
          `${path}.${key}`,
          rootSchema,
          seen,
          seenRefs,
        ))
      }
    }

    return losses
  } finally {
    seen.delete(schemaObject)
  }
}

function resolveLocalRef(rootSchema: unknown, ref: string): unknown {
  if (!ref.startsWith('#')) return undefined
  if (ref === '#') return rootSchema
  if (!ref.startsWith('#/')) return undefined

  let current = rootSchema
  for (const rawSegment of ref.slice(2).split('/')) {
    if (!current || typeof current !== 'object') return undefined
    const segment = decodeJsonPointerSegment(rawSegment)
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function decodeJsonPointerSegment(segment: string): string {
  let decoded = segment
  try {
    decoded = decodeURIComponent(segment)
  } catch {
    decoded = segment
  }
  return decoded.replace(/~1/g, '/').replace(/~0/g, '~')
}
