/**
 * 多语言错误消息测试 - 完整覆盖所有语言
 */

const assert = require('assert');
const { validate, Validator } = require('../../index');
const Ajv = require('ajv');

describe('ErrorFormatter - 多语言完整性测试', function() {

  describe('enum 错误消息 - 所有语言', function() {

    const schema = {
      type: 'object',
      properties: {
        plan_type: {
          type: 'string',
          enum: ['pro', 'basic', 'free']
        }
      }
    };

    const validator = new Validator();
    const compiledSchema = validator.compile(schema);
    const testData = { plan_type: 'premium' };

    it('应该正确显示枚举值（英文 en-US）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('en-US');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('pro'));
      assert.ok(errors[0].message.includes('basic'));
      assert.ok(errors[0].message.includes('free'));
      assert.ok(!errors[0].message.includes('{{#valids}}'));
      assert.ok(!errors[0].message.includes('{{#allowed}}'));
    });

    it('应该正确显示枚举值（中文 zh-CN）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('zh-CN');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('pro'));
      assert.ok(errors[0].message.includes('basic'));
      assert.ok(errors[0].message.includes('free'));
      assert.ok(!errors[0].message.includes('{{#valids}}'));
    });

    it('应该正确显示枚举值（西班牙语 es-ES）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('es-ES');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('pro'));
      assert.ok(errors[0].message.includes('basic'));
      assert.ok(errors[0].message.includes('free'));
      assert.ok(!errors[0].message.includes('{{#valids}}'));
    });

    it('应该正确显示枚举值（法语 fr-FR）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('fr-FR');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('pro'));
      assert.ok(errors[0].message.includes('basic'));
      assert.ok(errors[0].message.includes('free'));
      assert.ok(!errors[0].message.includes('{{#valids}}'));
    });

    it('应该正确显示枚举值（日语 ja-JP）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('ja-JP');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('pro'));
      assert.ok(errors[0].message.includes('basic'));
      assert.ok(errors[0].message.includes('free'));
      assert.ok(!errors[0].message.includes('{{#valids}}'));
    });

  });

  describe('additionalProperties 错误消息 - 所有语言', function() {

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

    const compiledSchema = ajv.compile(schema);
    const testData = { name: 'John', age: 30, email: 'john@example.com' };

    it('应该正确显示未知属性名（英文 en-US）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('en-US');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      const error = errors.find(e => e.keyword === 'additionalProperties');
      assert.ok(error, '应该有 additionalProperties 错误');
      assert.ok(error.message.includes('email'), `错误消息应包含 'email'，实际: ${error.message}`);
      assert.ok(!error.message.includes('{{#key}}'));
    });

    it('应该正确显示未知属性名（中文 zh-CN）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('zh-CN');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      const error = errors.find(e => e.keyword === 'additionalProperties');
      assert.ok(error);
      assert.ok(error.message.includes('email'));
      assert.ok(!error.message.includes('{{#key}}'));
    });

    it('应该正确显示未知属性名（西班牙语 es-ES）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('es-ES');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      const error = errors.find(e => e.keyword === 'additionalProperties');
      assert.ok(error);
      assert.ok(error.message.includes('email'));
      assert.ok(!error.message.includes('{{#key}}'));
    });

    it('应该正确显示未知属性名（法语 fr-FR）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('fr-FR');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      const error = errors.find(e => e.keyword === 'additionalProperties');
      assert.ok(error);
      assert.ok(error.message.includes('email'));
      assert.ok(!error.message.includes('{{#key}}'));
    });

    it('应该正确显示未知属性名（日语 ja-JP）', function() {
      const valid = compiledSchema(testData);
      assert.strictEqual(valid, false);

      const ErrorFormatter = require('../../lib/core/ErrorFormatter');
      const formatter = new ErrorFormatter('ja-JP');
      const errors = formatter.formatDetailed(compiledSchema.errors);

      const error = errors.find(e => e.keyword === 'additionalProperties');
      assert.ok(error);
      assert.ok(error.message.includes('email'));
      assert.ok(!error.message.includes('{{#key}}'));
    });

  });

});
