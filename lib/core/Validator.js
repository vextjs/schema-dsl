// lib/core/Validator.js

const CONSTANTS = require('../config/constants');

/**
 * 验证引擎
 * 执行Schema验证逻辑
 *
 * @class Validator
 */
class Validator {
  constructor(options = {}) {
    this.options = {
      ...CONSTANTS.VALIDATION.DEFAULT_OPTIONS,
      ...options
    };
    this.ajv = null; // JSON Schema验证器（懒加载）
  }

  /**
   * 验证数据（含循环引用检测）
   * @param {Object} schema - Schema定义
   * @param {*} data - 待验证数据
   * @param {Object} [context={}] - 验证上下文
   * @returns {Promise<Object>} 验证结果
   */
  async validate(schema, data, context = {}) {
    const errors = [];
    const path = context.path || '';
    const seen = context.seen || new WeakSet();
    const depth = context.depth || 0;

    try {
      // 0. 深度检查（防止栈溢出）
      if (depth > CONSTANTS.VALIDATION.MAX_RECURSION_DEPTH) {
        errors.push({
          path,
          message: CONSTANTS.ERRORS.MAX_DEPTH_EXCEEDED
            .replace('{depth}', CONSTANTS.VALIDATION.MAX_RECURSION_DEPTH)
            .replace('{path}', path || 'root'),
          type: 'max-depth',
          depth
        });
        return {
          isValid: false,
          errors,
          value: data
        };
      }

      // 1. 循环引用检测（对象和数组）
      if (typeof data === 'object' && data !== null) {
        if (seen.has(data)) {
          errors.push({
            path,
            message: CONSTANTS.ERRORS.CIRCULAR_REFERENCE.replace('{path}', path || 'root'),
            type: 'circular',
            value: '[Circular]'
          });
          return {
            isValid: false,
            errors,
            value: data
          };
        }
        seen.add(data);
      }

      // 2. 类型验证
      await this._validateType(schema, data, path, errors);

      // 3. 约束验证
      if (errors.length === 0 || !this.options.abortEarly) {
        await this._validateConstraints(schema, data, path, errors);
      }

      // 4. 自定义验证
      if (errors.length === 0 || !this.options.abortEarly) {
        await this._validateCustom(schema, data, path, errors, context);
      }

      // 5. 嵌套验证（传递seen和depth）
      if (schema.type === 'object' && schema.properties) {
        await this._validateNested(schema, data, path, errors, {
          ...context,
          seen,
          depth: depth + 1
        });
      }

      // 6. 数组验证（传递seen和depth）
      if (schema.type === 'array' && schema.items && Array.isArray(data)) {
        await this._validateArray(schema, data, path, errors, {
          ...context,
          seen,
          depth: depth + 1
        });
      }

      return {
        isValid: errors.length === 0,
        errors,
        value: data,
        meta: {
          depth,
          validatedAt: new Date()
        }
      };
    } catch (error) {
      errors.push({
        path,
        message: error.message,
        type: 'exception',
        stack: this.options.debug ? error.stack : undefined
      });
      return {
        isValid: false,
        errors,
        value: data
      };
    }
  }

  /**
   * 类型验证
   * @private
   */
  async _validateType(schema, data, path, errors) {
    const { type } = schema;

    // 必填检查
    if (schema.required && (data === undefined || data === null)) {
      errors.push({
        path,
        message: CONSTANTS.ERRORS.REQUIRED_FIELD.replace('{path}', path || 'value'),
        type: 'required'
      });
      return;
    }

    // 可选字段，值为空时跳过
    if (!schema.required && (data === undefined || data === null)) {
      return;
    }

    // 类型检查
    const actualType = typeof data;
    const expectedTypes = {
      string: 'string',
      number: 'number',
      boolean: 'boolean',
      date: 'object',
      object: 'object',
      array: 'object'
    };

    if (actualType !== expectedTypes[type]) {
      if (!(type === 'date' && data instanceof Date) &&
          !(type === 'array' && Array.isArray(data))) {
        errors.push({
          path,
          message: CONSTANTS.ERRORS.TYPE_MISMATCH
            .replace('{expected}', type)
            .replace('{actual}', actualType)
            .replace('{path}', path || 'value'),
          type: 'type',
          expected: type,
          actual: actualType
        });
      }
    }
  }

  /**
   * 约束验证
   * @private
   */
  async _validateConstraints(schema, data, path, errors) {
    const { validators = [] } = schema;

    for (const validator of validators) {
      try {
        const result = await this._runValidator(validator, data, path);
        if (!result.isValid) {
          errors.push(result.error);
          if (this.options.abortEarly) break;
        }
      } catch (error) {
        errors.push({
          path,
          message: error.message,
          type: 'validator-error'
        });
        if (this.options.abortEarly) break;
      }
    }
  }

