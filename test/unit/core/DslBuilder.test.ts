/**
 * DslBuilder Unit Tests
 * Tests all constraint methods of the chained API and toSchema() / toJsonSchema() output
 */

import { describe, it, expect } from 'vitest'
import { DslBuilder } from '../../../src/core/DslBuilder.js'
import { DslParser } from '../../../src/parser/DslParser.js'

describe('DslBuilder', () => {
  describe('Constructor', () => {
    it('creates instance', () => {
      const b = new DslBuilder('string')
      expect(b).toBeInstanceOf(DslBuilder)
      expect(b._isDslBuilder).toBe(true)
    })

    it('parses basic types', () => {
      expect(new DslBuilder('string').toSchema().type).toBe('string')
      expect(new DslBuilder('number').toSchema().type).toBe('number')
      expect(new DslBuilder('boolean').toSchema().type).toBe('boolean')
    })

    it('required marker ! — toSchema()._required = true', () => {
      const s = new DslBuilder('string!').toSchema()
      expect(s._required).toBe(true)
    })

    it('no ! — toSchema()._required = false', () => {
      const s = new DslBuilder('string').toSchema()
      expect(s._required).toBe(false)
    })

    it('email format', () => {
      const s = new DslBuilder('email!').toSchema()
      expect(s.format).toBe('email')
      expect(s._required).toBe(true)
    })

    it('rejects invalid DSL constructor input and supports array!N-M legacy syntax', () => {
      expect(() => new DslBuilder('')).toThrow('DSL string is required')
      expect(() => new DslBuilder(null as any)).toThrow('DSL string is required')

      expect(new DslBuilder('array!1-3').items('string!').toSchema()).toMatchObject({
        type: 'array',
        minItems: 1,
        maxItems: 3,
        _required: true,
        items: { type: 'string' },
      })
    })
  })

  describe('Static custom type helpers', () => {
    it('registers, resolves and clears object and dynamic custom types', () => {
      DslBuilder.clearCustomTypes()
      DslBuilder.registerType('coverageField', { type: 'string', minLength: 2 })
      DslBuilder.registerType('coverageDynamic', () => ({ type: 'number', minimum: 1 }))

      expect(DslBuilder.hasType('coverageField')).toBe(true)
      expect(DslBuilder.getCustomTypes()).toEqual(expect.arrayContaining(['coverageField', 'coverageDynamic']))
      expect(new DslBuilder('coverageField').toSchema()).toMatchObject({ type: 'string', minLength: 2 })
      expect(new DslBuilder('coverageDynamic').toSchema()).toMatchObject({ type: 'number', minimum: 1 })

      DslBuilder.unregisterType('coverageField')
      expect(DslBuilder.hasType('coverageField')).toBe(false)
      DslBuilder.clearCustomTypes()
    })

    it('validates custom type helper arguments', () => {
      expect(() => DslBuilder.registerType('', { type: 'string' })).toThrow('Type name must be')
      expect(() => DslBuilder.registerType('badType', null as any)).toThrow('Schema must be')
      expect(() => DslBuilder.unregisterType('')).toThrow('Type name must be')
    })

    it('reports nesting depth through object and array branches', () => {
      const shallow = DslBuilder.validateNestingDepth({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      })
      const deep = DslBuilder.validateNestingDepth({
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                profile: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      }, 1)

      expect(shallow.valid).toBe(true)
      expect(deep.valid).toBe(false)
      expect(deep.path).toContain('users')
    })
  })

  describe('Constraint methods — string type chaining', () => {
    it('min() / max() — string type → minLength/maxLength', () => {
      const s = new DslBuilder('string').min(3).max(32).toSchema()
      expect(s.minLength).toBe(3)
      expect(s.maxLength).toBe(32)
    })

    it('length() — exactLength', () => {
      const s = new DslBuilder('string').length(6).toSchema()
      expect(s.exactLength).toBe(6)
    })

    it('min() supports number type as minimum', () => {
      expect(new DslBuilder('number').min(1).toSchema()).toMatchObject({
        type: 'number',
        minimum: 1,
      })
    })

    it('label()', () => {
      const s = new DslBuilder('string').label('Name').toSchema()
      expect(s._label).toBe('Name')
    })

    it('description()', () => {
      const s = new DslBuilder('string').description('Username').toSchema()
      expect(s.description).toBe('Username')
    })

    it('pattern()', () => {
      const s = new DslBuilder('string').pattern(/^[a-z]+$/).toSchema()
      expect(s.pattern).toMatch(/\[a-z\]/)
    })

    it('format(), pattern(message), and unsafe pattern handling', () => {
      expect(new DslBuilder('string').format('uuid').toSchema().format).toBe('uuid')
      expect(new DslBuilder('string').pattern('^[a-z]+$', 'letters only').toSchema()).toMatchObject({
        pattern: '^[a-z]+$',
        _customMessages: { 'string.pattern': 'letters only' },
      })
      expect(() => new DslBuilder('string').pattern('(a+)+$')).toThrow('Unsafe regex pattern rejected')
    })

    it('enum()', () => {
      const s = new DslBuilder('string').enum('a', 'b', 'c').toSchema()
      expect(s.enum).toEqual(['a', 'b', 'c'])
    })

    it('default()', () => {
      const s = new DslBuilder('string').default('hello').toSchema()
      expect(s.default).toBe('hello')
    })

    it('optional() clears required', () => {
      const s = new DslBuilder('string!').optional().toSchema()
      expect(s._required).toBe(false)
    })

    it('required() sets required', () => {
      const s = new DslBuilder('string').required().toSchema()
      expect(s._required).toBe(true)
    })

    it('require() is a no-argument alias of required()', () => {
      expect(new DslBuilder('string').require().toSchema()).toMatchObject(
        new DslBuilder('string').required().toSchema()
      )
      expect(() => (new DslBuilder('string').require as unknown as (field: string) => unknown)('field')).toThrow(
        /does not accept arguments/
      )
    })

    it('error() sets custom message', () => {
      const s = new DslBuilder('string!').error({ required: 'Name is required' }).toSchema()
      expect(s._customMessages?.['required']).toBe('Name is required')
    })

    it('rejects invalid custom validators and incompatible enum values', () => {
      expect(() => new DslBuilder('string').custom('not-a-function' as any)).toThrow('Custom validator must be a function')
      expect(() => new DslBuilder('string').enum()).toThrow('enum() requires')
      expect(() => new DslBuilder('integer').enum(1.2)).toThrow('not compatible')
      expect(() => new DslBuilder('boolean').enum('true')).toThrow('not compatible')
      expect(new DslBuilder('string').custom(() => true).toSchema()._customValidators).toHaveLength(1)
    })

    it('normalizes array-form enum values for scalar schemas', () => {
      expect(new DslBuilder('string').enum(['a', 'b']).toSchema().enum).toEqual(['a', 'b'])
      expect(new DslBuilder('array').enum(['a', 'b']).toSchema().enum).toEqual([['a', 'b']])
    })
  })

  describe('number type constraints (via DSL string)', () => {
    it('number:0-100 → minimum/maximum', () => {
      const s = new DslBuilder('number:0-100').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
    })

    it('integer:1- → minimum only', () => {
      const s = new DslBuilder('integer:1-').toSchema()
      expect(s.minimum).toBe(1)
    })

    it('min() / max() map to numeric bounds for number and integer builders', () => {
      expect(new DslBuilder('number').min(18).max(120).toSchema()).toMatchObject({
        type: 'number',
        minimum: 18,
        maximum: 120,
      })
      expect(new DslBuilder('integer').min(1).max(5).toSchema()).toMatchObject({
        type: 'integer',
        minimum: 1,
        maximum: 5,
      })
    })

    it('min() / max() map to item count bounds for array builders', () => {
      expect(new DslBuilder('array').min(1).max(3).items('string!').toSchema()).toMatchObject({
        type: 'array',
        minItems: 1,
        maxItems: 3,
        items: { type: 'string' },
      })
    })
  })

  describe('Additional chain methods and validation helpers', () => {
    it('rejects min/max on unsupported schema types', () => {
      expect(() => new DslBuilder('object').min(1)).toThrow('min')
      expect(() => new DslBuilder('object').max(1)).toThrow('max')
    })

    it('supports identity and pattern helpers with defaults and unsupported options', () => {
      expect(new DslBuilder('string').slugChain().toSchema().pattern).toContain('[a-z0-9]')
      expect(new DslBuilder('string').creditCard('visa').toSchema().pattern).toBeDefined()
      expect(new DslBuilder('string').licensePlate('cn').toSchema().pattern).toBeDefined()
      expect(new DslBuilder('string').postalCode('cn').toSchema().pattern).toBeDefined()
      expect(new DslBuilder('string').passport('cn').toSchema().pattern).toBeDefined()

      expect(() => new DslBuilder('string').creditCard('unknown')).toThrow('Unsupported credit card type')
      expect(() => new DslBuilder('string').licensePlate('unknown')).toThrow('Unsupported country')
      expect(() => new DslBuilder('string').postalCode('unknown')).toThrow('Unsupported country')
      expect(() => new DslBuilder('string').passport('unknown')).toThrow('Unsupported country')
    })

    it('supports username object presets and pattern branches', () => {
      expect(new DslBuilder('string').username({ minLength: 4, maxLength: 12, allowUnderscore: false }).toSchema()).toMatchObject({
        minLength: 4,
        maxLength: 12,
        pattern: '^[a-zA-Z][a-zA-Z0-9]*$',
      })
      expect(new DslBuilder('string').username({ allowNumber: false }).toSchema().pattern).toBe('^[a-zA-Z][a-zA-Z_]*$')
      expect(new DslBuilder('string').username({ allowNumber: false, allowUnderscore: false }).toSchema().pattern).toBe('^[a-zA-Z][a-zA-Z]*$')
    })

    it('validates array includesRequired arguments and nested builder input cleanup', () => {
      expect(() => new DslBuilder('array').includesRequired('tag' as any)).toThrow('requires an array')
      expect(new DslBuilder('array').items(new DslBuilder('string!')).toSchema().items).toEqual({ type: 'string' })
      expect(new DslBuilder('array').items({
        type: 'object',
        properties: {
          code: new DslBuilder('string!').toSchema(),
        },
        items: [{ type: 'string', _required: true } as any],
      } as any).toSchema().items).toEqual({
        type: 'object',
        properties: {
          code: { type: 'string' },
        },
        items: [{ type: 'string' }],
      })
      expect(new DslBuilder('array').items({
        code: 'string!',
        quantity: 'number:1-999!',
      }).toSchema().items).toMatchObject({
        type: 'object',
        properties: {
          code: { type: 'string' },
          quantity: { type: 'number', minimum: 1, maximum: 999 },
        },
        required: ['code', 'quantity'],
      })
      expect(new DslBuilder('array').items({ type: 'string', minLength: 2 }).toSchema().items).toEqual({
        type: 'string',
        minLength: 2,
      })
      expect(new DslBuilder('array').items({ enum: ['small', 'large'] } as any).toSchema().items).toEqual({
        enum: ['small', 'large'],
      })
      expect(new DslBuilder('array').items({ minimum: 1 } as any).toSchema().items).toEqual({
        minimum: 1,
      })
    })

    it('includes description, label, custom validators and when metadata in toSchema output', () => {
      const builder = new DslBuilder('string')
        .description('A field')
        .label('Field')
        .custom(() => true)
      ;(builder as any)._whenConditions.push({ field: 'enabled' })

      expect(builder.toSchema()).toMatchObject({
        description: 'A field',
        _label: 'Field',
        _whenConditions: [{ field: 'enabled' }],
      })
      expect(builder.toSchema()._customValidators).toHaveLength(1)
    })

    it('validates through dynamic and injected validator factories', async () => {
      await expect(new DslBuilder('string').validate('ok')).resolves.toMatchObject({ valid: true })

      const guard = { count: 0 }
      const fakeValidator = {
        validate: (schema: unknown, data: unknown) => ({ valid: data === 'ok', data, errors: [], schema }),
      }
      const builder = new DslBuilder('string', {
        validatorFactory: async () => fakeValidator as any,
        validatorGuard: () => {
          guard.count += 1
        },
        cacheValidator: true,
      })

      await expect(builder.validate('ok')).resolves.toMatchObject({ valid: true, data: 'ok' })
      await expect(builder.validate('bad')).resolves.toMatchObject({ valid: false, data: 'bad' })
      expect(guard.count).toBe(2)
    })
  })

  describe('toJsonSchema()', () => {
    it('strips internal keys _label/_required/_customMessages', () => {
      const json = new DslBuilder('string!').label('Name').toJsonSchema()
      expect('_label' in json).toBe(false)
      expect('_required' in json).toBe(false)
      expect('_customMessages' in json).toBe(false)
    })

    it('preserves minLength/maxLength', () => {
      const json = new DslBuilder('string').min(3).max(32).toJsonSchema()
      expect(json.minLength).toBe(3)
      expect(json.maxLength).toBe(32)
    })
  })

  describe('toString()', () => {
    it('returns JSON-serialized JSON Schema (not DSL string)', () => {
      const b = new DslBuilder('email!')
      const str = b.toString()
      // toString() returns JSON.stringify(toJsonSchema())
      const parsed = JSON.parse(str)
      expect(parsed.type).toBe('string')
      expect(parsed.format).toBe('email')
    })
  })

  describe('DSL string constraint direct parsing (DA-03 fix)', () => {
    it('string:6! → exactLength:6 + required', () => {
      const s = new DslBuilder('string:6!').toSchema()
      // string:N → exactLength:N (exact length)
      expect(s.exactLength).toBe(6)
      expect(s._required).toBe(true)
    })

    it('number:0-100! → minimum:0 + maximum:100 + required', () => {
      const s = new DslBuilder('number:0-100!').toSchema()
      expect(s.minimum).toBe(0)
      expect(s.maximum).toBe(100)
      expect(s._required).toBe(true)
    })
  })

  describe('Parser delegation', () => {
    it('should match DslParser output for dynamic pattern DSL strings', () => {
      const builderSchema = new DslBuilder('passport:cn!').toSchema()
      const parserSchema = DslParser.parseString('passport:cn')

      expect(builderSchema.pattern).toBe(parserSchema.pattern)
      expect(builderSchema._customMessages).toEqual(parserSchema._customMessages)
      expect(builderSchema._required).toBe(true)
    })

    it('should match DslParser output for cross-type union DSL strings', () => {
      const builderSchema = new DslBuilder('types:email|phone').toSchema()
      const parserSchema = DslParser.parseString('types:email|phone')

      expect(builderSchema.oneOf).toEqual(parserSchema.oneOf)
    })
  })
})
