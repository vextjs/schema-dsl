import type { JSONSchema } from './schema.js'
import type { DslConfigOptions } from './config.js'
import type { IConditionalBuilder } from './conditional.js'

/**
 * DslBuilder interface definition (chainable API shape).
 * Implementation class is in src/core/DslBuilder.ts (Phase 7).
 */
export interface IDslBuilder {
  // ── Core constraint methods ──────────────────────────────────
  min(n: number): this
  max(n: number): this
  label(text: string): this
  description(text: string): this
  pattern(regex: RegExp | string, message?: string): this
  enum(...values: unknown[]): this
  optional(): this
  required(): this
  default(value: unknown): this
  error(messages: Record<string, string>): this
  messages(msgs: Record<string, string>): this
  format(fmt: string): this
  custom(validatorFn: (value: unknown) => unknown): this

  // ── String validators ────────────────────────────────────────
  length(n: number): this
  alphanum(): this
  trim(): this
  lowercase(): this
  uppercase(): this
  ip(): this
  base64(): this
  jwt(): this
  json(): this
  domain(): this
  slug(): this
  after(date: string): this
  before(date: string): this
  dateGreater(date: string): this
  dateLess(date: string): this
  dateFormat(fmt: string): this
  username(preset?: string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean }): this
  password(preset?: string): this
  phone(country?: string): this
  phoneNumber(country?: string): this
  idCard(country?: string): this
  creditCard(type?: string): this
  licensePlate(country?: string): this
  postalCode(country?: string): this
  passport(country?: string): this

  // ── Number validators ────────────────────────────────────────
  precision(n: number): this
  multiple(n: number): this
  port(): this

  // ── Object validators ────────────────────────────────────────
  requireAll(): this
  strict(): this

  // ── Array validators ─────────────────────────────────────────
  noSparse(): this
  includesRequired(items: unknown[]): this

  // ── Output ───────────────────────────────────────────────────
  toJsonSchema(): JSONSchema
  toSchema(): JSONSchema
  toString(): string

  // ── Internal marker ──────────────────────────────────────────
  readonly _isDslBuilder: true
}

/**
 * DSL object definition (key → field mapping).
 * ⚠️ Must be an interface rather than a type alias to support recursive DslField ↔ DslDefinition references.
 */
export interface DslDefinition {
  [key: string]: DslField
}

/**
 * v1 conditional field marker (created by dsl.if / dsl.match; compiled to allOf conditional schema during parseObject).
 */
export interface DslConditionMarker {
  _isIf?: true
  _isMatch?: true
  condition?: string
  field?: string
  then?: unknown
  else?: unknown
  map?: Record<string, unknown>
}

/**
 * DSL field type (recursive definition).
 * String | DslBuilder instance | nested object.
 */
export type DslField = string | IDslBuilder | DslDefinition | DslConditionMarker

/**
 * DslBuilder constructor input (string or nested definition).
 */
export type DslInput = string | DslDefinition

/**
 * if/conditional function types.
 */
export type DslIfFn = (condition: (data: unknown) => boolean) => IConditionalBuilder
export type DslFieldIfFn = (condition: string, thenSchema: unknown, elseSchema?: unknown) => DslConditionMarker

/**
 * dsl.error namespace.
 */
export interface DslErrorNamespace {
  readonly [code: string]: string
}

/**
 * DslFn interface (function overloads + namespace attachments).
 * ⚠️ Uses function overloads rather than union return types to ensure TypeScript type narrowing works correctly.
 */
export interface DslFn {
  (def: string): IDslBuilder
  (def: DslDefinition): JSONSchema
  config: (options?: Partial<DslConfigOptions>) => void
  if: DslIfFn & DslFieldIfFn
  _if: DslIfFn & DslFieldIfFn
  match: (value: unknown, cases: Record<string, unknown>) => DslConditionMarker
  error: DslErrorNamespace
}
