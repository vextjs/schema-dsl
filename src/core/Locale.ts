import type { LocaleKey, LocaleMessage } from '../locales/types.js'
import { getMessage, getMessages, isSupportedLocale, getSupportedLocales } from '../locales/index.js'

export interface LocaleResolvedMessage {
  code: string | number
  message: string
}

/**
 * Locale — global locale manager (static class).
 *
 * v1 compatibility semantics:
 *   - getMessage() → returns { code, message } for every resolved message
 *   - getMessageText() → always returns final message text (used internally by v2)
 *   - getMessageConfig() → returns raw LocaleMessage (may contain code object; used by I18nError)
 */
export const DEFAULT_LOCALE = 'en-US'

interface LocaleState {
  currentLocale: string
  customMessages: Record<string, LocaleMessage>
  revision: number
}

const LOCALE_STATE_KEY = Symbol.for('schema-dsl.v2.Locale.state')
const localeHost = globalThis as typeof globalThis & Record<symbol, LocaleState | undefined>
const localeState = localeHost[LOCALE_STATE_KEY] ??= {
  currentLocale: DEFAULT_LOCALE,
  customMessages: {},
  revision: 0,
}

export class Locale {
  static get revision(): number {
    return localeState.revision
  }

  /** v1 compat: expose custom messages */
  static get customMessages(): Record<string, LocaleMessage> {
    return localeState.customMessages
  }

  /** v1 compat: expose all locales as { locale: messages } map */
  static get locales(): Record<string, Record<string, LocaleMessage>> {
    const result: Record<string, Record<string, LocaleMessage>> = {}
    // Built-in locales
    for (const locale of getSupportedLocales()) {
      result[locale] = getMessages(locale) as Record<string, LocaleMessage>
    }
    // Custom locales added via addLocale
    for (const key of Object.keys(localeState.customMessages)) {
      if (key.includes(':')) {
        const colonIdx = key.indexOf(':')
        const locale = key.substring(0, colonIdx)
        const msgKey = key.substring(colonIdx + 1)
        if (!result[locale]) result[locale] = {}
        result[locale][msgKey] = localeState.customMessages[key]
      }
    }
    return result
  }

  // ─── Locale Switching ─────────────────────────────────────────────────────

  static setLocale(locale: string): void {
    localeState.currentLocale = locale
  }

  static getLocale(): string {
    return localeState.currentLocale
  }

  // ─── Custom Messages (global override) ───────────────────────────────────

  static setMessages(messages: Record<string, LocaleMessage>): void {
    localeState.customMessages = { ...localeState.customMessages, ...messages }
    localeState.revision++
  }

  static addLocale(locale: string, messages: Record<string, LocaleMessage>): void {
    // Dynamically add a locale pack at runtime (merged into existing entries).
    // Records into customMessages and takes priority during lookup.
    for (const [k, v] of Object.entries(messages)) {
      localeState.customMessages[`${locale}:${k}`] = v
    }
    localeState.revision++
  }

  static getAvailableLocales(): string[] {
    return getSupportedLocales()
  }

  static isSupportedLocale(locale: string): boolean {
    return isSupportedLocale(locale)
  }

  // ─── Core Query Methods ───────────────────────────────────────────────────

  /**
   * Get a resolved message (v1 compat: returns { code, message } on hit).
   *
   * Priority: custom messages > locale pack > key itself.
   */
  static getMessage(
    type: string,
    customMessages: Record<string, LocaleMessage> = {},
    locale: string | null = null
  ): LocaleResolvedMessage | string {
    const resolved = this._resolveMessage(type, customMessages, locale)
    if (!resolved) return type
    return this._normalizeResolvedMessage(type, resolved)
  }

  /**
   * Get the final message text (used internally by v2 to avoid "[object Object]" in message field).
   */
  static getMessageText(
    type: string,
    customMessages: Record<string, LocaleMessage> = {},
    locale: string | null = null
  ): string {
    const resolved = this.getMessage(type, customMessages, locale)
    return typeof resolved === 'string' ? resolved : resolved.message
  }

  /**
   * Get raw message config (used by I18nError; may include a numeric code).
   */
  static getMessageConfig(
    type: string,
    customMessages: Record<string, LocaleMessage> = {},
    locale: string | null = null
  ): LocaleMessage {
    return this._resolveMessage(type, customMessages, locale) ?? { code: type, message: type }
  }

  /**
   * Get the full message table for the given locale (built-in + custom).
   */
  static getMessages(locale?: string): Record<string, LocaleMessage> {
    const targetLocale = locale ?? localeState.currentLocale
    const builtinMessages = getMessages(targetLocale) as Record<string, LocaleMessage>
    // Merge custom messages added via addLocale/setMessages for this locale
    const customForLocale: Record<string, LocaleMessage> = {}
    for (const [k, v] of Object.entries(localeState.customMessages)) {
      if (k.startsWith(`${targetLocale}:`)) {
        customForLocale[k.slice(targetLocale.length + 1)] = v
      } else if (!k.includes(':')) {
        // Global custom messages (no locale prefix)
        customForLocale[k] = v
      }
    }
    return { ...builtinMessages, ...customForLocale }
  }

  /**
   * Reset to defaults (for testing).
   */
  static reset(): void {
    localeState.currentLocale = DEFAULT_LOCALE
    localeState.customMessages = {}
    localeState.revision++
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private static _normalizeResolvedMessage(type: string, msg: LocaleMessage): LocaleResolvedMessage {
    if (typeof msg === 'string') {
      return { code: type, message: msg }
    }
    return {
      code: msg.code ?? type,
      message: msg.message,
    }
  }

  private static _resolveMessage(
    type: string,
    customMessages: Record<string, LocaleMessage>,
    locale: string | null
  ): LocaleMessage | null {
    const targetLocale = locale ?? localeState.currentLocale

    const callerMsg = customMessages[type]
    if (callerMsg !== undefined) return callerMsg

    const globalMsg = localeState.customMessages[type]
    if (globalMsg !== undefined) return globalMsg

    const globalLocaleMsg = localeState.customMessages[`${targetLocale}:${type}`]
    if (globalLocaleMsg !== undefined) return globalLocaleMsg

    if (this._isLocaleKey(type)) {
      return getMessage(type as LocaleKey, targetLocale)
    }

    return null
  }

  private static _isLocaleKey(key: string): boolean {
    // All predefined locale keys are defined in language pack files
    const msgs = getMessages()
    return key in msgs
  }
}