  /**
   * 运行单个验证器
   * @private
   */
  async _runValidator(validator, data, path) {
    const { type, value, fn, message } = validator;

    switch (type) {
      case 'min':
        if (typeof data === 'string' && data.length < value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Length must be at least ${value}, got ${data.length}`,
              type: 'min',
              min: value,
              actual: data.length
            }
          };
        }
        if (typeof data === 'number' && data < value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Value must be at least ${value}, got ${data}`,
              type: 'min',
              min: value,
              actual: data
            }
          };
        }
        if (Array.isArray(data) && data.length < value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Array length must be at least ${value}, got ${data.length}`,
              type: 'min',
              min: value,
              actual: data.length
            }
          };
        }
        break;

      case 'max':
        if (typeof data === 'string' && data.length > value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Length must be at most ${value}, got ${data.length}`,
              type: 'max',
              max: value,
              actual: data.length
            }
          };
        }
        if (typeof data === 'number' && data > value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Value must be at most ${value}, got ${data}`,
              type: 'max',
              max: value,
              actual: data
            }
          };
        }
        if (Array.isArray(data) && data.length > value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Array length must be at most ${value}, got ${data.length}`,
              type: 'max',
              max: value,
              actual: data.length
            }
          };
        }
        break;

      case 'length':
        const actualLength = typeof data === 'string' || Array.isArray(data) ? data.length : null;
        if (actualLength !== null && actualLength !== value) {
          return {
            isValid: false,
            error: {
              path,
              message: `Length must be exactly ${value}, got ${actualLength}`,
              type: 'length',
              expected: value,
              actual: actualLength
            }
          };
        }
        break;

      case 'pattern':
        if (typeof data === 'string' && !value.test(data)) {
          return {
            isValid: false,
            error: {
              path,
              message: message || `Value does not match pattern ${value}`,
              type: 'pattern',
              pattern: value.toString()
            }
          };
        }
        break;

      case 'enum':
        if (!value.includes(data)) {
          return {
            isValid: false,
            error: {
              path,
              message: `Value must be one of: ${value.join(', ')}`,
              type: 'enum',
              allowed: value,
              actual: data
            }
          };
        }
        break;

      case 'custom':
        const customResult = await Promise.resolve(fn(data, path));
        if (customResult !== true) {
          return {
            isValid: false,
            error: {
              path,
              message: typeof customResult === 'string' ? customResult : (message || 'Custom validation failed'),
              type: 'custom'
            }
          };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * 自定义验证
   * @private
   */
  async _validateCustom(schema, data, path, errors, context) {
    if (schema.validate && typeof schema.validate === 'function') {
      try {
        const result = await schema.validate(data, context);
        if (result !== true) {
          errors.push({
            path,
            message: typeof result === 'string' ? result : 'Validation failed',
            type: 'custom'
          });
        }
      } catch (error) {
        errors.push({
          path,
          message: error.message,
          type: 'custom-error'
        });
      }
    }
  }

  /**
   * 嵌套验证
   * @private
   */
  async _validateNested(schema, data, path, errors, context) {
    const { properties } = schema;

    if (typeof data !== 'object' || data === null) {
      return; // 类型错误已在类型验证中处理
    }

    for (const [key, propSchema] of Object.entries(properties)) {
      const propPath = path ? `${path}.${key}` : key;
      const propData = data[key];

      const result = await this.validate(propSchema, propData, {
        ...context,
        path: propPath
      });

      if (!result.isValid) {
        errors.push(...result.errors);
        if (this.options.abortEarly) break;
      }
    }
  }

  /**
   * 数组验证
   * @private
   */
  async _validateArray(schema, data, path, errors, context) {
    const { items } = schema;

    for (let i = 0; i < data.length; i++) {
      const itemPath = `${path}[${i}]`;
      const result = await this.validate(items, data[i], {
        ...context,
        path: itemPath
      });

      if (!result.isValid) {
        errors.push(...result.errors);
        if (this.options.abortEarly) break;
      }
    }
  }

  /**
   * 使用JSON Schema验证（懒加载）
   * @param {Object} jsonSchema - JSON Schema
   * @param {*} data - 待验证数据
   * @returns {Object} 验证结果
   */
  validateWithJSONSchema(jsonSchema, data) {
    if (!this.ajv) {
      const Ajv = require('ajv');
      const addFormats = require('ajv-formats');
      this.ajv = new Ajv({ allErrors: true });
      addFormats(this.ajv);
    }

    const validate = this.ajv.compile(jsonSchema);
    const isValid = validate(data);

    return {
      isValid,
      errors: isValid ? [] : validate.errors.map(err => ({
        path: err.instancePath,
        message: err.message,
        type: err.keyword,
        params: err.params
      })),
      value: data
    };
  }
}

module.exports = Validator;

