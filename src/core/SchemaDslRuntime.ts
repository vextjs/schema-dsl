import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import type { DslDefinition, DslExtensionDefinition, DslFn, DslWithExtensions, IDslBuilder } from '../types/dsl.js'
import type { IConditionalBuilder } from '../types/conditional.js'
import type {
  SchemaDslRuntimeConfigureControl,
  SchemaDslRuntimeConfigureMode,
  SchemaDslRuntime,
  SchemaDslRuntimeNamespace,
  SchemaDslRuntimeOptions,
  SchemaDslRuntimeStats,
  SchemaDslRuntimeValidateOptions,
  SchemaDslTypeSchema,
} from '../types/runtime.js'
import type { ValidationResult } from '../types/validate.js'
import type { ValidateOptions } from '../types/validate.js'
import { DslBuilder } from './DslBuilder.js'
import { attachDslNamespaceFactories, resetDslNamespaceExtensions } from '../adapters/DslNamespace.js'
import { DslParser, type DslParseOptions } from '../parser/DslParser.js'
import { DslExtensionRegistry } from '../parser/DslExtensionRegistry.js'
import { RuntimeCompileContext } from './RuntimeCompileContext.js'
import { RuntimeIssueFormatter } from './RuntimeIssueFormatter.js'
import { RuntimeValidatorEngine } from './RuntimeValidatorEngine.js'
import { I18nError } from '../errors/I18nError.js'
import { isRawJsonSchemaLike } from '../utils/schemaInput.js'

export class SchemaDslRuntimeInstance implements SchemaDslRuntime {
  readonly dsl: SchemaDslRuntimeNamespace
  readonly s: SchemaDslRuntimeNamespace
  private readonly compileContext: RuntimeCompileContext
  private readonly formatter: RuntimeIssueFormatter
  private readonly parseOptions: DslParseOptions
  private readonly extensionRegistry: DslExtensionRegistry
  private runtimeOptions: SchemaDslRuntimeOptions
  private validatorEngine: RuntimeValidatorEngine
  private disposed = false

  constructor(options: SchemaDslRuntimeOptions = {}) {
    this.runtimeOptions = this.cloneRuntimeOptions(options)
    this.compileContext = new RuntimeCompileContext(options)
    this.formatter = new RuntimeIssueFormatter(options)
    this.extensionRegistry = new DslExtensionRegistry()
    this.parseOptions = {
      patterns: this.compileContext.patterns,
      registryScope: this.compileContext.registryScope,
      extensionRegistry: this.extensionRegistry,
      ...(options.typeResolver ? { typeResolver: options.typeResolver } : {}),
      ...(options.strict !== undefined ? { unknownType: options.strict ? 'error' : 'warn' } : {}),
    }
    this.validatorEngine = new RuntimeValidatorEngine(options, this.formatter, this.parseOptions)
    const namespace = ((definition: string | DslDefinition): IDslBuilder | JSONSchema => {
      this.assertActive()
      return typeof definition === 'string'
        ? this.compileField(definition)
        : this.compile(definition)
    }) as DslFn
    this.dsl = attachDslNamespaceFactories(namespace, {
      createBuilder: definition => this.compileField(definition),
      createBuilderFromSchema: schema => DslBuilder.fromSchema(schema, {
        parseOptions: this.parseOptions,
        patterns: this.compileContext.patterns,
        validatorFactory: () => this.validatorEngine.getDefaultValidator(),
        validatorGuard: () => this.assertActive(),
        cacheValidator: false,
      }) as IDslBuilder,
      parseObject: definition => this.compile(definition),
      registerType: (name, schema) => this.registerType(name, schema),
      typeExists: name => this.compileContext.hasType(name),
      extensionRegistry: this.extensionRegistry,
    })
    this.s = this.dsl
  }

  compile(definition: string | DslDefinition): JSONSchema {
    this.assertActive()
    if (typeof definition === 'string') {
      return (this.compileField(definition) as DslBuilder).toSchema()
    }
    return DslParser.parseObject(definition, this.parseOptions)
  }

