import type { JSONSchema } from '../types/schema.js'
import type { DslDefinition } from '../types/dsl.js'
import { TypeRegistry } from './TypeRegistry.js'
import { ConstraintParser } from './ConstraintParser.js'
import { SchemaCompiler } from './SchemaCompiler.js'
import { PATTERNS } from '../config/patterns.js'

/**
 * DslParser — DSL 字符串和对象定义的统一入口解析器
 *
 * 替代 v1 中 DslBuilder._parseTypeString() 与 DslAdapter._parseType() 的双重实现。
 * 所有解析逻辑统一流经：
 *   parseString() → TypeRegistry.resolve() → ConstraintParser.parse() → SchemaCompiler.compile()
 */

/** JSON Schema 标准类型集合，用于区分原生 JSON Schema 对象与 DSL 定义对象 */
const JSON_SCHEMA_TYPES = new Set(['string', 'number', 'integer', 'boolean', 'array', 'object', 'null'])

/**
 * 判断一个对象是否为原生 JSON Schema（而非 DSL 定义对象）。
 *
 * 判断标准：
 *   1. `type` 字段是合法的 JSON Schema 类型字符串，或
 *   2. 包含 anyOf / oneOf / allOf / $ref 等 JSON Schema 关键字
 *
 * 这样可以区分：
 *   - `{ type: 'object', properties: {...} }` → 原生 JSON Schema ✅
 *   - `{ street: 'string!', city: 'string!' }` → DSL 定义 ✅
 */
function _isRawJsonSchema(obj: Record<string, unknown>): boolean {
  if (typeof obj['type'] === 'string' && JSON_SCHEMA_TYPES.has(obj['type'] as string)) return true
  if ('anyOf' in obj || 'oneOf' in obj || 'allOf' in obj || '$ref' in obj) return true
  return false
}

function _cleanRequiredMarks(schema: unknown): void {
  if (!schema || typeof schema !== 'object') return
  delete (schema as Record<string, unknown>)['_required']
  const obj = schema as JSONSchema
  if (obj.properties) {
    for (const prop of Object.values(obj.properties)) _cleanRequiredMarks(prop)
  }
  if (obj.items) _cleanRequiredMarks(obj.items)
}

function _resolveDsl(value: unknown): JSONSchema {
  if (value === null || value === undefined) return {}
  if (typeof value === 'string') return DslParser.parseString(value)
  if (typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if (typeof obj['toSchema'] === 'function') return (obj['toSchema'] as () => JSONSchema)()
    if (_isRawJsonSchema(obj)) return value as JSONSchema
    return DslParser.parseObject(value as DslDefinition)
  }
  return value as JSONSchema
}

function _schemaForTarget(targetField: string, dslValue: unknown): JSONSchema {
  const s = _resolveDsl(dslValue)
  const isRequired = s._required
  _cleanRequiredMarks(s)
  const result: JSONSchema = { properties: { [targetField]: s } }
  if (isRequired) result.required = [targetField]
  return result
}

function _buildMatchSchema(conditionField: string, targetField: string, map: Record<string, unknown>): JSONSchema {
  const entries = Object.entries(map).filter(([k]) => k !== '_default')
  const defaultDsl = map['_default']

  const build = (index: number): JSONSchema => {
    if (index >= entries.length) {
      if (defaultDsl === null || defaultDsl === undefined) return {}
      const defaultObj = defaultDsl as Record<string, unknown>
      if (defaultObj && defaultObj['_isMatch']) {
        return _buildMatchSchema(String(defaultObj['field']), targetField, defaultObj['map'] as Record<string, unknown>)
      }
      if (defaultObj && defaultObj['_isIf']) {
        return _buildIfSchema(String(defaultObj['condition']), targetField, defaultObj['then'], defaultObj['else'])
      }
      return _schemaForTarget(targetField, defaultDsl)
    }

    const [val, dslValue] = entries[index]
    if (dslValue === null || dslValue === undefined) return build(index + 1)

    const branchObj = dslValue as Record<string, unknown>
    let thenSchema: JSONSchema
    if (branchObj && branchObj['_isMatch']) {
      thenSchema = _buildMatchSchema(String(branchObj['field']), targetField, branchObj['map'] as Record<string, unknown>)
    } else if (branchObj && branchObj['_isIf']) {
      thenSchema = _buildIfSchema(String(branchObj['condition']), targetField, branchObj['then'], branchObj['else'])
    } else {
      thenSchema = _schemaForTarget(targetField, dslValue)
    }

    return {
      if: { properties: { [conditionField]: { const: val } } },
      then: thenSchema,
      else: build(index + 1),
    }
  }

  return build(0)
}

