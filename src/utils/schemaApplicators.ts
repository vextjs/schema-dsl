/** Schema-bearing JSON Schema keyword groups shared by internal walkers. */
export const SCHEMA_MAP_POSITION_KEYS = [
  'properties',
  'patternProperties',
  'dependentSchemas',
  'definitions',
  '$defs',
] as const

/** Map values may be property-name arrays rather than schemas. */
export const SCHEMA_DEPENDENCY_MAP_POSITION_KEYS = ['dependencies'] as const

export const SCHEMA_DIRECT_POSITION_KEYS = [
  'additionalItems',
  'additionalProperties',
  'propertyNames',
  'contains',
  'not',
  'if',
  'then',
  'else',
  'unevaluatedItems',
  'unevaluatedProperties',
] as const

export const SCHEMA_ARRAY_POSITION_KEYS = [
  'allOf',
  'anyOf',
  'oneOf',
  'prefixItems',
] as const
