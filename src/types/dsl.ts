import type { JSONSchema, SchemaIOOptions } from './schema.js'
import type { DslConfigOptions } from './config.js'
import type { IConditionalBuilder } from './conditional.js'
import type { ValidationResult } from './validate.js'
import type { I18nError } from '../errors/I18nError.js'

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
  require(): this
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
  items(item: DslFactoryInput): this

  // ── Output ───────────────────────────────────────────────────
  toJsonSchema(): JSONSchema
  toSchema(): JSONSchema
  toString(): string
  validate(data: unknown): Promise<ValidationResult<unknown>>

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

export type DslFactoryInput = string | IDslBuilder | JSONSchema

export type DslExtensionSegmentMode = 'none' | 'params' | 'constraint'
export type DslExtensionParamKind = 'string' | 'number' | 'boolean' | 'enum'

export interface DslExtensionParamDefinition<Values extends readonly unknown[] = readonly unknown[]> {
  kind: DslExtensionParamKind
  values?: Values
  default?: unknown
  required?: boolean
  description?: string
  factoryOnly?: boolean
}

export type DslExtensionParamsDefinition = Record<string, DslExtensionParamDefinition>

export type DslExtensionParamValue<Param> =
  Param extends { readonly kind: 'number' } ? number :
    Param extends { readonly kind: 'boolean' } ? boolean :
      Param extends { readonly kind: 'enum'; readonly values: readonly (infer Value)[] } ? Value :
        Param extends { readonly kind: 'enum' } ? string | number | boolean :
          string

export type DslExtensionParamsObject<Params extends DslExtensionParamsDefinition> =
  {
    [Key in keyof Params as Params[Key] extends { required: true }
      ? Params[Key] extends { default: unknown } ? never : Key
      : never]: DslExtensionParamValue<Params[Key]>
  } & {
    [Key in keyof Params as Params[Key] extends { required: true }
      ? Params[Key] extends { default: unknown } ? Key : never
      : Key]?: DslExtensionParamValue<Params[Key]>
  }

export type DslExtensionSchemaFactory<Params extends Record<string, unknown> = Record<string, unknown>> =
  (params: Params) => JSONSchema

export interface DslExtensionDefinition<Params extends DslExtensionParamsDefinition = DslExtensionParamsDefinition> {
  literal?: string
  factoryName?: string
  segmentMode?: DslExtensionSegmentMode
  params?: Params
  schema?: JSONSchema | (() => JSONSchema) | DslExtensionSchemaFactory<DslExtensionParamsObject<Params>>
  factory?: (...args: unknown[]) => string | IDslBuilder | JSONSchema
  exposeFactory?: boolean
  exposeStringChain?: boolean
  transformMethods?: readonly string[]
}

export interface NormalizedDslExtensionDefinition<Params extends DslExtensionParamsDefinition = DslExtensionParamsDefinition>
  extends DslExtensionDefinition<Params> {
  readonly segmentMode: DslExtensionSegmentMode
  readonly transformMethods: readonly string[]
}

type DslKebabToCamel<S extends string> =
  S extends `${infer Head}-${infer Tail}`
    ? `${Head}${Capitalize<DslKebabToCamel<Tail>>}`
    : S

type DslNarrowString<S extends string> = string extends S ? never : S

type DslExtensionFactoryName<Definition> =
  Definition extends { readonly factoryName: infer Name extends string }
    ? DslNarrowString<Name>
    : Definition extends { readonly literal: infer Literal extends string }
      ? DslNarrowString<DslKebabToCamel<Literal>>
      : never

type DslExtensionParamValues<Params extends object> =
  { [Key in keyof Params]: DslExtensionParamValue<Params[Key]> }[keyof Params]

type DslExtensionFactoryParamsObject<Params extends object> =
  {
    [Key in keyof Params as Params[Key] extends { readonly required: true }
      ? Params[Key] extends { readonly default: unknown } ? never : Key
      : never]: DslExtensionParamValue<Params[Key]>
  } & {
    [Key in keyof Params as Params[Key] extends { readonly required: true }
      ? Params[Key] extends { readonly default: unknown } ? Key : never
      : Key]?: DslExtensionParamValue<Params[Key]>
  }

type DslExtensionRequiredParamNames<Params extends object> =
  keyof {
    [Key in keyof Params as Params[Key] extends { readonly required: true }
      ? Params[Key] extends { readonly default: unknown } ? never : Key
      : never]: true
  }

