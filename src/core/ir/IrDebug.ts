import type { SchemaIR } from '../../types/ir.js'

export function createStableIRSnapshot(ir: SchemaIR): unknown {
  const nodes = Object.fromEntries(
    Object.entries(ir.graph.nodes)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([id, node]) => [id, node]),
  )
  const edges = [...ir.graph.edges].sort((left, right) => {
    const leftKey = `${left.from}:${left.kind}:${left.key ?? ''}:${left.index ?? -1}:${left.to}`
    const rightKey = `${right.from}:${right.kind}:${right.key ?? ''}:${right.index ?? -1}:${right.to}`
    return leftKey.localeCompare(rightKey)
  })

  return {
    kind: ir.kind,
    version: ir.version,
    source: ir.source,
    root: ir.root,
    nodes,
    edges,
    cycles: ir.graph.cycles,
    annotations: ir.annotations,
    fallbacks: ir.fallbacks,
  }
}
