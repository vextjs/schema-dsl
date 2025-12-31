/**
 * DslBuilder v1.0.2 扩展验证器测试
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('DslBuilder - v1.0.2 扩展验证器', () => {

  describe('新增类型 - DSL 语法', () => {
    it('应该支持 alphanum 类型', () => {
      const schema = dsl({ username: 'alphanum:3-20!' });
      expect(schema.properties.username.type).to.equal('string');
      expect(schema.properties.username.alphanum).to.be.true;
      expect(schema.properties.username.minLength).to.equal(3);
      expect(schema.properties.username.maxLength).to.equal(20);
    });

    it('应该支持 lower 类型', () => {
      const schema = dsl({ email: 'lower!' });
      expect(schema.properties.email.type).to.equal('string');
      expect(schema.properties.email.lowercase).to.be.true;
    });

    it('应该支持 upper 类型', () => {
      const schema = dsl({ country: 'upper:2!' });
      expect(schema.properties.country.type).to.equal('string');
      expect(schema.properties.country.uppercase).to.be.true;
      expect(schema.properties.country.exactLength).to.equal(2);
    });

    it('应该支持 json 类型', () => {
      const schema = dsl({ config: 'json!' });
      expect(schema.properties.config.type).to.equal('string');
      expect(schema.properties.config.jsonString).to.be.true;
    });

    it('应该支持 port 类型', () => {
      const schema = dsl({ port: 'port!' });
      expect(schema.properties.port.type).to.equal('integer');
      expect(schema.properties.port.port).to.be.true;
    });
  });

  describe('链式调用', () => {
    it('应该支持 .dateGreater() 链式调用', () => {
      const schema = dsl({ endDate: 'string!'.dateGreater('2025-01-01') });
      expect(schema.properties.endDate.dateGreater).to.equal('2025-01-01');
    });

    it('应该支持 .dateLess() 链式调用', () => {
      const schema = dsl({ startDate: 'string!'.dateLess('2025-12-31') });
      expect(schema.properties.startDate.dateLess).to.equal('2025-12-31');
    });

    it('应该支持多个方法链式调用', () => {
      const schema = dsl({
        username: 'alphanum:3-20!'.label('用户名')
      });
      expect(schema.properties.username.alphanum).to.be.true;
      expect(schema.properties.username.minLength).to.equal(3);
      expect(schema.properties.username.maxLength).to.equal(20);
    });
  });

  describe('验证功能', () => {
    it('alphanum 应该验证字母和数字', () => {
      const schema = dsl({ username: 'alphanum!' });
      expect(validate(schema, { username: 'user123' }).valid).to.be.true;
      expect(validate(schema, { username: 'user_123' }).valid).to.be.false;
    });

    it('lower 应该验证小写', () => {
      const schema = dsl({ email: 'lower!' });
      expect(validate(schema, { email: 'test@example.com' }).valid).to.be.true;
      expect(validate(schema, { email: 'Test@example.com' }).valid).to.be.false;
    });

    it('upper 应该验证大写', () => {
      const schema = dsl({ country: 'upper:2!' });
      expect(validate(schema, { country: 'CN' }).valid).to.be.true;
      expect(validate(schema, { country: 'cn' }).valid).to.be.false;
    });

    it('port 应该验证端口号', () => {
      const schema = dsl({ port: 'port!' });
      expect(validate(schema, { port: 3000 }).valid).to.be.true;
      expect(validate(schema, { port: 0 }).valid).to.be.false;
      expect(validate(schema, { port: 65536 }).valid).to.be.false;
    });
  });

  describe('组合使用', () => {
    it('应该支持 alphanum + 精确长度', () => {
      const schema = dsl({ code: 'alphanum:6!' });
      expect(schema.properties.code.alphanum).to.be.true;
      expect(schema.properties.code.exactLength).to.equal(6);

      expect(validate(schema, { code: 'ABC123' }).valid).to.be.true;
      expect(validate(schema, { code: 'ABC12' }).valid).to.be.false;
    });

    it('应该支持 alphanum + 链式调用', () => {
      const schema = dsl({
        username: 'alphanum:3-20!'.label('用户名')
      });
      expect(validate(schema, { username: 'user123' }).valid).to.be.true;
      expect(validate(schema, { username: 'user_123' }).valid).to.be.false;
    });
  });
});