type DslExtensionSingleValueFactory<Params extends object> =
  DslExtensionRequiredParamNames<Params> extends never
    ? { (value?: DslExtensionParamValues<Params>): IDslBuilder }
    : { (value: DslExtensionParamValues<Params>): IDslBuilder }

export type DslExtensionFactory<Params extends object = DslExtensionParamsDefinition> =
  keyof Params extends never
    ? () => IDslBuilder
    : DslExtensionSingleValueFactory<Params> & {
      (params: DslExtensionFactoryParamsObject<Params>): IDslBuilder
    }

type DslExtensionFactoryForDefinition<Definition, Params extends object> =
  Definition extends { readonly factory: (...args: infer Args) => string | IDslBuilder | JSONSchema }
    ? (...args: Args) => IDslBuilder
    : DslExtensionFactory<Params>

type DslExtensionDefinitionParams<Definition> =
  Definition extends { readonly params: infer Params extends object }
    ? Params
    : Record<never, never>

type DslUnionToIntersection<Union> =
  (Union extends unknown ? (value: Union) => void : never) extends (value: infer Intersection) => void
    ? Intersection
    : never

export type DslExtensionNamespaceFactories<Definitions extends readonly unknown[]> =
  DslUnionToIntersection<
    Definitions[number] extends infer Definition
      ? {
        [Name in DslExtensionFactoryName<Definition>]: DslExtensionFactoryForDefinition<Definition, DslExtensionDefinitionParams<Definition>>
      }
      : never
  >

export type DslWithExtensions<Definitions extends readonly unknown[]> =
  DslFn & DslExtensionNamespaceFactories<Definitions>

export interface DslNamespaceFactories {
  string(): IDslBuilder
  number(): IDslBuilder
  integer(): IDslBuilder
  int(): IDslBuilder
  boolean(): IDslBuilder
  object(): IDslBuilder
  array(item?: DslFactoryInput): IDslBuilder
  any(): IDslBuilder
  mixed(): IDslBuilder
  email(): IDslBuilder
  url(): IDslBuilder
  uri(): IDslBuilder
  uuid(): IDslBuilder
  ip(): IDslBuilder
  ipv4(): IDslBuilder
  ipv6(): IDslBuilder
  date(): IDslBuilder
  datetime(): IDslBuilder
  time(): IDslBuilder
  slug(): IDslBuilder
  phone(country?: string): IDslBuilder
  username(preset?: string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean }): IDslBuilder
  password(preset?: string): IDslBuilder
  enum(values: readonly unknown[]): IDslBuilder
  enum(...values: unknown[]): IDslBuilder
  type(name: string): IDslBuilder
  defineExtension(definition: DslExtensionDefinition): NormalizedDslExtensionDefinition
  registerExtension(definition: DslExtensionDefinition): void
  registerExtensions<const Definitions extends readonly unknown[]>(
    definitions: readonly [...Definitions]
  ): DslWithExtensions<Definitions>
}

/**
 * if/conditional function types.
 */
export type DslIfFn = (condition: (data: unknown) => boolean) => IConditionalBuilder
export type DslFieldIfFn = (condition: string, thenSchema: unknown, elseSchema?: unknown) => DslConditionMarker

/**
 * dsl.error namespace.
 */
export interface DslErrorNamespace {
  create(code: string, paramsOrLocale?: unknown, statusCode?: number, locale?: string): I18nError
  throw(code: string, paramsOrLocale?: unknown, statusCode?: number, locale?: string): never
  assert(condition: unknown, code: string, paramsOrLocale?: unknown, statusCode?: number, locale?: string): asserts condition
  readonly [code: string]: unknown
}

/**
 * DslFn interface (function overloads + namespace attachments).
 * ⚠️ Uses function overloads rather than union return types to ensure TypeScript type narrowing works correctly.
 */
export interface DslFn extends DslNamespaceFactories {
  (def: string, options?: SchemaIOOptions): IDslBuilder
  (def: DslDefinition, options?: SchemaIOOptions): JSONSchema
  config: (options?: Partial<DslConfigOptions>) => void
  if: DslIfFn & DslFieldIfFn
  _if: DslIfFn & DslFieldIfFn
  match: (value: unknown, cases: Record<string, unknown>) => DslConditionMarker
  error: DslErrorNamespace
}
