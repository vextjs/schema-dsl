import { afterEach, describe, expect, it } from 'vitest'

import { DslBuilder, getDefaultValidator, Locale, resetRuntimeState } from '../../src/index.js'

describe('runtime state reset', () => {
    afterEach(() => {
        resetRuntimeState()
    })

    it('clears global custom types, locale overrides, and default validator singleton', () => {
        const defaultLocale = Locale.getLocale()
        const firstValidator = getDefaultValidator()

        DslBuilder.registerType('temporary-runtime-type', { type: 'string', minLength: 2 })
        Locale.setLocale(defaultLocale === 'zh-CN' ? 'en-US' : 'zh-CN')

        expect(DslBuilder.hasType('temporary-runtime-type')).toBe(true)
        expect(Locale.getLocale()).not.toBe(defaultLocale)

        resetRuntimeState()

        expect(DslBuilder.hasType('temporary-runtime-type')).toBe(false)
        expect(Locale.getLocale()).toBe(defaultLocale)
        expect(getDefaultValidator()).not.toBe(firstValidator)
    })
})