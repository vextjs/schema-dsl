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
 * Error formatter.
 * Delegates template interpolation to TemplateEngine.renderTemplate() (fix CORE-03).
 * Maintains full v1 API compatibility.
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
   * Format a single error object → message string (v1 API).
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
   * Format an AJV raw error array → ValidationErrorItem[].
   *
   * @param alreadyMerged - when true, customMessages is already a fully merged locale+custom result;
   *   skip `{ ...this.messages, ...customMessages }` spread (avoids 100+ key cold-spread overhead).
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

    // Filter wrapper errors (if/anyOf/oneOf) when concrete field errors are present
    const hasConcreteErrors = errors.some(
      e => e.keyword !== 'if' && e.keyword !== 'anyOf' && e.keyword !== 'oneOf' && e.keyword !== 'error'
    )
    const filtered = hasConcreteErrors
      ? errors.filter(e => e.keyword !== 'if' && e.keyword !== 'anyOf' && e.keyword !== 'oneOf')
      : errors

    return filtered.map(err => this._formatOne(err, msgs, locale))
  }

  /**
   * Format a single error entry into a ValidationErrorItem.
   */
  private _formatOne(
    err: AjvRawError,
    messages: ErrorMessages,
    _locale?: string
  ): ValidationErrorItem {
    const keyword = err.keyword ?? 'validation'
    const instancePath = err.instancePath ?? ''
    const params = err.params ?? {} as Record<string, unknown>

    // Field path calculation (required errors get special handling)
    let fieldName: string
    if (keyword === 'required' && params['missingProperty']) {
      const parentPath = instancePath.replace(/^\//, '')
      const missing = String(params['missingProperty'])
      fieldName = parentPath ? `${parentPath}/${missing}` : missing
    } else {
      fieldName = instancePath.replace(/^\//, '') || 'value'
    }

    // Label resolution
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

    // Schema-level custom messages
    let schemaCustomMessages = (schema['_customMessages'] ?? {}) as ErrorMessages

    // For required errors, also check field-level custom messages
    if (keyword === 'required' && params['missingProperty']) {
      const missingProp = String(params['missingProperty'])
      const properties = schema['properties'] as Record<string, Record<string, unknown>> | undefined
      if (properties && properties[missingProp] && properties[missingProp]['_customMessages']) {
        schemaCustomMessages = { ...schemaCustomMessages, ...(properties[missingProp]['_customMessages'] as ErrorMessages) }
      }
    }

    // Performance: reuse `messages` directly when schemaCustomMessages is empty (99 % of calls)
    const hasCustomMessages = Object.keys(schemaCustomMessages).length > 0
    const mergedMessages = hasCustomMessages ? { ...messages, ...schemaCustomMessages } : messages
    const mappedKeyword = KEYWORD_MAP[keyword] ?? keyword
    const schemaType = typeof schema['type'] === 'string' ? schema['type'] : 'string'

    // Message lookup order: schema custom > type+keyword > keyword > fallback
    let message: string | undefined = hasCustomMessages
      ? (schemaCustomMessages[keyword] ?? schemaCustomMessages[mappedKeyword])
      : undefined

    if (message) {
      // May be a key reference — try to resolve from mergedMessages
      message = mergedMessages[message] ?? message
    } else {
      // Special handling for format.email etc.
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

    // Interpolation params: spread AJV params first, then override fixed keys
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
