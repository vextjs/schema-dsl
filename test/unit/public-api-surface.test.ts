import { describe, expect, it } from 'vitest'

import * as schemaDsl from '../../src/index.js'

describe('public API surface', () => {
    it('keeps parser internals out of the root export', () => {
        expect(schemaDsl).not.toHaveProperty('DslParser')
        expect(schemaDsl).not.toHaveProperty('ConstraintParser')
        expect(schemaDsl).not.toHaveProperty('SchemaCompiler')
        expect(schemaDsl).not.toHaveProperty('DslAdapter')
    })

    it('keeps documented extension APIs available', () => {
        expect(schemaDsl).toHaveProperty('Validator')
        expect(schemaDsl).toHaveProperty('DslBuilder')
        expect(schemaDsl).toHaveProperty('TypeRegistry')
    })
})