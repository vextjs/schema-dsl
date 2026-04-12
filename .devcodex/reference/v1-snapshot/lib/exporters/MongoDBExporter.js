/**
 * MongoDB Schema导出器
 *
 * 将JSON Schema转换为MongoDB验证Schema
 *
 * @module lib/exporters/MongoDBExporter
 * @version 1.0.0
 */

const TypeConverter = require('../utils/TypeConverter');

/**
 * MongoDB导出器类
 * @class MongoDBExporter
 */
class MongoDBExporter {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {boolean} options.strict - 是否严格模式（默认false）
   */
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      ...options
    };
  }

  /**
   * 导出为MongoDB验证Schema
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {Object} MongoDB验证Schema
   */
  export(jsonSchema) {
    if (!jsonSchema || typeof jsonSchema !== 'object') {
      throw new Error('Invalid JSON Schema');
    }

    const mongoSchema = this._convertSchema(jsonSchema);

    return {
      $jsonSchema: mongoSchema
    };
  }

  /**
   * 转换Schema
   * @private
   * @param {Object} schema - JSON Schema
   * @returns {Object} MongoDB Schema
   */
  _convertSchema(schema) {
    const result = {};

    // 转换type
    if (schema.type) {
      result.bsonType = TypeConverter.toMongoDBType(schema.type);
    }

    // 转换properties
    if (schema.properties) {
      result.properties = {};
      for (const [key, value] of Object.entries(schema.properties)) {
        result.properties[key] = this._convertSchema(value);
      }
    }

    // 转换required
    if (schema.required && Array.isArray(schema.required)) {
      result.required = schema.required;
    }

    // 转换items（数组）
    if (schema.items) {
      result.items = this._convertSchema(schema.items);
    }

    // 字符串约束
    if (schema.minLength !== undefined) {
      result.minLength = schema.minLength;
    }
    if (schema.maxLength !== undefined) {
      result.maxLength = schema.maxLength;
    }
    if (schema.pattern) {
      result.pattern = schema.pattern;
    }

    // 数值约束
    if (schema.minimum !== undefined) {
      result.minimum = schema.minimum;
    }
    if (schema.maximum !== undefined) {
      result.maximum = schema.maximum;
    }

    // 数组约束
    if (schema.minItems !== undefined) {
      result.minItems = schema.minItems;
    }
    if (schema.maxItems !== undefined) {
      result.maxItems = schema.maxItems;
    }

    // 枚举
    if (schema.enum) {
      result.enum = schema.enum;
    }

    // 描述
    if (schema.description) {
      result.description = schema.description;
    }

    return result;
  }

  /**
   * 生成createCollection命令
   * @param {string} collectionName - 集合名称
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {Object} createCollection命令对象
   */
  generateCreateCommand(collectionName, jsonSchema) {
    const validationSchema = this.export(jsonSchema);

    return {
      collectionName,
      options: {
        validator: validationSchema,
        validationLevel: this.options.strict ? 'strict' : 'moderate',
        validationAction: 'error'
      }
    };
  }

  /**
   * 生成可执行的MongoDB命令字符串
   * @param {string} collectionName - 集合名称
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {string} MongoDB命令字符串
   */
  generateCommand(collectionName, jsonSchema) {
    const command = this.generateCreateCommand(collectionName, jsonSchema);

    return `db.createCollection("${command.collectionName}", ${JSON.stringify(command.options, null, 2)})`;
  }

  /**
   * 静态方法：快速导出
   * @static
   * @param {Object} jsonSchema - JSON Schema对象
   * @returns {Object} MongoDB验证Schema
   */
  static export(jsonSchema) {
    const exporter = new MongoDBExporter();
    return exporter.export(jsonSchema);
  }
}

module.exports = MongoDBExporter;

