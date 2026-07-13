import type { JSONSchemaInput } from '../types/schema.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'
import {
  SCHEMA_ARRAY_POSITION_KEYS,
  SCHEMA_DEPENDENCY_MAP_POSITION_KEYS,
  SCHEMA_DIRECT_POSITION_KEYS,
  SCHEMA_MAP_POSITION_KEYS,
} from '../utils/schemaApplicators.js'

export const SCHEMA_DSL_CONTAINS_RANGE_KEYWORD = '_schemaDslContainsRange'

export interface ContainsRangeKeywordSchema {
  schema: JSONSchemaInput
  minContains: number
  maxContains?: number
}

export function projectContainsRangesForAjv(schema: JSONSchemaInput): JSONSchemaInput {
  if (!hasContainsRange(schema, new WeakSet<object>())) return schema

  const projected = cloneSchemaValue(schema)
  transformContainsRanges(projected, new WeakSet<object>())
  return projected
}

function hasContainsRange(value: unknown, seen: WeakSet<object>): boolean {
  if (!value || typeof value !== 'object' || seen.has(value)) return false
  seen.add(value)

  if (!Array.isArray(value)) {
    const source = value as Record<string, unknown>
    if (
      Object.prototype.hasOwnProperty.call(source, 'minContains')
      || Object.prototype.hasOwnProperty.call(source, 'maxContains')
    ) {
      return true
    }
  }

  for (const child of schemaChildren(value)) {
    if (hasContainsRange(child, seen)) return true
  }
  return false
}

function transformContainsRanges(value: unknown, seen: WeakSet<object>): void {
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)

  for (const child of schemaChildren(value)) transformContainsRanges(child, seen)
  if (Array.isArray(value)) return

  const source = value as Record<string, unknown>
  const hasMin = Object.prototype.hasOwnProperty.call(source, 'minContains')
  const hasMax = Object.prototype.hasOwnProperty.call(source, 'maxContains')
  if (!hasMin && !hasMax) return

  const minContains = hasMin ? assertBound('minContains', source['minContains']) : 1
  const maxContains = hasMax ? assertBound('maxContains', source['maxContains']) : undefined
  const contains = source['contains']

  delete source['minContains']
  delete source['maxContains']
  if (contains === undefined) return

  delete source['contains']
  source[SCHEMA_DSL_CONTAINS_RANGE_KEYWORD] = {
    schema: contains as JSONSchemaInput,
    minContains,
    ...(maxContains !== undefined ? { maxContains } : {}),
  } satisfies ContainsRangeKeywordSchema
}

function assertBound(keyword: string, value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`${keyword} must be a non-negative integer`)
  }
  return value
}

function schemaChildren(value: object): unknown[] {
  if (Array.isArray(value)) return value

  const source = value as Record<string, unknown>
  const children: unknown[] = []
  for (const key of SCHEMA_MAP_POSITION_KEYS) {
    const map = source[key]
    if (map && typeof map === 'object' && !Array.isArray(map)) {
      children.push(...Object.values(map))
    }
  }

  for (const key of SCHEMA_DEPENDENCY_MAP_POSITION_KEYS) {
    const dependencies = source[key]
    if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
      for (const dependency of Object.values(dependencies)) {
        if (!Array.isArray(dependency)) children.push(dependency)
      }
    }
  }

  for (const key of ['items', ...SCHEMA_DIRECT_POSITION_KEYS, ...SCHEMA_ARRAY_POSITION_KEYS] as const) {
    const child = source[key]
    if (child !== undefined) children.push(child)
  }

  return children
}
