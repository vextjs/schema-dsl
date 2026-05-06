import type { ValidationErrorItem } from '../types/validate.js'
import type { ErrorMessages } from '../types/error.js'
import { renderTemplate } from './TemplateEngine.js'
import { KEYWORD_MAP } from './ErrorCodes.js'
import { getMessages } from '../locales/index.js'
import type { LocaleMessage } from '../locales/types.js'

type AjvRawError = {
  keyword: string
  instancePath: string
  schemaPath?: string
  params: Record<string, unknown>
  message?: string
  data?: unknown
  parentSchema?: Record<string, unknown>
  schema?: unknown
}

/**
 * 错误格式化器
 * 委托 TemplateEngine.renderTemplate() 实现模板插值（修复 CORE-03）
 * 保持 v1 API 完全兼容
 */
export class ErrorFormatter {
  private messages: ErrorMessages
  private _locale: string

  constructor(locale = 'zh-CN', messages: ErrorMessages = {}) {
    this._locale = locale
    // Load locale messages as defaults; constructor-level custom messages override them
    const rawLocaleMessages = getMessages(locale)
    const localeMessages: ErrorMessages = Object.fromEntries(
      Object.entries(rawLocaleMessages).map(([k, v]: [string, LocaleMessage]) => [
        k,
        typeof v === 'string' ? v : (v as { message: string }).message,
      ])
    )
    this.messages = { ...localeMessages, ...messages }
  }

  get locale(): string {
    return this._locale
  }

  /**
   * 格式化单个错误对象 → 消息字符串（v1 API）
   */
  format(error: AjvRawError | Record<string, unknown>, locale?: string): string {
    // If locale differs, reload messages for that locale
    let msgs = this.messages
    if (locale && locale !== this._locale) {
      const rawLocaleMessages = getMessages(locale)
      const localeMessages: ErrorMessages = Object.fromEntries(
        Object.entries(rawLocaleMessages).map(([k, v]: [string, LocaleMessage]) => [
          k,
          typeof v === 'string' ? v : (v as { message: string }).message,
        ])
      )
      msgs = { ...localeMessages }
    }

    // Convert simple { type, path } format to AJV-like error
    const raw = error as Record<string, unknown>
    const ajvError = {
      keyword: (raw['keyword'] as string) ?? (raw['type'] as string) ?? 'validation',
      instancePath: (raw['instancePath'] as string) ?? ('/' + (raw['path'] ?? '')),
      params: (raw['params'] as Record<string, unknown>) ?? {},
      parentSchema: raw['parentSchema'] as Record<string, unknown> | undefined,
    } as AjvRawError
    const item = this._formatOne(ajvError, msgs, locale)
    return item.message
  }

  /**
   * 格式化 AJV 原始错误数组 → ValidationErrorItem[]
   *
   * @param alreadyMerged - 当为 true 时，customMessages 已是完整的 locale+自定义合并结果，
   *   跳过 { ...this.messages, ...customMessages } 展开（避免 100+ key 的冷展开）
   */
  formatDetailed(
    errors: AjvRawError[],
    locale?: string,
    customMessages?: ErrorMessages,
    alreadyMerged = false
  ): ValidationErrorItem[] {
    const msgs = customMessages
      ? (alreadyMerged ? customMessages : { ...this.messages, ...customMessages })
      : this.messages

    // 过滤包装错误（if/anyOf/oneOf）当存在具体字段错误时
    const hasConcreteErrors = errors.some(
      e => e.keyword !== 'if' && e.keyword !== 'anyOf' && e.keyword !== 'oneOf' && e.keyword !== 'error'
    )
    const filtered = hasConcreteErrors
      ? errors.filter(e => e.keyword !== 'if' && e.keyword !== 'anyOf' && e.keyword !== 'oneOf')
      : errors

    return filtered.map(err => this._formatOne(err, msgs, locale))
  }

