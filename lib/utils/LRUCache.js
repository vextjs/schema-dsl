/**
 * 带内存管理的 LRU 缓存实现
 * 用于安全缓存语言包消息，防止内存泄漏
 * 
 * @module lib/utils/LRUCache
 * @version 2.2.1
 */

/**
 * LRU (Least Recently Used) 缓存
 * 自动清理最少使用的条目，确保内存占用可控
 */
class LRUCache {
    /**
     * 创建 LRU 缓存实例
     * @param {Object} options - 配置选项
     * @param {number} [options.maxSize=10] - 最大缓存数量
     * @param {boolean} [options.enableStats=false] - 是否启用统计
     */
    constructor(options = {}) {
        this.maxSize = options.maxSize || 10;
        this.enableStats = options.enableStats || false;
        this.cache = new Map();

        if (this.enableStats) {
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                sets: 0
            };
        }
    }

    /**
     * 获取缓存值
     * @param {string} key - 键
     * @returns {*} 缓存的值，不存在则返回 undefined
     */
    get(key) {
        if (!this.cache.has(key)) {
            if (this.enableStats) this.stats.misses++;
            return undefined;
        }

        if (this.enableStats) this.stats.hits++;

        // LRU: 移到最后（标记为最近使用）
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);

        return value;
    }

    /**
     * 设置缓存值
     * @param {string} key - 键
     * @param {*} value - 值
     */
    set(key, value) {
        if (this.enableStats) this.stats.sets++;

        // 如果已存在，先删除（更新顺序）
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        // 如果超过容量，删除最旧的（最少使用）
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);

            if (this.enableStats) this.stats.evictions++;

            // 开发环境警告
            if (process.env.NODE_ENV === 'development') {
                console.warn(`[LRUCache] Evicted key: ${firstKey} (cache full: ${this.maxSize})`);
            }
        }

        this.cache.set(key, value);
    }

    /**
     * 检查键是否存在
     * @param {string} key - 键
     * @returns {boolean} 是否存在
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * 删除指定键
     * @param {string} key - 键
     * @returns {boolean} 是否删除成功
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * 清空所有缓存
     */
    clear() {
        this.cache.clear();

        if (this.enableStats) {
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                sets: 0
            };
        }
    }

    /**
     * 获取当前缓存大小
     * @returns {number} 缓存条目数量
     */
    get size() {
        return this.cache.size;
    }

    /**
     * 获取所有键
     * @returns {Array<string>} 键数组
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * 获取缓存统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        if (!this.enableStats) {
            return { message: 'Stats not enabled. Set enableStats: true in constructor.' };
        }

        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            sets: this.stats.sets,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: this.maxSize,
            efficiency: hitRate >= 80 ? '优秀' : hitRate >= 60 ? '良好' : '需优化'
        };
    }

    /**
     * 重置统计信息
     */
    resetStats() {
        if (this.enableStats) {
            this.stats = {
                hits: 0,
                misses: 0,
                evictions: 0,
                sets: 0
            };
        }
    }
}

module.exports = LRUCache;