function _buildIfSchema(conditionField: string, targetField: string, thenDsl: unknown, elseDsl: unknown): JSONSchema {
  const thenObj = thenDsl as Record<string, unknown>
  const elseObj = elseDsl as Record<string, unknown>

  let thenResult: JSONSchema
  if (thenObj && thenObj['_isMatch']) {
    thenResult = _buildMatchSchema(String(thenObj['field']), targetField, thenObj['map'] as Record<string, unknown>)
  } else if (thenObj && thenObj['_isIf']) {
    thenResult = _buildIfSchema(String(thenObj['condition']), targetField, thenObj['then'], thenObj['else'])
  } else {
    thenResult = _schemaForTarget(targetField, thenDsl)
  }

  let elseResult: JSONSchema = {}
  if (elseDsl !== null && elseDsl !== undefined) {
    if (elseObj && elseObj['_isMatch']) {
      elseResult = _buildMatchSchema(String(elseObj['field']), targetField, elseObj['map'] as Record<string, unknown>)
    } else if (elseObj && elseObj['_isIf']) {
      elseResult = _buildIfSchema(String(elseObj['condition']), targetField, elseObj['then'], elseObj['else'])
    } else {
      elseResult = _schemaForTarget(targetField, elseDsl)
    }
  }

  return {
    if: { properties: { [conditionField]: { const: true } } },
    then: thenResult,
    else: elseResult,
  }
}

