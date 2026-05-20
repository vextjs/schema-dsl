import type { LocaleKey, LocaleMessage, LocaleMessages } from './types.js'
import zhCN from './zh-CN.js'
import enUS from './en-US.js'
import jaJP from './ja-JP.js'
import esES from './es-ES.js'
import frFR from './fr-FR.js'

export type { LocaleKey, LocaleMessage, LocaleMessages }

// ─── Supported locale registry ─────────────────────────────────────────────────────────
const LOCALES: Readonly<Record<string, LocaleMessages>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'es-ES': esES,
  'fr-FR': frFR,
}

/** Default locale (global fallback base) */
const DEFAULT_LOCALE = 'zh-CN'

/** en-US acts as secondary fallback (used when any locale is missing a key) */
const FALLBACK_LOCALE = 'en-US'

/**
 * Look up a locale message entry (with fallback chain).
 *
 * Fallback chain: locale → zh-CN (if locale ≠ zh-CN) → en-US → key itself
 */
export function getMessage(
  key: LocaleKey,
  locale: string = DEFAULT_LOCALE
): LocaleMessage {
  const messages = LOCALES[locale]
  if (messages && key in messages) {
    return messages[key]
  }

  // Primary fallback: zh-CN
  if (locale !== DEFAULT_LOCALE) {
    const defaultMessages = LOCALES[DEFAULT_LOCALE]
    if (defaultMessages && key in defaultMessages) {
      return defaultMessages[key]
    }
  }

  // Secondary fallback: en-US
  const fallbackMessages = LOCALES[FALLBACK_LOCALE]
  if (fallbackMessages && key in fallbackMessages) {
    return fallbackMessages[key]
  }

  // Final fallback: return the key itself (never returns undefined)
  return key
}

/**
 * Get the resolved string for a message (unwraps {code, message} object format).
 */
export function getMessageString(
  key: LocaleKey,
  locale: string = DEFAULT_LOCALE
): string {
  const msg = getMessage(key, locale)
  if (typeof msg === 'string') return msg
  return msg.message
}

/**
 * Get the error code of a message (if the value is a {code, message} object).
 */
export function getMessageCode(
  key: LocaleKey,
  locale: string = DEFAULT_LOCALE
): string | number | undefined {
  const msg = getMessage(key, locale)
  if (typeof msg === 'object') return msg.code
  return undefined
}

/**
 * Get the complete message map for the given locale.
 */
export function getMessages(locale: string = DEFAULT_LOCALE): LocaleMessages {
  return LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE]!
}

/**
 * Check whether a locale is supported.
 */
export function isSupportedLocale(locale: string): boolean {
  return locale in LOCALES
}

/**
 * Get all supported locale codes.
 */
export function getSupportedLocales(): string[] {
  return Object.keys(LOCALES)
}

export { zhCN, enUS, jaJP, esES, frFR }
export default LOCALES
