/**
 * ConditionalBuilder — 链式条件构建器
 *
 * v2 修复：
 *   C-03：assert() 抛出 ValidationError 而非 plain Error
 *   C-Y01：elseIf 语义正确
 *   C-Y02：build() 作为 toSchema() 别名（IDslBuilder 接口兼容）
 */

import type { JSONSchema } from '../types/schema.js'
import type { IConditionalBuilder } from '../types/conditional.js'
import { ValidationError } from '../errors/ValidationError.js'
import { Validator } from './Validator.js'
import { Locale } from './Locale.js'

// ==================== 内部数据结构 ====================

type ConditionFn = (data: unknown) => boolean

interface CombinedCondition {
  op: 'root' | 'and' | 'or'
  fn: ConditionFn
  message: string | null
}

interface ConditionEntry {
  type: 'if' | 'elseIf'
  condition: ConditionFn
  combinedConditions: CombinedCondition[]
  message?: string
  action?: 'throw'
  then?: string | JSONSchema | null
}

interface EvaluateResult {
  result: boolean
  failedMessage: string | null
  requirementFailed?: boolean
}

// ==================== ConditionalBuilder ====================

export class ConditionalBuilder implements IConditionalBuilder {
  private _conditions: ConditionEntry[]
  private _elseSchema: string | JSONSchema | null | undefined

  constructor() {
    this._conditions = []
    this._elseSchema = undefined
  }

  // ==================== 条件链式方法 ====================

  if(conditionFn: ConditionFn | string): this {
    // v1 compat: accept string field name and convert to function
    if (typeof conditionFn === 'string') {
      const fieldName = conditionFn
      conditionFn = ((data: unknown) => Boolean((data as Record<string, unknown>)[fieldName])) as ConditionFn
    }
    if (typeof conditionFn !== 'function') {
      throw new Error('[schema-dsl] Condition must be a function')
    }
    this._conditions.push({
      type: 'if',
      condition: conditionFn,
      combinedConditions: [{ op: 'root', fn: conditionFn, message: null }],
    })
    return this
  }

  and(conditionFn: ConditionFn): this {
    if (typeof conditionFn !== 'function') {
      throw new Error('[schema-dsl] Condition must be a function')
    }
    const last = this._conditions[this._conditions.length - 1]
    if (!last) throw new Error('[schema-dsl] .and() must follow .if() or .elseIf()')
    last.combinedConditions.push({ op: 'and', fn: conditionFn, message: null })
    return this
  }

  or(conditionFn: ConditionFn): this {
    if (typeof conditionFn !== 'function') {
      throw new Error('[schema-dsl] Condition must be a function')
    }
    const last = this._conditions[this._conditions.length - 1]
    if (!last) throw new Error('[schema-dsl] .or() must follow .if() or .elseIf()')
    last.combinedConditions.push({ op: 'or', fn: conditionFn, message: null })
    return this
  }

  elseIf(conditionFn: ConditionFn): this {
    if (typeof conditionFn !== 'function') {
      throw new Error('[schema-dsl] Condition must be a function')
    }
    if (this._conditions.length === 0) {
      throw new Error('[schema-dsl] .elseIf() must follow .if()')
    }
    this._conditions.push({
      type: 'elseIf',
      condition: conditionFn,
      combinedConditions: [{ op: 'root', fn: conditionFn, message: null }],
    })
    return this
  }

  message(msg: string): this {
    if (typeof msg !== 'string') {
      throw new Error('[schema-dsl] Message must be a string')
    }
    const last = this._conditions[this._conditions.length - 1]
    if (!last) throw new Error('[schema-dsl] .message() must follow .if() or .elseIf()')

    const lastCombined = last.combinedConditions[last.combinedConditions.length - 1]
    if (lastCombined) {
      lastCombined.message = msg
    }
    last.message = msg
    last.action = 'throw'
    return this
  }

  then(schema: string | JSONSchema | null): this {
    const last = this._conditions[this._conditions.length - 1]
    if (!last) throw new Error('[schema-dsl] .then() must follow .if() or .elseIf()')
    last.then = schema
    return this
  }

  else(schema: string | JSONSchema | null): this {
    this._elseSchema = schema
    return this
  }

  // ==================== 输出方法 ====================

  /**
   * 转换为包含条件数据的 Schema（供 Validator 内部使用）
   */
  toSchema(): JSONSchema {
    return {
      _isConditional: true,
      conditions: this._conditions,
      else: this._elseSchema,
      _evaluateCondition: (conditionObj: ConditionEntry, data: unknown) =>
        this._evaluateCondition(conditionObj, data),
    } as unknown as JSONSchema
  }

  /**
   * build() — toSchema() 别名（IConditionalBuilder 接口）
   */
  build(): JSONSchema {
    return this.toSchema()
  }

