import type { IRFallback, IRFallbackReason, IRPath } from '../../types/ir.js'

export function createIRFallback(
  reason: IRFallbackReason,
  path: IRPath,
  details: Omit<IRFallback, 'reason' | 'path'> = {},
): IRFallback {
  return { reason, path, ...details }
}

export function createUnsupportedKeywordFallback(path: IRPath, keyword: string): IRFallback {
  return createIRFallback('unsupported-keyword', path, {
    keyword,
    message: `Keyword "${keyword}" is not represented by the internal IR safe subset.`,
  })
}

export function createRemoteRefFallback(path: IRPath, ref: string): IRFallback {
  return createIRFallback('remote-ref', path, {
    ref,
    keyword: '$ref',
    message: `Remote ref "${ref}" is left to AJV/runtime resolution.`,
  })
}

export function createUnresolvedRefFallback(path: IRPath, ref: string): IRFallback {
  return createIRFallback('unresolved-ref', path, {
    ref,
    keyword: '$ref',
    message: `Local ref "${ref}" could not be resolved.`,
  })
}

export function createCyclicRefFallback(path: IRPath, ref: string): IRFallback {
  return createIRFallback('cyclic-ref', path, {
    ref,
    keyword: '$ref',
    message: `Local ref "${ref}" creates a cycle.`,
  })
}

export function createRuntimeOnlyFallback(path: IRPath, message: string): IRFallback {
  return createIRFallback('runtime-only', path, { message })
}
