/**
 * ValidationError 单元测试
 *
 * 测试 ValidationError 类的所有功能
 */

const { expect } = require('chai');
const ValidationError = require('../../lib/errors/ValidationError');

describe('ValidationError', function() {
  describe('constructor', function() {
    it('应该创建 ValidationError 实例', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];
      const data = { email: 'test@example.com' };

      const error = new ValidationError(errors, data);

      expect(error).to.be.instanceof(ValidationError);
      expect(error).to.be.instanceof(Error);
      expect(error.name).to.equal('ValidationError');
      expect(error.errors).to.deep.equal(errors);
      expect(error.data).to.deep.equal(data);
      expect(error.statusCode).to.equal(400);
    });

    it('应该生成友好的错误消息（带路径）', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' },
        { path: '/email', message: '邮箱格式错误', keyword: 'format' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.message).to.include('name: 字段必填');
      expect(error.message).to.include('email: 邮箱格式错误');
    });

    it('应该生成友好的错误消息（无路径）', function() {
      const errors = [
        { message: '验证失败', keyword: 'custom' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.message).to.include('验证失败');
      expect(error.message).not.to.include(':');
    });

    it('应该处理空路径', function() {
      const errors = [
        { path: '/', message: '根级别错误', keyword: 'error' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.message).to.equal('Validation failed: 根级别错误');
    });
  });

  describe('toJSON()', function() {
    it('应该转换为 JSON 格式', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required', params: {} }
      ];
      const data = { email: 'test@example.com' };

      const error = new ValidationError(errors, data);
      const json = error.toJSON();

      expect(json).to.have.property('error', 'ValidationError');
      expect(json).to.have.property('message');
      expect(json).to.have.property('statusCode', 400);
      expect(json).to.have.property('details');
      expect(json.details).to.be.an('array');
    });

    it('should格式化详细错误列表', function() {
      const errors = [
        {
          path: '/name',
          message: '字段必填',
          keyword: 'required',
          params: { missingProperty: 'name' }
        }
      ];

      const error = new ValidationError(errors, {});
      const json = error.toJSON();

      expect(json.details[0]).to.have.property('field', 'name');
      expect(json.details[0]).to.have.property('message', '字段必填');
      expect(json.details[0]).to.have.property('keyword', 'required');
      expect(json.details[0]).to.have.property('params');
    });

    it('应该处理无路径的错误', function() {
      const errors = [
        { message: '全局错误', keyword: 'error' }
      ];

      const error = new ValidationError(errors, {});
      const json = error.toJSON();

      expect(json.details[0]).to.have.property('field', null);
      expect(json.details[0]).to.have.property('message', '全局错误');
    });
  });

  describe('getFieldError()', function() {
    it('应该获取指定字段的错误', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' },
        { path: '/email', message: '邮箱格式错误', keyword: 'format' }
      ];

      const error = new ValidationError(errors, {});

      const nameError = error.getFieldError('name');
      expect(nameError).to.exist;
      expect(nameError.message).to.equal('字段必填');

      const emailError = error.getFieldError('email');
      expect(emailError).to.exist;
      expect(emailError.message).to.equal('邮箱格式错误');
    });

    it('应该支持带斜杠的字段名', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});

      const nameError = error.getFieldError('/name');
      expect(nameError).to.exist;
      expect(nameError.message).to.equal('字段必填');
    });

    it('应该返回 null 如果字段不存在', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});

      const ageError = error.getFieldError('age');
      expect(ageError).to.be.null;
    });
  });

  describe('getFieldErrors()', function() {
    it('应该获取所有字段的错误映射', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' },
        { path: '/email', message: '邮箱格式错误', keyword: 'format' },
        { path: '/age', message: '年龄必须大于18', keyword: 'minimum' }
      ];

      const error = new ValidationError(errors, {});
      const fieldErrors = error.getFieldErrors();

      expect(fieldErrors).to.deep.equal({
        name: '字段必填',
        email: '邮箱格式错误',
        age: '年龄必须大于18'
      });
    });

    it('应该返回空对象如果没有字段错误', function() {
      const errors = [
        { message: '全局错误', keyword: 'error' }
      ];

      const error = new ValidationError(errors, {});
      const fieldErrors = error.getFieldErrors();

      expect(fieldErrors).to.deep.equal({});
    });

    it('应该忽略空路径', function() {
      const errors = [
        { path: '/', message: '根错误', keyword: 'error' },
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});
      const fieldErrors = error.getFieldErrors();

      expect(fieldErrors).to.deep.equal({
        name: '字段必填'
      });
    });
  });

  describe('hasFieldError()', function() {
    it('应该检查字段是否有错误', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.hasFieldError('name')).to.be.true;
      expect(error.hasFieldError('email')).to.be.false;
    });
  });

  describe('getErrorCount()', function() {
    it('应该返回错误数量', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' },
        { path: '/email', message: '邮箱格式错误', keyword: 'format' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.getErrorCount()).to.equal(2);
    });

    it('应该返回 0 如果没有错误', function() {
      const error = new ValidationError([], {});
      expect(error.getErrorCount()).to.equal(0);
    });
  });

  describe('堆栈跟踪', function() {
    it('应该包含堆栈跟踪', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.stack).to.exist;
      expect(error.stack).to.include('ValidationError');
    });
  });

  describe('without new keyword', function() {
    it('应该支持不使用 new 关键字调用', function() {
      const errors = [
        { path: '/name', message: '字段必填', keyword: 'required' }
      ];

      const error = ValidationError(errors, {});

      expect(error).to.be.instanceof(ValidationError);
      expect(error.name).to.equal('ValidationError');
    });
  });

  describe('复杂场景', function() {
    it('应该处理嵌套字段错误', function() {
      const errors = [
        { path: '/user/name', message: '字段必填', keyword: 'required' },
        { path: '/user/address/city', message: '城市必填', keyword: 'required' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.message).to.include('user/name: 字段必填');
      expect(error.message).to.include('user/address/city: 城市必填');
    });

    it('应该处理数组索引错误', function() {
      const errors = [
        { path: '/users/0/name', message: '字段必填', keyword: 'required' },
        { path: '/users/1/email', message: '邮箱格式错误', keyword: 'format' }
      ];

      const error = new ValidationError(errors, {});

      expect(error.message).to.include('users/0/name: 字段必填');
      expect(error.message).to.include('users/1/email: 邮箱格式错误');
    });

    it('应该处理大量错误', function() {
      const errors = Array.from({ length: 100 }, (_, i) => ({
        path: `/field${i}`,
        message: `字段${i}错误`,
        keyword: 'error'
      }));

      const error = new ValidationError(errors, {});

      expect(error.getErrorCount()).to.equal(100);
      expect(error.errors.length).to.equal(100);
    });
  });
});

