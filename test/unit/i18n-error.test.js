/**
 * 测试 I18nError - 多语言错误类
 *
 * @version 1.1.1
 */

const { expect } = require('chai');
const { I18nError, dsl, Locale } = require('../../index');

describe('I18nError - 多语言错误类', () => {
  beforeEach(() => {
    // 每个测试前重置为中文
    Locale.setLocale('zh-CN');
  });

  describe('基础功能', () => {
    it('应该创建包含翻译消息的错误', () => {
      const error = new I18nError('account.notFound');

      expect(error).to.be.instanceof(I18nError);
      expect(error).to.be.instanceof(Error);
      expect(error.name).to.equal('I18nError');
      expect(error.code).to.equal('account.notFound');
      expect(error.message).to.equal('账户不存在');
      expect(error.statusCode).to.equal(400);
      expect(error.locale).to.equal('zh-CN');
    });

    it('应该支持参数插值', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      });

      expect(error.message).to.include('余额不足');
      expect(error.message).to.include('50');
      expect(error.message).to.include('100');
      expect(error.params).to.deep.equal({ balance: 50, required: 100 });
    });

    it('应该支持自定义状态码', () => {
      const error = new I18nError('account.notFound', {}, 404);

      expect(error.statusCode).to.equal(404);
    });

    it('应该支持多语言切换', () => {
      // 中文
      let error = new I18nError('account.notFound');
      expect(error.message).to.equal('账户不存在');
      expect(error.locale).to.equal('zh-CN');

      // 英文
      Locale.setLocale('en-US');
      error = new I18nError('account.notFound');
      expect(error.message).to.equal('Account not found');
      expect(error.locale).to.equal('en-US');
    });

    it('应该支持指定语言', () => {
      const error = new I18nError('account.notFound', {}, 400, 'en-US');

      expect(error.message).to.equal('Account not found');
      expect(error.locale).to.equal('en-US');
      // 不影响全局语言
      expect(Locale.getLocale()).to.equal('zh-CN');
    });
  });

  describe('静态方法 - create', () => {
    it('应该创建错误实例', () => {
      const error = I18nError.create('account.notFound');

      expect(error).to.be.instanceof(I18nError);
      expect(error.code).to.equal('account.notFound');
    });

    it('应该支持参数和状态码', () => {
      const error = I18nError.create(
        'account.insufficientBalance',
        { balance: 50, required: 100 },
        402
      );

      expect(error.message).to.include('余额不足');
      expect(error.statusCode).to.equal(402);
    });
  });

  describe('静态方法 - throw', () => {
    it('应该直接抛出错误', () => {
      expect(() => {
        I18nError.throw('account.notFound');
      }).to.throw(I18nError);
    });

    it('抛出的错误应包含正确信息', () => {
      try {
        I18nError.throw('account.insufficientBalance', { balance: 50, required: 100 });
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(I18nError);
        expect(error.message).to.include('余额不足');
        expect(error.params).to.deep.equal({ balance: 50, required: 100 });
      }
    });
  });

  describe('静态方法 - assert', () => {
    it('条件为真时不应抛错', () => {
      expect(() => {
        I18nError.assert(true, 'account.notFound');
      }).to.not.throw();
    });

    it('条件为假时应抛错', () => {
      expect(() => {
        I18nError.assert(false, 'account.notFound');
      }).to.throw(I18nError);
    });

    it('应该支持表达式和参数', () => {
      const account = { balance: 50 };

      try {
        I18nError.assert(
          account.balance >= 100,
          'account.insufficientBalance',
          { balance: account.balance, required: 100 }
        );
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).to.be.instanceof(I18nError);
        expect(error.message).to.include('余额不足');
      }
    });
  });

  describe('实例方法 - is', () => {
    it('应该正确判断错误代码', () => {
      const error = new I18nError('account.notFound');

      expect(error.is('account.notFound')).to.be.true;
      expect(error.is('user.notFound')).to.be.false;
    });
  });

  describe('实例方法 - toJSON', () => {
    it('应该返回完整的JSON对象', () => {
      const error = new I18nError('account.insufficientBalance', {
        balance: 50,
        required: 100
      }, 402);

      const json = error.toJSON();

      expect(json).to.deep.equal({
        error: 'I18nError',
        code: 'account.insufficientBalance',
        message: error.message,
        params: { balance: 50, required: 100 },
        statusCode: 402,
        locale: 'zh-CN'
      });
    });
  });

  describe('实例方法 - toString', () => {
    it('应该返回格式化的字符串', () => {
      const error = new I18nError('account.notFound');

      const str = error.toString();

      expect(str).to.equal('I18nError [account.notFound]: 账户不存在');
    });
  });

  describe('dsl.error 快捷方法', () => {
    it('应该提供 create 方法', () => {
      expect(dsl.error.create).to.be.a('function');

      const error = dsl.error.create('account.notFound');
      expect(error).to.be.instanceof(I18nError);
    });

    it('应该提供 throw 方法', () => {
      expect(dsl.error.throw).to.be.a('function');

      expect(() => {
        dsl.error.throw('account.notFound');
      }).to.throw(I18nError);
    });

    it('应该提供 assert 方法', () => {
      expect(dsl.error.assert).to.be.a('function');

      expect(() => {
        dsl.error.assert(false, 'account.notFound');
      }).to.throw(I18nError);
    });
  });

  describe('实际应用场景', () => {
    it('场景1: 账户验证', () => {
      function getAccount(id) {
        const account = id === '123' ? { id: '123', balance: 50, status: 'active' } : null;

        I18nError.assert(account, 'account.notFound');
        I18nError.assert(account.status === 'active', 'account.inactive');
        I18nError.assert(
          account.balance >= 100,
          'account.insufficientBalance',
          { balance: account.balance, required: 100 }
        );

        return account;
      }

      // 测试账户不存在
      expect(() => getAccount(null)).to.throw(I18nError)
        .with.property('code', 'account.notFound');

      // 测试余额不足
      expect(() => getAccount('123')).to.throw(I18nError)
        .with.property('code', 'account.insufficientBalance');
    });

    it('场景2: 用户权限验证', () => {
      function checkPermission(user) {
        I18nError.assert(user, 'user.notFound');
        I18nError.assert(user.role === 'admin', 'user.noPermission');
      }

      const user = { role: 'user' };

      expect(() => checkPermission(user)).to.throw(I18nError)
        .with.property('message', '没有管理员权限');
    });

    it('场景3: Express 中间件', () => {
      // 模拟 Express 错误处理
      function errorHandler(error, req, res, next) {
        if (error instanceof I18nError) {
          return res.status(error.statusCode).json(error.toJSON());
        }
        next(error);
      }

      const error = new I18nError('account.notFound', {}, 404);
      const req = {};
      const res = {
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.jsonData = data;
          return this;
        }
      };

      errorHandler(error, req, res, () => {});

      expect(res.statusCode).to.equal(404);
      expect(res.jsonData).to.have.property('code', 'account.notFound');
      expect(res.jsonData).to.have.property('message', '账户不存在');
    });

    it('场景4: 与 dsl.if 结合使用', () => {
      function validateUser(user) {
        // 使用 dsl.if 验证
        dsl.if(d => !d)
          .message('user.notFound')
          .and(d => !d.isVerified)
          .message('user.notVerified')
          .assert(user);

        // 业务逻辑中使用 I18nError
        I18nError.assert(user.role === 'admin', 'user.noPermission');
      }

      const user = { isVerified: true, role: 'user' };

      expect(() => validateUser(user)).to.throw(I18nError)
        .with.property('message', '没有管理员权限');
    });
  });

  describe('边界情况', () => {
    it('应该处理不存在的错误代码', () => {
      const error = new I18nError('non.existent.code');

      // 应该返回原始 code
      expect(error.message).to.equal('non.existent.code');
    });

    it('应该处理空参数', () => {
      const error = new I18nError('account.notFound', null);

      expect(error.params).to.deep.equal({});
      expect(error.message).to.equal('账户不存在');
    });

    it('应该保持堆栈跟踪', () => {
      const error = new I18nError('account.notFound');

      expect(error.stack).to.be.a('string');
      expect(error.stack).to.include('I18nError');
    });
  });

  describe('多语言参数插值', () => {
    it('应该支持中文参数', () => {
      const error = new I18nError('error.notFound', { resource: '用户' });

      expect(error.message).to.equal('找不到用户');
    });

    it('应该支持英文参数', () => {
      Locale.setLocale('en-US');
      const error = new I18nError('error.notFound', { resource: 'User' });

      expect(error.message).to.equal('User not found');
    });

    it('应该支持数字参数', () => {
      const error = new I18nError('account.insufficientCredits', {
        credits: 10,
        required: 100
      });

      expect(error.message).to.include('10');
      expect(error.message).to.include('100');
    });
  });
});

