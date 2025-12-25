/**
 * DSL Match 语法测试
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../index');

describe('DSL Match 语法 (v2.1.0)', () => {

  describe('dsl.match', () => {
    it('应该支持基本的 match 语法', () => {
      const schema = dsl({
        type: 'string',
        value: dsl.match('type', {
          email: 'email!',
          phone: 'string:11!',
          _default: 'string'
        })
      });

      // Case 1: type=email
      expect(validate(schema, { type: 'email', value: 'test@example.com' }).valid).to.be.true;
      expect(validate(schema, { type: 'email', value: 'invalid-email' }).valid).to.be.false;

      // Case 2: type=phone
      expect(validate(schema, { type: 'phone', value: '13800138000' }).valid).to.be.true;
      expect(validate(schema, { type: 'phone', value: '123456789012' }).valid).to.be.false;

      // Case 3: default
      expect(validate(schema, { type: 'other', value: 'any string' }).valid).to.be.true;
    });

    it('应该支持非英文值（带引号）', () => {
      const schema = dsl({
        level: 'string',
        discount: dsl.match('level', {
          '普通用户': 'number:0-5',
          'VIP-1': 'number:0-20',
          '100': 'number:0-50'
        })
      });

      expect(validate(schema, { level: '普通用户', discount: 3 }).valid).to.be.true;
      expect(validate(schema, { level: '普通用户', discount: 10 }).valid).to.be.false;

      expect(validate(schema, { level: 'VIP-1', discount: 15 }).valid).to.be.true;
      expect(validate(schema, { level: '100', discount: 40 }).valid).to.be.true;
    });

    it('应该支持嵌套对象作为规则', () => {
      const schema = dsl({
        type: 'string',
        config: dsl.match('type', {
          db: {
            host: 'string!',
            port: 'number!'
          },
          api: {
            url: 'url!',
            token: 'string'
          }
        })
      });

      expect(validate(schema, {
        type: 'db',
        config: { host: 'localhost', port: 3306 }
      }).valid).to.be.true;

      expect(validate(schema, {
        type: 'api',
        config: { url: 'https://api.example.com' }
      }).valid).to.be.true;
    });
  });

  describe('dsl.if', () => {
    it('应该支持基本的 if 语法', () => {
      const schema = dsl({
        isVip: 'boolean',
        discount: dsl.if('isVip', 'number:0-50', 'number:0-10')
      });

      expect(validate(schema, { isVip: true, discount: 40 }).valid).to.be.true;
      expect(validate(schema, { isVip: false, discount: 40 }).valid).to.be.false;
      expect(validate(schema, { isVip: false, discount: 5 }).valid).to.be.true;
    });
  });

});

