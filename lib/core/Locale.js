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
   * 获取错误消息配置
   * @param {string} type - 错误类型或消息字符串
   * @param {Object} [customMessages] - 自定义消息
   * @param {string} [locale] - 指定语言（可选，默认使用当前语言）
   * @returns {Object|string} 消息配置对象 { code, message } 或字符串（向后兼容）
   * @version 1.1.5 - 支持对象格式
   */
  static getMessage(type, customMessages = {}, locale = null) {
    // 使用指定的语言或当前全局语言
    const targetLocale = locale || this.currentLocale;

    // 优先级: 自定义消息 > 全局自定义消息 > 语言包 > ErrorCodes > 原字符串

    // 1. 查找消息配置
    let messageConfig = customMessages[type]
                     || this.customMessages[type]
                     || (this.locales[targetLocale] && this.locales[targetLocale][type]);

    // 2. 如果未找到，尝试从 ErrorCodes 获取
    if (!messageConfig) {
      const errorInfo = getErrorInfo(type);
      if (errorInfo.code === 'UNKNOWN_ERROR') {
        // ✅ 向后兼容：直接返回原字符串（支持硬编码消息）
        return type;
      }
      messageConfig = errorInfo.message;
    }

    // 3. 规范化为对象格式（v1.1.5 新增）
    if (typeof messageConfig === 'string') {
      // 字符串格式 → 转换为对象格式（向后兼容）
      return { code: type, message: messageConfig };
    }

    if (typeof messageConfig === 'object' && messageConfig !== null && messageConfig.message) {
      // 对象格式 → 直接使用
      return {
        code: messageConfig.code || type,  // 无 code 时使用 type 作为 code
        message: messageConfig.message
      };
    }

    // 4. 降级处理（边界情况）
    return { code: type, message: type };
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
