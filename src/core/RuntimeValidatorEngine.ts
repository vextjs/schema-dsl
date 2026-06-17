import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'
import type { JSONSchema } from '../types/schema.js'
import type { SchemaDslRuntimeOptions, SchemaDslRuntimeValidateOptions } from '../types/runtime.js'
import { Validator, type ValidatorOptions } from './Validator.js'
import { CustomKeywords } from '../validators/CustomKeywords.js'
import type { DslParseOptions } from '../parser/DslParser.js'
import type { RuntimeIssueFormatter } from './RuntimeIssueFormatter.js'
import type { CacheStats } from './CacheManager.js'

export interface RuntimeValidatorEngineStats {
  defaultCache: CacheStats
  noCoerceCache: CacheStats
}

export class RuntimeValidatorEngine {
  private readonly formatter: RuntimeIssueFormatter
  private readonly parseOptions: DslParseOptions
  private readonly validatorOptions: ValidatorOptions
  private readonly defaultValidator: Validator
  private readonly noCoerceValidator: Validator
  private readonly quickAjv: InstanceType<typeof Ajv>

  constructor(
    options: SchemaDslRuntimeOptions,
    formatter: RuntimeIssueFormatter,
    parseOptions: DslParseOptions
  ) {
    this.formatter = formatter
    this.parseOptions = parseOptions
    this.quickAjv = new Ajv()
      ; (addFormats as unknown as (a: InstanceType<typeof Ajv>) => void)(this.quickAjv)
    CustomKeywords.registerAll(this.quickAjv, {
      getMessageText: (key, params) =>
        this.formatter.resolveText(key, params ?? {}, {}, 'customKeyword'),
    })

    this.validatorOptions = {
      ...(options.validator ?? {}),
      parseOptions: this.parseOptions,
      messageResolver: (key, params, validateOptions, source) =>
        this.formatter.resolveText(key, params, validateOptions as SchemaDslRuntimeValidateOptions, source),
      messageTableProvider: (validateOptions) =>
        this.formatter.getMessageTable(validateOptions as SchemaDslRuntimeValidateOptions),
      quickValidate: (schema, data) => this.quickValidate(schema, data),
    }
    this.defaultValidator = new Validator(this.validatorOptions)
    this.noCoerceValidator = new Validator({
      ...this.validatorOptions,
      coerceTypes: false,
      smartCoerce: false,
    })
  }

  getDefaultValidator(): Validator {
    return this.defaultValidator
  }

  getValidator(options: SchemaDslRuntimeValidateOptions = {}): Validator {
    return options.coerce === false || options['coerceTypes'] === false || options.smartCoerce === false
      ? this.noCoerceValidator
      : this.defaultValidator
  }

  quickValidate(schema: JSONSchema, data: unknown): boolean {
    try {
      return this.quickAjv.validate(schema, data) as boolean
    } catch {
      return false
    }
  }

  clearCache(): void {
    this.defaultValidator.clearCache()
    this.noCoerceValidator.clearCache()
    this.quickAjv.removeSchema()
  }

  getStats(): RuntimeValidatorEngineStats {
    return {
      defaultCache: this.defaultValidator.getCacheStats(),
      noCoerceCache: this.noCoerceValidator.getCacheStats(),
    }
  }

  dispose(): void {
    this.clearCache()
  }
}
