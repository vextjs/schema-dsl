/**
 * ErrorCodes 单元测试
 */

const { expect } = require('chai');
const ErrorCodes = require('../../../lib/core/ErrorCodes');

describe('ErrorCodes', () => {
    describe('错误代码查询', () => {
        it('应该获取错误信息', () => {
            const info = ErrorCodes.getErrorInfo('required');
            expect(info).to.be.an('object');
        });

        it('应该获取所有错误代码', () => {
            const codes = ErrorCodes.getAllErrorCodes();
            expect(codes).to.be.an('object');
            expect(Object.keys(codes).length).to.be.greaterThan(0);
        });
    });
});
