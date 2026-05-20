/**
 * LocaleKey — union type of all locale message keys (118 keys)
 *
 * TypeScript compile-time completeness enforcement: every locale file must implement
 * the LocaleMessages interface; adding a new key causes a compiler error in all locales.
 */

// ─── Base message value type ──────────────────────────────────────────────────
/** A message is either a plain string or an object with code (v1.1.5+ format) */
export type LocaleMessage = string | { code: string | number; message: string }

// ─── Key union (for precise key inference in getMessage) ─────────────────────
export type LocaleKey =
  // Generic
  | 'required'
  | 'type'
  | 'min'
  | 'max'
  | 'length'
  | 'pattern'
  | 'enum'
  | 'custom'
  | 'circular'
  | 'max-depth'
  | 'exception'
  // Conditional
  | 'conditional.underAge'
  | 'conditional.blocked'
  | 'conditional.notAllowed'
  // I18nError — generic
  | 'error.notFound'
  | 'error.forbidden'
  | 'error.unauthorized'
  | 'error.invalid'
  | 'error.duplicate'
  | 'error.conflict'
  // Account
  | 'account.notFound'
  | 'account.inactive'
  | 'account.banned'
  | 'account.insufficientBalance'
  | 'account.insufficientCredits'
  // User
  | 'user.notFound'
  | 'user.notVerified'
  | 'user.noPermission'
  // Order
  | 'order.notPaid'
  | 'order.paymentMissing'
  | 'order.addressMissing'
  // Format
  | 'format.email'
  | 'format.url'
  | 'format.uuid'
  | 'format.date'
  | 'format.datetime'
  | 'format.time'
  | 'format.ipv4'
  | 'format.ipv6'
  | 'format.binary'
  // String
  | 'string.hostname'
  | 'string.pattern'
  | 'string.enum'
  | 'string.length'
  | 'string.alphanum'
  | 'string.trim'
  | 'string.lowercase'
  | 'string.uppercase'
  // Number
  | 'number.base'
  | 'number.min'
  | 'number.max'
  | 'number.integer'
  | 'number.positive'
  | 'number.negative'
  | 'number.precision'
  | 'number.port'
  // Boolean
  | 'boolean.base'
  // Object
  | 'object.base'
  | 'object.min'
  | 'object.max'
  | 'object.unknown'
  | 'object.missing'
  | 'object.schema'
  | 'additionalProperties'
  // Array
  | 'array.base'
  | 'array.min'
  | 'array.max'
  | 'array.length'
  | 'array.unique'
  | 'array.sparse'
  | 'array.includesRequired'
  // Date
  | 'date.base'
  | 'date.min'
  | 'date.max'
  | 'date.format'
  | 'date.greater'
  | 'date.less'
  // Any
  | 'any.required'
  | 'any.invalid'
  | 'any.only'
  | 'any.unknown'
  // Patterns — formats
  | 'pattern.phone'
  | 'pattern.phone.international'
  | 'pattern.idCard'
  | 'pattern.creditCard'
  | 'pattern.creditCard.visa'
  | 'pattern.creditCard.mastercard'
  | 'pattern.creditCard.amex'
  | 'pattern.creditCard.discover'
  | 'pattern.creditCard.jcb'
  | 'pattern.creditCard.unionpay'
  | 'pattern.licensePlate'
  | 'pattern.postalCode'
  | 'pattern.passport'
  | 'pattern.objectId'
  | 'pattern.hexColor'
  | 'pattern.macAddress'
  | 'pattern.cron'
  | 'pattern.slug'
  | 'pattern.domain'
  | 'pattern.ip'
  | 'pattern.base64'
  | 'pattern.jwt'
  | 'pattern.json'
  // Patterns — username & password
  | 'pattern.username'
  | 'pattern.password.weak'
  | 'pattern.password.medium'
  | 'pattern.password.strong'
  | 'pattern.password.veryStrong'
  // Patterns — union
  | 'pattern.emailOrPhone'
  | 'pattern.usernameOrEmail'
  | 'pattern.httpOrHttps'
  // oneOf
  | 'oneOf'
  | 'oneOf.invalid'
  // Error fallback
  | 'UNKNOWN_ERROR'
  | 'CUSTOM_VALIDATION_FAILED'
  | 'ASYNC_VALIDATION_NOT_SUPPORTED'
  | 'VALIDATE_MUST_BE_FUNCTION'

/**
 * Complete locale interface — every locale file must implement this (Record<LocaleKey, LocaleMessage>).
 * TypeScript compile-time guarantee: no key can be missing.
 */
export type LocaleMessages = Record<LocaleKey, LocaleMessage>
