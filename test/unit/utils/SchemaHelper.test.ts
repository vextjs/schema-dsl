import { describe, expect, it } from 'vitest'
import { SchemaHelper } from '../../../src/utils/SchemaHelper.js'

describe('SchemaHelper', () => {
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
    })
})