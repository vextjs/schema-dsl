const { expect } = require('chai');
const Locale = require('../../../lib/core/Locale');

describe('Locale', () => {
  // 每个测试后重置
  afterEach(() => {
    Locale.reset();
  });

  describe('setLocale() / getLocale()', () => {
    it('应该设置和获取当前语言', () => {
      Locale.setLocale('zh-CN');
      expect(Locale.getLocale()).to.equal('zh-CN');
    });

    it('默认语言应该是en-US', () => {
      expect(Locale.getLocale()).to.equal('en-US');
    });
  });

  describe('addLocale()', () => {
    it('应该添加自定义语言包', () => {
      Locale.addLocale('zh-CN', {
        'string.min': '{{#label}}太短了'
      });

      Locale.setLocale('zh-CN');
      const message = Locale.getMessage('string.min');
      expect(message).to.equal('{{#label}}太短了');
    });

    it('应该支持多个语言包', () => {
      Locale.addLocale('zh-CN', { 'string.min': '中文消息' });
      Locale.addLocale('ja-JP', { 'string.min': '日本語メッセージ' });

      Locale.setLocale('zh-CN');
      expect(Locale.getMessage('string.min')).to.equal('中文消息');

      Locale.setLocale('ja-JP');
      expect(Locale.getMessage('string.min')).to.equal('日本語メッセージ');
    });
  });

  describe('setMessages()', () => {
    it('应该设置全局自定义消息', () => {
      Locale.setMessages({
        'string.min': '全局消息: {{#label}}'
      });

      const message = Locale.getMessage('string.min');
      expect(message).to.equal('全局消息: {{#label}}');
    });

    it('应该合并多次设置', () => {
      Locale.setMessages({ 'string.min': '消息1' });
      Locale.setMessages({ 'string.max': '消息2' });

      expect(Locale.getMessage('string.min')).to.equal('消息1');
      expect(Locale.getMessage('string.max')).to.equal('消息2');
    });
  });

  describe('getMessage()', () => {
    it('优先级1: 自定义消息', () => {
      Locale.setMessages({ 'string.min': '全局消息' });
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' });
      Locale.setLocale('zh-CN');

      const customMessages = { 'string.min': '自定义消息' };
      const message = Locale.getMessage('string.min', customMessages);

      expect(message).to.equal('自定义消息');
    });

    it('优先级2: 全局自定义消息', () => {
      Locale.setMessages({ 'string.min': '全局消息' });
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' });
      Locale.setLocale('zh-CN');

      const message = Locale.getMessage('string.min');
      expect(message).to.equal('全局消息');
    });

    it('优先级3: 语言包消息', () => {
      Locale.addLocale('zh-CN', { 'string.min': '语言包消息' });
      Locale.setLocale('zh-CN');

      const message = Locale.getMessage('string.min');
      expect(message).to.equal('语言包消息');
    });

    it('优先级4: 默认消息（英文）', () => {
      const message = Locale.getMessage('string.min');
      expect(message).to.include('length must be at least');
    });

    it('优先级4: 默认消息（中文）', () => {
      Locale.setLocale('zh-CN');
      const message = Locale.getMessage('string.min');
      expect(message).to.include('长度不能少于');
    });

    it('未知错误码应该返回默认消息', () => {
      const message = Locale.getMessage('unknown.error');
      expect(message).to.exist;
    });
  });

  describe('getAvailableLocales()', () => {
    it('应该返回所有可用语言', () => {
      Locale.addLocale('zh-CN', {});
      Locale.addLocale('ja-JP', {});

      const locales = Locale.getAvailableLocales();
      expect(locales).to.include('en-US');
      expect(locales).to.include('zh-CN');
      expect(locales).to.include('ja-JP');
    });
  });

  describe('reset()', () => {
    it('应该重置到初始状态', () => {
      Locale.setLocale('zh-CN');
      Locale.addLocale('custom', { test: 'value' });
      Locale.setMessages({ test: 'global' });

      Locale.reset();

      expect(Locale.getLocale()).to.equal('en-US');
      expect(Locale.locales).to.deep.equal({});
      expect(Locale.customMessages).to.deep.equal({});
    });
  });
});

