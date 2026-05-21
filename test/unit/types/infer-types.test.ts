import { describe, expectTypeOf, it } from 'vitest'

import type { InferDslDefinition, InferDslString, InferJsonSchema, InferSchema } from '../../../src/index.js'

describe('InferSchema types', () => {
    it('infers primitive DSL strings', () => {
        expectTypeOf<InferDslString<'string!'>>().toEqualTypeOf<string>()
        expectTypeOf<InferDslString<'email'>>().toEqualTypeOf<string>()
        expectTypeOf<InferDslString<'number:0-100'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'boolean?'>>().toEqualTypeOf<boolean>()
    })

    it('infers DSL object definitions with required markers', () => {
        type User = InferDslDefinition<{
            name: 'string!'
            age: 'number'
            active: 'boolean'
            'role!': 'admin|user'
        }>

        expectTypeOf<User>().toMatchTypeOf<{
            name: string
            age?: number
            active?: boolean
            role: 'admin' | 'user'
        }>()
    })

    it('infers JSON Schema object shapes', () => {
        type User = InferJsonSchema<{
            type: 'object'
            required: ['name']
            properties: {
                name: { type: 'string' }
                score: { type: 'integer' }
                tags: { type: 'array'; items: { type: 'string' } }
            }
        }>

        expectTypeOf<User>().toMatchTypeOf<{
            name: string
            score?: number
            tags?: string[]
        }>()
    })

    it('exposes a single InferSchema entry point', () => {
        expectTypeOf<InferSchema<'success|failed'>>().toEqualTypeOf<'success' | 'failed'>()
        expectTypeOf<InferSchema<{ enabled: 'boolean!' }>>().toMatchTypeOf<{ enabled: boolean }>()
    })
})