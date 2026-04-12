import type { JSONSchema } from '../types/schema.js'
import type { TypeDefinition } from './TypeRegistry.js'

/** afterCompile 钩子回调类型 */
export type AfterCompileHook = (schema: JSONSchema) => void | Promise<void>

/**
 * SchemaCompiler — 将 TypeDefinition + constraints 组装为最终 JSONSchema
 *
 * 职责：
 *   1. 合并 baseSchema + constraints（constraints 优先）
 *   2. 注入 _label / _customMessages / _required（来自 TypeDefinition 或调用方）
 *   3. 触发 afterCompile 钩子
 */
export const SchemaCompiler = {
  /**
   * 编译并返回 JSONSchema（含内部 key，toJsonSchema 时清除）
   */
  compile(
    typeDef: TypeDefinition,
    constraints: Partial<JSONSchema>,
    meta?: {
      label?: string
      required?: boolean
      afterCompileHook?: AfterCompileHook
    }
  ): JSONSchema {
    // 合并 baseSchema + constraints（constraints 字段覆盖 baseSchema 同名字段）
    const schema: JSONSchema = {
      ...typeDef.baseSchema,
      ...constraints,
    }

    // 注入类型自带的 _customMessages（如 phone、idCard 等）
    if (typeDef.customMessages) {
      schema['_customMessages'] = {
        ...(schema['_customMessages'] as Record<string, string> | undefined),
        ...typeDef.customMessages,
      }
    }

    // 注入 meta
    if (meta?.label) schema['_label'] = meta.label
    if (meta?.required) schema['_required'] = true

    // 触发 afterCompile 钩子（同步部分，异步由 DslParser 在 async 路径处理）
    if (meta?.afterCompileHook) {
      const result = meta.afterCompileHook(schema)
      // 非阻塞：若 hook 返回 Promise，让调用方自行 await
      if (result instanceof Promise) {
        result.catch(err => {
          console.warn('[schema-dsl] afterCompile hook error:', err)
        })
      }
    }

    return schema
  },

  /**
   * 清除内部 key，返回纯净 JSON Schema（用于 toJsonSchema() 输出）
   */
  toJsonSchema(schema: JSONSchema, internalKeys: ReadonlySet<string>): JSONSchema {
    const result: JSONSchema = {}
    for (const [k, v] of Object.entries(schema)) {
      if (!internalKeys.has(k)) {
        result[k] = v
      }
    }
    return result
  },
}
