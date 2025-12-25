/**
 * 语言管理器
 *
 * 管理多语言支持，提供语言切换功能
 *
 * @module lib/core/Locale
 */

const { getErrorInfo } = require('./ErrorCodes');
const defaultLocales = require('../locales');

class Locale {
  /**
   * 当前语言
   * @private
   */
  static currentLocale = 'en-US';

  /**
   * 语言包存储
   * @private
   */
  static locales = { ...defaultLocales };

  /**
   * 自定义消息（全局）
   * @private
   */
  static customMessages = {};

  /**
   * 设置当前语言
   * @param {string} locale - 语言代码 (zh-CN, en-US等)
   */
  static setLocale(locale) {
    this.currentLocale = locale;
  }

  /**
   * 获取当前语言
   * @returns {string} 当前语言代码
   */
  static getLocale() {
    return this.currentLocale;
  }

  /**
   * 添加语言包
   * @param {string} locale - 语言代码
   * @param {Object} messages - 消息对象
   */
  static addLocale(locale, messages) {
    this.locales[locale] = { ...(this.locales[locale] || {}), ...messages };
  }

  /**
   * 设置全局自定义消息
   * @param {Object} messages - 消息对象
   */
  static setMessages(messages) {
    this.customMessages = { ...this.customMessages, ...messages };
  }

  /**
   * 获取错误消息模板
   * @param {string} type - 错误类型
   * @param {Object} [customMessages] - 自定义消息
   * @returns {string} 消息模板
   */
  static getMessage(type, customMessages = {}) {
    // 优先级: 自定义消息 > 全局自定义消息 > 语言包 > 默认消息

    // 1. 自定义消息
    if (customMessages[type]) {
      return customMessages[type];
    }

    // 2. 全局自定义消息
    if (this.customMessages[type]) {
      return this.customMessages[type];
    }

    // 3. 语言包
    const localeMessages = this.locales[this.currentLocale];
    if (localeMessages && localeMessages[type]) {
      return localeMessages[type];
    }

    // 4. 默认消息（从ErrorCodes获取）
    const errorInfo = getErrorInfo(type, this.currentLocale);
    return errorInfo.message;
  }

  /**
   * 获取所有可用语言
   * @returns {Array<string>} 语言代码数组
   */
  static getAvailableLocales() {
    return ['en-US', 'zh-CN', ...Object.keys(this.locales)];
  }

  /**
   * 重置语言管理器
   * 用于测试
   */
  static reset() {
    this.currentLocale = 'en-US';
    this.locales = { ...defaultLocales };
    this.customMessages = {};
  }
}

module.exports = Locale;
