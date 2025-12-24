// lib/core/SchemaBuilder.js

const CONSTANTS = require('../config/constants');

/**
 * Schema构建器
 * 支持链式调用构建Schema
 *
 * @class SchemaBuilder
 */
class SchemaBuilder {
  constructor(typeSystem, typeName) {
    this.typeSystem = typeSystem;
    this.schema = {
      type: typeName,
      validators: []
    };
    this._frozen = false;
  }

  /**
   * 设置为必填
   * @returns {SchemaBuilder}
   */
  required() {
    this._ensureNotFrozen();
    this.schema.required = true;
    return this;
  }

  /**
   * 设置为可选
   * @returns {SchemaBuilder}
   */
  optional() {
    this._ensureNotFrozen();
    this.schema.required = false;
    return this;
  }

  /**
   * 设置最小值/最小长度
   * @param {number} value - 最小值
   * @returns {SchemaBuilder}
   */
  min(value) {
    this._ensureNotFrozen();
    this.schema.min = value;
    this.schema.validators.push({ type: 'min', value });
    return this;
  }

  /**
   * 设置最大值/最大长度
   * @param {number} value - 最大值
   * @returns {SchemaBuilder}
   */
  max(value) {
    this._ensureNotFrozen();
    this.schema.max = value;
    this.schema.validators.push({ type: 'max', value });
    return this;
  }

  /**
   * 设置精确长度/值
   * @param {number} value - 长度/值
   * @returns {SchemaBuilder}
   */
  length(value) {
    this._ensureNotFrozen();
    this.schema.length = value;
    this.schema.validators.push({ type: 'length', value });
    return this;
  }

  /**
   * 设置正则表达式模式
   * @param {RegExp|string} pattern - 正则表达式
   * @returns {SchemaBuilder}
   */
  pattern(pattern) {
    this._ensureNotFrozen();
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    this.schema.pattern = regex;
    this.schema.validators.push({ type: 'pattern', value: regex });
    return this;
  }

  /**
   * 设置枚举值
   * @param {Array} values - 允许的值列表
   * @returns {SchemaBuilder}
   */
  valid(...values) {
    this._ensureNotFrozen();
    const enumValues = values.flat();
    this.schema.enum = enumValues;
    this.schema.validators.push({ type: 'enum', value: enumValues });
    return this;
  }

  /**
   * 设置默认值
   * @param {*} value - 默认值或默认值函数
   * @returns {SchemaBuilder}
   */
  default(value) {
    this._ensureNotFrozen();
    this.schema.default = value;
    return this;
  }

  /**
   * 添加自定义验证函数
   * @param {Function} fn - 验证函数
   * @param {string} [message] - 错误消息
   * @returns {SchemaBuilder}
   */
  custom(fn, message) {
    this._ensureNotFrozen();
    this.schema.validators.push({
      type: 'custom',
      fn,
      message
    });
    return this;
  }

  /**
   * 设置描述
   * @param {string} text - 描述文本
   * @returns {SchemaBuilder}
   */
  description(text) {
    this._ensureNotFrozen();
    this.schema.description = text;
    return this;
  }

  /**
   * 设置示例值
   * @param {*} value - 示例值
   * @returns {SchemaBuilder}
   */
  example(value) {
    this._ensureNotFrozen();
    this.schema.example = value;
    return this;
  }

  /**
   * 设置标签
   * @param {...string} tags - 标签
   * @returns {SchemaBuilder}
   */
  tags(...tags) {
    this._ensureNotFrozen();
    this.schema.tags = tags.flat();
    return this;
  }

  /**
   * 设置元数据
   * @param {string} key - 键
   * @param {*} value - 值
   * @returns {SchemaBuilder}
   */
  meta(key, value) {
    this._ensureNotFrozen();
    if (!this.schema.meta) {
      this.schema.meta = {};
    }
    this.schema.meta[key] = value;
    return this;
  }

  /**
   * 字符串类型：设置email格式
   * @returns {SchemaBuilder}
   */
  email() {
    this._ensureStringType();
    return this.pattern(CONSTANTS.FORMATS.PATTERNS.email).meta('format', 'email');
  }

