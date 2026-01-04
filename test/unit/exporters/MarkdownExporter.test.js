/**
 * MarkdownExporter 单元测试
 */

const { expect } = require('chai');
const MarkdownExporter = require('../../../lib/exporters/MarkdownExporter');

describe('MarkdownExporter', () => {
    describe('基础导出', () => {
        it('应该导出简单 Schema', () => {
            const schema = {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                },
                required: ['name']
            };
            const result = MarkdownExporter.export(schema);
            expect(result).to.be.a('string');
            expect(result.length).to.be.greaterThan(0);
        });

        it('应该支持自定义标题', () => {
            const schema = { type: 'object', properties: {} };
            const result = MarkdownExporter.export(schema, { title: '用户 Schema' });
            expect(result).to.include('用户 Schema');
        });

        it('应该支持描述', () => {
            const schema = {
                type: 'object',
                description: '用户对象',
                properties: {}
            };
            const result = MarkdownExporter.export(schema);
            expect(result).to.include('用户对象');
        });
    });
});
