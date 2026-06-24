/**
 * Validation options.
 */
import type { CacheOptions } from './config.js'
import type { ErrorMessages } from './error.js'

export interface ValidateOptions {
  /** Whether to format errors (default true). */
  format?: boolean
  /** Whether to return all errors (default true; set false to keep only the first). */
  allErrors?: boolean
  /** Dynamically specify a locale (e.g. 'zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR'). */
  locale?: string
  /** Custom error messages. */
  messages?: ErrorMessages
  /** Whether to enable smart type coercion (auto-converts string → number etc.). */
  smartCoerce?: boolean
  /** Top-level convenience alias for disabling smart coercion. */
  coerce?: boolean
  /** Whether to remove additional properties. */
  removeAdditional?: boolean | 'all' | 'failing'
  /** Whether to enable caching. */
  cache?: boolean | CacheOptions
  /** Whether to enable strict mode. */
  strict?: boolean
  [key: string]: unknown
}

/**
 * Validation result.
 */
export interface ValidationResult<T = unknown> {
  /** Whether validation passed. */
  valid: boolean
  /** Snapshot of the data after validation (returned on both success and failure; useful for locating input on failure). */
  data?: T
  /** Error list (empty array on success; detailed errors on failure). */
  errors?: ValidationErrorItem[]
  /** First error message (convenience accessor). */
  errorMessage?: string
}

/**
 * Validation error item (element of ValidationResult.errors).
 */
export interface ValidationErrorItem {
  /** Error message. */
  message: string
  /** Error field path (dot-separated, e.g. 'user.email'). */
  path: string
  /** Validation keyword (min, max, email, pattern, etc.). */
  keyword: string
  /** Broad error category. */
  kind?: 'data' | 'schema' | 'custom' | 'conditional' | 'internal'
  /** Stable machine-readable error code. */
  code?: string
  /** Validation parameters. */
  params?: Record<string, unknown>
  /** Alias for path (backwards compatibility). */
  field?: string
  /** Alias for keyword (backwards-compatible with v1 err.type). */
  type?: string | undefined
  /** Expected type (backwards-compatible with v1 err.expected; only present for type errors). */
  expected?: string | undefined
}

/**
 * Raw AJV error object type (internal use).
 */
export interface AjvError {
  keyword: string
  instancePath: string
  schemaPath: string
  params: Record<string, unknown>
  message?: string
  data?: unknown
}