  /**
   * 字符串类型：设置URL格式
   * @returns {SchemaBuilder}
   */
  url() {
    this._ensureStringType();
    return this.meta('format', 'url');
  }

  /**
   * 字符串类型：设置UUID格式
   * @returns {SchemaBuilder}
   */
  uuid() {
    this._ensureStringType();
    return this.pattern(CONSTANTS.FORMATS.PATTERNS.uuid).meta('format', 'uuid');
  }

  /**
   * 数字类型：设置为整数
   * @returns {SchemaBuilder}
   */
  integer() {
    this._ensureNumberType();
    this.schema.integer = true;
    this.schema.validators.push({
      type: 'custom',
      fn: (value) => Number.isInteger(value),
      message: 'Must be an integer'
    });
    return this;
  }

  /**
   * 数字类型：设置精度
   * @param {number} digits - 小数位数
   * @returns {SchemaBuilder}
   */
  precision(digits) {
    this._ensureNumberType();
    this.schema.precision = digits;
    this.schema.validators.push({
      type: 'custom',
      fn: (value) => {
        const parts = value.toString().split('.');
        return !parts[1] || parts[1].length <= digits;
      },
      message: `Precision must be at most ${digits} decimal places`
    });
    return this;
  }

  /**
   * 对象类型：设置properties
   * @param {Object} props - 属性Schema
   * @returns {SchemaBuilder}
   */
  keys(props) {
    this._ensureObjectType();
    this.schema.properties = props;
    return this;
  }

  /**
   * 数组类型：设置元素Schema
   * @param {Object} itemSchema - 元素Schema
   * @returns {SchemaBuilder}
   */
  items(itemSchema) {
    this._ensureArrayType();
    this.schema.items = itemSchema;
    return this;
  }

  /**
   * 数组类型：设置唯一性约束
   * @returns {SchemaBuilder}
   */
  unique() {
    this._ensureArrayType();
    this.schema.uniqueItems = true;
    this.schema.validators.push({
      type: 'custom',
      fn: (value) => {
        if (!Array.isArray(value)) return true;
        const seen = new Set();
        for (const item of value) {
          const key = JSON.stringify(item);
          if (seen.has(key)) return false;
          seen.add(key);
        }
        return true;
      },
      message: 'Array items must be unique'
    });
    return this;
  }

  /**
   * 构建最终Schema
   * @returns {Object} 冻结的Schema对象
   */
  build() {
    if (this._frozen) {
      return this.schema;
    }

    // 生成Schema ID
    this.schema.id = this._generateId();

    // 冻结Schema
    Object.freeze(this.schema);
    Object.freeze(this.schema.validators);
    if (this.schema.properties) {
      Object.freeze(this.schema.properties);
    }

    this._frozen = true;
    return this.schema;
  }

  /**
   * 验证数据（快捷方法）
   * @param {*} data - 待验证数据
   * @param {Object} [options] - 验证选项
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, options) {
    const Validator = require('./Validator');
    const validator = new Validator(options);
    return await validator.validate(this.build(), data);
  }

  /**
   * 克隆SchemaBuilder
   * @returns {SchemaBuilder} 新的SchemaBuilder实例
   */
  clone() {
    const cloned = new SchemaBuilder(this.typeSystem, this.schema.type);
    cloned.schema = JSON.parse(JSON.stringify(this.schema));
    return cloned;
  }

  // ===== 私有方法 =====

  _ensureNotFrozen() {
    if (this._frozen) {
      throw new Error('Cannot modify frozen schema. Use clone() to create a new schema.');
    }
  }

  _ensureStringType() {
    if (this.schema.type !== 'string') {
      throw new Error('This method is only available for string type');
    }
  }

  _ensureNumberType() {
    if (this.schema.type !== 'number') {
      throw new Error('This method is only available for number type');
    }
  }

  _ensureObjectType() {
    if (this.schema.type !== 'object') {
      throw new Error('This method is only available for object type');
    }
  }

  _ensureArrayType() {
    if (this.schema.type !== 'array') {
      throw new Error('This method is only available for array type');
    }
  }

  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `schema_${this.schema.type}_${timestamp}${random}`;
  }
}

module.exports = SchemaBuilder;

