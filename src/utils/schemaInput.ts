import type { JSONSchema } from '../types/schema.js'

const JSON_SCHEMA_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])

const JSON_SCHEMA_OBJECT_KEYWORDS = new Set([
  '$defs',
  'definitions',
  'properties',
  'patternProperties',
  'dependentSchemas',
])

const JSON_SCHEMA_ARRAY_KEYWORDS = new Set([
  'allOf',
  'anyOf',
  'oneOf',
  'required',
  'enum',
  'examples',
  'dependentRequired',
])

const JSON_SCHEMA_SCHEMA_KEYWORDS = new Set([
  'not',
  'if',
  'then',
  'else',
  'items',
  'contains',
  'propertyNames',
  'additionalItems',
  'additionalProperties',
  'unevaluatedItems',
  'unevaluatedProperties',
])

const JSON_SCHEMA_STRING_KEYWORDS = new Set([
  '$id',
  '$schema',
  '$ref',
  '$anchor',
  '$comment',
  'title',
  'description',
  'format',
  'pattern',
  'contentEncoding',
  'contentMediaType',
])

const JSON_SCHEMA_NUMBER_KEYWORDS = new Set([
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'minItems',
  'maxItems',
  'minContains',
  'maxContains',
  'minProperties',
  'maxProperties',
])

const JSON_SCHEMA_BOOLEAN_KEYWORDS = new Set([
  'uniqueItems',
  'readOnly',
  'writeOnly',
  'deprecated',
])

const ALWAYS_JSON_SCHEMA_KEYWORDS = new Set([
  'const',
])

export function isJsonSchemaTypeValue(value: unknown): boolean {
  if (typeof value === 'string') return JSON_SCHEMA_TYPES.has(value)
  if (Array.isArray(value)) {
    return value.length > 0 && value.every(item => typeof item === 'string' && JSON_SCHEMA_TYPES.has(item))
  }
  return false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isConditionalSchema(value: unknown): boolean {
  return isRecord(value) && value['_isConditional'] === true
}

function isSchemaOrBoolean(value: unknown): boolean {
  return typeof value === 'boolean' || isConditionalSchema(value) || isRawJsonSchemaLike(value)
}

function isExplicitDslString(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed || /\s/.test(trimmed)) return false
  if (trimmed.endsWith('!') || trimmed.endsWith('?')) return true
  if (trimmed.startsWith('types:') || trimmed.startsWith('enum:')) return true
  return trimmed.includes('|') || trimmed.includes(':') || trimmed.includes('<')
}

function isJsonSchemaPropertiesMap(value: unknown): boolean {
  if (!isRecord(value)) return false
  const values = Object.values(value)
  return values.length === 0 || values.every(isSchemaOrBoolean)
}

function hasJsonSchemaKeywordShape(key: string, value: unknown): boolean {
  if (key === 'type') return isJsonSchemaTypeValue(value)
  if (ALWAYS_JSON_SCHEMA_KEYWORDS.has(key)) return !isExplicitDslString(value)
  if (JSON_SCHEMA_STRING_KEYWORDS.has(key)) return typeof value === 'string' && !isExplicitDslString(value)
  if (JSON_SCHEMA_NUMBER_KEYWORDS.has(key)) return typeof value === 'number'
  if (JSON_SCHEMA_BOOLEAN_KEYWORDS.has(key)) return typeof value === 'boolean'
  if (JSON_SCHEMA_ARRAY_KEYWORDS.has(key)) return Array.isArray(value)
  if (JSON_SCHEMA_OBJECT_KEYWORDS.has(key)) return isJsonSchemaPropertiesMap(value)
  if (JSON_SCHEMA_SCHEMA_KEYWORDS.has(key)) {
    if (Array.isArray(value)) return value.every(isSchemaOrBoolean)
    return isSchemaOrBoolean(value)
  }
  return false
}

export function isJsonSchemaFactoryInputLike(obj: Record<string, unknown>): boolean {
  const entries = Object.entries(obj)
  if (entries.length === 1 && entries[0]?.[0] === 'default') {
    return !isExplicitDslString(entries[0][1])
  }
  return entries.some(([key, value]) => hasJsonSchemaKeywordShape(key, value))
}

export function isRawJsonSchemaLike(value: unknown): value is JSONSchema {
  if (!isRecord(value)) return false
  return isJsonSchemaFactoryInputLike(value)
}
