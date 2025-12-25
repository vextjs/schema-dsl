/**
 * DslAdapter 测试
 *
 * 测试 DSL 语法解析功能
 */

const { expect } = require('chai');
const { DslAdapter } = require('../../../lib/adapters/DslAdapter');

describe('DslAdapter', () => {
  describe('parse() - 基本类型', () => {
    it('应该解析字符串类型', () => {
      const result = DslAdapter.parse('string');
      expect(result.type).to.equal('string');
    });

    it('应该解析数字类型', () => {
      const result = DslAdapter.parse('number');
      expect(result.type).to.equal('number');
    });

    it('应该解析布尔类型', () => {
      const result = DslAdapter.parse('boolean');
      expect(result.type).to.equal('boolean');
    });
  });

  describe('parse() - 约束条件', () => {
    it('应该解析字符串长度范围', () => {
      const result = DslAdapter.parse('string:3-32');
      expect(result).to.deep.include({
        type: 'string',
        minLength: 3,
        maxLength: 32
      });
    });

    it('应该解析数字范围', () => {
      const result = DslAdapter.parse('number:0-100');
      expect(result).to.deep.include({
        type: 'number',
        minimum: 0,
        maximum: 100
      });
    });

    it('应该解析最大长度', () => {
      const result = DslAdapter.parse('string:100');
      expect(result).to.deep.include({
        type: 'string',
        maxLength: 100
      });
    });
  });

  describe('parse() - 必填标记', () => {
    it('应该识别必填标记', () => {
      const result = DslAdapter.parse('string:3-32!');
      expect(result._required).to.be.true;
    });

    it('应该处理可选字段', () => {
      const result = DslAdapter.parse('string:3-32');
      expect(result._required).to.be.false;
    });
  });

  describe('parse() - 格式类型', () => {
    it('应该解析 email 格式', () => {
      const result = DslAdapter.parse('email');
      expect(result).to.deep.include({
        type: 'string',
        format: 'email'
      });
    });

    it('应该解析 url 格式', () => {
      const result = DslAdapter.parse('url');
      expect(result).to.deep.include({
        type: 'string',
        format: 'uri'
      });
    });

    it('应该解析 uuid 格式', () => {
      const result = DslAdapter.parse('uuid');
      expect(result).to.deep.include({
        type: 'string',
        format: 'uuid'
      });
    });

    it('应该解析 date 格式', () => {
      const result = DslAdapter.parse('date');
      expect(result).to.deep.include({
        type: 'string',
        format: 'date-time'
      });
    });
  });

  describe('parse() - 枚举值', () => {
    it('应该解析枚举值', () => {
      const result = DslAdapter.parse('active|inactive|pending');
      expect(result).to.deep.include({
        type: 'string',
        enum: ['active', 'inactive', 'pending']
      });
    });

    it('应该处理枚举值的空格', () => {
      const result = DslAdapter.parse('a | b | c');
      expect(result.enum).to.deep.equal(['a', 'b', 'c']);
    });
  });

  describe('parse() - 数组类型', () => {
    it('应该解析简单数组', () => {
      const result = DslAdapter.parse('array<string>');
      expect(result.type).to.equal('array');
      expect(result.items).to.deep.equal({ type: 'string' });
    });

    it('应该解析带约束的数组', () => {
      const result = DslAdapter.parse('array<string:1-20>');
      expect(result.type).to.equal('array');
      expect(result.items).to.deep.include({
        type: 'string',
        minLength: 1,
        maxLength: 20
      });
    });

    it('应该解析数字数组', () => {
      const result = DslAdapter.parse('array<number:0-100>');
      expect(result.type).to.equal('array');
      expect(result.items).to.deep.include({
        type: 'number',
        minimum: 0,
        maximum: 100
      });
    });
  });

  describe('parseObject() - 对象Schema', () => {
    it('应该解析简单对象', () => {
      const result = DslAdapter.parseObject({
        name: 'string!',
        age: 'number'
      });

      expect(result.type).to.equal('object');
      expect(result.properties.name).to.deep.equal({ type: 'string' });
      expect(result.properties.age).to.deep.equal({ type: 'number' });
      expect(result.required).to.deep.equal(['name']);
    });

    it('应该解析复杂对象', () => {
      const result = DslAdapter.parseObject({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120',
        status: 'active|inactive'
      });

      expect(result.properties.username).to.deep.include({
        type: 'string',
        minLength: 3,
        maxLength: 32
      });
      expect(result.properties.email).to.deep.include({
        type: 'string',
        format: 'email'
      });
      expect(result.properties.status.enum).to.deep.equal(['active', 'inactive']);
      expect(result.required).to.deep.equal(['username', 'email']);
    });

    it('应该解析嵌套对象', () => {
      const result = DslAdapter.parseObject({
        user: {
          name: 'string!',
          profile: {
            bio: 'string:500',
            website: 'url'
          }
        }
      });

      expect(result.properties.user.type).to.equal('object');
      expect(result.properties.user.properties.name).to.deep.equal({ type: 'string' });
      expect(result.properties.user.properties.profile.type).to.equal('object');
    });

    it('应该清理 _required 标记', () => {
      const result = DslAdapter.parseObject({
        name: 'string!',
        age: 'number'
      });

      // _required 标记应该被清理
      expect(result.properties.name).to.not.have.property('_required');
      expect(result.properties.age).to.not.have.property('_required');
    });
  });

  describe('类型别名', () => {
    it('应该支持 s 别名（string）', () => {
      const result = DslAdapter.parse('s:3-32');
      expect(result.type).to.equal('string');
    });

    it('应该支持 n 别名（number）', () => {
      const result = DslAdapter.parse('n:0-100');
      expect(result.type).to.equal('number');
    });

    it('应该支持 b 别名（boolean）', () => {
      const result = DslAdapter.parse('b');
      expect(result.type).to.equal('boolean');
    });
  });

  describe('边界情况', () => {
    it('应该处理空字符串', () => {
      expect(() => DslAdapter.parse('')).to.throw();
    });

    it('应该处理无效输入', () => {
      expect(() => DslAdapter.parse(null)).to.throw();
      expect(() => DslAdapter.parse(123)).to.throw();
    });

    it('应该处理空对象', () => {
      const result = DslAdapter.parseObject({});
      expect(result.type).to.equal('object');
      expect(result.properties).to.deep.equal({});
    });
  });

  describe('toCore()', () => {
    it('应该转换为 JSONSchemaCore 实例', () => {
      const core = DslAdapter.toCore('string:3-32!');
      expect(core).to.have.property('schema');
      expect(core.schema).to.deep.include({
        type: 'string',
        minLength: 3,
        maxLength: 32
      });
    });

    it('应该转换对象为 JSONSchemaCore', () => {
      const core = DslAdapter.toCore({
        name: 'string!',
        age: 'number'
      });
      expect(core.schema.type).to.equal('object');
    });
  });
});

