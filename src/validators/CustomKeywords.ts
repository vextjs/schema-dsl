import type { Ajv, ErrorObject } from 'ajv'
import safeRegex from 'safe-regex'
import { Locale } from '../core/Locale.js'


// AJV DataValidateFunction compatible type
type ValidateFnWithErrors = ((schema: unknown, data: unknown, parentSchema?: unknown) => boolean) & {
  errors?: Partial<ErrorObject>[]
}

/**
 * CustomKeywords — AJV custom keyword registrar
 *
 * Fixes:
 *   CK-01: internally uses getMessageText() to obtain strings, avoiding v1 compat objects
 *          that serialized as "[object Object]"
 *   CK-02: regex keyword error messages use locale keys instead of concatenating raw messages
 *   CK-Y04: exactLength uses Unicode code-point counting ([...str].length) instead of
 *           str.length, correctly handling emoji and multi-byte characters
 */
export class CustomKeywords {
  /**
   * Register all custom keywords on an AJV instance
   */
  static registerAll(ajv: Ajv): void {
    CustomKeywords.registerRegexKeyword(ajv)
    CustomKeywords.registerFunctionKeyword(ajv)
    CustomKeywords.registerCustomValidatorsKeyword(ajv)
    CustomKeywords.registerMetadataKeywords(ajv)
    CustomKeywords.registerStringValidators(ajv)
    CustomKeywords.registerNumberValidators(ajv)
    CustomKeywords.registerObjectValidators(ajv)
    CustomKeywords.registerArrayValidators(ajv)
    CustomKeywords.registerDateValidators(ajv)
  }

  // ─── Metadata keywords ──────────────────────────────────────────────────

  static registerMetadataKeywords(ajv: Ajv): void {
    ajv.addKeyword({ keyword: '_label', metaSchema: { type: 'string' } })
    ajv.addKeyword({ keyword: '_customMessages', metaSchema: { type: 'object' } })
    ajv.addKeyword({ keyword: '_description', metaSchema: { type: 'string' } })
    ajv.addKeyword({ keyword: '_whenConditions', metaSchema: { type: 'array' } })
    ajv.addKeyword({ keyword: '_required', metaSchema: { type: 'boolean' } })
    // Conditional schema marker: prevents AJV strict mode from throwing an unknown-keyword error
    ajv.addKeyword({ keyword: '_isConditional', metaSchema: { type: 'boolean' } })
    ajv.addKeyword({ keyword: '_runtimeOnlyConditional', metaSchema: { type: 'boolean' } })
    ajv.addKeyword({ keyword: 'conditions' })
    ajv.addKeyword({ keyword: '_evaluateCondition' })
  }

  // ─── _customValidators ──────────────────────────────────────────────────

  static registerCustomValidatorsKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (validators: unknown, data: unknown): boolean => {
      if (!Array.isArray(validators)) return true

      for (const validator of validators as unknown[]) {
        if (typeof validator !== 'function') continue
        try {
          const result = (validator as (d: unknown) => unknown)(data)

          if (result instanceof Promise) {
            // BC-6: async validators are not supported in the synchronous AJV validate() path.
            // Return an explicit error so callers know to use validateAsync() instead.
            validate.errors = [{
              keyword: '_customValidators',
              message: 'Async validation not supported in sync validate(). Use validateAsync() instead.',
              params: {},
            }]
            return false
          }

          if (result === false) {
            const msg = Locale.getMessageText('CUSTOM_VALIDATION_FAILED')
            validate.errors = [{ keyword: '_customValidators', message: msg, params: {} }]
            return false
          }
          if (typeof result === 'string') {
            validate.errors = [{ keyword: '_customValidators', message: result, params: {} }]
            return false
          }
          if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
            const msg = String((result as Record<string, unknown>)['message'] ?? Locale.getMessageText('CUSTOM_VALIDATION_FAILED'))
            validate.errors = [{ keyword: '_customValidators', message: msg, params: {} }]
            return false
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          validate.errors = [{ keyword: '_customValidators', message: msg, params: {} }]
          return false
        }
      }
      return true
    }

