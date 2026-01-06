/**
 * 测试 .and() 和 .or() 后调用 .message() 的独立消息功能
 *
 * @version 1.1.0
 */

const { expect } = require('chai');
const { dsl } = require('../../index');

describe('ConditionalBuilder - .and()/.or() 独立消息', () => {
  describe('.and() 独立消息', () => {
    it('应该支持为 .and() 条件设置独立消息', () => {
      const amount = 100;
      const account = { tradable_credits: 50 };

      try {
        dsl.if(d => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and(d => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('INSUFFICIENT_TRADABLE_CREDITS');
      }
    });

    it('第一个条件失败时应该返回第一个消息', () => {
      const amount = 100;

      try {
        dsl.if(d => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and(d => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(null);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('ACCOUNT_NOT_FOUND');
      }
    });

    it('所有条件通过时不应抛错', () => {
      const amount = 100;
      const account = { tradable_credits: 150 };

      const result = dsl.if(d => !d)
        .message('ACCOUNT_NOT_FOUND')
        .and(d => d.tradable_credits < amount)
        .message('INSUFFICIENT_TRADABLE_CREDITS')
        .validate(account);

      expect(result.valid).to.be.true;
    });

    it('应该支持多个 .and() 条件各有独立消息', () => {
      const amount = 100;
      const account = { tradable_credits: 50, status: 'inactive' };

      try {
        dsl.if(d => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and(d => d.status !== 'active')
          .message('ACCOUNT_INACTIVE')
          .and(d => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account);

        expect.fail('应该抛出错误');
      } catch (error) {
        // 第一个失败的 .and() 条件的消息
        expect(error.message).to.equal('ACCOUNT_INACTIVE');
      }
    });

    it('最后一个 .and() 条件失败时应返回其消息', () => {
      const amount = 100;
      const account = { tradable_credits: 50, status: 'active' };

      try {
        dsl.if(d => !d)
          .message('ACCOUNT_NOT_FOUND')
          .and(d => d.status !== 'active')
          .message('ACCOUNT_INACTIVE')
          .and(d => d.tradable_credits < amount)
          .message('INSUFFICIENT_TRADABLE_CREDITS')
          .assert(account);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('INSUFFICIENT_TRADABLE_CREDITS');
      }
    });
  });

  describe('.or() 独立消息', () => {
    it('应该支持为 .or() 条件设置独立消息', () => {
      const data = { age: 16, isBlocked: false };

      try {
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .or(d => d.isBlocked)
          .message('账户已被封禁')
          .assert(data);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('未成年用户不能注册');
      }
    });

    it('.or() 的第二个条件满足时应返回其消息', () => {
      const data = { age: 25, isBlocked: true };

      try {
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .or(d => d.isBlocked)
          .message('账户已被封禁')
          .assert(data);

        expect.fail('应该抛出错误');
      } catch (error) {
        // or 条件：只要有一个为 true 就失败
        expect(error.message).to.equal('账户已被封禁');
      }
    });
  });

  describe('混合 .and() 和 .or()', () => {
    it('应该正确处理混合条件的独立消息', () => {
      const data = { age: 16, role: 'user', credits: 50 };

      try {
        dsl.if(d => d.age < 18)
          .message('未成年')
          .or(d => d.role !== 'admin')
          .message('非管理员')
          .and(d => d.credits < 100)
          .message('积分不足')
          .assert(data);

        expect.fail('应该抛出错误');
      } catch (error) {
        // 第一个条件（age < 18）为 true
        expect(error.message).to.equal('未成年');
      }
    });
  });

  describe('向后兼容性', () => {
    it('不使用 .and() 时应保持原有行为', () => {
      try {
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .assert({ age: 16 });

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('未成年用户不能注册');
      }
    });

    it('.and() 后不调用 .message() 应使用整体消息', () => {
      try {
        dsl.if(d => !d)
          .message('整体错误')
          .and(d => d < 100)
          .assert(50);

        expect.fail('应该抛出错误');
      } catch (error) {
        // 没有为 .and() 设置独立消息，使用整体消息
        expect(error.message).to.equal('整体错误');
      }
    });
  });

  describe('实际应用场景', () => {
    it('场景1: 账户验证 - 存在性和余额检查', () => {
      const amount = 100;
      const account = { tradable_credits: 50 };

      const result = dsl.if(d => !d)
        .message('ACCOUNT_NOT_FOUND')
        .and(d => d.tradable_credits < amount)
        .message('INSUFFICIENT_TRADABLE_CREDITS')
        .validate(account);

      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('INSUFFICIENT_TRADABLE_CREDITS');
    });

    it('场景2: 用户权限验证', () => {
      const user = { role: 'user', isVerified: false };

      try {
        dsl.if(d => d.role !== 'admin')
          .message('NO_ADMIN_PERMISSION')
          .and(d => !d.isVerified)
          .message('USER_NOT_VERIFIED')
          .assert(user);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('NO_ADMIN_PERMISSION');
      }
    });

    it('场景3: 订单状态检查', () => {
      const order = { status: 'pending', payment: null };

      try {
        dsl.if(d => d.status !== 'paid')
          .message('ORDER_NOT_PAID')
          .and(d => !d.payment)
          .message('PAYMENT_INFO_MISSING')
          .assert(order);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('ORDER_NOT_PAID');
      }
    });
  });

  describe('其他验证方法', () => {
    it('.validate() 方法应返回完整的验证结果', () => {
      const account = { balance: 50 };
      const result = dsl.if(d => !d)
        .message('NOT_FOUND')
        .and(d => d.balance < 100)
        .message('INSUFFICIENT')
        .validate(account);

      expect(result).to.have.property('valid');
      expect(result).to.have.property('errors');
      expect(result.valid).to.be.false;
      expect(result.errors).to.be.an('array');
      expect(result.errors[0].message).to.equal('INSUFFICIENT');
    });

    it('.check() 方法应只返回 boolean', () => {
      const account = { balance: 150 };
      const isValid = dsl.if(d => !d)
        .message('NOT_FOUND')
        .and(d => d.balance < 100)
        .message('INSUFFICIENT')
        .check(account);

      expect(isValid).to.be.a('boolean');
      expect(isValid).to.be.true;
    });

    it('.validateAsync() 方法应返回 Promise', async () => {
      const account = { balance: 150 };

      const promise = dsl.if(d => !d)
        .message('NOT_FOUND')
        .and(d => d.balance < 100)
        .message('INSUFFICIENT')
        .validateAsync(account);

      expect(promise).to.be.instanceof(Promise);
      const result = await promise;
      expect(result).to.deep.equal(account);
    });

    it('.validateAsync() 失败应抛出异常', async () => {
      const account = { balance: 50 };

      try {
        await dsl.if(d => !d)
          .message('NOT_FOUND')
          .and(d => d.balance < 100)
          .message('INSUFFICIENT')
          .validateAsync(account);

        expect.fail('应该抛出异常');
      } catch (error) {
        // validateAsync 的错误消息格式：'Validation failed: {原始消息}'
        expect(error.message).to.include('INSUFFICIENT');
      }
    });
  });

  describe('边界值测试', () => {
    it('应该正确处理空字符串', () => {
      try {
        dsl.if(d => d === '')
          .message('EMPTY_STRING')
          .and(d => d.length === 0)
          .message('ZERO_LENGTH')
          .assert('');

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('EMPTY_STRING');
      }
    });

    it('应该正确处理数字 0', () => {
      try {
        dsl.if(d => d === 0)
          .message('IS_ZERO')
          .and(d => d < 10)
          .message('LESS_THAN_TEN')
          .assert(0);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('IS_ZERO');
      }
    });

    it('应该正确处理 false', () => {
      try {
        dsl.if(d => d === false)
          .message('IS_FALSE')
          .and(d => !d)
          .message('IS_FALSY')
          .assert(false);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('IS_FALSE');
      }
    });
  });

  describe('多条件测试', () => {
    it('应该支持三个 .and() 条件', () => {
      const data = { a: 1, b: 2, c: 3 };

      try {
        dsl.if(d => d.a === 1)
          .message('A_IS_ONE')
          .and(d => d.b === 2)
          .message('B_IS_TWO')
          .and(d => d.c === 3)
          .message('C_IS_THREE')
          .assert(data);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('A_IS_ONE');
      }
    });

    it('应该支持四个以上 .and() 条件', () => {
      const data = { a: false, b: false, c: false, d: true };

      try {
        dsl.if(d => d.a)
          .message('A')
          .and(d => d.b)
          .message('B')
          .and(d => d.c)
          .message('C')
          .and(d => d.d)
          .message('D')
          .assert(data);

        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error.message).to.equal('D');
      }
    });
  });

  describe('错误消息格式', () => {
    it('错误对象应包含 message 属性', () => {
      const result = dsl.if(d => d.invalid)
        .message('INVALID_DATA')
        .and(d => d.error)
        .message('HAS_ERROR')
        .validate({ invalid: true, error: false });

      expect(result.errors[0]).to.have.property('message');
      expect(result.errors[0].message).to.be.a('string');
    });

    it('错误对象应包含完整信息', () => {
      const result = dsl.if(d => d.test)
        .message('TEST_FAILED')
        .validate({ test: true });

      expect(result.errors[0]).to.have.property('message');
      expect(result.errors[0]).to.have.property('path');
      expect(result.errors[0]).to.have.property('keyword');
    });
  });
});

