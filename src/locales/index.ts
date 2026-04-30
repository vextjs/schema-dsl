import type { LocaleKey, LocaleMessage, LocaleMessages } from './types.js'
import zhCN from './zh-CN.js'
import enUS from './en-US.js'
import jaJP from './ja-JP.js'
import esES from './es-ES.js'
import frFR from './fr-FR.js'

export type { LocaleKey, LocaleMessage, LocaleMessages }

// ─── 支持的语言包注册表 ─────────────────────────────────────────────────────────
const LOCALES: Readonly<Record<string, LocaleMessages>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
  'es-ES': esES,
  'fr-FR': frFR,
}

/** 默认语言（全局 fallback 基准）*/
const DEFAULT_LOCALE = 'zh-CN'

/** en-US 作为二级 fallback（所有语言包缺 key 时兜底）*/
const FALLBACK_LOCALE = 'en-US'

/**
 * 获取指定语言的消息条目（含 fallback 链）
 *
 * fallback 链：locale → zh-CN（若 locale 非 zh-CN）→ en-US → key 本身
 */
export function getMessage(
  key: LocaleKey,
  locale: string = DEFAULT_LOCALE
): LocaleMessage {
  const messages = LOCALES[locale]
  if (messages && key in messages) {
    return messages[key]
  }

  // 一级 fallback：zh-CN
  if (locale !== DEFAULT_LOCALE) {
    const defaultMessages = LOCALES[DEFAULT_LOCALE]
    if (defaultMessages && key in defaultMessages) {
      return defaultMessages[key]
    }
  }

  // 二级 fallback：en-US
  const fallbackMessages = LOCALES[FALLBACK_LOCALE]
  if (fallbackMessages && key in fallbackMessages) {
    return fallbackMessages[key]
  }

  // 最终 fallback：返回 key 本身（永不 undefined）
  return key
}

/**
 * 获取消息的最终字符串（展开 {code, message} 对象格式）
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
 * 获取消息的错误 code（若存在 {code, message} 格式）
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
 * 获取指定语言的完整消息表
 */
export function getMessages(locale: string = DEFAULT_LOCALE): LocaleMessages {
  return LOCALES[locale] ?? LOCALES[DEFAULT_LOCALE]!
}

/**
 * 检查语言是否受支持
 */
export function isSupportedLocale(locale: string): boolean {
  return locale in LOCALES
}

/**
 * 获取所有支持的语言代码
 */
export function getSupportedLocales(): string[] {
  return Object.keys(LOCALES)
}

export { zhCN, enUS, jaJP, esES, frFR }
export default LOCALES
