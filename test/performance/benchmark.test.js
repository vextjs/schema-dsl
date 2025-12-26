/**
 * 性能基准测试
 * 
 * @description 建立性能基线，监控性能回归
 * 
 * 性能目标：
 * - 简单Schema验证：< 0.1ms/次
 * - 复杂Schema验证：< 1ms/次
 * - Schema编译：< 10ms
 * - 批量验证（1000条）：< 100ms
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../index.js');

describe('Performance Benchmarks', () => {

    describe('Schema编译性能', () => {
        it('简单Schema编译应该很快', () => {
            const start = Date.now();

            const schema = dsl({
                name: 'string!',
                age: 'number'
            });

            const duration = Date.now() - start;

            // 编译应该在10ms内完成
            expect(duration).to.be.lessThan(10);
            console.log(`      简单Schema编译: ${duration}ms`);
        });

        it('复杂Schema编译应该在合理时间内完成', () => {
            const start = Date.now();

            const schema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                phone: 'string',
                age: 'number:18-100',
                gender: 'enum:male,female,other',
                role: 'enum:admin,user,guest!',
                profile: {
                    firstName: 'string:1-50!',
                    lastName: 'string:1-50!',
                    bio: 'string:0-500',
                    avatar: 'url',
                    website: 'url',
                    birthday: 'date',
                    location: {
                        country: 'string!',
                        city: 'string!',
                        address: 'string'
                    }
                },
                tags: 'array:0-10',
                settings: {
                    theme: 'enum:light,dark',
                    language: 'enum:zh-CN,en-US,ja-JP',
                    notifications: 'boolean'
                }
            });

            const duration = Date.now() - start;

            // 复杂Schema编译应该在50ms内完成
            expect(duration).to.be.lessThan(50);
            console.log(`      复杂Schema编译: ${duration}ms`);
        });
    });

    describe('基础类型验证性能', () => {
        it('字符串验证基准', () => {
            const schema = dsl({ name: 'string:1-100!' });
            const testData = { name: 'John Doe' };

            const iterations = 10000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.1);
            console.log(`      字符串验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('数字验证基准', () => {
            const schema = dsl({ age: 'number:0-150!' });
            const testData = { age: 25 };

            const iterations = 10000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.1);
            console.log(`      数字验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('布尔验证基准', () => {
            const schema = dsl({ active: 'boolean!' });
            const testData = { active: true };

            const iterations = 10000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.1);
            console.log(`      布尔验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('枚举验证基准', () => {
            const schema = dsl({ role: 'enum:admin,user,guest!' });
            const testData = { role: 'user' };

            const iterations = 10000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.1);
            console.log(`      枚举验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });
    });

    describe('格式验证性能', () => {
        it('email格式验证基准', () => {
            const schema = dsl({ email: 'email!' });
            const testData = { email: 'test@example.com' };

            const iterations = 5000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.2);
            console.log(`      email验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('url格式验证基准', () => {
            const schema = dsl({ website: 'url!' });
            const testData = { website: 'https://example.com' };

            const iterations = 5000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.2);
            console.log(`      url验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('uuid格式验证基准', () => {
            const schema = dsl({ id: 'uuid!' });
            const testData = { id: '550e8400-e29b-41d4-a716-446655440000' };

            const iterations = 5000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.2);
            console.log(`      uuid验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('date格式验证基准', () => {
            const schema = dsl({ createdAt: 'date!' });
            const testData = { createdAt: '2025-12-26' };

            const iterations = 5000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.2);
            console.log(`      date验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });
    });

    describe('复杂Schema验证性能', () => {
        it('嵌套对象验证基准', () => {
            const schema = dsl({
                user: {
                    name: 'string!',
                    email: 'email!',
                    profile: {
                        age: 'number',
                        bio: 'string'
                    }
                }
            });

            const testData = {
                user: {
                    name: 'John',
                    email: 'john@example.com',
                    profile: {
                        age: 30,
                        bio: 'Hello'
                    }
                }
            };

            const iterations = 2000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.5);
            console.log(`      嵌套对象验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('数组验证基准', () => {
            const schema = dsl({
                tags: 'array!1-10',
                items: 'array'
            });

            const testData = {
                tags: ['tag1', 'tag2', 'tag3'],
                items: [1, 2, 3, 4, 5]
            };

            const iterations = 2000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(0.5);
            console.log(`      数组验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });

        it('综合复杂Schema验证基准', () => {
            const schema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                phone: 'string',
                age: 'number:18-100',
                role: 'enum:admin,user,guest!',
                profile: {
                    firstName: 'string!',
                    lastName: 'string!',
                    bio: 'string:0-500',
                    avatar: 'url'
                },
                tags: 'array:0-10',
                settings: {
                    theme: 'enum:light,dark',
                    notifications: 'boolean'
                }
            });

            const testData = {
                username: 'testuser',
                email: 'test@example.com',
                phone: '13800138000',
                age: 25,
                role: 'user',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                    bio: 'Hello world',
                    avatar: 'https://example.com/avatar.png'
                },
                tags: ['tag1', 'tag2'],
                settings: {
                    theme: 'light',
                    notifications: true
                }
            };

            const iterations = 1000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, testData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(1);
            console.log(`      复杂Schema验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });
    });

    describe('批量验证性能', () => {
        it('批量简单数据验证', () => {
            const schema = dsl({
                name: 'string!',
                age: 'number'
            });

            const testData = Array(1000).fill(null).map((_, i) => ({
                name: `User${i}`,
                age: 20 + (i % 50)
            }));

            const start = Date.now();
            testData.forEach(data => validate(schema, data));
            const duration = Date.now() - start;

            expect(duration).to.be.lessThan(100);
            console.log(`      批量简单验证: 1000条 ${duration}ms，平均${(duration / 1000).toFixed(4)}ms/条`);
        });

        it('批量复杂数据验证', () => {
            const schema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                age: 'number:18-100',
                role: 'enum:admin,user,guest!'
            });

            const testData = Array(500).fill(null).map((_, i) => ({
                username: `user${i}`,
                email: `user${i}@example.com`,
                age: 20 + (i % 50),
                role: ['admin', 'user', 'guest'][i % 3]
            }));

            const start = Date.now();
            testData.forEach(data => validate(schema, data));
            const duration = Date.now() - start;

            expect(duration).to.be.lessThan(500);
            console.log(`      批量复杂验证: 500条 ${duration}ms，平均${(duration / 500).toFixed(4)}ms/条`);
        });
    });

    describe('错误场景性能', () => {
        it('验证失败应该和成功一样快', () => {
            const schema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                age: 'number:18-100!'
            });

            const validData = {
                username: 'testuser',
                email: 'test@example.com',
                age: 25
            };

            const invalidData = {
                username: 'ab',  // 太短
                email: 'invalid',  // 无效邮箱
                age: 200  // 超出范围
            };

            const iterations = 1000;

            // 测试成功场景
            const startValid = Date.now();
            for (let i = 0; i < iterations; i++) {
                validate(schema, validData);
            }
            const durationValid = Date.now() - startValid;

            // 测试失败场景
            const startInvalid = Date.now();
            for (let i = 0; i < iterations; i++) {
                validate(schema, invalidData);
            }
            const durationInvalid = Date.now() - startInvalid;

            // 失败场景会慢一些（需要格式化错误消息），容差10倍内
            expect(durationInvalid).to.be.lessThan(durationValid * 10);

            console.log(`      验证成功: ${iterations}次 ${durationValid}ms，平均${(durationValid / iterations).toFixed(4)}ms/次`);
            console.log(`      验证失败: ${iterations}次 ${durationInvalid}ms，平均${(durationInvalid / iterations).toFixed(4)}ms/次`);
        });

        it('多个错误的性能', () => {
            const schema = dsl({
                field1: 'string!',
                field2: 'string!',
                field3: 'string!',
                field4: 'string!',
                field5: 'string!'
            });

            const invalidData = {}; // 缺少所有必填字段

            const iterations = 1000;
            const start = Date.now();

            for (let i = 0; i < iterations; i++) {
                validate(schema, invalidData);
            }

            const duration = Date.now() - start;
            const average = duration / iterations;

            expect(average).to.be.lessThan(1);
            console.log(`      多错误验证: ${iterations}次 ${duration}ms，平均${average.toFixed(4)}ms/次`);
        });
    });

    describe('内存使用', () => {
        it('大量验证不应导致内存泄漏', () => {
            const schema = dsl({
                name: 'string!',
                email: 'email!'
            });

            const testData = {
                name: 'Test User',
                email: 'test@example.com'
            };

            // 记录初始内存
            if (global.gc) global.gc();
            const memBefore = process.memoryUsage().heapUsed;

            // 执行大量验证
            for (let i = 0; i < 10000; i++) {
                validate(schema, testData);
            }

            // 记录结束内存
            if (global.gc) global.gc();
            const memAfter = process.memoryUsage().heapUsed;

            const memIncrease = (memAfter - memBefore) / 1024 / 1024;

            // 内存增长应该小于10MB
            expect(memIncrease).to.be.lessThan(10);
            console.log(`      内存使用: 10000次验证，内存增长 ${memIncrease.toFixed(2)}MB`);
        });
    });

    describe('性能回归检测', () => {
        it('性能基线记录', () => {
            const results = [];

            // 测试1: 简单验证
            const simpleSchema = dsl({ name: 'string!' });
            let start = Date.now();
            for (let i = 0; i < 5000; i++) {
                validate(simpleSchema, { name: 'test' });
            }
            results.push({ name: '简单验证(5000次)', duration: Date.now() - start });

            // 测试2: 格式验证
            const formatSchema = dsl({ email: 'email!' });
            start = Date.now();
            for (let i = 0; i < 2000; i++) {
                validate(formatSchema, { email: 'test@example.com' });
            }
            results.push({ name: 'email验证(2000次)', duration: Date.now() - start });

            // 测试3: 复杂验证
            const complexSchema = dsl({
                username: 'string:3-32!',
                email: 'email!',
                profile: { age: 'number', bio: 'string' }
            });
            start = Date.now();
            for (let i = 0; i < 1000; i++) {
                validate(complexSchema, {
                    username: 'test',
                    email: 'test@example.com',
                    profile: { age: 25, bio: 'Hello' }
                });
            }
            results.push({ name: '复杂验证(1000次)', duration: Date.now() - start });

            console.log('\n      性能基线 (v2.1.2):');
            results.forEach(r => {
                console.log(`        - ${r.name}: ${r.duration}ms`);
            });

            // 所有测试应该在合理时间内完成
            results.forEach(r => {
                expect(r.duration).to.be.lessThan(500);
            });
        });
    });
});

/**
 * 性能监控建议：
 * 
 * 1. 定期运行基准测试：
 *    - 每次发布前运行
 *    - 记录性能基线
 *    - 对比历史数据
 * 
 * 2. 性能预算：
 *    - 简单验证：< 0.1ms/次
 *    - 格式验证：< 0.2ms/次
 *    - 复杂验证：< 1ms/次
 *    - 批量验证：< 0.1ms/条
 * 
 * 3. 性能优化方向：
 *    - 使用Schema缓存
 *    - 避免重复编译
 *    - 优化正则表达式
 *    - 减少对象创建
 * 
 * 4. 生产环境监控：
 *    - 记录验证耗时
 *    - 设置性能告警
 *    - 定期分析慢查询
 * 
 * 5. 性能测试命令：
 *    npm run test:performance
 *    或
 *    npx mocha test/performance/benchmark.test.js --timeout 10000
 */
