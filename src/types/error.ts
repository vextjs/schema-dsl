/**
 * Error message templates (custom validation error copy).
 */
export interface ErrorMessages {
  // Length / range (v1.0.3+ recommends min/max over minLength/maximum etc.)
  min?: string
  max?: string
  minLength?: string
  maxLength?: string
  minimum?: string
  maximum?: string
  minItems?: string
  maxItems?: string
  // Types
  type?: string
  string?: string
  number?: string
  integer?: string
  boolean?: string
  array?: string
  object?: string
  // Formats
  email?: string
  url?: string
  date?: string
  dateTime?: string
  uuid?: string
  ipv4?: string
  ipv6?: string
  // Other
  pattern?: string
  format?: string
  required?: string
  enum?: string
  uniqueItems?: string
  // Custom keywords
  exactLength?: string
  phone?: string
  idCard?: string
  creditCard?: string
  // Extensible
  [key: string]: string | undefined
}

/**
 * v1-compatible locale message value.
 */
export type ErrorMessageConfig = string | { code?: string | number; message: string }

/**
 * v1-compatible locale message bundle.
 */
export type LocaleMessages = Record<string, ErrorMessageConfig>

/**
 * Error code constant type (shape of the ErrorCodes object).
 */
export interface ErrorCodeMap {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR'
  INVALID_SCHEMA: 'INVALID_SCHEMA'
  // Config errors
  INVALID_CONFIG: 'INVALID_CONFIG'
  INVALID_LOCALE: 'INVALID_LOCALE'
  // Plugin errors
  PLUGIN_INSTALL_ERROR: 'PLUGIN_INSTALL_ERROR'
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND'
  // Extensible
  [key: string]: string
}
