/**
 * SchemaHelper - Schema辅助函数
 *
 * 提供Schema操作的常用辅助方法
 *
 * @module lib/utils/SchemaHelper
 * @version 1.0.0
 */

/**
 * Schema辅助工具类
 * @class SchemaHelper
 */
class SchemaHelper {
  /**
   * 检查是否为有效的JSON Schema
   * @static
   * @param {Object} schema - 待检查的Schema对象
   * @returns {boolean} 是否有效
   */
  static isValidSchema(schema) {
    if (!schema || typeof schema !== 'object') {
      return false;
    }

    // 至少要有type或properties或items之一
    return !!(schema.type || schema.properties || schema.items || schema.$ref);
  }

  /**
   * 生成Schema的唯一ID
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {string} 唯一ID
   */
  static generateSchemaId(schema) {
    // 使用简单hash生成ID
    const str = JSON.stringify(schema);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `schema_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 深度克隆Schema对象
   * @static
   * @param {Object} schema - 原Schema对象
   * @returns {Object} 克隆的Schema对象
   */
  static cloneSchema(schema) {
    return JSON.parse(JSON.stringify(schema));
  }

  /**
   * 扁平化嵌套Schema
   * @static
   * @param {Object} schema - 嵌套的Schema对象
   * @param {string} prefix - 属性前缀
   * @returns {Object} 扁平化的Schema对象
   */
  static flattenSchema(schema, prefix = '') {
    const result = {};

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value.type === 'object' && value.properties) {
          // 递归扁平化嵌套对象
          Object.assign(result, this.flattenSchema(value, fullKey));
        } else {
          result[fullKey] = value;
        }
      }
    }

    return result;
  }

  /**
   * 获取Schema中所有字段路径
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {Array} 字段路径数组
   */
  static getFieldPaths(schema) {
    const paths = [];

    function traverse(obj, currentPath = '') {
      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          const path = currentPath ? `${currentPath}.${key}` : key;
          paths.push(path);

          if (value.type === 'object') {
            traverse(value, path);
          } else if (value.type === 'array' && value.items) {
            traverse(value.items, `${path}[]`);
          }
        }
      }
    }

    traverse(schema);
    return paths;
  }

  /**
   * 提取Schema中的所有required字段
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {Array} required字段数组
   */
  static extractRequiredFields(schema) {
    const required = [];

    function traverse(obj, prefix = '') {
      if (obj.required && Array.isArray(obj.required)) {
        obj.required.forEach(field => {
          const fullPath = prefix ? `${prefix}.${field}` : field;
          required.push(fullPath);
        });
      }

      if (obj.properties) {
        for (const [key, value] of Object.entries(obj.properties)) {
          if (value.type === 'object') {
            const newPrefix = prefix ? `${prefix}.${key}` : key;
            traverse(value, newPrefix);
          }
        }
      }
    }

    traverse(schema);
    return required;
  }

  /**
   * 比较两个Schema是否相同
   * @static
   * @param {Object} schema1 - Schema对象1
   * @param {Object} schema2 - Schema对象2
   * @returns {boolean} 是否相同
   */
  static compareSchemas(schema1, schema2) {
    return JSON.stringify(schema1) === JSON.stringify(schema2);
  }

  /**
   * 简化Schema（移除不必要的字段）
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {Object} 简化后的Schema
   */
  static simplifySchema(schema) {
    const simplified = this.cloneSchema(schema);

    // 移除$schema
    delete simplified.$schema;

    // 移除空的properties
    if (simplified.properties && Object.keys(simplified.properties).length === 0) {
      delete simplified.properties;
    }

    // 移除空的required
    if (simplified.required && simplified.required.length === 0) {
      delete simplified.required;
    }

    return simplified;
  }

  /**
   * 验证属性名是否合法
   * @static
   * @param {string} name - 属性名
   * @returns {boolean} 是否合法
   */
  static isValidPropertyName(name) {
    // 属性名只能包含字母、数字、下划线、连字符
    return /^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(name);
  }

  /**
   * 获取Schema的复杂度（嵌套层级）
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {number} 复杂度（最大嵌套层级）
   */
  static getSchemaComplexity(schema) {
    let maxDepth = 0;

    function traverse(obj, depth = 0) {
      maxDepth = Math.max(maxDepth, depth);

      if (obj.properties) {
        for (const value of Object.values(obj.properties)) {
          if (value.type === 'object') {
            traverse(value, depth + 1);
          } else if (value.type === 'array' && value.items) {
            traverse(value.items, depth + 1);
          }
        }
      }
    }

    traverse(schema);
    return maxDepth;
  }

  /**
   * 生成Schema摘要信息
   * @static
   * @param {Object} schema - JSON Schema对象
   * @returns {Object} 摘要信息
   */
  static summarizeSchema(schema) {
    const paths = this.getFieldPaths(schema);
    const required = this.extractRequiredFields(schema);
    const complexity = this.getSchemaComplexity(schema);

    return {
      type: schema.type || 'unknown',
      fieldCount: paths.length,
      requiredCount: required.length,
      complexity,
      hasNested: complexity > 0,
      fields: paths
    };
  }
}

module.exports = SchemaHelper;

