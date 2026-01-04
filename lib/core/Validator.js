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
const CustomKeywords = require('../validators/CustomKeywords');
const Locale = require('./Locale');

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
   * @param {Object} options.cache - 缓存配置选项 (v1.0.4+)
   * @param {number} options.cache.maxSize - 最大缓存条目数（默认100）
   * @param {number} options.cache.ttl - 缓存过期时间（毫秒，默认3600000）
   */
  constructor(options = {}) {
    // ajv配置
    this.ajvOptions = {
      allErrors: options.allErrors !== false,
      useDefaults: options.useDefaults !== false,
      coerceTypes: options.coerceTypes || false,
      removeAdditional: options.removeAdditional || false,
      verbose: true, // 启用详细模式，以便访问 parentSchema
      ...options
    };

    // 创建ajv实例
    this.ajv = new Ajv(this.ajvOptions);

    // 添加格式支持（email、uri、date-time等）
    addFormats(this.ajv);

    // 注册自定义关键字
    CustomKeywords.registerAll(this.ajv);

    // 编译缓存（支持自定义配置）
    const cacheOptions = {
      maxSize: options.cache?.maxSize ?? 100,
      ttl: options.cache?.ttl ?? 3600000, // 1小时
      enabled: options.cache?.enabled,
      statsEnabled: options.cache?.statsEnabled
    };
    this.cache = new CacheManager(cacheOptions);

    // 错误格式化器
    this.errorFormatter = new ErrorFormatter();

    // ✅ 性能优化：WeakMap 缓存键（避免 JSON.stringify）
    this.schemaMap = new WeakMap();
    this.schemaKeyCounter = 0;

    // ✅ 性能优化：缓存 DslBuilder 转换结果
    this.dslSchemaCache = new WeakMap();

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
   * @param {string} options.locale - 动态指定语言（如 'zh-CN', 'en-US'）
   * @returns {Object} 验证结果 { valid: boolean, errors: Array, data: * }
   */
  validate(schema, data, options = {}) {
    // ✅ 优化：直接传递 locale 到内部方法，不再切换全局状态
    return this._validateInternal(schema, data, options);
  }

  /**
   * 内部验证方法
   * @private
   */
  _validateInternal(schema, data, options = {}) {
    const shouldFormat = options.format !== false;
    const locale = options.locale || Locale.getLocale();

    // ✅ 性能优化：缓存 DslBuilder 转换结果
    if (schema && typeof schema.toSchema === 'function') {
      if (!this.dslSchemaCache.has(schema)) {
        this.dslSchemaCache.set(schema, schema.toSchema());
      }
      schema = this.dslSchemaCache.get(schema);
    }

    // 检查是否需要移除额外字段 (clean 模式)
    if (schema && schema._removeAdditional) {
      // 创建新的 Validator 实例，启用 removeAdditional
      const tempValidator = new Validator({
        ...this.ajvOptions,
        removeAdditional: true
      });

      // 移除标记字段并深拷贝，避免修改原 schema
      const cleanSchema = JSON.parse(JSON.stringify(schema));
      delete cleanSchema._removeAdditional;

      return tempValidator.validate(cleanSchema, data, options);
    }

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

      // ✅ 优化：直接传递 locale 和 messages 到格式化器，不修改全局状态
      const errors = valid ? [] : (
        shouldFormat
          ? this.errorFormatter.format(validate.errors, {
              locale,
              messages: options.messages
            })
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
   * 异步验证方法（验证失败自动抛出异常）
   *
   * @param {Object|Function} schema - JSON Schema对象或DslBuilder实例
   * @param {*} data - 待验证的数据
   * @param {Object} options - 验证选项（可选）
   * @param {boolean} options.format - 是否格式化错误（默认true）
   * @param {string} options.locale - 语言环境（如 'zh-CN', 'en-US'）
   * @returns {Promise<*>} 验证通过返回处理后的数据
   * @throws {ValidationError} 验证失败抛出异常
   *
   * @example
   * // 基础使用
   * try {
   *   const data = await validator.validateAsync(userSchema, inputData);
   *   console.log('验证通过:', data);
   * } catch (error) {
   *   if (error instanceof ValidationError) {
   *     console.error('验证失败:', error.errors);
   *   }
   * }
   *
   * @example
   * // Express 中使用
   * app.post('/users', async (req, res, next) => {
   *   try {
   *     const data = await validator.validateAsync(userSchema, req.body);
   *     const user = await db.users.insert(data);
   *     res.json(user);
   *   } catch (error) {
   *     next(error);
   *   }
   * });
   */
  async validateAsync(schema, data, options = {}) {
    const result = this.validate(schema, data, options);

    if (!result.valid) {
      const ValidationError = require('../errors/ValidationError');
      throw new ValidationError(result.errors, data);
    }

    return result.data;
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
    // ✅ 性能优化：使用 WeakMap 避免昂贵的 JSON.stringify
    // 对于对象类型的 schema，使用 WeakMap 存储唯一标识符
    if (typeof schema === 'object' && schema !== null) {
      if (!this.schemaMap.has(schema)) {
        this.schemaMap.set(schema, `schema_${++this.schemaKeyCounter}`);
      }
      return this.schemaMap.get(schema);
    }

    // 对于原始类型或 null，降级到字符串化
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

// Support calling without new
const ValidatorProxy = new Proxy(Validator, {
  apply: function (target, thisArg, argumentsList) {
    return new target(...argumentsList);
  }
});

module.exports = ValidatorProxy;
