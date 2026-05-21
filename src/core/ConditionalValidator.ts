import type { JSONSchema } from '../types/schema.js'
import type { ValidateOptions, ValidationErrorItem, ValidationResult } from '../types/validate.js'
import type { DslDefinition } from '../types/dsl.js'
import { DslParser } from '../parser/DslParser.js'
import { Locale } from './Locale.js'
import { CONDITIONAL_RUNTIME_STATE, type ConditionalRuntimeState } from './ConditionalRuntime.js'

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
}

export class ConditionalValidator {
    constructor(private readonly hooks: ConditionalValidatorHooks) { }

    hasAnyConditional(schema: ConditionalInternalSchema): boolean {
        if (!schema.properties) return false
        return Object.values(schema.properties).some((fieldSchema) => {
            const fs = fieldSchema as ConditionalInternalSchema
            if (fs._isConditional) return true
            if (fs.properties) return this.hasAnyConditional(fs)
            return false
        })
    }

    validateWithConditionals<T>(
        schema: ConditionalInternalSchema,
        data: T,
        options: ValidateOptions,
        rootData?: Record<string, unknown>
    ): ValidationResult<T> {
        const errors: ValidationErrorItem[] = []
        const effectiveRoot = rootData ?? (data as Record<string, unknown>)
        const cleanSchema = JSON.parse(JSON.stringify(schema)) as ConditionalInternalSchema
        const conditionalFields: Record<string, ConditionalInternalSchema> = {}
        const nestedObjectFields: Record<string, ConditionalInternalSchema> = {}

        for (const [fieldName, fieldSchema] of Object.entries(schema.properties ?? {})) {
            const fs = fieldSchema as ConditionalInternalSchema
            if (fs._isConditional) {
                conditionalFields[fieldName] = fs
                delete cleanSchema.properties?.[fieldName]

                if (cleanSchema.required) {
                    cleanSchema.required = cleanSchema.required.filter(r => r !== fieldName)
                }
            } else if (fs.properties && this.hasAnyConditional(fs)) {
                nestedObjectFields[fieldName] = fs
                delete cleanSchema.properties?.[fieldName]
            }
        }

        const baseResult = this.hooks.validateSchema(cleanSchema, data, options)
        if (!baseResult.valid) {
            errors.push(...(baseResult.errors ?? []))
        }

        for (const [fieldName, conditionalSchema] of Object.entries(conditionalFields)) {
            const dataRecord = data as Record<string, unknown>
            const fieldResult = this.validateConditional(conditionalSchema, effectiveRoot, fieldName, dataRecord[fieldName], options)

            if (!fieldResult.valid) {
                for (const err of (fieldResult.errors ?? [])) {
                    const errPath = (!err.path || err.path === 'value') ? fieldName : err.path
                    errors.push({ ...err, path: errPath, field: errPath })
                }
            }
        }

        for (const [fieldName, nestedSchema] of Object.entries(nestedObjectFields)) {
            const dataRecord = data as Record<string, unknown>
            const nestedData = dataRecord[fieldName]

            if (nestedData === undefined || nestedData === null) {
                const partialSchema = JSON.parse(JSON.stringify(schema)) as ConditionalInternalSchema
                partialSchema.properties = { [fieldName]: nestedSchema }
                partialSchema.required = (schema.required ?? []).filter(r => r === fieldName)
                const partialResult = this.hooks.validateSchema(partialSchema, data, options)
                if (!partialResult.valid) {
                    errors.push(...(partialResult.errors ?? []))
                }
                continue
            }

            const nestedResult = this.validateWithConditionals(nestedSchema, nestedData, options, effectiveRoot)
            if (!nestedResult.valid) {
                for (const err of (nestedResult.errors ?? [])) {
                    const errPath = err.path ? `${fieldName}/${err.path}` : fieldName
                    errors.push({ ...err, path: errPath, field: errPath })
                }
            }
        }

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
        const locale = options.locale ?? Locale.getLocale()
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
                        const message = Locale.getMessageText(errorMsg, (options.messages ?? {}) as Record<string, string>, locale)
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
                    const message = Locale.getMessageText(errorMsg, (options.messages ?? {}) as Record<string, string>, locale)
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
            resolved = DslParser.parseString(resolved)
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
                resolved = DslParser.parseObject(resolved as DslDefinition)
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
            const locale = options.locale ?? Locale.getLocale()
            const label = internalSchema._label ?? ''
            const customMsgs = internalSchema._customMessages ?? {}
            const allMsgs = { ...(options.messages ?? {}), ...customMsgs } as Record<string, string>
            let message: string
            if (allMsgs['required']) {
                message = Locale.getMessageText(allMsgs['required'], allMsgs, locale)
            } else {
                message = Locale.getMessageText('required', allMsgs, locale)
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
}