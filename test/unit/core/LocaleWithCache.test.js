/**
 * Locale 语言包缓存测试
 * 验证语言包级别的缓存策略
 */

const { expect } = require('chai');
const LRUCache = require('../../../lib/utils/LRUCache');

describe('Locale Language Pack Caching', () => {
    let cache;

    beforeEach(() => {
        cache = new LRUCache({ maxSize: 5, enableStats: true });
    });

    describe('语言包级别缓存', () => {
        it('应该缓存完整的语言包对象', () => {
            const zhCN = {
                required: '必填字段',
                minLength: '长度不能少于{{min}}',
                email: '邮箱格式不正确'
            };

            cache.set('zh-CN', zhCN);
            const cached = cache.get('zh-CN');

            expect(cached).to.deep.equal(zhCN);
            expect(cached.required).to.equal('必填字段');
            expect(cached.minLength).to.equal('长度不能少于{{min}}');
        });

        it('一个语言只应该有一个缓存条目', () => {
            const locales = {
                'zh-CN': { required: '必填', email: '邮箱' },
                'en-US': { required: 'Required', email: 'Email' },
                'ja-JP': { required: '必須', email: 'メール' }
            };

            Object.entries(locales).forEach(([locale, pack]) => {
                cache.set(locale, pack);
            });

            expect(cache.size).to.equal(3);
            expect(cache.get('zh-CN').required).to.equal('必填');
            expect(cache.get('en-US').required).to.equal('Required');
        });

        it('应该正确统计语言包加载和命中', () => {
            const mockLoadLanguagePack = (locale) => {
                return {
                    required: `[${locale}] Required`,
                    email: `[${locale}] Email`
                };
            };

            // 首次加载 zh-CN
            let pack = cache.get('zh-CN');
            if (!pack) {
                pack = mockLoadLanguagePack('zh-CN');
                cache.set('zh-CN', pack);
            }

            // 第二次访问 zh-CN（命中）
            cache.get('zh-CN');

            // 首次加载 en-US
            let enPack = cache.get('en-US');
            if (!enPack) {
                enPack = mockLoadLanguagePack('en-US');
                cache.set('en-US', enPack);
            }

            const stats = cache.getStats();
            expect(stats.sets).to.equal(2);  // 加载了2个语言包
            expect(stats.hits).to.equal(1);   // zh-CN 命中1次
        });
    });

    describe('多语言场景', () => {
        it('应该自动驱逐最少使用的语言包', () => {
            // 添加5个语言包（达到上限）
            for (let i = 1; i <= 5; i++) {
                cache.set(`lang-${i}`, { required: `Required ${i}` });
            }

            expect(cache.size).to.equal(5);

            // 添加第6个语言包（触发驱逐）
            cache.set('lang-6', { required: 'Required 6' });

            expect(cache.size).to.equal(5);
            expect(cache.has('lang-1')).to.be.false;  // lang-1 被驱逐
            expect(cache.has('lang-6')).to.be.true;   // lang-6 成功缓存
        });

        it('应该保持热门语言在缓存中', () => {
            // 模拟实际使用：频繁访问 zh-CN 和 en-US
            const hotLocales = ['zh-CN', 'en-US'];
            const coldLocales = ['ja-JP', 'es-ES', 'fr-FR', 'ko-KR', 'de-DE', 'it-IT'];

            // 加载热门语言
            hotLocales.forEach(locale => {
                cache.set(locale, { required: `${locale} required` });
            });

            // 频繁访问热门语言（保持它们活跃）
            for (let i = 0; i < 10; i++) {
                cache.get('zh-CN');
                cache.get('en-US');
            }

            // 加载冷门语言（会驱逐其他冷门语言，但不会驱逐热门语言）
            coldLocales.forEach(locale => {
                cache.set(locale, { required: `${locale} required` });
                // 每次加载后再访问一次热门语言，保持其活跃
                cache.get('zh-CN');
                cache.get('en-US');
            });

            // 热门语言应该仍在缓存中
            expect(cache.has('zh-CN')).to.be.true;
            expect(cache.has('en-US')).to.be.true;
            expect(cache.size).to.equal(5);  // 缓存满员
        });
    });

    describe('并发场景', () => {
        it('应该处理并发的语言包加载', (done) => {
            const mockLoadLanguagePack = (locale) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve({
                            required: `[${locale}] Required`,
                            email: `[${locale}] Email`
                        });
                    }, 10);
                });
            };

            const getLanguagePack = async (locale) => {
                let pack = cache.get(locale);
                if (!pack) {
                    pack = await mockLoadLanguagePack(locale);
                    cache.set(locale, pack);
                }
                return pack;
            };

            // 模拟10个并发请求
            const locales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR'];
            const promises = [];

            for (let i = 0; i < 10; i++) {
                const locale = locales[i % locales.length];
                promises.push(getLanguagePack(locale));
            }

            Promise.all(promises).then(results => {
                expect(results.length).to.equal(10);
                expect(cache.size).to.equal(5);  // 只缓存了5种语言

                // 验证每个结果都是正确的语言包
                results.forEach((pack, idx) => {
                    const expectedLocale = locales[idx % locales.length];
                    expect(pack.required).to.equal(`[${expectedLocale}] Required`);
                });

                done();
            }).catch(done);
        });
    });

    describe('内存效率', () => {
        it('语言包缓存应该比消息缓存节省内存', () => {
            // 方案1：语言包级缓存（正确）
            const languagePackCache = new LRUCache({ maxSize: 5 });
            const locales = ['zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR'];

            locales.forEach(locale => {
                const pack = {};
                for (let i = 0; i < 50; i++) {  // 每个语言包50个错误类型
                    pack[`error_${i}`] = `[${locale}] Error message ${i}`;
                }
                languagePackCache.set(locale, pack);
            });

            expect(languagePackCache.size).to.equal(5);  // 5个缓存条目

            // 方案2：消息级缓存（错误）
            const messageCache = new LRUCache({ maxSize: 250 });

            locales.forEach(locale => {
                for (let i = 0; i < 50; i++) {
                    const key = `${locale}:error_${i}`;
                    messageCache.set(key, `[${locale}] Error message ${i}`);
                }
            });

            expect(messageCache.size).to.equal(250);  // 250个缓存条目（5语言×50消息）

            // 语言包级缓存更高效
            const efficiency = (languagePackCache.size / messageCache.size * 100).toFixed(1);
            console.log(`        缓存效率提升: ${efficiency}% (${languagePackCache.size} vs ${messageCache.size})`);
            expect(languagePackCache.size).to.be.lessThan(messageCache.size);
        });

        it('应该支持大量语言但只缓存常用的', () => {
            const cache = new LRUCache({ maxSize: 10, enableStats: true });

            // 模拟100种语言，但只缓存最近使用的10种
            for (let i = 1; i <= 100; i++) {
                cache.set(`lang-${i}`, {
                    required: `Lang ${i} Required`,
                    email: `Lang ${i} Email`
                });
            }

            expect(cache.size).to.equal(10);
            expect(cache.has('lang-91')).to.be.true;
            expect(cache.has('lang-100')).to.be.true;
            expect(cache.has('lang-1')).to.be.false;  // 早期的语言被驱逐

            const stats = cache.getStats();
            expect(stats.evictions).to.equal(90);  // 驱逐了90个语言包
        });
    });
});
