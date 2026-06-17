import type { JSONSchema } from '../types/schema.js'
import type {
  SchemaDslRuntimeConfigureMode,
  SchemaDslPatternEntry,
  SchemaDslPatternGroup,
  SchemaDslPatternRegistry,
  SchemaDslTypeSchema,
  SchemaDslRuntimeOptions,
} from '../types/runtime.js'
import { createDefaultPatterns } from '../config/patterns.js'
import type { TypeDefinition, TypeRegistryScope } from '../parser/TypeRegistry.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'

function clonePatternEntry(entry: SchemaDslPatternEntry): SchemaDslPatternEntry {
  return {
    pattern: new RegExp(entry.pattern.source, entry.pattern.flags),
    ...(entry.min !== undefined ? { min: entry.min } : {}),
    ...(entry.max !== undefined ? { max: entry.max } : {}),
    key: entry.key,
  }
}

function clonePatternGroup(group: SchemaDslPatternGroup | undefined): SchemaDslPatternGroup | undefined {
  if (!group) return undefined
  return Object.fromEntries(
    Object.entries(group).map(([key, value]) => [key, clonePatternEntry(value)])
  ) as SchemaDslPatternGroup
}

function clonePatterns(patterns: SchemaDslPatternRegistry): SchemaDslPatternRegistry {
  const result: SchemaDslPatternRegistry = {}
  for (const [key, group] of Object.entries(patterns)) {
    const cloned = clonePatternGroup(group)
    if (cloned) result[key] = cloned
  }
  return result
}

function resetPatterns(target: SchemaDslPatternRegistry): void {
  for (const key of Object.keys(target)) delete target[key]
  Object.assign(target, clonePatterns(createDefaultPatterns() as SchemaDslPatternRegistry))
}

function normalizePatternGroup(group: SchemaDslPatternGroup | undefined): SchemaDslPatternGroup | undefined {
  if (!group) return undefined
  const result: SchemaDslPatternGroup = {}
  for (const [key, value] of Object.entries(group)) {
    result[key.toLowerCase()] = clonePatternEntry(value)
  }
  return result
}

function assertTypeName(name: string): void {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('[schema-dsl/runtime] type name must be a non-empty string')
  }
}

function toTypeDefinition(schema: SchemaDslTypeSchema): TypeDefinition | (() => JSONSchema) {
  if (typeof schema === 'function') return schema
  return { baseSchema: cloneSchemaValue(schema) as Partial<JSONSchema> }
}

export class RuntimeCompileContext {
  readonly patterns: SchemaDslPatternRegistry
  readonly registryScope: TypeRegistryScope

  constructor(options: SchemaDslRuntimeOptions = {}) {
    this.patterns = {}
    this.registryScope = {
      customTypes: new Map(),
      dynamicTypes: new Map(),
      includeGlobalCustomTypes: false,
    }
    resetPatterns(this.patterns)
    this.configure(options, 'merge')
  }

  configure(options: Partial<SchemaDslRuntimeOptions> = {}, mode: SchemaDslRuntimeConfigureMode = 'merge'): void {
    if (mode === 'reset' || mode === 'replace') {
      this.registryScope.customTypes?.clear()
      this.registryScope.dynamicTypes?.clear()
      delete this.registryScope.strictMode
      resetPatterns(this.patterns)
    }

    for (const [name, schema] of Object.entries(options.types ?? {})) {
      this.registerType(name, schema)
    }

    for (const [name, factory] of Object.entries(options.dynamicTypes ?? {})) {
      this.registerDynamicType(name, factory)
    }

    if (options.patterns !== undefined) {
      for (const [name, group] of Object.entries(options.patterns)) {
        const normalized = normalizePatternGroup(group)
        if (!normalized) continue
        this.patterns[name] = {
          ...(this.patterns[name] ?? {}),
          ...normalized,
        }
      }
    }

    if ('strict' in options) {
      if (options.strict === undefined) {
        delete this.registryScope.strictMode
      } else {
        this.registryScope.strictMode = options.strict
      }
    }
  }

  registerType(name: string, schema: SchemaDslTypeSchema): void {
    assertTypeName(name)
    const normalized = toTypeDefinition(schema)
    if (typeof normalized === 'function') {
      this.registryScope.dynamicTypes?.set(name, normalized)
      this.registryScope.customTypes?.delete(name)
    } else {
      this.registryScope.customTypes?.set(name, normalized)
      this.registryScope.dynamicTypes?.delete(name)
    }
  }

  registerDynamicType(name: string, factory: () => JSONSchema): void {
    assertTypeName(name)
    this.registryScope.dynamicTypes?.set(name, factory)
    this.registryScope.customTypes?.delete(name)
  }

  unregisterType(name: string): void {
    assertTypeName(name)
    this.registryScope.customTypes?.delete(name)
    this.registryScope.dynamicTypes?.delete(name)
  }

  dispose(): void {
    this.registryScope.customTypes?.clear()
    this.registryScope.dynamicTypes?.clear()
    delete this.registryScope.strictMode
    for (const key of Object.keys(this.patterns)) delete this.patterns[key]
  }

  getStats(): { customTypeCount: number; dynamicTypeCount: number; patternGroupCount: number; patternEntryCount: number } {
    return {
      customTypeCount: this.registryScope.customTypes?.size ?? 0,
      dynamicTypeCount: this.registryScope.dynamicTypes?.size ?? 0,
      patternGroupCount: Object.keys(this.patterns).length,
      patternEntryCount: Object.values(this.patterns).reduce(
        (count, group) => count + (group ? Object.keys(group).length : 0),
        0
      ),
    }
  }
}