  compileField(definition: string): IDslBuilder {
    this.assertActive()
    return new DslBuilder(definition, {
      parseOptions: this.parseOptions,
      patterns: this.compileContext.patterns,
      validatorFactory: () => this.validatorEngine.getDefaultValidator(),
      validatorGuard: () => this.assertActive(),
      cacheValidator: false,
    }) as IDslBuilder
  }

  validate<T = unknown>(
    schema: JSONSchemaInput | DslDefinition | IDslBuilder | IConditionalBuilder | string,
    data: unknown,
    options: SchemaDslRuntimeValidateOptions = {}
  ): ValidationResult<T> {
    this.assertActive()
    const normalizedSchema = this.normalizeSchema(schema)
    const validateOptions = options as unknown as ValidateOptions
    return this.validatorEngine.getValidator(options).validate(normalizedSchema, data as T, validateOptions) as ValidationResult<T>
  }

  async validateAsync<T = unknown>(
    schema: JSONSchemaInput | DslDefinition | IDslBuilder | IConditionalBuilder | string,
    data: unknown,
    options: SchemaDslRuntimeValidateOptions = {}
  ): Promise<T> {
    this.assertActive()
    const normalizedSchema = this.normalizeSchema(schema)
    const validateOptions = options as unknown as ValidateOptions
    return this.validatorEngine.getValidator(options).validateAsync(normalizedSchema, data, validateOptions) as Promise<T>
  }

  createI18nError(
    key: string,
    params: Record<string, unknown> = {},
    statusCode = 400,
    localeOrOptions?: string | SchemaDslRuntimeValidateOptions
  ): I18nError {
    this.assertActive()
    const options = typeof localeOrOptions === 'string'
      ? { locale: localeOrOptions }
      : (localeOrOptions ?? {})
    const value = this.formatter.resolveValue(key, params, options, 'i18nError')
    const template = typeof value === 'string' ? value : value.message
    const code = typeof value === 'string' ? key : value.code ?? key
    return new I18nError(key, params, statusCode, this.formatter.getLocale(options), template, code)
  }

  configure(
    options: Partial<SchemaDslRuntimeOptions>,
    control: SchemaDslRuntimeConfigureControl = {}
  ): void {
    this.assertActive()
    const mode = control.mode ?? 'merge'
    if (mode === 'reset' || mode === 'replace') {
      resetDslNamespaceExtensions(this.dsl)
      this.extensionRegistry.clear()
    }
    this.runtimeOptions = this.mergeRuntimeOptions(this.runtimeOptions, options, mode)
    this.compileContext.configure(options, mode)
    this.formatter.configure(options, mode)
    this.updateParseOptions(options, mode)
    this.rebuildValidatorEngine()
  }

  registerType(name: string, schema: SchemaDslTypeSchema): void {
    this.assertActive()
    this.compileContext.registerType(name, schema)
    this.clearCache()
  }

  registerDynamicType(name: string, factory: () => JSONSchema): void {
    this.assertActive()
    this.compileContext.registerDynamicType(name, factory)
    this.clearCache()
  }

  registerExtension(definition: DslExtensionDefinition): void {
    this.assertActive()
    this.dsl.registerExtension(definition)
    this.clearCache()
  }

  registerExtensions<const Definitions extends readonly unknown[]>(
    definitions: readonly [...Definitions]
  ): DslWithExtensions<Definitions> {
    this.assertActive()
    const namespace = this.dsl.registerExtensions(definitions)
    this.clearCache()
    return namespace
  }

  unregisterType(name: string): void {
    this.assertActive()
    this.compileContext.unregisterType(name)
    this.clearCache()
  }

  clearCache(): void {
    this.assertActive()
    this.validatorEngine.clearCache()
  }

  getStats(): SchemaDslRuntimeStats {
    const compileStats = this.compileContext.getStats()
    const formatterStats = this.formatter.getStats()
    const validatorStats = this.validatorEngine.getStats()
    return {
      disposed: this.disposed,
      locale: formatterStats.locale,
      messageKeyCount: formatterStats.messageKeyCount,
      customTypeCount: compileStats.customTypeCount,
      dynamicTypeCount: compileStats.dynamicTypeCount,
      patternGroupCount: compileStats.patternGroupCount,
      patternEntryCount: compileStats.patternEntryCount,
      validators: validatorStats,
    }
  }

