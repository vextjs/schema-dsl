/**
 * JSON Schema核心类
 *
 * 负责管理JSON Schema对象，提供统一的Schema表示
 * 所有适配器转换后的Schema都使用此类表示
 *
 * @module lib/core/JSONSchemaCore
 * @version 1.0.0
 */

const CONSTANTS = require('../config/constants');

/**
 * JSON Schema核心类
 *
 * @class JSONSchemaCore
 * @description 基于JSON Schema Draft 7标准
 */
class JSONSchemaCore {
  /**
   * 构造函数
   * @param {Object} schema - JSON Schema对象
   * @param {Object} options - 配置选项
   * @param {boolean} options.strict - 是否启用严格模式（默认false）
   * @param {string} options.draft - JSON Schema草案版本（默认'draft-07'）
   */
  constructor(schema = {}, options = {}) {
    this.schema = this._normalizeSchema(schema);
    this.options = {
      strict: options.strict || false,
      draft: options.draft || 'draft-07',
      ...options
    };

    // 确保$schema字段
    if (!this.schema.$schema) {
      this.schema.$schema = 'http://json-schema.org/draft-07/schema#';
    }
  }

  /**
   * 规范化Schema对象
   * @private
   * @param {Object} schema - 原始Schema
   * @returns {Object} 规范化后的Schema
   */
  _normalizeSchema(schema) {
    if (!schema || typeof schema !== 'object') {
      return { type: 'object' };
    }

    // 深拷贝避免修改原对象
    return JSON.parse(JSON.stringify(schema));
  }

  /**
   * 获取Schema对象
   * @returns {Object} JSON Schema对象
   */
  getSchema() {
    return this.schema;
  }

  /**
   * 设置Schema类型
   * @param {string} type - 类型名称（string/number/boolean/object/array/null）
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setType(type) {
    const validTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid type: ${type}. Valid types: ${validTypes.join(', ')}`);
    }
    this.schema.type = type;
    return this;
  }

  /**
   * 设置必填字段
   * @param {string[]} required - 必填字段数组
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setRequired(required) {
    if (!Array.isArray(required)) {
      throw new Error('Required must be an array');
    }
    this.schema.required = required;
    return this;
  }

  /**
   * 设置属性定义
   * @param {string} name - 属性名
   * @param {Object} propertySchema - 属性Schema
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setProperty(name, propertySchema) {
    if (!this.schema.properties) {
      this.schema.properties = {};
    }
    this.schema.properties[name] = propertySchema;
    return this;
  }

  /**
   * 设置多个属性
   * @param {Object} properties - 属性对象
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setProperties(properties) {
    if (typeof properties !== 'object' || properties === null) {
      throw new Error('Properties must be an object');
    }
    this.schema.properties = { ...this.schema.properties, ...properties };
    return this;
  }

  /**
   * 设置数组items
   * @param {Object} itemsSchema - items的Schema
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setItems(itemsSchema) {
    this.schema.items = itemsSchema;
    return this;
  }

  /**
   * 设置字符串格式
   * @param {string} format - 格式（email/uri/date-time等）
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setFormat(format) {
    this.schema.format = format;
    return this;
  }

  /**
   * 设置字符串正则模式
   * @param {string} pattern - 正则表达式字符串
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setPattern(pattern) {
    this.schema.pattern = pattern;
    return this;
  }

  /**
   * 设置数值范围（最小值）
   * @param {number} min - 最小值
   * @param {boolean} exclusive - 是否不包含边界（默认false）
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setMinimum(min, exclusive = false) {
    if (exclusive) {
      this.schema.exclusiveMinimum = min;
    } else {
      this.schema.minimum = min;
    }
    return this;
  }

  /**
   * 设置数值范围（最大值）
   * @param {number} max - 最大值
   * @param {boolean} exclusive - 是否不包含边界（默认false）
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setMaximum(max, exclusive = false) {
    if (exclusive) {
      this.schema.exclusiveMaximum = max;
    } else {
      this.schema.maximum = max;
    }
    return this;
  }

  /**
   * 设置字符串长度范围
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setLength(min, max) {
    if (min !== undefined) {
      this.schema.minLength = min;
    }
    if (max !== undefined) {
      this.schema.maxLength = max;
    }
    return this;
  }

  /**
   * 设置数组长度范围
   * @param {number} min - 最小长度
   * @param {number} max - 最大长度
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setArrayLength(min, max) {
    if (min !== undefined) {
      this.schema.minItems = min;
    }
    if (max !== undefined) {
      this.schema.maxItems = max;
    }
    return this;
  }

  /**
   * 设置枚举值
   * @param {Array} values - 枚举值数组
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setEnum(values) {
    if (!Array.isArray(values)) {
      throw new Error('Enum values must be an array');
    }
    this.schema.enum = values;
    return this;
  }

  /**
   * 设置默认值
   * @param {*} value - 默认值
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setDefault(value) {
    this.schema.default = value;
    return this;
  }

  /**
   * 设置描述
   * @param {string} description - 描述文本
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setDescription(description) {
    this.schema.description = description;
    return this;
  }

  /**
   * 设置标题
   * @param {string} title - 标题文本
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  setTitle(title) {
    this.schema.title = title;
    return this;
  }

  /**
   * 添加自定义关键字
   * @param {string} keyword - 关键字名称
   * @param {*} value - 关键字值
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  addCustomKeyword(keyword, value) {
    this.schema[keyword] = value;
    return this;
  }

  /**
   * 合并另一个Schema
   * @param {Object} otherSchema - 要合并的Schema对象
   * @returns {JSONSchemaCore} 返回this支持链式调用
   */
  merge(otherSchema) {
    this.schema = {
      ...this.schema,
      ...otherSchema
    };
    return this;
  }

  /**
   * 转换为JSON字符串
   * @param {number} space - 缩进空格数（默认2）
   * @returns {string} JSON字符串
   */
  toJSON(space = 2) {
    return JSON.stringify(this.schema, null, space);
  }

  /**
   * 克隆当前Schema
   * @returns {JSONSchemaCore} 新的JSONSchemaCore实例
   */
  clone() {
    return new JSONSchemaCore(this.schema, this.options);
  }

  /**
   * 验证Schema是否有效
   * @returns {Object} 验证结果 { valid: boolean, errors: Array }
   */
  validateSchema() {
    const errors = [];

    // 基本验证
    if (!this.schema.type && !this.schema.properties && !this.schema.items) {
      errors.push('Schema must have type, properties, or items');
    }

    // 类型验证
    if (this.schema.type) {
      const validTypes = ['string', 'number', 'integer', 'boolean', 'object', 'array', 'null'];
      if (!validTypes.includes(this.schema.type)) {
        errors.push(`Invalid type: ${this.schema.type}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 静态方法：从JSON字符串创建
   * @static
   * @param {string} jsonString - JSON字符串
   * @returns {JSONSchemaCore} JSONSchemaCore实例
   */
  static fromJSON(jsonString) {
    try {
      const schema = JSON.parse(jsonString);
      return new JSONSchemaCore(schema);
    } catch (error) {
      throw new Error(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * 静态方法：创建简单类型Schema
   * @static
   * @param {string} type - 类型名称
   * @returns {JSONSchemaCore} JSONSchemaCore实例
   */
  static createSimpleType(type) {
    return new JSONSchemaCore({ type });
  }
}

module.exports = JSONSchemaCore;

