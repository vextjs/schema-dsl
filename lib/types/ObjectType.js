// lib/types/ObjectType.js

const BaseType = require('./BaseType');

/**
 * 对象类型
 *
 * @class ObjectType
 * @extends BaseType
 */
class ObjectType extends BaseType {
  constructor(options = {}) {
    super(options);
    this.typeName = 'object';
    this._properties = options.properties || {};
    this._allowUnknown = options.allowUnknown !== undefined ? options.allowUnknown : true;
    this._minKeys = options.minKeys;
    this._maxKeys = options.maxKeys;
  }

  /**
   * 设置属性Schema
   * @param {Object} properties - 属性Schema映射
   * @returns {ObjectType}
   */
  keys(properties) {
    this._properties = properties;
    return this;
  }

  /**
   * 是否允许未定义的属性
   * @param {boolean} allow - 是否允许
   * @returns {ObjectType}
   */
  unknown(allow = true) {
    this._allowUnknown = allow;
    return this;
  }

  /**
   * 设置最小属性数
   * @param {number} count - 最小数量
   * @returns {ObjectType}
   */
  min(count) {
    this._minKeys = count;
    return this;
  }

  /**
   * 设置最大属性数
   * @param {number} count - 最大数量
   * @returns {ObjectType}
   */
  max(count) {
    this._maxKeys = count;
    return this;
  }

  /**
   * 类型检查
   * @protected
   */
  _checkType(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return {
        isValid: false,
        errors: [{
          type: 'type',
          message: `Expected object, got ${Array.isArray(value) ? 'array' : typeof value}`
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
    const keys = Object.keys(value);

    // 键数量验证
    if (this._minKeys !== undefined && keys.length < this._minKeys) {
      errors.push({
        type: 'min-keys',
        message: `Object must have at least ${this._minKeys} keys, got ${keys.length}`
      });
    }

    if (this._maxKeys !== undefined && keys.length > this._maxKeys) {
      errors.push({
        type: 'max-keys',
        message: `Object must have at most ${this._maxKeys} keys, got ${keys.length}`
      });
    }

    // 未知属性检查
    if (!this._allowUnknown) {
      const unknownKeys = keys.filter(key => !this._properties[key]);
      if (unknownKeys.length > 0) {
        errors.push({
          type: 'unknown-keys',
          message: `Unknown keys: ${unknownKeys.join(', ')}`
        });
      }
    }

    // 属性验证
    for (const [key, propSchema] of Object.entries(this._properties)) {
      const propValue = value[key];

      // 如果属性有toSchema方法（类型实例），先转换
      const schema = propSchema.toSchema ? propSchema.toSchema() : propSchema;

      // 如果属性有validate方法（类型实例），直接验证
      if (propSchema.validate) {
        const result = await propSchema.validate(propValue);
        if (!result.isValid) {
          result.errors.forEach(err => {
            errors.push({
              ...err,
              path: `${key}.${err.path || ''}`
            });
          });
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
    const properties = {};
    for (const [key, propSchema] of Object.entries(this._properties)) {
      properties[key] = propSchema.toSchema ? propSchema.toSchema() : propSchema;
    }

    return {
      ...super.toSchema(),
      properties,
      allowUnknown: this._allowUnknown,
      minKeys: this._minKeys,
      maxKeys: this._maxKeys
    };
  }
}

module.exports = ObjectType;

