// lib/core/ErrorFormatter.js

const CONSTANTS = require('../config/constants');

/**
 * 错误格式化器
 * 将验证错误格式化为友好的消息
 *
 * @class ErrorFormatter
 */
class ErrorFormatter {
  constructor(locale = 'zh-CN') {
    this.locale = locale;
    this.messages = this._loadMessages(locale);
  }

  /**
   * 加载错误消息模板
   * @private
   * @param {string} locale - 语言环境
   * @returns {Object} 消息模板
   */
  _loadMessages(locale) {
    const messages = {
      'zh-CN': {
        required: '{path} 是必填字段',
        type: '{path} 应该是 {expected} 类型，但得到了 {actual}',
        min: '{path} 长度至少为 {min}',
        max: '{path} 长度最多为 {max}',
        length: '{path} 长度必须为 {expected}',
        pattern: '{path} 格式不正确',
        enum: '{path} 必须是以下值之一: {allowed}',
        custom: '{path} 验证失败: {message}',
        circular: '{path} 检测到循环引用',
        'max-depth': '超过最大递归深度 ({depth}) at {path}',
        exception: '{path} 验证异常: {message}'
      },
      'en-US': {
        required: '{path} is required',
        type: '{path} should be {expected}, got {actual}',
        min: '{path} length must be at least {min}',
        max: '{path} length must be at most {max}',
        length: '{path} length must be exactly {expected}',
        pattern: '{path} format is invalid',
        enum: '{path} must be one of: {allowed}',
        custom: '{path} validation failed: {message}',
        circular: 'Circular reference detected at {path}',
        'max-depth': 'Maximum recursion depth ({depth}) exceeded at {path}',
        exception: '{path} validation exception: {message}'
      }
    };
    return messages[locale] || messages['en-US'];
  }

  /**
   * 格式化单个错误
   * @param {Object} error - 错误对象
   * @returns {string} 格式化后的错误消息
   */
  format(error) {
    const template = this.messages[error.type] || error.message;
    return this._interpolate(template, {
      ...error,
      path: error.path || 'value',
      allowed: Array.isArray(error.allowed) ? error.allowed.join(', ') : error.allowed
    });
  }

  /**
   * 格式化所有错误
   * @param {Array<Object>} errors - 错误数组
   * @returns {Array<string>} 格式化后的错误消息数组
   */
  formatAll(errors) {
    return errors.map(err => this.format(err));
  }

  /**
   * 格式化为详细对象
   * @param {Array<Object>} errors - 错误数组
   * @returns {Array<Object>} 详细错误对象数组
   */
  formatDetailed(errors) {
    return errors.map(err => ({
      path: err.path || 'value',
      message: this.format(err),
      type: err.type,
      ...err
    }));
  }

  /**
   * 格式化为分组对象
   * @param {Array<Object>} errors - 错误数组
   * @returns {Object} 按路径分组的错误
   */
  formatGrouped(errors) {
    const grouped = {};

    for (const error of errors) {
      const path = error.path || 'value';
      if (!grouped[path]) {
        grouped[path] = [];
      }
      grouped[path].push(this.format(error));
    }

    return grouped;
  }

  /**
   * 格式化为纯文本
   * @param {Array<Object>} errors - 错误数组
   * @param {string} [separator='\n'] - 分隔符
   * @returns {string} 纯文本错误消息
   */
  formatText(errors, separator = '\n') {
    return this.formatAll(errors).join(separator);
  }

  /**
   * 格式化为JSON字符串
   * @param {Array<Object>} errors - 错误数组
   * @param {boolean} [pretty=false] - 是否美化
   * @returns {string} JSON字符串
   */
  formatJSON(errors, pretty = false) {
    const formatted = this.formatDetailed(errors);
    return pretty ? JSON.stringify(formatted, null, 2) : JSON.stringify(formatted);
  }

  /**
   * 格式化为HTML列表
   * @param {Array<Object>} errors - 错误数组
   * @returns {string} HTML字符串
   */
  formatHTML(errors) {
    const items = this.formatAll(errors)
      .map(msg => `  <li>${this._escapeHTML(msg)}</li>`)
      .join('\n');

    return `<ul class="validation-errors">\n${items}\n</ul>`;
  }

  /**
   * 插值替换
   * @private
   * @param {string} template - 模板字符串
   * @param {Object} data - 数据对象
   * @returns {string} 替换后的字符串
   */
  _interpolate(template, data) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  /**
   * HTML转义
   * @private
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  _escapeHTML(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * 设置语言环境
   * @param {string} locale - 语言环境
   */
  setLocale(locale) {
    this.locale = locale;
    this.messages = this._loadMessages(locale);
  }

  /**
   * 添加自定义消息模板
   * @param {string} type - 错误类型
   * @param {string} template - 消息模板
   */
  addMessage(type, template) {
    this.messages[type] = template;
  }

  /**
   * 批量添加自定义消息模板
   * @param {Object} messages - 消息模板对象
   */
  addMessages(messages) {
    Object.assign(this.messages, messages);
  }
}

module.exports = ErrorFormatter;