  dispose(): void {
    if (this.disposed) return
    resetDslNamespaceExtensions(this.dsl)
    this.extensionRegistry.clear()
    this.validatorEngine.dispose()
    this.compileContext.dispose()
    this.formatter.dispose()
    this.runtimeOptions = {}
    delete this.parseOptions.typeResolver
    delete this.parseOptions.unknownType
    this.disposed = true
  }

  private normalizeSchema(
    schema: JSONSchemaInput | DslDefinition | IDslBuilder | IConditionalBuilder | string
  ): JSONSchemaInput {
    if (typeof schema === 'string') return (this.compileField(schema) as DslBuilder).toSchema()
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema as JSONSchemaInput

    const record = schema as Record<string, unknown>
    if (typeof record['toSchema'] === 'function') {
      return (record['toSchema'] as () => JSONSchema)()
    }
    if (isRawJsonSchemaLike(record)) return schema as JSONSchema
    return this.compile(schema as DslDefinition)
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('[schema-dsl/runtime] Runtime has been disposed')
    }
  }

  private rebuildValidatorEngine(): void {
    this.validatorEngine.dispose()
    this.validatorEngine = new RuntimeValidatorEngine(this.runtimeOptions, this.formatter, this.parseOptions)
  }

  private updateParseOptions(
    options: Partial<SchemaDslRuntimeOptions>,
    mode: SchemaDslRuntimeConfigureMode
  ): void {
    if (mode === 'reset' || mode === 'replace') {
      delete this.parseOptions.typeResolver
      delete this.parseOptions.unknownType
    }

    if ('typeResolver' in options) {
      if (options.typeResolver) this.parseOptions.typeResolver = options.typeResolver
      else delete this.parseOptions.typeResolver
    }

    if ('strict' in options) {
      if (options.strict === undefined) {
        delete this.parseOptions.unknownType
      } else {
        this.parseOptions.unknownType = options.strict ? 'error' : 'warn'
      }
    }
  }

  private cloneRuntimeOptions(options: SchemaDslRuntimeOptions): SchemaDslRuntimeOptions {
    return {
      ...options,
      ...(options.messages ? { messages: { ...options.messages } } : {}),
      ...(options.types ? { types: { ...options.types } } : {}),
      ...(options.dynamicTypes ? { dynamicTypes: { ...options.dynamicTypes } } : {}),
      ...(options.patterns ? { patterns: { ...options.patterns } } : {}),
      ...(options.validator ? { validator: { ...options.validator } } : {}),
    }
  }

  private mergeRuntimeOptions(
    current: SchemaDslRuntimeOptions,
    next: Partial<SchemaDslRuntimeOptions>,
    mode: SchemaDslRuntimeConfigureMode
  ): SchemaDslRuntimeOptions {
    if (mode === 'reset' || mode === 'replace') return this.cloneRuntimeOptions(next as SchemaDslRuntimeOptions)

    const merged: SchemaDslRuntimeOptions = { ...current, ...next }
    if (mode === 'merge') {
      if (current.messages || next.messages) merged.messages = { ...(current.messages ?? {}), ...(next.messages ?? {}) }
      if (current.types || next.types) merged.types = { ...(current.types ?? {}), ...(next.types ?? {}) }
      if (current.dynamicTypes || next.dynamicTypes) merged.dynamicTypes = { ...(current.dynamicTypes ?? {}), ...(next.dynamicTypes ?? {}) }
      if (current.patterns || next.patterns) merged.patterns = { ...(current.patterns ?? {}), ...(next.patterns ?? {}) }
      if (current.validator || next.validator) merged.validator = { ...(current.validator ?? {}), ...(next.validator ?? {}) }
      return merged
    }

    return merged
  }
}

export function createRuntime(options: SchemaDslRuntimeOptions = {}): SchemaDslRuntime {
  return new SchemaDslRuntimeInstance(options)
}

export const createSchemaDslRuntime = createRuntime
export const createSchemaDslAdapter = createRuntime
