// lib/types/NumberType.js

const BaseType = require('./BaseType');

/**
 * 数字类型
 *
 * @class NumberType
 * @extends BaseType
 */
class NumberType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'number';
    this._min = options.min;
    this._max = options.max;
    this._integer = options.integer || false;
    this._precision = options.precision;
    this._multiple = options.multiple;
  }

  /**
   * 设置最小值
   * @param {number} value - 最小值
   * @returns {NumberType}
   */
  min(value) {
    this._min = value;
    return this;
  }

  /**
   * 设置最大值
   * @param {number} value - 最大值
   * @returns {NumberType}
   */
  max(value) {
    this._max = value;
    return this;
  }

  /**
   * 设置范围
   * @param {number} min - 最小值
   * @param {number} max - 最大值
   * @returns {NumberType}
   */
  range(min, max) {
    this._min = min;
    this._max = max;
    return this;
  }

  /**
   * 设置为整数
   * @returns {NumberType}
   */
  integer() {
    this._integer = true;
    return this;
  }

  /**
   * 设置精度（小数位数）
   * @param {number} digits - 小数位数
   * @returns {NumberType}
   */
  precision(digits) {
    this._precision = digits;
    return this;
  }

  /**
   * 设置为某个数的倍数
   * @param {number} base - 基数
   * @returns {NumberType}
   */
  multiple(base) {
    this._multiple = base;
    return this;
  }

  /**
   * 设置为正数
   * @returns {NumberType}
   */
  positive() {
    this._min = 0;
    return this;
  }

  /**
   * 设置为负数
   * @returns {NumberType}
   */
  negative() {
    this._max = 0;
    return this;
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected number, got ${typeof value}`
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

    // 整数验证
    if (this._integer && !Number.isInteger(value)) {
      errors.push({
        type: 'integer',
        message: 'Number must be an integer'
      });
    }

    // 范围验证
    if (this._min !== undefined && value < this._min) {
      errors.push({
        type: 'min',
        message: `Number must be at least ${this._min}, got ${value}`
      });
    }

    if (this._max !== undefined && value > this._max) {
      errors.push({
        type: 'max',
        message: `Number must be at most ${this._max}, got ${value}`
      });
    }

    // 精度验证
    if (this._precision !== undefined) {
      const parts = value.toString().split('.');
      if (parts[1] && parts[1].length > this._precision) {
        errors.push({
          type: 'precision',
          message: `Number precision must be at most ${this._precision} decimal places`
        });
      }
    }

    // 倍数验证
    if (this._multiple !== undefined && value % this._multiple !== 0) {
      errors.push({
        type: 'multiple',
        message: `Number must be a multiple of ${this._multiple}`
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
      integer: this._integer,
      precision: this._precision,
      multiple: this._multiple
    };
  }
}

module.exports = NumberType;

