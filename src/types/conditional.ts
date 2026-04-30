/**
 * IConditionalBuilder 接口（形状定义）
 * 实现类在 src/core/ConditionalBuilder.ts（Phase 8）
 */
import type { JSONSchema } from './schema.js'

export interface IConditionalBuilder {
  and(condition: (data: unknown) => boolean): this
  or(condition: (data: unknown) => boolean): this
  then(schema: JSONSchema): this
  else(schema: JSONSchema): this
  elseIf(condition: (data: unknown) => boolean): this
  build(): JSONSchema
  assert(data: unknown): void
}
