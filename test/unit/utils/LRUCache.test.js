/**
 * LRU 缓存测试
 */

const { expect } = require('chai');
const LRUCache = require('../../../lib/utils/LRUCache');

describe('LRUCache', () => {
    let cache;

    beforeEach(() => {
        cache = new LRUCache({ maxSize: 3, enableStats: true });
    });

    describe('基本操作', () => {
        it('应该设置和获取值', () => {
            cache.set('key1', 'value1');
            expect(cache.get('key1')).to.equal('value1');
        });

        it('应该返回 undefined 当键不存在', () => {
            expect(cache.get('nonexistent')).to.be.undefined;
        });

        it('应该正确报告缓存大小', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            expect(cache.size).to.equal(2);
        });

        it('应该检查键是否存在', () => {
            cache.set('key1', 'value1');
            expect(cache.has('key1')).to.be.true;
            expect(cache.has('key2')).to.be.false;
        });

        it('应该删除指定键', () => {
            cache.set('key1', 'value1');
            cache.delete('key1');
            expect(cache.has('key1')).to.be.false;
        });

        it('应该清空所有缓存', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.clear();
            expect(cache.size).to.equal(0);
        });
    });

    describe('LRU 策略', () => {
        it('应该在超过容量时删除最旧的项', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // 超过容量（maxSize=3），添加第4个
            cache.set('key4', 'value4');

            // key1 应该被删除（最旧）
            expect(cache.has('key1')).to.be.false;
            expect(cache.has('key2')).to.be.true;
            expect(cache.has('key3')).to.be.true;
            expect(cache.has('key4')).to.be.true;
        });

        it('应该更新最近使用的项', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // 访问 key1，使其变为最近使用
            cache.get('key1');

            // 添加 key4，key2 应该被删除（最旧）
            cache.set('key4', 'value4');

            expect(cache.has('key1')).to.be.true;  // 被访问过，保留
            expect(cache.has('key2')).to.be.false; // 最旧，删除
            expect(cache.has('key3')).to.be.true;
            expect(cache.has('key4')).to.be.true;
        });

        it('应该在更新现有键时保持 LRU 顺序', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');

            // 更新 key1
            cache.set('key1', 'updated');

            // 添加 key4，key2 应该被删除
            cache.set('key4', 'value4');

            expect(cache.has('key1')).to.be.true;
            expect(cache.has('key2')).to.be.false;
            expect(cache.get('key1')).to.equal('updated');
        });
    });

    describe('统计功能', () => {
        it('应该正确统计命中和未命中', () => {
            cache.set('key1', 'value1');

            cache.get('key1'); // 命中
            cache.get('key2'); // 未命中
            cache.get('key1'); // 命中
            cache.get('key3'); // 未命中

            const stats = cache.getStats();
            expect(stats.hits).to.equal(2);
            expect(stats.misses).to.equal(2);
            expect(stats.hitRate).to.equal('50.00%');
        });

        it('应该统计驱逐次数', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
            cache.set('key4', 'value4'); // 驱逐 key1
            cache.set('key5', 'value5'); // 驱逐 key2

            const stats = cache.getStats();
            expect(stats.evictions).to.equal(2);
        });

        it('应该计算缓存效率', () => {
            // 高命中率
            cache.set('key1', 'value1');
            for (let i = 0; i < 10; i++) {
                cache.get('key1');
            }
            cache.get('nonexistent');

            const stats = cache.getStats();
            expect(stats.efficiency).to.equal('优秀');
        });

        it('应该能重置统计', () => {
            cache.set('key1', 'value1');
            cache.get('key1');

            cache.resetStats();

            const stats = cache.getStats();
            expect(stats.hits).to.equal(0);
            expect(stats.misses).to.equal(0);
        });
    });

    describe('边界情况', () => {
        it('应该处理 maxSize=1', () => {
            const smallCache = new LRUCache({ maxSize: 1 });

            smallCache.set('key1', 'value1');
            smallCache.set('key2', 'value2');

            expect(smallCache.size).to.equal(1);
            expect(smallCache.has('key1')).to.be.false;
            expect(smallCache.has('key2')).to.be.true;
        });

        it('应该处理大量数据', () => {
            const largeCache = new LRUCache({ maxSize: 100 });

            // 添加 200 个项
            for (let i = 0; i < 200; i++) {
                largeCache.set(`key${i}`, `value${i}`);
            }

            // 只保留最后 100 个
            expect(largeCache.size).to.equal(100);
            expect(largeCache.has('key0')).to.be.false;
            expect(largeCache.has('key199')).to.be.true;
        });

        it('应该处理对象和数组值', () => {
            const objValue = { nested: { data: 'test' } };
            const arrValue = [1, 2, 3];

            cache.set('obj', objValue);
            cache.set('arr', arrValue);

            expect(cache.get('obj')).to.deep.equal(objValue);
            expect(cache.get('arr')).to.deep.equal(arrValue);
        });
    });

    describe('内存安全性', () => {
        it('应该防止无限增长', () => {
            // 添加远超容量的数据
            for (let i = 0; i < 1000; i++) {
                cache.set(`key${i}`, `value${i}`);
            }

            // 缓存大小应该被限制
            expect(cache.size).to.equal(3);
            expect(cache.size).to.be.at.most(cache.maxSize);
        });

        it('应该在清空后释放内存', () => {
            // 添加数据
            for (let i = 0; i < 100; i++) {
                cache.set(`key${i}`, { large: 'data'.repeat(1000) });
            }

            // 清空
            cache.clear();

            expect(cache.size).to.equal(0);
            expect(cache.keys().length).to.equal(0);
        });
    });

    describe('性能测试', () => {
        it('应该快速执行大量操作', () => {
            const start = Date.now();

            for (let i = 0; i < 10000; i++) {
                cache.set(`key${i % 100}`, `value${i}`);
                cache.get(`key${i % 50}`);
            }

            const duration = Date.now() - start;
            expect(duration).to.be.below(100); // 应该在 100ms 内完成
        });
    });
});
