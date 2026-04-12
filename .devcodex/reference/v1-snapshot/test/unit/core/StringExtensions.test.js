/**
 * StringExtensions 完整测试
 */

const { expect } = require('chai');
const { dsl, validate } = require('../../../index');

describe('StringExtensions - 完整测试', () => {

  describe('链式调用基础', () => {
    it('应支持字符串直接调用方法', () => {
      expect(typeof 'string'.pattern).to.equal('function');
      expect(typeof 'string'.label).to.equal('function');
      expect(typeof 'string'.messages).to.equal('function');
      expect(typeof 'string'.description).to.equal('function');
      expect(typeof 'string'.custom).to.equal('function');
      expect(typeof 'string'.default).to.equal('function');
    });

    it('应支持带必填标记的字符串', () => {
      expect(typeof 'string!'.pattern).to.equal('function');
      expect(typeof 'email!'.label).to.equal('function');
    });

    it('应支持带约束的字符串', () => {
      expect(typeof 'string:3-32'.pattern).to.equal('function');
      expect(typeof 'string:10-!'.label).to.equal('function');
    });
  });

  describe('.pattern() 方法', () => {
    it('应添加正则验证', () => {
      const schema = dsl({
        username: 'string!'.pattern(/^[a-zA-Z0-9_]+$/)
      });

      expect(schema.properties.username.pattern).to.exist;
    });

    it('应支持正则字符串', () => {
      const schema = dsl({
        code: 'string!'.pattern('^[A-Z]{3}$')
      });

      expect(schema.properties.code.pattern).to.exist;
    });

    it('应在验证时生效', () => {
      const schema = dsl({
        username: 'string!'.pattern(/^[a-z]+$/)
      });

      expect(validate(schema, { username: 'abc' }).valid).to.be.true;
      expect(validate(schema, { username: 'ABC' }).valid).to.be.false;
    });
  });

  describe('.label() 方法', () => {
    it('应设置字段标签', () => {
      const result = 'string!'.label('用户名');
      expect(result).to.exist;
    });

    it('应支持链式调用', () => {
      const result = 'string:3-32!'
        .label('用户名')
        .pattern(/^[a-z]+$/);
      expect(result).to.exist;
    });
  });

  describe('.messages() 方法', () => {
    it('应设置自定义错误消息', () => {
      const result = 'string:3-32!'.messages({
        'min': '最少3个字符',
        'max': '最多32个字符',
        'required': '不能为空'
      });
      expect(result).to.exist;
    });

    it('应支持模板变量', () => {
      const result = 'string:3-32!'.messages({
        'min': '最少{{#limit}}个字符'
      });
      expect(result).to.exist;
    });
  });

  describe('.description() 方法', () => {
    it('应设置字段描述', () => {
      const result = 'string!'.description('用于登录的用户名');
      expect(result).to.exist;
    });

    it('应支持多行描述', () => {
      const result = 'string!'.description('用户名规则：\n1. 3-32个字符\n2. 只能包含字母和数字');
      expect(result).to.exist;
    });
  });

  describe('.custom() 方法', () => {
    it('应支持同步验证器', () => {
      const result = 'string!'.custom((value) => {
        if (value === 'admin') return '不能使用admin';
        return true;
      });
      expect(result).to.exist;
    });

    it('应支持异步验证器', () => {
      const result = 'email!'.custom(async (value) => {
        // 模拟异步检查
        return new Promise(resolve => {
          setTimeout(() => resolve(true), 10);
        });
      });
      expect(result).to.exist;
    });

    it('应支持返回错误对象', () => {
      const result = 'string!'.custom((value) => {
        if (value === 'test') {
          return { error: 'custom.test', message: '不能使用test' };
        }
      });
      expect(result).to.exist;
    });

    it('应支持只返回错误消息', () => {
      const result = 'string!'.custom((value) => {
        if (value === 'test') return '不能使用test';
      });
      expect(result).to.exist;
    });
  });

  describe('.default() 方法', () => {
    it('应设置默认值', () => {
      const schema = dsl({
        name: 'string'.default('guest')
      });

      expect(schema.properties.name.default).to.equal('guest');
    });

    it('应支持不同类型的默认值', () => {
      const schema = dsl({
        name: 'string'.default('guest'),
        age: 'number'.default(18),
        active: 'boolean'.default(true)
      });

      expect(schema.properties.name.default).to.equal('guest');
      expect(schema.properties.age.default).to.equal(18);
      expect(schema.properties.active.default).to.equal(true);
    });

    it('默认值应在验证时生效', () => {
      const schema = dsl({
        role: 'string'.default('user')
      });

      const result = validate(schema, {});
      expect(result.data.role).to.equal('user');
    });
  });

  describe('多方法链式调用', () => {
    it('应支持2个方法链式', () => {
      const schema = dsl({
        username: 'string:3-32!'
          .pattern(/^[a-z]+$/)
          .label('用户名')
      });

      expect(schema.properties.username.pattern).to.exist;
    });

    it('应支持3个方法链式', () => {
      const schema = dsl({
        email: 'email!'
          .label('邮箱')
          .description('用于登录')
          .messages({ 'required': '邮箱不能为空' })
      });

      expect(schema.properties.email.format).to.equal('email');
    });

    it('应支持所有方法链式', () => {
      const schema = dsl({
        username: 'string:3-32!'
          .pattern(/^[a-z]+$/)
          .label('用户名')
          .description('登录用户名')
          .messages({ 'required': '不能为空' })
          .custom((v) => v !== 'admin')
      });

      expect(schema.properties.username).to.exist;
    });
  });

  describe('与默认验证器结合', () => {
    it('username() + 链式调用', () => {
      const schema = dsl({
        username: 'string!'.username('5-20').label('用户名')
      });

      expect(schema.properties.username.minLength).to.equal(5);
      expect(schema.properties.username.maxLength).to.equal(20);
    });

    it('phone() + 链式调用', () => {
      const schema = dsl({
        phone: 'string!'.phone('cn').label('手机号')
      });

      expect(schema.properties.phone.minLength).to.equal(11);
    });

    it('password() + 链式调用', () => {
      const schema = dsl({
        password: 'string!'.password('strong').label('密码')
      });

      expect(schema.properties.password.minLength).to.equal(8);
    });
  });

  describe('嵌套对象中使用', () => {
    it('应在嵌套对象中正常工作', () => {
      const schema = dsl({
        user: {
          username: 'string:3-32!'.pattern(/^[a-z]+$/).label('用户名'),
          email: 'email!'.label('邮箱'),
          profile: {
            bio: 'string:500'.description('个人简介'),
            website: 'url'.label('个人网站')
          }
        }
      });

      expect(schema.properties.user.properties.username.pattern).to.exist;
      expect(schema.properties.user.properties.profile.properties.bio).to.exist;
    });
  });

  describe('完整示例', () => {
    it('表单验证示例', () => {
      const schema = dsl({
        username: 'string:3-32!'
          .pattern(/^[a-zA-Z0-9_]+$/)
          .label('用户名')
          .messages({
            'pattern': '只能包含字母、数字和下划线',
            'min': '至少3个字符',
            'max': '最多32个字符'
          }),

        email: 'email!'
          .label('邮箱地址')
          .description('用于登录和接收通知'),

        password: 'string:8-64!'
          .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
          .label('密码')
          .messages({
            'pattern': '必须包含大小写字母和数字'
          }),

        agree: 'boolean!'
          .label('同意条款')
      });

      const validData = {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Abc123456',
        agree: true
      };

      const result = validate(schema, validData);
      expect(result.valid).to.be.true;
    });

    it('复杂嵌套示例', () => {
      const schema = dsl({
        user: {
          username: 'string!'.username('5-20').label('用户名'),
          contact: {
            email: 'email!'.label('邮箱'),
            phone: 'string!'.phone('cn').label('手机号')
          },
          profile: {
            bio: 'string:500'.description('个人简介'),
            website: 'url'.label('个人网站').default('https://example.com'),
            tags: 'array<string:1-20>'
          }
        }
      });

      expect(schema.properties.user.properties.contact.properties.phone.minLength).to.equal(11);
      expect(schema.properties.user.properties.profile.properties.website.default).to.equal('https://example.com');
    });
  });
});