export const DslParser = {
  /**
   * 解析 DSL 字符串 → JSONSchema
   *
   * 支持格式：
   *   - 'string'          → { type: 'string' }
   *   - 'string!'         → { type: 'string', _required: true }
   *   - 'string:6'        → { type: 'string', exactLength: 6 }（DA-03 修复）
   *   - 'string:3-32'     → { type: 'string', minLength: 3, maxLength: 32 }
   *   - 'number:0-100'    → { type: 'number', minimum: 0, maximum: 100 }
   *   - 'number:-100-0'   → { type: 'number', minimum: -100, maximum: 0 }（DB-03 修复）
   *   - 'enum:a,b,c'      → { type: 'string', enum: ['a','b','c'] }
   *   - 'a|b|c'           → { type: 'string', enum: ['a','b','c'] }
   *   - 'array!1-10'      → { type: 'array', minItems:1, maxItems:10, _required:true }
   */
  parseString(dslStr: string): JSONSchema {
    if (!dslStr || typeof dslStr !== 'string') {
      return { type: 'string' }
    }

    let s = dslStr.trim()
    let required = false

    // ========== 预处理 1：array!N-M 特殊语法（v1 兼容）==========
    // 'array!1-10' → 等价于 'array:1-10' + required=true
    const arrayBangMatch = /^array!([\d-]+)$/.exec(s)
    if (arrayBangMatch) {
      s = `array:${arrayBangMatch[1]}`
      required = true
    }

    // ========== 预处理 2：末尾 '!' / '?' → required/optional 标记，剥离 ==========
    if (s.endsWith('!')) {
      required = true
      s = s.slice(0, -1)
    } else if (s.endsWith('?')) {
      s = s.slice(0, -1)
    }

    // ========== 特殊处理：pipe 枚举 'a|b|c'（无冒号，全段视为枚举）==========
    if (s.includes('|') && !s.includes(':')) {
      const rawValues = s.split('|').map(v => v.trim())
      // Auto-detect type from values
      if (rawValues.every(v => v === 'true' || v === 'false')) {
        // Boolean enum
        return {
          type: 'boolean',
          enum: rawValues.map(v => v === 'true'),
          ...(required ? { _required: true } : {}),
        }
      }
      const numericValues = rawValues.map(v => Number(v))
      if (rawValues.every((v, i) => v !== '' && !isNaN(numericValues[i]))) {
        // Numeric enum — always use 'number' type for v1 compat
        return {
          type: 'number',
          enum: numericValues,
          ...(required ? { _required: true } : {}),
        }
      }
      // String enum (default)
      return {
        type: 'string',
        enum: rawValues,
        ...(required ? { _required: true } : {}),
      }
    }

    // ========== 特殊处理：enum: 前缀 ==========
    // 'enum:a,b,c'         → { type:'string', enum:['a','b','c'] }
    // 'enum:number:1,2,3'  → { type:'number', enum:[1,2,3] }
    if (s.startsWith('enum:')) {
      return DslParser._parseEnumSyntax(s, required)
    }

    // ========== 特殊处理：types: 联合类型前缀（v1 兼容）==========
    // 'types:string|number'              → oneOf: [{ type:'string' }, { type:'number' }]
    // 'types:string:3-10|number:0-100'   → oneOf with constraints
    // 'types:email|phone'                → oneOf with format types
    if (s.startsWith('types:')) {
      return DslParser._parseUnionTypes(s.slice(6), required)
    }

    // ========== 特殊处理：array<TYPE> 语法 ==========
    // 'array<string>'                  → { type:'array', items:{ type:'string' } }
    // 'array<enum:public|private>'     → { type:'array', items:{ type:'string', enum:[...] } }
    // 'array:1-5<string:1-20>'         → { type:'array', minItems:1, maxItems:5, items:{ type:'string', minLength:1, maxLength:20 } }
    const arrayAngleWithConstraintMatch = /^array:([^<]+)<(.+)>$/.exec(s)
    if (arrayAngleWithConstraintMatch) {
      const arrayConstraint = ConstraintParser.parse(arrayAngleWithConstraintMatch[1], 'array')
      const itemSchema = DslParser.parseString(arrayAngleWithConstraintMatch[2])
      return {
        type: 'array',
        ...arrayConstraint,
        items: itemSchema,
        ...(required ? { _required: true } : {}),
      }
    }
    const arrayAngleMatch = /^array<(.+)>$/.exec(s)
    if (arrayAngleMatch) {
      const itemSchema = DslParser.parseString(arrayAngleMatch[1])
      return {
        type: 'array',
        items: itemSchema,
        ...(required ? { _required: true } : {}),
      }
    }

    // ========== 主解析：typeName[:constraint] ==========
    const colonIdx = s.indexOf(':')
    let typeName: string
    let constraintStr: string

    if (colonIdx === -1) {
      typeName = s
      constraintStr = ''
    } else {
      typeName = s.slice(0, colonIdx)
      constraintStr = s.slice(colonIdx + 1)
    }

    // ========== 特殊处理：pattern 类型（phone/idCard/creditCard/licensePlate/postalCode/passport）==========
    const PATTERN_TYPES = ['phone', 'idCard', 'creditCard', 'licensePlate', 'postalCode', 'passport'] as const
    if (PATTERN_TYPES.includes(typeName as typeof PATTERN_TYPES[number])) {
      const patternGroup = PATTERNS[typeName as keyof typeof PATTERNS] as Record<string, { pattern: RegExp; min?: number; max?: number; key: string }>
      if (patternGroup) {
        const arg = constraintStr || (typeName === 'creditCard' ? 'visa' : 'cn')
        const cfg = patternGroup[arg.toLowerCase()]
        if (cfg) {
          return {
            type: 'string',
            pattern: cfg.pattern.source,
            ...(cfg.min !== undefined ? { minLength: cfg.min } : {}),
            ...(cfg.max !== undefined ? { maxLength: cfg.max } : {}),
            _customMessages: { pattern: cfg.key },
            ...(required ? { _required: true } : {}),
          }
        }
      }
    }

    // TypeRegistry 解析
    const typeDef = TypeRegistry.resolve(typeName)

    // ConstraintParser 解析 — use resolved base type (e.g., 'string' for 'alphanum')
    const resolvedBaseType = (typeDef.baseSchema.type as string) ?? typeName
    const constraints = ConstraintParser.parse(constraintStr, resolvedBaseType)

    // SchemaCompiler 组装
    const schema = SchemaCompiler.compile(typeDef, constraints, {
      required,
    })

    return schema
  },

  /**
   * 解析对象 DSL 定义 → JSONSchema（type:object + properties + required[]）
   */
  parseObject(dslObj: DslDefinition): JSONSchema {
    const schema: JSONSchema = {
      type: 'object',
      properties: {},
      required: [],
    }

    for (const [rawKey, value] of Object.entries(dslObj)) {
      let fieldKey = rawKey
      let isKeyRequired = false

      // key! 后缀表示该字段必填
      if (rawKey.endsWith('!')) {
        fieldKey = rawKey.slice(0, -1)
        isKeyRequired = true
      }

      let fieldSchema: JSONSchema

      if (typeof value === 'string') {
        fieldSchema = DslParser.parseString(value)
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>
        if (obj['_isMatch']) {
          if (!schema.allOf) schema.allOf = []
          schema.allOf.push(_buildMatchSchema(String(obj['field']), fieldKey, obj['map'] as Record<string, unknown>))
          fieldSchema = { description: `Depends on ${String(obj['field'])}` }
        } else if (obj['_isIf']) {
          if (!schema.allOf) schema.allOf = []
          schema.allOf.push(_buildIfSchema(String(obj['condition']), fieldKey, obj['then'], obj['else']))
          fieldSchema = { description: `Conditional field based on ${String(obj['condition'])}` }
        } else if (typeof obj['toSchema'] === 'function') {
          // DslBuilder 实例或 ConditionalBuilder（有 toSchema 方法）
          fieldSchema = (obj['toSchema'] as () => JSONSchema)()
        } else if (_isRawJsonSchema(obj)) {
          // 原生 JSON Schema 对象（如 { type: 'object', properties: {...} }）直接透传
          fieldSchema = value as JSONSchema
        } else {
          // 嵌套 DslDefinition（如 { street: 'string!', city: 'string!' }）
          fieldSchema = DslParser.parseObject(value as DslDefinition)
        }
      } else {
        // 原样保留（兼容直接传入 schema 片段）
        fieldSchema = value as JSONSchema
      }

      // 处理必填标记：key! 优先于字段内部的 _required
      if (isKeyRequired) {
        ;(schema.required as string[]).push(fieldKey)
      } else if (fieldSchema._required) {
        ;(schema.required as string[]).push(fieldKey)
      }

      // 清除 _required 内部 key
      const { _required: _r, ...cleanSchema } = fieldSchema as JSONSchema & { _required?: boolean }
      void _r
      _cleanRequiredMarks(cleanSchema)

      ;(schema.properties as Record<string, JSONSchema>)[fieldKey] = cleanSchema
    }

    if ((schema.required as string[]).length === 0) {
      delete schema.required
    }

    return schema
  },

  // --------------- 私有工具 ---------------

  /** 解析 enum: 前缀语法 */
  _parseEnumSyntax(s: string, required: boolean): JSONSchema {
    // 去掉 'enum:' 前缀
    const rest = s.slice('enum:'.length)

    // 检查是否有类型前缀：'enum:number:1|2|3' 或 'enum:number:1,2,3'
    const typedEnumMatch = /^(string|number|integer|boolean):(.+)$/.exec(rest)
    if (typedEnumMatch) {
      const enumType = typedEnumMatch[1] as 'string' | 'number' | 'integer' | 'boolean'
      const rawStr = typedEnumMatch[2]
      const rawValues = (rawStr.includes('|') ? rawStr.split('|') : rawStr.split(',')).map(v => v.trim())
      const values = DslParser._coerceEnumValues(rawValues, enumType)
      return {
        type: enumType,
        enum: values,
        ...(required ? { _required: true } : {}),
      }
    }

    // 无类型前缀：默认 string，支持 | 和 , 两种分隔符
    return {
      type: 'string',
      enum: (rest.includes('|') ? rest.split('|') : rest.split(',')).map(v => v.trim()),
      ...(required ? { _required: true } : {}),
    }
  },

  /** 将字符串数组转换为指定类型的枚举值 */
  _coerceEnumValues(
    values: string[],
    type: 'string' | 'number' | 'integer' | 'boolean'
  ): (string | number | boolean)[] {
    if (type === 'number' || type === 'integer') {
      return values.map(v => {
        const n = parseFloat(v)
        if (isNaN(n)) throw new Error(`[schema-dsl] Invalid number enum value: "${v}"`)
        return n
      })
    }
    if (type === 'boolean') {
      return values.map(v => {
        if (v !== 'true' && v !== 'false')
          throw new Error(`[schema-dsl] Invalid boolean enum value: "${v}"`)
        return v === 'true'
      })
    }
    return values
  },

  /**
   * 解析 types: 联合类型语法（v1 兼容）
   *
   * 将 'string|number' 拆分为 oneOf 数组，每段独立解析。
   * 需要智能分割：'string:3-10|number:0-100' → ['string:3-10', 'number:0-100']
   * 单一类型时优化为普通 schema（不生成 oneOf）。
   */
  _parseUnionTypes(typesStr: string, required: boolean): JSONSchema {
    // Smart split by | that is a type separator (not inside constraints)
    const segments: string[] = []
    let current = ''
    let depth = 0

    for (let i = 0; i < typesStr.length; i++) {
      const ch = typesStr[i]
      if (ch === '<') { depth++; current += ch }
      else if (ch === '>') { depth--; current += ch }
      else if (ch === '|' && depth === 0) {
        if (current.trim()) segments.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    if (current.trim()) segments.push(current.trim())

    if (segments.length === 0) {
      throw new Error('[schema-dsl] types: requires at least one type')
    }

    // Single type → optimize to direct schema (no oneOf)
    if (segments.length === 1) {
      const schema = DslParser.parseString(segments[0])
      if (required) schema._required = true
      return schema
    }

    // Multiple types → oneOf
    const oneOf = segments.map(seg => DslParser.parseString(seg))

    return {
      oneOf,
      ...(required ? { _required: true } : {}),
    } as JSONSchema
  },
}
