import type { JSONSchema } from '../types/schema.js'

/**
 * ConstraintParser — parses DSL constraint strings into Partial<JSONSchema>
 *
 * Fixes:
 *   DA-03 string:N semantic divergence → always returns exactLength:N (not minLength+maxLength)
 *   DB-03 negative range support → regex updated to /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
 *
 * Return type is always Partial<JSONSchema>; never returns a raw string (v1 bug)
 */
export const ConstraintParser = {
  /**
   * Parse a constraint string
   * @param constraintStr - The constraint portion (type name and '!' already stripped)
   * @param baseType - Base type name ('string' | 'number' | 'integer' | 'array' | ...)
   * @returns Partial<JSONSchema>; returns {} when unparseable (avoids polluting the target schema)
   */
  parse(constraintStr: string, baseType: string): Partial<JSONSchema> {
    if (!constraintStr) return {}

    const s = constraintStr.trim()
    if (!s) return {}

    // ========== 1. Comparison operators (number/integer only, highest priority) ==========
    if (baseType === 'number' || baseType === 'integer') {
      // >= : greater than or equal (supports negative and decimal)
      const gteMatch = /^>=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gteMatch) return { minimum: parseFloat(gteMatch[1]) }

      // <= : less than or equal
      const lteMatch = /^<=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (lteMatch) return { maximum: parseFloat(lteMatch[1]) }

      // > : greater than
      const gtMatch = /^>(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gtMatch) return { exclusiveMinimum: parseFloat(gtMatch[1]) }

      // < : less than
      const ltMatch = /^<(-?\d+(?:\.\d+)?)$/.exec(s)
      if (ltMatch) return { exclusiveMaximum: parseFloat(ltMatch[1]) }

      // = : exact equal
      const eqMatch = /^=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (eqMatch) return { enum: [parseFloat(eqMatch[1])] }
    }

    // ========== 2. Enum (x|y|z) ==========
    // Only when '|' is present and it is not a pure numeric range
    if (s.includes('|') && !/^-?\d*\.?\d*--?\d*\.?\d*$/.test(s)) {
      return { enum: s.split('|').map(v => v.trim()) }
    }

    // ========== 3. Range constraint (supports negatives — fix DB-03) ==========
    // Format: N-M, N-, -M (N/M may include a minus sign and decimal point)
    // Regex: /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
    // Note: in "-M" format the value is treated as an upper bound (absolute value), not a negative lower bound
    const rangeMatch = /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/.exec(s)
    if (rangeMatch) {
      const [, rawMin, rawMax] = rangeMatch
      const result: Partial<JSONSchema> = {}

      if (baseType === 'string') {
        // string type: minLength / maxLength (integers)
        if (rawMin) result.minLength = parseInt(rawMin, 10)
        // "-M" format: take absolute value
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

    // ========== 4. Single-value constraint ==========
    // Positive integer or decimal, no leading minus (negatives are handled by comparison operators above)
    const singleMatch = /^(\d+(?:\.\d+)?)$/.exec(s)
    if (singleMatch) {
      const value = parseFloat(singleMatch[1])

      if (baseType === 'string') {
        // v1 compat: string:N → exactLength:N (exact length)
        return { exactLength: Math.floor(value) }
      } else if (baseType === 'array') {
        return { maxItems: Math.floor(value) }
      } else {
        // number/integer single value = upper bound (maximum)
        return { maximum: value }
      }
    }

    // ========== 5. Unparseable: return {} ==========
    return {}
  },
}
