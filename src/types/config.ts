import type { ErrorMessages } from './error.js'

/**
 * Cache configuration options.
 */
export interface CacheOptions {
  /** Maximum number of cache entries (default 5000). */
  maxSize?: number
  /** Cache TTL in milliseconds (0 = no expiry). */
  ttl?: number
  /** Whether caching is enabled. */
  enabled?: boolean
  /** Whether statistics are enabled (default true). */
  statsEnabled?: boolean
}

/**
 * I18n configuration type.
 */
export type I18nConfig =
  | string                          // Path to locale directory (Node >=18: .js/.cjs/.json/.jsonc/.json5)
  | Record<string, ErrorMessages>   // Inline locale bundle
  | { localesPath: string }         // Locale directory — object form (Node >=18: .js/.cjs/.json/.jsonc/.json5)
  | { locales: Record<string, ErrorMessages> } // v1/doc-compatible wrapper

/**
 * dsl.config() options.
 */
export interface DslConfigOptions {
  /** Internationalisation config. */
  i18n?: I18nConfig
  /** Cache config. */
  cache?: CacheOptions
  /** Custom validation rule extensions. */
  patterns?: {
    phone?: Record<string, RegExp>
    idCard?: Record<string, RegExp>
    creditCard?: Record<string, RegExp>
    [key: string]: Record<string, RegExp> | undefined
  }
  /** Default locale (default 'zh-CN'). */
  defaultLocale?: string
}

/**
 * ValidatorOptions (Validator class constructor parameters).
 */
export interface ValidatorOptions {
  allErrors?: boolean
  verbose?: boolean
  strict?: boolean
  coerceTypes?: boolean | 'array'
  removeAdditional?: boolean | 'all' | 'failing'
  useDefaults?: boolean
  cache?: boolean | CacheOptions
}
