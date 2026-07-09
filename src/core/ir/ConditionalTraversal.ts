import type { ConditionalInternalSchema } from '../ConditionalValidator.js'

export interface ConditionalSchemaChild {
  path: string
  child: unknown
}

export function iterConditionalSchemaChildren(
  schema: ConditionalInternalSchema,
  path = '',
): ConditionalSchemaChild[] {
  const children: ConditionalSchemaChild[] = []

  collectMap(schema.properties, `${path}/properties`, children)
  collectMap(schema.patternProperties, `${path}/patternProperties`, children)
  collectMap(schema.dependentSchemas, `${path}/dependentSchemas`, children)
  collectMap(schema.definitions, `${path}/definitions`, children)
  collectMap(schema.$defs, `${path}/$defs`, children)
  collectMap((schema as Record<string, unknown>)['dependencies'], `${path}/dependencies`, children, true)

  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, index) => children.push({ path: `${path}/items/${index}`, child: item }))
    } else {
      children.push({ path: `${path}/items`, child: schema.items })
    }
  }

  const prefixItems = (schema as Record<string, unknown>)['prefixItems']
  if (Array.isArray(prefixItems)) {
    prefixItems.forEach((item, index) => children.push({ path: `${path}/prefixItems/${index}`, child: item }))
  }

  for (const key of [
    'additionalProperties',
    'propertyNames',
    'contains',
    'not',
    'if',
    'then',
    'else',
    'unevaluatedItems',
    'unevaluatedProperties',
  ] as const) {
    const child = schema[key]
    if (child !== undefined && typeof child === 'object') children.push({ path: `${path}/${key}`, child })
  }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
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
