import type { ConditionalInternalSchema } from '../ConditionalValidator.js'
import { CONDITIONAL_RUNTIME_STATE } from '../ConditionalRuntime.js'
import { createJsonSchemaIR } from './JsonSchemaToIR.js'
import { iterConditionalSchemaChildren } from './ConditionalTraversal.js'
import type { IRAnnotation, SchemaIR } from '../../types/ir.js'

export function createConditionalIR(schema: ConditionalInternalSchema): SchemaIR {
  return createJsonSchemaIR(schema, { source: 'conditional-internal' })
}

export function collectConditionalAnnotations(schema: ConditionalInternalSchema): IRAnnotation[] {
  const annotations: IRAnnotation[] = []
  collect(schema, '', annotations, new WeakSet<object>())
  return annotations
}

function collect(value: unknown, path: string, annotations: IRAnnotation[], seen: WeakSet<object>): void {
  if (!value || typeof value !== 'object') return
  const obj = value as ConditionalInternalSchema
  if (seen.has(obj)) return
  seen.add(obj)

  if (obj._isConditional) {
    const runtimeState = obj[CONDITIONAL_RUNTIME_STATE]
    const conditions = runtimeState?.conditions ?? obj.conditions ?? []
    annotations.push({
      kind: 'conditional',
      path,
      data: {
        conditionCount: Array.isArray(conditions) ? conditions.length : 0,
        runtimeOnly: obj._runtimeOnlyConditional === true,
        hasElse: runtimeState ? runtimeState.elseSchema !== undefined : obj.else !== undefined,
      },
    })
  }

  for (const { path: childPath, child } of iterConditionalSchemaChildren(obj, path)) {
    collect(child, childPath, annotations, seen)
  }
}
