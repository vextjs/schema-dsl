/**
 * 错误消息插值测试 - 确保所有模板变量都能正确替换
 *
 * 测试目标：验证ajv返回的params能正确映射到模板变量
 */

const assert = require('assert');
const { dsl, validate, Validator } = require('../../index');

describe('ErrorFormatter - 参数映射完整性测试', function() {

  describe('enum 错误消息', function() {

    it('应该正确显示枚举值（必填）', function() {
      const schema = dsl({
        plan_type: 'enum:pro|basic|free!'
      });

      const result = validate(schema, { plan_type: 'premium' }, new Validator());

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.errors.length, 1);

      const error = result.errors[0];
      assert.strictEqual(error.keyword, 'enum');

      // 验证错误消息中包含枚举值
      assert.ok(error.message.includes('pro'));
      assert.ok(error.message.includes('basic'));
      assert.ok(error.message.includes('free'));

      // 验证不包含模板变量
      assert.ok(!error.message.includes('{{#valids}}'));
      assert.ok(!error.message.includes('{{#allowed}}'));
    });

    it('应该正确显示枚举值（可选）', function() {
      const schema = dsl({
        plan_type: 'enum:pro|basic?'
      });

      const result = validate(schema, { plan_type: 'premium' }, new Validator());

      assert.strictEqual(result.valid, false);
      const error = result.errors[0];

      // 验证错误消息中包含枚举值
      assert.ok(error.message.includes('pro'));
      assert.ok(error.message.includes('basic'));

      // 验证不包含模板变量
      assert.ok(!error.message.includes('{{#valids}}'));
      assert.ok(!error.message.includes('{{#allowed}}'));
    });

    it('应该支持数字枚举', function() {
      const schema = dsl({
        priority: '1|2|3!'
      });

      const result = validate(schema, { priority: 5 }, new Validator());

      assert.strictEqual(result.valid, false);
      const error = result.errors[0];

      // 验证错误消息中包含枚举值
      assert.ok(error.message.includes('1'));
      assert.ok(error.message.includes('2'));
      assert.ok(error.message.includes('3'));
    });

    it('应该支持中文错误消息', function() {
      const schema = dsl({
        status: 'active|inactive!'
      });

      const result = validate(schema, { status: 'unknown' }, new Validator(), { locale: 'zh-CN' });

      assert.strictEqual(result.valid, false);
      const error = result.errors[0];

      // 中文消息应该包含枚举值
      assert.ok(error.message.includes('active'));
      assert.ok(error.message.includes('inactive'));
      assert.ok(error.message.includes('以下值之一') || error.message.includes('必须是'));
    });

  });

  describe('additionalProperties 错误消息', function() {

    it('应该正确显示未知属性名', function() {
      // 注意：需要通过Validator直接编译包含additionalProperties:false的schema
      // 因为dsl()默认不会设置additionalProperties
      const Ajv = require('ajv');
      const ajv = new Ajv({ allErrors: true });

      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name'],
        additionalProperties: false
      };

      const validate = ajv.compile(schema);
      const valid = validate({ name: 'John', age: 30, email: 'john@example.com' });

      assert.strictEqual(valid, false);
      assert.ok(validate.errors);

      const errorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new errorFormatter('en-US');
      const formatted = formatter.formatDetailed(validate.errors);

      assert.ok(formatted.length > 0);
      const error = formatted.find(e => e.keyword === 'additionalProperties');

      if (error) {
        // 验证错误消息中包含属性名
        assert.ok(error.message.includes('email'), `错误消息应包含 'email'，实际: ${error.message}`);

        // 验证不包含模板变量
        assert.ok(!error.message.includes('{{#key}}'), '错误消息不应包含未替换的模板变量');
      } else {
        assert.fail('应该有 additionalProperties 错误');
      }
    });

  });

  describe('required 错误消息', function() {

    it('应该正确显示缺失的字段名', function() {
      const schema = dsl({
        name: 'string!',
        email: 'email!'
      });

      const result = validate(schema, {}, new Validator());

      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.length >= 2);

      // 验证name字段的错误
      const nameError = result.errors.find(e => e.path === 'name');
      assert.ok(nameError);
      assert.ok(nameError.message.includes('name') || nameError.message.includes('必填') || nameError.message.includes('required'));

      // 验证email字段的错误
      const emailError = result.errors.find(e => e.path === 'email');
      assert.ok(emailError);
      assert.ok(emailError.message.includes('email') || emailError.message.includes('必填') || emailError.message.includes('required'));
    });

  });

  describe('minLength/maxLength 错误消息', function() {

    it('应该正确显示长度限制', function() {
      const schema = dsl({
        username: 'string:3-32!'
      });

      // 测试最小长度
      let result = validate(schema, { username: 'ab' }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('3'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));

      // 测试最大长度
      result = validate(schema, { username: 'a'.repeat(33) }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('32'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));
    });

  });

  describe('minimum/maximum 错误消息', function() {

    it('应该正确显示数值范围', function() {
      const schema = dsl({
        age: 'number:18-120!'
      });

      // 测试最小值
      let result = validate(schema, { age: 10 }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('18'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));

      // 测试最大值
      result = validate(schema, { age: 150 }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('120'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));
    });

  });

  describe('type 错误消息', function() {

    it('应该正确显示期望类型和实际类型', function() {
      const schema = dsl({
        age: 'number!'
      });

      const result = validate(schema, { age: 'not a number' }, new Validator(), { locale: 'en-US' });

      assert.strictEqual(result.valid, false);
      const error = result.errors[0];

      // 验证消息包含类型信息
      assert.ok(error.message.includes('number') || error.message.toLowerCase().includes('type'));

      // 验证不包含模板变量
      assert.ok(!error.message.includes('{{#expected}}'));
      assert.ok(!error.message.includes('{{#actual}}'));
    });

  });

  describe('minItems/maxItems 错误消息', function() {

    it('应该正确显示数组长度限制', function() {
      const schema = dsl({
        tags: 'array!1-10'
      });

      // 测试最小长度
      let result = validate(schema, { tags: [] }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('1'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));

      // 测试最大长度
      result = validate(schema, { tags: Array(11).fill('tag') }, new Validator());
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('10'));
      assert.ok(!result.errors[0].message.includes('{{#limit}}'));
    });

  });

  describe('format 错误消息', function() {

    it('应该正确显示格式验证错误', function() {
      const schema = dsl({
        email: 'email!'
      });

      const result = validate(schema, { email: 'invalid-email' }, new Validator());

      assert.strictEqual(result.valid, false);
      const error = result.errors[0];

      // 验证消息包含格式信息
      assert.ok(error.message.toLowerCase().includes('email') || error.message.includes('格式'));

      // 验证不包含模板变量
      assert.ok(!error.message.includes('{{#format}}'));
    });

  });

  describe('多语言支持', function() {

    it('应该在不同语言中正确替换变量', function() {
      const schema = dsl({
        status: 'active|inactive|pending!'
      });

      // 英文
      let result = validate(schema, { status: 'unknown' }, new Validator(), { locale: 'en-US' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('active'));
      assert.ok(!result.errors[0].message.includes('{{'));

      // 中文
      result = validate(schema, { status: 'unknown' }, new Validator(), { locale: 'zh-CN' });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors[0].message.includes('active'));
      assert.ok(!result.errors[0].message.includes('{{'));
    });

  });

});
