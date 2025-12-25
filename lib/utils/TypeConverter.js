/**
 * TypeConverter - 类型转换工具
 *
 * 提供各种类型转换功能，用于适配器和导出器
 *
 * @module lib/utils/TypeConverter
 * @version 1.0.0
 */

/**
 * 类型转换工具类
 * @class TypeConverter
 */
class TypeConverter {
  /**
   * 将简单类型字符串转换为JSON Schema类型
   * @static
   * @param {string} simpleType - 简单类型（string/number/boolean等）
   * @returns {Object} JSON Schema类型对象
   */
  static toJSONSchemaType(simpleType) {
    const typeMap = {
      'string': { type: 'string' },
      'str': { type: 'string' },
      's': { type: 'string' },

      'number': { type: 'number' },
      'num': { type: 'number' },
      'n': { type: 'number' },

      'integer': { type: 'integer' },
      'int': { type: 'integer' },
      'i': { type: 'integer' },

      'boolean': { type: 'boolean' },
      'bool': { type: 'boolean' },
      'b': { type: 'boolean' },

      'object': { type: 'object' },
      'obj': { type: 'object' },
      'o': { type: 'object' },

      'array': { type: 'array' },
      'arr': { type: 'array' },
      'a': { type: 'array' },

      'null': { type: 'null' },
      'any': {} // any类型不限制
    };

    return typeMap[simpleType] || { type: 'string' };
  }

  /**
   * JSON Schema类型转MongoDB类型
   * @static
   * @param {string} jsonSchemaType - JSON Schema类型
   * @returns {string} MongoDB BSON类型
   */
  static toMongoDBType(jsonSchemaType) {
    const typeMap = {
      'string': 'string',
      'number': 'double',
      'integer': 'int',
      'boolean': 'bool',
      'object': 'object',
      'array': 'array',
      'null': 'null'
    };

    return typeMap[jsonSchemaType] || 'string';
  }

  /**
   * JSON Schema类型转MySQL类型
   * @static
   * @param {string} jsonSchemaType - JSON Schema类型
   * @param {Object} constraints - 约束条件（长度、范围等）
   * @returns {string} MySQL数据类型
   */
  static toMySQLType(jsonSchemaType, constraints = {}) {
    const { maxLength, maximum, format } = constraints;

    switch (jsonSchemaType) {
      case 'string':
        if (format === 'date-time' || format === 'date') {
          return 'DATETIME';
        }
        if (format === 'email') {
          return 'VARCHAR(255)';
        }
        if (maxLength) {
          return maxLength > 255 ? `TEXT` : `VARCHAR(${maxLength})`;
        }
        return 'VARCHAR(255)';

      case 'integer':
        if (maximum && maximum <= 127) return 'TINYINT';
        if (maximum && maximum <= 32767) return 'SMALLINT';
        if (maximum && maximum <= 2147483647) return 'INT';
        return 'BIGINT';

      case 'number':
        return 'DOUBLE';

      case 'boolean':
        return 'BOOLEAN';

      case 'object':
        return 'JSON';

      case 'array':
        return 'JSON';

      default:
        return 'VARCHAR(255)';
    }
  }

  /**
   * JSON Schema类型转PostgreSQL类型
   * @static
   * @param {string} jsonSchemaType - JSON Schema类型
   * @param {Object} constraints - 约束条件
   * @returns {string} PostgreSQL数据类型
   */
  static toPostgreSQLType(jsonSchemaType, constraints = {}) {
    const { maxLength, maximum, format } = constraints;

    switch (jsonSchemaType) {
      case 'string':
        if (format === 'date-time') return 'TIMESTAMP';
        if (format === 'date') return 'DATE';
        if (format === 'email') return 'VARCHAR(255)';
        if (format === 'uuid') return 'UUID';
        if (maxLength) {
          return maxLength > 255 ? `TEXT` : `VARCHAR(${maxLength})`;
        }
        return 'VARCHAR(255)';

      case 'integer':
        if (maximum && maximum <= 32767) return 'SMALLINT';
        if (maximum && maximum <= 2147483647) return 'INTEGER';
        return 'BIGINT';

      case 'number':
        return 'DOUBLE PRECISION';

      case 'boolean':
        return 'BOOLEAN';

      case 'object':
        return 'JSONB';

      case 'array':
        return 'JSONB';

      default:
        return 'VARCHAR(255)';
    }
  }

  /**
   * 规范化属性名（转换为数据库友好的命名）
   * @static
   * @param {string} name - 属性名
   * @param {string} style - 命名风格（snake_case/camelCase）
   * @returns {string} 规范化后的属性名
   */
  static normalizePropertyName(name, style = 'snake_case') {
    if (style === 'snake_case') {
      // camelCase转snake_case
      return name.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    return name;
  }

  /**
   * 格式验证函数转正则表达式
   * @static
   * @param {string} format - 格式名称
   * @returns {string|null} 正则表达式字符串
   */
  static formatToRegex(format) {
    const formatRegex = {
      'email': '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      'uri': '^https?://[^\\s/$.?#].[^\\s]*$',
      'uuid': '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
      'ipv4': '^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
      'ipv6': '^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4})$'
    };

    return formatRegex[format] || null;
  }

  /**
   * 合并JSON Schema对象
   * @static
   * @param {Object} base - 基础Schema
   * @param {Object} override - 覆盖Schema
   * @returns {Object} 合并后的Schema
   */
  static mergeSchemas(base, override) {
    return {
      ...base,
      ...override,
      // 特殊处理required和properties
      required: [
        ...(base.required || []),
        ...(override.required || [])
      ],
      properties: {
        ...(base.properties || {}),
        ...(override.properties || {})
      }
    };
  }

  /**
   * 提取Schema约束条件
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {Object} 约束条件对象
   */
  static extractConstraints(schema) {
    return {
      minLength: schema.minLength,
      maxLength: schema.maxLength,
      minimum: schema.minimum,
      maximum: schema.maximum,
      pattern: schema.pattern,
      format: schema.format,
      enum: schema.enum,
      default: schema.default
    };
  }
}

module.exports = TypeConverter;

