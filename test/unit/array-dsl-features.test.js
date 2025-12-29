/**
 * SchemaIO v2.0.1 新功能测试
 */

const { expect } = require('chai');
const { dsl, validate, SchemaUtils, Validator, DslBuilder } = require('../../index');

describe('v2.0.1 新功能测试', () => {

  // ========== 1. 数组DSL语法 ==========
  describe('数组DSL语法', () => {
    it('应该支持 array!1-10 语法', () => {
      const schema = dsl({ tags: 'array!1-10' });

      expect(schema.properties.tags.type).to.equal('array');
      expect(schema.properties.tags.minItems).to.equal(1);
      expect(schema.properties.tags.maxItems).to.equal(10);
      expect(schema.required).to.include('tags');
    });

    it('应该支持 array:1-10 语法（可选）', () => {
      const schema = dsl({ tags: 'array:1-10' });

      expect(schema.properties.tags.type).to.equal('array');
      expect(schema.properties.tags.minItems).to.equal(1);
      expect(schema.properties.tags.maxItems).to.equal(10);
      expect(schema.required || []).to.not.include('tags');
    });

    it('应该支持 array!1- 语法（只有最小值）', () => {
      const schema = dsl({ tags: 'array!1-' });

      expect(schema.properties.tags.minItems).to.equal(1);
      expect(schema.properties.tags.maxItems).to.be.undefined;
    });

    it('应该支持 array!-10 语法（只有最大值）', () => {
      const schema = dsl({ tags: 'array!-10' });

      expect(schema.properties.tags.maxItems).to.equal(10);
      expect(schema.properties.tags.minItems).to.be.undefined;
    });

    it('应该验证数组长度', () => {
      const schema = dsl({ tags: 'array!1-3' });

      expect(validate(schema, { tags: ['a', 'b'] }).valid).to.be.true;
      expect(validate(schema, { tags: [] }).valid).to.be.false;
      expect(validate(schema, { tags: ['a','b','c','d'] }).valid).to.be.false;
    });
  });

  // ========== 2. Schema复用 ==========
  describe('Schema复用', () => {
    it('应该支持reusable创建可复用字段', () => {
      const emailField = SchemaUtils.reusable(() => dsl('email!'));

      const schema1 = dsl({ email: emailField() });
      const schema2 = dsl({ contact: emailField() });

      expect(schema1.properties.email.format).to.equal('email');
      expect(schema2.properties.contact.format).to.equal('email');
    });

    it('应该支持createLibrary创建字段库', () => {
      const fields = SchemaUtils.createLibrary({
        email: () => 'email!',
        phone: () => 'string:11!'
      });

      const schema = dsl({
        email: fields.email(),
        phone: fields.phone()
      });

      expect(schema.properties.email.format).to.equal('email');
      expect(schema.properties.phone.maxLength).to.equal(11);
    });
  });

  // ========== 3. Schema 扩展 (替代 merge) ==========
  describe('Schema扩展', () => {
    it('应该扩展Schema', () => {
      const schema1 = dsl({ name: 'string!' });
      const extended = SchemaUtils.extend(schema1, { age: 'number' });

      expect(Object.keys(extended.properties)).to.have.lengthOf(2);
      expect(extended.properties.name).to.exist;
      expect(extended.properties.age).to.exist;
      expect(extended.required).to.include('name');
    });

    it('应该支持pick筛选字段', () => {
      const full = dsl({
        name: 'string!',
        email: 'email!',
        password: 'string!'
      });

      const picked = SchemaUtils.pick(full, ['name', 'email']);

      expect(Object.keys(picked.properties)).to.have.lengthOf(2);
      expect(picked.properties.password).to.not.exist;
    });

    it('应该支持omit排除字段', () => {
      const full = dsl({
        name: 'string!',
        email: 'email!',
        password: 'string!'
      });

      const omitted = SchemaUtils.omit(full, ['password']);

      expect(Object.keys(omitted.properties)).to.have.lengthOf(2);
      expect(omitted.properties.password).to.not.exist;
    });
  });

  // ========== 4. 批量验证 ==========
  describe('批量验证', () => {
    it('应该批量验证多条数据', () => {
      const schema = dsl({ email: 'email!' });
      const data = [
        { email: 'valid1@example.com' },
        { email: 'invalid' },
        { email: 'valid2@example.com' }
      ];

      const result = SchemaUtils.validateBatch(schema, data, new Validator());

      expect(result.summary.total).to.equal(3);
      expect(result.summary.valid).to.equal(2);
      expect(result.summary.invalid).to.equal(1);
      expect(result.results).to.have.lengthOf(3);
    });

    it('批量验证应该包含性能统计', () => {
      const schema = dsl({ email: 'email!' });
      const data = [{ email: 'test@example.com' }];

      const result = SchemaUtils.validateBatch(schema, data, new Validator());

      expect(result.summary.duration).to.be.a('number');
      expect(result.summary.averageTime).to.be.a('number');
    });
  });

  // ========== 5. 性能监控 ==========
  describe('性能监控', () => {
    it('应该在验证结果中包含性能信息', () => {
      const validator = SchemaUtils.withPerformance(new Validator());
      const schema = dsl({ email: 'email!' });

      const result = validator.validate(schema, { email: 'test@example.com' });

      expect(result.performance).to.exist;
      expect(result.performance.duration).to.be.a('number');
      expect(result.performance.timestamp).to.be.a('string');
    });
  });

  // ========== 6. Schema导出 ==========
  describe('Schema导出', () => {
    it('应该导出为Markdown', () => {
      const schema = dsl({
        name: dsl('string!').label('姓名'),
        age: dsl('number').label('年龄')
      });

      const markdown = SchemaUtils.toMarkdown(schema, { title: '测试Schema' });

      expect(markdown).to.be.a('string');
      expect(markdown).to.include('测试Schema');
      expect(markdown).to.include('name');
      expect(markdown).to.include('age');
    });

    it('应该导出为HTML', () => {
      const schema = dsl({ name: 'string!' });
      const html = SchemaUtils.toHTML(schema);

      expect(html).to.be.a('string');
      expect(html).to.include('<!DOCTYPE html>');
      expect(html).to.include('name');
    });
  });

  // ========== 7. 嵌套深度检查 ==========
  describe('嵌套深度检查', () => {
    it('应该检测嵌套深度', () => {
      const deepSchema = dsl({
        level1: {
          level2: {
            level3: {
              value: 'string'
            }
          }
        }
      });

      const check = DslBuilder.validateNestingDepth(deepSchema, 2);

      expect(check.depth).to.equal(3);
      expect(check.valid).to.be.false;
      expect(check.path).to.be.a('string');
    });

    it('应该通过合理的嵌套深度', () => {
      const shallowSchema = dsl({
        level1: {
          level2: {
            value: 'string'
          }
        }
      });

      const check = DslBuilder.validateNestingDepth(shallowSchema, 3);

      expect(check.valid).to.be.true;
      expect(check.depth).to.be.at.most(3);
    });
  });

  // ========== 8. Schema克隆 ==========
  describe('Schema克隆', () => {
    it('应该深度克隆Schema', () => {
      const original = dsl({ name: 'string!', email: 'email!' });
      const cloned = SchemaUtils.clone(original);

      cloned.properties.name.minLength = 100;

      expect(original.properties.name.minLength).to.not.equal(100);
    });
  });
});

