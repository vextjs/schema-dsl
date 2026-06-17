import type { ErrorMessages } from '../types/error.js'
import type {
  SchemaDslMessageProvider,
  SchemaDslMessageRequest,
  SchemaDslMessageValue,
  SchemaDslRuntimeConfigureMode,
  SchemaDslRuntimeValidateOptions,
} from '../types/runtime.js'
import { DEFAULT_LOCALE } from './Locale.js'
import { renderTemplate } from './TemplateEngine.js'
import { getMessages } from '../locales/index.js'

export interface RuntimeIssueFormatterOptions {
  locale?: string
  messages?: Record<string, SchemaDslMessageValue>
  messageProvider?: SchemaDslMessageProvider
}

export type RuntimeIssueSource = SchemaDslMessageRequest['source']

function messageToText(value: SchemaDslMessageValue | null | undefined): string | undefined {
  if (value == null) return undefined
  return typeof value === 'string' ? value : value.message
}

function messageToCode(value: SchemaDslMessageValue | null | undefined, fallbackKey: string): string | number {
  if (value && typeof value === 'object') return value.code ?? fallbackKey
  return fallbackKey
}

function flattenMessages(messages: Record<string, SchemaDslMessageValue>): ErrorMessages {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [key, messageToText(value)])
  ) as ErrorMessages
}

export class RuntimeIssueFormatter {
  private defaultLocale: string
  private defaultMessages: Record<string, SchemaDslMessageValue>
  private defaultMessageProvider: SchemaDslMessageProvider | undefined

  constructor(options: RuntimeIssueFormatterOptions = {}) {
    this.defaultLocale = options.locale ?? DEFAULT_LOCALE
    this.defaultMessages = { ...(options.messages ?? {}) }
    this.defaultMessageProvider = options.messageProvider
  }

  configure(options: RuntimeIssueFormatterOptions = {}, mode: SchemaDslRuntimeConfigureMode = 'merge'): void {
    if (mode === 'reset' || mode === 'replace') {
      this.defaultLocale = DEFAULT_LOCALE
      this.defaultMessages = {}
      this.defaultMessageProvider = undefined
    }

    if (options.locale !== undefined) this.defaultLocale = options.locale
    if (options.messages !== undefined) {
      this.defaultMessages = mode === 'merge'
        ? { ...this.defaultMessages, ...options.messages }
        : { ...options.messages }
    }
    if ('messageProvider' in options) {
      this.defaultMessageProvider = options.messageProvider
    }
  }

  dispose(): void {
    this.defaultLocale = DEFAULT_LOCALE
    this.defaultMessages = {}
    this.defaultMessageProvider = undefined
  }

  getStats(): { locale: string; messageKeyCount: number } {
    return {
      locale: this.defaultLocale,
      messageKeyCount: Object.keys(this.defaultMessages).length,
    }
  }

  getLocale(options: SchemaDslRuntimeValidateOptions = {}): string {
    return options.locale ?? this.defaultLocale
  }

  getMessageTable(options: SchemaDslRuntimeValidateOptions = {}): ErrorMessages {
    const locale = this.getLocale(options)
    const rawLocaleMessages = getMessages(locale) as Record<string, SchemaDslMessageValue>
    const provider = options.messageProvider ?? this.defaultMessageProvider
    const providerMessages = provider
      ? Object.fromEntries(
        Object.entries(rawLocaleMessages).map(([key, fallback]) => {
          const provided = provider({ key, params: {}, locale, source: 'ajv', fallback })
          return [key, provided ?? fallback]
        })
      ) as Record<string, SchemaDslMessageValue>
      : rawLocaleMessages
    return flattenMessages({
      ...providerMessages,
      ...this.defaultMessages,
      ...(options.messages ?? {}),
    })
  }

  resolveValue(
    key: string,
    params: Record<string, unknown> = {},
    options: SchemaDslRuntimeValidateOptions = {},
    source: RuntimeIssueSource = 'runtime',
    fallback?: SchemaDslMessageValue
  ): SchemaDslMessageValue {
    const locale = this.getLocale(options)
    const messages = {
      ...this.defaultMessages,
      ...(options.messages ?? {}),
    }
    const direct = messages[key]
    if (direct !== undefined) return direct

    const localeMessages = getMessages(locale) as Record<string, SchemaDslMessageValue>
    const localeFallback = localeMessages[key] ?? fallback
    const provider = options.messageProvider ?? this.defaultMessageProvider
    const provided = provider?.({ key, params, locale, source, fallback: localeFallback })
    if (provided !== null && provided !== undefined) return provided

    return localeFallback ?? key
  }

  resolveText(
    key: string,
    params: Record<string, unknown> = {},
    options: SchemaDslRuntimeValidateOptions = {},
    source: RuntimeIssueSource = 'runtime',
    fallback?: SchemaDslMessageValue
  ): string {
    const value = this.resolveValue(key, params, options, source, fallback)
    return renderTemplate(messageToText(value) ?? key, params)
  }

  resolveCode(
    key: string,
    params: Record<string, unknown> = {},
    options: SchemaDslRuntimeValidateOptions = {},
    source: RuntimeIssueSource = 'runtime',
    fallback?: SchemaDslMessageValue
  ): string | number {
    const value = this.resolveValue(key, params, options, source, fallback)
    return messageToCode(value, key)
  }
}
