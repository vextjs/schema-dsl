import { describe, expect, it } from 'vitest'

import { transformSchemaDsl } from '../../src/transform.js'

describe('transformSchemaDsl', () => {
  it('transforms schema-dsl string literal method calls', () => {
    const result = transformSchemaDsl('const field = "email!".description("Email")', {
      filename: 'user.ts',
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('import { dsl as __schemaDslDsl } from "schema-dsl/pure";')
    expect(result.code).toContain('__schemaDslDsl("email!").description("Email")')
  })

  it('uses an existing dsl import from the configured import source', () => {
    const result = transformSchemaDsl(
      'import { dsl as schemaDsl } from "schema-dsl/pure";\nconst field = "string!".description("Name")',
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('schemaDsl("string!").description("Name")')
    expect(result.code.match(/schema-dsl\/pure/g)).toHaveLength(1)
  })

  it('avoids import local name collisions', () => {
    const result = transformSchemaDsl(
      'const __schemaDslDsl = "taken";\nconst field = "email!".description("Email")',
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('dsl as __schemaDslDsl2')
    expect(result.code).toContain('__schemaDslDsl2("email!").description("Email")')
  })

  it('avoids nested binding collisions that would shadow injected imports', () => {
    const result = transformSchemaDsl(
      [
        'function buildField() {',
        '  const __schemaDslDsl = () => ({ description: () => "wrong" });',
        '  return "email!".description("Email");',
        '}',
      ].join('\n'),
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('dsl as __schemaDslDsl2')
    expect(result.code).toContain('__schemaDslDsl2("email!").description("Email")')
  })

  it('does not reuse an existing dsl import when a nested binding shadows it', () => {
    const result = transformSchemaDsl(
      [
        'import { dsl as schemaDsl } from "schema-dsl/pure";',
        'function buildField(schemaDsl: unknown) {',
        '  return "email!".description("Email");',
        '}',
      ].join('\n'),
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('dsl as __schemaDslDsl')
    expect(result.code).toContain('__schemaDslDsl("email!").description("Email")')
  })

  it('does not transform non DSL strings or dynamic values', () => {
    const source = [
      '"hello".description("Greeting")',
      'field.description("Field")',
      '`email:${suffix}`.description("Email")',
    ].join('\n')

    const result = transformSchemaDsl(source, { filename: 'user.ts' })

    expect(result.changed).toBe(false)
    expect(result.code).toBe(source)
  })

  it('is idempotent', () => {
    const first = transformSchemaDsl('const field = "email!".description("Email")', {
      filename: 'user.ts',
    })
    const second = transformSchemaDsl(first.code, { filename: 'user.ts' })

    expect(first.changed).toBe(true)
    expect(second.changed).toBe(false)
    expect(second.code).toBe(first.code)
  })
})
