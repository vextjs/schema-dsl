import { DslBuilder } from '../core/DslBuilder.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'
import type {
  DslDefinition,
  DslExtensionDefinition,
  DslFactoryInput,
  DslFn,
  IDslBuilder,
  NormalizedDslExtensionDefinition,
} from '../types/dsl.js'
import type { JSONSchema, SchemaIOOptions } from '../types/schema.js'

export interface DslNamespaceOptions {
  createBuilder: (definition: string) => IDslBuilder
  createBuilderFromSchema?: (schema: JSONSchema) => IDslBuilder
  parseObject: (definition: DslDefinition, options?: SchemaIOOptions) => JSONSchema
  registerType?: (name: string, schema: JSONSchema | (() => JSONSchema)) => void
}

type DslNamespaceFunction = (...args: never[]) => unknown
type MutableDslNamespace = DslNamespaceFunction & Record<PropertyKey, unknown>
type FactoryFn = (...args: unknown[]) => IDslBuilder

const FACTORY_OWNER = Symbol.for('schema-dsl.dslNamespace.factoryOwner')
const CUSTOM_FACTORY_NAMES = Symbol.for('schema-dsl.dslNamespace.customFactoryNames')

const STATIC_NAMESPACE_KEYS = new Set([
  'config',
  'if',
  '_if',
  'match',
  'error',
  'defineExtension',
  'registerExtension',
])

const DANGEROUS_FACTORY_NAMES = new Set([
  'constructor',
  'prototype',
  '__proto__',
  'call',
  'apply',
  'bind',
])

const BUILDER_CHAIN_KEYS = new Set([
  'min',
  'max',
  'label',
  'description',
  'pattern',
  'enum',
  'optional',
  'require',
  'required',
  'default',
  'error',
  'messages',
  'format',
  'custom',
  'length',
  'alphanum',
  'trim',
  'lowercase',
  'uppercase',
  'ip',
  'base64',
  'jwt',
  'json',
  'domain',
  'slug',
  'after',
  'before',
  'dateGreater',
  'dateLess',
  'dateFormat',
  'username',
  'password',
  'phone',
  'phoneNumber',
  'idCard',
  'creditCard',
  'licensePlate',
  'postalCode',
  'passport',
  'precision',
  'multiple',
  'port',
  'requireAll',
  'strict',
  'noSparse',
  'includesRequired',
  'items',
  'toSchema',
  'toJsonSchema',
  'toString',
  'validate',
])

const FACTORY_NAME_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

function markFactory<T extends FactoryFn>(fn: T): T {
  Object.defineProperty(fn, FACTORY_OWNER, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return fn
}

function getCustomFactoryNames(namespace: MutableDslNamespace): Set<string> {
  const record = namespace as unknown as Record<PropertyKey, unknown>
  const existing = record[CUSTOM_FACTORY_NAMES]
  if (existing instanceof Set) return existing as Set<string>
  const created = new Set<string>()
  Object.defineProperty(namespace, CUSTOM_FACTORY_NAMES, {
    value: created,
    enumerable: false,
    configurable: false,
    writable: false,
  })
  return created
}

function isSchemaDslFactory(value: unknown): boolean {
  return typeof value === 'function' && (value as unknown as Record<PropertyKey, unknown>)[FACTORY_OWNER] === true
}

function normalizeExtension(definition: DslExtensionDefinition): NormalizedDslExtensionDefinition {
  if (!definition || typeof definition !== 'object') {
    throw new Error('[schema-dsl] registerExtension() requires an extension definition object')
  }

  const literal = definition.literal?.trim()
  const factoryName = definition.factoryName?.trim()

  if (!literal && !factoryName) {
    throw new Error('[schema-dsl] registerExtension() requires literal or factoryName')
  }

  if (factoryName && !FACTORY_NAME_PATTERN.test(factoryName)) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${factoryName}": factoryName must be a valid JavaScript identifier`)
  }

  const transformMethods = [...(definition.transformMethods ?? [])]
  if (definition.exposeStringChain === true) {
    if (factoryName && !transformMethods.includes(factoryName)) {
      transformMethods.push(factoryName)
    } else if (transformMethods.length === 0) {
      throw new Error('[schema-dsl] exposeStringChain requires transformMethods or a valid factoryName')
    }
  }

  return {
    ...definition,
    ...(literal ? { literal } : {}),
    ...(factoryName ? { factoryName } : {}),
    transformMethods,
  }
}

function assertFactoryNameAvailable(namespace: MutableDslNamespace, name: string): void {
  if (!FACTORY_NAME_PATTERN.test(name)) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${name}": factoryName must be a valid JavaScript identifier`)
  }

  if (!name || DANGEROUS_FACTORY_NAMES.has(name) || STATIC_NAMESPACE_KEYS.has(name) || BUILDER_CHAIN_KEYS.has(name)) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${name}": name is reserved`)
  }

  const existing = namespace[name]
  if (existing !== undefined && !isSchemaDslFactory(existing)) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${name}": property already exists`)
  }
  if (existing !== undefined) {
    throw new Error(`[schema-dsl] Cannot register namespace factory "${name}": factory already exists`)
  }
}

function attachFactory(
  namespace: MutableDslNamespace,
  name: string,
  factory: FactoryFn,
  custom = false
): void {
  if (custom) {
    assertFactoryNameAvailable(namespace, name)
    getCustomFactoryNames(namespace).add(name)
  }

  Object.defineProperty(namespace, name, {
    value: markFactory(factory),
    enumerable: true,
    configurable: custom,
    writable: true,
  })
}

function normalizeEnumValues(values: unknown[]): unknown[] {
  return values.length === 1 && Array.isArray(values[0])
    ? [...values[0]]
    : values
}

