import type { KeywordDefinition } from 'ajv'
import type { Plugin } from '../types/plugin.js'
import type { Validator } from '../core/Validator.js'

function getValidator(core: unknown): Validator {
  const coreRecord = core as { getDefaultValidator?: () => Validator }
  const validator = coreRecord.getDefaultValidator?.()
  if (!validator) {
    throw new Error('getDefaultValidator() is not available. Please provide schema-dsl core object.')
  }
  return validator
}

function getPluginBucket(): Record<string, unknown> {
  const globalRecord = globalThis as typeof globalThis & {
    __schemaDsl_plugins?: Record<string, unknown>
  }
  if (!globalRecord.__schemaDsl_plugins) {
    globalRecord.__schemaDsl_plugins = {}
  }
  return globalRecord.__schemaDsl_plugins
}

const CUSTOM_KEYWORD_NAMES = ['unique', 'passwordStrength', 'idCard']

export const customValidatorPlugin: Plugin & {
  addCustomKeywords: (validator: Validator) => void
  _validateIdCardChecksum: (idCard: string) => boolean
} = {
  name: 'custom-validator',
  version: '1.0.0',
  description: 'Custom validator plugin — adds business-specific validation rules',
  install(core, _options = {}, _context) {
    const validator = getValidator(core)
    this.addCustomKeywords(validator)
    getPluginBucket()['custom-validator'] = this
  },
  uninstall(core) {
    delete getPluginBucket()['custom-validator']
    if (!core) return

    const validator = getValidator(core)
    const ajv = validator.getAjv() as {
      getKeyword?: (name: string) => unknown
      removeKeyword?: (name: string) => unknown
    }

    for (const name of CUSTOM_KEYWORD_NAMES) {
      if (typeof ajv.removeKeyword === 'function' && (!ajv.getKeyword || ajv.getKeyword(name))) {
        ajv.removeKeyword(name)
      }
    }
    validator.clearCache()
  },
  addCustomKeywords(validator) {
    const ajv = validator.getAjv() as {
      getKeyword?: (name: string) => unknown
    }

    if (!ajv.getKeyword?.('unique')) {
      validator.addKeyword('unique', {
        async: true,
        type: 'string',
        validate: async function validateUnique(schema: unknown) {
          if (!schema) return true
          const { table, field } = schema as { table?: string; field?: string }
          const exists = false
          if (exists) {
            ;(validateUnique as typeof validateUnique & { errors?: unknown[] }).errors = [{
              keyword: 'unique',
              message: `${field} already exists in ${table}`,
              params: { table, field },
            }]
            return false
          }
          return true
        },
      } as unknown as KeywordDefinition)
    }

    if (!ajv.getKeyword?.('passwordStrength')) {
      validator.addKeyword('passwordStrength', {
        type: 'string',
        validate: function validatePasswordStrength(schema: unknown, data: unknown) {
          if (!schema) return true

          const strength = String(schema)
          const value = String(data ?? '')
          const rules: Record<string, RegExp> = {
            weak: /^.{6,}$/,
            medium: /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
            strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/,
          }

          const pattern = rules[strength]
          if (!pattern) return true

          if (!pattern.test(value)) {
            ;(validatePasswordStrength as typeof validatePasswordStrength & { errors?: unknown[] }).errors = [{
              keyword: 'passwordStrength',
              message: `Password does not meet ${strength} strength requirements`,
              params: { strength },
            }]
            return false
          }

          return true
        },
      } as unknown as KeywordDefinition)
    }

    if (!ajv.getKeyword?.('idCard')) {
      validator.addKeyword('idCard', {
        type: 'string',
        validate: (schema: unknown, data: unknown) => {
          if (!schema) return true

          const value = String(data ?? '')
          const pattern = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/

          if (!pattern.test(value)) {
            return false
          }

          return customValidatorPlugin._validateIdCardChecksum(value)
        },
      } as unknown as KeywordDefinition)
    }
  },
  _validateIdCardChecksum(idCard: string) {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checksums = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

    let sum = 0
    for (let i = 0; i < 17; i += 1) {
      sum += Number.parseInt(idCard[i], 10) * weights[i]
    }

    const checksum = checksums[sum % 11]
    return idCard[17].toUpperCase() === checksum
  },
  hooks: {
    onBeforeValidate() {},
    onAfterValidate() {},
    onError(error) {
      console.error('[custom-validator] Error:', (error as Error).message)
    },
  },
}

export default customValidatorPlugin



