/**
 * DSL风格适配器 v2.0
 *
 * 统一的DSL Builder Pattern
 * 支持：纯字符串DSL + 链式调用扩展
 *
 * @module lib/adapters/DslAdapter
 * @version 2.0.0
 */

const JSONSchemaCore = require('../core/JSONSchemaCore');
const DslBuilder = require('../core/DslBuilder');

/**
 * DSL适配器类
 * @class DslAdapter
 */
class DslAdapter {
  /**
   * 解析DSL字符串为JSON Schema（内部使用）
   * @static
   * @param {string} dslString - DSL字符串
   * @returns {Object} JSON Schema对象
   */
  static parseString(dslString) {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('DSL must be a string');
    }

    const trimmed = dslString.trim();
    let required = trimmed.endsWith('!');
    let dslWithoutRequired = required ? trimmed.slice(0, -1) : trimmed;

    // 特殊处理：array!数字范围 → array:数字范围 + 必填
    // 支持: array!1-10, array!1-, array!-10
    if (/^array![\d-]/.test(trimmed)) {
      dslWithoutRequired = trimmed.replace(/^array!/, 'array:');
      required = true;
    }

    // 解析基本类型和约束
    const schema = this._parseType(dslWithoutRequired);

    return schema;
  }

  /**
   * parse方法别名（向后兼容）
   * @static
   * @param {string} dslString - DSL字符串
   * @returns {Object} JSON Schema对象
   */
  static parse(dslString) {
    const schema = this.parseString(dslString);
    schema._required = dslString.trim().endsWith('!');
    return schema;
  }

  /**
   * 解析类型和约束
   * @private
   * @static
   * @param {string} dsl - DSL字符串（不含!）
   * @returns {Object} JSON Schema对象
   */
  static _parseType(dsl) {
    // 处理数组DSL语法
    if (dsl.startsWith('array')) {
      const schema = { type: 'array' };

      // 匹配模式: array:min-max<itemType> 或 array:constraint<itemType> 或 array<itemType>
      // 支持: array:1-10, array:1-, array:-10, array:10, array<string>, array:1-10<string>
      const arrayMatch = dsl.match(/^array(?::([^<]+?))?(?:<(.+)>)?$/);

      if (arrayMatch) {
        const [, constraint, itemType] = arrayMatch;

        // 解析约束
        if (constraint) {
          const trimmedConstraint = constraint.trim();

          if (trimmedConstraint.includes('-')) {
            // 范围约束: min-max, min-, -max
            const [min, max] = trimmedConstraint.split('-').map(v => v.trim());
            if (min) schema.minItems = parseInt(min, 10);
            if (max) schema.maxItems = parseInt(max, 10);
          } else {
            // 单个值 = 最大值
            schema.maxItems = parseInt(trimmedConstraint, 10);
          }
        }

        // 解析元素类型
        if (itemType) {
          schema.items = this._parseType(itemType.trim());
        }

        return schema;
      }
    }


    // 检查是否为纯枚举（包含|但没有:且没有数字范围）
    if (dsl.includes('|') && !dsl.includes(':') && !/^\w+\d+-\d+$/.test(dsl)) {
      return {
        type: 'string',
        enum: dsl.split('|').map(v => v.trim())
      };
    }

    // 格式: type:constraint 或 type数字范围
    // 例如: string:3-32, number:0-100
    let type, constraint;

    // 检查是否有冒号
    const colonIndex = dsl.indexOf(':');

    if (colonIndex !== -1) {
      // 有冒号：string:3-32
      type = dsl.substring(0, colonIndex);
      constraint = dsl.substring(colonIndex + 1);
    } else {
      // 无冒号：检查是否有数字约束（string3-32）
      const match = dsl.match(/^([a-z]+)(\d.*)$/i);
      if (match) {
        type = match[1];
        constraint = match[2];
      } else {
        type = dsl;
        constraint = '';
      }
    }

    // 获取基础类型Schema
    const baseSchema = this._getBaseType(type);

    // 应用约束
    if (constraint) {
      const constraintSchema = this._parseConstraint(baseSchema.type, constraint);
      Object.assign(baseSchema, constraintSchema);
    }

    return baseSchema;
  }

  /**
   * 获取基本类型Schema
   * @private
   * @static
   * @param {string} type - 类型名称
   * @returns {Object} 基本类型Schema
   */
  static _getBaseType(type) {
    const typeMap = {
      // 基本类型
      'string': { type: 'string' },
      'number': { type: 'number' },
      'integer': { type: 'integer' },
      'boolean': { type: 'boolean' },
      'object': { type: 'object' },
      'array': { type: 'array' },
      'null': { type: 'null' },

      // 格式类型
      'date': { type: 'string', format: 'date' },
      'datetime': { type: 'string', format: 'date-time' },
      'time': { type: 'string', format: 'time' },
      'email': { type: 'string', format: 'email' },
      'url': { type: 'string', format: 'uri' },
      'uuid': { type: 'string', format: 'uuid' },
      'ipv4': { type: 'string', format: 'ipv4' },
      'ipv6': { type: 'string', format: 'ipv6' },

      // 特殊类型（对比 joi 补充）
      'binary': { type: 'string', contentEncoding: 'base64' },
      'any': {}  // 任意类型
    };

    return typeMap[type] || { type: 'string' };
  }

  /**
   * 解析约束
   * @private
   * @static
   * @param {string} baseType - 基础类型
   * @param {string} constraint - 约束字符串
   * @returns {Object} 约束对象
   */
  static _parseConstraint(baseType, constraint) {
    if (!constraint) return {};

    const result = {};

    // 枚举: value1|value2|value3 （优先检查，避免被数字范围误判）
    if (constraint.includes('|') && !/^\d+-\d+$/.test(constraint)) {
      result.enum = constraint.split('|').map(v => v.trim());
      return result;
    }

    // 范围约束: min-max 或 min- 或 -max
    const rangeMatch = constraint.match(/^(\d*)-(\d*)$/);
    if (rangeMatch) {
      const [, min, max] = rangeMatch;
      if (baseType === 'string') {
        if (min) result.minLength = parseInt(min, 10);
        if (max) result.maxLength = parseInt(max, 10);
      } else if (baseType === 'array') {
        if (min) result.minItems = parseInt(min, 10);
        if (max) result.maxItems = parseInt(max, 10);
      } else {
        if (min) result.minimum = parseInt(min, 10);
        if (max) result.maximum = parseInt(max, 10);
      }
      return result;
    }

    // 单个约束: min, max
    const singleMatch = constraint.match(/^(\d+)$/);
    if (singleMatch) {
      const value = parseInt(singleMatch[1], 10);
      if (baseType === 'string') {
        result.maxLength = value;
      } else if (baseType === 'array') {
        result.maxItems = value;
      } else {
        result.maximum = value;
      }
      return result;
    }

    return constraint;
  }

  /**
   * 解析对象为Schema（支持DslBuilder）
   * @static
   * @param {Object} dslObject - DSL对象定义
   * @returns {Object} JSON Schema对象
   */
  static parseObject(dslObject) {
    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    for (const [key, value] of Object.entries(dslObject)) {
      let fieldKey = key;
      let isFieldRequired = false;

      // 检查 key 是否带 ! 后缀（表示该字段本身必填）
      if (key.endsWith('!')) {
        fieldKey = key.slice(0, -1);
        isFieldRequired = true;
      }

      let fieldSchema;

      // 1. DslBuilder 实例（链式调用结果）
      if (value instanceof DslBuilder) {
        fieldSchema = value.toSchema();
      }
      // 2. 纯字符串 DSL
      else if (typeof value === 'string') {
        const builder = new DslBuilder(value);
        fieldSchema = builder.toSchema();
      }
      // 3. 嵌套对象
      else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
        fieldSchema = this.parseObject(value);
      }
      // 4. 其他类型（保留原样）
      else {
        fieldSchema = value;
      }

      // 处理必填标记（优先级：key! > 字段内部的!）
      if (isFieldRequired) {
        schema.required.push(fieldKey);
      } else if (fieldSchema && fieldSchema._required) {
        schema.required.push(fieldKey);
        delete fieldSchema._required;
      }

      // 清理所有_required标记（包括嵌套的）
      this._cleanRequiredMarks(fieldSchema);

      schema.properties[fieldKey] = fieldSchema;
    }

    if (schema.required.length === 0) {
      delete schema.required;
    }

    return schema;
  }

  /**
   * 解析对象为Schema（旧版本，兼容）
   * @static
   * @param {Object} dslObject - DSL对象定义
   * @returns {Object} JSON Schema对象
   */
  static parseObjectOld(dslObject) {
    if (!dslObject || typeof dslObject !== 'object') {
      throw new Error('DSL object must be an object');
    }

    const schema = {
      type: 'object',
      properties: {},
      required: []
    };

    for (const [key, value] of Object.entries(dslObject)) {
      if (typeof value === 'string') {
        const parsed = this.parse(value);

        // 处理必填标记
        if (parsed._required) {
          schema.required.push(key);
          delete parsed._required; // 清理临时标记
        }

        // 清理所有_required标记（包括嵌套的）
        this._cleanRequiredMarks(parsed);

        schema.properties[key] = parsed;
      } else if (typeof value === 'object') {
        // 嵌套对象
        schema.properties[key] = this.parseObject(value);
      }
    }

    if (schema.required.length === 0) {
      delete schema.required;
    }

    return schema;
  }

  /**
   * 清理Schema中的临时标记
   * @private
   * @static
   * @param {Object} schema - Schema对象
   */
  static _cleanRequiredMarks(schema) {
    if (!schema || typeof schema !== 'object') {
      return;
    }

    // 删除所有临时属性
    delete schema._required;
    delete schema._customMessages;
    delete schema._label;
    delete schema._customValidators;
    delete schema._whenConditions;

    // 递归处理properties
    if (schema.properties) {
      for (const prop of Object.values(schema.properties)) {
        this._cleanRequiredMarks(prop);
      }
    }

    // 递归处理items
    if (schema.items) {
      this._cleanRequiredMarks(schema.items);
    }
  }

  /**
   * 转换为JSONSchemaCore实例
   * @static
   * @param {string|Object} dsl - DSL字符串或对象
   * @returns {JSONSchemaCore} JSONSchemaCore实例
   */
  static toCore(dsl) {
    let schema;
    if (typeof dsl === 'string') {
      // 创建DslBuilder并转为Schema
      const builder = new DslBuilder(dsl);
      schema = builder.toSchema();
    } else {
      schema = this.parseObject(dsl);
    }
    return new JSONSchemaCore(schema);
  }
}

// ========== 导出统一API ==========

/**
 * DSL函数 - 统一入口
 * @param {string|Object} definition - DSL字符串或对象定义
 * @returns {DslBuilder|Object} DslBuilder实例或JSON Schema对象
 *
 * @example
 * // 字符串：返回 DslBuilder（可链式调用）
 * const schema = dsl('email!')
 *   .pattern(/custom/)
 *   .messages({ 'string.pattern': '格式不正确' });
 *
 * // 对象：返回 JSON Schema
 * const schema = dsl({
 *   username: 'string:3-32!',
 *   email: dsl('email!').label('邮箱')
 * });
 */
function dsl(definition) {
  // 字符串：返回 DslBuilder
  if (typeof definition === 'string') {
    return new DslBuilder(definition);
  }

  // 对象：解析对象Schema
  if (typeof definition === 'object' && !Array.isArray(definition)) {
    return DslAdapter.parseObject(definition);
  }

  throw new Error('Invalid DSL definition: must be string or object');
}

// 导出
module.exports = dsl;
module.exports.DslAdapter = DslAdapter;
module.exports.DslBuilder = DslBuilder;

