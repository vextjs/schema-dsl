import { describe, expect, it } from 'vitest'

import * as adapters from '../../src/adapters/index.js'
import * as config from '../../src/config/index.js'
import * as schemaDsl from '../../src/index.js'
import * as parser from '../../src/parser/index.js'

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
        expect(schemaDsl.s).toBe(schemaDsl.dsl)
        expect(schemaDsl).toHaveProperty('registerExtension')
        expect(schemaDsl).toHaveProperty('registerExtensions')
        expect(schemaDsl).toHaveProperty('defineExtension')
    })

    it('keeps source submodule barrels wired to runtime exports', () => {
        expect(adapters).toHaveProperty('DslAdapter')
        expect(adapters).toHaveProperty('attachDslNamespaceFactories')
        expect(adapters).toHaveProperty('resetDslNamespaceExtensions')
        expect(config).toHaveProperty('VALIDATION')
        expect(config).toHaveProperty('PATTERNS')
        expect(parser).toHaveProperty('TypeRegistry')
        expect(parser).toHaveProperty('ConstraintParser')
        expect(parser).toHaveProperty('SchemaCompiler')
        expect(parser).toHaveProperty('DslParser')
    })
})
