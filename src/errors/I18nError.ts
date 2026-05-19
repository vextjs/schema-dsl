import { renderTemplate } from '../core/TemplateEngine.js'
import { Locale } from '../core/Locale.js'

// V8/Node.js extension
type ErrorWithCaptureStackTrace = typeof Error & {
  captureStackTrace?: (target: object, ctor: unknown) => void
}
const ErrorCtor = Error as ErrorWithCaptureStackTrace

type ParamsOrLocale = Record<string, unknown> | string | null | undefined

function normalizeParams(
  paramsOrLocale: ParamsOrLocale,
  statusCode?: unknown,
  locale?: unknown
): { params: Record<string, unknown>; statusCode: number; locale: string | null } {
  let params: Record<string, unknown> = {}
  let actualStatusCode = 400
  let actualLocale: string | null = null

  if (typeof paramsOrLocale === 'string') {
    actualLocale = paramsOrLocale
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400
  } else if (paramsOrLocale && typeof paramsOrLocale === 'object' && !Array.isArray(paramsOrLocale)) {
    params = paramsOrLocale
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400
    actualLocale = typeof locale === 'string' ? locale : null
  } else {
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400
    actualLocale = typeof locale === 'string' ? locale : null
  }

  return { params, statusCode: actualStatusCode, locale: actualLocale }
}

/**
 * Internationalised error class.
 * Maintains full v1 API compatibility: create / throw / assert / is / toJSON / toString
 */
export class I18nError extends Error {
  readonly name = 'I18nError' as const
  readonly originalKey: string
  readonly code: string | number
  readonly params: Record<string, unknown>
  readonly statusCode: number
  readonly locale: string | null

  constructor(
    key: string,
    params: Record<string, unknown> = {},
    statusCode = 400,
    locale: string | null = null,
    /** Internal: pre-resolved message template, bypasses Locale lookup (used to decouple init ordering). */
    _resolvedTemplate?: string,
    _resolvedCode?: string | number
  ) {
    const targetLocale = locale ?? Locale.getLocale()
    const normalizedParams: Record<string, unknown> = (params !== null && params !== undefined) ? params : {}

    // Look up locale message config if not pre-resolved
    let template: string
    let resolvedCode: string | number
    if (_resolvedTemplate !== undefined) {
      template = _resolvedTemplate
      resolvedCode = _resolvedCode ?? key
    } else {
      const msgConfig = Locale.getMessageConfig(key, {}, targetLocale)
      if (typeof msgConfig === 'object' && msgConfig !== null && 'message' in msgConfig) {
        template = (msgConfig as { message: string }).message
        resolvedCode = (msgConfig as { code?: string | number }).code ?? key
      } else if (typeof msgConfig === 'string') {
        template = msgConfig
        resolvedCode = key
      } else {
        template = key
        resolvedCode = key
      }
    }

    const message = renderTemplate(template, normalizedParams)

    super(message)

    this.originalKey = key
    this.code = resolvedCode
    this.params = normalizedParams
    this.statusCode = statusCode
    this.locale = targetLocale

    if (ErrorCtor.captureStackTrace) {
      ErrorCtor.captureStackTrace(this, I18nError)
    }
  }

  /** Factory method — create an error instance. */
  static create(
    code: string,
    paramsOrLocale?: ParamsOrLocale,
    statusCode?: number,
    locale?: string
  ): I18nError {
    const normalized = normalizeParams(paramsOrLocale, statusCode, locale)
    return new I18nError(code, normalized.params, normalized.statusCode, normalized.locale)
  }

  /** Factory method — create and throw an error. */
  static throw(
    code: string,
    paramsOrLocale?: ParamsOrLocale,
    statusCode?: number,
    locale?: string
  ): never {
    const normalized = normalizeParams(paramsOrLocale, statusCode, locale)
    throw new I18nError(code, normalized.params, normalized.statusCode, normalized.locale)
  }

  /** Assert — throw when condition is falsy. */
  static assert(
    condition: unknown,
    code: string,
    paramsOrLocale?: ParamsOrLocale,
    statusCode?: number,
    locale?: string
  ): asserts condition {
    if (!condition) {
      const normalized = normalizeParams(paramsOrLocale, statusCode, locale)
      throw new I18nError(code, normalized.params, normalized.statusCode, normalized.locale)
    }
  }

  /** Check whether the error matches the given code or original key. */
  is(codeOrKey: string | number): boolean {
    return this.code === codeOrKey || this.originalKey === codeOrKey
  }

  toJSON(): {
    error: string
    originalKey: string
    code: string | number
    message: string
    params: Record<string, unknown>
    statusCode: number
    locale: string | null
  } {
    return {
      error: this.name,
      originalKey: this.originalKey,
      code: this.code,
      message: this.message,
      params: this.params,
      statusCode: this.statusCode,
      locale: this.locale,
    }
  }

  toString(): string {
    return `${this.name} [${this.code}]: ${this.message}`
  }
}
