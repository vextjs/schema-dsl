import type { JSONSchema } from '../types/schema.js'
import type { ValidateOptions, ValidationErrorItem, ValidationResult } from '../types/validate.js'
import type { DslDefinition } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import type { DslParseOptions } from '../parser/DslParser.js'
import { Locale } from './Locale.js'
import { CONDITIONAL_RUNTIME_STATE, type ConditionalRuntimeState } from './ConditionalRuntime.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'

const EMPTY_ERRORS: ValidationErrorItem[] = []

export type ConditionalInternalSchema = JSONSchema & {
    _required?: boolean
    _label?: string
    _customMessages?: Record<string, string>
    _isConditional?: boolean
    _runtimeOnlyConditional?: boolean
    conditions?: Array<{ action?: string; message?: string; then?: unknown }>
    _evaluateCondition?: (cond: unknown, data: unknown) => { result: boolean; failedMessage?: string; requirementFailed?: boolean }
    else?: unknown
    [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState
}

interface ConditionalValidatorHooks {
    validateSchema<T>(schema: JSONSchema, data: T, options: ValidateOptions): ValidationResult<T>
    internalError<T>(error: unknown, data: T): ValidationResult<T>
    getMessageText?(key: string, params: Record<string, unknown>, options: ValidateOptions): string
    parseString?(dsl: string, options?: DslParseOptions): JSONSchema
    parseObject?(dsl: DslDefinition, options?: DslParseOptions): JSONSchema
    parseOptions?: DslParseOptions
}

export class ConditionalValidator {
    constructor(private readonly hooks: ConditionalValidatorHooks) { }

    hasAnyConditional(schema: ConditionalInternalSchema): boolean {
        return this._hasAnyConditional(schema, new WeakSet<object>())
    }

    validateWithConditionals<T>(
        schema: ConditionalInternalSchema,
        data: T,
        options: ValidateOptions,
        rootData?: Record<string, unknown>
    ): ValidationResult<T> {
        const errors: ValidationErrorItem[] = []
        const effectiveRoot = rootData ?? (data as Record<string, unknown>)
        const cleanSchema = this._stripConditionalNodes(schema) as ConditionalInternalSchema

        const baseResult = this.hooks.validateSchema(cleanSchema, data, options)
        if (!baseResult.valid) {
            errors.push(...(baseResult.errors ?? []))
        }

        errors.push(...this._runConditionalNodes(schema, data, '', options, effectiveRoot, null))

        if (errors.length === 0) return { valid: true, data, errors: EMPTY_ERRORS }
        return { valid: false, data, errors, errorMessage: errors[0]?.message }
    }

    validateConditional<T>(
        conditionalSchema: ConditionalInternalSchema,
        data: Record<string, unknown>,
        fieldName: string | null,
        fieldValue: T,
        options: ValidateOptions
    ): ValidationResult<T> {
        const runtimeState = conditionalSchema[CONDITIONAL_RUNTIME_STATE]
        const conditions = (runtimeState?.conditions ?? conditionalSchema.conditions ?? []) as Array<{ action?: string; message?: string; then?: unknown; type?: string }>

        if (conditions.length === 0 && conditionalSchema._runtimeOnlyConditional) {
            return {
                valid: false,
                data: fieldValue,
                errors: [{
                    message: '[schema-dsl] Function-based conditional schemas are runtime-only and cannot be restored from JSON serialization.',
                    path: '',
                    keyword: 'conditional',
                    params: {},
                }],
                errorMessage: '[schema-dsl] Function-based conditional schemas are runtime-only and cannot be restored from JSON serialization.',
            }
        }

        try {
            for (const cond of conditions) {
                const evaluation = runtimeState?.evaluateCondition(cond, data)
                    ?? conditionalSchema._evaluateCondition?.(cond, data)
                    ?? { result: false }
                const matched = evaluation.result

                if (cond.action === 'throw') {
                    if (matched) {
                        const errorMsg = evaluation.failedMessage ?? cond.message ?? 'Conditional validation failed'
                        const message = this.getMessageText(errorMsg, options, { condition: (cond as Record<string, unknown>)['type'] })
                        return {
                            valid: false,
                            data: fieldValue,
                            errors: [{ message, path: '', keyword: 'conditional', params: { condition: (cond as Record<string, unknown>)['type'] } }],
                            errorMessage: message,
                        }
                    }
                    continue
                }

                if (matched) {
                    const thenSchema = (cond as Record<string, unknown>)['then']
                    if (thenSchema !== undefined && thenSchema !== null) {
                        return this.executeThenBranch(thenSchema, data, fieldValue, fieldName, options)
                    }
                    return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
                }

                if (evaluation.requirementFailed) {
                    const errorMsg = cond.message ?? 'Condition not met'
                    const message = this.getMessageText(errorMsg, options)
                    return {
                        valid: false,
                        data: fieldValue,
                        errors: [{ message, path: '', keyword: 'conditional', params: {} }],
                        errorMessage: message,
                    }
                }
            }

            const elseSchema = runtimeState ? runtimeState.elseSchema : conditionalSchema.else
            if (elseSchema !== undefined) {
                if (elseSchema === null) return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
                return this.executeThenBranch(elseSchema, data, fieldValue, fieldName, options)
            }

            return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
        } catch (error) {
            return this.hooks.internalError(error, fieldValue)
        }
    }

    private executeThenBranch<T>(
        thenSchema: unknown,
        data: Record<string, unknown>,
        fieldValue: T,
        fieldName: string | null,
        options: ValidateOptions
    ): ValidationResult<T> {
        let resolved = thenSchema

        if (typeof resolved === 'string') {
            resolved = (this.hooks.parseString ?? DslParser.parseString)(resolved, this.hooks.parseOptions)
        }

        if (resolved !== null && typeof resolved === 'object') {
            const obj = resolved as Record<string, unknown>
            if (typeof obj['toSchema'] === 'function') {
                resolved = (obj['toSchema'] as () => JSONSchema)()
            }
        }

        const resolvedSchema = resolved as ConditionalInternalSchema
        if (resolvedSchema?._isConditional) {
            return this.validateConditional(resolvedSchema, data, fieldName, fieldValue, options)
        }

        if (resolved !== null && typeof resolved === 'object' && !Array.isArray(resolved)) {
            const obj = resolved as Record<string, unknown>
            if (obj['type'] === undefined && obj['oneOf'] === undefined && obj['anyOf'] === undefined && obj['allOf'] === undefined) {
                resolved = (this.hooks.parseObject ?? DslParser.parseObject)(resolved as DslDefinition, this.hooks.parseOptions)
            }
        }

        return this.validateFieldValue(resolved as JSONSchema, fieldValue, options)
    }

    private validateFieldValue<T>(schema: JSONSchema, fieldValue: T, options: ValidateOptions): ValidationResult<T> {
        const internalSchema = schema as ConditionalInternalSchema
        const isRequired = internalSchema._required === true

        if (!isRequired && (fieldValue === undefined || fieldValue === '')) {
            return { valid: true, data: fieldValue, errors: EMPTY_ERRORS }
        }

        if (isRequired && fieldValue === undefined) {
            const label = internalSchema._label ?? ''
            const customMsgs = internalSchema._customMessages ?? {}
            const allMsgs = { ...(options.messages ?? {}), ...customMsgs } as Record<string, string>
            let message: string
            if (allMsgs['required']) {
                message = this.getMessageText(allMsgs['required'], { ...options, messages: allMsgs }, { label })
            } else {
                message = this.getMessageText('required', { ...options, messages: allMsgs }, { label })
                if (label) message = `${label} ${message}`
            }
            return {
                valid: false,
                data: fieldValue,
                errors: [{ message, path: '', keyword: 'required', params: {} }],
                errorMessage: message,
            }
        }

        return this.hooks.validateSchema(schema, fieldValue, options)
    }

    private getMessageText(key: string, options: ValidateOptions, params: Record<string, unknown> = {}): string {
        if (this.hooks.getMessageText) {
            return this.hooks.getMessageText(key, params, options)
        }
        const locale = options.locale ?? Locale.getLocale()
        return Locale.getMessageText(key, (options.messages ?? {}) as Record<string, string>, locale)
    }

    private _hasAnyConditional(value: unknown, seen: WeakSet<object>): boolean {
        if (!value || typeof value !== 'object') return false
        const obj = value as ConditionalInternalSchema
        if (seen.has(obj)) return false
        seen.add(obj)
        if (obj._isConditional) return true

        for (const child of this._iterSchemaChildren(obj)) {
            if (this._hasAnyConditional(child, seen)) return true
        }
        return false
    }

    private _stripConditionalNodes(value: unknown): unknown {
        if (!value || typeof value !== 'object') return value
        if ((value as ConditionalInternalSchema)._isConditional) return {}

        if (Array.isArray(value)) {
            return value.map(item => this._stripConditionalNodes(item))
        }

        const source = value as Record<string, unknown>
        const result = cloneSchemaValue(source) as Record<string, unknown>

        const props = source['properties']
        if (props && typeof props === 'object' && !Array.isArray(props)) {
            const nextProps: Record<string, unknown> = {}
            const omitted = new Set<string>()

            for (const [key, child] of Object.entries(props as Record<string, unknown>)) {
                if (child && typeof child === 'object' && !Array.isArray(child) && (child as ConditionalInternalSchema)._isConditional) {
                    omitted.add(key)
                    continue
                }
                nextProps[key] = this._stripConditionalNodes(child)
            }

            result['properties'] = nextProps
            if (Array.isArray(source['required']) && omitted.size > 0) {
                const required = (source['required'] as string[]).filter(key => !omitted.has(key))
                if (required.length > 0) result['required'] = required
                else delete result['required']
            }
        }

        for (const key of ['items', 'additionalProperties', 'propertyNames', 'contains', 'not', 'if', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
            if (key in source) result[key] = this._stripConditionalNodes(source[key])
        }

        for (const key of ['allOf', 'anyOf', 'oneOf', 'prefixItems']) {
            const list = source[key]
            if (Array.isArray(list)) result[key] = list.map(item => this._stripConditionalNodes(item))
        }

        for (const key of ['patternProperties', 'dependentSchemas', 'definitions', '$defs']) {
            const map = source[key]
            if (map && typeof map === 'object' && !Array.isArray(map)) {
                result[key] = Object.fromEntries(
                    Object.entries(map as Record<string, unknown>).map(([childKey, child]) => [childKey, this._stripConditionalNodes(child)])
                )
            }
        }

        return result
    }

    private _runConditionalNodes(
        schema: unknown,
        data: unknown,
        path: string,
        options: ValidateOptions,
        rootData: Record<string, unknown>,
        fieldName: string | null
    ): ValidationErrorItem[] {
        if (!schema || typeof schema !== 'object') return []
        const internalSchema = schema as ConditionalInternalSchema

        if (internalSchema._isConditional) {
            const result = this.validateConditional(internalSchema, rootData, fieldName, data, options)
            if (result.valid) return []
            return (result.errors ?? []).map(err => this._prefixError(err, path))
        }

        const errors: ValidationErrorItem[] = []

        if (internalSchema.properties && data && typeof data === 'object' && !Array.isArray(data)) {
            const record = data as Record<string, unknown>
            for (const [key, childSchema] of Object.entries(internalSchema.properties)) {
                if (!this._hasAnyConditional(childSchema, new WeakSet<object>())) continue
                const childPath = path ? `${path}/${key}` : key
                errors.push(...this._runConditionalNodes(childSchema, record[key], childPath, options, rootData, key))
            }
        }

        if (internalSchema.items && Array.isArray(data)) {
            const tupleItems = Array.isArray(internalSchema.items) ? internalSchema.items : null
            for (let index = 0; index < data.length; index++) {
                const childSchema = tupleItems ? tupleItems[index] : internalSchema.items
                if (!childSchema || !this._hasAnyConditional(childSchema, new WeakSet<object>())) continue
                const childPath = path ? `${path}/${index}` : String(index)
                errors.push(...this._runConditionalNodes(childSchema, data[index], childPath, options, rootData, null))
            }
        }

        for (const childSchema of internalSchema.allOf ?? []) {
            if (!this._hasAnyConditional(childSchema, new WeakSet<object>())) continue
            errors.push(...this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName))
        }

        for (const childSchema of internalSchema.anyOf ?? []) {
            if (!this._hasAnyConditional(childSchema, new WeakSet<object>())) continue
            const clean = this._stripConditionalNodes(childSchema) as JSONSchema
            if (this.hooks.validateSchema(clean, data, { ...options, format: false }).valid) {
                errors.push(...this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName))
            }
        }

        for (const childSchema of internalSchema.oneOf ?? []) {
            if (!this._hasAnyConditional(childSchema, new WeakSet<object>())) continue
            const clean = this._stripConditionalNodes(childSchema) as JSONSchema
            if (this.hooks.validateSchema(clean, data, { ...options, format: false }).valid) {
                errors.push(...this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName))
            }
        }

        if (internalSchema.if) {
            const cleanIf = this._stripConditionalNodes(internalSchema.if) as JSONSchema
            const branch = this.hooks.validateSchema(cleanIf, data, { ...options, format: false }).valid
                ? internalSchema.then
                : internalSchema.else
            if (branch && this._hasAnyConditional(branch, new WeakSet<object>())) {
                errors.push(...this._runConditionalNodes(branch, data, path, options, rootData, fieldName))
            }
        }

        return errors
    }

    private _prefixError(err: ValidationErrorItem, path: string): ValidationErrorItem {
        if (!path) return err
        const ownPath = !err.path || err.path === 'value' ? '' : err.path
        const nextPath = ownPath ? `${path}/${ownPath}` : path
        return { ...err, path: nextPath, field: nextPath }
    }

    private _iterSchemaChildren(schema: ConditionalInternalSchema): unknown[] {
        const children: unknown[] = []
        if (schema.properties) children.push(...Object.values(schema.properties))
        if (schema.items) children.push(...(Array.isArray(schema.items) ? schema.items : [schema.items]))
        if (schema.allOf) children.push(...schema.allOf)
        if (schema.anyOf) children.push(...schema.anyOf)
        if (schema.oneOf) children.push(...schema.oneOf)
        if (schema.not) children.push(schema.not)
        if (schema.if) children.push(schema.if)
        if (schema.then) children.push(schema.then)
        if (schema.else) children.push(schema.else)
        for (const value of [schema.additionalProperties, schema.propertyNames, schema.contains, schema.unevaluatedItems, schema.unevaluatedProperties]) {
            if (value && typeof value === 'object') children.push(value)
        }
        for (const map of [schema.patternProperties, schema.dependentSchemas, schema.definitions, schema.$defs]) {
            if (map && typeof map === 'object' && !Array.isArray(map)) children.push(...Object.values(map))
        }
        const prefixItems = (schema as Record<string, unknown>)['prefixItems']
        if (Array.isArray(prefixItems)) children.push(...prefixItems)
        return children
    }
}
