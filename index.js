/**
 * SchemaIO 2.0 - 主入口文件
 *
 * 统一的DSL Builder Pattern
 * 简洁 + 强大 = 完美平衡
 *
 * @module schema-dsl
 * @version 2.0.0
 */

// ========== 核心层 ==========
const JSONSchemaCore = require('./lib/core/JSONSchemaCore');
const Validator = require('./lib/core/Validator');
const ErrorFormatter = require('./lib/core/ErrorFormatter');
const CacheManager = require('./lib/core/CacheManager');
const DslBuilder = require('./lib/core/DslBuilder');
const PluginManager = require('./lib/core/PluginManager');

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
dsl.if = dsl.DslAdapter.if;

/**
 * 全局配置
 * @param {Object} options - 配置选项
 * @param {Object} options.patterns - 验证规则扩展 (phone, idCard, creditCard)
 * @param {Object} options.phone - 手机号验证规则扩展 (兼容旧版)
 */
dsl.config = function (options = {}) {
  const patterns = require('./lib/config/patterns');

  // 兼容旧版 options.phone
  if (options.phone) {
    Object.assign(patterns.phone, options.phone);
  }

  // 新版 options.patterns
  if (options.patterns) {
    if (options.patterns.phone) Object.assign(patterns.phone, options.patterns.phone);
    if (options.patterns.idCard) Object.assign(patterns.idCard, options.patterns.idCard);
    if (options.patterns.creditCard) Object.assign(patterns.creditCard, options.patterns.creditCard);
  }

  // 多语言支持 (v2.1.0)
  if (options.locales) {
    if (typeof options.locales === 'object') {
      Object.keys(options.locales).forEach(locale => {
        Locale.addLocale(locale, options.locales[locale]);
      });
    } else if (typeof options.locales === 'string') {
      // 支持传入目录路径
      try {
        const fs = require('fs');
        const path = require('path');
        if (fs.existsSync(options.locales) && fs.statSync(options.locales).isDirectory()) {
          const files = fs.readdirSync(options.locales);
          files.forEach(file => {
            if (file.endsWith('.js') || file.endsWith('.json')) {
              const localeName = path.basename(file, path.extname(file));
              const messages = require(path.resolve(options.locales, file));
              Locale.addLocale(localeName, messages);
            }
          });
        }
      } catch (e) {
        console.warn('[SchemaIO] Failed to load locales from path:', e.message);
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
 * const { validate, dsl } = require('schema-dsl');
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
  VERSION: '2.2.0'              // 更新版本号
};
