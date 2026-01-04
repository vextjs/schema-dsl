// test/unit/error-message-filter.test.js
const { expect } = require('chai');
const { dsl, validate } = require('../../index');

describe('错误消息过滤优化 (v1.0.7)', () => {
    describe('去除冗余的 if-then 包装错误', () => {
        it('应该只显示具体的字段错误，不显示重复的 "must match then schema"', () => {
            const schema = dsl({
                payment_type: 'string',
                enabled: 'boolean',
                credit_price: dsl.if('enabled',
                    dsl.match('payment_type', {
                        'credit': dsl('integer:1-10000!').label('Credit price'),
                        '_default': 'integer:1-10000'
                    }),
                    'integer:1-10000'
                )
            });

            // 缺少必填字段
            const result = validate(schema, {
                payment_type: 'credit',
                enabled: true
                // credit_price 缺失
            });

            expect(result.valid).to.be.false;
            expect(result.errors).to.have.lengthOf(1); // 只有一个错误
            expect(result.errors[0].message).to.include('Credit price');
            // 中文消息是"不能为空"，英文是"is required"
            const msg = result.errors[0].message;
            expect(msg.includes('required') || msg.includes('不能为空')).to.be.true;
            // 不应该包含 "must match then schema"
            expect(result.errors[0].message).to.not.include('must match');
        });

        it('应该过滤掉多层嵌套产生的重复 if 错误', () => {
            const schema = dsl({
                level1: 'boolean',
                level2: 'boolean',
                value: dsl.if('level1',
                    dsl.if('level2',
                        'integer:1-10!',
                        'integer:11-20!'
                    ),
                    'integer:21-30!'
                )
            });

            const result = validate(schema, {
                level1: true,
                level2: true,
                value: 100 // 超出所有范围
            });

            expect(result.valid).to.be.false;
            // 应该只有一个具体的范围错误，没有 if 包装错误
            expect(result.errors.length).to.be.at.most(2);

            // 所有错误都应该是具体的，不应该有 keyword='if' 的错误
            const hasIfError = result.errors.some(err => err.keyword === 'if');
            expect(hasIfError).to.be.false;
        });

        it('类型错误时也不应该显示 if 包装错误', () => {
            // 简单的场景：直接测试If中的类型错误
            const schema = dsl({
                flag: 'boolean!',
                value: dsl.if('flag',
                    'integer!',  // then
                    'string!'    // else
                )
            });

            const result = validate(schema, {
                flag: true,
                value: 'not a number' // 类型错误：应该是integer
            });

            expect(result.valid).to.be.false;
            expect(result.errors.length).to.be.at.least(1);

            // 应该有type类型错误
            const hasTypeError = result.errors.some(err => err.keyword === 'type');
            expect(hasTypeError).to.be.true;

            // 不应该有 if 关键字的错误（因为有具体的类型错误）
            const hasIfError = result.errors.some(err => err.keyword === 'if');
            expect(hasIfError).to.be.false;
        });

        it('当只有 if 错误时，应该显示类型错误', () => {
            const schema = dsl({
                flag: 'boolean',
                value: dsl.if('flag', 'string', 'integer')
            });

            const result = validate(schema, {
                flag: 'invalid',  // 类型错误
                value: [] // 也是类型错误
            });

            expect(result.valid).to.be.false;
            // 应该有具体的类型错误
            expect(result.errors.length).to.be.greaterThan(0);

            // 应该有flag字段的错误
            const hasFlagError = result.errors.some(err => err.path === 'flag');
            expect(hasFlagError).to.be.true;

            // 不应该有 if 关键字的错误
            const hasIfError = result.errors.some(err => err.keyword === 'if');
            expect(hasIfError).to.be.false;
        });

        it('多个字段错误时，应该全部显示，不显示 if 错误', () => {
            const schema = dsl({
                enabled: 'boolean',
                name: dsl.if('enabled', 'string:3-10!', 'string'),
                age: dsl.if('enabled', 'integer:18-100!', 'integer')
            });

            const result = validate(schema, {
                enabled: true,
                name: 'ab', // 长度不足
                age: 15 // 年龄不足
            });

            expect(result.valid).to.be.false;
            expect(result.errors.length).to.equal(2); // name 和 age 两个错误

            // 不应该有 if 关键字的错误
            const ifErrors = result.errors.filter(err => err.keyword === 'if');
            expect(ifErrors).to.have.lengthOf(0);
        });
    });
});
