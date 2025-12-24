// lib/types/DateType.js

const BaseType = require('./BaseType');

/**
 * 日期类型
 *
 * @class DateType
 * @extends BaseType
 */
class DateType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'date';
    this._min = options.min;
    this._max = options.max;
  }

  /**
   * 设置最小日期
   * @param {Date|string|number} date - 最小日期
   * @returns {DateType}
   */
  min(date) {
    this._min = this._toDate(date);
    return this;
  }

  /**
   * 设置最大日期
   * @param {Date|string|number} date - 最大日期
   * @returns {DateType}
   */
  max(date) {
    this._max = this._toDate(date);
    return this;
  }

  /**
   * 设置日期范围
   * @param {Date|string|number} min - 最小日期
   * @param {Date|string|number} max - 最大日期
   * @returns {DateType}
   */
  range(min, max) {
    this._min = this._toDate(min);
    this._max = this._toDate(max);
    return this;
  }

  /**
   * 转换为Date对象
   * @private
   */
  _toDate(value) {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value);
    }
    return value;
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (!(value instanceof Date)) {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected Date, got ${typeof value}`
        }]
      };
    }

    if (isNaN(value.getTime())) {
      return {
        isValid: false,
        errors: [{
          type: 'invalid-date',
          message: 'Invalid date'
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

    // 范围验证
    if (this._min && value < this._min) {
      errors.push({
        type: 'min',
        message: `Date must be after ${this._min.toISOString()}`
      });
    }

    if (this._max && value > this._max) {
      errors.push({
        type: 'max',
        message: `Date must be before ${this._max.toISOString()}`
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
      max: this._max
    };
  }
}

module.exports = DateType;

