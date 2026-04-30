import type { JSONSchema } from './schema.js'
import type { DslConfigOptions } from './config.js'
import type { IConditionalBuilder } from './conditional.js'

/**
 * DslBuilder 接口定义（链式 API 形状）
 * 实现类在 src/core/DslBuilder.ts（Phase 7）
 */
export interface IDslBuilder {
  // 约束方法
  min(n: number): this
  max(n: number): this
  label(text: string): this
  description(text: string): this
  pattern(regex: RegExp | string): this
  enum(...values: unknown[]): this
  optional(): this
  required(): this
  default(value: unknown): this
  error(messages: Record<string, string>): this
  // 输出
  toJsonSchema(): JSONSchema
  toString(): string
  // 内部标识
  readonly _isDslBuilder: true
}

/**
 * DSL 对象定义（key → field 映射）
 * ⚠️ 必须用 interface 而非 type alias，以支持 DslField ↔ DslDefinition 递归引用
 */
export interface DslDefinition {
  [key: string]: DslField
}

/**
 * v1 条件字段标记（由 dsl.if / dsl.match 创建，parseObject 阶段编译为 allOf 条件 Schema）
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
 * DSL 字段类型（递归定义）
 * 字符串 | DslBuilder 实例 | 嵌套对象
 */
export type DslField = string | IDslBuilder | DslDefinition | DslConditionMarker

/**
 * DslBuilder 构造参数（字符串或嵌套定义）
 */
export type DslInput = string | DslDefinition

/**
 * if/conditional 函数类型
 */
export type DslIfFn = (condition: (data: unknown) => boolean) => IConditionalBuilder
export type DslFieldIfFn = (condition: string, thenSchema: unknown, elseSchema?: unknown) => DslConditionMarker

/**
 * dsl.error 命名空间
 */
export interface DslErrorNamespace {
  readonly [code: string]: string
}

/**
 * DslFn 接口（函数重载 + 命名空间挂载）
 * ⚠️ 使用函数重载而非联合返回类型，确保 TS 类型缩窄正常工作
 */
export interface DslFn {
  (def: string): IDslBuilder
  (def: DslDefinition): JSONSchema
  config: (options: DslConfigOptions) => void
  if: DslIfFn & DslFieldIfFn
  match: (value: unknown, cases: Record<string, unknown>) => DslConditionMarker
  error: DslErrorNamespace
}
