import type { ErrorMessages } from './error.js'

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  /** 最大缓存条目数（默认 100）*/
  maxSize?: number
  /** 缓存过期时间（毫秒，0 表示不过期）*/
  ttl?: number
  /** 是否启用缓存 */
  enabled?: boolean
  /** 是否启用统计（默认 false）*/
  statsEnabled?: boolean
}

/**
 * I18n 配置类型
 */
export type I18nConfig =
  | string                          // 语言包目录路径（Node >=18：.js/.cjs/.json/.jsonc/.json5）
  | Record<string, ErrorMessages>   // 内联语言包
  | { localesPath: string }         // 语言包目录对象形式（Node >=18：.js/.cjs/.json/.jsonc/.json5）
  | { locales: Record<string, ErrorMessages> } // v1/文档兼容包装层

/**
 * dsl.config() 选项
 */
export interface DslConfigOptions {
  /** 国际化配置 */
  i18n?: I18nConfig
  /** 缓存配置 */
  cache?: CacheOptions
  /** 自定义验证规则扩展 */
  patterns?: {
    phone?: Record<string, RegExp>
    idCard?: Record<string, RegExp>
    creditCard?: Record<string, RegExp>
    [key: string]: Record<string, RegExp> | undefined
  }
  /** 默认语言（默认 'zh-CN'）*/
  defaultLocale?: string
}

/**
 * ValidatorOptions（Validator 类构造参数）
 */
export interface ValidatorOptions {
  allErrors?: boolean
  strict?: boolean
  coerceTypes?: boolean
  removeAdditional?: boolean | 'all' | 'failing'
  useDefaults?: boolean
}
