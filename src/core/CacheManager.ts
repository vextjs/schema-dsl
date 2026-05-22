import { MemoryCache } from 'cache-hub'
import { CACHE } from '../config/constants.js'

type CacheValue = unknown

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  clears: number
  hitRate: string
  size: number
  maxSize: number
  enabled: boolean
}

/**
 * CacheManager — LRU cache for compiled AJV schemas.
 *
 * v2 delegates to cache-hub's MemoryCache (fix BD-04: miss returns undefined → normalized to null).
 *
 * cache-hub MemoryCache actual API:
 *   get(key) → value | undefined
 *   set(key, value, opts?) — opts.ttl in ms
 *   del(key) → boolean           ← note: del, not delete
 *   has(key) → boolean
 *   clear() → void
 *   keys() → string[]
 *   getStats() → { hits, misses, hitRate, entries, sets, deletes, evictions, memoryUsage }
 */
export class CacheManager {
  private _enabled: boolean
  private _maxSize: number
  private _ttl: number
  private _cache: MemoryCache
  private _statsEnabled: boolean = true
  private _clears = 0

  constructor(options: {
    maxSize?: number
    ttl?: number
    enabled?: boolean
    statsEnabled?: boolean
  } = {}) {
    this._maxSize = options.maxSize ?? CACHE.SCHEMA_CACHE.MAX_SIZE
    this._ttl = options.ttl ?? CACHE.SCHEMA_CACHE.TTL
    this._enabled = options.enabled !== false
    this._cache = new MemoryCache({ maxEntries: this._maxSize })
    this._statsEnabled = options.statsEnabled !== false
  }

  get options(): { maxSize: number; ttl: number; enabled: boolean; statsEnabled: boolean } {
    return {
      maxSize: this._maxSize,
      ttl: this._ttl,
      enabled: this._enabled,
      statsEnabled: this._statsEnabled,
    }
  }

  set options(opts: Partial<{ maxSize: number; ttl: number; enabled: boolean; statsEnabled: boolean }>) {
    if (opts.maxSize !== undefined && opts.maxSize !== this._maxSize) {
      this._maxSize = opts.maxSize
      // Rebuild MemoryCache so the new capacity actually takes effect
      const oldKeys = this._cache.keys()
      const newCache = new MemoryCache({ maxEntries: this._maxSize })
      for (const key of oldKeys) {
        const val = this._cache.get(key)
        if (val !== undefined) newCache.set(key, val)
      }
      this._cache = newCache
    }
    if (opts.ttl !== undefined) this._ttl = opts.ttl
    if (opts.enabled !== undefined) this._enabled = opts.enabled
    if (opts.statsEnabled !== undefined) this._statsEnabled = opts.statsEnabled
  }

  /**
   * Retrieve a cached AJV compile function.
   * @returns cached compile function, or null on miss (BD-04: undefined → null)
   */
  get(key: string): CacheValue | null {
    if (!this._enabled || key == null) return null
    try {
      const result = this._cache.get(String(key)) as CacheValue | undefined
      return result !== undefined ? result : null
    } catch {
      return null
    }
  }

  /**
   * Write a value to the cache.
   */
  set(key: string, value: CacheValue, ttl?: number): void {
    if (!this._enabled || key == null) return
    try {
      this._cache.set(String(key), value, ttl ?? this._ttl)
    } catch {
      // Silently ignore invalid keys for v1 compat
    }
  }

  /**
   * Delete a single cache entry.
   */
  delete(key: string): boolean {
    return this._cache.del(key)
  }

  /**
   * Check whether a key exists in the cache.
   */
  has(key: string): boolean {
    if (!this._enabled) return false
    return this._cache.has(key)
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this._cache.clear()
    this._clears++
  }

  /**
   * Return the current number of cache entries.
   */
  size(): number {
    return this._cache.keys().length
  }

  /**
   * Return cache statistics.
   */
  getStats(): CacheStats {
    if (!this._statsEnabled) {
      return {
        hits: 0, misses: 0, sets: 0, deletes: 0, evictions: 0,
        clears: 0, hitRate: '0.00', size: 0, maxSize: this._maxSize, enabled: this._enabled,
      }
    }
    const inner = this._cache.getStats()
    const total = inner.hits + inner.misses
    return {
      hits: inner.hits,
      misses: inner.misses,
      sets: inner.sets,
      deletes: inner.deletes,
      evictions: (inner as unknown as Record<string, unknown>).evictions as number ?? 0,
      clears: this._clears,
      hitRate: total > 0 ? ((inner.hits / total) * 100).toFixed(2) : '0.00',
      size: inner.entries,
      maxSize: this._maxSize,
      enabled: this._enabled,
    }
  }

  /**
   * Reset all hit/miss/eviction counters.
   */
  resetStats(): void {
    this._cache.resetStats()
    this._clears = 0
  }
}
