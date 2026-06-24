import { describe, expect, it } from 'vitest'

import {
  compileWithDiagnostics,
  ConditionalBuilder,
  dsl,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  resetRuntimeState,
  SchemaUtils,
  TypeConverter,
  TypeRegistry,
  validate,
  Validator,
  PATTERNS,
} from '../../src/index.js'
import { DslAdapter } from '../../src/adapters/DslAdapter.js'
import { ConstraintParser } from '../../src/parser/ConstraintParser.js'
import { DslParser } from '../../src/parser/DslParser.js'
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
