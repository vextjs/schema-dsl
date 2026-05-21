/**
 * IConditionalBuilder interface (shape definition).
 * Implementation class is in src/core/ConditionalBuilder.ts (Phase 8).
 */
import type { JSONSchema } from './schema.js'
import type { ValidationResult } from './validate.js'

export interface IConditionalBuilder {
  and(condition: (data: unknown) => boolean): this
  or(condition: (data: unknown) => boolean): this
  /** then/else accept string DSL, JSONSchema, or null (no-op). */
  then(schema: string | JSONSchema | null): this
  else(schema: string | JSONSchema | null): this
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
