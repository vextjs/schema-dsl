import type { JSONSchema, JSONSchemaInput } from '../types/schema.js'

export const CONDITIONAL_RUNTIME_STATE: unique symbol = Symbol('schema-dsl.conditionalRuntimeState')

export interface ConditionalRuntimeState {
    conditions: unknown[]
    elseSchema: string | JSONSchemaInput | null | undefined
    evaluateCondition: (conditionObj: unknown, data: unknown) => {
        result: boolean
        failedMessage?: string | null
        requirementFailed?: boolean
    }
}

export type ConditionalRuntimeSchema = JSONSchema & {
    [CONDITIONAL_RUNTIME_STATE]?: ConditionalRuntimeState
}

export function attachConditionalRuntime(schema: JSONSchema, state: ConditionalRuntimeState): ConditionalRuntimeSchema {
    Object.defineProperty(schema, CONDITIONAL_RUNTIME_STATE, {
        value: state,
        enumerable: false,
        configurable: false,
        writable: false,
    })

    return schema as ConditionalRuntimeSchema
}
