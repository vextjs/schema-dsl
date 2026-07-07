import { describe, expect, it } from 'vitest'

import {
  compileWithDiagnostics,
  ConditionalBuilder,
  dsl,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  resetRuntimeState,
  SchemaHelper,
  SchemaUtils,
  TypeConverter,
  TypeRegistry,
  validate,
  validateAsync,
  Validator,
  PATTERNS,
} from '../../src/index.js'
import { DslAdapter } from '../../src/adapters/DslAdapter.js'
import { ConstraintParser } from '../../src/parser/ConstraintParser.js'
import { DslParser } from '../../src/parser/DslParser.js'
import { createRuntime } from '../../src/runtime.js'
import { isJsonSchemaFactoryInputLike, isJsonSchemaTypeValue, isRawJsonSchemaLike } from '../../src/utils/schemaInput.js'

describe('verified issue regressions', () => {
  describe('P0 parser and validator correctness', () => {
    it('P0-01: dsl.if requires the condition field before taking the then branch', () => {
      const schema = dsl({
        isVip: 'boolean',
        discount: dsl.if('isVip', 'number:0-50', 'number:0-10'),
      })

      expect(validate(schema, { isVip: true, discount: 40 }).valid).toBe(true)
      expect(validate(schema, { isVip: false, discount: 40 }).valid).toBe(false)
      expect(validate(schema, { discount: 40 }).valid).toBe(false)
    })

    it('P0-02: dsl.match does not treat a missing discriminator as the first case', () => {
      const schema = dsl({
        type: 'string',
        value: dsl.match('type', {
          email: 'email!',
          _default: 'string',
        }),
      })

      expect(validate(schema, { value: 'not-an-email' }).valid).toBe(true)
      expect(validate(schema, { type: 'email', value: 'not-an-email' }).valid).toBe(false)
    })

    it('P0-03: dsl.match coerces numeric discriminator cases from object keys', () => {
      const schema = dsl({
        kind: 'number',
        value: dsl.match('kind', {
          2: 'number:0-10',
          _default: 'string',
        }),
      })

      expect(validate(schema, { kind: 2, value: 5 }).valid).toBe(true)
      expect(validate(schema, { kind: 2, value: 'fallback' }).valid).toBe(false)
    })

    it('P0-03: dsl.match numeric discriminator cases are independent of field order', () => {
      const schema = dsl({
        value: dsl.match('kind', {
          1: 'string!',
        }),
        kind: 'number',
      })

      expect(validate(schema, { kind: 1, value: 'ok' }).valid).toBe(true)
      expect(validate(schema, { kind: 1, value: 123 }).valid).toBe(false)
    })

    it('P0-04: runtime field-name condition matches strict boolean true', () => {
      const condition = ConditionalBuilder.start('enabled').message('enabled is blocked')

      expect(condition.check({ enabled: 1 })).toBe(true)
      expect(condition.check({ enabled: true })).toBe(false)
    })

    it('P0-05: typed number constraints produce numeric enum values', () => {
      const schema = DslParser.parseString('number:1|2')

      expect(schema).toMatchObject({ type: 'number', enum: [1, 2] })
    })

    it('P0-06: integer enum rejects decimal members', () => {
      expect(() => dsl({ level: 'enum:integer:1|2.5' })).toThrow('Invalid integer enum value')
    })

    it('P0-07: invalid constraints are reported by compileWithDiagnostics', () => {
      const result = compileWithDiagnostics('number:abc')

      expect(result.schema).toEqual({ type: 'number' })
      expect(result.diagnostics).toEqual([expect.objectContaining({
        code: 'INVALID_CONSTRAINT',
        constraint: 'abc',
      })])
    })

    it('P0-30: untyped pipe enum does not auto-detect non-finite numbers', () => {
      const schema = DslParser.parseString('1|Infinity')

      expect(schema).toEqual({ type: 'string', enum: ['1', 'Infinity'] })
    })

    it('P0-31: malformed range constraints never produce NaN bounds', () => {
      const diagnostics: any[] = []

      const schema = ConstraintParser.parse('.-', 'number', {
        diagnostics,
        emitWarning: false,
      })

      expect(schema).toEqual({})
      expect(diagnostics).toEqual([expect.objectContaining({
        code: 'INVALID_CONSTRAINT',
        constraint: '.-',
      })])
    })

    it('P0-32: dsl.match condition constants never coerce to Infinity', () => {
      const hugeNumber = '9'.repeat(400)
      const schema = dsl({
        value: dsl.match('kind', { [hugeNumber]: 'string!' }),
        kind: 'number',
      })

      expect((schema.allOf?.[0]?.if?.properties?.kind as any)?.const).toBe(hugeNumber)
    })

    it('P0-08: nested raw JSON Schema is preserved as schema, not parsed as DSL fields', () => {
      const schema = dsl({
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
      })

      expect(schema.properties?.user).toMatchObject({
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      })
      expect(schema.properties?.user.properties?.properties).toBeUndefined()
    })

    it('P0-33: top-level raw JSON Schema keyword-only inputs are not parsed as DSL objects', () => {
      expect(validate({ enum: ['a', 'b'] }, 'a').valid).toBe(true)
      expect(validate({ enum: ['a', 'b'] }, 'c').valid).toBe(false)
      expect(validate({ const: 1 }, 1).valid).toBe(true)
      expect(validate({ const: 1 }, 2).valid).toBe(false)
      expect(validate({ const: 'string' }, 'string').valid).toBe(true)
      expect(validate({ const: 'string' }, 'number').valid).toBe(false)
      expect(validate({ type: 'string', format: 'email' }, 'user@example.com').valid).toBe(true)
      expect(validate({ type: 'string', format: 'email' }, 'not-email').valid).toBe(false)
      expect(validate({ title: 'string' }, 123).valid).toBe(true)
      expect(validate({ default: 'fallback' }, undefined).valid).toBe(true)
      expect(validate({ default: 1 }, 'anything').valid).toBe(true)
    })

    it('P0-33c: validate() keeps DSL object semantics when field names collide with JSON Schema keywords', () => {
      expect(validate({ default: 'string!' }, { default: 'active' }).valid).toBe(true)
      expect(validate({ default: 'string!' }, {}).valid).toBe(false)

      expect(validate({ const: 'string!' }, { const: 'literal' }).valid).toBe(true)
      expect(validate({ const: 'string!' }, {}).valid).toBe(false)

      const nestedKeywordField = { properties: { enabled: 'boolean!' } }
      expect(validate(nestedKeywordField, { properties: { enabled: true } }).valid).toBe(true)
      expect(validate(nestedKeywordField, { properties: {} }).valid).toBe(false)
    })

    it('P0-33b: raw JSON Schema input detector covers schema-valued and primitive keyword shapes', () => {
      expect(isJsonSchemaTypeValue('string')).toBe(true)
      expect(isJsonSchemaTypeValue(['string', 'null'])).toBe(true)
      expect(isJsonSchemaTypeValue(['string', 'unknown'])).toBe(false)
      expect(isJsonSchemaTypeValue(1)).toBe(false)
      expect(isRawJsonSchemaLike({ properties: { enabled: true, blocked: false } })).toBe(true)
      expect(isRawJsonSchemaLike({ properties: { enabled: 'boolean!' } })).toBe(false)
      expect(isRawJsonSchemaLike({ const: 'string!' })).toBe(false)
      expect(isRawJsonSchemaLike({ const: 'string' })).toBe(true)
      expect(isRawJsonSchemaLike({ const: 'active' })).toBe(true)
      expect(isRawJsonSchemaLike({ format: 'email' })).toBe(true)
      expect(isRawJsonSchemaLike({ title: 'string' })).toBe(true)
      expect(isRawJsonSchemaLike({ default: 'active' })).toBe(true)
      expect(isRawJsonSchemaLike({ default: 1 })).toBe(true)
      expect(isRawJsonSchemaLike({ default: 'string!' })).toBe(false)
      expect(isJsonSchemaFactoryInputLike({ items: [{ type: 'string' }, false] })).toBe(true)
      expect(isJsonSchemaFactoryInputLike({ contains: true })).toBe(true)
      expect(isJsonSchemaFactoryInputLike({ uniqueItems: true })).toBe(true)
      expect(isJsonSchemaFactoryInputLike({ minLength: 3 })).toBe(true)
      expect(isJsonSchemaFactoryInputLike({ contains: 1 })).toBe(false)
      expect(isRawJsonSchemaLike(['not', 'a', 'schema'])).toBe(false)
    })

    it('P1-19: Draft 7 boolean schemas are accepted as raw JSON Schema input', () => {
      expect(validate(true, 'anything').valid).toBe(true)
      expect(validate(false, 'anything').valid).toBe(false)
      expect(new Validator().validate(true, { ok: true }).valid).toBe(true)
      expect(new Validator().validate(false, { ok: true }).valid).toBe(false)
    })

    it('P1-20: public Validator executes conditionals in top-level array and composition schemas', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const arrayResult = validator.validate({
        type: 'array',
        items: conditionalNumber,
      }, ['bad'])
      const allOfResult = validator.validate({
        allOf: [conditionalNumber],
      }, 'bad')
      const conditionalIfFalseBranch = validator.validate({
        if: ConditionalBuilder.start(() => true).then(true).toSchema(),
        then: false,
      }, 'value')

      expect(arrayResult.valid).toBe(false)
      expect(arrayResult.errors?.[0]?.path).toBe('0')
      expect(allOfResult.valid).toBe(false)
      expect(allOfResult.errors?.[0]?.keyword).toBe('type')
      expect(conditionalIfFalseBranch.valid).toBe(false)
    })

    it('P1-21: public Validator executes conditionals in object applicator schemas', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const patternResult = validator.validate({
        type: 'object',
        patternProperties: {
          '^x_': conditionalNumber,
        },
      }, { x_name: 'bad' })
      expect(patternResult.valid).toBe(false)
      expect(patternResult.errors?.[0]?.path).toBe('x_name')
      expect(validator.validate({
        type: 'object',
        patternProperties: {
          '^x_': conditionalNumber,
        },
      }, { y_name: 'bad' }).valid).toBe(true)

      const additionalResult = validator.validate({
        type: 'object',
        properties: {
          known: { type: 'string' },
        },
        patternProperties: {
          '^x_': { type: 'string' },
        },
        additionalProperties: conditionalNumber,
      }, { known: 'ok', x_skip: 'text', extra: 'bad' })
      expect(additionalResult.valid).toBe(false)
      expect(additionalResult.errors?.[0]?.path).toBe('extra')
      expect(validator.validate({
        type: 'object',
        additionalProperties: conditionalNumber,
      }, { extra: 1 }).valid).toBe(true)

      const propertyNamesResult = validator.validate({
        type: 'object',
        propertyNames: conditionalNumber,
      }, { abc: 1 })
      expect(propertyNamesResult.valid).toBe(false)
      expect(propertyNamesResult.errors?.[0]?.path).toBe('abc')

      const dependentResult = validator.validate({
        type: 'object',
        dependentSchemas: {
          enabled: {
            properties: {
              value: conditionalNumber,
            },
          },
        },
      }, { enabled: true, value: 'bad' })
      expect(dependentResult.valid).toBe(false)
      expect(dependentResult.errors?.[0]?.path).toBe('value')
      expect(validator.validate({
        type: 'object',
        dependentSchemas: {
          enabled: {
            properties: {
              value: conditionalNumber,
            },
          },
        },
      }, { value: 'bad' }).valid).toBe(true)

      const legacyDependenciesResult = validator.validate({
        type: 'object',
        properties: {
          enabled: { type: 'boolean' },
          value: true,
        },
        dependencies: {
          enabled: {
            properties: {
              value: conditionalNumber,
            },
          },
        },
      }, { enabled: true, value: 'bad' })
      expect(legacyDependenciesResult.valid).toBe(false)
      expect(legacyDependenciesResult.errors?.[0]?.path).toBe('value')
    })

    it('P1-22: public Validator executes conditionals in array applicator schemas', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const containsResult = validator.validate({
        type: 'array',
        contains: conditionalNumber,
      }, ['bad'])
      expect(containsResult.valid).toBe(false)
      expect(containsResult.errors?.[0]?.path).toBe('0')
      expect(validator.validate({
        type: 'array',
        contains: conditionalNumber,
      }, ['bad', 1]).valid).toBe(true)

      const prefixItemsResult = validator.validate({
        type: 'array',
        prefixItems: [conditionalNumber],
      }, ['bad'])
      expect(prefixItemsResult.valid).toBe(false)
      expect(prefixItemsResult.errors?.[0]?.path).toBe('0')
      expect(validator.validate({
        type: 'array',
        prefixItems: [conditionalNumber],
      }, [1]).valid).toBe(true)

      const prefixItemsWithItems = validator.validate({
        type: 'array',
        prefixItems: [{ type: 'string' }],
        items: { type: 'number' },
        allOf: [ConditionalBuilder.start(() => true).then(true).toSchema()],
      }, [1, 2])
      expect(prefixItemsWithItems.valid).toBe(false)
      expect(prefixItemsWithItems.errors?.[0]?.path).toBe('0')
    })

    it('P1-22: prefixItems conditionals behind local refs keep the root ref scope', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const result = validator.validate({
        type: 'array',
        prefixItems: [{ $ref: '#/$defs/A' }],
        $defs: {
          A: { $ref: '#/$defs/B' },
          B: conditionalNumber,
        },
      }, ['bad'])

      expect(result.valid).toBe(false)
      expect(result.errors?.[0]?.path).toBe('0')
      expect(result.errors?.some(error => String(error.message ?? '').includes("can't resolve reference"))).toBe(false)
    })

    it('P1-22: conditional internal validation preserves the requested error format', () => {
      const validator = new Validator()
      const passthroughConditional = ConditionalBuilder.start(() => true).then(true).toSchema()
      const schema = {
        if: passthroughConditional,
        then: {
          type: 'number',
          allOf: [passthroughConditional],
        },
      }

      const formatted = validator.validate(schema, 'bad', { format: true })
      const raw = validator.validate(schema, 'bad', { format: false })

      expect(formatted.valid).toBe(false)
      expect(formatted.errors?.[0]).toHaveProperty('path')
      expect(formatted.errors?.[0]).not.toHaveProperty('instancePath')
      expect(raw.valid).toBe(false)
      expect(raw.errors?.[0]).toHaveProperty('instancePath')
    })

    it('P1-22: stripping conditionals is root-aware for local refs inside composition keywords', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()
      const schema = {
        not: { $ref: '#/$defs/Value' },
        $defs: {
          Value: conditionalNumber,
        },
      }

      expect(validator.validate(schema, 'bad').valid).toBe(true)
      expect(validator.validate(schema, 1).valid).toBe(false)
    })

    it('P1-22: validateAsync runs async custom validators inside conditional runtime branches', async () => {
      const validator = new Validator()
      const conditional = ConditionalBuilder
        .start(() => true)
        .then({
          type: 'string',
          _customValidators: [
            async (value: unknown) => value === 'ok' || 'failed',
          ],
        })
        .toSchema()

      await expect(validator.validateAsync(conditional, 'bad')).rejects.toMatchObject({
        errors: [expect.objectContaining({ message: 'failed' })],
      })
      await expect(validator.validateAsync(conditional, 'ok')).resolves.toBe('ok')
    })

    it('P1-22: mutable schemas are rechecked for newly added conditionals', () => {
      const validator = new Validator()
      const schema: {
        type: 'object'
        properties: Record<string, unknown>
      } = {
        type: 'object',
        properties: {},
      }

      expect(validator.validate(schema, {}).valid).toBe(true)
      schema.properties['age'] = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const result = validator.validate(schema, { age: 'bad' })
      expect(result.valid).toBe(false)
      expect(result.errors?.[0]?.path).toBe('age')
    })

    it('P1-23: smart coercion handles nullable and safe composition type declarations', () => {
      const schema = {
        type: 'object',
        properties: {
          age: { type: ['number', 'null'] },
          score: { anyOf: [{ type: 'number' }, { type: 'null' }] },
          count: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
          enabled: { type: ['boolean', 'null'], enum: [true, false, null] },
          profile: {
            type: ['object', 'null'],
            properties: {
              level: { type: ['integer', 'null'] },
            },
          },
          flags: {
            type: 'array',
            items: { type: ['boolean', 'null'] },
          },
        },
      }

      const result = validate(schema, {
        age: '18',
        score: '20',
        count: '3',
        enabled: 'true',
        profile: { level: '2' },
        flags: ['true', 'false', null],
      })

      expect(result.valid).toBe(true)
      expect(result.data).toEqual({
        age: 18,
        score: 20,
        count: 3,
        enabled: true,
        profile: { level: 2 },
        flags: [true, false, null],
      })

      expect(validate({
        type: 'object',
        properties: {
          value: { anyOf: [{ type: 'number' }, { type: 'boolean' }] },
        },
      }, { value: '1' }).valid).toBe(false)

      expect(validate({ type: 'object' }, { age: '18' }).data).toEqual({ age: '18' })
    })

    it('P1-23: root smart coercion uses the current mutable schema shape', () => {
      const schema: {
        type: 'object'
        properties: Record<string, unknown>
      } = {
        type: 'object',
        properties: {},
      }

      expect(validate(schema, { age: '18' }).valid).toBe(true)
      schema.properties['age'] = { type: ['number', 'null'] }

      const result = validate(schema, { age: '18' })
      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ age: 18 })
    })

    it('P1-22: validateAsync handles conditional runtime else and string branches', async () => {
      const validator = new Validator()
      const conditionalElse = ConditionalBuilder
        .start(() => false)
        .then(true)
        .else({
          type: 'string',
          _customValidators: [
            async (value: unknown) => value === 'ok' || 'else failed',
          ],
        })
        .toSchema()

      await expect(validator.validateAsync(conditionalElse, 'bad')).rejects.toMatchObject({
        errors: [expect.objectContaining({ message: 'else failed' })],
      })

      const conditionalString = ConditionalBuilder
        .start(() => true)
        .then('string')
        .toSchema()

      await expect(validator.validateAsync(conditionalString, 'ok')).resolves.toBe('ok')

      const conditionalBuilder = ConditionalBuilder
        .start(() => true)
        .then({ toSchema: () => ({ type: 'string' }) } as unknown as string)
        .toSchema()

      await expect(validator.validateAsync(conditionalBuilder, 'ok')).resolves.toBe('ok')
    })

    it('P1-22: public Validator executes conditionals behind local JSON Schema refs', () => {
      const validator = new Validator()
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()

      const rootRefResult = validator.validate({
        definitions: {
          Value: conditionalNumber,
        },
        $ref: '#/definitions/Value',
      }, 'bad')

      expect(rootRefResult.valid).toBe(false)
      expect(rootRefResult.errors?.[0]?.keyword).toBe('type')

      const propertyRefResult = validator.validate({
        type: 'object',
        properties: {
          value: { $ref: '#/$defs/Value' },
        },
        $defs: {
          Value: conditionalNumber,
        },
      }, { value: 'bad' })

      expect(propertyRefResult.valid).toBe(false)
      expect(propertyRefResult.errors?.[0]?.path).toBe('value')

      const nestedRefResult = validator.validate({
        type: 'object',
        properties: {
          value: { $ref: '#/$defs/A' },
        },
        $defs: {
          A: { $ref: '#/$defs/B' },
          B: conditionalNumber,
        },
      }, { value: 'bad' })

      expect(nestedRefResult.valid).toBe(false)
      expect(nestedRefResult.errors?.[0]?.path).toBe('value')

      const escapedPointerResult = validator.validate({
        type: 'object',
        properties: {
          value: { $ref: '#/$defs/a%7E1b' },
        },
        $defs: {
          'a/b': conditionalNumber,
        },
      }, { value: 'bad' })

      expect(escapedPointerResult.valid).toBe(false)
      expect(escapedPointerResult.errors?.[0]?.path).toBe('value')
    })

    it('P2-08: ConditionalBuilder accepts boolean JSON Schema branches at runtime', () => {
      const validator = new Validator()

      expect(validator.validate(ConditionalBuilder.start(() => true).then(true).toSchema(), 'value').valid).toBe(true)
      expect(validator.validate(ConditionalBuilder.start(() => true).then(false).toSchema(), 'value').valid).toBe(false)
      expect(validator.validate(ConditionalBuilder.start(() => false).then(true).else(false).toSchema(), 'value').valid).toBe(false)
    })

    it('P0-34: validateBatch follows the same smart coercion path as single validate', () => {
      const validator = new Validator()
      const schema = {
        type: 'object',
        properties: {
          age: { type: 'number' },
          active: { type: 'boolean' },
        },
        required: ['age', 'active'],
      }

      const single = validator.validate(schema, { age: '18', active: 'true' })
      const batch = validator.validateBatch(schema, [{ age: '18', active: 'true' }])

      expect(single.valid).toBe(true)
      expect(single.data).toEqual({ age: 18, active: true })
      expect(batch[0]?.valid).toBe(true)
      expect(batch[0]?.data).toEqual({ age: 18, active: true })
    })

    it('P0-11: validateAsync runs custom validators in matching oneOf branches', async () => {
      const validator = new Validator({ coerceTypes: false })
      const schema = {
        oneOf: [
          {
            type: 'string',
            _customValidators: [async (value: unknown) => value === 'ok' || 'string branch failed'],
          },
          { type: 'number' },
        ],
      }

      await expect(validator.validateAsync(schema, 'ok')).resolves.toBe('ok')
      await expect(validator.validateAsync(schema, 'bad')).rejects.toThrow('string branch failed')
      await expect(validator.validateAsync(schema, 1)).resolves.toBe(1)
    })
  })

  describe('P0 exporter and SQL type safety', () => {
    it('P0-14: MongoDB command quotes collection names with JSON string escaping', () => {
      const name = 'a"); db.dropDatabase(); //'
      const command = new MongoDBExporter().generateCommand(name, { type: 'object', properties: {} })

      expect(command).toContain(JSON.stringify(name))
      expect(command).not.toContain(`db.createCollection("${name}"`)
    })

    it('P0-15: PostgreSQL index method is runtime-whitelisted', () => {
      const exporter = new PostgreSQLExporter()

      expect(() => exporter.generateIndex('users', 'email', { method: 'btree); DROP TABLE users; --' })).toThrow(
        'Unsupported PostgreSQL index method'
      )
    })

    it('P0-16: numeric MySQL enums keep their numeric column type', () => {
      expect(TypeConverter.toMySQLType('number', { type: 'number', enum: [1, 2, 3] })).toBe('DOUBLE')
    })

    it('P0-17: nullable union defaults are formatted by the non-null type', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: ['string', 'null'], default: 'abc' },
        },
      }

      expect(new MySQLExporter().export('users', schema)).toContain("DEFAULT 'abc'")
      expect(new PostgreSQLExporter().export('users', schema)).toContain("DEFAULT 'abc'")
    })
  })

  describe('P1 runtime and builder safety', () => {
    it('P1-05: resetRuntimeState restores overwritten default PATTERNS values', () => {
      const original = PATTERNS.phone.cn.pattern.source
      PATTERNS.phone.cn = { ...PATTERNS.phone.cn, pattern: /^changed$/ }

      resetRuntimeState()

      expect(PATTERNS.phone.cn.pattern.source).toBe(original)
    })

    it('P1-06: Validator defaults align with top-level numeric coercion', () => {
      const schema = { type: 'object', properties: { age: { type: 'number' } } }
      const result = new Validator().validate(schema, { age: '42' })

      expect(result.valid).toBe(true)
      expect(result.data).toEqual({ age: 42 })

      expect(validate(schema, { age: 'Infinity' }).data).toEqual({ age: 'Infinity' })
      expect(new Validator().validate(schema, { age: 'Infinity' }).data).toEqual({ age: 'Infinity' })
    })

    it('P1-23: root and Validator per-call options disable smart coercion consistently', async () => {
      const schema = dsl({ age: 'number!' })

      expect(validate(schema, { age: '42' }).data).toEqual({ age: 42 })
      expect(validate(schema, { age: '42' }, { smartCoerce: false }).valid).toBe(false)
      expect(validate(schema, { age: '42' }, { coerceTypes: false }).valid).toBe(false)
      expect(validate(schema, { age: '42' }, { coerce: false }).valid).toBe(false)

      expect(new Validator().validate(schema, { age: '42' }, { smartCoerce: false }).valid).toBe(false)
      expect(new Validator().validate(schema, { age: '42' }, { coerceTypes: false }).valid).toBe(false)
      expect(new Validator().validate(schema, { age: '42' }, { coerce: false }).valid).toBe(false)

      const runtime = createRuntime()
      const runtimeSchema = runtime.dsl({ age: 'number!' })
      expect(runtime.validate(runtimeSchema, { age: '42' }, { smartCoerce: false }).valid).toBe(false)
      await expect(validateAsync(schema, { age: '42' }, { smartCoerce: false })).rejects.toThrow()
      runtime.dispose()
    })

    it('P1-24: allErrors false limits formatted root validation results per call', () => {
      const schema = dsl({ name: 'string!', age: 'number!' })

      expect(validate(schema, {}, { allErrors: false }).errors).toHaveLength(1)
      expect(validate(schema, {}, { allErrors: true }).errors?.length).toBeGreaterThanOrEqual(2)
      expect(validate(schema, {}).errors?.length).toBeGreaterThanOrEqual(2)
    })

    it('P1-24: allErrors false also limits merged conditional validation results', () => {
      const conditionalNumber = ConditionalBuilder.start(() => true).then('number!').toSchema()
      const schema = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          score: conditionalNumber,
        },
      }

      const singleError = validate(schema, { score: 'bad' }, { allErrors: false })
      const allErrors = validate(schema, { score: 'bad' }, { allErrors: true })

      expect(singleError.valid).toBe(false)
      expect(singleError.errors).toHaveLength(1)
      expect(allErrors.errors?.map(error => `${error.path}:${error.keyword}`)).toEqual(['name:required', 'score:type'])
    })

    it('P1-25: validate keyword boolean false returns a stable custom keyword error', () => {
      const validator = new Validator()

      const objectResult = validator.validate({ validate: () => ({ valid: false, message: 'custom fail' }) }, 'value')
      const booleanResult = validator.validate({ validate: () => false }, 'value')

      expect(objectResult.errors?.[0]?.message).toBe('custom fail')
      expect(booleanResult.errors?.[0]).toMatchObject({
        keyword: 'validate',
        message: 'Validation failed',
      })
    })

    it('P1-08: TypeRegistry.toJsonSchema recursively strips internal metadata', () => {
      const json = TypeRegistry.toJsonSchema({
        type: 'object',
        properties: {
          name: { type: 'string', _label: 'Name', _customMessages: { required: 'required' } },
        },
      })

      expect(json.properties?.name).toEqual({ type: 'string' })
    })

    it('P1-09: ObjectDslBuilder.toSchema returns a defensive clone', () => {
      const builder = DslAdapter.parseObject({ name: 'string' })
      const first = builder.toSchema()
      first.properties!.name.type = 'number'

      expect(builder.toSchema().properties?.name.type).toBe('string')
    })

    it('P1-10: DslBuilder.toSchema enum arrays cannot mutate builder state', () => {
      const builder = dsl('string').enum('a')
      const first = builder.toSchema()
      first.enum!.push('b')

      expect(builder.toSchema().enum).toEqual(['a'])
    })

    it('P1-11/P1-12: string-only validators reject number schemas instead of producing mixed constraints', () => {
      expect(() => dsl('number').password()).toThrow('password() only applies to string type')
      expect(() => dsl('integer').multiple(2).phone()).toThrow('phone() only applies to string type')
    })

    it('P1-13: enum() rejects values incompatible with the base schema type', () => {
      expect(() => dsl('number').enum('a')).toThrow('enum() value "a" is not compatible with number schema')
      expect(() => dsl('string').enum(undefined)).toThrow('enum() value undefined is not compatible with string schema')
    })

    it('P1-13: enum() accepts a single array argument as an enum list for primitive schemas', () => {
      expect(dsl('string').enum(['admin', 'editor']).toSchema().enum).toEqual(['admin', 'editor'])
      expect(dsl('number').enum([1, 2]).toSchema().enum).toEqual([1, 2])
    })

    it('P1-14: precision() requires a non-negative integer', () => {
      expect(() => dsl('number').precision(-1)).toThrow('precision() requires a non-negative integer')
      expect(() => dsl('number').precision(1.5)).toThrow('precision() requires a non-negative integer')
    })

    it('P1-15: requiredAll ignores inherited prototype properties', () => {
      const data = Object.create({ name: 'from-prototype' }) as Record<string, unknown>
      const result = validate({
        type: 'object',
        properties: { name: { type: 'string' } },
        requiredAll: true,
      }, data)

      expect(result.valid).toBe(false)
    })

    it('P1-16: includesRequired deep equality handles equivalent cyclic objects', () => {
      const required: Record<string, unknown> = { code: 'same' }
      required['self'] = required
      const actual: Record<string, unknown> = { code: 'same' }
      actual['self'] = actual

      const result = validate({ type: 'array', includesRequired: [required] }, [actual])

      expect(result.valid).toBe(true)
    })

    it('P1-17: TypeRegistry rejects primitive built-in overrides', () => {
      expect(() => TypeRegistry.register('string', { type: 'number' })).toThrow(
        'Cannot override built-in primitive type "string"'
      )
    })
  })

  describe('P2 SchemaUtils and docs helpers', () => {
    it('P2-04: SchemaUtils.clone preserves function validators', () => {
      const fn = () => true
      const schema = { type: 'string', _customValidators: [fn] }
      const cloned = SchemaUtils.clone(schema)

      expect(cloned).not.toBe(schema)
      expect((cloned._customValidators as unknown[])[0]).toBe(fn)
    })

    it('P2-05: SchemaUtils.extend replaces incompatible property schemas', () => {
      const extended = SchemaUtils.extend(
        { type: 'object', properties: { value: { type: 'string', minLength: 2 } } },
        { type: 'object', properties: { value: { type: 'number', minimum: 0 } } }
      )

      expect(extended.properties?.value).toEqual({ type: 'number', minimum: 0 })
    })

    it('P2-05: SchemaUtils.extend preserves base metadata', () => {
      const extended = SchemaUtils.extend(
        {
          type: 'object',
          title: 'Base',
          additionalProperties: false,
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        { properties: { age: { type: 'number' } } }
      )

      expect(extended.title).toBe('Base')
      expect(extended.additionalProperties).toBe(false)
      expect(extended.properties).toMatchObject({
        name: { type: 'string' },
        age: { type: 'number' },
      })
    })

    it('P2-05: SchemaUtils.extend keeps JSON Schema metadata extensions as schema metadata', () => {
      const extended = SchemaUtils.extend(
        { type: 'object', properties: {} },
        { type: 'object', title: 'Extended schema' }
      )

      expect(extended.title).toBe('Extended schema')
      expect(extended.properties).toEqual({})
      expect(extended.properties?.type).toBeUndefined()
      expect(extended.properties?.title).toBeUndefined()
    })

    it('P1-18: SchemaUtils.partial(fields) keeps unlisted fields and only makes listed fields optional', () => {
      const schema = dsl({
        name: 'string!',
        email: 'email!',
        age: 'integer!',
      })

      const partial = SchemaUtils.partial(schema, ['email'])

      expect(Object.keys(partial.properties ?? {})).toEqual(['name', 'email', 'age'])
      expect(partial.required).toEqual(['name', 'age'])
    })

    it('P1-26: SchemaUtils.pick preserves boolean false field schemas', () => {
      const picked = SchemaUtils.pick({
        type: 'object',
        properties: {
          blocked: false,
          name: { type: 'string' },
        },
        required: ['blocked'],
      }, ['blocked'])

      expect(Object.prototype.hasOwnProperty.call(picked.properties, 'blocked')).toBe(true)
      expect(picked.properties?.blocked).toBe(false)
      expect(picked.required).toEqual(['blocked'])
      expect(validate(picked, { blocked: 'anything' }).valid).toBe(false)
    })

    it('P2-09: SchemaUtils.omit prunes dependent constraints for removed fields', () => {
      const omitted = SchemaUtils.omit({
        type: 'object',
        additionalProperties: false,
        properties: {
          card: { type: 'string' },
          billingAddress: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['card', 'billingAddress'],
        dependentRequired: {
          card: ['billingAddress'],
        },
        dependentSchemas: {
          card: { required: ['billingAddress'] },
        },
        dependencies: {
          card: ['billingAddress'],
        },
      }, ['billingAddress'])

      expect(omitted.required).toEqual(['card'])
      expect(omitted.dependentRequired).toBeUndefined()
      expect(omitted.dependentSchemas).toBeUndefined()
      expect(omitted.dependencies).toBeUndefined()
      expect(validate(omitted, { card: '4242' }).valid).toBe(true)

      const kept = SchemaUtils.pick({
        type: 'object',
        properties: {
          card: { type: 'string' },
          billingAddress: { type: 'string' },
        },
        dependentRequired: {
          card: ['billingAddress'],
        },
        dependentSchemas: {
          card: { required: ['billingAddress'] },
        },
        dependencies: {
          card: ['billingAddress'],
        },
      }, ['card', 'billingAddress'])

      expect(kept.dependentRequired).toEqual({ card: ['billingAddress'] })
      expect(kept.dependentSchemas).toBeUndefined()
      expect(kept.dependencies).toEqual({ card: ['billingAddress'] })
    })

    it('P2-10: SchemaHelper stable comparison distinguishes function bodies and handles circular arrays', () => {
      const schemaA = { validate: () => true }
      const schemaB = { validate: () => false }
      const circular: unknown[] = []
      circular.push(circular)
      const dateSchema = { createdAt: new Date('2026-06-24T00:00:00.000Z') }
      const regexSchema = { pattern: /^user_/i }
      const mixedPrimitiveSchema = {
        count: BigInt(10),
        missing: undefined,
        tag: Symbol.for('schema-dsl:test'),
      }
      const createValidator = (expected: number) => function validate(value: unknown) {
        return value === expected
      }
      const closureA = createValidator(1)
      const closureB = createValidator(2)

      expect(SchemaHelper.compareSchemas(schemaA as any, schemaB as any)).toBe(false)
      expect(SchemaHelper.generateSchemaId(schemaA as any)).not.toBe(SchemaHelper.generateSchemaId(schemaB as any))
      expect(SchemaHelper.compareSchemas({ validate: closureA } as any, { validate: closureB } as any)).toBe(false)
      expect(SchemaHelper.compareSchemas({ validate: closureA } as any, { validate: closureA } as any)).toBe(true)
      expect(SchemaHelper.generateSchemaId({ validate: closureA } as any)).not.toBe(SchemaHelper.generateSchemaId({ validate: closureB } as any))
      expect(SchemaHelper.generateSchemaId({ validate: closureA } as any)).toBe(SchemaHelper.generateSchemaId({ validate: closureA } as any))
      expect(() => SchemaHelper.generateSchemaId({ type: 'array', items: circular } as any)).not.toThrow()
      expect(SchemaHelper.generateSchemaId({ type: 'array', items: circular } as any)).toBe(
        SchemaHelper.generateSchemaId({ type: 'array', items: circular } as any)
      )
      expect(SchemaHelper.generateSchemaId(dateSchema as any)).toBe(SchemaHelper.generateSchemaId({ ...dateSchema } as any))
      expect(SchemaHelper.generateSchemaId(regexSchema as any)).toBe(SchemaHelper.generateSchemaId({ pattern: /^user_/i } as any))
      expect(SchemaHelper.generateSchemaId(mixedPrimitiveSchema as any)).toBe(
        SchemaHelper.generateSchemaId({ ...mixedPrimitiveSchema } as any)
      )
    })

    it('P2-06: SchemaUtils.toMarkdown includes nested field paths', () => {
      const markdown = SchemaUtils.toMarkdown(dsl({
        user: {
          name: 'string!',
        },
      }))

      expect(markdown).toContain('| user.name | string | ✅ | - | - |')
    })
  })
})
