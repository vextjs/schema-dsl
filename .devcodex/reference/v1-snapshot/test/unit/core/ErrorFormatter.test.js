/**
 * ErrorFormatter 单元测试
 */

const { expect } = require('chai');
const ErrorFormatter = require('../../../lib/core/ErrorFormatter');
const Locale = require('../../../lib/core/Locale');

describe('ErrorFormatter', () => {
    let formatter;

    beforeEach(() => {
        formatter = new ErrorFormatter('zh-CN');
        Locale.reset();
    });

    describe('基础功能', () => {
        it('应该正确创建实例', () => {
            expect(formatter).to.be.instanceOf(ErrorFormatter);
            expect(formatter.locale).to.equal('zh-CN');
        });

        it('应该支持不同语言', () => {
            const enFormatter = new ErrorFormatter('en-US');
            expect(enFormatter.locale).to.equal('en-US');
        });
    });

    describe('错误格式化', () => {
        it('应该格式化简单错误', () => {
            const error = { type: 'required', path: 'username' };
            const result = formatter.format(error);
            expect(result).to.be.a('string');
        });

        it('应该处理详细错误', () => {
            const errors = [{
                keyword: 'required',
                instancePath: '',
                params: { missingProperty: 'username' }
            }];
            const result = formatter.formatDetailed(errors);
            expect(result).to.be.an('array');
            expect(result[0]).to.have.property('path');
            expect(result[0]).to.have.property('message');
        });

        it('应该支持自定义 label', () => {
            const error = {
                keyword: 'required',
                instancePath: '',
                params: { missingProperty: 'username' },
                parentSchema: {
                    properties: { username: { _label: '用户名' } }
                }
            };
            const result = formatter.formatDetailed([error]);
            expect(result[0].message).to.include('用户名');
        });
    });

    describe('国际化', () => {
        it('应该支持动态切换语言', () => {
            const error = { type: 'required', path: 'username' };
            const zhResult = formatter.format(error, 'zh-CN');
            const enResult = formatter.format(error, 'en-US');
            expect(zhResult).to.not.equal(enResult);
        });
    });

    describe('自定义消息', () => {
        it('应该支持自定义消息模板', () => {
            const error = {
                keyword: 'pattern',
                instancePath: '/phone',
                parentSchema: {
                    _customMessages: { 'pattern': '手机号格式不正确' }
                }
            };
            const result = formatter.formatDetailed([error]);
            expect(result[0].message).to.equal('手机号格式不正确');
        });
    });
});
