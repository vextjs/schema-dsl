import type { JSONSchema } from '../types/schema.js'

/**
 * ConstraintParser — 解析 DSL 约束字符串 → Partial<JSONSchema>
 *
 * 修复：
 *   DA-03 string:N 语义分歧 → 统一返回 exactLength:N（而不是 minLength+maxLength）
 *   DB-03 负数范围支持 → 正则改为 /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
 *
 * 返回类型永远是 Partial<JSONSchema>，不返回 string（v1 bug）
 */
export const ConstraintParser = {
  /**
   * 解析约束字符串
   * @param constraintStr - 约束部分（已剥除类型名和 '!' 的字符串）
   * @param baseType - 基础类型名（'string' | 'number' | 'integer' | 'array' | ...）
   * @returns Partial<JSONSchema>，无法解析时返回 {}（不污染目标 schema）
   */
  parse(constraintStr: string, baseType: string): Partial<JSONSchema> {
    if (!constraintStr) return {}

    const s = constraintStr.trim()
    if (!s) return {}

    // ========== 1. 比较运算符（number/integer 专用，最高优先级）==========
    if (baseType === 'number' || baseType === 'integer') {
      // >= : 大于等于（支持负数和小数）
      const gteMatch = /^>=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gteMatch) return { minimum: parseFloat(gteMatch[1]) }

      // <= : 小于等于
      const lteMatch = /^<=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (lteMatch) return { maximum: parseFloat(lteMatch[1]) }

      // > : 大于
      const gtMatch = /^>(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gtMatch) return { exclusiveMinimum: parseFloat(gtMatch[1]) }

      // < : 小于
      const ltMatch = /^<(-?\d+(?:\.\d+)?)$/.exec(s)
      if (ltMatch) return { exclusiveMaximum: parseFloat(ltMatch[1]) }

      // = : 精确等于
      const eqMatch = /^=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (eqMatch) return { enum: [parseFloat(eqMatch[1])] }
    }

    // ========== 2. 枚举（x|y|z）==========
    // 仅当包含 | 且不是纯数字范围时
    if (s.includes('|') && !/^-?\d*\.?\d*--?\d*\.?\d*$/.test(s)) {
      return { enum: s.split('|').map(v => v.trim()) }
    }

    // ========== 3. 范围约束（支持负数 DB-03 修复）==========
    // 格式：N-M、N-、-M（N/M 可含负号和小数）
    // 正则：/^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
    // 注意："-M" 格式中 M 取绝对值作为上界（不表示下界为负数）
    const rangeMatch = /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/.exec(s)
    if (rangeMatch) {
      const [, rawMin, rawMax] = rangeMatch
      const result: Partial<JSONSchema> = {}

      if (baseType === 'string') {
        // string 类型：minLength / maxLength（整数）
        if (rawMin) result.minLength = parseInt(rawMin, 10)
        // "-M" 格式：取绝对值
        if (rawMax) result.maxLength = Math.abs(parseInt(rawMax, 10))
      } else if (baseType === 'array') {
        if (rawMin) result.minItems = parseInt(rawMin, 10)
        if (rawMax) result.maxItems = Math.abs(parseInt(rawMax, 10))
      } else {
        // number / integer
        if (rawMin) result.minimum = parseFloat(rawMin)
        if (rawMax) result.maximum = parseFloat(rawMax)
      }

      return result
    }

    // ========== 4. 单值约束 ==========
    // 正整数/小数，无负号（有负号走比较运算符路径）
    const singleMatch = /^(\d+(?:\.\d+)?)$/.exec(s)
    if (singleMatch) {
      const value = parseFloat(singleMatch[1])

      if (baseType === 'string') {
        // v1 compat: string:N → exactLength:N（精确长度）
        return { exactLength: Math.floor(value) }
      } else if (baseType === 'array') {
        return { maxItems: Math.floor(value) }
      } else {
        // number/integer 单值 = 上界（maximum）
        return { maximum: value }
      }
    }

    // ========== 5. 无法解析：返回 {} ==========
    return {}
  },
}
