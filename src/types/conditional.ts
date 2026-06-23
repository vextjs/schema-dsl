/**
 * IConditionalBuilder interface (shape definition).
 * Implementation class is in src/core/ConditionalBuilder.ts (Phase 8).
 */
import type { JSONSchema, JSONSchemaInput } from './schema.js'
import type { ValidationResult } from './validate.js'

export interface IConditionalBuilder {
  and(condition: (data: unknown) => boolean): this
  /** Add a v1-compatible truthy field requirement to the current condition chain. */
  require(field: string): this
  or(condition: (data: unknown) => boolean): this
  /** then/else accept string DSL, JSON Schema (including boolean schemas), or null (no-op). */
  then(schema: string | JSONSchemaInput | null): this
  else(schema: string | JSONSchemaInput | null): this
  elseIf(condition: (data: unknown) => boolean): this
  message(msg: string): this
  /** Serialise to a JSON Schema object (internal conditional marker). */
  toSchema(): JSONSchema
  /** Alias for toSchema(). */
  build(): JSONSchema
  /** Synchronous assertion; throws ValidationError on failure. */
  assert(data: unknown, options?: Record<string, unknown>): unknown
  /** Synchronous validation; returns ValidationResult. */
  validate(data: unknown, options?: Record<string, unknown>): ValidationResult<unknown>
  /** Async validation; returns Promise<ValidationResult>. */
  validateAsync(data: unknown, options?: Record<string, unknown>): Promise<ValidationResult<unknown>>
  /** Quick boolean check (no error details). */
  check(data: unknown): boolean
}
