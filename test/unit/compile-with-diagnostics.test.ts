import { describe, expect, it } from 'vitest'

import { compileWithDiagnostics } from '../../src/index.js'

describe('compileWithDiagnostics', () => {
  it('collects unknown type diagnostics while preserving fallback schema', () => {
    const result = compileWithDiagnostics({
      scene: 'admin_login!',
      completedAt: 'datetime',
    })

    expect(result.schema.properties?.scene.type).toBe('string')
    expect(result.schema.required).toContain('scene')
    expect(result.schema.properties?.completedAt.format).toBe('date-time')
    expect(result.diagnostics).toEqual([{
      code: 'UNKNOWN_TYPE',
      severity: 'warning',
      path: 'scene',
      input: 'admin_login!',
      typeName: 'admin_login',
      message: '[schema-dsl] Unknown type "admin_login", falling back to string',
    }])
  })

  it('supports error diagnostics without global strict-mode side effects', () => {
    const result = compileWithDiagnostics({ field: 'notatype!' }, { unknownType: 'error' })

    expect(result.schema.properties?.field.type).toBe('string')
    expect(result.schema.required).toContain('field')
    expect(result.diagnostics[0]?.severity).toBe('error')
    expect(result.diagnostics[0]?.code).toBe('UNKNOWN_TYPE')
  })

  it('supports ignore mode for compatibility-only compilation', () => {
    const result = compileWithDiagnostics({ field: 'notatype!' }, { unknownType: 'ignore' })

    expect(result.schema.properties?.field.type).toBe('string')
    expect(result.diagnostics).toEqual([])
  })
})
