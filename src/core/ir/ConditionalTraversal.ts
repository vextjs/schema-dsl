import type { ConditionalInternalSchema } from '../ConditionalValidator.js'
import {
  SCHEMA_ARRAY_POSITION_KEYS,
  SCHEMA_DEPENDENCY_MAP_POSITION_KEYS,
  SCHEMA_DIRECT_POSITION_KEYS,
  SCHEMA_MAP_POSITION_KEYS,
} from '../../utils/schemaApplicators.js'

export interface ConditionalSchemaChild {
  path: string
  child: unknown
}

export function iterConditionalSchemaChildren(
  schema: ConditionalInternalSchema,
  path = '',
): ConditionalSchemaChild[] {
  const children: ConditionalSchemaChild[] = []

  for (const key of SCHEMA_MAP_POSITION_KEYS) {
    collectMap(schema[key], `${path}/${key}`, children)
  }
  for (const key of SCHEMA_DEPENDENCY_MAP_POSITION_KEYS) {
    collectMap(schema[key], `${path}/${key}`, children, true)
  }

  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, index) => children.push({ path: `${path}/items/${index}`, child: item }))
    } else {
      children.push({ path: `${path}/items`, child: schema.items })
    }
  }

  for (const key of SCHEMA_DIRECT_POSITION_KEYS) {
    const child = schema[key]
    if (child !== undefined && typeof child === 'object') children.push({ path: `${path}/${key}`, child })
  }

  for (const key of SCHEMA_ARRAY_POSITION_KEYS) {
    const list = schema[key]
    if (Array.isArray(list)) {
      list.forEach((item, index) => children.push({ path: `${path}/${key}/${index}`, child: item }))
    }
  }

  return children
}

function collectMap(
  value: unknown,
  basePath: string,
  children: ConditionalSchemaChild[],
  skipArrays = false,
): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (skipArrays && Array.isArray(child)) continue
    children.push({ path: `${basePath}/${key}`, child })
  }
}
