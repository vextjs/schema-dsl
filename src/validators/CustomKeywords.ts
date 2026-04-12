import { Ajv } from 'ajv'
import type { ErrorObject } from 'ajv'
import { Locale } from '../core/Locale.js'

// AJV DataValidateFunction compatible type
type ValidateFnWithErrors = ((schema: unknown, data: unknown, parentSchema?: unknown) => boolean) & {
  errors?: Partial<ErrorObject>[]
}

/**
 * CustomKeywords — AJV 自定义关键字注册器
 *
 * 修复：
 *   CK-01: getMessage 统一返回 string（v1 因 LocaleMessage 类型返回 object，导致 error.message 为 "[object Object]"）
 *   CK-02: regex 关键字错误消息使用 locale key 而非拼接原始消息
 *   CK-Y04: exactLength 使用 Unicode 码点计数（[...str].length）而非 str.length，正确处理 emoji/汉字
 */
export class CustomKeywords {
  /**
   * 注册所有自定义关键字到 AJV 实例
   */
  static registerAll(ajv: Ajv): void {
    CustomKeywords.registerRegexKeyword(ajv)
    CustomKeywords.registerFunctionKeyword(ajv)
    CustomKeywords.registerRangeKeyword(ajv)
    CustomKeywords.registerCustomValidatorsKeyword(ajv)
    CustomKeywords.registerMetadataKeywords(ajv)
    CustomKeywords.registerStringValidators(ajv)
    CustomKeywords.registerNumberValidators(ajv)
    CustomKeywords.registerObjectValidators(ajv)
    CustomKeywords.registerArrayValidators(ajv)
    CustomKeywords.registerDateValidators(ajv)
  }

  // ─── 元数据关键字 ────────────────────────────────────────────────────────

  static registerMetadataKeywords(ajv: Ajv): void {
    ajv.addKeyword({ keyword: '_label', metaSchema: { type: 'string' } })
    ajv.addKeyword({ keyword: '_customMessages', metaSchema: { type: 'object' } })
    ajv.addKeyword({ keyword: '_description', metaSchema: { type: 'string' } })
    ajv.addKeyword({ keyword: '_whenConditions', metaSchema: { type: 'array' } })
    ajv.addKeyword({ keyword: '_required', metaSchema: { type: 'boolean' } })
    // 条件 schema 标记：防止 AJV strict 模式抛 unknown keyword 错误
    ajv.addKeyword({ keyword: '_isConditional', metaSchema: { type: 'boolean' } })
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
            // CK-01 修复：getMessage 返回 string
            const msg = Locale.getMessage('ASYNC_VALIDATION_NOT_SUPPORTED')
            throw new Error(msg)
          }

          if (result === false) {
            const msg = Locale.getMessage('CUSTOM_VALIDATION_FAILED')
            validate.errors = [{ keyword: '_customValidators', message: msg, params: {} }]
            return false
          }
          if (typeof result === 'string') {
            validate.errors = [{ keyword: '_customValidators', message: result, params: {} }]
            return false
          }
          if (result !== null && typeof result === 'object' && (result as Record<string, unknown>)['error']) {
            const msg = String((result as Record<string, unknown>)['message'] ?? Locale.getMessage('CUSTOM_VALIDATION_FAILED'))
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

  static registerRegexKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      try {
        const regex = new RegExp(String(schema))
        if (regex.test(String(data))) return true
        // CK-02 修复：使用 locale key 而非拼接原始错误消息
        validate.errors = [{
          keyword: 'regex',
          message: Locale.getMessage('string.pattern'),
          params: { pattern: schema },
        }]
        return false
      } catch (error) {
        // CK-02 修复：Invalid regex 也使用 locale key
        validate.errors = [{
          keyword: 'regex',
          message: Locale.getMessage('string.pattern'),
          params: { error: error instanceof Error ? error.message : String(error) },
        }]
        return false
      }
    }

