import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'
import type { ValidateOptions, ValidationErrorItem, ValidationResult } from '../types/validate.js'
import type { DslDefinition } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import type { DslParseOptions } from '../parser/DslParser.js'
import { Locale } from './Locale.js'
import { CONDITIONAL_RUNTIME_STATE, type ConditionalRuntimeState } from './ConditionalRuntime.js'
import { cloneSchemaValue } from '../utils/schemaClone.js'
import { isRawJsonSchemaLike } from '../utils/schemaInput.js'

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
    validateSchema<T>(schema: JSONSchemaInput, data: T, options: ValidateOptions): ValidationResult<T>
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

        errors.push(...this._runConditionalNodes(schema, data, '', options, effectiveRoot, null, schema))

        if (errors.length === 0) return { valid: true, data, errors: EMPTY_ERRORS }
        const selectedErrors = options.allErrors === false ? errors.slice(0, 1) : errors
        return { valid: false, data, errors: selectedErrors, errorMessage: selectedErrors[0]?.message }
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

        const resolvedSchema = resolved as ConditionalInternalSchema | null
        if (resolvedSchema && typeof resolvedSchema === 'object' && resolvedSchema._isConditional) {
            return this.validateConditional(resolvedSchema, data, fieldName, fieldValue, options)
        }

        if (resolved !== null && typeof resolved === 'object' && !Array.isArray(resolved)) {
            const obj = resolved as Record<string, unknown>
            if (!isRawJsonSchemaLike(obj)) {
                resolved = (this.hooks.parseObject ?? DslParser.parseObject)(resolved as DslDefinition, this.hooks.parseOptions)
            }
        }

        return this.validateFieldValue(resolved as JSONSchemaInput, fieldValue, options)
    }

    private validateFieldValue<T>(schema: JSONSchemaInput, fieldValue: T, options: ValidateOptions): ValidationResult<T> {
        const internalSchema = (schema && typeof schema === 'object') ? schema as ConditionalInternalSchema : {}
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

        for (const key of ['items', 'additionalProperties', 'propertyNames', 'contains', 'then', 'else', 'unevaluatedItems', 'unevaluatedProperties']) {
            if (key in source) result[key] = this._stripConditionalNodes(source[key])
        }

        if ('not' in source) {
            if (this._hasConditionalChild(source['not'])) delete result['not']
            else result['not'] = this._stripConditionalNodes(source['not'])
        }

        if ('if' in source) {
            if (this._hasConditionalChild(source['if'])) {
                delete result['if']
                delete result['then']
                delete result['else']
            } else {
                result['if'] = this._stripConditionalNodes(source['if'])
            }
        }

        for (const key of ['allOf', 'anyOf']) {
            const list = source[key]
            if (Array.isArray(list)) result[key] = list.map(item => this._stripConditionalNodes(item))
        }

        const oneOf = source['oneOf']
        if (Array.isArray(oneOf)) {
            if (oneOf.some(item => this._hasConditionalChild(item))) delete result['oneOf']
            else result['oneOf'] = oneOf.map(item => this._stripConditionalNodes(item))
        }

        const prefixItems = source['prefixItems']
        if (Array.isArray(prefixItems)) {
            result['items'] = prefixItems.map(item => this._stripConditionalNodes(item))
            if ('items' in source) {
                result['additionalItems'] = this._stripConditionalNodes(source['items'])
            } else {
                result['additionalItems'] = true
            }
            delete result['prefixItems']
        }

        for (const key of ['patternProperties', 'definitions', '$defs']) {
            const map = source[key]
            if (map && typeof map === 'object' && !Array.isArray(map)) {
                result[key] = Object.fromEntries(
                    Object.entries(map as Record<string, unknown>).map(([childKey, child]) => [childKey, this._stripConditionalNodes(child)])
                )
            }
        }

        const dependentSchemas = source['dependentSchemas']
        if (dependentSchemas && typeof dependentSchemas === 'object' && !Array.isArray(dependentSchemas)) {
            const stripped = Object.fromEntries(
                Object.entries(dependentSchemas as Record<string, unknown>).map(([childKey, child]) => [childKey, this._stripConditionalNodes(child)])
            )
            const dependencies = result['dependencies']
            result['dependencies'] =
                dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)
                    ? { ...(dependencies as Record<string, unknown>), ...stripped }
                    : stripped
            delete result['dependentSchemas']
        }

        const dependencies = source['dependencies']
        if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
            const stripped = Object.fromEntries(
                Object.entries(dependencies as Record<string, unknown>).map(([childKey, child]) => [
                    childKey,
                    Array.isArray(child) ? [...child] : this._stripConditionalNodes(child),
                ])
            )
            const existing = result['dependencies']
            result['dependencies'] =
                existing && typeof existing === 'object' && !Array.isArray(existing)
                    ? { ...(existing as Record<string, unknown>), ...stripped }
                    : stripped
        }

        return result
    }

    private _runConditionalNodes(
        schema: unknown,
        data: unknown,
        path: string,
        options: ValidateOptions,
        rootData: Record<string, unknown>,
        fieldName: string | null,
        rootSchema: unknown = schema,
        seenRefs = new Set<string>()
    ): ValidationErrorItem[] {
        if (!schema || typeof schema !== 'object') return []
        const internalSchema = schema as ConditionalInternalSchema

        if (internalSchema._isConditional) {
            const result = this.validateConditional(internalSchema, rootData, fieldName, data, options)
            if (result.valid) return []
            return (result.errors ?? []).map(err => this._prefixError(err, path))
        }

        const errors: ValidationErrorItem[] = []
        const ref = (internalSchema as Record<string, unknown>)['$ref']
        if (typeof ref === 'string' && !seenRefs.has(ref)) {
            const resolved = this._resolveLocalRef(rootSchema, ref)
            if (resolved !== undefined && resolved !== schema) {
                seenRefs.add(ref)
                errors.push(...this._runConditionalNodes(resolved, data, path, options, rootData, fieldName, rootSchema, seenRefs))
                seenRefs.delete(ref)
            }
        }

        if (internalSchema.properties && data && typeof data === 'object' && !Array.isArray(data)) {
            const record = data as Record<string, unknown>
            for (const [key, childSchema] of Object.entries(internalSchema.properties)) {
                if (!this._hasConditionalChild(childSchema, rootSchema)) continue
                const childPath = path ? `${path}/${key}` : key
                errors.push(...this._runConditionalNodes(childSchema, record[key], childPath, options, rootData, key, rootSchema, seenRefs))
            }
        }

        if (internalSchema.patternProperties && data && typeof data === 'object' && !Array.isArray(data)) {
            const record = data as Record<string, unknown>
            for (const [pattern, childSchema] of Object.entries(internalSchema.patternProperties as Record<string, unknown>)) {
                if (!this._hasConditionalChild(childSchema, rootSchema)) continue
                const matcher = this._createPatternMatcher(pattern)
                if (!matcher) continue
                for (const [key, value] of Object.entries(record)) {
                    if (!matcher.test(key)) continue
                    const childPath = path ? `${path}/${key}` : key
                    errors.push(...this._runConditionalNodes(childSchema, value, childPath, options, rootData, key, rootSchema, seenRefs))
                }
            }
        }

        if (internalSchema.additionalProperties && typeof internalSchema.additionalProperties === 'object' && data && typeof data === 'object' && !Array.isArray(data)) {
            if (this._hasConditionalChild(internalSchema.additionalProperties, rootSchema)) {
                const record = data as Record<string, unknown>
                const declaredProperties = new Set(Object.keys(internalSchema.properties ?? {}))
                const patternMatchers = this._createPatternMatchers(internalSchema.patternProperties)

                for (const [key, value] of Object.entries(record)) {
                    if (declaredProperties.has(key)) continue
                    if (patternMatchers.some(matcher => matcher.test(key))) continue
                    const childPath = path ? `${path}/${key}` : key
                    errors.push(...this._runConditionalNodes(internalSchema.additionalProperties, value, childPath, options, rootData, key, rootSchema, seenRefs))
                }
            }
        }

        if (internalSchema.propertyNames && data && typeof data === 'object' && !Array.isArray(data)) {
            if (this._hasConditionalChild(internalSchema.propertyNames, rootSchema)) {
                for (const key of Object.keys(data as Record<string, unknown>)) {
                    const childPath = path ? `${path}/${key}` : key
                    errors.push(...this._runConditionalNodes(internalSchema.propertyNames, key, childPath, options, rootData, key, rootSchema, seenRefs))
                }
            }
        }

        errors.push(...this._runConditionalDependencies(internalSchema.dependentSchemas, data, path, options, rootData, rootSchema, seenRefs))
        errors.push(...this._runConditionalDependencies(internalSchema.dependencies, data, path, options, rootData, rootSchema, seenRefs))

        if (internalSchema.items && Array.isArray(data)) {
            const tupleItems = Array.isArray(internalSchema.items) ? internalSchema.items : null
            const prefixItems = (internalSchema as Record<string, unknown>)['prefixItems']
            const startIndex = !tupleItems && Array.isArray(prefixItems) ? prefixItems.length : 0
            for (let index = startIndex; index < data.length; index++) {
                const childSchema = tupleItems ? tupleItems[index] : internalSchema.items
                if (!childSchema || !this._hasConditionalChild(childSchema, rootSchema)) continue
                const childPath = path ? `${path}/${index}` : String(index)
                errors.push(...this._runConditionalNodes(childSchema, data[index], childPath, options, rootData, null, rootSchema, seenRefs))
            }
        }

        const prefixItems = (internalSchema as Record<string, unknown>)['prefixItems']
        if (Array.isArray(prefixItems) && Array.isArray(data)) {
            for (let index = 0; index < data.length && index < prefixItems.length; index++) {
                const childSchema = prefixItems[index]
                if (!this._hasConditionalChild(childSchema, rootSchema)) continue
                const childPath = path ? `${path}/${index}` : String(index)
                errors.push(...this._runConditionalNodes(childSchema, data[index], childPath, options, rootData, null, rootSchema, seenRefs))
            }
        }

        if (internalSchema.contains && Array.isArray(data) && this._hasConditionalChild(internalSchema.contains, rootSchema)) {
            const containsSchema = internalSchema.contains
            const cleanContains = this._stripConditionalNodes(containsSchema) as JSONSchema
            let firstConditionalErrors: ValidationErrorItem[] | null = null

            for (let index = 0; index < data.length; index++) {
                if (!this.hooks.validateSchema(cleanContains, data[index], options).valid) continue
                const childPath = path ? `${path}/${index}` : String(index)
                const childErrors = this._runConditionalNodes(containsSchema, data[index], childPath, options, rootData, null, rootSchema, seenRefs)
                if (childErrors.length === 0) {
                    firstConditionalErrors = null
                    break
                }
                firstConditionalErrors ??= childErrors
            }

            if (firstConditionalErrors) errors.push(...firstConditionalErrors)
        }

        for (const childSchema of internalSchema.allOf ?? []) {
            if (!this._hasConditionalChild(childSchema, rootSchema)) continue
            errors.push(...this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName, rootSchema, seenRefs))
        }

        const anyOfSchemas = internalSchema.anyOf ?? []
        if (anyOfSchemas.some(childSchema => this._hasConditionalChild(childSchema, rootSchema))) {
            let matched = false
            let firstConditionalErrors: ValidationErrorItem[] | null = null

            for (const childSchema of anyOfSchemas) {
                const clean = this._stripConditionalNodes(childSchema) as JSONSchema
                if (!this.hooks.validateSchema(clean, data, options).valid) continue
                if (!this._hasConditionalChild(childSchema, rootSchema)) {
                    matched = true
                    break
                }

                const childErrors = this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName, rootSchema, seenRefs)
                if (childErrors.length === 0) {
                    matched = true
                    break
                }
                firstConditionalErrors ??= childErrors
            }

            if (!matched && firstConditionalErrors) errors.push(...firstConditionalErrors)
        }

        const oneOfSchemas = internalSchema.oneOf ?? []
        if (oneOfSchemas.some(childSchema => this._hasConditionalChild(childSchema, rootSchema))) {
            let matches = 0
            let firstConditionalErrors: ValidationErrorItem[] | null = null

            for (const childSchema of oneOfSchemas) {
                const clean = this._stripConditionalNodes(childSchema) as JSONSchema
                if (!this.hooks.validateSchema(clean, data, options).valid) continue
                if (!this._hasConditionalChild(childSchema, rootSchema)) {
                    matches += 1
                    continue
                }

                const childErrors = this._runConditionalNodes(childSchema, data, path, options, rootData, fieldName, rootSchema, seenRefs)
                if (childErrors.length === 0) matches += 1
                else firstConditionalErrors ??= childErrors
            }

            if (matches === 0 && firstConditionalErrors) {
                errors.push(...firstConditionalErrors)
            } else if (matches !== 1) {
                errors.push(this._createKeywordError('oneOf', path, 'value must match exactly one schema'))
            }
        }

        if (internalSchema.not && this._hasConditionalChild(internalSchema.not, rootSchema)) {
            const notMatch = this._validateSchemaNode(internalSchema.not, data, path, options, rootData, fieldName, rootSchema, seenRefs)
            if (notMatch.length === 0) {
                errors.push(this._createKeywordError('not', path, 'value must NOT be valid'))
            }
        }

        if (internalSchema.if !== undefined) {
            const ifHasConditional = this._hasConditionalChild(internalSchema.if, rootSchema)
            const conditionMatched = ifHasConditional
                ? this._validateSchemaNode(internalSchema.if, data, path, options, rootData, fieldName, rootSchema, seenRefs).length === 0
                : this.hooks.validateSchema(this._stripConditionalNodes(internalSchema.if) as JSONSchema, data, options).valid
            const branch = conditionMatched ? internalSchema.then : internalSchema.else

            if (branch !== undefined && ifHasConditional) {
                errors.push(...this._validateSchemaNode(branch, data, path, options, rootData, fieldName, rootSchema, seenRefs))
            } else if (branch !== undefined && this._hasConditionalChild(branch, rootSchema)) {
                errors.push(...this._runConditionalNodes(branch, data, path, options, rootData, fieldName, rootSchema, seenRefs))
            }
        }

        return errors
    }

    private _hasConditionalChild(schema: unknown, rootSchema?: unknown, seenRefs = new Set<string>()): boolean {
        if (!schema || typeof schema !== 'object') return false
        if (this._hasAnyConditional(schema as ConditionalInternalSchema, new WeakSet<object>())) return true

        const ref = (schema as Record<string, unknown>)['$ref']
        if (typeof ref !== 'string' || rootSchema === undefined || seenRefs.has(ref)) return false
        const resolved = this._resolveLocalRef(rootSchema, ref)
        if (resolved === undefined || resolved === schema) return false

        seenRefs.add(ref)
        const result = this._hasConditionalChild(resolved, rootSchema, seenRefs)
        seenRefs.delete(ref)
        return result
    }

    private _validateSchemaNode(
        schema: unknown,
        data: unknown,
        path: string,
        options: ValidateOptions,
        rootData: Record<string, unknown>,
        fieldName: string | null,
        rootSchema: unknown = schema,
        seenRefs = new Set<string>()
    ): ValidationErrorItem[] {
        const clean = this._stripConditionalNodes(schema) as JSONSchema
        const errors: ValidationErrorItem[] = []
        const baseResult = this.hooks.validateSchema(clean, data, options)

        if (!baseResult.valid) {
            errors.push(...(baseResult.errors ?? []).map(err => this._prefixError(err, path)))
        }
        errors.push(...this._runConditionalNodes(schema, data, path, options, rootData, fieldName, rootSchema, seenRefs))
        return errors
    }

    private _runConditionalDependencies(
        dependencies: unknown,
        data: unknown,
        path: string,
        options: ValidateOptions,
        rootData: Record<string, unknown>,
        rootSchema: unknown,
        seenRefs: Set<string>
    ): ValidationErrorItem[] {
        if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies)) return []
        if (!data || typeof data !== 'object' || Array.isArray(data)) return []

        const record = data as Record<string, unknown>
        const errors: ValidationErrorItem[] = []
        for (const [key, childSchema] of Object.entries(dependencies as Record<string, unknown>)) {
            if (!Object.prototype.hasOwnProperty.call(record, key)) continue
            if (Array.isArray(childSchema)) continue
            if (!this._hasConditionalChild(childSchema, rootSchema)) continue
            errors.push(...this._runConditionalNodes(childSchema, data, path, options, rootData, key, rootSchema, seenRefs))
        }
        return errors
    }

    private _resolveLocalRef(rootSchema: unknown, ref: string): unknown {
        if (!ref.startsWith('#')) return undefined
        if (ref === '#') return rootSchema
        if (!ref.startsWith('#/')) return undefined

        let current = rootSchema
        for (const rawSegment of ref.slice(2).split('/')) {
            if (!current || typeof current !== 'object') return undefined
            const segment = this._decodeJsonPointerSegment(rawSegment)
            current = (current as Record<string, unknown>)[segment]
        }
        return current
    }

    private _decodeJsonPointerSegment(segment: string): string {
        let decoded = segment
        try {
            decoded = decodeURIComponent(segment)
        } catch {
            decoded = segment
        }
        return decoded.replace(/~1/g, '/').replace(/~0/g, '~')
    }

    private _createPatternMatcher(pattern: string): RegExp | null {
        try {
            return new RegExp(pattern)
        } catch {
            return null
        }
    }

    private _createPatternMatchers(patternProperties: unknown): RegExp[] {
        if (!patternProperties || typeof patternProperties !== 'object' || Array.isArray(patternProperties)) return []
        return Object.keys(patternProperties as Record<string, unknown>)
            .map(pattern => this._createPatternMatcher(pattern))
            .filter((matcher): matcher is RegExp => matcher !== null)
    }

    private _createKeywordError(keyword: string, path: string, message: string): ValidationErrorItem {
        const errorPath = path || 'value'
        return {
            message,
            path: errorPath,
            keyword,
            params: {},
            field: errorPath,
            type: keyword,
        }
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
        const dependencies = (schema as Record<string, unknown>)['dependencies']
        if (dependencies && typeof dependencies === 'object' && !Array.isArray(dependencies)) {
            children.push(...Object.values(dependencies as Record<string, unknown>).filter(child => !Array.isArray(child)))
        }
        const prefixItems = (schema as Record<string, unknown>)['prefixItems']
        if (Array.isArray(prefixItems)) children.push(...prefixItems)
        return children
    }
}
