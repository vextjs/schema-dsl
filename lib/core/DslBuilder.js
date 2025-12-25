/**
 * DSL Builder - 统一的Schema构建器
 *
 * 支持链式调用扩展DSL功能
 *
 * @module lib/core/DslBuilder
 * @version 2.0.0
 *
 * @example
 * // 简单使用
 * const schema = dsl('email!');
 *
 * // 链式扩展
 * const schema = dsl('email!')
 *   .pattern(/custom/)
 *   .messages({ 'string.pattern': '格式不正确' })
 *   .label('邮箱地址');
 */

const ErrorCodes = require('./ErrorCodes');
const MessageTemplate = require('./MessageTemplate');
const Locale = require('./Locale');

class DslBuilder {
  /**
   * 创建 DslBuilder 实例
   * @param {string} dslString - DSL字符串，如 'string:3-32!' 或 'email!'
   */
  constructor(dslString) {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('DSL string is required');
    }

    // 解析DSL字符串
    const trimmed = dslString.trim();
    this._required = trimmed.endsWith('!');
    const dslWithoutRequired = this._required ? trimmed.slice(0, -1) : trimmed;

    // 简单解析为基础Schema（避免循环依赖）
    this._baseSchema = this._parseSimple(dslWithoutRequired);

    // 扩展属性
    this._customMessages = {};
    this._label = null;
    this._customValidators = [];
    this._description = null;
    this._whenConditions = [];
  }

  /**
   * 简单解析DSL字符串（避免循环依赖）
   * @private
   * @param {string} dsl - DSL字符串（不含!）
   * @returns {Object} JSON Schema对象
   */
  _parseSimple(dsl) {
    // 处理数组类型
    if (dsl.startsWith('array<') && dsl.endsWith('>')) {
      const itemDsl = dsl.substring(6, dsl.length - 1);
      return {
        type: 'array',
        items: this._parseSimple(itemDsl)
      };
    }

    // 处理枚举
    if (dsl.includes('|') && !dsl.includes(':')) {
      return {
        type: 'string',
        enum: dsl.split('|').map(v => v.trim())
      };
    }

    // 处理类型:约束格式
    const colonIndex = dsl.indexOf(':');
    let type, constraint;

    if (colonIndex === -1) {
      type = dsl;
      constraint = '';
    } else {
      type = dsl.substring(0, colonIndex);
      constraint = dsl.substring(colonIndex + 1);
    }

    // 获取基础类型
    const schema = this._getBaseType(type);

    // 处理约束
    if (constraint) {
      Object.assign(schema, this._parseConstraint(schema.type, constraint));
    }

    return schema;
  }

  /**
   * 获取基础类型Schema
   * @private
   */
  _getBaseType(type) {
    const typeMap = {
      'string': { type: 'string' },
      's': { type: 'string' },
      'number': { type: 'number' },
      'n': { type: 'number' },
      'integer': { type: 'integer' },
      'int': { type: 'integer' },
      'boolean': { type: 'boolean' },
      'bool': { type: 'boolean' },
      'b': { type: 'boolean' },
      'email': { type: 'string', format: 'email' },
      'url': { type: 'string', format: 'uri' },
      'uuid': { type: 'string', format: 'uuid' },
      'date': { type: 'string', format: 'date' },
      'datetime': { type: 'string', format: 'date-time' }
    };

    return typeMap[type] || { type: 'string' };
  }

  /**
   * 解析约束
   * @private
   */
  _parseConstraint(type, constraint) {
    const result = {};

    if (type === 'string' || type === 'number' || type === 'integer') {
      // 范围约束: min-max
      if (constraint.includes('-')) {
        const [min, max] = constraint.split('-').map(v => v.trim());

        if (type === 'string') {
          if (min) result.minLength = parseInt(min);
          if (max) result.maxLength = parseInt(max);
        } else {
          if (min) result.minimum = parseFloat(min);
          if (max) result.maximum = parseFloat(max);
        }
      } else {
        // 单个值
        const value = constraint.trim();
        if (value) {
          if (type === 'string') {
            result.maxLength = parseInt(value);
          } else {
            result.maximum = parseFloat(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * 添加正则表达式验证
   * @param {RegExp|string} regex - 正则表达式
   * @param {string} [message] - 自定义错误消息
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!')
   *   .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
   */
  pattern(regex, message) {
    this._baseSchema.pattern = regex instanceof RegExp ? regex.source : regex;

    if (message) {
      this._customMessages['string.pattern'] = message;
    }

    return this;
  }

  /**
   * 自定义错误消息
   * @param {Object} messages - 错误消息对象
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!')
   *   .messages({
   *     'string.min': '至少{{#limit}}个字符',
   *     'string.max': '最多{{#limit}}个字符'
   *   })
   */
  messages(messages) {
    Object.assign(this._customMessages, messages);
    return this;
  }

  /**
   * 设置字段标签（用于错误消息）
   * @param {string} labelText - 标签文本
   * @returns {DslBuilder}
   *
   * @example
   * dsl('email!').label('邮箱地址')
   */
  label(labelText) {
    this._label = labelText;
    return this;
  }

  /**
   * 添加自定义验证器
   * @param {Function} validatorFn - 验证函数，返回true或错误对象
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!')
   *   .custom(async (value) => {
   *     const exists = await checkUsernameExists(value);
   *     if (exists) {
   *       return { error: 'username.exists', message: '用户名已存在' };
   *     }
   *     return true;
   *   })
   */
  custom(validatorFn) {
    if (typeof validatorFn !== 'function') {
      throw new Error('Custom validator must be a function');
    }
    this._customValidators.push(validatorFn);
    return this;
  }

  /**
   * 设置描述
   * @param {string} text - 描述文本
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!').description('用户登录名')
   */
  description(text) {
    this._description = text;
    return this;
  }

  /**
   * 条件验证（when）
   * @param {string} refField - 引用字段名
   * @param {Object} options - 条件选项
   * @param {*} options.is - 期望值
   * @param {DslBuilder|Object} options.then - 满足条件时的Schema
   * @param {DslBuilder|Object} [options.otherwise] - 不满足条件时的Schema
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string')
   *   .when('contactType', {
   *     is: 'email',
   *     then: dsl('email!'),
   *     otherwise: dsl('string').pattern(/^\d{11}$/)
   *   })
   */
  when(refField, options) {
    this._whenConditions.push({
      refField,
      is: options.is,
      then: options.then,
      otherwise: options.otherwise
    });
    return this;
  }

  /**
   * 设置默认值
   * @param {*} value - 默认值
   * @returns {DslBuilder}
   */
  default(value) {
    this._baseSchema.default = value;
    return this;
  }

  /**
   * 转换为 JSON Schema
   * @returns {Object} JSON Schema对象
   */
  toSchema() {
    const schema = { ...this._baseSchema };

    // 添加描述
    if (this._description) {
      schema.description = this._description;
    }

    // 添加自定义消息
    if (Object.keys(this._customMessages).length > 0) {
      schema._customMessages = this._customMessages;
    }

    // 添加标签
    if (this._label) {
      schema._label = this._label;
    }

    // 添加自定义验证器
    if (this._customValidators.length > 0) {
      schema._customValidators = this._customValidators;
    }

    // 添加when条件
    if (this._whenConditions.length > 0) {
      schema._whenConditions = this._whenConditions;
    }

    // 添加必填标记
    schema._required = this._required;

    return schema;
  }

  /**
   * 验证数据
   * @param {*} data - 待验证数据
   * @param {Object} [context] - 验证上下文
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, context = {}) {
    const Validator = require('./Validator');
    const validator = new Validator();
    const schema = this.toSchema();

    // 如果有when条件，需要处理
    if (this._whenConditions.length > 0 && context.root) {
      // TODO: 实现when条件逻辑
    }

    return validator.validate(schema, data);
  }

  /**
   * 验证Schema嵌套深度
   * @static
   * @param {Object} schema - Schema对象
   * @param {number} maxDepth - 最大深度（默认3）
   * @returns {Object} { valid, depth, path, message }
   */
  static validateNestingDepth(schema, maxDepth = 3) {
    let maxFound = 0;
    let deepestPath = '';

    function traverse(obj, depth = 1, path = '') {
      if (depth > maxFound) {
        maxFound = depth;
        deepestPath = path;
      }

      if (obj && typeof obj === 'object') {
        if (obj.properties) {
          Object.keys(obj.properties).forEach(key => {
            traverse(obj.properties[key], depth + 1, `${path}.${key}`);
          });
        }
        if (obj.items) {
          traverse(obj.items, depth + 1, `${path}[]`);
        }
      }
    }

    traverse(schema);

    return {
      valid: maxFound <= maxDepth,
      depth: maxFound,
      path: deepestPath,
      message: maxFound > maxDepth
        ? `嵌套深度${maxFound}超过限制${maxDepth}，路径: ${deepestPath}`
        : `嵌套深度${maxFound}符合要求`
    };
  }
}

module.exports = DslBuilder;

