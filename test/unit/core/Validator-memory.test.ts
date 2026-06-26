import { beforeEach, describe, expect, it } from 'vitest'
import { Validator, Locale, config, dsl, getDefaultValidator, resetRuntimeState, validate } from '../../../src/index.js'

type AjvWithCache = {
  _cache?: {
    size?: number
    keys?: () => Iterable<unknown>
  }
}

function getAjvCacheSizeFrom(ajv: AjvWithCache): number {
  const cache = ajv._cache
  if (!cache) return 0
  if (typeof cache.size === 'number') return cache.size
  if (typeof cache.keys === 'function') return Array.from(cache.keys()).length
  return 0
}

function getAjvCacheSize(validator: InstanceType<typeof Validator>): number {
  return getAjvCacheSizeFrom(validator.getAjv() as unknown as AjvWithCache)
}

function getRemoveAdditionalAjvCacheSize(validator: InstanceType<typeof Validator>): number {
  const internal = validator as unknown as { _removeAdditionalAjv?: AjvWithCache | null }
  return internal._removeAdditionalAjv ? getAjvCacheSizeFrom(internal._removeAdditionalAjv) : 0
}

function getRemoveAdditionalManagedCacheSize(validator: InstanceType<typeof Validator>): number {
  const internal = validator as unknown as { _removeAdditionalCache: Map<string, unknown> }
  return internal._removeAdditionalCache.size
}

function getFlatLocaleCacheSize(validator: InstanceType<typeof Validator>): number {
  const internal = validator as unknown as { _flatLocaleCache: Map<string, unknown> }
  return internal._flatLocaleCache.size
}

describe('Validator memory lifecycle', () => {
  beforeEach(() => {
    resetRuntimeState()
  })

  it('should reuse compiled schemas for repeated top-level DSL definitions', () => {
    config({ cache: { maxSize: 10, statsEnabled: true } })
    const schema = { name: 'string!' }
    const validator = getDefaultValidator()
    const baselineAjvCacheSize = getAjvCacheSize(validator)

    for (let i = 0; i < 500; i += 1) {
      expect(validate(schema, { name: 'rocky' }).valid).toBe(true)
    }

    const stats = validator.getCacheStats()
    expect(stats.hits).toBeGreaterThan(450)
    expect(stats.size).toBeLessThanOrEqual(10)
    expect(getAjvCacheSize(validator) - baselineAjvCacheSize).toBeLessThanOrEqual(10)
  })

  it('should reuse compiled schemas for repeated DslBuilder materialization', () => {
    config({ cache: { maxSize: 10, statsEnabled: true } })
    const builder = dsl('string!')
    const validator = getDefaultValidator()
    const baselineAjvCacheSize = getAjvCacheSize(validator)

    for (let i = 0; i < 500; i += 1) {
      expect(validate(builder, 'schema-dsl').valid).toBe(true)
    }

    const stats = validator.getCacheStats()
    expect(stats.hits).toBeGreaterThan(450)
    expect(stats.size).toBeLessThanOrEqual(10)
    expect(getAjvCacheSize(validator) - baselineAjvCacheSize).toBeLessThanOrEqual(10)
  })

  it('should release AJV internal schema references when clearCache is called', () => {
    const validator = new Validator({ cache: { maxSize: 100 } })
    const baselineAjvCacheSize = getAjvCacheSize(validator)

    for (let i = 0; i < 50; i += 1) {
      const field = `field${i}`
      const schema = {
        type: 'object',
        properties: {
          [field]: { type: 'string' },
        },
        required: [field],
      }
      expect(validator.validate(schema, { [field]: 'ok' }).valid).toBe(true)
    }

    expect(validator.getCacheStats().size).toBe(50)
    expect(getAjvCacheSize(validator)).toBeGreaterThan(baselineAjvCacheSize)

    validator.clearCache()

    expect(validator.getCacheStats().size).toBe(0)
    expect(getAjvCacheSize(validator)).toBeLessThanOrEqual(baselineAjvCacheSize + 1)
  })

  it('should bound flattened locale cache for unknown locale values', () => {
    const schema = dsl({ name: 'string!' })

    for (let i = 0; i < 500; i += 1) {
      expect(validate(schema, {}, { locale: `xx-${i}` }).valid).toBe(false)
    }

    expect(getFlatLocaleCacheSize(getDefaultValidator())).toBeLessThanOrEqual(32)
  })

  it('should invalidate flattened locale cache after Locale.addLocale', () => {
    const schema = dsl({ name: 'string!' })

    const before = validate(schema, {}, { locale: 'en-US' })
    expect(before.errors?.[0]?.message).not.toContain('CUSTOM REQUIRED')

    Locale.addLocale('en-US', { required: 'CUSTOM REQUIRED' })

    const after = validate(schema, {}, { locale: 'en-US' })
    expect(after.errors?.[0]?.message).toContain('CUSTOM REQUIRED')
  })

  it('should bound removeAdditional compilation cache and clear its AJV instance', () => {
    const validator = new Validator({ cache: { maxSize: 10 } })

    for (let i = 0; i < 100; i += 1) {
      const field = `field${i}`
      const data: Record<string, unknown> = { [field]: 'ok', extra: 'removed' }
      const schema = {
        type: 'object',
        _removeAdditional: true,
        additionalProperties: false,
        properties: {
          [field]: { type: 'string' },
        },
      }

      expect(validator.validate(schema, data).valid).toBe(true)
      expect(data).not.toHaveProperty('extra')
    }

    expect(getRemoveAdditionalManagedCacheSize(validator)).toBeLessThanOrEqual(10)
    expect(getRemoveAdditionalAjvCacheSize(validator)).toBeGreaterThan(0)

    validator.clearCache()

    expect(getRemoveAdditionalManagedCacheSize(validator)).toBe(0)
    expect(getRemoveAdditionalAjvCacheSize(validator)).toBe(0)
    expect((validator as unknown as { _removeAdditionalAjv: unknown })._removeAdditionalAjv).toBeNull()
  })

  it('should bound static quickValidate schema cache and allow clearing it', () => {
    const internal = Validator as unknown as { _quickValidateCacheMaxSize: number }
    const originalMaxSize = internal._quickValidateCacheMaxSize
    internal._quickValidateCacheMaxSize = 8
    Validator.clearQuickValidateCache()

    try {
      for (let i = 0; i < 25; i += 1) {
        const field = `field${i}`
        const schema = {
          type: 'object',
          properties: {
            [field]: { type: 'string' },
          },
          required: [field],
        }
        expect(Validator.quickValidate(schema, { [field]: 'ok' })).toBe(true)
      }

      expect(Validator.getQuickValidateCacheStats()).toEqual({ size: 8, maxSize: 8 })

      Validator.clearQuickValidateCache()
      expect(Validator.getQuickValidateCacheStats()).toEqual({ size: 0, maxSize: 8 })
      expect((Validator as unknown as { _quickValidateAjv: unknown })._quickValidateAjv).toBeNull()
    } finally {
      internal._quickValidateCacheMaxSize = originalMaxSize
      Validator.clearQuickValidateCache()
    }
  })
})
