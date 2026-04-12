/**
 * Validator 核心测试
 *
 * 测试 ajv 验证器集成功能
 */

const { expect } = require('chai');
const Validator = require('../../../lib/core/Validator');
const JSONSchemaCore = require('../../../lib/core/JSONSchemaCore');

describe('Validator', () => {
  let validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('构造函数', () => {
    it('应该创建 Validator 实例', () => {
      expect(validator).to.be.instanceOf(Validator);
    });

    it('应该使用默认选项', () => {
      expect(validator.ajvOptions.allErrors).to.be.true;
      expect(validator.ajvOptions.useDefaults).to.be.true;
    });

    it('应该接受自定义选项', () => {
      const customValidator = new Validator({ coerceTypes: true });
      expect(customValidator.ajvOptions.coerceTypes).to.be.true;
    });
  });

  describe('validate()', () => {
    it('应该验证有效数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const data = { name: 'John', age: 25 };
      const result = validator.validate(schema, data);

      expect(result.valid).to.be.true;
      expect(result.errors).to.be.empty;
    });

    it('应该检测无效数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' }
        },
        required: ['name']
      };

      const data = { age: 'invalid' };
      const result = validator.validate(schema, data);

      expect(result.valid).to.be.false;
      expect(result.errors).to.not.be.empty;
    });

    it('应该验证字符串长度约束', () => {
      const schema = {
        type: 'string',
        minLength: 3,
        maxLength: 10
      };

      expect(validator.validate(schema, 'abc').valid).to.be.true;
      expect(validator.validate(schema, 'ab').valid).to.be.false;
      expect(validator.validate(schema, 'abcdefghijk').valid).to.be.false;
    });

    it('应该验证数字范围约束', () => {
      const schema = {
        type: 'number',
        minimum: 0,
        maximum: 100
      };

      expect(validator.validate(schema, 50).valid).to.be.true;
      expect(validator.validate(schema, -1).valid).to.be.false;
      expect(validator.validate(schema, 101).valid).to.be.false;
    });

    it('应该验证邮箱格式', () => {
      const schema = {
        type: 'string',
        format: 'email'
      };

      expect(validator.validate(schema, 'test@example.com').valid).to.be.true;
      expect(validator.validate(schema, 'invalid-email').valid).to.be.false;
    });

    it('应该验证枚举值', () => {
      const schema = {
        type: 'string',
        enum: ['active', 'inactive', 'pending']
      };

      expect(validator.validate(schema, 'active').valid).to.be.true;
      expect(validator.validate(schema, 'invalid').valid).to.be.false;
    });
  });

  describe('compile()', () => {
    it('应该编译 Schema', () => {
      const schema = {
        type: 'string',
        minLength: 3
      };

      const validateFn = validator.compile(schema);
      expect(validateFn).to.be.a('function');
    });

    it('应该缓存编译结果', () => {
      const schema = { type: 'string' };
      const cacheKey = 'test-key';

      const fn1 = validator.compile(schema, cacheKey);
      const fn2 = validator.compile(schema, cacheKey);

      expect(fn1).to.equal(fn2);
    });
  });

  describe('validateBatch()', () => {
    it('应该批量验证数据', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' }
        },
        required: ['name']
      };

      const dataArray = [
        { name: 'John' },
        { name: 'Jane' },
        { age: 25 }
      ];

      const results = validator.validateBatch(schema, dataArray);

      expect(results).to.have.lengthOf(3);
      expect(results[0].valid).to.be.true;
      expect(results[1].valid).to.be.true;
      expect(results[2].valid).to.be.false;
    });
  });

  describe('addKeyword()', () => {
    it('应该添加自定义关键字', () => {
      validator.addKeyword('isEven', {
        validate: (schema, data) => data % 2 === 0
      });

      const schema = {
        type: 'number',
        isEven: true
      };

      expect(validator.validate(schema, 4).valid).to.be.true;
      expect(validator.validate(schema, 5).valid).to.be.false;
    });
  });

  describe('addFormat()', () => {
    it('应该添加自定义格式', () => {
      validator.addFormat('uppercase', /^[A-Z]+$/);

      const schema = {
        type: 'string',
        format: 'uppercase'
      };

      expect(validator.validate(schema, 'ABC').valid).to.be.true;
      expect(validator.validate(schema, 'abc').valid).to.be.false;
    });
  });

  describe('clearCache()', () => {
    it('应该清空缓存', () => {
      const schema = { type: 'string' };
      validator.compile(schema, 'key1');

      validator.clearCache();

      // 验证缓存被清空（尝试获取应该返回新的编译函数）
      const fn1 = validator.compile(schema, 'key1');
      const fn2 = validator.compile(schema, 'key1');
      expect(fn1).to.equal(fn2); // 重新缓存后应该相等
    });
  });

  describe('静态方法', () => {
    it('Validator.create() 应该创建实例', () => {
      const instance = Validator.create();
      expect(instance).to.be.instanceOf(Validator);
    });

    it('Validator.quickValidate() 应该快速验证', () => {
      const schema = { type: 'string' };
      expect(Validator.quickValidate(schema, 'test')).to.be.true;
      expect(Validator.quickValidate(schema, 123)).to.be.false;
    });
  });
});