  /**
   * 格式化单个错误
   */
  private _formatOne(
    err: AjvRawError,
    messages: ErrorMessages,
    _locale?: string
  ): ValidationErrorItem {
    const keyword = err.keyword ?? 'validation'
    const instancePath = err.instancePath ?? ''
    const params = err.params ?? {} as Record<string, unknown>

    // 字段路径计算（required 错误特殊处理）
    let fieldName: string
    if (keyword === 'required' && params['missingProperty']) {
      const parentPath = instancePath.replace(/^\//, '')
      const missing = String(params['missingProperty'])
      fieldName = parentPath ? `${parentPath}/${missing}` : missing
    } else {
      fieldName = instancePath.replace(/^\//, '') || 'value'
    }

    // label 计算
    const schema = (err.parentSchema ?? {}) as Record<string, unknown>
    let label: string | undefined

    // For required errors, get label from the specific property schema
    if (keyword === 'required' && params['missingProperty']) {
      const missingProp = String(params['missingProperty'])
      const properties = schema['properties'] as Record<string, Record<string, unknown>> | undefined
      if (properties && properties[missingProp]) {
        label = properties[missingProp]['_label'] as string | undefined
      }
    }

    // Fallback to parent schema label
    if (!label) {
      label = schema['_label'] as string | undefined
    }

    // If _label is set, try to translate it as a locale key reference
    if (label) {
      label = (messages[label] != null ? String(messages[label]) : undefined) ?? label
    }

    if (!label) {
      let labelKey: string
      if (keyword === 'required' && params['missingProperty']) {
        labelKey = String(params['missingProperty'])
      } else {
        const parts = fieldName.split('/')
        labelKey = parts[parts.length - 1] ?? fieldName
      }
      const autoKey = `label.${labelKey.replace(/\//g, '.')}`
      label = messages[autoKey] ?? labelKey
    }

    // schema 级自定义消息
    let schemaCustomMessages = (schema['_customMessages'] ?? {}) as ErrorMessages

    // For required errors, also check field-level custom messages
    if (keyword === 'required' && params['missingProperty']) {
      const missingProp = String(params['missingProperty'])
      const properties = schema['properties'] as Record<string, Record<string, unknown>> | undefined
      if (properties && properties[missingProp] && properties[missingProp]['_customMessages']) {
        schemaCustomMessages = { ...schemaCustomMessages, ...(properties[missingProp]['_customMessages'] as ErrorMessages) }
      }
    }

    // 性能优化：schemaCustomMessages 为空时（99% 场景）直接复用 messages，避免 100+ key 的对象展开
    const hasCustomMessages = Object.keys(schemaCustomMessages).length > 0
    const mergedMessages = hasCustomMessages ? { ...messages, ...schemaCustomMessages } : messages
    const mappedKeyword = KEYWORD_MAP[keyword] ?? keyword
    const schemaType = typeof schema['type'] === 'string' ? schema['type'] : 'string'

    // 消息查找：schema 自定义 > 类型+关键字 > 关键字 > fallback
    let message: string | undefined = hasCustomMessages
      ? (schemaCustomMessages[keyword] ?? schemaCustomMessages[mappedKeyword])
      : undefined

    if (message) {
      // 可能是键引用，尝试从 mergedMessages 查找
      message = mergedMessages[message] ?? message
    } else {
      // format.email 等特殊处理
      if (mappedKeyword === 'format' && params['format']) {
        let fmt = String(params['format'])
        if (fmt === 'uri') fmt = 'url'
        message = mergedMessages[`format.${fmt}`]
      }
      message ??=
        mergedMessages[`${schemaType}.${keyword}`] ??
        mergedMessages[`${schemaType}.${mappedKeyword}`] ??
        mergedMessages[mappedKeyword] ??
        mergedMessages[keyword] ??
        mergedMessages['default'] ??
        err.message ??
        'Validation error'
    }

    // 插值参数：先 spread params，再覆盖固定键（保持原有行为）
    const limit = params['limit'] ?? params['limitLength'] ?? params['comparison'] ?? ''
    const allowedVals = Array.isArray(params['allowedValues'])
      ? (params['allowedValues'] as unknown[]).join(', ')
      : undefined
    const interpolateData: Record<string, unknown> = {
      ...params,
      path: label,
      label,
      value: err.data !== undefined ? err.data : '',
      limit,
      min: limit,
      max: limit,
      expected: params['type'],
      actual:
        err.data === null
          ? 'null'
          : err.data === undefined
            ? 'undefined'
            : Array.isArray(err.data)
              ? 'array'
              : typeof err.data,
      valids: allowedVals,
      allowed: allowedVals,
      key: params['additionalProperty'],
    }

    const rendered = renderTemplate(message, interpolateData)

    return {
      path: fieldName,
      message: rendered,
      keyword,
      params,
      field: fieldName,
      type: keyword,
      expected: params['type'] !== undefined ? String(params['type']) : undefined,
    }
  }

  setLocale(locale: string): void {
    this._locale = locale
    const rawLocaleMessages = getMessages(locale)
    const localeMessages: ErrorMessages = Object.fromEntries(
      Object.entries(rawLocaleMessages).map(([k, v]: [string, LocaleMessage]) => [
        k,
        typeof v === 'string' ? v : (v as { message: string }).message,
      ])
    )
    this.messages = { ...localeMessages }
  }

  addMessage(type: string, template: string): void {
    this.messages[type] = template
  }

  addMessages(messages: ErrorMessages): void {
    Object.assign(this.messages, messages)
  }
}
