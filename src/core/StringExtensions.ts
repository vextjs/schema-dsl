/**
 * StringExtensions — String.prototype chainable DSL extensions.
 *
 * v2 fixes:
 *   S-01/S-02: array-driven symmetric install/uninstall (v1 uninstall was missing `format` and
 *              `phoneNumber`). All method names are now maintained in the STRING_EXTENSION_METHODS
 *              array so both operations are guaranteed to be in sync.
 *   V1-BC: the root entry installs these extensions by default, but the install itself keeps
 *          prototype impact lower by using non-enumerable descriptors and conflict detection.
 *
 * @example
 * import 'schema-dsl'
 * 'email!'.label('Email address').messages({ format: 'Invalid format' })
 * 'string:3-32!'.username('medium')
 */

import type { IDslBuilder } from '../types/dsl.js'

// S-01/S-02 fix: all extension method names are managed here so install/uninstall stay symmetric
export const STRING_EXTENSION_METHODS = [
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
] as const

export type StringExtensionMethodName = typeof STRING_EXTENSION_METHODS[number]

type DslFn = (dslStr: string) => IDslBuilder
type ExtensionMethodName = StringExtensionMethodName
type ExtensionFunction = (this: string, ...args: unknown[]) => unknown
type InstalledState = {
  dslFunction: DslFn
  originals: Map<PropertyKey, PropertyDescriptor | undefined>
}

const LEGACY_INSTALL_MARKER = '_dslExtensionsInstalled'
const STRING_EXTENSIONS_STATE = Symbol.for('schema-dsl.stringExtensions.state')
const STRING_EXTENSION_OWNER = Symbol.for('schema-dsl.stringExtensions.owner')
const LEGACY_METHOD_DELEGATES: Partial<Record<ExtensionMethodName, string>> = {
  pattern: 'pattern',
  label: 'label',
  messages: 'messages',
  description: 'description',
  format: 'format',
  custom: 'custom',
  default: 'default',
  toSchema: 'toSchema',
  username: 'username',
  password: 'password',
  phone: 'phone',
  phoneNumber: 'phone',
  idCard: 'idCard',
  creditCard: 'creditCard',
  licensePlate: 'licensePlate',
  postalCode: 'postalCode',
  passport: 'passport',
  slug: 'slug',
  dateGreater: 'dateGreater',
  dateLess: 'dateLess',
}

// Track which dslFunction the extensions were installed with
let _installedDslFn: DslFn | null = null

function isInstalledState(value: unknown): value is InstalledState {
  return (
    !!value
    && typeof value === 'object'
    && typeof (value as InstalledState).dslFunction === 'function'
    && (value as InstalledState).originals instanceof Map
  )
}

function getInstalledState(proto = String.prototype): InstalledState | null {
  const descriptor = Object.getOwnPropertyDescriptor(proto, STRING_EXTENSIONS_STATE)
  return isInstalledState(descriptor?.value) ? descriptor.value : null
}

function markExtensionFunction<T extends ExtensionFunction>(fn: T): T {
  Object.defineProperty(fn, STRING_EXTENSION_OWNER, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  })
  return fn
}

function isSchemaDslOwnedDescriptor(descriptor: PropertyDescriptor | undefined): boolean {
  return (
    !!descriptor
    && typeof descriptor.value === 'function'
    && (descriptor.value as Record<PropertyKey, unknown>)[STRING_EXTENSION_OWNER] === true
  )
}

function isLikelyLegacySchemaDslDescriptor(
  method: ExtensionMethodName,
  descriptor: PropertyDescriptor | undefined,
): boolean {
  const delegate = LEGACY_METHOD_DELEGATES[method]
  if (!delegate || !descriptor || typeof descriptor.value !== 'function') return false

  const source = Function.prototype.toString.call(descriptor.value)
  return source.includes('dslFunction(String(this))') && source.includes(`.${delegate}(`)
}

function hasLegacyInstallMarker(proto: object): boolean {
  return Object.getOwnPropertyDescriptor(proto, LEGACY_INSTALL_MARKER)?.value === true
}

function rememberOriginal(
  state: InstalledState,
  proto: object,
  key: PropertyKey,
): void {
  if (!state.originals.has(key)) {
    state.originals.set(key, Object.getOwnPropertyDescriptor(proto, key))
  }
}

function restoreOriginal(
  proto: object,
  key: PropertyKey,
  original: PropertyDescriptor | undefined,
): void {
  if (original) {
    Object.defineProperty(proto, key, original)
  } else {
    delete (proto as unknown as Record<PropertyKey, unknown>)[key]
  }
}

function assertNoExternalConflicts(proto: object, methods: readonly ExtensionMethodName[]): void {
  const legacyInstalled = hasLegacyInstallMarker(proto)
  for (const method of methods) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, method)
    if (!descriptor) continue
    if (isSchemaDslOwnedDescriptor(descriptor)) continue
    if (legacyInstalled && isLikelyLegacySchemaDslDescriptor(method, descriptor)) continue

    throw new Error(
      `[schema-dsl] Cannot install String extension "${method}": String.prototype.${method} already exists and is not owned by schema-dsl`
    )
  }
}

