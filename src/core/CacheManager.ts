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
 * CacheManager — 编译后 AJV schema 的 LRU 缓存
 *
 * v2 改为委托 cache-hub 的 MemoryCache（修复 BD-04：miss 返回 undefined → 统一转 null）
 *
 * cache-hub MemoryCache 实际 API：
 *   get(key) → value | undefined
 *   set(key, value, opts?) — opts.ttl 单位 ms
 *   del(key) → boolean           ← 注意是 del，不是 delete
 *   has(key) → boolean
 *   clear() → void
 *   keys() → string[]
 *   getStats() → { hits, misses, hitRate, entries, sets, deletes, evictions, memoryUsage }
 */
export class CacheManager {
  private _enabled: boolean
  private _maxSize: number
  private _ttl: number
  private readonly _cache: MemoryCache
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
    if (opts.maxSize !== undefined) this._maxSize = opts.maxSize
    if (opts.ttl !== undefined) this._ttl = opts.ttl
    if (opts.enabled !== undefined) this._enabled = opts.enabled
    if (opts.statsEnabled !== undefined) this._statsEnabled = opts.statsEnabled
  }

  /**
   * 获取缓存的 AJV 编译函数
   * @returns 命中返回函数；未命中返回 null（BD-04：undefined → null）
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
   * 写入缓存
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
   * 删除单个缓存条目
   */
  delete(key: string): boolean {
    return this._cache.del(key)
  }

  /**
   * 检查 key 是否命中
   */
  has(key: string): boolean {
    if (!this._enabled) return false
    return this._cache.has(key)
  }

  /**
   * 清空全部缓存
   */
  clear(): void {
    this._cache.clear()
    this._clears++
  }

  /**
   * 当前缓存条目数
   */
  size(): number {
    return this._cache.keys().length
  }

  /**
   * 获取统计信息
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
   * 重置统计信息
   */
  resetStats(): void {
    this._cache.resetStats()
    this._clears = 0
  }
}
