import type { JSONSchemaInput } from './schema.js'

export type IRVersion = 1
export type IRNodeId = string
export type IRPath = string
export type IRSource = 'json-schema' | 'dsl-compiled' | 'conditional-internal'
export type IRScalarType = 'string' | 'number' | 'integer' | 'boolean' | 'null'
export type JsonScalar = string | number | boolean | null

export interface SchemaIR {
  kind: 'schema-ir'
  version: IRVersion
  source: IRSource
  root: IRNodeId
  graph: SchemaGraph
  annotations: IRAnnotation[]
  fallbacks: IRFallback[]
}

export interface SchemaGraph {
  nodes: Record<IRNodeId, RuleIR>
  edges: IREdge[]
  cycles: IRCycle[]
}

export interface IREdge {
  from: IRNodeId
  to: IRNodeId
  kind: IREdgeKind
  key?: string
  index?: number
}

export type IREdgeKind =
  | 'property'
  | 'patternProperty'
  | 'additionalProperties'
  | 'propertyNames'
  | 'item'
  | 'prefixItem'
  | 'contains'
  | 'dependency'
  | 'definition'
  | 'ref'
  | 'branch'
  | 'composition'

export interface IRCycle {
  node: IRNodeId
  ref?: string
  path: IRPath
}

interface BaseRuleIR {
  id: IRNodeId
  path: IRPath
}

export interface AlwaysRuleIR extends BaseRuleIR {
  kind: 'always'
}

export interface NeverRuleIR extends BaseRuleIR {
  kind: 'never'
}

export interface ScalarRuleIR extends BaseRuleIR {
  kind: 'scalar'
  types: IRScalarType[] | null
  enumValues?: JsonScalar[]
  constValue?: JsonScalar
  constraints: ScalarConstraintsIR
  runtimeValidators?: RuntimeValidatorIR[]
}

export interface ScalarConstraintsIR {
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number | boolean
  exclusiveMaximum?: number | boolean
  multipleOf?: number
}

export interface ObjectRuleIR extends BaseRuleIR {
  kind: 'object'
  required: string[]
  properties: Record<string, IRNodeId>
  patternProperties: Record<string, IRNodeId>
  dependencies: Record<string, DependencyIR>
  additionalProperties?: IRNodeId | boolean
  propertyNames?: IRNodeId
}

export interface DependencyIR {
  mode: 'schema' | 'property-list'
  target?: IRNodeId
  requiredProperties?: string[]
}

export interface ArrayRuleIR extends BaseRuleIR {
  kind: 'array'
  items?: IRNodeId | IRNodeId[] | boolean
  prefixItems: IRNodeId[]
  contains?: IRNodeId
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
}

export interface CompositionRuleIR extends BaseRuleIR {
  kind: 'composition'
  mode: 'allOf' | 'anyOf' | 'oneOf' | 'not' | 'ifThenElse'
  branches: CompositionBranchIR[]
}

export interface CompositionBranchIR {
  role: 'branch' | 'not' | 'if' | 'then' | 'else'
  node: IRNodeId
  index?: number
}

export interface RefRuleIR extends BaseRuleIR {
  kind: 'ref'
  ref: string
  resolution: 'local' | 'remote' | 'unresolved' | 'cyclic'
  target?: IRNodeId
}

export interface ConditionalRuleIR extends BaseRuleIR {
  kind: 'conditional'
  conditionCount: number
  runtimeOnly: boolean
  branches: ConditionalBranchIR[]
  hasElse: boolean
}

export interface ConditionalBranchIR {
  role: 'then' | 'else'
  node?: IRNodeId
  source: 'json-schema' | 'dsl-string' | 'builder' | 'unknown'
}

export interface RuntimeValidatorRuleIR extends BaseRuleIR {
  kind: 'runtime-validator'
  validators: RuntimeValidatorIR[]
}

export interface RuntimeValidatorIR {
  mode: 'sync' | 'async' | 'unknown'
  identity: string
}

export interface FallbackRuleIR extends BaseRuleIR {
  kind: 'fallback'
  fallback: IRFallback
}

export type RuleIR =
  | AlwaysRuleIR
  | NeverRuleIR
  | ScalarRuleIR
  | ObjectRuleIR
  | ArrayRuleIR
  | CompositionRuleIR
  | RefRuleIR
  | ConditionalRuleIR
  | RuntimeValidatorRuleIR
  | FallbackRuleIR

export type IRFallbackReason =
  | 'non-object-schema'
  | 'unsupported-keyword'
  | 'unsupported-schema'
  | 'unsupported-type'
  | 'remote-ref'
  | 'unresolved-ref'
  | 'cyclic-ref'
  | 'runtime-only'
  | 'ajv-only'
  | 'async-only'
  | 'dsl-branch'
  | 'export-loss'
  | 'type-drift'
  | 'validation-plan-fallback'

export interface IRFallback {
  reason: IRFallbackReason
  path: IRPath
  keyword?: string
  ref?: string
  message?: string
}

export type IRAnnotationKind =
  | 'conditional'
  | 'runtime-metadata'
  | 'validation-plan'
  | 'coerce'
  | 'export-loss'
  | 'type-drift'

export interface IRAnnotation {
  kind: IRAnnotationKind
  path: IRPath
  node?: IRNodeId
  data: Record<string, unknown>
}

export interface JsonSchemaToIROptions {
  source?: IRSource
}

export interface SchemaIRProjection {
  kind: 'ir-execution-plan'
  sourceIrVersion: IRVersion
  projections: {
    validation?: { safe: boolean; fallbackReasons: IRFallback[] }
    conditional?: { nodes: IRNodeId[]; fallbackReasons: IRFallback[] }
    exporter?: { lossMetadata: IRLossMetadata[] }
    typeInference?: { staticCoverage: string[]; runtimeOnly: string[] }
  }
}

export interface IRLossMetadata {
  path: IRPath
  keyword: string
  target: 'mysql' | 'postgresql' | 'mongodb' | 'markdown'
  status: 'represented' | 'partially-represented' | 'unsupported'
}

export type IRSchemaInput = JSONSchemaInput
