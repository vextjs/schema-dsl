import { describe, expect, it } from 'vitest'

import { TransformSchemaDslError, transformSchemaDsl } from '../../src/transform.js'

describe('transformSchemaDsl', () => {
  it('transforms schema-dsl string literal method calls', () => {
    const result = transformSchemaDsl('const field = "email!".description("Email")', {
      filename: 'user.ts',
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('import { dsl as __schemaDslDsl } from "schema-dsl/pure";')
    expect(result.code).toContain('__schemaDslDsl("email!").description("Email")')
  })

  it('transforms the full built-in String extension method set by default', () => {
    const result = transformSchemaDsl(
      [
        'const email = "email!".label("Email")',
        'const name = "string!".pattern(/^[a-z]+$/).required()',
        'const age = "number".require()',
        'const schema = "string!".toJsonSchema()',
      ].join('\n'),
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("email!").label("Email")')
    expect(result.code).toContain('__schemaDslDsl("string!").pattern(/^[a-z]+$/).required()')
    expect(result.code).toContain('__schemaDslDsl("number").require()')
    expect(result.code).toContain('__schemaDslDsl("string!").toJsonSchema()')
    expect(result.warnings).toHaveLength(0)
  })

  it('transforms naked pipe enum string chains by default', () => {
    const result = transformSchemaDsl('const role = "admin|user|guest".label("Role")', {
      filename: 'user.ts',
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("admin|user|guest").label("Role")')
  })

  it('adds user-defined chain methods through additionalMethods', () => {
    const result = transformSchemaDsl('const tenant = "string!".tenantId().label("Tenant")', {
      filename: 'user.ts',
      additionalMethods: ['tenantId'],
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("string!").tenantId().label("Tenant")')
    expect(result.warnings).toHaveLength(0)
  })

  it('transforms configured custom DSL type literals through additionalTypes', () => {
    const result = transformSchemaDsl('const tenant = "tenant-id!".label("Tenant")', {
      filename: 'user.ts',
      additionalTypes: ['tenant-id'],
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("tenant-id!").label("Tenant")')
    expect(result.warnings).toHaveLength(0)
  })

  it('combines configured custom DSL type literals with user-defined chain methods', () => {
    const result = transformSchemaDsl('const tenant = "invoice-id!".tenantId().label("Tenant")', {
      filename: 'user.ts',
      additionalMethods: ['tenantId'],
      additionalTypes: ['invoice-id'],
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("invoice-id!").tenantId().label("Tenant")')
    expect(result.warnings).toHaveLength(0)
  })

  it('transforms custom DSL type literals matched by additionalTypePatterns', () => {
    const result = transformSchemaDsl('const tenant = "tenant-42!".label("Tenant")', {
      filename: 'user.ts',
      additionalTypePatterns: ['^tenant-[0-9]+!?$'],
    })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("tenant-42!").label("Tenant")')
  })

  it('resets stateful custom DSL type regex patterns between literals', () => {
    const result = transformSchemaDsl(
      [
        'const first = "tenant-42!".label("Tenant")',
        'const second = "tenant-43!".label("Tenant")',
      ].join('\n'),
      {
        filename: 'user.ts',
        additionalTypePatterns: [/^tenant-[0-9]+!?$/g],
      },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("tenant-42!").label("Tenant")')
    expect(result.code).toContain('__schemaDslDsl("tenant-43!").label("Tenant")')
    expect(result.warnings).toHaveLength(0)
  })

  it('warns when a schema-dsl string chain uses an unconfigured extension method', () => {
    const result = transformSchemaDsl('const tenant = "string!".tenantId().label("Tenant")', {
      filename: 'user.ts',
    })

    expect(result.changed).toBe(false)
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'unconfigured-extension-method',
        filename: 'user.ts',
      }),
    ])
  })

  it('still skips unconfigured custom DSL type literals by default', () => {
    const result = transformSchemaDsl('const tenant = "tenant-id!".label("Tenant")', {
      filename: 'user.ts',
    })

    expect(result.changed).toBe(false)
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'non-dsl-literal',
        filename: 'user.ts',
      }),
    ])
  })

  it('preserves methods as a legacy replacement set and combines additionalMethods additively', () => {
    const result = transformSchemaDsl(
      [
        'const tenant = "string!".tenantId()',
        'const email = "email!".label("Email")',
      ].join('\n'),
      {
        filename: 'user.ts',
        methods: ['tenantId'],
        additionalMethods: ['label'],
      },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("string!").tenantId()')
    expect(result.code).toContain('__schemaDslDsl("email!").label("Email")')
  })

  it('treats methods as a legacy replacement set when used without additionalMethods', () => {
    const result = transformSchemaDsl('const email = "email!".label("Email")', {
      filename: 'user.ts',
      methods: ['tenantId'],
    })

    expect(result.changed).toBe(false)
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'unconfigured-extension-method',
      }),
    ])
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

  it('warns about root entry imports but does not rewrite them automatically', () => {
    const source = [
      'import { dsl } from "schema-dsl";',
      'const field = "email!".label("Email")',
    ].join('\n')
    const result = transformSchemaDsl(source, { filename: 'user.ts' })

    expect(result.changed).toBe(true)
    expect(result.code).toContain('import { dsl } from "schema-dsl";')
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'root-import',
        filename: 'user.ts',
      }),
    ])
  })

  it('does not warn for type-only root entry imports', () => {
    const result = transformSchemaDsl(
      [
        'import type { IDslBuilder } from "schema-dsl";',
        'const field: IDslBuilder = "email!".label("Email")',
      ].join('\n'),
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('does not warn for type-only root entry re-exports', () => {
    const result = transformSchemaDsl(
      [
        'export { type IDslBuilder } from "schema-dsl";',
        'const field = "email!".label("Email")',
      ].join('\n'),
      { filename: 'types.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it('still warns for mixed type and runtime root entry re-exports', () => {
    const result = transformSchemaDsl(
      [
        'export { type IDslBuilder, dsl } from "schema-dsl";',
        'const field = "email!".label("Email")',
      ].join('\n'),
      { filename: 'mixed.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'root-import',
        filename: 'mixed.ts',
      }),
    ])
  })

  it('throws in strict mode for root entry imports', () => {
    expect(() => transformSchemaDsl('import "schema-dsl";\nconst field = "email!".label("Email")', {
      filename: 'user.ts',
      strict: true,
    })).toThrow(TransformSchemaDslError)
  })

  it('throws in strict mode for parse errors', () => {
    expect(() => transformSchemaDsl('const broken = ', {
      filename: 'broken.ts',
      strict: true,
    })).toThrow(TransformSchemaDslError)
  })

  it('throws in strict mode for unconfigured schema-dsl extension methods', () => {
    expect(() => transformSchemaDsl('const tenant = "string!".tenantId().label("Tenant")', {
      filename: 'user.ts',
      strict: true,
    })).toThrow(TransformSchemaDslError)
  })

  it('parses modern TypeScript and JavaScript syntax while transforming string chains', () => {
    const result = transformSchemaDsl(
      [
        'import data from "./data.json" with { type: "json" };',
        '@sealed',
        'class User {',
        '  field = "email!".label("Email")',
        '}',
        'using cleanup = createCleanup(data);',
      ].join('\n'),
      { filename: 'user.ts' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("email!").label("Email")')
    expect(result.warnings).toHaveLength(0)
  })

  it('parses TSX syntax while transforming string chains', () => {
    const result = transformSchemaDsl(
      'export const view = <input schema={"email!".label("Email")} />',
      { filename: 'view.tsx' },
    )

    expect(result.changed).toBe(true)
    expect(result.code).toContain('__schemaDslDsl("email!").label("Email")')
    expect(result.warnings).toHaveLength(0)
  })

  it('preserves source map output when requested', () => {
    const result = transformSchemaDsl('const field = "email!".label("Email")', {
      filename: 'user.ts',
      sourceMap: 'inline',
    })

    expect(result.changed).toBe(true)
    expect(result.map).toBeDefined()
    expect(result.code).toContain('sourceMappingURL=data:application/json;charset=utf-8;base64,')
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
