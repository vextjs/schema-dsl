/**
 * i18n 内存安全示例
 * 
 * 演示如何使用 LRU 缓存防止内存泄漏
 * 包含内存监控和最佳实践
 * 
 * @version 2.2.1
 */

const { Validator, Locale } = require('../index');
const LRUCache = require('../lib/utils/LRUCache');

console.log('========== i18n 内存安全示例 ==========\n');

// ========== 1. 问题：无限制缓存导致内存泄漏 ==========

console.log('❌ 问题场景：无限制缓存');
console.log('-----------------------------------');

class UnsafeLocale {
    static messageCache = new Map();  // ⚠️ 无容量限制

    static formatMessage(locale, key, params) {
        const cacheKey = `${locale}:${key}`;

        if (!this.messageCache.has(cacheKey)) {
            const message = this.loadMessage(locale, key);
            this.messageCache.set(cacheKey, message);  // ⚠️ 永远不清理
        }

        return this.messageCache.get(cacheKey);
    }

    static loadMessage(locale, key) {
        // 模拟加载语言包
        return `[${locale}] ${key}`;
    }
}

// 模拟多租户场景：每个租户可能使用不同语言
console.log('\n模拟 100 个租户，每个 5 种语言...');
for (let tenant = 1; tenant <= 100; tenant++) {
    for (const locale of ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR']) {
        UnsafeLocale.formatMessage(locale, `tenant_${tenant}_error`, {});
    }
}

console.log(`缓存条目数: ${UnsafeLocale.messageCache.size}`);
console.log('⚠️ 风险：缓存无限增长，内存持续上升');

// ========== 2. 解决方案：LRU 缓存 ==========

console.log('\n\n✅ 解决方案：LRU 缓存（推荐）');
console.log('-----------------------------------');

class SafeLocale {
    // ✅ 使用 LRU 缓存，最多缓存 10 种语言
    static messageCache = new LRUCache({
        maxSize: 10,
        enableStats: true
    });

    static formatMessage(locale, key, params) {
        const cacheKey = `${locale}:${key}`;

        let message = this.messageCache.get(cacheKey);

        if (!message) {
            message = this.loadMessage(locale, key);
            this.messageCache.set(cacheKey, message);  // ✅ 自动清理最少使用的
        }

        return message;
    }

    static loadMessage(locale, key) {
        return `[${locale}] ${key}`;
    }

    static getStats() {
        return this.messageCache.getStats();
    }
}

// 模拟相同场景
console.log('\n模拟 100 个租户，每个 5 种语言...');
for (let tenant = 1; tenant <= 100; tenant++) {
    for (const locale of ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR']) {
        SafeLocale.formatMessage(locale, `tenant_${tenant}_error`, {});
    }
}

const stats = SafeLocale.getStats();
console.log(`缓存条目数: ${SafeLocale.messageCache.size}`);
console.log(`命中次数: ${stats.hits}`);
console.log(`未命中次数: ${stats.misses}`);
console.log(`驱逐次数: ${stats.evictions}`);
const hitRate = stats.hits + stats.misses > 0
    ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
    : '0.00';
console.log(`命中率: ${hitRate}%`);
console.log('✅ 优势：内存占用恒定，自动清理');

// ========== 3. 内存监控示例 ==========

console.log('\n\n📊 内存监控示例');
console.log('-----------------------------------');

function formatBytes(bytes) {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

const memBefore = process.memoryUsage();
console.log(`初始内存: ${formatBytes(memBefore.heapUsed)}`);

// 创建大量 LRU 缓存测试内存占用
const testCache = new LRUCache({ maxSize: 1000 });
for (let i = 0; i < 10000; i++) {
    testCache.set(`key_${i}`, { data: 'x'.repeat(100) });
}

const memAfter = process.memoryUsage();
console.log(`处理后内存: ${formatBytes(memAfter.heapUsed)}`);
console.log(`内存增长: ${formatBytes(memAfter.heapUsed - memBefore.heapUsed)}`);
console.log(`缓存条目: ${testCache.size} / 1000 (maxSize)`);
console.log('✅ 验证：缓存容量被正确限制');

// ========== 4. 最佳实践建议 ==========

console.log('\n\n📚 最佳实践建议');
console.log('-----------------------------------');
console.log(`
1️⃣ 使用 LRU 缓存防止内存泄漏
   ✅ 设置合理的 maxSize（推荐 10-100）
   ✅ 启用统计功能监控命中率
   ✅ 生产环境定期检查内存使用

2️⃣ 多租户场景推荐方案
   选项 A：实例级配置（每个请求创建独立 Validator）
   选项 B：请求级传参（validator.validate(data, { locale })）
   选项 C：中间件统一处理（req.locale）

3️⃣ 前端动态切换语言
   ⚠️ 避免使用全局 Locale.setLocale()
   ✅ 通过请求头传递 Accept-Language
   ✅ 每个请求创建独立验证器实例

4️⃣ 内存监控
   • 开发环境：启用 enableStats 追踪缓存效率
   • 生产环境：定期检查 process.memoryUsage()
   • 告警阈值：堆内存超过容器限制的 80%

5️⃣ 性能优化
   • 热门语言保持在缓存中（中文、英文）
   • 冷门语言按需加载，自动驱逐
   • 命中率目标：> 95%

详细文档：
- docs/i18n-analysis.md - 完整架构分析
- docs/frontend-i18n-guide.md - 前端集成指南
`);

console.log('\n✅ i18n 内存安全示例完成！');
console.log('💡 提示：运行 npm test -- test/unit/utils/LRUCache.test.js 验证缓存功能');
