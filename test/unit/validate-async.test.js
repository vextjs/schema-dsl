/**
 * validateAsync 单元测试
 *
 * 测试异步验证方法的所有功能
 */

const { expect } = require('chai');
const { dsl, validateAsync, ValidationError } = require('../../index');

describe('validateAsync', function() {
  describe('基础功能', function() {
    it('应该在验证通过时返回数据', async function() {
      const schema = dsl({
        name: 'string:1-50!',
        email: 'email!',
        age: 'integer:0-150'
      });

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const result = await validateAsync(schema, data);

      expect(result).to.deep.equal(data);
    });

    it('应该在验证失败时抛出 ValidationError', async function() {
      const schema = dsl({
        name: 'string:1-50!',
        email: 'email!'
      });

      const data = {
        name: '',
        email: 'invalid-email'
      };

      try {
        await validateAsync(schema, data);
        expect.fail('应该抛出 ValidationError');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.name).to.equal('ValidationError');
        expect(error.errors).to.be.an('array');
        expect(error.errors.length).to.be.greaterThan(0);
      }
    });
  });

  describe('字段验证', function() {
    it('应该验证必填字段', async function() {
      const schema = dsl({
        username: 'string:3-32!',
        password: 'string:8-32!'
      });

      try {
        await validateAsync(schema, { username: 'test' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.hasFieldError('password')).to.be.true;
      }
    });

    it('应该验证字符串长度', async function() {
      const schema = dsl({ name: 'string:3-10!' });

      try {
        await validateAsync(schema, { name: 'ab' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.hasFieldError('name')).to.be.true;
      }
    });

    it('应该验证邮箱格式', async function() {
      const schema = dsl({ email: 'email!' });

      try {
        await validateAsync(schema, { email: 'invalid' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.hasFieldError('email')).to.be.true;
      }
    });

    it('应该验证数字范围', async function() {
      const schema = dsl({ age: 'integer:18-120!' });

      try {
        await validateAsync(schema, { age: 15 });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.hasFieldError('age')).to.be.true;
      }
    });

    it('应该验证枚举值', async function() {
      const schema = dsl({ role: 'admin|user|guest!' });

      try {
        await validateAsync(schema, { role: 'superadmin' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.hasFieldError('role')).to.be.true;
      }
    });
  });

  describe('复杂对象验证', function() {
    it('应该验证嵌套对象', async function() {
      const schema = dsl({
        user: {
          name: 'string!',
          email: 'email!'
        }
      });

      const data = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      };

      const result = await validateAsync(schema, data);
      expect(result).to.deep.equal(data);
    });

    it('应该验证数组', async function() {
      const schema = dsl({
        tags: 'array:1-5<string>!'
      });

      const data = {
        tags: ['javascript', 'nodejs', 'mongodb']
      };

      const result = await validateAsync(schema, data);
      expect(result).to.deep.equal(data);
    });

    it('应该验证数组长度', async function() {
      const schema = dsl({
        tags: 'array:1-3!'
      });

      try {
        await validateAsync(schema, { tags: ['a', 'b', 'c', 'd'] });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
      }
    });
  });

  describe('错误处理', function() {
    it('should提供详细的错误信息', async function() {
      const schema = dsl({
        name: 'string:3-32!',
        email: 'email!',
        age: 'integer:18-120!'
      });

      try {
        await validateAsync(schema, {
          name: 'ab',
          email: 'invalid',
          age: 15
        });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.getErrorCount()).to.be.greaterThan(0);

        const fieldErrors = error.getFieldErrors();
        expect(fieldErrors).to.have.property('name');
        expect(fieldErrors).to.have.property('email');
        expect(fieldErrors).to.have.property('age');
      }
    });

    it('应该提供 toJSON() 方法', async function() {
      const schema = dsl({ name: 'string!' });

      try {
        await validateAsync(schema, {});
        expect.fail('应该抛出错误');
      } catch (error) {
        const json = error.toJSON();

        expect(json).to.have.property('error', 'ValidationError');
        expect(json).to.have.property('message');
        expect(json).to.have.property('statusCode', 400);
        expect(json).to.have.property('details');
        expect(json.details).to.be.an('array');
      }
    });
  });

  describe('选项支持', function() {
    it('应该支持 locale 选项', async function() {
      const schema = dsl({ name: 'string!' });

      try {
        await validateAsync(schema, {}, { locale: 'zh-CN' });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        // 错误消息应该是中文（如果配置了中文语言包）
      }
    });

    it('应该支持 format 选项', async function() {
      const schema = dsl({ name: 'string!' });

      try {
        await validateAsync(schema, {}, { format: false });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
        expect(error.errors).to.be.an('array');
      }
    });
  });

  describe('DslBuilder 支持', function() {
    it('应该支持 DslBuilder 实例', async function() {
      const schema = dsl('email!').label('邮箱地址');

      const data = 'test@example.com';
      const result = await validateAsync(schema, data);

      expect(result).to.equal(data);
    });

    it('应该验证 DslBuilder 失败', async function() {
      const schema = dsl('email!');

      try {
        await validateAsync(schema, 'invalid');
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
      }
    });
  });

  describe('默认值', function() {
    it('应该应用默认值', async function() {
      const schema = dsl({
        name: 'string!',
        role: 'string'
      });

      // 需要手动设置 default
      schema.properties.role.default = 'user';

      const data = { name: 'John' };
      const result = await validateAsync(schema, data);

      expect(result.role).to.equal('user');
    });
  });

  describe('性能', function() {
    it('应该快速验证大量数据', async function() {
      // 增加超时时间
      this.timeout(10000);

      const schema = dsl({
        name: 'string!',
        email: 'email!',
        age: 'integer'
      });

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      };

      const iterations = 1000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await validateAsync(schema, data);
      }

      const duration = Date.now() - start;

      // 应该在合理时间内完成（8秒，考虑系统性能差异）
      expect(duration).to.be.lessThan(8000);
      console.log(`      ${iterations} 次验证耗时: ${duration}ms`);
    });
  });

  describe('边界情况', function() {
    it('应该处理空对象', async function() {
      const schema = dsl({});
      const result = await validateAsync(schema, {});

      expect(result).to.deep.equal({});
    });

    it('应该处理 null 值', async function() {
      const schema = dsl({ value: 'null!' });
      const result = await validateAsync(schema, { value: null });

      expect(result.value).to.be.null;
    });

    it('应该处理布尔值', async function() {
      const schema = dsl({ active: 'boolean!' });
      const result = await validateAsync(schema, { active: true });

      expect(result.active).to.be.true;
    });

    it('应该处理日期', async function() {
      const schema = dsl({ createdAt: 'date!' });
      const result = await validateAsync(schema, { createdAt: '2025-12-29' });

      expect(result.createdAt).to.equal('2025-12-29');
    });
  });

  describe('async/await 语法', function() {
    it('应该在 async 函数中工作', async function() {
      async function validateUser(userData) {
        const schema = dsl({
          name: 'string!',
          email: 'email!'
        });

        return await validateAsync(schema, userData);
      }

      const result = await validateUser({
        name: 'John',
        email: 'john@example.com'
      });

      expect(result.name).to.equal('John');
    });

    it('应该支持 Promise.all', async function() {
      const schema = dsl({ name: 'string!' });

      const promises = [
        validateAsync(schema, { name: 'John' }),
        validateAsync(schema, { name: 'Jane' }),
        validateAsync(schema, { name: 'Bob' })
      ];

      const results = await Promise.all(promises);

      expect(results).to.have.lengthOf(3);
      expect(results[0].name).to.equal('John');
      expect(results[1].name).to.equal('Jane');
      expect(results[2].name).to.equal('Bob');
    });

    it('应该在 Promise.all 中捕获错误', async function() {
      const schema = dsl({ name: 'string!' });

      const promises = [
        validateAsync(schema, { name: 'John' }),
        validateAsync(schema, {}),  // 这个会失败
        validateAsync(schema, { name: 'Bob' })
      ];

      try {
        await Promise.all(promises);
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(ValidationError);
      }
    });
  });
});

