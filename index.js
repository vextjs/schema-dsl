/**
 * SchemaIO 2.0 - 主入口文件
 *
 * 统一的DSL Builder Pattern
 * 简洁 + 强大 = 完美平衡
 *
 * @module schemaio
 * @version 2.0.0
 */

// ========== 核心层 ==========
const JSONSchemaCore = require('./lib/core/JSONSchemaCore');
const Validator = require('./lib/core/Validator');
const ErrorFormatter = require('./lib/core/ErrorFormatter');
const CacheManager = require('./lib/core/CacheManager');
const DslBuilder = require('./lib/core/DslBuilder');

// ========== 错误消息系统 ==========
const ErrorCodes = require('./lib/core/ErrorCodes');
const MessageTemplate = require('./lib/core/MessageTemplate');
const Locale = require('./lib/core/Locale');

// ========== String 扩展 ==========
const { installStringExtensions, uninstallStringExtensions } = require('./lib/core/StringExtensions');

// ========== 适配器层 ==========
const dsl = require('./lib/adapters/DslAdapter');

// ========== 导出器层 ==========
const exporters = require('./lib/exporters');

// ========== 初始化默认语言包 ==========
const defaultLocales = require('./lib/locales');
Object.entries(defaultLocales).forEach(([locale, messages]) => {
  Locale.addLocale(locale, messages);
});

// ========== 单例Validator ==========
let _defaultValidator = null;

/**
 * 获取默认Validator实例（单例）
 * @returns {Validator}
 */
function getDefaultValidator() {
  if (!_defaultValidator) {
    _defaultValidator = new Validator();
  }
  return _defaultValidator;
}

/**
 * 便捷验证方法（使用默认Validator）
 * @param {Object} schema - JSON Schema对象
 * @param {*} data - 待验证数据
 * @returns {Object} 验证结果
 *
 * @example
 * const { validate, dsl } = require('schemaio');
 *
 * const schema = dsl({ email: 'email!' });
 * const result = validate(schema, { email: 'test@example.com' });
 */
function validate(schema, data) {
  return getDefaultValidator().validate(schema, data);
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

module.exports = {
  // 统一DSL API
  dsl,
  DslBuilder,

  // String 扩展控制
  installStringExtensions: () => installStringExtensions(dsl),
  uninstallStringExtensions,

  // 核心类
  JSONSchemaCore,
  Validator,

  // 便捷方法（推荐）
  validate,                    // 便捷验证（单例）
  getDefaultValidator,         // 获取单例Validator
  ErrorFormatter,
  CacheManager,

  // 错误消息系统
  ErrorCodes,
  MessageTemplate,
  Locale,

  // 导出器
  exporters,
  MongoDBExporter: exporters.MongoDBExporter,
  MySQLExporter: exporters.MySQLExporter,
  PostgreSQLExporter: exporters.PostgreSQLExporter,

  // 工具函数
  TypeConverter,
  SchemaHelper,
  SchemaUtils,                 // v2.0.1新增：Schema工具类

  // 验证器扩展
  CustomKeywords,

  // 常量
  CONSTANTS,

  // 版本信息
  VERSION: '2.0.1'              // 更新版本号
};

