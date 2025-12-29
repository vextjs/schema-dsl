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
          locales: {
            'zh-CN': {
              'username': '用户名',
              'email': '邮箱地址'
            },
            'en-US': {
              'username': 'Username',
              'email': 'Email Address'
            }
          }
        }
      });

      // 验证中文
      Locale.setLocale('zh-CN');
      expect(Locale.getMessage('username')).to.equal('用户名');
      expect(Locale.getMessage('email')).to.equal('邮箱地址');

      // 验证英文
      Locale.setLocale('en-US');
      expect(Locale.getMessage('username')).to.equal('Username');
      expect(Locale.getMessage('email')).to.equal('Email Address');
    });

    it('应该在 Schema 中使用用户语言包的 label', () => {
      // 配置用户语言包
      dsl.config({
        i18n: {
          locales: {
            'zh-CN': {
              'username': '用户名',
              'email': '邮箱地址',
              'custom.invalidEmail': '邮箱格式不正确'
            }
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
          locales: {
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
  });

  describe('综合配置', () => {
    it('应该同时支持 i18n 和 cache 配置', () => {
      dsl.config({
        i18n: {
          locales: {
            'zh-CN': { 'test': '测试' }
          }
        },
        cache: {
          maxSize: 5000,
          ttl: 3600000
        }
      });

      // 验证 i18n
      Locale.setLocale('zh-CN');
      expect(Locale.getMessage('test')).to.equal('测试');

      // 验证 cache
      const { getDefaultValidator } = require('../../index');
      const validator = getDefaultValidator();
      expect(validator.cache.options.maxSize).to.equal(5000);
    });
  });
});

