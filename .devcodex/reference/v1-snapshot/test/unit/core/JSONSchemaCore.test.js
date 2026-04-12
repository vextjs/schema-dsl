/**
 * JSONSchemaCore 单元测试
 */

const { expect } = require('chai');
const JSONSchemaCore = require('../../../lib/core/JSONSchemaCore');

describe('JSONSchemaCore', () => {
    describe('构造和规范化', () => {
        it('应该创建基本 Schema', () => {
            const core = new JSONSchemaCore();
            expect(core).to.be.instanceOf(JSONSchemaCore);
            expect(core.schema).to.have.property('$schema');
        });

        it('应该规范化输入 Schema', () => {
            const schema = { type: 'string', minLength: 3 };
            const core = new JSONSchemaCore(schema);
            expect(core.schema).to.deep.include(schema);
        });

        it('应该支持严格模式', () => {
            const core = new JSONSchemaCore({}, { strict: true });
            expect(core.options.strict).to.be.true;
        });

        it('应该支持不同 draft 版本', () => {
            const core = new JSONSchemaCore({}, { draft: 'draft-04' });
            expect(core.options.draft).to.equal('draft-04');
        });
    });

    describe('类型设置', () => {
        it('应该设置 Schema 类型', () => {
            const core = new JSONSchemaCore();
            core.setType('string');
            expect(core.schema.type).to.equal('string');
        });

        it('应该拒绝无效类型', () => {
            const core = new JSONSchemaCore();
            expect(() => core.setType('invalid')).to.throw();
        });

        it('应该支持链式调用', () => {
            const core = new JSONSchemaCore();
            const result = core.setType('string').setFormat('email');
            expect(result).to.equal(core);
        });
    });

    describe('属性管理', () => {
        it('应该设置单个属性', () => {
            const core = new JSONSchemaCore();
            core.setProperty('name', { type: 'string' });
            expect(core.schema.properties).to.have.property('name');
        });

        it('应该设置多个属性', () => {
            const core = new JSONSchemaCore();
            core.setProperties({
                name: { type: 'string' },
                age: { type: 'number' }
            });
            expect(core.schema.properties).to.have.all.keys('name', 'age');
        });

        it('应该设置必填字段', () => {
            const core = new JSONSchemaCore();
            core.setRequired(['name', 'email']);
            expect(core.schema.required).to.deep.equal(['name', 'email']);
        });
    });

    describe('格式和模式', () => {
        it('应该设置字符串格式', () => {
            const core = new JSONSchemaCore();
            core.setFormat('email');
            expect(core.schema.format).to.equal('email');
        });

        it('应该设置正则模式', () => {
            const core = new JSONSchemaCore();
            core.setPattern('^[0-9]+$');
            expect(core.schema.pattern).to.equal('^[0-9]+$');
        });
    });

    describe('数组和对象', () => {
        it('应该设置数组 items', () => {
            const core = new JSONSchemaCore();
            core.setItems({ type: 'string' });
            expect(core.schema.items).to.deep.equal({ type: 'string' });
        });

        it('应该获取 Schema 对象', () => {
            const schema = { type: 'object', properties: {} };
            const core = new JSONSchemaCore(schema);
            expect(core.getSchema()).to.deep.include(schema);
        });
    });
});