function createEnumBuilder(values: unknown[], createBuilder: (definition: string) => IDslBuilder): IDslBuilder {
  const normalized = normalizeEnumValues(values)
  if (normalized.length === 0) {
    throw new Error('[schema-dsl] enum() requires at least one value')
  }

  const allBooleans = normalized.every(value => typeof value === 'boolean')
  const allNumbers = normalized.every(value => typeof value === 'number' && Number.isFinite(value))
  const allStrings = normalized.every(value => typeof value === 'string')

  if (allBooleans) return createBuilder('boolean').enum(...normalized)
  if (allNumbers) return createBuilder('number').enum(...normalized)
  if (allStrings) return createBuilder('string').enum(...normalized)

  throw new Error('[schema-dsl] enum() values must be all strings, all numbers, or all booleans')
}

function toSchemaForArrayItem(item: DslFactoryInput, createBuilder: (definition: string) => IDslBuilder): JSONSchema {
  const rawSchema = typeof item === 'string'
    ? createBuilder(item).toSchema()
    : typeof (item as { toSchema?: unknown })?.toSchema === 'function'
      ? (item as { toSchema: () => JSONSchema }).toSchema()
      : cloneSchemaValue(item as JSONSchema)

  const stripRequired = (schema: unknown): unknown => {
    if (Array.isArray(schema)) {
      return schema.map(item => stripRequired(item))
    }
    if (!schema || typeof schema !== 'object') return schema

    const { _required, ...rest } = schema as JSONSchema & { _required?: boolean }
    void _required
    if (rest.properties) {
      rest.properties = Object.fromEntries(
        Object.entries(rest.properties).map(([key, child]) => [key, stripRequired(child) as JSONSchema])
      )
    }
    if (Array.isArray(rest.items)) {
      rest.items = rest.items.map(item => stripRequired(item) as JSONSchema)
    } else if (rest.items) {
      rest.items = stripRequired(rest.items) as JSONSchema
    }
    return rest
  }

  return stripRequired(cloneSchemaValue(rawSchema)) as JSONSchema
}

export function attachDslNamespaceFactories(
  namespace: DslFn,
  options: DslNamespaceOptions
): DslFn {
  const mutable = namespace as unknown as MutableDslNamespace
  const createBuilderFromSchema = options.createBuilderFromSchema
    ?? ((schema: JSONSchema) => DslBuilder.fromSchema(schema) as unknown as IDslBuilder)

  const typeFactory = (literal: string): FactoryFn => () => options.createBuilder(literal)

  const builtInTypes = [
    'string',
    'number',
    'integer',
    'int',
    'boolean',
    'object',
    'any',
    'mixed',
    'email',
    'url',
    'uri',
    'uuid',
    'ip',
    'ipv4',
    'ipv6',
    'date',
    'datetime',
    'time',
    'slug',
  ]

  for (const typeName of builtInTypes) {
    attachFactory(mutable, typeName, typeFactory(typeName))
  }

  attachFactory(mutable, 'array', ((item?: DslFactoryInput): IDslBuilder => {
    const builder = options.createBuilder('array')
    if (item !== undefined) {
      return builder.items(toSchemaForArrayItem(item, options.createBuilder))
    }
    return builder
  }) as FactoryFn)

  attachFactory(mutable, 'phone', ((country = 'cn'): IDslBuilder => options.createBuilder(`phone:${country}`)) as FactoryFn)
  attachFactory(mutable, 'username', ((preset?: unknown): IDslBuilder => {
    const builder = options.createBuilder('string')
    return preset === undefined ? builder.username() : builder.username(preset as string)
  }) as FactoryFn)
  attachFactory(mutable, 'password', ((preset?: unknown): IDslBuilder => {
    const builder = options.createBuilder('string')
    return preset === undefined ? builder.password() : builder.password(String(preset))
  }) as FactoryFn)
  attachFactory(mutable, 'enum', ((...values: unknown[]): IDslBuilder => createEnumBuilder(values, options.createBuilder)) as FactoryFn)
  attachFactory(mutable, 'type', ((name: unknown): IDslBuilder => {
    if (typeof name !== 'string' || name.trim() === '') {
      throw new Error('[schema-dsl] type() requires a non-empty type name')
    }
    return options.createBuilder(name.trim())
  }) as FactoryFn)

  mutable.defineExtension = (definition: DslExtensionDefinition): NormalizedDslExtensionDefinition => {
    return normalizeExtension(definition)
  }

  mutable.registerExtension = (definition: DslExtensionDefinition): void => {
    const normalized = normalizeExtension(definition)
    const typeName = normalized.literal ?? normalized.factoryName
    if (normalized.factoryName && normalized.exposeFactory !== false) {
      assertFactoryNameAvailable(mutable, normalized.factoryName)
    }

    if (normalized.schema && typeName) {
      options.registerType?.(typeName, normalized.schema)
    }

    if (normalized.factoryName && normalized.exposeFactory !== false) {
      const literal = normalized.literal ?? normalized.factoryName
      attachFactory(mutable, normalized.factoryName, ((...args: unknown[]): IDslBuilder => {
        if (normalized.factory) {
          const result = normalized.factory(...args)
          if (typeof result === 'string') return options.createBuilder(result)
          if (result && typeof result === 'object' && typeof (result as { toSchema?: unknown }).toSchema === 'function') {
            return result as IDslBuilder
          }
          return createBuilderFromSchema(result as JSONSchema)
        }
        return options.createBuilder(literal)
      }) as FactoryFn, true)
    }
  }

  return namespace
}

export function resetDslNamespaceExtensions(namespace: DslNamespaceFunction): void {
  const mutable = namespace as unknown as MutableDslNamespace
  const names = getCustomFactoryNames(mutable)
  for (const name of names) {
    delete mutable[name]
  }
  names.clear()
}
