import type { ErrorCodeMap } from '../types/error.js'

/**
 * Error code constants.
 * Defines all built-in error codes used by ErrorFormatter and Locale.
 */
export const ErrorCodes: ErrorCodeMap = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
  // Configuration errors
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_LOCALE: 'INVALID_LOCALE',
  // Plugin errors
  PLUGIN_INSTALL_ERROR: 'PLUGIN_INSTALL_ERROR',
  PLUGIN_NOT_FOUND: 'PLUGIN_NOT_FOUND',
}

/**
 * Error type → short code mapping (maps AJV keywords to schema-dsl shorthand).
 */
export const KEYWORD_MAP: Record<string, string> = {
  minLength: 'min',
  maxLength: 'max',
  minimum: 'min',
  maximum: 'max',
  minItems: 'min',
  maxItems: 'max',
  exclusiveMinimum: 'min',
  exclusiveMaximum: 'max',
  pattern: 'pattern',
  format: 'format',
  required: 'required',
  enum: 'enum',
  type: 'type',
  uniqueItems: 'uniqueItems',
  additionalProperties: 'additionalProperties',
}