    ajv.addKeyword({ keyword: 'regex', type: 'string', schemaType: 'string', validate, errors: true })
  }

  // ─── validate（函数验证）─────────────────────────────────────────────────

  static registerFunctionKeyword(ajv: Ajv): void {
    const validate: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      if (typeof schema !== 'function') {
        validate.errors = [{
          keyword: 'validate',
          message: Locale.getMessage('VALIDATE_MUST_BE_FUNCTION'),
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

  // ─── String 验证器 ────────────────────────────────────────────────────────

  static registerStringValidators(ajv: Ajv): void {
    // exactLength — 精确长度（CK-Y04 修复：Unicode 码点计数）
    const exactLength: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      // CK-Y04: 使用 spread 迭代器计数，正确处理 emoji / 多字节 Unicode
      const codePointLength = [...String(data)].length
      if (codePointLength !== Number(schema)) {
        exactLength.errors = [{
          keyword: 'exactLength',
          message: Locale.getMessage('string.length'),
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
        alphanum.errors = [{ keyword: 'alphanum', message: Locale.getMessage('string.alphanum'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'alphanum', type: 'string', schemaType: 'boolean', validate: alphanum, errors: true })

    // trim
    const trim: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.trim()) {
        trim.errors = [{ keyword: 'trim', message: Locale.getMessage('string.trim'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'trim', type: 'string', schemaType: 'boolean', validate: trim, errors: true })

    // lowercase
    const lowercase: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.toLowerCase()) {
        lowercase.errors = [{ keyword: 'lowercase', message: Locale.getMessage('string.lowercase'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'lowercase', type: 'string', schemaType: 'boolean', validate: lowercase, errors: true })

    // uppercase
    const uppercase: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const str = String(data)
      if (schema && str !== str.toUpperCase()) {
        uppercase.errors = [{ keyword: 'uppercase', message: Locale.getMessage('string.uppercase'), params: {} }]
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
          jsonString.errors = [{ keyword: 'jsonString', message: Locale.getMessage('pattern.json'), params: {} }]
          return false
        }
      }
      return true
    }
    ajv.addKeyword({ keyword: 'jsonString', type: 'string', schemaType: 'boolean', validate: jsonString, errors: true })
  }

  // ─── Number 验证器 ────────────────────────────────────────────────────────

  static registerNumberValidators(ajv: Ajv): void {
    // precision — 小数位数限制
    const precision: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const decimalPart = String(data as number).split('.')[1]
      const actualPrecision = decimalPart ? decimalPart.length : 0
      if (actualPrecision > Number(schema)) {
        precision.errors = [{ keyword: 'precision', message: Locale.getMessage('number.precision'), params: { limit: schema } }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'precision', type: 'number', schemaType: 'number', validate: precision, errors: true })

    // port — 端口号验证（1-65535）
    const port: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const num = data as number
      if (schema && (!Number.isInteger(num) || num < 1 || num > 65535)) {
        port.errors = [{ keyword: 'port', message: Locale.getMessage('number.port'), params: {} }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'port', type: ['integer', 'number'], schemaType: 'boolean', validate: port, errors: true })
  }

  // ─── Object 验证器 ───────────────────────────────────────────────────────

  static registerObjectValidators(ajv: Ajv): void {
    // requiredAll — 要求所有定义的属性都存在
    const requiredAll: ValidateFnWithErrors = (schema: unknown, data: unknown, parentSchema?: unknown): boolean => {
      if (!schema) return true
      const props = ((parentSchema as Record<string, unknown>)?.['properties'] as Record<string, unknown>) ?? {}
      const missingKeys = Object.keys(props).filter(k => !(k in (data as Record<string, unknown>)))
      if (missingKeys.length > 0) {
        requiredAll.errors = [{
          keyword: 'requiredAll',
          message: Locale.getMessage('object.missing'),
          params: { missing: missingKeys },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'requiredAll', type: 'object', schemaType: 'boolean', validate: requiredAll, errors: true })

    // strictSchema — 不允许额外属性
    const strictSchema: ValidateFnWithErrors = (schema: unknown, data: unknown, parentSchema?: unknown): boolean => {
      if (!schema) return true
      const props = ((parentSchema as Record<string, unknown>)?.['properties'] as Record<string, unknown>) ?? {}
      const allowedKeys = Object.keys(props)
      const extraKeys = Object.keys(data as Record<string, unknown>).filter(k => !allowedKeys.includes(k))
      if (extraKeys.length > 0) {
        strictSchema.errors = [{
          keyword: 'strictSchema',
          message: Locale.getMessage('object.schema'),
          params: { extra: extraKeys },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'strictSchema', type: 'object', schemaType: 'boolean', validate: strictSchema, errors: true })
  }

  // ─── Array 验证器 ────────────────────────────────────────────────────────

  static registerArrayValidators(ajv: Ajv): void {
    // noSparse — 不允许稀疏数组
    const noSparse: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const arr = data as unknown[]
      if (schema) {
        for (let i = 0; i < arr.length; i++) {
          if (!(i in arr)) {
            noSparse.errors = [{
              keyword: 'noSparse',
              message: Locale.getMessage('array.sparse'),
              params: { index: i },
            }]
            return false
          }
        }
      }
      return true
    }
    ajv.addKeyword({ keyword: 'noSparse', type: 'array', schemaType: 'boolean', validate: noSparse, errors: true })

    // includesRequired — 必须包含指定元素
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
          message: Locale.getMessage('array.includesRequired'),
          params: { missing },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'includesRequired', type: 'array', schemaType: 'array', validate: includesRequired, errors: true })
  }

  // ─── Date 验证器 ─────────────────────────────────────────────────────────

  static registerDateValidators(ajv: Ajv): void {
    const DATE_FORMATS: Record<string, RegExp> = {
      'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
      'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/,
      'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
      'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
      'ISO8601':    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    }

    // dateFormat
    const dateFormat: ValidateFnWithErrors = (schema: unknown, data: unknown): boolean => {
      const fmt = String(schema)
      const pattern = DATE_FORMATS[fmt]
      if (!pattern || !pattern.test(String(data))) {
        dateFormat.errors = [{
          keyword: 'dateFormat',
          message: Locale.getMessage('date.format'),
          params: { format: schema },
        }]
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
          message: Locale.getMessage('date.greater'),
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
          message: Locale.getMessage('date.less'),
          params: { limit: schema },
        }]
        return false
      }
      return true
    }
    ajv.addKeyword({ keyword: 'dateLess', type: 'string', schemaType: 'string', validate: dateLess, errors: true })
  }
}
