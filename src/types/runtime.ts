import type { JSONSchema, JSONSchemaInput, SchemaIOOptions } from './schema.js'
import type { DslDefinition, DslExtensionDefinition, DslNamespaceFactories, DslWithExtensions, IDslBuilder } from './dsl.js'
import type { IConditionalBuilder } from './conditional.js'
import type { ValidateOptions, ValidationResult } from './validate.js'
import type { CacheOptions } from './config.js'
import type { I18nError } from '../errors/I18nError.js'

export type SchemaDslMessageValue = string | { code?: string | number; message: string }

export interface SchemaDslMessageRequest {
  key: string
  params: Record<string, unknown>
  locale: string
  source:
    | 'ajv'
    | 'customKeyword'
    | 'conditional'
    | 'customValidator'
    | 'i18nError'
    | 'runtime'
  fallback?: SchemaDslMessageValue
}

export type SchemaDslMessageProvider = (
  request: SchemaDslMessageRequest
) => SchemaDslMessageValue | null | undefined

export type SchemaDslTypeSchema = JSONSchema | (() => JSONSchema)

export interface SchemaDslTypeDefinition {
  baseSchema: Partial<JSONSchema>
  customMessages?: Record<string, string>
  isPattern?: boolean
}

export type SchemaDslTypeResolver = (
  typeName: string,
  context: {
    path: string
    input: string
    unknownType: 'warn' | 'error' | 'ignore'
  }
) => SchemaDslTypeSchema | SchemaDslTypeDefinition | null | undefined

export interface SchemaDslPatternEntry {
  pattern: RegExp
  min?: number
  max?: number
  key: string
}

export type SchemaDslPatternGroup = Record<string, SchemaDslPatternEntry>

export interface SchemaDslPatternRegistry {
  phone?: SchemaDslPatternGroup
  idCard?: SchemaDslPatternGroup
  creditCard?: SchemaDslPatternGroup
  licensePlate?: SchemaDslPatternGroup
  postalCode?: SchemaDslPatternGroup
  passport?: SchemaDslPatternGroup
  common?: SchemaDslPatternGroup
  [key: string]: SchemaDslPatternGroup | undefined
}

export interface SchemaDslRuntimeValidateOptions extends Omit<ValidateOptions, 'messages'> {
  locale?: string
  messages?: Record<string, SchemaDslMessageValue>
  messageProvider?: SchemaDslMessageProvider
}

export type SchemaDslRuntimeConfigureMode = 'merge' | 'replace' | 'reset'

export interface SchemaDslRuntimeConfigureControl {
  mode?: SchemaDslRuntimeConfigureMode
}

export interface SchemaDslRuntimeCacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  clears: number
  hitRate: string
  size: number
  maxSize: number
  enabled: boolean
}

export interface SchemaDslRuntimeStats {
  disposed: boolean
  locale: string
  messageKeyCount: number
  customTypeCount: number
  dynamicTypeCount: number
  patternGroupCount: number
  patternEntryCount: number
  validators: {
    defaultCache: SchemaDslRuntimeCacheStats
    noCoerceCache: SchemaDslRuntimeCacheStats
  }
}

export interface SchemaDslRuntimeOptions extends SchemaDslRuntimeValidateOptions {
  types?: Record<string, SchemaDslTypeSchema>
  dynamicTypes?: Record<string, () => JSONSchema>
  typeResolver?: SchemaDslTypeResolver
  patterns?: Partial<SchemaDslPatternRegistry>
  strict?: boolean
  validator?: {
    allErrors?: boolean
    useDefaults?: boolean
    coerceTypes?: boolean | 'array'
    removeAdditional?: boolean | 'all' | 'failing'
    verbose?: boolean
    cache?: boolean | CacheOptions
  }
}

export interface SchemaDslRuntimeNamespace extends DslNamespaceFactories {
  (def: string, options?: SchemaIOOptions): IDslBuilder
  (def: DslDefinition, options?: SchemaIOOptions): JSONSchema
}

export interface SchemaDslRuntime {
  dsl: SchemaDslRuntimeNamespace
  s: SchemaDslRuntimeNamespace
  compile(definition: string | DslDefinition): JSONSchema
  compileField(definition: string): IDslBuilder
  configure(
    options: Partial<SchemaDslRuntimeOptions>,
    control?: SchemaDslRuntimeConfigureControl
  ): void
  registerType(name: string, schema: SchemaDslTypeSchema): void
  registerDynamicType(name: string, factory: () => JSONSchema): void
  registerExtension(definition: DslExtensionDefinition): void
  registerExtensions<const Definitions extends readonly unknown[]>(
    definitions: readonly [...Definitions]
  ): DslWithExtensions<Definitions>
  unregisterType(name: string): void
  clearCache(): void
  getStats(): SchemaDslRuntimeStats
  dispose(): void
  validate<T = unknown>(
    schema: JSONSchemaInput | DslDefinition | IDslBuilder | IConditionalBuilder | string,
    data: unknown,
    options?: SchemaDslRuntimeValidateOptions
  ): ValidationResult<T>
  validateAsync<T = unknown>(
    schema: JSONSchemaInput | DslDefinition | IDslBuilder | IConditionalBuilder | string,
    data: unknown,
    options?: SchemaDslRuntimeValidateOptions
  ): Promise<T>
  createI18nError(
    key: string,
    params?: Record<string, unknown>,
    statusCode?: number,
    localeOrOptions?: string | SchemaDslRuntimeValidateOptions
  ): I18nError
}
