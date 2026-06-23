import { describe, expect, it } from 'vitest'
import { TypeConverter } from '../../../src/utils/TypeConverter.js'

describe('TypeConverter - general mappings', () => {
  it('selects the primary JSON type from nullable unions', () => {
    expect(TypeConverter.primaryJSONType('string')).toBe('string')
    expect(TypeConverter.primaryJSONType(['null', 'integer'])).toBe('integer')
    expect(TypeConverter.primaryJSONType(['null'])).toBe('null')
    expect(TypeConverter.primaryJSONType([])).toBeNull()
  })

  it('maps native DSL names to JSON Schema primitive types', () => {
    expect(TypeConverter.toJSONSchemaType('STRING')).toBe('string')
    expect(TypeConverter.toJSONSchemaType('email')).toBe('string')
    expect(TypeConverter.toJSONSchemaType('datetime')).toBe('string')
    expect(TypeConverter.toJSONSchemaType('integer')).toBe('integer')
    expect(TypeConverter.toJSONSchemaType('boolean')).toBe('boolean')
    expect(TypeConverter.toJSONSchemaType('unknown')).toBe('string')
  })

  it('maps JSON Schema types to MongoDB BSON schema types', () => {
    expect(TypeConverter.toMongoDBType('number')).toBe('double')
    expect(TypeConverter.toMongoDBType('integer')).toBe('int')
    expect(TypeConverter.toMongoDBType('boolean')).toBe('bool')
    expect(TypeConverter.toMongoDBType('object')).toBe('object')
    expect(TypeConverter.toMongoDBType('array')).toBe('array')
    expect(TypeConverter.toMongoDBType(['null', 'string'])).toBe('string')
    expect(TypeConverter.toMongoDBType('unknown')).toBe('string')
  })
})

describe('TypeConverter - MySQL integer sizing', () => {
  it('should use TINYINT when minimum and maximum both fit the signed tinyint range', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -128,
      maximum: 127,
    })).toBe('TINYINT')
  })

  it('should use SMALLINT when minimum and maximum both fit the signed smallint range', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -32768,
      maximum: 32767,
    })).toBe('SMALLINT')
  })

  it('should promote to INT when the minimum exceeds SMALLINT capacity even if maximum is small', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -40000,
      maximum: 100,
    })).toBe('INT')
  })

  it('should stay conservative when only one bound is provided', () => {
    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      maximum: 100,
    })).toBe('BIGINT')

    expect(TypeConverter.toMySQLType('integer', {
      type: 'integer',
      minimum: -100,
    })).toBe('BIGINT')
  })
})

describe('TypeConverter - SQL type conversion', () => {
  it('maps string schemas to MySQL string/date/enum column types', () => {
    expect(TypeConverter.toMySQLType('string')).toBe('VARCHAR(255)')
    expect(TypeConverter.toMySQLType('string', { type: 'string', maxLength: 64 })).toBe('VARCHAR(64)')
    expect(TypeConverter.toMySQLType('string', { type: 'string', maxLength: 1000 })).toBe('TEXT')
    expect(TypeConverter.toMySQLType('string', { type: 'string', maxLength: 100000 })).toBe('LONGTEXT')
    expect(TypeConverter.toMySQLType('string', { type: 'string', format: 'date' })).toBe('DATETIME')
    expect(TypeConverter.toMySQLType('string', { type: 'string', enum: ['active', "owner's"] })).toBe("ENUM('active', 'owner''s')")
  })

  it('maps non-string schemas to MySQL column types', () => {
    expect(TypeConverter.toMySQLType('number')).toBe('DOUBLE')
    expect(TypeConverter.toMySQLType('boolean')).toBe('BOOLEAN')
    expect(TypeConverter.toMySQLType('object')).toBe('JSON')
    expect(TypeConverter.toMySQLType('array')).toBe('JSON')
    expect(TypeConverter.toMySQLType('null')).toBe('TEXT')
    expect(TypeConverter.toMySQLType('unknown')).toBe('VARCHAR(255)')
    expect(TypeConverter.toMySQLType(['null', 'integer'], { type: ['null', 'integer'] as any, minimum: 0, maximum: 10 })).toBe('TINYINT')
  })

  it('maps schemas to PostgreSQL column types', () => {
    expect(TypeConverter.toPostgreSQLType('string')).toBe('VARCHAR(255)')
    expect(TypeConverter.toPostgreSQLType('string', { type: 'string', maxLength: 120 })).toBe('VARCHAR(120)')
    expect(TypeConverter.toPostgreSQLType('string', { type: 'string', maxLength: 1000 })).toBe('TEXT')
    expect(TypeConverter.toPostgreSQLType('string', { type: 'string', format: 'date' })).toBe('DATE')
    expect(TypeConverter.toPostgreSQLType('string', { type: 'string', format: 'date-time' })).toBe('TIMESTAMP')
    expect(TypeConverter.toPostgreSQLType('number')).toBe('DOUBLE PRECISION')
    expect(TypeConverter.toPostgreSQLType('integer')).toBe('BIGINT')
    expect(TypeConverter.toPostgreSQLType('boolean')).toBe('BOOLEAN')
    expect(TypeConverter.toPostgreSQLType('object')).toBe('JSONB')
    expect(TypeConverter.toPostgreSQLType('array')).toBe('JSONB')
    expect(TypeConverter.toPostgreSQLType('null')).toBe('TEXT')
    expect(TypeConverter.toPostgreSQLType('unknown')).toBe('TEXT')
  })
})

describe('TypeConverter - helper utilities', () => {
  it('normalizes property names for storage targets', () => {
    expect(TypeConverter.normalizePropertyName('  User Name!  ')).toBe('User_Name')
    expect(TypeConverter.normalizePropertyName('123-id')).toBe('123_id')
    expect(TypeConverter.normalizePropertyName('__field--name__')).toBe('field_name')
  })

  it('returns regex presets for known formats', () => {
    expect(TypeConverter.formatToRegex('email')!.test('a@example.com')).toBe(true)
    expect(TypeConverter.formatToRegex('uri')!.test('https://example.com')).toBe(true)
    expect(TypeConverter.formatToRegex('date')!.test('2026-06-22')).toBe(true)
    expect(TypeConverter.formatToRegex('date-time')!.test('2026-06-22T12:30:00Z')).toBe(true)
    expect(TypeConverter.formatToRegex('time')!.test('12:30:00')).toBe(true)
    expect(TypeConverter.formatToRegex('uuid')!.test('123e4567-e89b-12d3-a456-426614174000')).toBe(true)
    expect(TypeConverter.formatToRegex('ipv4')!.test('127.0.0.1')).toBe(true)
    expect(TypeConverter.formatToRegex('ipv6')!.test('fe80::1')).toBe(true)
    expect(TypeConverter.formatToRegex('unknown')).toBeNull()
  })

  it('merges schemas while combining properties and required fields', () => {
    expect(TypeConverter.mergeSchemas(
      { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
      { properties: { age: { type: 'integer' } }, required: ['age', 'name'], additionalProperties: false },
    )).toEqual({
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      required: ['name', 'age'],
      additionalProperties: false,
    })
  })

  it('extracts only validation constraints from a schema', () => {
    expect(TypeConverter.extractConstraints({
      type: 'string',
      minLength: 3,
      maxLength: 32,
      pattern: '^[a-z]+$',
      format: 'email',
      enum: ['a', 'b'],
      const: 'a',
      title: 'Ignored',
    } as any)).toEqual({
      minLength: 3,
      maxLength: 32,
      pattern: '^[a-z]+$',
      format: 'email',
      enum: ['a', 'b'],
      const: 'a',
    })
  })
})
