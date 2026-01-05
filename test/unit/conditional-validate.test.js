/**
 * ConditionalBuilder 快捷验证方法测试
 *
 * 测试 .validate() 和 .check() 方法
 */

const { expect } = require('chai');
const { dsl } = require('../../index');

describe('ConditionalBuilder - 快捷验证方法', () => {
  describe('.validate() 方法', () => {
    it('应该返回完整验证结果', () => {
      const result = dsl.if(d => d.age < 18)
        .message('未成年用户不能注册')
        .validate({ age: 16 });

      expect(result).to.have.property('valid');
      expect(result).to.have.property('errors');
      expect(result).to.have.property('data');
      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('未成年用户不能注册');
    });

    it('应该支持一行代码验证', () => {
      // ✅ 一行代码完成验证
      const result = dsl.if(d => d.age < 18)
        .message('未成年用户不能注册')
        .validate({ age: 16 });

      expect(result.valid).to.be.false;
    });

    it('应该支持复用验证器', () => {
      // 创建验证器
      const ageValidator = dsl.if(d => d.age < 18).message('未成年');

      // 多次验证
      const r1 = ageValidator.validate({ age: 16 });
      expect(r1.valid).to.be.false;

      const r2 = ageValidator.validate({ age: 20 });
      expect(r2.valid).to.be.true;
    });

    it('应该支持 then/else', () => {
      // 使用对象Schema包装的方式
      const schema = dsl({
        userType: 'string!',
        email: dsl.if(d => d.userType === 'admin')
          .then('email!')
          .else('email')
      });

      const { validate } = require('../../index');
      const result = validate(schema, { userType: 'admin', email: 'test@example.com' });
      expect(result.valid).to.be.true;
    });

    it('应该支持非对象类型（字符串）', () => {
      const result = dsl.if(d => typeof d === 'string' && d.includes('@'))
        .then('email!')
        .else('string:1-50')
        .validate('test@example.com');

      expect(result.valid).to.be.true;
    });

    it('应该支持非对象类型（数组）', () => {
      const result = dsl.if(d => Array.isArray(d) && d.length > 5)
        .message('数组最多5个元素')
        .validate([1, 2, 3]);

      expect(result.valid).to.be.true;

      const result2 = dsl.if(d => Array.isArray(d) && d.length > 5)
        .message('数组最多5个元素')
        .validate([1, 2, 3, 4, 5, 6]);

      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('数组最多5个元素');
    });

    it('应该支持验证选项（locale）', () => {
      const result = dsl.if(d => d.age < 18)
        .message('conditional.underAge')
        .validate({ age: 16 }, { locale: 'zh-CN' });

      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('未成年用户不能注册');
    });

    it('应该支持多条件组合', () => {
      // age=20（成年） AND userType='user'（非管理员）→ 条件不满足 → 通过验证
      const result = dsl.if(d => d.age >= 18)
        .and(d => d.userType === 'admin')
        .message('只有成年管理员可以操作')
        .validate({ age: 20, userType: 'user' });

      expect(result.valid).to.be.true;  // AND 条件不完全满足，所以通过

      // age=20（成年） AND userType='admin'（管理员）→ 条件满足 → 抛错
      const result2 = dsl.if(d => d.age >= 18)
        .and(d => d.userType === 'admin')
        .message('只有成年管理员可以操作')
        .validate({ age: 20, userType: 'admin' });

      expect(result2.valid).to.be.false;  // 条件满足，抛错
    });

    it('应该支持 elseIf', () => {
      // 使用对象Schema包装
      const schema = dsl({
        userType: 'string!',
        email: dsl.if(d => d.userType === 'admin')
          .then('email!')
          .elseIf(d => d.userType === 'vip')
          .then('email')
          .else(null)
      });

      const { validate } = require('../../index');

      const r1 = validate(schema, { userType: 'admin', email: 'admin@example.com' });
      expect(r1.valid).to.be.true;

      const r2 = validate(schema, { userType: 'vip', email: 'vip@example.com' });
      expect(r2.valid).to.be.true;

      const r3 = validate(schema, { userType: 'user' });
      expect(r3.valid).to.be.true;
    });
  });

  describe('.check() 方法', () => {
    it('应该只返回 boolean', () => {
      const isValid = dsl.if(d => d.age < 18)
        .message('未成年')
        .check({ age: 16 });

      expect(isValid).to.be.a('boolean');
      expect(isValid).to.be.false;
    });

    it('应该在条件满足时返回 false', () => {
      const isValid = dsl.if(d => d.age < 18)
        .message('未成年')
        .check({ age: 16 });

      expect(isValid).to.be.false;
    });

    it('应该在条件不满足时返回 true', () => {
      const isValid = dsl.if(d => d.age < 18)
        .message('未成年')
        .check({ age: 20 });

      expect(isValid).to.be.true;
    });

    it('应该支持断言场景', () => {
      const validator = dsl.if(d => d.age < 18).message('未成年');

      // 断言场景
      if (!validator.check({ age: 20 })) {
        throw new Error('验证失败');
      }

      // 应该不抛错
      expect(true).to.be.true;
    });

    it('应该支持复用', () => {
      const canRegister = dsl.if(d => d.age < 18)
        .or(d => d.status === 'blocked')
        .message('不允许注册');

      expect(canRegister.check({ age: 16, status: 'active' })).to.be.false;
      expect(canRegister.check({ age: 20, status: 'blocked' })).to.be.false;
      expect(canRegister.check({ age: 20, status: 'active' })).to.be.true;
    });
  });

  describe('对比原有方式', () => {
    it('.validate() 应该与 validate() 函数结果一致', () => {
      const { validate } = require('../../index');

      const conditionalSchema = dsl.if(d => d.age < 18).message('未成年');

      // 原方式
      const result1 = validate(conditionalSchema, { age: 16 });

      // 新方式
      const result2 = conditionalSchema.validate({ age: 16 });

      expect(result1.valid).to.equal(result2.valid);
      expect(result1.errors[0].message).to.equal(result2.errors[0].message);
    });

    it('新方式应该更简洁', () => {
      const { validate } = require('../../index');

      // 原方式（2行）
      const schema = dsl.if(d => d.age < 18).message('未成年');
      const result1 = validate(schema, { age: 16 });

      // 新方式（1行）✅
      const result2 = dsl.if(d => d.age < 18)
        .message('未成年')
        .validate({ age: 16 });

      expect(result1.valid).to.equal(result2.valid);
    });
  });

  describe('.validateAsync() 方法', () => {
    it('应该返回 Promise', () => {
      const result = dsl.if(d => d.age < 18)
        .message('未成年')
        .validateAsync({ age: 20 });

      expect(result).to.be.instanceOf(Promise);
    });

    it('验证通过应该返回数据', async () => {
      const data = await dsl.if(d => d.age < 18)
        .message('未成年')
        .validateAsync({ age: 20 });

      expect(data).to.deep.equal({ age: 20 });
    });

    it('验证失败应该抛出异常', async () => {
      try {
        await dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .validateAsync({ age: 16 });

        // 不应该执行到这里
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.message).to.include('未成年用户不能注册');
        expect(error.errors).to.be.an('array');
      }
    });

    it('应该支持多语言', async () => {
      try {
        await dsl.if(d => d.age < 18)
          .message('conditional.underAge')
          .validateAsync({ age: 16 }, { locale: 'zh-CN' });

        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.message).to.include('未成年用户不能注册');
      }
    });

    it('应该支持复用', async () => {
      const validator = dsl.if(d => d.age < 18).message('未成年');

      // 验证通过
      const data1 = await validator.validateAsync({ age: 20 });
      expect(data1).to.deep.equal({ age: 20 });

      // 验证失败
      try {
        await validator.validateAsync({ age: 16 });
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });

    it('应该支持 then/else', async () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl.if(d => d.userType === 'admin')
          .then('email!')
          .else('email')
      });

      const { validateAsync } = require('../../index');

      // 管理员有邮箱 - 通过
      const data1 = await validateAsync(schema, {
        userType: 'admin',
        email: 'admin@example.com'
      });
      expect(data1.userType).to.equal('admin');

      // 管理员无邮箱 - 失败
      try {
        await validateAsync(schema, { userType: 'admin', email: '' });
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
      }
    });
  });

  describe('.assert() 方法', () => {
    it('验证通过应该返回数据', () => {
      const data = dsl.if(d => d.age < 18)
        .message('未成年')
        .assert({ age: 20 });

      expect(data).to.deep.equal({ age: 20 });
    });

    it('验证失败应该同步抛出异常', () => {
      try {
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .assert({ age: 16 });

        // 不应该执行到这里
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.message).to.equal('未成年用户不能注册');
        expect(error.errors).to.be.an('array');
      }
    });

    it('应该支持复用', () => {
      const validator = dsl.if(d => d.age < 18).message('未成年');

      // 验证通过
      const data1 = validator.assert({ age: 20 });
      expect(data1).to.deep.equal({ age: 20 });

      // 验证失败
      try {
        validator.assert({ age: 16 });
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.message).to.equal('未成年');
      }
    });

    it('应该支持在函数中快速断言', () => {
      function registerUser(userData) {
        // 断言验证
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .assert(userData);

        return { success: true, user: userData };
      }

      // 验证通过
      const result1 = registerUser({ age: 20 });
      expect(result1.success).to.be.true;

      // 验证失败
      try {
        registerUser({ age: 16 });
        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.message).to.equal('未成年用户不能注册');
      }
    });

    it('应该支持多语言', () => {
      try {
        dsl.if(d => d.age < 18)
          .message('conditional.underAge')
          .assert({ age: 16 }, { locale: 'zh-CN' });

        expect.fail('应该抛出异常');
      } catch (error) {
        expect(error.message).to.equal('未成年用户不能注册');
      }
    });

    it('应该包含完整的错误信息', () => {
      try {
        dsl.if(d => d.age < 18)
          .message('未成年用户不能注册')
          .assert({ age: 16 });
      } catch (error) {
        expect(error.name).to.equal('ValidationError');
        expect(error.message).to.equal('未成年用户不能注册');
        expect(error.errors).to.be.an('array');
        expect(error.errors[0]).to.have.property('message');
        expect(error.errors[0]).to.have.property('path');
        expect(error.errors[0]).to.have.property('keyword');
      }
    });
  });

  describe('边界情况测试', () => {
    it('应该处理 null 值', () => {
      const result = dsl.if(d => d === null)
        .message('不能为空')
        .validate(null);

      expect(result.valid).to.be.false;
      expect(result.errors[0].message).to.equal('不能为空');
    });

    it('应该处理 undefined 值', () => {
      const result = dsl.if(d => d === undefined)
        .message('未定义')
        .validate(undefined);

      expect(result.valid).to.be.false;
    });

    it('应该处理空字符串', () => {
      const result = dsl.if(d => d === '')
        .message('空字符串')
        .validate('');

      expect(result.valid).to.be.false;
    });

    it('应该处理空对象', () => {
      const result = dsl.if(d => Object.keys(d).length === 0)
        .message('空对象')
        .validate({});

      expect(result.valid).to.be.false;
    });

    it('应该处理空数组', () => {
      const result = dsl.if(d => Array.isArray(d) && d.length === 0)
        .message('空数组')
        .validate([]);

      expect(result.valid).to.be.false;
    });

    it('应该处理数字 0', () => {
      const result = dsl.if(d => d === 0)
        .message('不能为0')
        .validate(0);

      expect(result.valid).to.be.false;
    });

    it('应该处理布尔值 false', () => {
      const result = dsl.if(d => d === false)
        .message('不能为false')
        .validate(false);

      expect(result.valid).to.be.false;
    });

    it('应该处理 NaN', () => {
      const result = dsl.if(d => isNaN(d))
        .message('不是数字')
        .validate(NaN);

      expect(result.valid).to.be.false;
    });

    it('应该处理条件函数抛错', () => {
      const result = dsl.if(() => {
        throw new Error('条件函数错误');
      })
        .message('测试')
        .validate({ age: 20 });

      // 条件函数抛错，视为不满足，验证通过
      expect(result.valid).to.be.true;
    });

    it('应该处理复杂嵌套对象', () => {
      const result = dsl.if(d => d.user && d.user.profile && d.user.profile.age < 18)
        .message('未成年')
        .validate({
          user: {
            profile: {
              age: 16,
              name: 'test'
            }
          }
        });

      expect(result.valid).to.be.false;
    });

    it('应该处理访问不存在的属性', () => {
      const result = dsl.if(d => {
        try {
          return d.user.age < 18;
        } catch (e) {
          return false;
        }
      })
        .message('未成年')
        .validate({});

      // 访问不存在属性，条件返回false，验证通过
      expect(result.valid).to.be.true;
    });
  });

  describe('特殊场景测试', () => {
    it('应该支持链式 AND 条件', () => {
      // 所有 AND 条件都满足 → 抛错
      const result1 = dsl.if(d => d.age >= 18)
        .and(d => d.age <= 65)
        .and(d => d.status === 'active')
        .message('不符合条件')
        .validate({ age: 30, status: 'active' });

      expect(result1.valid).to.be.false;  // 条件满足，抛错

      // AND 条件不完全满足 → 通过
      const result2 = dsl.if(d => d.age >= 18)
        .and(d => d.age <= 65)
        .and(d => d.status === 'active')
        .message('不符合条件')
        .validate({ age: 30, status: 'inactive' });

      expect(result2.valid).to.be.true;  // 条件不满足，通过
    });

    it('应该支持链式 OR 条件', () => {
      // 任一 OR 条件满足 → 抛错
      const result1 = dsl.if(d => d.role === 'admin')
        .or(d => d.role === 'moderator')
        .or(d => d.role === 'superuser')
        .message('权限不足')
        .validate({ role: 'moderator' });

      expect(result1.valid).to.be.false;  // 条件满足，抛错

      // 所有 OR 条件都不满足 → 通过
      const result2 = dsl.if(d => d.role === 'admin')
        .or(d => d.role === 'moderator')
        .or(d => d.role === 'superuser')
        .message('权限不足')
        .validate({ role: 'user' });

      expect(result2.valid).to.be.true;  // 条件不满足，通过
    });

    it('应该支持 AND 和 OR 混合', () => {
      // (age >= 18 AND verified) OR role=admin
      // 情况1: admin → 抛错
      const result1 = dsl.if(d => d.age >= 18)
        .and(d => d.verified === true)
        .or(d => d.role === 'admin')
        .message('不符合')
        .validate({ age: 16, verified: false, role: 'admin' });

      expect(result1.valid).to.be.false;  // admin 满足 OR，抛错

      // 情况2: 成年且已验证 → 抛错
      const result2 = dsl.if(d => d.age >= 18)
        .and(d => d.verified === true)
        .or(d => d.role === 'admin')
        .message('不符合')
        .validate({ age: 20, verified: true, role: 'user' });

      expect(result2.valid).to.be.false;  // AND 条件满足，抛错

      // 情况3: 都不满足 → 通过
      const result3 = dsl.if(d => d.age >= 18)
        .and(d => d.verified === true)
        .or(d => d.role === 'admin')
        .message('不符合')
        .validate({ age: 16, verified: false, role: 'user' });

      expect(result3.valid).to.be.true;  // 都不满足，通过
    });

    it('应该支持条件嵌套', () => {
      const result = dsl.if(d => {
        if (d.type === 'premium') {
          return d.price < 100;  // premium 便宜了
        } else {
          return d.price > 1000;  // 普通太贵了
        }
      })
        .message('价格不合理')
        .validate({ type: 'premium', price: 50 });

      expect(result.valid).to.be.false;
    });

    it('应该支持正则表达式条件', () => {
      const result = dsl.if(d => /^\d+$/.test(d))
        .message('只能是纯数字')
        .validate('abc123');

      expect(result.valid).to.be.true;  // 不满足条件，验证通过
    });

    it('应该支持数组方法条件', () => {
      const result = dsl.if(d => d.some(x => x < 0))
        .message('不能包含负数')
        .validate([1, 2, -3, 4]);

      expect(result.valid).to.be.false;
    });
  });
});
