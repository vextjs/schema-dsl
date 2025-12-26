/**
 * i18n 内存安全示例
 * 
 * 演示如何使用 LRU 缓存防止内存泄漏
 * 正确实现：缓存完整的语言包对象，而非单个消息
 * 
 * @version 2.2.1
 */

const { Validator, Locale } = require('../index');
const LRUCache = require('../lib/utils/LRUCache');

console.log('========== i18n 内存安全示例 ==========\n');

// ========== 1. 问题：无限制缓存导致内存泄漏 ==========

console.log('❌ 问题场景：无限制语言包缓存');
console.log('-----------------------------------');

class UnsafeLocale {
    static languagePackCache = new Map();  // ⚠️ 无容量限制

    static getLanguagePack(locale) {
        if (!this.languagePackCache.has(locale)) {
            // 模拟加载整个语言包（包含所有错误消息）
            const pack = this.loadLanguagePack(locale);
            this.languagePackCache.set(locale, pack);  // ⚠️ 永远不清理
        }

        return this.languagePackCache.get(locale);
    }

    static loadLanguagePack(locale) {
        // 模拟加载完整语言包（10个错误类型）
        const pack = {};
        const errorTypes = ['required', 'minLength', 'maxLength', 'pattern', 'email',
            'url', 'type', 'enum', 'minimum', 'maximum'];
        errorTypes.forEach(type => {
            pack[type] = `[${locale}] ${type} error message`;
        });
        return pack;
    }

    static getMessage(locale, key) {
        const pack = this.getLanguagePack(locale);
        return pack[key] || `Unknown error: ${key}`;
    }
}

// 模拟多租户场景：100个租户使用50种不同语言
console.log('\n模拟 100 个租户，使用 50 种不同语言...');
const locales = [];
for (let i = 1; i <= 50; i++) {
    locales.push(`lang-${i}`);
}

for (let tenant = 1; tenant <= 100; tenant++) {
    const locale = locales[tenant % 50];  // 每个租户使用不同语言
    UnsafeLocale.getMessage(locale, 'required');
}

console.log(`缓存语言包数: ${UnsafeLocale.languagePackCache.size}`);
console.log('⚠️ 风险：50种语言 = 50个语言包缓存，无限增长');

// ========== 2. 解决方案：LRU 缓存语言包 ==========

console.log('\n\n✅ 解决方案：LRU 缓存（推荐）');
console.log('-----------------------------------');
console.log('关键：一个语言只有一个缓存（缓存完整语言包对象）\n');

class SafeLocale {
    // ✅ 使用 LRU 缓存，最多缓存 10 个语言包
    static languagePackCache = new LRUCache({
        maxSize: 10,
        enableStats: true
    });

    static getLanguagePack(locale) {
        // 尝试从缓存获取
        let pack = this.languagePackCache.get(locale);

        if (!pack) {
            // 缓存未命中，加载语言包
            pack = this.loadLanguagePack(locale);
            this.languagePackCache.set(locale, pack);  // ✅ 自动清理最少使用的语言包
            console.log(`  [加载] 语言包: ${locale}`);
        }

        return pack;
    }

    static loadLanguagePack(locale) {
        // 模拟加载完整语言包
        const pack = {};
        const errorTypes = ['required', 'minLength', 'maxLength', 'pattern', 'email',
            'url', 'type', 'enum', 'minimum', 'maximum'];
        errorTypes.forEach(type => {
            pack[type] = `[${locale}] ${type} error message`;
        });
        return pack;
    }

    static getMessage(locale, key) {
        const pack = this.getLanguagePack(locale);
        return pack[key] || `Unknown error: ${key}`;
    }

    static getStats() {
        return this.languagePackCache.getStats();
    }
}

// 模拟相同场景：100个租户使用50种语言
console.log('模拟 100 个租户，使用 50 种不同语言...');
for (let tenant = 1; tenant <= 100; tenant++) {
    const locale = locales[tenant % 50];
    SafeLocale.getMessage(locale, 'required');
}

const stats = SafeLocale.getStats();
console.log(`\n缓存语言包数: ${SafeLocale.languagePackCache.size} / 10 (maxSize)`);
console.log(`加载次数: ${stats.sets}`);
console.log(`命中次数: ${stats.hits}`);
console.log(`未命中次数: ${stats.misses}`);
console.log(`驱逐次数: ${stats.evictions}`);
const hitRate = stats.hits + stats.misses > 0
    ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
    : '0.00';
console.log(`命中率: ${hitRate}%`);
console.log('✅ 优势：最多只缓存10个语言包，内存恒定可控');
console.log('💡 说明：50种语言但只缓存最常用的10种，冷门语言自动清理');

// ========== 3. 并发场景测试 ==========

console.log('\n\n🔄 并发场景测试');
console.log('-----------------------------------');

class ConcurrentSafeLocale {
    static languagePackCache = new LRUCache({ maxSize: 5, enableStats: true });

