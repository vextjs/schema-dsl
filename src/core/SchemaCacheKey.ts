export const SCHEMA_DSL_CACHE_KEY = Symbol.for('schema-dsl.schemaCacheKey')
export const SCHEMA_DSL_CACHE_STATE = Symbol.for('schema-dsl.schemaCacheState')

export interface MutableSchemaCacheState {
  version: number
  cacheKey: string | null
  rawSchema: object
  requiresShapeGuard: boolean
  shapeGuard: SchemaShapeGuard | undefined
}

export type SchemaShapeGuard = {
  objects: SchemaObjectShapeGuard[]
  arrays: SchemaArrayShapeGuard[]
}

type SchemaObjectShapeGuard = {
  ref: Record<string, unknown>
  keys: string[]
  values: unknown[]
}

type SchemaArrayShapeGuard = {
  ref: unknown[]
  keys: string[]
  values: unknown[]
  length: number
}

type TrackedMarkedSchema = {
  cacheKey: string
  guard: SchemaShapeGuard
}

const mutableSchemaStates = new WeakMap<object, MutableSchemaCacheState>()

export function createSchemaCacheKey(schema: unknown): string | null {
  const serialized = stableStringify(schema, new WeakSet<object>())
  return serialized === null ? null : `schema:${serialized}`
}

export function markSchemaCacheKey<T extends object>(schema: T, cacheKey?: string | null): T {
  const state = getMutableSchemaCacheState(schema)
  const resolvedCacheKey = cacheKey === undefined
    ? createSchemaCacheKey(state?.rawSchema ?? schema)
    : cacheKey
  if (!resolvedCacheKey) return schema

  if (state) {
    state.cacheKey = resolvedCacheKey
    state.shapeGuard = state.requiresShapeGuard
      ? createSchemaShapeGuard(state.rawSchema)
      : undefined
    defineSchemaCacheKey(state.rawSchema, resolvedCacheKey)
    return schema
  }

  defineSchemaCacheKey(schema, resolvedCacheKey)

  return schema
}

export function createMutableSchemaCacheProxy<T extends object>(schema: T): T {
  if (getMutableSchemaCacheState(schema)) return schema

  const state: MutableSchemaCacheState = {
    version: 0,
    cacheKey: createSchemaCacheKey(schema),
    rawSchema: schema,
    requiresShapeGuard: false,
    shapeGuard: undefined,
  }
  if (state.cacheKey) defineSchemaCacheKey(schema, state.cacheKey)
  const proxies = new WeakMap<object, object>()

  const wrap = (value: unknown): unknown => {
    if (!value || typeof value !== 'object') return value
    const existing = proxies.get(value)
    if (existing) return existing

    const proxy = new Proxy(value, {
      get(target, key, receiver) {
        if (key === SCHEMA_DSL_CACHE_STATE) return state
        if (key === SCHEMA_DSL_CACHE_KEY) return state.cacheKey
        const value = Reflect.get(target, key, receiver)
        const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
        if (descriptor && descriptor.configurable === false && descriptor.writable === false) return value
        return wrap(value)
      },
      set(target, key, nextValue) {
        const currentValue = Reflect.get(target, key)
        const result = Reflect.set(target, key, nextValue)
        if (result && !Object.is(currentValue, nextValue)) {
          if (isExternalObjectAlias(nextValue, state)) state.requiresShapeGuard = true
          invalidateMutableSchema(state)
        }
        return result
      },
      deleteProperty(target, key) {
        const existed = Reflect.has(target, key)
        const result = Reflect.deleteProperty(target, key)
        if (result && existed) invalidateMutableSchema(state)
        return result
      },
      defineProperty(target, key, descriptor) {
        const current = Reflect.getOwnPropertyDescriptor(target, key)
        const result = Reflect.defineProperty(target, key, descriptor)
        if (result && !sameDescriptor(current, descriptor)) {
          if ('value' in descriptor && isExternalObjectAlias(descriptor.value, state)) {
            state.requiresShapeGuard = true
          }
          invalidateMutableSchema(state)
        }
        return result
      },
      getOwnPropertyDescriptor(target, key) {
        const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
        if (!descriptor || !('value' in descriptor)) return descriptor
        if (descriptor.configurable === false && descriptor.writable === false) return descriptor
        return { ...descriptor, value: wrap(descriptor.value) }
      },
      setPrototypeOf(target, prototype) {
        const current = Reflect.getPrototypeOf(target)
        const result = Reflect.setPrototypeOf(target, prototype)
        if (result && current !== prototype) invalidateMutableSchema(state)
        return result
      },
    })
    proxies.set(value, proxy)
    mutableSchemaStates.set(proxy, state)
    return proxy
  }

  return wrap(schema) as T
}

export function getMutableSchemaCacheState(schema: object): MutableSchemaCacheState | null {
  const tracked = mutableSchemaStates.get(schema)
  if (tracked) return tracked
  const state = (schema as Record<symbol, unknown>)[SCHEMA_DSL_CACHE_STATE]
  if (!state || typeof state !== 'object') return null
  const candidate = state as MutableSchemaCacheState
  return typeof candidate.version === 'number' ? candidate : null
}

export function unwrapMutableSchema<T extends object>(schema: T): T {
  return (getMutableSchemaCacheState(schema)?.rawSchema ?? schema) as T
}

export function refreshMutableSchemaCacheState(state: MutableSchemaCacheState): boolean {
  if (!state.shapeGuard || isSchemaShapeGuardCurrent(state.rawSchema, state.shapeGuard)) return true
  invalidateMutableSchema(state)
  return false
}

export function createSchemaShapeGuard(schema: object): SchemaShapeGuard {
  const guard: SchemaShapeGuard = { objects: [], arrays: [] }
  collectSchemaShape(schema, guard, new WeakSet<object>())
  return guard
}

