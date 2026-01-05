/**
 * schema-dsl - 主入口文件
 *
 * 统一的DSL Builder Pattern
 * 简洁 + 强大 = 完美平衡
 *
 * @module schema-dsl
 * @version 1.0.4
 */

// ========== 核心层 ==========
const JSONSchemaCore = require('./lib/core/JSONSchemaCore');
const Validator = require('./lib/core/Validator');
const ErrorFormatter = require('./lib/core/ErrorFormatter');
const CacheManager = require('./lib/core/CacheManager');
const DslBuilder = require('./lib/core/DslBuilder');
const PluginManager = require('./lib/core/PluginManager');
const ConditionalBuilder = require('./lib/core/ConditionalBuilder');

// ========== 错误消息系统 ==========
const ErrorCodes = require('./lib/core/ErrorCodes');
const MessageTemplate = require('./lib/core/MessageTemplate');
const Locale = require('./lib/core/Locale');

// ========== String 扩展 ==========
const { installStringExtensions, uninstallStringExtensions } = require('./lib/core/StringExtensions');

// ========== 适配器层 ==========
const dsl = require('./lib/adapters/DslAdapter');

// 挂载静态方法 (v2.1.0)
dsl.match = dsl.DslAdapter.match;

// ✅ 智能 dsl.if：根据参数类型选择实现
dsl.if = function(...args) {
  // 如果第一个参数是函数 → 使用新的 ConditionalBuilder（链式API）
  if (typeof args[0] === 'function') {
    return ConditionalBuilder.start(args[0]);
  }

  // 如果第一个参数是字符串且有3个参数 → 使用原有的字段条件实现
  // dsl.if('fieldName', thenSchema, elseSchema)
  if (typeof args[0] === 'string' && args.length >= 2) {
    return dsl.DslAdapter.if(args[0], args[1], args[2]);
  }

  // 其他情况 → 调用 ConditionalBuilder 让它抛出正确的错误
  return ConditionalBuilder.start(args[0]);
};

/**
 * 全局配置
 * @param {Object} options - 配置选项
 * @param {Object} options.patterns - 验证规则扩展 (phone, idCard, creditCard)
 * @param {string|Object} options.i18n - 多语言配置（目录路径或语言包对象）
 * @param {Object} options.cache - 缓存配置
 */
dsl.config = function (options = {}) {
  const patterns = require('./lib/config/patterns');

  // patterns 配置
  if (options.patterns) {
    if (options.patterns.phone) Object.assign(patterns.phone, options.patterns.phone);
    if (options.patterns.idCard) Object.assign(patterns.idCard, options.patterns.idCard);
    if (options.patterns.creditCard) Object.assign(patterns.creditCard, options.patterns.creditCard);
  }

  // 多语言支持 (v1.0.1 优化)
  if (options.i18n) {
    // 方式 1: 传入目录路径（字符串）
    if (typeof options.i18n === 'string') {
      const fs = require('fs');
      const path = require('path');

      if (fs.existsSync(options.i18n) && fs.statSync(options.i18n).isDirectory()) {
        const files = fs.readdirSync(options.i18n);
        files.forEach(file => {
          if (file.endsWith('.js') || file.endsWith('.json')) {
            const localeName = path.basename(file, path.extname(file));
            const messages = require(path.resolve(options.i18n, file));
            Locale.addLocale(localeName, messages);
          }
        });
      } else {
        console.warn('[schema-dsl] i18n path does not exist:', options.i18n);
      }
    }
    // 方式 2: 直接传入对象
    else if (typeof options.i18n === 'object') {
      Object.keys(options.i18n).forEach(locale => {
        Locale.addLocale(locale, options.i18n[locale]);
      });
    }
  }

  // 缓存配置 (v1.0.4+)
  if (options.cache) {
    // 如果 Validator 还未创建，保存配置供后续创建时使用
    if (!_defaultValidator) {
      _validatorOptions.cache = options.cache;
    } else {
      // 如果已创建，动态修改现有实例的配置（向后兼容）
      const cacheOpts = _defaultValidator.cache.options;
      if (options.cache.maxSize !== undefined) {
        cacheOpts.maxSize = options.cache.maxSize;
      }
      if (options.cache.ttl !== undefined) {
        cacheOpts.ttl = options.cache.ttl;
      }
      if (options.cache.enabled !== undefined) {
        cacheOpts.enabled = options.cache.enabled;
      }
      if (options.cache.statsEnabled !== undefined) {
        cacheOpts.statsEnabled = options.cache.statsEnabled;
      }
    }
  }
};

