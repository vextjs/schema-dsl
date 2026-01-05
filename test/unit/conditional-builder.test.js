/**
 * ConditionalBuilder 单元测试
 *
 * 测试链式条件构建器的所有功能
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../index');

describe('ConditionalBuilder - 链式条件构建器', () => {
  describe('基础功能', () => {
    it('应该支持简单条件 + message（不满足抛错）', () => {
      const schema = dsl({
        age: 'number!',
        status: dsl.if((data) => data.age < 18)  // ✅ 如果是未成年人
          .message('未成年用户不能注册')         // 抛出错误
      });

      // 不满足条件（age >= 18，成年）- 验证通过
      const result1 = validate(schema, { age: 20, status: 'active' });
      expect(result1.valid).to.be.true;

      // 满足条件（age < 18，未成年）- 抛错
      const result2 = validate(schema, { age: 16, status: 'active' });
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('未成年用户不能注册');
    });

    it('应该支持条件 + then（动态Schema）', () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl.if((data) => data.userType === 'admin')
          .then('email!')
          .else('email')
      });

      // 管理员 - email 必填
      const result1 = validate(schema, { userType: 'admin', email: '' });
      expect(result1.valid).to.be.false;

      const result2 = validate(schema, { userType: 'admin', email: 'admin@example.com' });
      expect(result2.valid).to.be.true;

      // 普通用户 - email 可选
      const result3 = validate(schema, { userType: 'user', email: '' });
      expect(result3.valid).to.be.true;
    });

    it('应该支持 else 可选（不写 else 就不验证）', () => {
      const schema = dsl({
        userType: 'string!',
        vipLevel: dsl.if((data) => data.userType === 'vip')
          .then('enum:gold|silver|bronze!')
          // 不写 else，非 vip 用户不验证
      });

      // vip 用户必须有 vipLevel
      const result1 = validate(schema, { userType: 'vip', vipLevel: 'gold' });
      expect(result1.valid).to.be.true;

      const result2 = validate(schema, { userType: 'vip' });
      expect(result2.valid).to.be.false;

      // 普通用户不验证 vipLevel
      const result3 = validate(schema, { userType: 'user' });
      expect(result3.valid).to.be.true;

      const result4 = validate(schema, { userType: 'user', vipLevel: 'invalid' });
      expect(result4.valid).to.be.true; // 不验证
    });
  });

  describe('多条件组合', () => {
    it('应该支持 AND 条件', () => {
      const schema = dsl({
        age: 'number!',
        userType: 'string!',
        email: dsl.if((data) => data.age >= 18)
          .and((data) => data.userType === 'admin')
          .then('email!')
          .else('email')
      });

      // 满足两个条件 - email 必填
      const result1 = validate(schema, { age: 20, userType: 'admin', email: '' });
      expect(result1.valid).to.be.false;

      // 只满足一个条件 - email 可选
      const result2 = validate(schema, { age: 20, userType: 'user', email: '' });
      expect(result2.valid).to.be.true;

      const result3 = validate(schema, { age: 16, userType: 'admin', email: '' });
      expect(result3.valid).to.be.true;
    });

    it('应该支持 OR 条件', () => {
      const schema = dsl({
        age: 'number!',
        status: 'string!',
        reason: dsl.if((data) => data.age < 18)  // 未成年
          .or((data) => data.status === 'blocked')  // 或被封禁
          .message('不允许注册')  // 满足任一条件就抛错
      });

      // 满足第一个条件（未成年） - 抛错
      const result1 = validate(schema, { age: 16, status: 'active', reason: 'test' });
      expect(result1.valid).to.be.false;
      expect(result1.errors[0].message).to.equal('不允许注册');

      // 满足第二个条件（被封禁） - 抛错
      const result2 = validate(schema, { age: 20, status: 'blocked', reason: 'test' });
      expect(result2.valid).to.be.false;

      // 都不满足（成年且未封禁） - 验证通过
      const result3 = validate(schema, { age: 20, status: 'active', reason: 'test' });
      expect(result3.valid).to.be.true;
    });

    it('应该支持多个 AND/OR 组合', () => {
      const schema = dsl({
        age: 'number!',
        userType: 'string!',
        status: 'string!',
        email: dsl.if((data) => data.age >= 18)
          .and((data) => data.userType === 'admin')
          .or((data) => data.status === 'vip')
          .then('email!')
          .else('email')
      });

      // (age>=18 AND userType=admin) OR status=vip
      const result1 = validate(schema, { age: 20, userType: 'admin', status: 'normal', email: '' });
      expect(result1.valid).to.be.false; // 需要 email

      const result2 = validate(schema, { age: 16, userType: 'user', status: 'vip', email: '' });
      expect(result2.valid).to.be.false; // 需要 email

      const result3 = validate(schema, { age: 16, userType: 'user', status: 'normal', email: '' });
      expect(result3.valid).to.be.true; // 不需要 email
    });
  });

  describe('elseIf 分支', () => {
    it('应该支持 elseIf 多分支', () => {
      const schema = dsl({
        userType: 'string!',
        permissions: dsl.if((data) => data.userType === 'admin')
          .then('array<string>!')
          .elseIf((data) => data.userType === 'vip')
          .then('array<string>')
          .else(null)
      });

      // admin - 必填
      const result1 = validate(schema, { userType: 'admin' });
      expect(result1.valid).to.be.false;

      const result2 = validate(schema, { userType: 'admin', permissions: ['read', 'write'] });
      expect(result2.valid).to.be.true;

      // vip - 可选
      const result3 = validate(schema, { userType: 'vip' });
      expect(result3.valid).to.be.true;

      const result4 = validate(schema, { userType: 'vip', permissions: ['read'] });
      expect(result4.valid).to.be.true;

      // guest - 不验证
      const result5 = validate(schema, { userType: 'guest' });
      expect(result5.valid).to.be.true;
    });

    it('应该支持多个 elseIf + and/or', () => {
      const schema = dsl({
        age: 'number!',
        userType: 'string!',
        level: dsl.if((data) => data.age >= 18)
          .and((data) => data.userType === 'admin')
          .then('enum:high|medium|low!')  // ✅ 使用管道符分隔
          .elseIf((data) => data.age >= 18)
          .then('enum:high|medium|low!')
          .else('enum:high|medium|low!')
      });

      // 成年管理员 - high
      const result1 = validate(schema, { age: 20, userType: 'admin', level: 'high' });
      expect(result1.valid).to.be.true;

      // 成年普通用户 - medium
      const result2 = validate(schema, { age: 20, userType: 'user', level: 'medium' });
      expect(result2.valid).to.be.true;

      // 未成年 - low
      const result3 = validate(schema, { age: 16, userType: 'user', level: 'low' });
      expect(result3.valid).to.be.true;
    });
  });

  describe('边界情况', () => {
    it('应该正确处理条件函数返回非布尔值', () => {
      const schema = dsl({
        value: 'number!',
        result: dsl.if((data) => data.value) // 0 是 falsy
          .then('string!')
          .else(null)
      });

      // value = 0 (falsy) - 不验证
      const result1 = validate(schema, { value: 0 });
      expect(result1.valid).to.be.true;

      // value = 1 (truthy) - 必填
      const result2 = validate(schema, { value: 1 });
      expect(result2.valid).to.be.false;

      const result3 = validate(schema, { value: 1, result: 'ok' });
      expect(result3.valid).to.be.true;
    });

    it('应该正确处理条件函数抛错', () => {
      const schema = dsl({
        obj: 'object!',
        result: dsl.if((data) => data.obj.nested.value > 10)
          .then('string!')
          .else(null)
      });

      // 访问不存在的属性会抛错，视为条件不满足
      const result1 = validate(schema, { obj: {} });
      expect(result1.valid).to.be.true; // 执行 else，不验证

      const result2 = validate(schema, { obj: { nested: { value: 15 } }, result: 'ok' });
      expect(result2.valid).to.be.true;
    });

    it('应该正确处理 else 为 null（跳过验证）', () => {
      const schema = dsl({
        userType: 'string!',
        adminCode: dsl.if((data) => data.userType === 'admin')
          .then('string:6!')
          .else(null) // 显式 null
      });

      // 管理员必须有 adminCode
      const result1 = validate(schema, { userType: 'admin' });
      expect(result1.valid).to.be.false;

      // 普通用户不验证 adminCode
      const result2 = validate(schema, { userType: 'user' });
      expect(result2.valid).to.be.true;

      const result3 = validate(schema, { userType: 'user', adminCode: 'invalid' });
      expect(result3.valid).to.be.true; // 不验证
    });

    it('应该支持嵌套的 dsl.if()', () => {
      const schema = dsl({
        userType: 'string!',
        age: 'number!',
        email: dsl.if((data) => data.userType === 'admin')
          .then(
            dsl.if((data) => data.age >= 18)
              .then('email!')
              .else('email')
          )
          .else('email')
      });

      // 成年管理员 - email 必填
      const result1 = validate(schema, { userType: 'admin', age: 20, email: '' });
      expect(result1.valid).to.be.false;

      // 未成年管理员 - email 可选
      const result2 = validate(schema, { userType: 'admin', age: 16, email: '' });
      expect(result2.valid).to.be.true;

      // 普通用户 - email 可选
      const result3 = validate(schema, { userType: 'user', age: 20, email: '' });
      expect(result3.valid).to.be.true;
    });
  });

  describe('参数验证', () => {
    it('应该验证条件函数参数', () => {
      expect(() => {
        dsl.if('not a function');
      }).to.throw('Condition must be a function');

      expect(() => {
        dsl.if(() => true).and('not a function');
      }).to.throw('Condition must be a function');

      expect(() => {
        dsl.if(() => true).or(123);
      }).to.throw('Condition must be a function');

      expect(() => {
        dsl.if(() => true).elseIf(null);
      }).to.throw('Condition must be a function');
    });

    it('应该验证 message 参数', () => {
      expect(() => {
        dsl.if(() => true).message(123);
      }).to.throw('Message must be a string');

      expect(() => {
        dsl.if(() => true).message(null);
      }).to.throw('Message must be a string');
    });

    it('应该验证链式调用顺序', () => {
      expect(() => {
        const builder = new (require('../../lib/core/ConditionalBuilder'))();
        builder.and(() => true); // 没有先调用 if
      }).to.throw('.and() must follow .if() or .elseIf()');

      expect(() => {
        const builder = new (require('../../lib/core/ConditionalBuilder'))();
        builder.or(() => true);
      }).to.throw('.or() must follow .if() or .elseIf()');

      expect(() => {
        const builder = new (require('../../lib/core/ConditionalBuilder'))();
        builder.message('test');
      }).to.throw('.message() must follow .if() or .elseIf()');

      expect(() => {
        const builder = new (require('../../lib/core/ConditionalBuilder'))();
        builder.then('string');
      }).to.throw('.then() must follow .if() or .elseIf()');

      expect(() => {
        const builder = new (require('../../lib/core/ConditionalBuilder'))();
        builder.elseIf(() => true);
      }).to.throw('.elseIf() must follow .if()');
    });
  });

  describe('向后兼容性', () => {
    it('应该不影响现有的 dsl 功能', () => {
      const schema = dsl({
        username: 'string:3-32!',
        email: 'email!',
        age: 'number:18-120'
      });

      const result = validate(schema, {
        username: 'test',
        email: 'test@example.com',
        age: 25
      });

      expect(result.valid).to.be.true;
    });

    it('应该可以与其他 dsl 方法混用', () => {
      const schema = dsl({
        userType: 'string!',
        email: dsl('email!').label('邮箱地址'),
        permissions: dsl.if((data) => data.userType === 'admin')
          .then('array<string>!')
          .else(null)
      });

      const result = validate(schema, {
        userType: 'admin',
        email: 'admin@example.com',
        permissions: ['read', 'write']
      });

      expect(result.valid).to.be.true;
    });
  });

  describe('实际场景', () => {
    it('用户注册场景：根据年龄和用户类型验证', () => {
      const schema = dsl({
        username: 'string:3-32!',
        age: 'number:1-120!',
        userType: 'enum:admin|vip|user!',  // ✅ 使用管道符分隔

        // 未成年禁止注册（如果 age < 18，抛错）
        ageCheck: dsl.if((data) => data.age < 18)
          .message('未成年用户不能注册'),

        // 管理员必须有邮箱
        email: dsl.if((data) => data.userType === 'admin')
          .then('email!')
          .else('email'),

        // VIP用户必须有手机号
        phone: dsl.if((data) => data.userType === 'vip')
          .then('string:11!')
          .else(null)
      });

      // 成年管理员 - 需要邮箱
      const result1 = validate(schema, {
        username: 'admin1',
        age: 25,
        userType: 'admin',
        email: 'admin@example.com'
      });
      expect(result1.valid).to.be.true;

      // 未成年 - 禁止注册
      const result2 = validate(schema, {
        username: 'kid',
        age: 15,
        userType: 'user'
      });
      expect(result2.valid).to.be.false;
      expect(result2.errors[0].message).to.equal('未成年用户不能注册');

      // VIP 用户 - 需要手机号
      const result3 = validate(schema, {
        username: 'vip1',
        age: 30,
        userType: 'vip',
        phone: '13800138000'
      });
      expect(result3.valid).to.be.true;
    });

    it('商品发布场景：根据商品类型验证不同字段', () => {
      const schema = dsl({
        title: 'string:1-100!',
        type: 'enum:physical|digital|service!',

        // 实体商品需要重量和尺寸
        weight: dsl.if((data) => data.type === 'physical')
          .then('number:0-!')
          .else(null),

        dimensions: dsl.if((data) => data.type === 'physical')
          .then('string!')
          .else(null),

        // 数字商品需要下载链接
        downloadUrl: dsl.if((data) => data.type === 'digital')
          .then('url!')
          .else(null),

        // 服务类需要服务时长
        duration: dsl.if((data) => data.type === 'service')
          .then('number:1-!')
          .else(null)
      });

      // 实体商品
      const result1 = validate(schema, {
        title: '笔记本电脑',
        type: 'physical',
        weight: 1.5,
        dimensions: '30x20x2cm'
      });
      expect(result1.valid).to.be.true;

      // 数字商品
      const result2 = validate(schema, {
        title: '电子书',
        type: 'digital',
        downloadUrl: 'https://example.com/download'
      });
      expect(result2.valid).to.be.true;

      // 服务类
      const result3 = validate(schema, {
        title: '咨询服务',
        type: 'service',
        duration: 60
      });
      expect(result3.valid).to.be.true;
    });
  });
});

