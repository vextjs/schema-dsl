import { describe, expectTypeOf, it } from 'vitest'

import type { InferDslDefinition, InferDslString, InferJsonSchema, InferSchema } from '../../../src/index.js'

describe('InferSchema types', () => {
    it('infers primitive DSL strings', () => {
        expectTypeOf<InferDslString<'string!'>>().toEqualTypeOf<string>()
        expectTypeOf<InferDslString<'email'>>().toEqualTypeOf<string>()
        expectTypeOf<InferDslString<'number:0-100'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'boolean?'>>().toEqualTypeOf<boolean>()
        expectTypeOf<InferDslString<'int'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'float'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'double'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'decimal'>>().toEqualTypeOf<number>()
        expectTypeOf<InferDslString<'mixed'>>().toEqualTypeOf<unknown>()
        expectTypeOf<InferDslString<'buffer'>>().toEqualTypeOf<string>()
    })

    it('infers typed enum and union DSL strings', () => {
        expectTypeOf<InferDslString<'enum:number:1|2'>>().toEqualTypeOf<1 | 2>()
        expectTypeOf<InferDslString<'enum:integer:1|2'>>().toEqualTypeOf<1 | 2>()
        expectTypeOf<InferDslString<'enum:boolean:true|false'>>().toEqualTypeOf<true | false>()
        expectTypeOf<InferDslString<'enum:red|blue'>>().toEqualTypeOf<'red' | 'blue'>()
        expectTypeOf<InferDslString<'types:string|number|boolean'>>().toEqualTypeOf<string | number | boolean>()
        expectTypeOf<InferDslString<'array<enum:number:1|2>'>>().toEqualTypeOf<Array<1 | 2>>()
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

    it('infers JSON Schema const and nullable type arrays', () => {
        expectTypeOf<InferJsonSchema<{ const: 'admin' }>>().toEqualTypeOf<'admin'>()
        expectTypeOf<InferJsonSchema<{ enum: ['draft', 'published'] }>>().toEqualTypeOf<'draft' | 'published'>()
        expectTypeOf<InferJsonSchema<{ type: ['string', 'null'] }>>().toEqualTypeOf<string | null>()
        expectTypeOf<InferSchema<true>>().toEqualTypeOf<unknown>()
        expectTypeOf<InferSchema<false>>().toEqualTypeOf<never>()
    })

    it('exposes a single InferSchema entry point', () => {
        expectTypeOf<InferSchema<'success|failed'>>().toEqualTypeOf<'success' | 'failed'>()
        expectTypeOf<InferSchema<{ enabled: 'boolean!' }>>().toMatchTypeOf<{ enabled: boolean }>()
    })
})
