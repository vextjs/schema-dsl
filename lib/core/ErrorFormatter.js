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
    const defaults = defaultLocales[locale] || defaultLocales['en-US'];

    if (registered) {
      return { ...defaults, ...registered };
    }

    // 其次使用默认语言包
    return defaults;
  }

  /**
   * 格式化单个错误或错误数组
   * @param {Object|Array<Object>} error - 错误对象或错误数组
   * @param {string|Object} [localeOrOptions] - 语言代码字符串或选项对象
   * @param {string} [localeOrOptions.locale] - 动态指定语言（可选）
   * @param {Object} [localeOrOptions.messages] - 自定义错误消息（可选）
   * @returns {string|Array<Object>} 格式化后的错误消息或错误对象数组
   */
  format(error, localeOrOptions) {

    // ✅ 支持两种调用方式：
    // 1. format(errors, 'zh-CN') - 旧版兼容
    // 2. format(errors, { locale: 'zh-CN', messages: {...} }) - 新版增强
    let locale;
    let customMessages;

    if (typeof localeOrOptions === 'string') {
      // 旧版：直接传入语言代码
      locale = localeOrOptions;
    } else if (typeof localeOrOptions === 'object' && localeOrOptions !== null) {
      // 新版：传入选项对象
      locale = localeOrOptions.locale;
      customMessages = localeOrOptions.messages;
    }

    // 如果是数组，格式化为详细对象数组
    if (Array.isArray(error)) {
      return this.formatDetailed(error, locale, customMessages);
    }

    // 获取当前使用的消息模板
    const messages = locale ? this._loadMessages(locale) : this.messages;

    // 合并自定义消息
    const finalMessages = customMessages ? { ...messages, ...customMessages } : messages;

    // 单个错误对象格式化
    const template = finalMessages[error.type] || error.message;
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
   * @param {Object} [customMessages] - 自定义错误消息（可选）
   * @returns {Array<Object>} 详细错误对象数组
   */
  formatDetailed(errors, locale, customMessages) {

    if (!Array.isArray(errors)) {
      errors = [errors];
    }

    // 过滤冗余的包装错误（v1.0.7.1 增强）
    // 当存在具体字段错误时，移除通用的包装错误
    const hasConcreteErrors = errors.some(err => {
      const keyword = err.keyword;
      // 包装错误关键字：if, anyOf, oneOf, allOf
      return keyword !== 'if' &&
        keyword !== 'anyOf' &&
        keyword !== 'oneOf' &&
        keyword !== 'error';
    });

    if (hasConcreteErrors) {
      // 过滤掉包装错误（这些是通用的组合验证错误）
      errors = errors.filter(err => {
        const keyword = err.keyword;
        return keyword !== 'if' &&
          keyword !== 'anyOf' &&
          keyword !== 'oneOf';
      });
    }

    // 获取当前使用的消息模板
    const messages = locale ? this._loadMessages(locale) : this.messages;

    // ✅ 合并参数传入的自定义消息（在整个 map 循环中使用）
    const finalMessages = customMessages ? { ...messages, ...customMessages } : messages;

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

      let label = schema._label;

      if (label) {
        // 如果显式设置了 label，尝试翻译它
        if (finalMessages[label]) {
          label = finalMessages[label];
        }
      } else {
        // 如果没有显式设置 label，尝试自动查找翻译 (label.fieldName)
        // 将路径分隔符 / 转换为 . (例如 address/city -> address.city)
        const autoKey = `label.${fieldName.replace(/\//g, '.')}`;
        if (finalMessages[autoKey]) {
          label = finalMessages[autoKey];
        } else {
          // 没找到翻译，回退到 fieldName
          label = fieldName;
        }
      }

      // Schema 中的自定义消息
      const schemaCustomMessages = schema._customMessages || {};

      // ✅ 合并优先级：schemaCustomMessages > finalMessages
      // schemaCustomMessages 是字段级的自定义消息，优先级最高
      const mergedMessages = { ...finalMessages, ...schemaCustomMessages };

      // 关键字映射 (ajv keyword -> schema-dsl 简写)
      // 支持 min/max 作为 minLength/maxLength 的简写
      const keywordMap = {
        'minLength': 'min',
        'maxLength': 'max',
        'minimum': 'min',
        'maximum': 'max',
        'minItems': 'min',
        'maxItems': 'max',
        'pattern': 'pattern',
        'format': 'format',
        'required': 'required',
        'enum': 'enum'
      };

      const mappedKeyword = keywordMap[keyword] || keyword;
      const type = schema.type || 'string';


      // ✅ 优化：如果 schema 中有自定义消息，优先使用
      // 支持三种自定义消息格式：
      // 1. 键引用：_customMessages.pattern = "pattern.objectId" → 查找语言包中的 "pattern.objectId"
      // 2. 模板字符串：_customMessages.min = "{{#label}}必须大于{{#limit}}" → 直接使用并插值
      // 3. 最终消息：_customMessages.pattern = "手机号格式不正确" → 直接使用
      let message;

      // 1. 首先检查 schema 是否为该 keyword 定义了自定义消息
      let customValue = schemaCustomMessages[keyword] || schemaCustomMessages[mappedKeyword];

      if (customValue) {
        // 尝试从 mergedMessages 中查找这个键
        const lookupResult = mergedMessages[customValue];

        if (lookupResult) {
          // 找到了，说明它是一个键引用
          message = lookupResult;
        } else {
          // 没找到，说明它本身就是模板或最终消息，直接使用
          message = customValue;
        }
      }

      // 2. 如果没有自定义消息，按照通用查找顺序
      if (!message) {
        message = mergedMessages[`${type}.${keyword}`] ||
          mergedMessages[`${type}.${mappedKeyword}`] ||
          mergedMessages[mappedKeyword] ||
          mergedMessages[keyword] ||
          mergedMessages['default'];
      }

      // 自动查找 format 类型的消息 (例如 format.email)
      if (!message && mappedKeyword === 'format' && err.params && err.params.format) {
        let formatName = err.params.format;
        // 映射 uri -> url
        if (formatName === 'uri') formatName = 'url';

        const formatKey = `format.${formatName}`;

        // 优先查找 mergedMessages 中的 format.email
        if (mergedMessages[formatKey]) {
          message = mergedMessages[formatKey];
        }
      }

      if (!message) {
        // 使用默认模板
        const template = mergedMessages[mappedKeyword] || mergedMessages[keyword] || err.message || 'Validation error';
        message = template;
      } else {
        // 检查 message 是否为 key (包含点号且无空格，或者是已知的 key)
        // 如果是 key，尝试从 messages 中查找
        if (typeof message === 'string' && (message.includes('.') || mergedMessages[message])) {

          let translated = mergedMessages[message];

          // 尝试回退查找 (例如 pattern.phone.cn -> pattern.phone)
          if (!translated && message.includes('.')) {
            const parts = message.split('.');
            while (parts.length > 1 && !translated) {
              parts.pop();
              const fallbackKey = parts.join('.');
              translated = mergedMessages[fallbackKey];
            }
          }

          if (translated) {
            message = translated;
          }
        }
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
        expected: err.params ? err.params.type : undefined,
        // ✅ 修复：添加 actual 参数 - 实际接收到的数据类型
        actual: err.data === null ? 'null' :
                err.data === undefined ? 'undefined' :
                Array.isArray(err.data) ? 'array' :
                typeof err.data,
        // ✅ 修复 enum 错误：将 allowedValues 映射为 valids 和 allowed
        valids: err.params && err.params.allowedValues ? err.params.allowedValues.join(', ') : undefined,
        allowed: err.params && err.params.allowedValues ? err.params.allowedValues.join(', ') : undefined,
        // ✅ 修复 additionalProperties 错误：将 additionalProperty 映射为 key
        key: err.params && err.params.additionalProperty ? err.params.additionalProperty : undefined
      };

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

