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

    // ✅ 处理 ConditionalBuilder 条件链（运行时条件判断）
    if (schema && schema._isConditional) {
      // 顶层 ConditionalBuilder（直接作为 Schema 使用）
      // 此时验证的是整个数据对象
      return this._validateConditional(schema, data, null, data, options);
    }

    // ✅ 预处理包含 ConditionalBuilder 的 Schema
    if (schema && schema.properties) {
      const hasConditional = Object.values(schema.properties).some(
        fieldSchema => fieldSchema && fieldSchema._isConditional
      );

      if (hasConditional) {
        return this._validateWithConditionals(schema, data, options);
      }
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
   * 验证包含 ConditionalBuilder 字段的 Schema
   * @private
   * @param {Object} schema - Schema 对象
   * @param {*} data - 待验证的数据
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  _validateWithConditionals(schema, data, options = {}) {
    const errors = [];

    // 深拷贝 schema，避免修改原始对象
    const cleanSchema = JSON.parse(JSON.stringify(schema));
    const conditionalFields = {};

    // 提取所有条件字段
    for (const [fieldName, fieldSchema] of Object.entries(schema.properties || {})) {
      if (fieldSchema && fieldSchema._isConditional) {
        conditionalFields[fieldName] = fieldSchema;
        // 从 cleanSchema 中删除条件字段
        delete cleanSchema.properties[fieldName];
      }
    }

    // 先验证非条件字段
    const baseResult = this._validateInternal(cleanSchema, data, options);
    if (!baseResult.valid) {
      errors.push(...baseResult.errors);
    }

    // 然后验证每个条件字段
    for (const [fieldName, conditionalSchema] of Object.entries(conditionalFields)) {
      // ✅ 传递字段名和完整数据对象
      const fieldResult = this._validateConditional(
        conditionalSchema,
        data,
        fieldName,
        data[fieldName],
        options
      );

      if (!fieldResult.valid) {
        // 添加字段路径信息
        fieldResult.errors.forEach(error => {
          if (!error.path || error.path === '') {
            error.path = fieldName;
          }
          errors.push(error);
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      data
    };
  }

  /**
   * 验证条件链（ConditionalBuilder）
   * @private
   * @param {Object} conditionalSchema - 条件 Schema 对象
   * @param {*} data - 完整数据对象（用于条件判断）
   * @param {string} fieldName - 字段名
   * @param {*} fieldValue - 字段值（用于验证）
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  _validateConditional(conditionalSchema, data, fieldName, fieldValue, options = {}) {
    const locale = options.locale || Locale.getLocale();

    try {
      // ✅ 遍历条件链，执行第一个匹配的条件
      // 对于 if/elseIf 链，只执行第一个满足条件的分支
      for (let i = 0; i < conditionalSchema.conditions.length; i++) {
        const cond = conditionalSchema.conditions[i];

        // 执行组合条件（支持 and/or）
        const matched = conditionalSchema._evaluateCondition(cond, data);

        if (cond.action === 'throw') {
          // ✅ message 模式：条件为 true 时抛错，条件为 false 时通过
          if (matched) {
            // ✅ 条件满足（true），抛出错误
            // 支持多语言：如果 message 是 key（如 'conditional.underAge'），从语言包获取翻译
            // 传递 locale 参数以支持动态语言切换
            const errorMessage = Locale.getMessage(cond.message, options.messages || {}, locale);

            return {
              valid: false,
              errors: [{
                message: errorMessage,
                path: '',
                keyword: 'conditional',
                params: { condition: cond.type }
              }],
              data
            };
          }
          // 条件不满足（false），继续验证
          continue;
        }

        // ✅ then/else 模式：找到第一个满足的条件就执行并返回
        if (matched) {
          // 条件满足，执行 then Schema
          if (cond.then !== undefined && cond.then !== null) {
            return this._executeThenBranch(cond.then, data, fieldValue, fieldName, options);
          }

          // 条件满足但没有 then，表示验证通过
          return {
            valid: true,
            errors: [],
            data
          };
        }

        // ✅ 如果是 if/elseIf 条件不满足，继续检查下一个 elseIf
        // 这样就支持了 if...elseIf...elseIf...else 链
      }

      // ✅ 所有条件都不满足，执行 else
      if (conditionalSchema.else !== undefined) {
        if (conditionalSchema.else === null) {
          // else 为 null，表示跳过验证
          return {
            valid: true,
            errors: [],
            data
          };
        }

        // 执行 else Schema
        return this._executeThenBranch(conditionalSchema.else, data, fieldValue, fieldName, options);
      }

      // 没有 else，表示不验证
      return {
        valid: true,
        errors: [],
        data
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: `Conditional validation error: ${error.message}`,
          path: '',
          keyword: 'conditional'
        }],
        data
      };
    }
  }

  /**
   * 执行 then 分支（提取公共逻辑）
   * @private
   * @param {*} thenSchema - then 分支的 Schema
   * @param {*} data - 完整数据对象（用于嵌套条件判断）
   * @param {*} fieldValue - 字段值（用于验证）
   * @param {string} fieldName - 字段名
   * @param {Object} options - 验证选项
   */
  _executeThenBranch(thenSchema, data, fieldValue, fieldName, options) {
    const DslBuilder = require('./DslBuilder');

    // ✅ 如果是 ConditionalBuilder 实例（未调用 toSchema），先转换
    if (thenSchema && typeof thenSchema.toSchema === 'function') {
      thenSchema = thenSchema.toSchema();
    }

    // ✅ 处理嵌套的 ConditionalBuilder（已转换为 Schema 对象）
    if (thenSchema && thenSchema._isConditional) {
      // 嵌套的条件构建器，递归处理
      // 传递完整数据对象用于条件判断，传递字段值用于验证
      return this._validateConditional(thenSchema, data, fieldName, fieldValue, options);
    }

    // 如果是字符串，解析为 Schema
    if (typeof thenSchema === 'string') {
      const builder = new DslBuilder(thenSchema);
      thenSchema = builder.toSchema();
    }

    // ✅ 验证字段值
    return this._validateFieldValue(thenSchema, fieldValue, fieldName, options);
  }

  /**
   * 验证字段值（处理空字符串和 undefined）
   * @private
   * @param {Object} schema - Schema 对象
   * @param {*} fieldValue - 字段值
   * @param {string} fieldName - 字段名
   * @param {Object} options - 验证选项
   * @returns {Object} 验证结果
   */
  _validateFieldValue(schema, fieldValue, fieldName, options = {}) {
    // ✅ 检查字段是否必填
    const isRequired = schema && schema._required === true;

    // ✅ 处理 undefined：可选字段缺失时跳过验证
    if (!isRequired && fieldValue === undefined) {
      return {
        valid: true,
        errors: [],
        data: fieldValue
      };
    }

    // ✅ 处理空字符串：可选字段的空字符串视为未提供
    if (!isRequired && fieldValue === '') {
      return {
        valid: true,
        errors: [],
        data: fieldValue
      };
    }

    // 正常验证
    return this._validateInternal(schema, fieldValue, options);
  }

  /**
   * 静态工厂方法
   * @static
   * @param {Object} options - ajv配置选项
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
