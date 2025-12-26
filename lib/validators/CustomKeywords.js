/**
 * 自定义JSON Schema关键字
 *
 * 扩展ajv支持自定义验证关键字
 *
 * @module lib/validators/CustomKeywords
 * @version 1.0.0
 */

const Locale = require('../core/Locale');

/**
 * 自定义关键字集合
 * @class CustomKeywords
 */
class CustomKeywords {
  /**
   * 注册所有自定义关键字到ajv实例
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerAll(ajv) {
    this.registerRegexKeyword(ajv);
    this.registerFunctionKeyword(ajv);
    this.registerRangeKeyword(ajv);
    this.registerCustomValidatorsKeyword(ajv);
    this.registerMetadataKeywords(ajv);
  }

  /**
   * 注册元数据关键字（_label, _customMessages等）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerMetadataKeywords(ajv) {
    // _label: 字段标签
    ajv.addKeyword({
      keyword: '_label',
      metaSchema: { type: 'string' }
    });

    // _customMessages: 自定义错误消息
    ajv.addKeyword({
      keyword: '_customMessages',
      metaSchema: { type: 'object' }
    });

    // _description: 描述
    ajv.addKeyword({
      keyword: '_description',
      metaSchema: { type: 'string' }
    });

    // _whenConditions: 条件验证
    ajv.addKeyword({
      keyword: '_whenConditions',
      metaSchema: { type: 'array' }
    });

    // _required: 内部使用的必填标记
    ajv.addKeyword({
      keyword: '_required',
      metaSchema: { type: 'boolean' }
    });
  }

  /**
   * 注册 _customValidators 关键字（SchemaIO 内部使用）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerCustomValidatorsKeyword(ajv) {
    ajv.addKeyword({
      keyword: '_customValidators',
      validate: function validate(validators, data) {
        if (!Array.isArray(validators)) return true;

        for (const validator of validators) {
          try {
            const result = validator(data);

            // 处理 Promise (异步验证)
            if (result instanceof Promise) {
              // ajv 默认不支持同步验证中的异步操作
              // 这里我们只能抛出错误提示
              // 真正的异步支持需要 Validator.validateAsync
              throw new Error(Locale.getMessage('ASYNC_VALIDATION_NOT_SUPPORTED'));
            }

            // 处理返回值
            if (result === false) {
              validate.errors = [{ message: Locale.getMessage('CUSTOM_VALIDATION_FAILED') }];
              return false;
            }
            if (typeof result === 'string') {
              validate.errors = [{ message: result }];
              return false;
            }
            if (result && typeof result === 'object' && result.error) {
              validate.errors = [{ message: result.message || Locale.getMessage('CUSTOM_VALIDATION_FAILED') }];
              return false;
            }
          } catch (error) {
            validate.errors = [{ message: error.message }];
            return false;
          }
        }
        return true;
      },
      errors: true
    });
  }

  /**
   * 注册regex关键字（正则验证）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerRegexKeyword(ajv) {
    ajv.addKeyword({
      keyword: 'regex',
      type: 'string',
      schemaType: 'string',
      validate: function validate(schema, data) {
        try {
          const regex = new RegExp(schema);
          return regex.test(data);
        } catch (error) {
          validate.errors = [{ message: `Invalid regex: ${error.message}` }];
          return false;
        }
      },
      errors: true
    });
  }

  /**
   * 注册function关键字（自定义函数验证）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerFunctionKeyword(ajv) {
    ajv.addKeyword({
      keyword: 'validate',
      validate: function validate(schema, data) {
        if (typeof schema !== 'function') {
          validate.errors = [{ message: Locale.getMessage('VALIDATE_MUST_BE_FUNCTION') }];
          return false;
        }

        try {
          const result = schema(data);
          if (typeof result === 'boolean') {
            return result;
          }
          if (result && typeof result.valid === 'boolean') {
            if (!result.valid && result.message) {
              validate.errors = [{ message: result.message }];
            }
            return result.valid;
          }
          return true;
        } catch (error) {
          validate.errors = [{ message: error.message }];
          return false;
        }
      },
      errors: true
    });
  }

  /**
   * 注册range关键字（数值范围验证）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerRangeKeyword(ajv) {
    ajv.addKeyword({
      keyword: 'range',
      type: 'number',
      schemaType: 'object',
      validate: function validate(schema, data) {
        const { min, max } = schema;

        if (min !== undefined && data < min) {
          validate.errors = [{ message: `must be >= ${min}` }];
          return false;
        }

        if (max !== undefined && data > max) {
          validate.errors = [{ message: `must be <= ${max}` }];
          return false;
        }

        return true;
      },
      errors: true
    });
  }
}

module.exports = CustomKeywords;

