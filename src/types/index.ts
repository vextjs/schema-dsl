// --- Core types ---
export type { JSONSchema, SchemaIOOptions } from './schema.js'
export type {
  DslFn,
  DslField,
  DslDefinition,
  DslInput,
  IDslBuilder,
  DslIfFn,
  DslErrorNamespace,
} from './dsl.js'
export type { ValidateOptions, ValidationResult, ValidationErrorItem, AjvError } from './validate.js'
export type { DslConfigOptions, I18nConfig, CacheOptions, CacheManagerOptions, ValidatorOptions } from './config.js'
export type { ErrorMessages, ErrorCodeMap, ErrorMessageConfig, LocaleMessages } from './error.js'
export type {
  SchemaDslMessageProvider,
  SchemaDslMessageRequest,
  SchemaDslMessageValue,
  SchemaDslPatternEntry,
  SchemaDslPatternGroup,
  SchemaDslPatternRegistry,
  SchemaDslRuntime,
  SchemaDslRuntimeOptions,
  SchemaDslRuntimeValidateOptions,
  SchemaDslTypeDefinition,
  SchemaDslTypeResolver,
  SchemaDslTypeSchema,
} from './runtime.js'
export type { Plugin, HookFn, HookName, HookContext, PluginManagerOptions } from './plugin.js'
export type { IConditionalBuilder } from './conditional.js'
export type { InferSchema, InferJsonSchema, InferDslDefinition, InferDslString } from './infer.js'
