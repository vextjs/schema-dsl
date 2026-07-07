import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import type { ValidationPlan, ValidationPlanUnsupportedReason } from './ValidationPlan.js'

export type SchemaCoerceScalarType = 'number' | 'integer' | 'boolean'

export interface SchemaCoerceCandidates {
  numbers: string[]
  booleans: string[]
  arrays: Array<{ key: string; itemType: SchemaCoerceScalarType }>
  objects: Array<{ key: string; candidates: SchemaCoerceCandidates }>
}

export interface SchemaRuntimeMetadata {
  cacheKey: string
  hasConditionals: boolean
  hasDeclaredAsyncCustomValidators: boolean
  hasAjvSkippedProperties: boolean
  coerceCandidates: SchemaCoerceCandidates | null
  validationPlan?: ValidationPlan | null
  validationPlanReason?: ValidationPlanUnsupportedReason | null
}

export class SchemaRuntimeMetadataStore {
  private cache = new WeakMap<object, SchemaRuntimeMetadata>()

  get(
    schema: object,
    cacheKey: string,
    create: () => SchemaRuntimeMetadata
  ): SchemaRuntimeMetadata {
    const cached = this.cache.get(schema)
    if (cached?.cacheKey === cacheKey) return cached

    const metadata = create()
    this.cache.set(schema, metadata)
    return metadata
  }

  clear(): void {
    // WeakMap has no clear(); replacing keeps the public method cheap for callers.
    this.cache = new WeakMap<object, SchemaRuntimeMetadata>()
  }
}

export function getSchemaCoerceCandidates(schema: JSONSchemaInput): SchemaCoerceCandidates | null {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null
  const props = (schema as JSONSchema).properties as Record<string, JSONSchema> | undefined
  if (!props) return null

  const numbers: string[] = []
  const booleans: string[] = []
  const arrays: Array<{ key: string; itemType: SchemaCoerceScalarType }> = []
  const objects: Array<{ key: string; candidates: SchemaCoerceCandidates }> = []

  for (const [key, fieldSchema] of Object.entries(props)) {
    if (!fieldSchema || typeof fieldSchema !== 'object' || Array.isArray(fieldSchema)) continue

    const fieldType = getCoercibleType(fieldSchema)
    if (fieldSchema.enum && !isEnumCoercible(fieldSchema.enum, fieldType)) continue

    if (fieldType === 'number' || fieldType === 'integer') {
      numbers.push(key)
    } else if (fieldType === 'boolean') {
      booleans.push(key)
    } else if (schemaTypeIncludes(fieldSchema, 'array')) {
      const itemSchema = fieldSchema.items
      const itemType = itemSchema && typeof itemSchema === 'object' && !Array.isArray(itemSchema)
        ? getCoercibleType(itemSchema)
        : null
      if (itemType) arrays.push({ key, itemType })
    } else if (schemaTypeIncludes(fieldSchema, 'object') && fieldSchema.properties) {
      const nestedCandidates = getSchemaCoerceCandidates(fieldSchema)
      if (nestedCandidates) objects.push({ key, candidates: nestedCandidates })
    }
  }

  return numbers.length || booleans.length || arrays.length || objects.length
    ? { numbers, booleans, arrays, objects }
    : null
}

export function applySmartCoerce(data: unknown, candidates: SchemaCoerceCandidates | null): unknown {
  if (!candidates || !data || typeof data !== 'object' || Array.isArray(data)) return data

  let result: Record<string, unknown> | null = null
  const source = data as Record<string, unknown>

  if (candidates.numbers.length === 1
    && candidates.booleans.length === 0
    && candidates.arrays.length === 0
    && candidates.objects.length === 0) {
    const key = candidates.numbers[0]!
    const value = source[key]
    const converted = coerceNumber(value)
    return converted === value ? data : { ...source, [key]: converted }
  }

  for (const key of candidates.numbers) {
    const value = source[key]
    const converted = coerceNumber(value)
    if (converted !== value) {
      if (!result) result = { ...source }
      result[key] = converted
    }
  }

  for (const key of candidates.booleans) {
    const value = source[key]
    const converted = coerceBoolean(value)
    if (converted !== value) {
      if (!result) result = { ...source }
      result[key] = converted
    }
  }

  for (const { key, itemType } of candidates.arrays) {
    const value = source[key]
    if (!Array.isArray(value)) continue

    let convertedArray: unknown[] | null = null
    for (let index = 0; index < value.length; index++) {
      const item = value[index]
      const converted = itemType === 'boolean' ? coerceBoolean(item) : coerceNumber(item)
      if (converted !== item) {
        if (!convertedArray) convertedArray = value.slice()
        convertedArray[index] = converted
      }
    }

    if (convertedArray) {
      if (!result) result = { ...source }
      result[key] = convertedArray
    }
  }

  for (const { key, candidates: nestedCandidates } of candidates.objects) {
    const value = source[key]
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue

    const converted = applySmartCoerce(value, nestedCandidates)
    if (converted !== value) {
      if (!result) result = { ...source }
      result[key] = converted
    }
  }

  return result ?? data
}

function getCoercibleType(schema: JSONSchema): SchemaCoerceScalarType | null {
  const direct = directCoercibleType(schema)
  if (direct) return direct

  for (const key of ['anyOf', 'oneOf'] as const) {
    const branches = schema[key]
    if (!Array.isArray(branches)) continue

    let target: SchemaCoerceScalarType | null = null
    let safeNullableUnion = true

    for (const branch of branches) {
      if (!branch || typeof branch !== 'object' || Array.isArray(branch)) {
        safeNullableUnion = false
        break
      }

      const branchType = directCoercibleType(branch)
      if (branchType) {
        if (target && target !== branchType) {
          safeNullableUnion = false
          break
        }
        target = branchType
      } else if (!schemaTypeIncludes(branch, 'null')) {
        safeNullableUnion = false
        break
      }
    }

    if (safeNullableUnion && target) return target
  }

  return null
}

function directCoercibleType(schema: JSONSchema): SchemaCoerceScalarType | null {
  if (schemaTypeIncludes(schema, 'number')) return 'number'
  if (schemaTypeIncludes(schema, 'integer')) return 'integer'
  if (schemaTypeIncludes(schema, 'boolean')) return 'boolean'
  return null
}

function schemaTypeIncludes(schema: JSONSchema, type: string): boolean {
  return schema.type === type || (Array.isArray(schema.type) && schema.type.includes(type))
}

function isEnumCoercible(values: unknown[], type: SchemaCoerceScalarType | null): boolean {
  if (type === 'number' || type === 'integer') {
    return values.every(value => typeof value === 'number' || value === null)
  }
  if (type === 'boolean') {
    return values.every(value => typeof value === 'boolean' || value === null)
  }
  return true
}

function coerceNumber(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (trimmed === '') return value
  const num = Number(trimmed)
  return Number.isFinite(num) ? num : value
}

function coerceBoolean(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  return value
}
