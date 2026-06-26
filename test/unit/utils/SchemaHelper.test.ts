import { describe, expect, it } from 'vitest'
import { SchemaHelper } from '../../../src/utils/SchemaHelper.js'

describe('SchemaHelper', () => {
    const complexSchema = {
        type: 'object',
        required: ['id'],
        properties: {
            id: { type: 'string' },
            profile: {
                type: 'object',
                required: ['name'],
                properties: {
                    name: { type: 'string', minLength: 2 },
                    tags: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                value: { type: 'number' },
                            },
                        },
                    },
                },
            },
        },
    } as const

    describe('isValidSchema()', () => {
        it('accepts schemas with core JSON Schema markers', () => {
            expect(SchemaHelper.isValidSchema(true)).toBe(true)
            expect(SchemaHelper.isValidSchema(false)).toBe(true)
            expect(SchemaHelper.isValidSchema({ type: 'string' })).toBe(true)
            expect(SchemaHelper.isValidSchema({ properties: {} })).toBe(true)
            expect(SchemaHelper.isValidSchema({ items: { type: 'string' } })).toBe(true)
            expect(SchemaHelper.isValidSchema({ $ref: '#/$defs/User' })).toBe(true)
            expect(SchemaHelper.isValidSchema({ anyOf: [{ type: 'string' }] })).toBe(true)
            expect(SchemaHelper.isValidSchema({ oneOf: [{ type: 'string' }] })).toBe(true)
            expect(SchemaHelper.isValidSchema({ allOf: [{ type: 'string' }] })).toBe(true)
            expect(SchemaHelper.isValidSchema({ enum: ['active'] })).toBe(true)
            expect(SchemaHelper.isValidSchema({ const: 1 })).toBe(true)
            expect(SchemaHelper.isValidSchema({ not: true })).toBe(true)
            expect(SchemaHelper.isValidSchema({ if: { type: 'string' }, then: { minLength: 1 } })).toBe(true)
            expect(SchemaHelper.isValidSchema({ format: 'email' })).toBe(true)
            expect(SchemaHelper.isValidSchema({ pattern: '^a' })).toBe(true)
            expect(SchemaHelper.isValidSchema({ title: 'Name' })).toBe(true)
        })

        it('rejects non-object and marker-less values', () => {
            expect(SchemaHelper.isValidSchema(null)).toBe(false)
            expect(SchemaHelper.isValidSchema('string')).toBe(false)
            expect(SchemaHelper.isValidSchema({ custom: 'Name' })).toBe(false)
        })
    })

    describe('generateSchemaId()', () => {
        it('should generate a stable content-based id', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                },
            }

            expect(SchemaHelper.generateSchemaId(schema)).toBe(SchemaHelper.generateSchemaId(schema))
        })

        it('should use a 64-bit hash-sized identifier rather than the old short 32-bit form', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                },
            }

            const id = SchemaHelper.generateSchemaId(schema)

            expect(id).toMatch(/^schema_[0-9a-z]+$/)
            expect(id.length).toBeGreaterThan('schema_zzzzzz'.length)
        })

        it('generates the same id for schemas with equivalent key order', () => {
            expect(SchemaHelper.generateSchemaId({ type: 'string', minLength: 1 } as any))
                .toBe(SchemaHelper.generateSchemaId({ minLength: 1, type: 'string' } as any))
        })
    })

    describe('schema structure helpers', () => {
        it('clones schemas without sharing nested references', () => {
            const clone = SchemaHelper.cloneSchema(complexSchema as any)

            expect(clone).toEqual(complexSchema)
            expect(clone).not.toBe(complexSchema)
            expect(clone.properties!.profile).not.toBe(complexSchema.properties.profile)
        })

        it('clones schemas without erasing function validators or RegExp metadata', () => {
            const validate = () => true
            const metadata = /schema-helper/i
            const clone = SchemaHelper.cloneSchema({
                type: 'string',
                validate,
                metadata,
            } as any) as any

            expect(clone.validate).toBe(validate)
            expect(clone.metadata).not.toBe(metadata)
            expect(clone.metadata.source).toBe('schema-helper')
            expect(clone.metadata.flags).toBe('i')
        })

        it('flattens nested object properties into dot paths', () => {
            expect(SchemaHelper.flattenSchema(complexSchema as any)).toEqual({
                id: { type: 'string' },
                'profile.name': { type: 'string', minLength: 2 },
                'profile.tags': complexSchema.properties.profile.properties.tags,
            })
        })

        it('flattens __proto__ properties without mutating result prototype', () => {
            const properties = Object.create(null)
            properties['__proto__'] = { type: 'string' }
            const flat = SchemaHelper.flattenSchema({
                type: 'object',
                properties,
            } as any)

            expect(Object.prototype.hasOwnProperty.call(flat, '__proto__')).toBe(true)
            expect(Object.getPrototypeOf(flat)).toBeNull()
            expect(flat['__proto__']).toEqual({ type: 'string' })
        })

        it('returns field paths for nested objects and array item objects', () => {
            expect(SchemaHelper.getFieldPaths(complexSchema as any)).toEqual([
                'id',
                'profile',
                'profile.name',
                'profile.tags',
                'profile.tags[].value',
            ])
        })

        it('extracts required paths from nested object schemas', () => {
            expect(SchemaHelper.extractRequiredFields(complexSchema as any)).toEqual([
                'id',
                'profile.name',
            ])
        })

        it('compares schemas by serialized structure', () => {
            expect(SchemaHelper.compareSchemas({ type: 'string' }, { type: 'string' })).toBe(true)
            expect(SchemaHelper.compareSchemas({ type: 'string' }, { type: 'number' })).toBe(false)
            expect(SchemaHelper.compareSchemas(
                { type: 'string', minLength: 1 } as any,
                { minLength: 1, type: 'string' } as any
            )).toBe(true)
        })

        it('simplifies metadata and empty containers while preserving real fields', () => {
            expect(SchemaHelper.simplifySchema({
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: {},
                required: [],
            } as any)).toEqual({ type: 'object' })

            expect(SchemaHelper.simplifySchema({
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name'],
            } as any)).toEqual({
                type: 'object',
                properties: { name: { type: 'string' } },
                required: ['name'],
            })
        })
    })

    describe('metadata helpers', () => {
        it('validates property names with the documented identifier rules', () => {
            expect(SchemaHelper.isValidPropertyName('user_name-1')).toBe(true)
            expect(SchemaHelper.isValidPropertyName('_internal')).toBe(true)
            expect(SchemaHelper.isValidPropertyName('1name')).toBe(false)
            expect(SchemaHelper.isValidPropertyName('user.name')).toBe(false)
        })

        it('calculates nesting complexity through object and array children', () => {
            expect(SchemaHelper.getSchemaComplexity(complexSchema as any)).toBe(2)
            expect(SchemaHelper.getSchemaComplexity({ type: 'string' })).toBe(0)
        })

        it('summarizes schema shape for documentation and tooling views', () => {
            expect(SchemaHelper.summarizeSchema(complexSchema as any)).toEqual({
                type: 'object',
                fieldCount: 5,
                requiredCount: 2,
                complexity: 2,
                hasNested: true,
                fields: ['id', 'profile', 'profile.name', 'profile.tags', 'profile.tags[].value'],
            })
        })
    })
})
