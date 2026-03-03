import schemaDsl from './index.js';

export const {
  // 统一DSL API
  dsl,
  DslBuilder,

  // 配置函数 (v1.0.4+)
  config,

  // String 扩展控制
  installStringExtensions,
  uninstallStringExtensions,

  // 核心类
  JSONSchemaCore,
  Validator,

  // 便捷方法（推荐）
  validate,
  validateAsync,
  getDefaultValidator,
  ErrorFormatter,
  CacheManager,

  // 错误类 (v2.1.0 新增)
  ValidationError,
  I18nError,

  // 错误消息系统
  ErrorCodes,
  MessageTemplate,
  Locale,

  // 插件系统 (v2.2.0 新增)
  PluginManager,

  // 导出器
  exporters,
  MongoDBExporter,
  MySQLExporter,
  PostgreSQLExporter,
  MarkdownExporter,

  // 工具函数
  TypeConverter,
  SchemaHelper,
  SchemaUtils,

  // 验证器扩展
  CustomKeywords,

  // 常量
  CONSTANTS,

  // 版本信息
  VERSION
} = schemaDsl;

export default dsl;