export function isSchemaShapeGuardCurrent(schema: object, guard: SchemaShapeGuard | undefined): boolean {
  if (!guard) return true
  const root = guard.objects[0]?.ref ?? guard.arrays[0]?.ref
  if (root && schema !== root) return false

  for (const entry of guard.objects) {
    const keys = Object.keys(entry.ref)
    if (keys.length !== entry.keys.length) return false
    for (let index = 0; index < entry.keys.length; index++) {
      const key = entry.keys[index]!
      if (keys[index] !== key || entry.ref[key] !== entry.values[index]) return false
    }
  }

  for (const entry of guard.arrays) {
    if (entry.ref.length !== entry.length) return false
    const keys = Object.keys(entry.ref)
    if (keys.length !== entry.keys.length) return false
    for (let index = 0; index < entry.keys.length; index++) {
      const key = entry.keys[index]!
      if (keys[index] !== key || (entry.ref as unknown as Record<string, unknown>)[key] !== entry.values[index]) {
        return false
      }
    }
  }

  return true
}

/** Tracks library-marked public schemas without assuming callers keep them immutable. */
export class MutableSchemaCacheKeyTracker {
  private entries = new WeakMap<object, TrackedMarkedSchema>()

  getMarkedKey(schema: object): string | null {
    const mutableState = getMutableSchemaCacheState(schema)
    if (mutableState) {
      refreshMutableSchemaCacheState(mutableState)
      if (!mutableState.cacheKey) {
        const currentKey = createSchemaCacheKey(mutableState.rawSchema)
        if (currentKey) markSchemaCacheKey(schema, currentKey)
      }
      return mutableState.cacheKey
    }

    const markedKey = (schema as Record<symbol, unknown>)[SCHEMA_DSL_CACHE_KEY]
    if (typeof markedKey !== 'string' || !markedKey) return null

    const cached = this.entries.get(schema)
    if (cached?.cacheKey === markedKey && isSchemaShapeGuardCurrent(schema, cached.guard)) {
      return markedKey
    }

    const currentKey = createSchemaCacheKey(schema)
    if (!currentKey) {
      this.entries.delete(schema)
      return null
    }

    if (currentKey !== markedKey) markSchemaCacheKey(schema, currentKey)
    this.entries.set(schema, {
      cacheKey: currentKey,
      guard: createSchemaShapeGuard(schema),
    })
    return currentKey
  }

  clear(): void {
    this.entries = new WeakMap<object, TrackedMarkedSchema>()
  }
}

function invalidateMutableSchema(state: MutableSchemaCacheState): void {
  state.version++
  state.cacheKey = null
  try {
    delete (state.rawSchema as Record<symbol, unknown>)[SCHEMA_DSL_CACHE_KEY]
  } catch {
    // Frozen generated schemas cannot be mutated, so an undeletable key cannot become stale.
  }
}

function isExternalObjectAlias(value: unknown, state: MutableSchemaCacheState): boolean {
  return !!value
    && typeof value === 'object'
    && getMutableSchemaCacheState(value) !== state
}

function defineSchemaCacheKey(schema: object, cacheKey: string): void {
  try {
    Object.defineProperty(schema, SCHEMA_DSL_CACHE_KEY, {
      value: cacheKey,
      enumerable: false,
      configurable: true,
    })
  } catch {
    // Non-extensible schemas remain valid and use structural or identity keys.
  }
}

function sameDescriptor(
  current: PropertyDescriptor | undefined,
  next: PropertyDescriptor,
): boolean {
  if (!current) return false
  return current.configurable === next.configurable
    && current.enumerable === next.enumerable
    && current.writable === next.writable
    && current.get === next.get
    && current.set === next.set
    && Object.is(current.value, next.value)
}

function collectSchemaShape(value: unknown, guard: SchemaShapeGuard, seen: WeakSet<object>): void {
  if (!value || typeof value !== 'object' || seen.has(value)) return
  seen.add(value)

  if (Array.isArray(value)) {
    const keys = Object.keys(value)
    guard.arrays.push({
      ref: value,
      keys,
      values: keys.map(key => (value as unknown as Record<string, unknown>)[key]),
      length: value.length,
    })
    for (const item of value) collectSchemaShape(item, guard, seen)
    return
  }

  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  guard.objects.push({
    ref: record,
    keys,
    values: keys.map(key => record[key]),
  })
  for (const key of keys) collectSchemaShape(record[key], guard, seen)
}

function stableStringify(value: unknown, seen: WeakSet<object>): string | null {
  if (value === null) return 'null'

  switch (typeof value) {
    case 'string':
      return JSON.stringify(value)
    case 'number':
      return Number.isFinite(value) ? JSON.stringify(value) : null
    case 'boolean':
      return value ? 'true' : 'false'
    case 'object':
      break
    default:
      return null
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) return null
    seen.add(value)
    const items: string[] = []
    for (const item of value) {
      const serialized = stableStringify(item, seen)
      if (serialized === null) {
        seen.delete(value)
        return null
      }
      items.push(serialized)
    }
    seen.delete(value)
    return `[${items.join(',')}]`
  }

  const obj = value as Record<string, unknown>
  const proto = Object.getPrototypeOf(obj)
  if (proto !== Object.prototype && proto !== null) return null
  if (seen.has(obj)) return null

  seen.add(obj)
  const entries: string[] = []
  for (const key of Object.keys(obj).sort()) {
    const serialized = stableStringify(obj[key], seen)
    if (serialized === null) {
      seen.delete(obj)
      return null
    }
    entries.push(`${JSON.stringify(key)}:${serialized}`)
  }
  seen.delete(obj)

  return `{${entries.join(',')}}`
}
