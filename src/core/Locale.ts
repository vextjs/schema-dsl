import type { LocaleKey, LocaleMessage } from '../locales/types.js'
import { getMessage, getMessages, isSupportedLocale, getSupportedLocales } from '../locales/index.js'

/**
 * Locale — 全局语言管理器（静态类）
 *
 * 修复 CK-01：getMessage 统一返回 string（v1 返回 string | {code, message}，不一致）
 *
 * v2 语义：
 *   - getMessage() → 总是返回 string（最终消息文本）
 *   - getMessageConfig() → 返回原始 LocaleMessage（含 code 对象格式，供 I18nError 用）
 */
export class Locale {
  private static _currentLocale: string = 'zh-CN'
  private static _customMessages: Record<string, LocaleMessage> = {}

  /** v1 compat: expose custom messages */
  static get customMessages(): Record<string, LocaleMessage> {
    return this._customMessages
  }

  /** v1 compat: expose all locales as { locale: messages } map */
  static get locales(): Record<string, Record<string, LocaleMessage>> {
    const result: Record<string, Record<string, LocaleMessage>> = {}
    // Built-in locales
    for (const locale of getSupportedLocales()) {
      result[locale] = getMessages(locale) as Record<string, LocaleMessage>
    }
    // Custom locales added via addLocale
    for (const key of Object.keys(this._customMessages)) {
      if (key.includes(':')) {
        const colonIdx = key.indexOf(':')
        const locale = key.substring(0, colonIdx)
        const msgKey = key.substring(colonIdx + 1)
        if (!result[locale]) result[locale] = {}
        result[locale][msgKey] = this._customMessages[key]
      }
    }
    return result
  }

  // ─── 语言切换 ──────────────────────────────────────────────────────────────

  static setLocale(locale: string): void {
    this._currentLocale = locale
  }

  static getLocale(): string {
    return this._currentLocale
  }

  // ─── 自定义消息（全局覆盖）────────────────────────────────────────────────

  static setMessages(messages: Record<string, LocaleMessage>): void {
    this._customMessages = { ...this._customMessages, ...messages }
  }

  static addLocale(locale: string, messages: Record<string, LocaleMessage>): void {
    // 在运行时动态添加语言包（合并到现有条目）
    // 使用 locales/index.ts 的 addLocale 机制即可
    // 此处记录到 customMessages 并在查找时优先使用
    for (const [k, v] of Object.entries(messages)) {
      this._customMessages[`${locale}:${k}`] = v
    }
  }

  static getAvailableLocales(): string[] {
    return getSupportedLocales()
  }

  static isSupportedLocale(locale: string): boolean {
    return isSupportedLocale(locale)
  }

  // ─── 核心查询方法 ─────────────────────────────────────────────────────────

  /**
   * 获取消息字符串（CK-01 修复：始终返回 string）
   *
   * 优先级: 自定义消息 > 语言包 > ErrorCodes > key 本身
   */
  static getMessage(
    type: string,
    customMessages: Record<string, LocaleMessage> = {},
    locale: string | null = null
  ): string {
    const targetLocale = locale ?? this._currentLocale

    // 1. 调用方传入的自定义消息（最高优先级）
    const callerMsg = customMessages[type]
    if (callerMsg !== undefined) {
      return this._toStr(callerMsg)
    }

    // 2. 全局自定义消息 (setMessages — 优先于语言包 addLocale)
    const globalMsg = this._customMessages[type]
    if (globalMsg !== undefined) {
      return this._toStr(globalMsg)
    }

    // 3. 语言包自定义消息 (addLocale)
    const globalLocaleMsg = this._customMessages[`${targetLocale}:${type}`]
    if (globalLocaleMsg !== undefined) {
      return this._toStr(globalLocaleMsg)
    }

    // 3. 语言包查找（含 fallback 链）
    if (this._isLocaleKey(type)) {
      const msg = getMessage(type as LocaleKey, targetLocale)
      return this._toStr(msg)
    }

    // 4. ErrorCodes — 尝试从语言包作为 fallback key 查找
    // 5. 最终 fallback：原字符串（兼容硬编码消息）
    return type
  }

  /**
   * 获取消息原始配置（供 I18nError 使用，可含 code）
   */
  static getMessageConfig(
    type: string,
    customMessages: Record<string, LocaleMessage> = {},
    locale: string | null = null
  ): LocaleMessage {
    const targetLocale = locale ?? this._currentLocale

    const callerMsg = customMessages[type]
    if (callerMsg !== undefined) return callerMsg

    const globalMsg = this._customMessages[`${targetLocale}:${type}`] ?? this._customMessages[type]
    if (globalMsg !== undefined) return globalMsg

    if (this._isLocaleKey(type)) {
      return getMessage(type as LocaleKey, targetLocale)
    }

    return { code: type, message: type }
  }

  /**
   * 获取指定语言的完整消息表（内置 + 自定义）
   */
  static getMessages(locale?: string): Record<string, LocaleMessage> {
    const targetLocale = locale ?? this._currentLocale
    const builtinMessages = getMessages(targetLocale) as Record<string, LocaleMessage>
    // Merge custom messages added via addLocale/setMessages for this locale
    const customForLocale: Record<string, LocaleMessage> = {}
    for (const [k, v] of Object.entries(this._customMessages)) {
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
   * 重置（测试用）
   */
  static reset(): void {
    this._currentLocale = 'zh-CN'
    this._customMessages = {}
  }

  // ─── 私有辅助 ─────────────────────────────────────────────────────────────

  private static _toStr(msg: LocaleMessage): string {
    if (typeof msg === 'string') return msg
    return msg.message
  }

  private static _isLocaleKey(key: string): boolean {
    // 所有预定义的 locale key 都在语言包中
    const msgs = getMessages()
    return key in msgs
  }
}
