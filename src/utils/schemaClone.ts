/**
 * Clone schema-like values without JSON serialization.
 *
 * JSON Schema fragments in schema-dsl may carry functions, RegExp values,
 * symbols, or non-enumerable runtime metadata; JSON.stringify would erase or
 * corrupt those values.
 */
export function cloneSchemaValue<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value
  if (typeof value === 'function') return value

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as T
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as T
  }

  const source = value as object
  const existing = seen.get(source)
  if (existing) return existing as T

  if (Array.isArray(value)) {
    const arr: unknown[] = []
    seen.set(source, arr)
    for (const item of value) {
      arr.push(cloneSchemaValue(item, seen))
    }
    return arr as T
  }

  const proto = Object.getPrototypeOf(value)
  const target = Object.create(proto) as Record<PropertyKey, unknown>
  seen.set(source, target)

  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor) continue
    if ('value' in descriptor) {
      descriptor.value = cloneSchemaValue(descriptor.value, seen)
    } else if (typeof descriptor.get === 'function') {
      Object.defineProperty(target, key, {
        value: cloneSchemaValue(descriptor.get.call(value), seen),
        enumerable: descriptor.enumerable === true,
        configurable: descriptor.configurable === true,
        writable: true,
      })
      continue
    }
    Object.defineProperty(target, key, descriptor)
  }

  return target as T
}