    static getLanguagePack(locale) {
        let pack = this.languagePackCache.get(locale);
        if (!pack) {
            pack = { required: `[${locale}] required`, email: `[${locale}] email` };
            this.languagePackCache.set(locale, pack);
        }
        return pack;
    }
}

// 模拟并发请求：10个并发请求，使用不同语言
console.log('模拟 10 个并发请求...');
const concurrentRequests = [];
const testLocales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR', 'ko-KR', 'de-DE', 'it-IT'];

for (let i = 0; i < 10; i++) {
    const locale = testLocales[i % testLocales.length];
    concurrentRequests.push(
        Promise.resolve().then(() => {
            const pack = ConcurrentSafeLocale.getLanguagePack(locale);
            return { requestId: i + 1, locale, message: pack.required };
        })
    );
}

Promise.all(concurrentRequests).then(results => {
    console.log('\n并发请求结果:');
    results.forEach(r => {
        console.log(`  请求${r.requestId}: ${r.locale} → ${r.message}`);
    });

    const concStats = ConcurrentSafeLocale.languagePackCache.getStats();
    console.log(`\n缓存状态: ${ConcurrentSafeLocale.languagePackCache.size} 个语言包`);
    console.log(`最多缓存: 5 个语言包 (maxSize)`);
    console.log('✅ 验证：8种语言访问，只缓存最近使用的5种');

    continueDemo();
}).catch(err => {
    console.error('并发测试错误:', err);
    continueDemo();
});

function continueDemo() {
    // ========== 4. 内存监控示例 ==========

    console.log('\n\n📊 内存监控示例');
    console.log('-----------------------------------');

    function formatBytes(bytes) {
        return (bytes / 1024 / 1024).toFixed(2) + ' MB';
    }

    const memBefore = process.memoryUsage();
    console.log(`初始内存: ${formatBytes(memBefore.heapUsed)}`);

    // 创建大量语言包测试内存占用
    const testCache = new LRUCache({ maxSize: 10 });
    for (let i = 0; i < 1000; i++) {
        // 模拟语言包对象（包含50个错误消息）
        const languagePack = {};
        for (let j = 0; j < 50; j++) {
            languagePack[`error_${j}`] = `Language ${i} error message ${j}`;
        }
        testCache.set(`lang-${i}`, languagePack);
    }

    const memAfter = process.memoryUsage();
    console.log(`处理后内存: ${formatBytes(memAfter.heapUsed)}`);
    console.log(`内存增长: ${formatBytes(memAfter.heapUsed - memBefore.heapUsed)}`);
    console.log(`缓存语言包: ${testCache.size} / 10 (maxSize)`);
    console.log('✅ 验证：1000种语言加载，只缓存最近的10种');

    // ========== 5. 最佳实践建议 ==========

    console.log('\n\n📚 最佳实践建议');
    console.log('-----------------------------------');
    console.log(`
🔑 核心原则：一个语言只有一个缓存（缓存完整语言包对象）

1️⃣ 使用 LRU 缓存防止内存泄漏
   ✅ 缓存语言包对象，不是单个消息
   ✅ 设置合理的 maxSize（推荐 10-20种语言）
   ✅ 启用统计功能监控命中率
   ✅ 生产环境定期检查内存使用

2️⃣ 正确的缓存策略
   ✅ 缓存键：locale（如 "zh-CN"）
   ✅ 缓存值：完整语言包 { required: "...", minLength: "..." }
   ❌ 错误：缓存 "zh-CN:required" 这样的组合键
   
   示例：
   // ✅ 正确
   cache.set('zh-CN', { required: '必填', email: '邮箱格式' });
   
   // ❌ 错误（浪费内存）
   cache.set('zh-CN:required', '必填');
   cache.set('zh-CN:email', '邮箱格式');

3️⃣ 多租户场景推荐方案
   选项 A：实例级配置（每个请求创建独立 Validator）⭐⭐⭐⭐⭐
   选项 B：请求级传参（validator.validate(data, { locale })）⭐⭐⭐⭐
   选项 C：中间件统一处理（req.locale）⭐⭐⭐

4️⃣ 前端动态切换语言
   ⚠️ 避免使用全局 Locale.setLocale()
   ✅ 通过请求头传递 Accept-Language
   ✅ 每个请求创建独立验证器实例

5️⃣ 内存监控
   • 开发环境：启用 enableStats 追踪缓存效率
   • 生产环境：定期检查 process.memoryUsage()
   • 告警阈值：堆内存超过容器限制的 80%

6️⃣ 性能优化
   • 热门语言保持在缓存中（中文、英文）
   • 冷门语言按需加载，自动驱逐
   • 命中率目标：> 90%（取决于语言分布）
   • maxSize 建议：支持语言数 × 0.5 ~ 1.0

详细文档：
- docs/i18n-analysis.md - 完整架构分析
- docs/frontend-i18n-guide.md - 前端集成指南
`);

    console.log('\n✅ i18n 内存安全示例完成！');
    console.log('💡 提示：运行 npm test 验证所有功能');
}
