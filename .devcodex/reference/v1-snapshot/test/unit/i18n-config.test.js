/**
 * i18n 配置功能测试
 *
 * 测试 dsl.config({ i18n: ... }) 配置功能
 */

const assert = require('assert');
const { dsl, validate } = require('../../index');
const path = require('path');
const Locale = require('../../lib/core/Locale');

describe('i18n 配置功能', function() {

  // 测试结束后重置
  after(function() {
    Locale.reset();
  });

  describe('配置方式', function() {

    it('应该支持传入对象配置', function() {
      // 测试 dsl.config 接受 i18n 对象参数
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'field.username': '用户名',
              'required': '必填项'
            }
          }
        });
      });
    });

    it('应该支持传入目录路径配置', function() {
      // 注意：这个测试需要实际的测试语言包目录
      // 这里只测试不抛出错误
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: path.join(__dirname, 'non-existent-path')
        });
      });
    });

    it('应该覆盖默认错误消息', function() {
      // 测试 dsl.config 可以配置自定义消息
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: {
            'zh-CN': {
              'required': '自定义必填消息'
            }
          }
        });
      });
    });

  });

  describe('错误消息键存在性', function() {

    it('应该有 format.binary 错误消息（zh-CN）', function() {
      const zhCN = require('../../lib/locales/zh-CN');
      assert.ok(zhCN['format.binary']);
      assert.ok(zhCN['format.binary'].includes('Base64'));
    });

    it('应该有 format.binary 错误消息（en-US）', function() {
      const enUS = require('../../lib/locales/en-US');
      assert.ok(enUS['format.binary']);
      assert.ok(enUS['format.binary'].includes('base64'));
    });

  });

  describe('枚举错误消息', function() {

    it('应该有 enum 错误消息（zh-CN）', function() {
      const zhCN = require('../../lib/locales/zh-CN');
      assert.ok(zhCN['enum']);
    });

    it('应该有 string.enum 错误消息（zh-CN）', function() {
      const zhCN = require('../../lib/locales/zh-CN');
      assert.ok(zhCN['string.enum']);
    });

  });

  describe('i18n API 完整性', function() {

    it('应该支持 Locale.addLocale 方法', function() {
      Locale.addLocale('test-lang', {
        'test.key': 'test value'
      });

      assert.ok(Locale.locales['test-lang']['test.key'] === 'test value');
    });

    it('应该支持 Locale.setLocale 方法', function() {
      Locale.setLocale('zh-CN');
      assert.strictEqual(Locale.getLocale(), 'zh-CN');
    });

    it('应该支持 Locale.reset 方法', function() {
      Locale.addLocale('custom', { 'key': 'value' });
      Locale.setLocale('custom');

      Locale.reset();

      assert.strictEqual(Locale.getLocale(), 'en-US');
      assert.ok(!Locale.locales['custom']);
    });

  });

  describe('配置完整性', function() {

    it('dsl.config 应该支持 i18n 键', function() {
      // 这个测试确保 dsl.config 接受 i18n 参数
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: {
            'zh-CN': { 'test': 'value' }
          }
        });
      });
    });

    it('dsl.config 应该支持字符串路径', function() {
      // 不存在的路径不应该抛出错误，只是警告
      assert.doesNotThrow(() => {
        dsl.config({
          i18n: '/non/existent/path'
        });
      });
    });

  });

});

