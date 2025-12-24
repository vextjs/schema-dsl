/**
 * SchemaIO 2.0 - 主入口文件
 *
 * 统一导出所有API风格和核心功能
 *
 * @module schemaio
 * @version 2.0.0
 */

const CONSTANTS = require('./lib/config/constants');

// ========== 核心类（懒加载） ==========
let SchemaBuilder, Validator, TypeSystem, ErrorFormatter, CacheManager;

function loadCore() {
  if (!SchemaBuilder) {
    SchemaBuilder = require('./lib/core/SchemaBuilder');
    Validator = require('./lib/core/Validator');
    TypeSystem = require('./lib/core/TypeSystem');
    ErrorFormatter = require('./lib/core/ErrorFormatter');
    CacheManager = require('./lib/core/CacheManager');
  }
  return { SchemaBuilder, Validator, TypeSystem, ErrorFormatter, CacheManager };
}

// ========== API层（懒加载） ==========
let joiAPI, dslAPI, jsonSchemaAPI, functionalAPI;

function loadJoiAPI() {
  if (!joiAPI) {
    joiAPI = require('./lib/api/joi-style');
  }
  return joiAPI;
}

function loadDslAPI() {
  if (!dslAPI) {
    dslAPI = require('./lib/api/dsl-style');
  }
  return dslAPI;
}

function loadJSONSchemaAPI() {
  if (!jsonSchemaAPI) {
    jsonSchemaAPI = require('./lib/api/json-schema');
  }
  return jsonSchemaAPI;
}

function loadFunctionalAPI() {
  if (!functionalAPI) {
    functionalAPI = require('./lib/api/functional');
  }
  return functionalAPI;
}

// ========== 导出器（懒加载） ==========
let exporters;

function loadExporters() {
  if (!exporters) {
    exporters = {
      jsonSchema: require('./lib/exporters/json-schema'),
      mongodb: require('./lib/exporters/mongodb'),
      mysql: require('./lib/exporters/mysql'),
      postgresql: require('./lib/exporters/postgresql')
    };
  }
  return exporters;
}

// ========== 主导出对象 ==========

/**
 * Joi风格Schema构建器（默认API）
 * @example
 * const { schema } = require('schemaio');
 * const userSchema = schema.object({
 *   username: schema.string().min(3).max(32).required(),
 *   email: schema.string().email().required()
 * });
 */
const schema = new Proxy({}, {
  get(target, prop) {
    const api = loadJoiAPI();
    return api[prop];
  }
});

/**
 * DSL风格API
 * @example
 * const { _, $, s } = require('schemaio');
 * const userSchema = _({ username: 's:3-32!', email: 's:email!' });
 */
const _ = new Proxy(function() {}, {
  apply(target, thisArg, args) {
    const api = loadDslAPI();
    return api._(args[0]);
  }
});

const $ = new Proxy({}, {
  get(target, prop) {
    const api = loadDslAPI();
    return api.$[prop];
  }
});

const s = new Proxy(function() {}, {
  apply(target, thisArg, args) {
    const api = loadDslAPI();
    return api.s(args[0]);
  }
});

/**
 * JSON Schema API
 * @example
 * const { fromJSONSchema, toJSONSchema } = require('schemaio');
 * const schema = fromJSONSchema({ type: 'object', properties: { ... } });
 */
function fromJSONSchema(jsonSchema) {
  const api = loadJSONSchemaAPI();
  return api.fromJSONSchema(jsonSchema);
}

function toJSONSchema(schema) {
  const api = loadJSONSchemaAPI();
  return api.toJSONSchema(schema);
}

/**
 * 函数式API
 * @example
 * const { pipe, required, min, max } = require('schemaio');
 * const validator = pipe(required, min(3), max(32));
 */
const pipe = new Proxy(function() {}, {
  apply(target, thisArg, args) {
    const api = loadFunctionalAPI();
    return api.pipe(...args);
  }
});

// ========== 导出器函数 ==========

/**
 * 导出为JSON Schema
 * @param {Object} schema - SchemaIO Schema
 * @returns {Object} JSON Schema对象
 */
function exportToJSONSchema(schema) {
  const exp = loadExporters();
  return exp.jsonSchema.export(schema);
}

/**
 * 导出为MongoDB Schema
 * @param {Object} schema - SchemaIO Schema
 * @param {Object} [options] - 导出选项
 * @returns {Object} Mongoose Schema定义
 */
function exportToMongoDB(schema, options) {
  const exp = loadExporters();
  return exp.mongodb.export(schema, options);
}

/**
 * 导出为MySQL DDL
 * @param {Object} schema - SchemaIO Schema
 * @param {string} tableName - 表名
 * @param {Object} [options] - 导出选项
 * @returns {string} CREATE TABLE语句
 */
function exportToMySQL(schema, tableName, options) {
  const exp = loadExporters();
  return exp.mysql.export(schema, tableName, options);
}

/**
 * 导出为PostgreSQL DDL
 * @param {Object} schema - SchemaIO Schema
 * @param {string} tableName - 表名
 * @param {Object} [options] - 导出选项
 * @returns {string} CREATE TABLE语句
 */
function exportToPostgreSQL(schema, tableName, options) {
  const exp = loadExporters();
  return exp.postgresql.export(schema, tableName, options);
}

// ========== 工具函数 ==========

/**
 * 创建验证器实例
 * @param {Object} [options] - 验证器选项
 * @returns {Validator} 验证器实例
 */
function createValidator(options) {
  const { Validator } = loadCore();
  return new Validator(options);
}

/**
 * 创建类型系统实例
 * @param {Object} [options] - 类型系统选项
 * @returns {TypeSystem} 类型系统实例
 */
function createTypeSystem(options) {
  const { TypeSystem } = loadCore();
  return new TypeSystem(options);
}

/**
 * 创建缓存管理器实例
 * @param {Object} [options] - 缓存选项
 * @returns {CacheManager} 缓存管理器实例
 */
function createCacheManager(options) {
  const { CacheManager } = loadCore();
  return new CacheManager(options);
}

/**
 * 快速验证（使用默认验证器）
 * @param {Object} schema - Schema定义
 * @param {*} data - 待验证数据
 * @param {Object} [options] - 验证选项
 * @returns {Promise<Object>} 验证结果
 */
async function validate(schema, data, options) {
  const validator = createValidator(options);
  return await validator.validate(schema, data);
}

// ========== 主导出 ==========

module.exports = {
  // ===== Joi风格API（默认）=====
  schema,

  // ===== DSL风格API =====
  _,
  $,
  s,

  // ===== JSON Schema API =====
  fromJSONSchema,
  toJSONSchema,

  // ===== 函数式API =====
  pipe,

  // ===== 导出器 =====
  exportToJSONSchema,
  exportToMongoDB,
  exportToMySQL,
  exportToPostgreSQL,

  // ===== 工具函数 =====
  validate,
  createValidator,
  createTypeSystem,
  createCacheManager,

  // ===== 核心类（高级用户）=====
  get SchemaBuilder() {
    return loadCore().SchemaBuilder;
  },
  get Validator() {
    return loadCore().Validator;
  },
  get TypeSystem() {
    return loadCore().TypeSystem;
  },
  get ErrorFormatter() {
    return loadCore().ErrorFormatter;
  },
  get CacheManager() {
    return loadCore().CacheManager;
  },

  // ===== 常量 =====
  CONSTANTS,

  // ===== 版本信息 =====
  VERSION: CONSTANTS.VERSION.FULL,
  version: CONSTANTS.VERSION.FULL
};

// ===== CommonJS默认导出（兼容require('schemaio').default）=====
module.exports.default = module.exports;