// ========== 导出器层 ==========
const exporters = require('./lib/exporters');

// ========== 初始化默认语言包 ==========
const defaultLocales = require('./lib/locales');
Object.entries(defaultLocales).forEach(([locale, messages]) => {
  Locale.addLocale(locale, messages);
});

// ========== 单例Validator ==========
let _defaultValidator = null;
let _validatorOptions = {}; // 存储 Validator 配置选项

/**
 * 获取默认Validator实例（单例）
 * @returns {Validator}
 */
function getDefaultValidator() {
  if (!_defaultValidator) {
    _defaultValidator = new Validator(_validatorOptions);
  }
  return _defaultValidator;
}

/**
 * 便捷验证方法（使用默认Validator）
 * @param {Object} schema - JSON Schema对象
 * @param {*} data - 待验证数据
 * @param {Object} [options] - 验证选项
 * @param {boolean} [options.format=true] - 是否格式化错误
 * @param {string} [options.locale] - 动态指定语言（如 'zh-CN', 'en-US'）
 * @param {Object} [options.messages] - 自定义错误消息
 * @returns {Object} 验证结果
 *
 * @example
 * const { validate, dsl } = require('schema-dsl');
 *
 * const schema = dsl({ email: 'email!' });
 *
 * // 基本验证
 * const result1 = validate(schema, { email: 'test@example.com' });
 *
 * // 指定语言
 * const result2 = validate(schema, { email: 'invalid' }, { locale: 'zh-CN' });
 */
function validate(schema, data, options) {
  return getDefaultValidator().validate(schema, data, options);
}

// ========== 工具函数 ==========
const { TypeConverter, SchemaHelper } = require('./lib/utils');
const SchemaUtils = require('./lib/utils/SchemaUtils');

// ========== 验证器扩展 ==========
const { CustomKeywords } = require('./lib/validators');

// ========== 常量 ==========
const CONSTANTS = require('./lib/config/constants');

// ========== 自动安装 String 扩展 ==========
installStringExtensions(dsl);


// ========== 导出 ==========

// 导入 ValidationError
const ValidationError = require('./lib/errors/ValidationError');

// 导入 validateAsync
const { validateAsync } = require('./lib/adapters/DslAdapter');

module.exports = {
  // 统一DSL API
  dsl,
  DslBuilder,

  // 配置函数 (v1.0.4+)
  config: dsl.config,

  // String 扩展控制
  installStringExtensions: () => installStringExtensions(dsl),
  uninstallStringExtensions,

  // 核心类
  JSONSchemaCore,
  Validator,
  DslBuilder,                  // v1.1.0 新增：导出DslBuilder供插件使用

  // 便捷方法（推荐）
  validate,                    // 便捷验证（单例）
  validateAsync,               // v2.1.0 新增：异步验证
  getDefaultValidator,         // 获取单例Validator
  ErrorFormatter,
  CacheManager,

  // 错误类 (v2.1.0 新增)
  ValidationError,

  // 错误消息系统
  ErrorCodes,
  MessageTemplate,
  Locale,

  // 插件系统 (v2.2.0 新增)
  PluginManager,

  // 导出器
  exporters,
  MongoDBExporter: exporters.MongoDBExporter,
  MySQLExporter: exporters.MySQLExporter,
  PostgreSQLExporter: exporters.PostgreSQLExporter,
  MarkdownExporter: exporters.MarkdownExporter,

  // 工具函数
  TypeConverter,
  SchemaHelper,
  SchemaUtils,                 // v2.0.1新增：Schema工具类

  // 验证器扩展
  CustomKeywords,

  // 常量
  CONSTANTS,

  // 版本信息
  VERSION: '1.0.4'
};


