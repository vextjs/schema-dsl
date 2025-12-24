// lib/core/CacheManager.js

const CONSTANTS = require('../config/constants');

/**
 * 缓存管理器
 * 实现LRU淘汰策略、TTL过期、统计信息收集
 */
class CacheManager {
  constructor(options = {}) {
    this.options = {
      maxSize: options.maxSize || CONSTANTS.CACHE.SCHEMA_CACHE.MAX_SIZE,
      ttl: options.ttl || CONSTANTS.CACHE.SCHEMA_CACHE.TTL,
      enabled: options.enabled !== undefined ? options.enabled : CONSTANTS.CACHE.ENABLED,
      statsEnabled: options.statsEnabled !== undefined ? options.statsEnabled : CONSTANTS.CACHE.STATS_ENABLED
    };

    // 缓存存储（使用Map保持插入顺序，实现LRU）
    this.cache = new Map();

    // 统计信息
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      hitRate: 0
    };

    // 定期清理过期缓存
    if (this.options.enabled && this.options.ttl > 0) {
      this._startCleanupTimer();
    }
  }

  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {*} 缓存值，未命中返回null
   */
  get(key) {
    if (!this.options.enabled) {
      return null;
    }

    const entry = this.cache.get(key);

    // 未命中
    if (!entry) {
      this._recordMiss();
      return null;
    }

    // 检查过期
    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this._recordMiss();
      this._recordEviction();
      return null;
    }

    // 命中：更新访问时间（LRU）
    entry.lastAccess = Date.now();
    entry.accessCount++;

    // 将访问的项移到末尾（LRU策略）
    this.cache.delete(key);
    this.cache.set(key, entry);

    this._recordHit();
    return entry.value;
  }

  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {*} value - 缓存值
   * @param {number} [ttl] - 可选的TTL（毫秒）
   */
  set(key, value, ttl) {
    if (!this.options.enabled) {
      return;
    }

    // 检查容量，执行LRU淘汰
    if (this.cache.size >= this.options.maxSize) {
      this._evictLRU();
    }

    const entry = {
      value,
      createdAt: Date.now(),
      lastAccess: Date.now(),
      accessCount: 0,
      ttl: ttl || this.options.ttl
    };

    this.cache.set(key, entry);
    this._recordSet();
  }

  /**
   * 删除缓存
   * @param {string} key - 缓存键
   * @returns {boolean} 是否删除成功
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this._recordDelete();
    }
    return deleted;
  }

  /**
   * 检查缓存是否存在
   * @param {string} key - 缓存键
   * @returns {boolean}
   */
  has(key) {
    if (!this.options.enabled) {
      return false;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // 检查过期
    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this._recordEviction();
      return false;
    }

    return true;
  }

  /**
   * 清空缓存
   */
  clear() {
    this.cache.clear();
    this._recordClear();
  }

  /**
   * 获取缓存大小
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }

  /**
   * 获取统计信息
   * @returns {Object}
   */
  getStats() {
    // 计算命中率
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.options.maxSize,
      enabled: this.options.enabled
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      hitRate: 0
    };
  }

  /**
   * 获取所有缓存键
   * @returns {Array<string>}
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * 获取所有缓存值
   * @returns {Array}
   */
  values() {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * 批量获取
   * @param {Array<string>} keys - 缓存键数组
   * @returns {Map<string, *>} 键值对Map
   */
  mget(keys) {
    const result = new Map();
    for (const key of keys) {
      const value = this.get(key);
      if (value !== null) {
        result.set(key, value);
      }
    }
    return result;
  }

  /**
   * 批量设置
   * @param {Map<string, *>} entries - 键值对Map
   */
  mset(entries) {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  /**
   * 批量删除
   * @param {Array<string>} keys - 缓存键数组
   * @returns {number} 删除的数量
   */
  mdel(keys) {
    let count = 0;
    for (const key of keys) {
      if (this.delete(key)) {
        count++;
      }
    }
    return count;
  }

  /**
   * 预热缓存
   * @param {Function} loader - 加载函数 (key) => value
   * @param {Array<string>} keys - 需要预热的键
   */
  async warmup(loader, keys) {
    const promises = keys.map(async (key) => {
      try {
        const value = await loader(key);
        this.set(key, value);
      } catch (error) {
        console.error(`Warmup failed for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * 检查缓存项是否过期
   * @private
   */
  _isExpired(entry) {
    if (!entry.ttl || entry.ttl <= 0) {
      return false;
    }
    return Date.now() - entry.createdAt > entry.ttl;
  }

  /**
   * LRU淘汰策略：删除最久未访问的项
   * @private
   */
  _evictLRU() {
    // Map保持插入顺序，第一个是最早的
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this._recordEviction();
    }
  }

  /**
   * 定期清理过期缓存
   * @private
   */
  _startCleanupTimer() {
    // 每分钟清理一次过期缓存
    this.cleanupTimer = setInterval(() => {
      this._cleanupExpired();
    }, 60000);

    // 防止定时器阻止进程退出
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * 清理所有过期缓存
   * @private
   */
  _cleanupExpired() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this._isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
      this._recordEviction();
    }
  }

  /**
   * 停止清理定时器
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }

  // ========== 统计记录方法 ==========

  _recordHit() {
    if (this.options.statsEnabled) {
      this.stats.hits++;
    }
  }

  _recordMiss() {
    if (this.options.statsEnabled) {
      this.stats.misses++;
    }
  }

  _recordEviction() {
    if (this.options.statsEnabled) {
      this.stats.evictions++;
    }
  }

  _recordSet() {
    if (this.options.statsEnabled) {
      this.stats.sets++;
    }
  }

  _recordDelete() {
    if (this.options.statsEnabled) {
      this.stats.deletes++;
    }
  }

  _recordClear() {
    if (this.options.statsEnabled) {
      this.stats.clears++;
    }
  }
}

module.exports = CacheManager;