    ajv.addKeyword({ keyword: '_customValidators', validate, errors: true })
  }

  // ─── regex ──────────────────────────────────────────────────────────────

  // Detect potentially catastrophic patterns via a dedicated regex safety analyzer
  private static _isUnsafePattern(pattern: string | RegExp): boolean {
    return !safeRegex(pattern)
  }

  static registerRegexKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const patternStr = String(schema)
      try {
        const regex = new RegExp(patternStr)
        if (CustomKeywords._isUnsafePattern(regex)) {
          validate.errors = [{
            keyword: 'regex',
            message: Locale.getMessageText('string.pattern'),
            params: { pattern: patternStr, reason: 'unsafe regex pattern' },
          }]
          return false
        }
        if (regex.test(String(data))) return true
        // CK-02 fix: use locale key instead of concatenating raw error message
        validate.errors = [{
          keyword: 'regex',
          message: Locale.getMessageText('string.pattern'),
          params: { pattern: schema },
        }]
        return false
      } catch (error) {
        // CK-02 fix: invalid regex also uses locale key
        validate.errors = [{
          keyword: 'regex',
          message: Locale.getMessageText('string.pattern'),
          params: { error: error instanceof Error ? error.message : String(error) },
        }]
        return false
      }
    }

    ajv.addKeyword({ keyword: 'regex', type: 'string', schemaType: 'string', validate, errors: true })
  }

  // ─── validate (function validator) ──────────────────────────────────────

  static registerFunctionKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      if (typeof schema !== 'function') {
        validate.errors = [{
          keyword: 'validate',
          message: Locale.getMessageText('VALIDATE_MUST_BE_FUNCTION'),
          params: {},
        }]
        return false
      }

      try {
        const result = (schema as (d: unknown) => unknown)(data)
        if (typeof result === 'boolean') return result
        if (result !== null && typeof result === 'object') {
          const res = result as Record<string, unknown>
          if (typeof res['valid'] === 'boolean') {
            if (!res['valid'] && res['message']) {
              validate.errors = [{
                keyword: 'validate',
                message: String(res['message']),
                params: {},
              }]
            }
            return res['valid'] as boolean
          }
        }
        return true
      } catch (error) {
        validate.errors = [{
          keyword: 'validate',
          message: error instanceof Error ? error.message : String(error),
          params: {},
        }]
        return false
      }
    }

    ajv.addKeyword({ keyword: 'validate', validate, errors: true })
  }

  // ─── range ───────────────────────────────────────────────────────────────

  static registerRangeKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const s = schema as { min?: number; max?: number }
      const num = data as number

      if (s.min !== undefined && num < s.min) {
        validate.errors = [{ keyword: 'range', message: `must be >= ${s.min}`, params: { min: s.min } }]
        return false
      }
      if (s.max !== undefined && num > s.max) {
        validate.errors = [{ keyword: 'range', message: `must be <= ${s.max}`, params: { max: s.max } }]
        return false
      }
      return true
    }

    ajv.addKeyword({ keyword: 'range', type: 'number', schemaType: 'object', validate, errors: true })
  }

  // ─── String validators ───────────────────────────────────────────────────

  static registerStringValidators(ajv: Ajv): void {
    // exactLength — exact string length (CK-Y04 fix: Unicode code-point counting)
    const exactLength: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      // CK-Y04: use spread iterator for counting — correctly handles emoji / multi-byte Unicode
      const codePointLength = [...String(data)].length
      if (codePointLength !== Number(schema)) {
        exactLength.errors = [{
          keyword: 'exactLength',
          message: Locale.getMessageText('string.length'),
          params: { limit: schema },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'exactLength', type: 'string', schemaType: 'number', validate: exactLength, errors: true })

    // alphanum
    const alphanum: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      if (schema && !/^[a-zA-Z0-9]*$/.test(String(data))) {
        alphanum.errors = [{ keyword: 'alphanum', message: Locale.getMessageText('string.alphanum'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'alphanum', type: 'string', schemaType: 'boolean', validate: alphanum, errors: true })

    // trim
    const trim: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.trim()) {
        trim.errors = [{ keyword: 'trim', message: Locale.getMessageText('string.trim'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'trim', type: 'string', schemaType: 'boolean', validate: trim, errors: true })

    // lowercase
    const lowercase: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.toLowerCase()) {
        lowercase.errors = [{ keyword: 'lowercase', message: Locale.getMessageText('string.lowercase'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'lowercase', type: 'string', schemaType: 'boolean', validate: lowercase, errors: true })

    // uppercase
    const uppercase: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.toUpperCase()) {
        uppercase.errors = [{ keyword: 'uppercase', message: Locale.getMessageText('string.uppercase'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'uppercase', type: 'string', schemaType: 'boolean', validate: uppercase, errors: true })

    // jsonString
    const jsonString: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      if (schema) {
        try {
          JSON.parse(String(data))
        } catch {
          jsonString.errors = [{ keyword: 'jsonString', message: Locale.getMessageText('pattern.json'), params: {} }]
          return false
        }
      }
      return true
    }
    ajv.addKeyword({ keyword: 'jsonString', type: 'string', schemaType: 'boolean', validate: jsonString, errors: true })
  }

  // ─── Number validators ───────────────────────────────────────────────────

  static registerNumberValidators(ajv: Ajv): void {
    // precision — decimal place limit
    const precision: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const decimalPart = String(data as number).split('.')[1]
      const actualPrecision = decimalPart ? decimalPart.length : 0
      if (actualPrecision > Number(schema)) {
        precision.errors = [{ keyword: 'precision', message: Locale.getMessageText('number.precision'), params: { limit: schema } }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'precision', type: 'number', schemaType: 'number', validate: precision, errors: true })

    // port — port number validation (1-65535)
    const port: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const num = data as number
      if (schema && (!Number.isInteger(num) || num < 1 || num > 65535)) {
        port.errors = [{ keyword: 'port', message: Locale.getMessageText('number.port'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'port', type: ['integer', 'number'], schemaType: 'boolean', validate: port, errors: true })
  }

  // ─── Object validators ──────────────────────────────────────────────────

  static registerObjectValidators(ajv: Ajv): void {
    // requiredAll — require all defined properties to be present
    const requiredAll: ValidateFnWithErrors = (schema: unknown, data: unknown, parentSchema?: unknown): boolean => {
      if (!schema) return true
      const props = ((parentSchema as Record<string, unknown>)?.['properties'] as Record<string, unknown>) ?? {}
      const missingKeys = Object.keys(props).filter(k => !(k in (data as Record<string, unknown>)))
      if (missingKeys.length > 0) {
        requiredAll.errors = [{
          keyword: 'requiredAll',
          message: Locale.getMessageText('object.missing'),
          params: { missing: missingKeys },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'requiredAll', type: 'object', schemaType: 'boolean', validate: requiredAll, errors: true })

    // strictSchema — disallow extra properties
    const strictSchema: ValidateFnWithErrors = (schema: unknown, data: unknown, parentSchema?: unknown): boolean => {
      if (!schema) return true
      const props = ((parentSchema as Record<string, unknown>)?.['properties'] as Record<string, unknown>) ?? {}
      const allowedKeys = Object.keys(props)
      const extraKeys = Object.keys(data as Record<string, unknown>).filter(k => !allowedKeys.includes(k))
      if (extraKeys.length > 0) {
        strictSchema.errors = [{
          keyword: 'strictSchema',
          message: Locale.getMessageText('object.schema'),
          params: { extra: extraKeys },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'strictSchema', type: 'object', schemaType: 'boolean', validate: strictSchema, errors: true })
  }

  // ─── Array validators ───────────────────────────────────────────────────

  static registerArrayValidators(ajv: Ajv): void {
    // noSparse — disallow sparse arrays
    const noSparse: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const arr = data as unknown[]
      if (schema) {
        for (let i = 0; i < arr.length; i++) {
          if (!(i in arr)) {
            noSparse.errors = [{
              keyword: 'noSparse',
              message: Locale.getMessageText('array.sparse'),
              params: { index: i },
            }]
            return false
          }
        }
      }
      return true
    }
    ajv.addKeyword({ keyword: 'noSparse', type: 'array', schemaType: 'boolean', validate: noSparse, errors: true })

    // includesRequired — must include specified elements
    const includesRequired: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      if (!Array.isArray(schema) || schema.length === 0) return true
      const arr = data as unknown[]
      const missing = (schema as unknown[]).filter(required => {
        return !arr.some(item => {
          if (typeof required === 'object' && required !== null) {
            return JSON.stringify(item) === JSON.stringify(required)
          }
          return item === required
        })
      })
      if (missing.length > 0) {
        includesRequired.errors = [{
          keyword: 'includesRequired',
          message: Locale.getMessageText('array.includesRequired'),
          params: { missing },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'includesRequired', type: 'array', schemaType: 'array', validate: includesRequired, errors: true })
  }

  // ─── Date validators ────────────────────────────────────────────────────

  static registerDateValidators(ajv: Ajv): void {
    const DATE_FORMATS: Record<string, RegExp> = {
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
      'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/,
      'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
      'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'ISO8601': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    }

    // dateFormat
    const dateFormat: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const fmt = String(schema)
      const pattern = DATE_FORMATS[fmt]
      const str = String(data)
      if (!pattern || !pattern.test(str)) {
        dateFormat.errors = [{
          keyword: 'dateFormat',
          message: Locale.getMessageText('date.format'),
          params: { format: schema },
        }]
        return false
      }
      // Calendar validity: extract components based on format and verify via Date
      const sep = /[-/]/.exec(str)?.[0] ?? '-'
      const parts = str.split(sep)
      let y: number, m: number, dd: number
      if (fmt === 'DD-MM-YYYY' || fmt === 'DD/MM/YYYY') {
        [dd, m, y] = [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)]
      } else if (fmt === 'ISO8601') {
        const d2 = new Date(str)
        if (isNaN(d2.getTime())) {
          dateFormat.errors = [{ keyword: 'dateFormat', message: Locale.getMessageText('date.format'), params: { format: schema } }]
          return false
        }
        return true
      } else {
        [y, m, dd] = [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)]
      }
      // Verify the date exists (e.g., reject 2024-13-99, 2024-02-31)
      const probe = new Date(y, m - 1, dd)
      if (probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== dd) {
        dateFormat.errors = [{ keyword: 'dateFormat', message: Locale.getMessageText('date.format'), params: { format: schema } }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'dateFormat', type: 'string', schemaType: 'string', validate: dateFormat, errors: true })

    // dateGreater
    const dateGreater: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const dataDate = new Date(String(data))
      const compareDate = new Date(String(schema))
      if (isNaN(dataDate.getTime()) || isNaN(compareDate.getTime()) || dataDate <= compareDate) {
        dateGreater.errors = [{
          keyword: 'dateGreater',
          message: Locale.getMessageText('date.greater'),
          params: { limit: schema },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'dateGreater', type: 'string', schemaType: 'string', validate: dateGreater, errors: true })

    // dateLess
    const dateLess: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const dataDate = new Date(String(data))
      const compareDate = new Date(String(schema))
      if (isNaN(dataDate.getTime()) || isNaN(compareDate.getTime()) || dataDate >= compareDate) {
        dateLess.errors = [{
          keyword: 'dateLess',
          message: Locale.getMessageText('date.less'),
          params: { limit: schema },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'dateLess', type: 'string', schemaType: 'string', validate: dateLess, errors: true })
  }
}
