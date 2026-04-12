/**
 * String 验证器测试（v1.0.2新增）
 * 
 * 测试新增的String类型验证器：
 * - length (精确长度)
 * - alphanum (字母和数字)
 * - trim (无前后空格)
 * - lowercase (小写)
 * - uppercase (大写)
 */

const { expect } = require('chai');
const { dsl, validate, DslBuilder } = require('../../../index');

describe('String Validators - v1.0.2', function() {

  describe('min() - 最小长度（AJV原生）', function() {
    it('应该验证最小长度', function() {
      const schema = dsl({ name: dsl('string!').min(3) });
      
      expect(validate(schema, { name: 'ab' }).valid).to.be.false;
      expect(validate(schema, { name: 'abc' }).valid).to.be.true;
      expect(validate(schema, { name: 'abcd' }).valid).to.be.true;
    });
  });

  describe('max() - 最大长度（AJV原生）', function() {
    it('应该验证最大长度', function() {
      const schema = dsl({ name: dsl('string!').max(10) });
      
      expect(validate(schema, { name: '12345678901' }).valid).to.be.false;
      expect(validate(schema, { name: '1234567890' }).valid).to.be.true;
      expect(validate(schema, { name: '123' }).valid).to.be.true;
    });
  });

  describe('length() - 精确长度', function() {
    it('应该验证精确长度', function() {
      const schema = dsl({ phone: dsl('string!').length(11) });
      
      expect(validate(schema, { phone: '1234567890' }).valid).to.be.false;
      expect(validate(schema, { phone: '12345678901' }).valid).to.be.true;
      expect(validate(schema, { phone: '123456789012' }).valid).to.be.false;
    });

    it('应该在错误消息中包含长度限制', function() {
      const schema = dsl({ code: dsl('string!').length(6) });
      const result = validate(schema, { code: '12345' });
      
      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.have.property('keyword', 'exactLength');
    });
  });

  describe('alphanum() - 字母和数字', function() {
    it('应该只接受字母和数字', function() {
      const schema = dsl({ code: dsl('string!').alphanum() });
      
      expect(validate(schema, { code: 'abc123' }).valid).to.be.true;
      expect(validate(schema, { code: 'ABC123' }).valid).to.be.true;
      expect(validate(schema, { code: 'abc' }).valid).to.be.true;
      expect(validate(schema, { code: '123' }).valid).to.be.true;
    });

    it('应该拒绝特殊字符', function() {
      const schema = dsl({ code: dsl('string!').alphanum() });
      
      expect(validate(schema, { code: 'abc-123' }).valid).to.be.false;
      expect(validate(schema, { code: 'abc_123' }).valid).to.be.false;
      expect(validate(schema, { code: 'abc 123' }).valid).to.be.false;
      expect(validate(schema, { code: 'abc@123' }).valid).to.be.false;
    });

    it('应该接受空字符串', function() {
      const schema = dsl({ code: dsl('string').alphanum() });
      expect(validate(schema, { code: '' }).valid).to.be.true;
    });
  });

  describe('trim() - 无前后空格', function() {
    it('应该拒绝包含前导空格的字符串', function() {
      const schema = dsl({ name: dsl('string!').trim() });
      
      expect(validate(schema, { name: ' hello' }).valid).to.be.false;
    });

    it('应该拒绝包含尾随空格的字符串', function() {
      const schema = dsl({ name: dsl('string!').trim() });
      
      expect(validate(schema, { name: 'hello ' }).valid).to.be.false;
    });

    it('应该拒绝包含前后空格的字符串', function() {
      const schema = dsl({ name: dsl('string!').trim() });
      
      expect(validate(schema, { name: ' hello ' }).valid).to.be.false;
    });

    it('应该接受已修剪的字符串', function() {
      const schema = dsl({ name: dsl('string!').trim() });
      
      expect(validate(schema, { name: 'hello' }).valid).to.be.true;
      expect(validate(schema, { name: 'hello world' }).valid).to.be.true; // 中间空格允许
    });
  });

  describe('lowercase() - 小写', function() {
    it('应该只接受小写字符串', function() {
      const schema = dsl({ code: dsl('string!').lowercase() });
      
      expect(validate(schema, { code: 'hello' }).valid).to.be.true;
      expect(validate(schema, { code: 'hello123' }).valid).to.be.true;
    });

    it('应该拒绝包含大写字母的字符串', function() {
      const schema = dsl({ code: dsl('string!').lowercase() });
      
      expect(validate(schema, { code: 'Hello' }).valid).to.be.false;
      expect(validate(schema, { code: 'HELLO' }).valid).to.be.false;
      expect(validate(schema, { code: 'HeLLo' }).valid).to.be.false;
    });

    it('应该接受没有字母的字符串', function() {
      const schema = dsl({ code: dsl('string!').lowercase() });
      
      expect(validate(schema, { code: '123' }).valid).to.be.true;
      expect(validate(schema, { code: '!@#' }).valid).to.be.true;
    });
  });

  describe('uppercase() - 大写', function() {
    it('应该只接受大写字符串', function() {
      const schema = dsl({ code: dsl('string!').uppercase() });
      
      expect(validate(schema, { code: 'HELLO' }).valid).to.be.true;
      expect(validate(schema, { code: 'HELLO123' }).valid).to.be.true;
    });

    it('应该拒绝包含小写字母的字符串', function() {
      const schema = dsl({ code: dsl('string!').uppercase() });
      
      expect(validate(schema, { code: 'Hello' }).valid).to.be.false;
      expect(validate(schema, { code: 'hello' }).valid).to.be.false;
      expect(validate(schema, { code: 'HeLLo' }).valid).to.be.false;
    });

    it('应该接受没有字母的字符串', function() {
      const schema = dsl({ code: dsl('string!').uppercase() });
      
      expect(validate(schema, { code: '123' }).valid).to.be.true;
      expect(validate(schema, { code: '!@#' }).valid).to.be.true;
    });
  });

  describe('链式调用', function() {
    it('应该支持多个验证器链式调用', function() {
      const schema = dsl({
        code: dsl('string!').length(6).alphanum().uppercase()
      });
      
      expect(validate(schema, { code: 'ABC123' }).valid).to.be.true;
      expect(validate(schema, { code: 'abc123' }).valid).to.be.false; // 不是大写
      expect(validate(schema, { code: 'ABC12' }).valid).to.be.false; // 长度不对
      expect(validate(schema, { code: 'ABC-12' }).valid).to.be.false; // 包含特殊字符
    });
  });
});

