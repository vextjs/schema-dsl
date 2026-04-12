/**
 * IConditionalBuilder 接口（形状定义）
 * 实现类在 src/core/ConditionalBuilder.ts（Phase 8）
 */
export interface IConditionalBuilder {
  and(condition: (data: unknown) => boolean): this
  or(condition: (data: unknown) => boolean): this
  then(schema: import('./schema.js').JSONSchema): this
  else(schema: import('./schema.js').JSONSchema): this
  elseIf(condition: (data: unknown) => boolean): this
  build(): import('./schema.js').JSONSchema
  assert(data: unknown): void
}