function defineExtension(
  state: InstalledState,
  proto: object,
  name: ExtensionMethodName,
  fn: ExtensionFunction,
): void {
  if (!state.originals.has(name)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, name)
    state.originals.set(
      name,
      hasLegacyInstallMarker(proto) && isLikelyLegacySchemaDslDescriptor(name, descriptor)
        ? undefined
        : descriptor,
    )
  }
  Object.defineProperty(proto, name, {
    value: markExtensionFunction(fn),
    configurable: true,
    enumerable: false,
    writable: true,
  })
}

/**
 * Install String.prototype extensions.
 * @param dslFunction - dsl() function (converts a string to an IDslBuilder instance)
 */
export function installStringExtensions(dslFunction: DslFn): void {
  const proto = String.prototype
  const currentState = getInstalledState(proto)

  // Idempotent: skip only if installed with the same dslFunction reference
  if (currentState?.dslFunction === dslFunction) {
    _installedDslFn = dslFunction
    return
  }

  // If installed with a different function, uninstall first then reinstall
  if (currentState || _installedDslFn !== null) {
    uninstallStringExtensions()
  }

  assertNoExternalConflicts(proto, STRING_EXTENSION_METHODS)

  const state: InstalledState = {
    dslFunction,
    originals: new Map(),
  }

  rememberOriginal(state, proto, STRING_EXTENSIONS_STATE)
  Object.defineProperty(proto, STRING_EXTENSIONS_STATE, {
    value: state,
    configurable: true,
    enumerable: false,
    writable: false,
  })

  // Proxy all listed methods transparently to the IDslBuilder instance
  const delegatedMethods: ExtensionMethodName[] = [
    'pattern', 'label', 'messages', 'error', 'description', 'format', 'custom',
    'default', 'username', 'password', 'phone', 'phoneNumber', 'idCard', 'creditCard',
    'licensePlate', 'postalCode', 'passport', 'slug', 'domain', 'ip', 'base64', 'jwt',
    'dateGreater', 'dateLess', 'after', 'before', 'dateFormat',
    'min', 'max', 'alphanum', 'lowercase', 'uppercase', 'json',
    'precision', 'multiple', 'port', 'requireAll', 'strict',
    'noSparse', 'includesRequired', 'required', 'optional',
  ]

  for (const method of delegatedMethods) {
    defineExtension(state, proto, method, function (this: string, ...args: unknown[]): IDslBuilder {
      const builder = dslFunction(String(this))
      return (builder as unknown as Record<string, (...args: unknown[]) => IDslBuilder>)[method](...args)
    })
  }

  // enum method accepts rest parameters
  defineExtension(state, proto, 'enum', function (this: string, ...values: unknown[]): IDslBuilder {
    return dslFunction(String(this)).enum(...values)
  })

  // toSchema / toJsonSchema return JSONSchema (not DslBuilder)
  defineExtension(state, proto, 'toSchema', function (this: string) {
    return dslFunction(String(this)).toSchema()
  })
  defineExtension(state, proto, 'toJsonSchema', function (this: string) {
    return dslFunction(String(this)).toJsonSchema()
  })

  // Installation marker (v1 BC)
  if (!state.originals.has(LEGACY_INSTALL_MARKER)) {
    state.originals.set(
      LEGACY_INSTALL_MARKER,
      hasLegacyInstallMarker(proto)
        ? undefined
        : Object.getOwnPropertyDescriptor(proto, LEGACY_INSTALL_MARKER),
    )
  }
  Object.defineProperty(proto, LEGACY_INSTALL_MARKER, {
    value: true,
    configurable: true,
    enumerable: false,
    writable: true,
  })
  _installedDslFn = dslFunction
}

/**
 * Uninstall String.prototype extensions (useful for tests or clean-up).
 * S-01/S-02 fix: uses STRING_EXTENSION_METHODS array to guarantee perfect symmetry with install.
 */
export function uninstallStringExtensions(): void {
  const proto = String.prototype
  const state = getInstalledState(proto)

  if (state) {
    for (const method of STRING_EXTENSION_METHODS) {
      const descriptor = Object.getOwnPropertyDescriptor(proto, method)
      if (isSchemaDslOwnedDescriptor(descriptor)) {
        restoreOriginal(proto, method, state.originals.get(method))
      }
    }

    restoreOriginal(proto, LEGACY_INSTALL_MARKER, state.originals.get(LEGACY_INSTALL_MARKER))
    restoreOriginal(proto, STRING_EXTENSIONS_STATE, state.originals.get(STRING_EXTENSIONS_STATE))
    _installedDslFn = null
    return
  }

  // Legacy cleanup path for descriptors installed by older schema-dsl builds.
  if (!hasLegacyInstallMarker(proto)) return
  for (const method of STRING_EXTENSION_METHODS) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, method)
    if (isLikelyLegacySchemaDslDescriptor(method, descriptor)) {
      delete (proto as unknown as Record<PropertyKey, unknown>)[method]
    }
  }
  delete (proto as unknown as Record<PropertyKey, unknown>)[LEGACY_INSTALL_MARKER]
  _installedDslFn = null
}
