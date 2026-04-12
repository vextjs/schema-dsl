/**
 * dsl.config() 和多语言配置测试
 */

const { dsl, Locale, validate } = require('../../index');
const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('dsl.config() - i18n 和 cache 配置', () => {
  beforeEach(() => {
    // 重置语言
    Locale.reset();
  });

  describe('i18n 配置', () => {
    it('应该支持从对象直接加载语言包', () => {
      dsl.config({
        i18n: {
          'zh-CN': {
            'username': '用户名',
            'email': '邮箱地址'
          },
          'en-US': {
            'username': 'Username',
            'email': 'Email Address'
          }
        }
      });

      // 验证中文
      Locale.setLocale('zh-CN');
      // v1.1.5: getMessage 返回对象
      expect(Locale.getMessage('username').message).to.equal('用户名');
      expect(Locale.getMessage('email').message).to.equal('邮箱地址');

      // 验证英文
      Locale.setLocale('en-US');
      expect(Locale.getMessage('username').message).to.equal('Username');
      expect(Locale.getMessage('email').message).to.equal('Email Address');
    });

    it('应该在 Schema 中使用用户语言包的 label', () => {
      // 配置用户语言包
      dsl.config({
        i18n: {
          'zh-CN': {
            'username': '用户名',
            'email': '邮箱地址',
            'custom.invalidEmail': '邮箱格式不正确'
          }
        }
      });

      const schema = dsl({
        username: 'string:3-32!'.label('username'),
        email: 'email!'.label('email').messages({
          'format': 'custom.invalidEmail'
        })
      });

      Locale.setLocale('zh-CN');
      const result = validate(schema, {
        username: 'ab',
        email: 'invalid'
      });

      expect(result.valid).to.be.false;
      expect(result.errors).to.have.lengthOf(2);

      // 验证 label 被翻译
      const usernameError = result.errors.find(e => e.path === 'username');
      expect(usernameError.message).to.include('用户名');

      // 验证自定义消息被翻译
      const emailError = result.errors.find(e => e.path === 'email');
      expect(emailError.message).to.include('邮箱格式不正确');
    });

    it('应该支持动态语言切换', () => {
      dsl.config({
        i18n: {
          'zh-CN': {
            'username': '用户名',
            'min': '{{#label}}长度不能少于{{#limit}}个字符'
          },
          'en-US': {
            'username': 'Username',
            'min': '{{#label}} length must be at least {{#limit}}'
          },
          'ja-JP': {
            'username': 'ユーザー名',
            'min': '{{#label}}の長さは{{#limit}}文字以上でなければなりません'
          }
        }
      });

      const schema = dsl({
        username: 'string:3-32!'.label('username')
      });

      // 中文
      Locale.setLocale('zh-CN');
      const result1 = validate(schema, { username: 'ab' }, { locale: 'zh-CN' });
      expect(result1.errors[0].message).to.include('用户名');

      // 英文
      Locale.setLocale('en-US');
      const result2 = validate(schema, { username: 'ab' }, { locale: 'en-US' });
      expect(result2.errors[0].message).to.include('Username');

      // 日文
      Locale.setLocale('ja-JP');
      const result3 = validate(schema, { username: 'ab' }, { locale: 'ja-JP' });
      expect(result3.errors[0].message).to.include('ユーザー名');
    });

    it('应该处理语言包路径不存在的情况', () => {
      // 不应该抛出错误
      expect(() => {
        dsl.config({
          i18n: {
            localesPath: './non-existent-path'
          }
        });
      }).to.not.throw();
    });
  });

  describe('cache 配置', () => {
    it('应该支持自定义缓存大小', () => {
      dsl.config({
        cache: {
          maxSize: 10000
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.maxSize).to.equal(10000);
    });

    it('应该支持自定义缓存 TTL', () => {
      dsl.config({
        cache: {
          ttl: 7200000 // 2 小时
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.ttl).to.equal(7200000);
    });

    it('应该同时支持 maxSize 和 ttl 配置', () => {
      dsl.config({
        cache: {
          maxSize: 20000,
          ttl: 28800000 // 8 小时
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.maxSize).to.equal(20000);
      expect(validator.cache.options.ttl).to.equal(28800000);
    });

    it('应该支持 enabled 参数', () => {
      dsl.config({
        cache: {
          enabled: false
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.enabled).to.be.false;
    });

    it('应该支持 statsEnabled 参数', () => {
      dsl.config({
        cache: {
          statsEnabled: false
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.statsEnabled).to.be.false;
    });

    it('应该支持所有 cache 参数一起配置', () => {
      dsl.config({
        cache: {
          maxSize: 500,
          ttl: 1000000,
          enabled: false,
          statsEnabled: false
        }
      });

      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      expect(validator.cache.options.maxSize).to.equal(500);
      expect(validator.cache.options.ttl).to.equal(1000000);
      expect(validator.cache.options.enabled).to.be.false;
      expect(validator.cache.options.statsEnabled).to.be.false;
    });

    it('应该支持部分参数配置（只配置 maxSize）', () => {
      // 先重新创建一个干净的 Validator
      delete require.cache[require.resolve('../../index')];
      const { dsl: dsl2, getDefaultValidator: getValidator2, config: config2 } = require('../../index');

      config2({
        cache: {
          maxSize: 2000
        }
      });

      const schema = dsl2({ name: 'string!' });
      const validator = getValidator2();

      expect(validator.cache.options.maxSize).to.equal(2000);
      // 其他参数应保持默认值
      expect(validator.cache.options.ttl).to.equal(3600000);
    });

    it('应该支持在 Validator 创建后动态修改配置', () => {
      // 先创建 Validator
      const schema1 = dsl({ name: 'string!' });
      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();

      const initialMaxSize = validator.cache.options.maxSize;
      const initialTtl = validator.cache.options.ttl;

      // 动态修改配置
      dsl.config({
        cache: {
          maxSize: 8888,
          ttl: 9999999
        }
      });

      // 验证配置已更新
      expect(validator.cache.options.maxSize).to.equal(8888);
      expect(validator.cache.options.ttl).to.equal(9999999);
      expect(validator.cache.options.maxSize).to.not.equal(initialMaxSize);
      expect(validator.cache.options.ttl).to.not.equal(initialTtl);
    });
  });

  describe('综合配置', () => {
    it('应该同时支持 i18n 和 cache 配置', () => {
      dsl.config({
        i18n: {
          'zh-CN': { 'test': '测试' }
        },
        cache: {
          maxSize: 5000,
          ttl: 3600000
        }
      });

      // 验证 i18n
      Locale.setLocale('zh-CN');
      // v1.1.5: getMessage 返回对象
      expect(Locale.getMessage('test').message).to.equal('测试');

      // 验证 cache
      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();
      expect(validator.cache.options.maxSize).to.equal(5000);
    });
  });
});

