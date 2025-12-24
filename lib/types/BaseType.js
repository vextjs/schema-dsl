// lib/types/BaseType.js

/**
 * 基础类型类
 * 所有类型的基类，定义通用接口
 *
 * @class BaseType
 */
class BaseType {
  constructor(options = {}) {
    this.options = options;
    this.typeName = 'any';
    this._required = options.required || false;
    this._default = options.default;
    this._validators = [];
    this._meta = {};
  }

  /**
   * 设置为必填
   * @returns {BaseType}
   */
  required() {
    this._required = true;
    return this;
  }

  /**
   * 设置为可选
   * @returns {BaseType}
   */
  optional() {
    this._required = false;
    return this;
  }

  /**
   * 设置默认值
   * @param {*} value - 默认值
   * @returns {BaseType}
   */
  default(value) {
    this._default = value;
    return this;
  }

  /**
   * 添加自定义验证器
   * @param {Function} fn - 验证函数
   * @param {string} [message] - 错误消息
   * @returns {BaseType}
   */
  custom(fn, message) {
    this._validators.push({
      type: 'custom',
      fn,
      message
    });
    return this;
  }

  /**
   * 设置元数据
   * @param {string} key - 键
   * @param {*} value - 值
   * @returns {BaseType}
   */
  meta(key, value) {
    this._meta[key] = value;
    return this;
  }

  /**
   * 设置描述
   * @param {string} text - 描述文本
   * @returns {BaseType}
   */
  description(text) {
    this._meta.description = text;
    return this;
  }

  /**
   * 设置示例
   * @param {*} value - 示例值
   * @returns {BaseType}
   */
  example(value) {
    this._meta.example = value;
    return this;
  }

  /**
   * 构建Schema
   * @returns {Object}
   */
  toSchema() {
    return {
      type: this.typeName,
      required: this._required,
      default: this._default,
      validators: this._validators,
      meta: this._meta
    };
  }

  /**
   * 验证值（子类应重写）
   * @param {*} value - 待验证值
   * @returns {Promise<Object>} 验证结果
   */
  async validate(value) {
    const errors = [];

    // 必填检查
    if (this._required && (value === undefined || value === null)) {
      errors.push({
        type: 'required',
        message: 'Value is required'
      });
      return { isValid: false, errors };
    }

    // 可选字段，值为空时跳过
    if (!this._required && (value === undefined || value === null)) {
      return { isValid: true, errors: [] };
    }

    // 类型检查（由子类实现）
    const typeCheckResult = this._checkType(value);
    if (!typeCheckResult.isValid) {
      errors.push(...typeCheckResult.errors);
      return { isValid: false, errors };
    }

    // 自定义验证
    for (const validator of this._validators) {
      const result = await validator.fn(value);
      if (result !== true) {
        errors.push({
          type: 'custom',
          message: typeof result === 'string' ? result : (validator.message || 'Validation failed')
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 类型检查（子类必须重写）
   * @protected
   * @param {*} value - 待检查值
   * @returns {Object} 检查结果
   */
  _checkType(value) {
    // 基类接受任何类型
    return { isValid: true, errors: [] };
  }
}

module.exports = BaseType;