  // ==================== 验证方法 ====================

  validate(data: unknown, options: Record<string, unknown> = {}): unknown {
    const validator = new Validator(options)
    return validator.validate(this.toSchema(), data, options)
  }

  async validateAsync(data: unknown, options: Record<string, unknown> = {}): Promise<unknown> {
    const validator = new Validator(options)
    return validator.validateAsync(this.toSchema(), data, options)
  }

  /**
   * 同步断言 — 失败抛出 ValidationError（修复 C-03：v1 抛 plain Error）
   * 直接同步评估条件，无需走 Validator（Validator 是异步的）
   */
  assert(data: unknown, options: Record<string, unknown> = {}): unknown {
    const locale = (options.locale as string) ?? null
    for (const cond of this._conditions) {
      const { result: matched, failedMessage } = this._evaluateCondition(cond, data)
      if (matched && cond.action === 'throw') {
        const rawMsg = failedMessage ?? cond.message ?? 'Condition failed'
        const message = Locale.getMessageText(rawMsg, {}, locale)
        throw new ValidationError(
          [{ message, path: '', keyword: 'conditional', params: {} }],
          data,
        )
      }
    }
    return data
  }

  check(data: unknown): boolean {
    try {
      const conditions = this._conditions
      for (const cond of conditions) {
        const { result: matched } = this._evaluateCondition(cond, data)
        if (matched && cond.action === 'throw') return false
      }
      return true
    } catch {
      return false
    }
  }

  // ==================== 静态工厂方法 ====================

  static start(conditionFn: ConditionFn | string): ConditionalBuilder {
    return new ConditionalBuilder().if(conditionFn)
  }

  // ==================== 内部评估逻辑 ====================

  private _evaluateCondition(conditionObj: ConditionEntry, data: unknown): EvaluateResult {
    try {
      const isMessageMode = conditionObj.action === 'throw'
      const hasOrConditions = conditionObj.combinedConditions.some(c => c.op === 'or')

      // Chain check mode (v1 compat): message mode + root has own message
      // Each condition checked left-to-right, first TRUE = fail with its message
      const rootHasMessage = conditionObj.combinedConditions[0]?.message !== null
      const isChainCheckMode = isMessageMode && rootHasMessage

      if (isChainCheckMode) {
        for (const combined of conditionObj.combinedConditions) {
          try {
            const conditionResult = combined.fn(data)
            if (conditionResult) {
              return { result: true, failedMessage: combined.message ?? conditionObj.message ?? null }
            }
          } catch {
            // Condition threw — treat as not matched
          }
        }
        return { result: false, failedMessage: null }
      }

      // Message mode with AND only (no OR, shared message, root has no own message):
      // ALL conditions must be true to trigger
      if (isMessageMode && !hasOrConditions && conditionObj.combinedConditions.length > 1) {
        let allTrue = true
        for (const combined of conditionObj.combinedConditions) {
          if (!combined.fn(data)) {
            allTrue = false
            break
          }
        }
        if (allTrue) {
          return { result: true, failedMessage: conditionObj.message ?? null }
        }
        return { result: false, failedMessage: null }
      }

      // Message mode with OR (and possibly AND, shared message): AND/OR boolean with precedence
      if (isMessageMode && hasOrConditions) {
        let andGroupResult = true
        let finalResult = false
        for (const combined of conditionObj.combinedConditions) {
          const conditionResult = combined.fn(data)
          if (combined.op === 'root' || combined.op === 'and') {
            andGroupResult = andGroupResult && conditionResult
          } else if (combined.op === 'or') {
            finalResult = finalResult || andGroupResult
            andGroupResult = conditionResult
          }
        }
        finalResult = finalResult || andGroupResult
        if (finalResult) {
          return { result: true, failedMessage: conditionObj.message ?? null }
        }
        return { result: false, failedMessage: null }
      }

      // Message mode without AND/OR (single condition)
      if (isMessageMode) {
        const root = conditionObj.combinedConditions[0]
        if (root && root.fn(data)) {
          return { result: true, failedMessage: root.message ?? conditionObj.message ?? null }
        }
        return { result: false, failedMessage: null }
      }

      // Non-message (then/else) mode: standard AND/OR boolean evaluation
      let andGroupResult = true
      let finalResult = false
      for (const combined of conditionObj.combinedConditions) {
        const conditionResult = combined.fn(data)
        if (combined.op === 'root' || combined.op === 'and') {
          andGroupResult = andGroupResult && conditionResult
        } else if (combined.op === 'or') {
          finalResult = finalResult || andGroupResult
          andGroupResult = conditionResult
        }
      }
      const result = finalResult || andGroupResult
      return { result, failedMessage: null }
    } catch {
      return { result: false, failedMessage: null }
    }
  }
}
