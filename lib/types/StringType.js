// lib/types/StringType.js

const BaseType = require('./BaseType');
const CONSTANTS = require('../config/constants');

/**
 * 字符串类型
 *
 * @class StringType
 * @extends BaseType
 */
class StringType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'string';
    this._min = options.min;
    this._max = options.max;
    this._length = options.length;
    this._pattern = options.pattern;
    this._enum = options.enum;
  }

  /**
   * 设置最小长度
   * @param {number} length - 最小长度
   * @returns {StringType}
   */
  min(length) {
    this._min = length;
    return this;
  }

  /**
   * 设置最大长度
   * @param {number} length - 最大长度
   * @returns {StringType}
   */
  max(length) {
    this._max = length;
    return this;
  }

  /**
   * 设置精确长度
   * @param {number} length - 长度
   * @returns {StringType}
   */
  length(length) {
    this._length = length;
    return this;
  }

  /**
   * 设置正则表达式
   * @param {RegExp|string} pattern - 正则表达式
   * @returns {StringType}
   */
  pattern(pattern) {
    this._pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    return this;
  }

  /**
   * 设置枚举值
   * @param {...string} values - 允许的值
   * @returns {StringType}
   */
  valid(...values) {
    this._enum = values.flat();
    return this;
  }

  /**
   * Email格式
   * @returns {StringType}
   */
  email() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.email;
    this.meta('format', 'email');
    return this;
  }

  /**
   * URL格式
   * @returns {StringType}
   */
  url() {
    this.meta('format', 'url');
    return this;
  }

  /**
   * UUID格式
   * @returns {StringType}
   */
  uuid() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.uuid;
    this.meta('format', 'uuid');
    return this;
  }

  /**
   * IPv4格式
   * @returns {StringType}
   */
  ipv4() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.ipv4;
    this.meta('format', 'ipv4');
    return this;
  }

  /**
   * IPv6格式
   * @returns {StringType}
   */
  ipv6() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.ipv6;
    this.meta('format', 'ipv6');
    return this;
  }

  /**
   * 主机名格式
   * @returns {StringType}
   */
  hostname() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.hostname;
    this.meta('format', 'hostname');
    return this;
  }

  /**
   * DateTime格式
   * @returns {StringType}
   */
  dateTime() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.dateTime;
    this.meta('format', 'date-time');
    return this;
  }

  /**
   * 日期格式
   * @returns {StringType}
   */
  date() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.date;
    this.meta('format', 'date');
    return this;
  }

  /**
   * 时间格式
   * @returns {StringType}
   */
  time() {
    this._pattern = CONSTANTS.FORMATS.PATTERNS.time;
    this.meta('format', 'time');
    return this;
  }

  /**
   * 转换为小写
   * @returns {StringType}
   */
  lowercase() {
    this.meta('case', 'lower');
    return this;
  }

  /**
   * 转换为大写
   * @returns {StringType}
   */
  uppercase() {
    this.meta('case', 'upper');
    return this;
  }

  /**
   * 去除首尾空格
   * @returns {StringType}
   */
  trim() {
    this.meta('trim', true);
    return this;
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (typeof value !== 'string') {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected string, got ${typeof value}`
        }]
      };
    }
    return { isValid: true, errors: [] };
  }

  /**
   * 验证
   * @override
   */
  async validate(value) {
    // 基础验证
    const baseResult = await super.validate(value);
    if (!baseResult.isValid || value === undefined || value === null) {
      return baseResult;
    }

    const errors = [];

    // 长度验证
    if (this._min !== undefined && value.length < this._min) {
      errors.push({
        type: 'min',
        message: `String length must be at least ${this._min}, got ${value.length}`
      });
    }

    if (this._max !== undefined && value.length > this._max) {
      errors.push({
        type: 'max',
        message: `String length must be at most ${this._max}, got ${value.length}`
      });
    }

    if (this._length !== undefined && value.length !== this._length) {
      errors.push({
        type: 'length',
        message: `String length must be exactly ${this._length}, got ${value.length}`
      });
    }

    // 正则验证
    if (this._pattern && !this._pattern.test(value)) {
      errors.push({
        type: 'pattern',
        message: `String does not match pattern ${this._pattern}`
      });
    }

    // 枚举验证
    if (this._enum && !this._enum.includes(value)) {
      errors.push({
        type: 'enum',
        message: `String must be one of: ${this._enum.join(', ')}`
      });
    }

    return {
      isValid: errors.length === 0,
      errors: [...baseResult.errors, ...errors]
    };
  }

  /**
   * 构建Schema
   * @override
   */
  toSchema() {
    return {
      ...super.toSchema(),
      min: this._min,
      max: this._max,
      length: this._length,
      pattern: this._pattern,
      enum: this._enum
    };
  }
}

module.exports = StringType;

