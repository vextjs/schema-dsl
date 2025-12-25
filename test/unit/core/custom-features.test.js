const { expect } = require('chai');
const { dsl, Validator, Locale } = require('../../../index');

describe('Custom Features & Error Messages', () => {
  let validator;

  beforeEach(() => {
    validator = new Validator();
    // 重置语言环境
    Locale.setLocale('en-US');
  });

  describe('Custom Validators (.custom)', () => {
    it('should support synchronous validation returning string error', () => {
      const schema = dsl({
        username: 'string!'.custom((value) => {
          if (value === 'admin') return 'Cannot be admin';
        })
      });

      const result = validator.validate(schema, { username: 'admin' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('Cannot be admin');
    });

    it('should support synchronous validation returning boolean false', () => {
      const schema = dsl({
        username: 'string!'.custom((value) => {
          if (value === 'admin') return false;
        })
      });

      const result = validator.validate(schema, { username: 'admin' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('Validation failed');
    });

    it('should support synchronous validation returning error object', () => {
      const schema = dsl({
        username: 'string!'.custom((value) => {
          if (value === 'admin') return { error: 'forbidden', message: 'Access denied' };
        })
      });

      const result = validator.validate(schema, { username: 'admin' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('Access denied');
    });

    it('should pass when returning nothing or true', () => {
      const schema = dsl({
        username: 'string!'.custom((value) => {
          if (value === 'user') return;
          return true;
        })
      });

      const result = validator.validate(schema, { username: 'user' });
      expect(result.valid).to.be.true;
    });

    // 注意：ajv 默认同步模式不支持异步验证器，这里测试同步行为
    // 如果需要支持异步，需要使用 validateAsync (目前 Validator.validate 是同步的)
    // 但我们在 CustomKeywords 中处理了 Promise 返回，抛出错误提示
    it('should throw error for async validator in sync validate', () => {
      const schema = dsl({
        username: 'string!'.custom(async (value) => {
          return true;
        })
      });

      const result = validator.validate(schema, { username: 'user' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.include('Async validation not supported');
    });
  });

  describe('Custom Labels & Messages', () => {
    it('should use custom label in required error', () => {
      const schema = dsl({
        username: 'string!'.label('用户名')
      });

      // 切换到中文以匹配默认模板 "{path} 是必填字段"
      // 或者我们自定义消息
      const schemaWithMsg = dsl({
        username: 'string!'
          .label('用户名')
          .messages({ 'required': '{{#label}}不能为空' })
      });

      const result = validator.validate(schemaWithMsg, {});
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('用户名不能为空');
    });

    it('should use custom label in min length error', () => {
      // 使用 string:5- 表示最小长度为5
      const schema = dsl({
        username: 'string:5-!'.label('用户名')
          .messages({ 'min': '{{#label}}长度不能少于{{#limit}}位' })
      });

      const result = validator.validate(schema, { username: 'abc' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('用户名长度不能少于5位');
    });

    it('should support {{#key}} interpolation', () => {
      // 使用 number:18- 表示最小值为18
      const schema = dsl({
        age: 'number:18-!'.label('年龄')
          .messages({ 'min': '{{#label}}必须大于{{#limit}}' })
      });

      const result = validator.validate(schema, { age: 10 });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('年龄必须大于18');
    });
  });

  describe('Dynamic Locale', () => {
    before(() => {
      Locale.addLocale('zh-CN', {
        'required': '{{#label}}是必填项',
        'min': '{{#label}}太短'
      });
    });

    it('should support locale option in validate', () => {
      // 使用 string:5- 表示最小长度为5
      const schema = dsl({
        username: 'string:5-!'.label('用户名')
      });

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'zh-CN' });
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('用户名太短');
    });

    it('should fallback to default locale', () => {
      // 使用 string:5- 表示最小长度为5
      const schema = dsl({
        username: 'string:5-!'.label('Username')
      });

      const result = validator.validate(schema, { username: 'abc' }, { locale: 'en-US' });
      expect(result.valid).to.be.false;
      // 默认英文消息
      expect(result.errors[0].message).to.include('length must be at least 5');
    });
  });
});

