// lib/types/ArrayType.js

const BaseType = require('./BaseType');

/**
 * 数组类型
 *
 * @class ArrayType
 * @extends BaseType
 */
class ArrayType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'array';
    this._items = options.items;
    this._min = options.min;
    this._max = options.max;
    this._length = options.length;
    this._unique = options.unique || false;
  }

  /**
   * 设置元素Schema
   * @param {Object} itemSchema - 元素Schema
   * @returns {ArrayType}
   */
  items(itemSchema) {
    this._items = itemSchema;
    return this;
  }

  /**
   * 设置最小长度
   * @param {number} count - 最小数量
   * @returns {ArrayType}
   */
  min(count) {
    this._min = count;
    return this;
  }

  /**
   * 设置最大长度
   * @param {number} count - 最大数量
   * @returns {ArrayType}
   */
  max(count) {
    this._max = count;
    return this;
  }

  /**
   * 设置精确长度
   * @param {number} count - 长度
   * @returns {ArrayType}
   */
  length(count) {
    this._length = count;
    return this;
  }

  /**
   * 设置元素唯一性约束
   * @param {boolean} [unique=true] - 是否唯一
   * @returns {ArrayType}
   */
  unique(unique = true) {
    this._unique = unique;
    return this;
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (!Array.isArray(value)) {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected array, got ${typeof value}`
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
        message: `Array length must be at least ${this._min}, got ${value.length}`
      });
    }

    if (this._max !== undefined && value.length > this._max) {
      errors.push({
        type: 'max',
        message: `Array length must be at most ${this._max}, got ${value.length}`
      });
    }

    if (this._length !== undefined && value.length !== this._length) {
      errors.push({
        type: 'length',
        message: `Array length must be exactly ${this._length}, got ${value.length}`
      });
    }

    // 唯一性验证
    if (this._unique) {
      const seen = new Set();
      for (let i = 0; i < value.length; i++) {
        const key = JSON.stringify(value[i]);
        if (seen.has(key)) {
          errors.push({
            type: 'unique',
            message: `Array items must be unique, duplicate found at index ${i}`
          });
          break;
        }
        seen.add(key);
      }
    }

    // 元素验证
    if (this._items) {
      for (let i = 0; i < value.length; i++) {
        // 如果元素Schema有validate方法（类型实例），直接验证
        if (this._items.validate) {
          const result = await this._items.validate(value[i]);
          if (!result.isValid) {
            result.errors.forEach(err => {
              errors.push({
                ...err,
                path: `[${i}].${err.path || ''}`
              });
            });
          }
        }
      }
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
      items: this._items && this._items.toSchema ? this._items.toSchema() : this._items,
      min: this._min,
      max: this._max,
      length: this._length,
      unique: this._unique
    };
  }
}

module.exports = ArrayType;

