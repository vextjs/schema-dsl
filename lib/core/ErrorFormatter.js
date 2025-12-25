// lib/core/ErrorFormatter.js

const CONSTANTS = require('../config/constants');
const defaultLocales = require('../locales');

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
    // 优先使用 Locale 类中注册的语言包
    const Locale = require('./Locale');
    const registered = Locale.locales[locale];
    console.log('Loading messages for', locale, 'Registered:', !!registered);
    if (registered) return registered;

    // 其次使用默认语言包
    console.log('Loading default messages for', locale);
    return defaultLocales[locale] || defaultLocales['en-US'];
  }

  /**
   * 格式化单个错误或错误数组
   * @param {Object|Array<Object>} error - 错误对象或错误数组
   * @param {string} [locale] - 动态指定语言（可选）
   * @returns {string|Array<Object>} 格式化后的错误消息或错误对象数组
   */
  format(error, locale) {
    // 如果是数组，格式化为详细对象数组
    if (Array.isArray(error)) {
      return this.formatDetailed(error, locale);
    }

    // 获取当前使用的消息模板
    const messages = locale ? this._loadMessages(locale) : this.messages;

    // 单个错误对象格式化
    const template = messages[error.type] || error.message;
    return this._interpolate(template, {
      ...error,
      path: error.path || 'value',
      allowed: Array.isArray(error.allowed) ? error.allowed.join(', ') : error.allowed
    });
  }

  /**
   * 格式化所有错误
   * @param {Array<Object>} errors - 错误数组
   * @param {string} [locale] - 动态指定语言（可选）
   * @returns {Array<string>} 格式化后的错误消息数组
   */
  formatAll(errors, locale) {
    return errors.map(err => this.format(err, locale));
  }

  /**
   * 格式化为详细对象
   * @param {Array<Object>} errors - ajv错误数组
   * @param {string} [locale] - 动态指定语言（可选）
   * @returns {Array<Object>} 详细错误对象数组
   */
  formatDetailed(errors, locale) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    // 获取当前使用的消息模板
    const messages = locale ? this._loadMessages(locale) : this.messages;

    return errors.map(err => {
      // 处理 ajv 错误格式
      const keyword = err.keyword || err.type || 'validation';
      const instancePath = err.instancePath || err.path || '';
      const fieldName = instancePath.replace(/^\//, '') || (err.params && err.params.missingProperty) || 'value';

      // 获取 Schema 中的自定义信息
      let schema = err.parentSchema || err.schema || {};

      // 特殊处理 required 错误
      if (keyword === 'required' && err.params && err.params.missingProperty) {
        const prop = err.params.missingProperty;
        if (schema.properties && schema.properties[prop]) {
          schema = schema.properties[prop];
        }
      }

      const label = schema._label || fieldName;
      const customMessages = schema._customMessages || {};

      // 关键字映射 (ajv keyword -> schemaio keyword)
      const keywordMap = {
        'minLength': 'min',
        'maxLength': 'max',
        'minimum': 'min',
        'maximum': 'max',
        'pattern': 'pattern',
        'format': 'format',
        'required': 'required',
        'enum': 'enum'
      };

      const mappedKeyword = keywordMap[keyword] || keyword;

      // 查找自定义消息
      // 优先级: 字段级自定义消息 > 全局消息
      let message = customMessages[mappedKeyword] || customMessages[keyword] || customMessages['default'];

      if (!message) {
        // 使用默认模板
        const template = messages[mappedKeyword] || messages[keyword] || err.message || 'Validation error';
        message = template;
      }

      // 插值替换
      const limit = err.params ? (err.params.limit || err.params.limitLength || err.params.comparison) : undefined;

      const interpolateData = {
        ...err.params,
        path: label, // 使用 label 替换 path
        label: label,
        value: err.data,
        limit: limit,
        // 映射 min/max 以匹配模板
        min: limit,
        max: limit,
        expected: err.params ? err.params.type : undefined
      };

      // console.log('Interpolate Data:', interpolateData);

      message = this._interpolate(message, interpolateData);

      return {
        path: fieldName,
        message: message,
        keyword: keyword,
        params: err.params
      };
    });
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
    if (!template || typeof template !== 'string') {
      return data.message || 'Validation error';
    }


    // 支持 {{#key}} 和 {key} 两种格式
    return template.replace(/\{\{?#?(\w+)\}?\}/g, (match, key) => {
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

