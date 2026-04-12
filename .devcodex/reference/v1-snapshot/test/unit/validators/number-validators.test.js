/**
 * Number 验证器测试（v1.0.2新增）
 *
 * 测试新增的Number类型验证器：
 * - precision (小数位数)
 * - multiple (倍数，AJV原生multipleOf)
 * - port (端口号)
 */

const { expect } = require('chai');
const { dsl, validate, DslBuilder } = require('../../../index');

describe('Number Validators - v1.0.2', function() {

  describe('precision() - 小数位数', function() {
    it('应该验证小数位数', function() {
      const schema = dsl({ price: dsl('number!').precision(2) });

      expect(validate(schema, { price: 10.99 }).valid).to.be.true;
      expect(validate(schema, { price: 10.9 }).valid).to.be.true;
      expect(validate(schema, { price: 10 }).valid).to.be.true;
    });

    it('应该拒绝超过限制的小数位数', function() {
      const schema = dsl({ price: dsl('number!').precision(2) });

      expect(validate(schema, { price: 10.999 }).valid).to.be.false;
      expect(validate(schema, { price: 10.12345 }).valid).to.be.false;
    });

    it('应该在错误消息中包含精度限制', function() {
      const schema = dsl({ price: dsl('number!').precision(2) });
      const result = validate(schema, { price: 10.999 });

      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.have.property('keyword', 'precision');
    });
  });

  describe('multiple() - 倍数（AJV原生multipleOf）', function() {
    it('应该验证倍数关系', function() {
      const schema = dsl({ count: dsl('number!').multiple(5) });

      expect(validate(schema, { count: 5 }).valid).to.be.true;
      expect(validate(schema, { count: 10 }).valid).to.be.true;
      expect(validate(schema, { count: 15 }).valid).to.be.true;
    });

    it('应该拒绝非倍数', function() {
      const schema = dsl({ count: dsl('number!').multiple(5) });

      expect(validate(schema, { count: 3 }).valid).to.be.false;
      expect(validate(schema, { count: 7 }).valid).to.be.false;
      expect(validate(schema, { count: 12 }).valid).to.be.false;
    });

    it('应该支持小数倍数', function() {
      const schema = dsl({ value: dsl('number!').multiple(0.5) });

      expect(validate(schema, { value: 1.5 }).valid).to.be.true;
      expect(validate(schema, { value: 2.0 }).valid).to.be.true;
      expect(validate(schema, { value: 2.5 }).valid).to.be.true;
      expect(validate(schema, { value: 1.3 }).valid).to.be.false;
    });
  });

  describe('port() - 端口号', function() {
    it('应该接受有效的端口号', function() {
      const schema = dsl({ port: dsl('integer!').port() });

      expect(validate(schema, { port: 1 }).valid).to.be.true;
      expect(validate(schema, { port: 80 }).valid).to.be.true;
      expect(validate(schema, { port: 443 }).valid).to.be.true;
      expect(validate(schema, { port: 8080 }).valid).to.be.true;
      expect(validate(schema, { port: 65535 }).valid).to.be.true;
    });

    it('应该拒绝超出范围的端口号', function() {
      const schema = dsl({ port: dsl('integer!').port() });

      expect(validate(schema, { port: 0 }).valid).to.be.false;
      expect(validate(schema, { port: -1 }).valid).to.be.false;
      expect(validate(schema, { port: 65536 }).valid).to.be.false;
      expect(validate(schema, { port: 100000 }).valid).to.be.false;
    });

    it('应该拒绝非整数端口号', function() {
      const schema = dsl({ port: dsl('number!').port() });

      expect(validate(schema, { port: 80.5 }).valid).to.be.false;
      expect(validate(schema, { port: 443.9 }).valid).to.be.false;
    });

    it('应该在错误消息中指出是端口验证', function() {
      const schema = dsl({ port: dsl('integer!').port() });
      const result = validate(schema, { port: 70000 });

      expect(result.valid).to.be.false;
      expect(result.errors[0]).to.have.property('keyword', 'port');
    });
  });

  describe('链式调用', function() {
    it('应该支持多个验证器链式调用', function() {
      const schema = dsl({
        percentage: dsl('number!').multiple(0.01).precision(2)
      });

      expect(validate(schema, { percentage: 12.34 }).valid).to.be.true;
      expect(validate(schema, { percentage: 12.345 }).valid).to.be.false; // 精度超限
      expect(validate(schema, { percentage: 12.35 }).valid).to.be.true;
    });
  });
});

