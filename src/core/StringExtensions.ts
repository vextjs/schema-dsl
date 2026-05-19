/**
 * StringExtensions — opt-in String.prototype chainable DSL extensions.
 *
 * v2 fixes:
 *   S-01/S-02: array-driven symmetric install/uninstall (v1 uninstall was missing `format` and
 *              `phoneNumber`). All method names are now maintained in the EXTENSION_METHODS
 *              array so both operations are guaranteed to be in sync.
 *
 * @example
 * import { installStringExtensions } from 'schema-dsl'
 * installStringExtensions(dsl)
 * // Then you can use:
 * 'email!'.label('Email address').messages({ format: 'Invalid format' })
 * 'string:3-32!'.username('medium')
 */

import type { DslBuilder } from './DslBuilder.js'

// S-01/S-02 fix: all extension method names are managed here so install/uninstall stay symmetric
const EXTENSION_METHODS = [
  'pattern',
  'label',
  'messages',
  'error',
  'description',
  'format',
  'custom',
  'default',
  'toSchema',
  'toJsonSchema',
  'username',
  'password',
  'phone',
  'phoneNumber',
  'idCard',
  'creditCard',
  'licensePlate',
  'postalCode',
  'passport',
  'slug',
  'domain',
  'ip',
  'base64',
  'jwt',
  'dateGreater',
  'dateLess',
  'after',
  'before',
  'dateFormat',
  'min',
  'max',
  'alphanum',
  'lowercase',
  'uppercase',
  'json',
  'precision',
  'multiple',
  'port',
  'requireAll',
  'strict',
  'noSparse',
  'includesRequired',
  'required',
  'optional',
  'enum',
  '_dslExtensionsInstalled',
] as const

type DslFn = (dslStr: string) => DslBuilder

/**
 * Install String.prototype extensions.
 * @param dslFunction - dsl() function (converts a string to a DslBuilder instance)
 */
export function installStringExtensions(dslFunction: DslFn): void {
  // Idempotent: skip if already installed
  if ((String.prototype as unknown as Record<string, unknown>)['_dslExtensionsInstalled']) return

  const proto = String.prototype as unknown as Record<string, unknown>

  function extend(name: string, fn: (...args: unknown[]) => unknown): void {
    proto[name] = fn
  }

  // Proxy all listed methods transparently to the DslBuilder instance
  const delegatedMethods: string[] = [
    'pattern', 'label', 'messages', 'error', 'description', 'format', 'custom',
    'default', 'username', 'password', 'phone', 'phoneNumber', 'idCard', 'creditCard',
    'licensePlate', 'postalCode', 'passport', 'slug', 'domain', 'ip', 'base64', 'jwt',
    'dateGreater', 'dateLess', 'after', 'before', 'dateFormat',
    'min', 'max', 'alphanum', 'lowercase', 'uppercase', 'json',
    'precision', 'multiple', 'port', 'requireAll', 'strict',
    'noSparse', 'includesRequired', 'required', 'optional',
  ]

  for (const method of delegatedMethods) {
    extend(method, function (this: string, ...args: unknown[]): DslBuilder {
      const builder = dslFunction(String(this))
      return (builder as unknown as Record<string, (...args: unknown[]) => DslBuilder>)[method](...args)
    })
  }

  // enum method accepts rest parameters
  extend('enum', function (this: string, ...values: unknown[]): DslBuilder {
    return dslFunction(String(this)).enum(...values)
  })

  // toSchema / toJsonSchema return JSONSchema (not DslBuilder)
  extend('toSchema', function (this: string) {
    return dslFunction(String(this)).toSchema()
  })
  extend('toJsonSchema', function (this: string) {
    return dslFunction(String(this)).toJsonSchema()
  })

  // Installation marker (v1 BC)
  proto['_dslExtensionsInstalled'] = true
}

/**
 * Uninstall String.prototype extensions (useful for tests or clean-up).
 * S-01/S-02 fix: uses EXTENSION_METHODS array to guarantee perfect symmetry with install.
 */
export function uninstallStringExtensions(): void {
  if (!(String.prototype as unknown as Record<string, unknown>)['_dslExtensionsInstalled']) return

  const proto = String.prototype as unknown as Record<string, unknown>
  for (const method of EXTENSION_METHODS) {
    delete proto[method]
  }
}
