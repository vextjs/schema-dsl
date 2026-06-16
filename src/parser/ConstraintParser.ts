import type { JSONSchema } from '../types/schema.js'
import type { SchemaDslDiagnostic } from './TypeRegistry.js'

export interface ConstraintParseOptions {
  diagnostics?: SchemaDslDiagnostic[] | undefined
  path?: string | undefined
  input?: string | undefined
  emitWarning?: boolean | undefined
}

function _recordInvalidConstraint(
  constraint: string,
  baseType: string,
  options: ConstraintParseOptions | undefined
): void {
  options?.diagnostics?.push({
    code: 'INVALID_CONSTRAINT',
    severity: 'warning',
    path: options.path ?? '',
    input: options.input ?? `${baseType}:${constraint}`,
    constraint,
    message: `[schema-dsl] Invalid constraint "${constraint}" for type "${baseType}", ignored`,
  })
}

const FINITE_NUMBER_LITERAL = /^-?\d+(?:\.\d+)?$/

function _isFiniteNumberLiteral(raw: string): boolean {
  return FINITE_NUMBER_LITERAL.test(raw) && Number.isFinite(Number(raw))
}

function _parseFiniteNumber(raw: string, label: string): number {
  if (!_isFiniteNumberLiteral(raw)) {
    throw new Error(`[schema-dsl] Invalid ${label}: "${raw}"`)
  }
  return Number(raw)
}

function _parseEnumValues(values: string[], baseType: string): unknown[] {
  if (baseType === 'number' || baseType === 'integer') {
    return values.map(raw => {
      const value = _parseFiniteNumber(raw, `${baseType} enum value`)
      if (baseType === 'integer' && !Number.isInteger(value)) {
        throw new Error(`[schema-dsl] Invalid integer enum value: "${raw}"`)
      }
      return value
    })
  }

  if (baseType === 'boolean') {
    return values.map(raw => {
      if (raw !== 'true' && raw !== 'false') {
        throw new Error(`[schema-dsl] Invalid boolean enum value: "${raw}"`)
      }
      return raw === 'true'
    })
  }

  return values
}

/**
 * ConstraintParser — parses DSL constraint strings into Partial<JSONSchema>
 *
 * Fixes:
 *   DA-03 string:N semantic divergence → always returns exactLength:N (not minLength+maxLength)
 *   DB-03 negative range support → regex updated to /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
 *   P0-30 strict numeric parsing → invalid range fragments never become NaN / Infinity
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
  parse(constraintStr: string, baseType: string, options?: ConstraintParseOptions): Partial<JSONSchema> {
    if (!constraintStr) return {}

    const s = constraintStr.trim()
    if (!s) return {}

    // ========== 1. Comparison operators (number/integer only, highest priority) ==========
    if (baseType === 'number' || baseType === 'integer') {
      // >= : greater than or equal (supports negative and decimal)
      const gteMatch = /^>=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gteMatch) return { minimum: _parseFiniteNumber(gteMatch[1], 'numeric constraint') }

      // <= : less than or equal
      const lteMatch = /^<=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (lteMatch) return { maximum: _parseFiniteNumber(lteMatch[1], 'numeric constraint') }

      // > : greater than
      const gtMatch = /^>(-?\d+(?:\.\d+)?)$/.exec(s)
      if (gtMatch) return { exclusiveMinimum: _parseFiniteNumber(gtMatch[1], 'numeric constraint') }

      // < : less than
      const ltMatch = /^<(-?\d+(?:\.\d+)?)$/.exec(s)
      if (ltMatch) return { exclusiveMaximum: _parseFiniteNumber(ltMatch[1], 'numeric constraint') }

      // = : exact equal
      const eqMatch = /^=(-?\d+(?:\.\d+)?)$/.exec(s)
      if (eqMatch) return { enum: [_parseFiniteNumber(eqMatch[1], 'numeric constraint')] }
    }

    // ========== 2. Enum (x|y|z) ==========
    // Only when '|' is present and it is not a pure numeric range
    if (s.includes('|') && !/^-?\d*\.?\d*--?\d*\.?\d*$/.test(s)) {
      return { enum: _parseEnumValues(s.split('|').map(v => v.trim()), baseType) }
    }

    // ========== 3. Range constraint (supports negatives — fix DB-03) ==========
    // Format: N-M, N-, -M (N/M may include a minus sign and decimal point)
    // Regex: /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/
    // Note: in "-M" format the value is treated as an upper bound (absolute value), not a negative lower bound
    const rangeMatch = /^(-?\d*\.?\d*)-(-?\d*\.?\d*)$/.exec(s)
    if (rangeMatch) {
      const [, rawMin, rawMax] = rangeMatch
      const result: Partial<JSONSchema> = {}
      const hasMin = rawMin !== ''
      const hasMax = rawMax !== ''

      if (
        (!hasMin && !hasMax) ||
        (hasMin && !_isFiniteNumberLiteral(rawMin)) ||
        (hasMax && !_isFiniteNumberLiteral(rawMax))
      ) {
        _recordInvalidConstraint(constraintStr, baseType, options)
        if (options?.emitWarning !== false) {
          console.warn(`[schema-dsl] ConstraintParser: unrecognized constraint "${constraintStr}" for type "${baseType}" — ignored`)
        }
        return {}
      }

      if (baseType === 'string') {
        // string type: minLength / maxLength (integers, non-negative)
        if (hasMin) result.minLength = Math.max(0, Math.trunc(_parseFiniteNumber(rawMin, 'range bound')))
        // "-M" format: take absolute value
        if (hasMax) result.maxLength = Math.abs(Math.trunc(_parseFiniteNumber(rawMax, 'range bound')))
      } else if (baseType === 'array') {
        if (hasMin) result.minItems = Math.max(0, Math.trunc(_parseFiniteNumber(rawMin, 'range bound')))
        if (hasMax) result.maxItems = Math.abs(Math.trunc(_parseFiniteNumber(rawMax, 'range bound')))
      } else {
        // number / integer
        if (hasMin) result.minimum = _parseFiniteNumber(rawMin, 'range bound')
        if (hasMax) result.maximum = _parseFiniteNumber(rawMax, 'range bound')
      }

      return result
    }

    // ========== 4. Single-value constraint ==========
    // Positive integer or decimal, no leading minus (negatives are handled by comparison operators above)
    const singleMatch = /^(\d+(?:\.\d+)?)$/.exec(s)
    if (singleMatch) {
      const value = _parseFiniteNumber(singleMatch[1], 'numeric constraint')

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

    // ========== 5. Unparseable: warn and return {} ==========
    _recordInvalidConstraint(constraintStr, baseType, options)
    if (options?.emitWarning !== false) {
      console.warn(`[schema-dsl] ConstraintParser: unrecognized constraint "${constraintStr}" for type "${baseType}" — ignored`)
    }
    return {}
  },
}
