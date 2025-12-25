/**
 * Validator - JSON Schema验证器
 *
 * 基于ajv实现，支持JSON Schema Draft 7标准
 *
 * @module lib/core/Validator
 * @version 1.0.0
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const CacheManager = require('./CacheManager');
const ErrorFormatter = require('./ErrorFormatter');

/**
 * 验证器类
 *
 * @class Validator
 * @description 封装ajv，提供统一的验证接口
 */
class Validator {
  /**
   * 构造函数
   * @param {Object} options - ajv配置选项
   * @param {boolean} options.allErrors - 是否返回所有错误（默认true）
   * @param {boolean} options.useDefaults - 是否使用默认值（默认true）
   * @param {boolean} options.coerceTypes - 是否自动类型转换（默认false）
   * @param {boolean} options.removeAdditional - 是否移除额外属性（默认false）
   */
  constructor(options = {}) {
    // ajv配置
    this.ajvOptions = {
      allErrors: options.allErrors !== false,
      useDefaults: options.useDefaults !== false,
      coerceTypes: options.coerceTypes || false,
      removeAdditional: options.removeAdditional || false,
      ...options
    };

    // 创建ajv实例
    this.ajv = new Ajv(this.ajvOptions);

    // 添加格式支持（email、uri、date-time等）
    addFormats(this.ajv);

    // 编译缓存
    this.cache = new CacheManager({
      maxSize: 100,
      ttl: 3600000 // 1小时
    });

    // 错误格式化器
    this.errorFormatter = new ErrorFormatter();

    // 自定义关键字注册表
    this.customKeywords = new Map();
  }

  /**
   * 编译Schema
   * @param {Object} schema - JSON Schema对象
   * @param {string} cacheKey - 缓存键（可选）
   * @returns {Function} ajv验证函数
   */
  compile(schema, cacheKey = null) {
    // 尝试从缓存获取
    if (cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // 编译Schema
      const validate = this.ajv.compile(schema);

      // 缓存编译结果
      if (cacheKey) {
        this.cache.set(cacheKey, validate);
      }

      return validate;
    } catch (error) {
      throw new Error(`Schema compilation failed: ${error.message}`);
    }
  }

  /**
   * 验证数据
   * @param {Object} schema - JSON Schema对象或已编译的验证函数
   * @param {*} data - 待验证的数据
   * @param {Object} options - 验证选项
   * @param {boolean} options.format - 是否格式化错误（默认true）
   * @returns {Object} 验证结果 { valid: boolean, errors: Array, data: * }
   */
  validate(schema, data, options = {}) {
    const shouldFormat = options.format !== false;

    try {
      // 如果schema是函数，说明已编译
      let validate;
      if (typeof schema === 'function') {
        validate = schema;
      } else {
        // 生成缓存键
        const cacheKey = this._generateCacheKey(schema);
        validate = this.compile(schema, cacheKey);
      }

      // 执行验证
      const valid = validate(data);

      // 格式化错误
      const errors = valid ? [] : (
        shouldFormat
          ? this.errorFormatter.format(validate.errors)
          : validate.errors
      );

      return {
        valid,
        errors,
        data // 可能被useDefaults修改过
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: `Validation error: ${error.message}`,
          path: '',
          keyword: 'error'
        }],
        data
      };
    }
  }

  /**
   * 快速验证（不缓存）
   * @param {Object} schema - JSON Schema对象
   * @param {*} data - 待验证的数据
   * @returns {boolean} 是否有效
   */
  quickValidate(schema, data) {
    try {
      return this.ajv.validate(schema, data);
    } catch (error) {
      return false;
    }
  }

  /**
   * 批量验证
   * @param {Object} schema - JSON Schema对象
   * @param {Array} dataArray - 数据数组
   * @returns {Array} 验证结果数组
   */
  validateBatch(schema, dataArray) {
    if (!Array.isArray(dataArray)) {
      throw new Error('Data must be an array');
    }

    // 编译一次，复用验证函数
    const cacheKey = this._generateCacheKey(schema);
    const validate = this.compile(schema, cacheKey);

    return dataArray.map(data => this.validate(validate, data));
  }

  /**
   * 添加自定义关键字
   * @param {string} keyword - 关键字名称
   * @param {Object} definition - 关键字定义
   * @returns {Validator} 返回this支持链式调用
   */
  addKeyword(keyword, definition) {
    try {
      this.ajv.addKeyword(keyword, definition);
      this.customKeywords.set(keyword, definition);
      return this;
    } catch (error) {
      throw new Error(`Failed to add keyword '${keyword}': ${error.message}`);
    }
  }

  /**
   * 添加自定义格式
   * @param {string} name - 格式名称
   * @param {Function|RegExp} validator - 验证函数或正则表达式
   * @returns {Validator} 返回this支持链式调用
   */
  addFormat(name, validator) {
    try {
      this.ajv.addFormat(name, validator);
      return this;
    } catch (error) {
      throw new Error(`Failed to add format '${name}': ${error.message}`);
    }
  }

  /**
   * 添加Schema引用
   * @param {string} uri - Schema URI
   * @param {Object} schema - JSON Schema对象
   * @returns {Validator} 返回this支持链式调用
   */
  addSchema(uri, schema) {
    try {
      this.ajv.addSchema(schema, uri);
      return this;
    } catch (error) {
      throw new Error(`Failed to add schema '${uri}': ${error.message}`);
    }
  }

  /**
   * 移除Schema引用
   * @param {string} uri - Schema URI
   * @returns {Validator} 返回this支持链式调用
   */
  removeSchema(uri) {
    this.ajv.removeSchema(uri);
    return this;
  }

  /**
   * 获取ajv实例（高级用法）
   * @returns {Ajv} ajv实例
   */
  getAjv() {
    return this.ajv;
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   * @returns {Object} 缓存统计信息
   */
  getCacheStats() {
    return this.cache.stats();
  }

  /**
   * 生成Schema的缓存键
   * @private
   * @param {Object} schema - JSON Schema对象
   * @returns {string} 缓存键
   */
  _generateCacheKey(schema) {
    // 简单实现：使用JSON字符串的hash
    // 生产环境建议使用更高效的hash算法
    return JSON.stringify(schema);
  }

  /**
   * 静态方法：创建验证器实例
   * @static
   * @param {Object} options - 配置选项
   * @returns {Validator} Validator实例
   */
  static create(options) {
    return new Validator(options);
  }

  /**
   * 静态方法：快速验证（不创建实例）
   * @static
   * @param {Object} schema - JSON Schema对象
   * @param {*} data - 待验证的数据
   * @returns {boolean} 是否有效
   */
  static quickValidate(schema, data) {
    const ajv = new Ajv();
    return ajv.validate(schema, data);
  }
}

module.exports = Validator;

