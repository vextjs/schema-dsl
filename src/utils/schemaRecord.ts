/**
 * Helpers for JSON Schema maps whose keys come from user field names.
 *
 * JSON property names such as "__proto__" are valid schema keys, but assigning
 * them to a normal object can mutate the object's prototype instead of creating
 * an own property.
 */

export function createSchemaRecord<T = unknown>(): Record<string, T> {
  return Object.create(null) as Record<string, T>
}

export function setSchemaRecordValue<T>(record: Record<string, T>, key: string, value: T): void {
  Object.defineProperty(record, key, {
    value,
    enumerable: true,
    configurable: true,
    writable: true,
  })
}
