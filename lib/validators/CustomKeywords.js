/**
 * 自定义JSON Schema关键字
 *
 * 扩展ajv支持自定义验证关键字
 *
 * @module lib/validators/CustomKeywords
 * @version 1.0.0
 */

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
          validate.errors = [{ message: 'validate must be a function' }];
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

