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
    // 新增验证器（v1.0.2）
    this.registerStringValidators(ajv);
    this.registerNumberValidators(ajv);
    this.registerObjectValidators(ajv);
    this.registerArrayValidators(ajv);
    this.registerDateValidators(ajv);
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
              const messageConfig = Locale.getMessage('ASYNC_VALIDATION_NOT_SUPPORTED');
              const errorMessage = typeof messageConfig === 'object' && messageConfig.message
                ? messageConfig.message
                : messageConfig;
              throw new Error(errorMessage);
            }

            // 处理返回值
            if (result === false) {
              const messageConfig = Locale.getMessage('CUSTOM_VALIDATION_FAILED');
              const errorMessage = typeof messageConfig === 'object' && messageConfig.message
                ? messageConfig.message
                : messageConfig;
              validate.errors = [{ message: errorMessage }];
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

  /**
   * 注册 String 类型验证器（v1.0.2新增）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerStringValidators(ajv) {
    // exactLength: 精确长度验证
    ajv.addKeyword({
      keyword: 'exactLength',
      type: 'string',
      schemaType: 'number',
      validate: function validate(schema, data) {
        if (data.length !== schema) {
          validate.errors = [{
            keyword: 'exactLength',
            message: `string.length`,
            params: { limit: schema }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // alphanum: 只能包含字母和数字
    ajv.addKeyword({
      keyword: 'alphanum',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema && !/^[a-zA-Z0-9]*$/.test(data)) {
          validate.errors = [{
            keyword: 'alphanum',
            message: 'string.alphanum',
            params: {}
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // trim: 不能包含前后空格
    ajv.addKeyword({
      keyword: 'trim',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema && data !== data.trim()) {
          validate.errors = [{
            keyword: 'trim',
            message: 'string.trim',
            params: {}
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // lowercase: 必须是小写
    ajv.addKeyword({
      keyword: 'lowercase',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema && data !== data.toLowerCase()) {
          validate.errors = [{
            keyword: 'lowercase',
            message: 'string.lowercase',
            params: {}
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // uppercase: 必须是大写
    ajv.addKeyword({
      keyword: 'uppercase',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema && data !== data.toUpperCase()) {
          validate.errors = [{
            keyword: 'uppercase',
            message: 'string.uppercase',
            params: {}
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // jsonString: JSON字符串验证
    ajv.addKeyword({
      keyword: 'jsonString',
      type: 'string',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema) {
          try {
            JSON.parse(data);
            return true;
          } catch (error) {
            validate.errors = [{
              keyword: 'jsonString',
              message: 'pattern.json',
              params: {}
            }];
            return false;
          }
        }
        return true;
      },
      errors: true
    });
  }

  /**
   * 注册 Number 类型验证器（v1.0.2新增）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerNumberValidators(ajv) {
    // precision: 小数位数限制
    ajv.addKeyword({
      keyword: 'precision',
      type: 'number',
      schemaType: 'number',
      validate: function validate(schema, data) {
        const decimalPart = String(data).split('.')[1];
        const actualPrecision = decimalPart ? decimalPart.length : 0;

        if (actualPrecision > schema) {
          validate.errors = [{
            keyword: 'precision',
            message: 'number.precision',
            params: { limit: schema }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // port: 端口号验证 (1-65535)
    ajv.addKeyword({
      keyword: 'port',
      type: ['integer', 'number'],
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema && (data < 1 || data > 65535 || !Number.isInteger(data))) {
          validate.errors = [{
            keyword: 'port',
            message: 'number.port',
            params: {}
          }];
          return false;
        }
        return true;
      },
      errors: true
    });
  }

  /**
   * 注册 Object 类型验证器（v1.0.2新增）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerObjectValidators(ajv) {
    // requiredAll: 要求所有定义的属性都必须存在
    ajv.addKeyword({
      keyword: 'requiredAll',
      type: 'object',
      schemaType: 'boolean',
      validate: function validate(schema, data, parentSchema) {
        if (!schema) return true;

        const properties = parentSchema.properties;
        if (!properties) return true;

        const missingKeys = Object.keys(properties).filter(key => !(key in data));

        if (missingKeys.length > 0) {
          validate.errors = [{
            keyword: 'requiredAll',
            message: 'object.missing',
            params: { missing: missingKeys }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // strictSchema: 严格模式，不允许额外属性
    ajv.addKeyword({
      keyword: 'strictSchema',
      type: 'object',
      schemaType: 'boolean',
      validate: function validate(schema, data, parentSchema) {
        if (!schema) return true;

        const properties = parentSchema.properties || {};
        const allowedKeys = Object.keys(properties);
        const extraKeys = Object.keys(data).filter(key => !allowedKeys.includes(key));

        if (extraKeys.length > 0) {
          validate.errors = [{
            keyword: 'strictSchema',
            message: 'object.schema',
            params: { extra: extraKeys }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });
  }

  /**
   * 注册 Array 类型验证器（v1.0.2新增）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerArrayValidators(ajv) {
    // noSparse: 不允许稀疏数组（undefined元素）
    ajv.addKeyword({
      keyword: 'noSparse',
      type: 'array',
      schemaType: 'boolean',
      validate: function validate(schema, data) {
        if (schema) {
          for (let i = 0; i < data.length; i++) {
            if (!(i in data)) {
              validate.errors = [{
                keyword: 'noSparse',
                message: 'array.sparse',
                params: { index: i }
              }];
              return false;
            }
          }
        }
        return true;
      },
      errors: true
    });

    // includesRequired: 必须包含指定的元素
    ajv.addKeyword({
      keyword: 'includesRequired',
      type: 'array',
      schemaType: 'array',
      validate: function validate(schema, data) {
        if (!Array.isArray(schema) || schema.length === 0) return true;

        const missing = schema.filter(required => {
          return !data.some(item => {
            if (typeof required === 'object' && required !== null) {
              return JSON.stringify(item) === JSON.stringify(required);
            }
            return item === required;
          });
        });

        if (missing.length > 0) {
          validate.errors = [{
            keyword: 'includesRequired',
            message: 'array.includesRequired',
            params: { missing }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });
  }

  /**
   * 注册 Date 类型验证器（v1.0.2新增）
   * @static
   * @param {Ajv} ajv - ajv实例
   */
  static registerDateValidators(ajv) {
    // dateFormat: 自定义日期格式验证
    ajv.addKeyword({
      keyword: 'dateFormat',
      type: 'string',
      schemaType: 'string',
      validate: function validate(schema, data) {
        // 支持常见格式: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY
        const formats = {
          'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/,
          'YYYY/MM/DD': /^\d{4}\/\d{2}\/\d{2}$/,
          'DD-MM-YYYY': /^\d{2}-\d{2}-\d{4}$/,
          'DD/MM/YYYY': /^\d{2}\/\d{2}\/\d{4}$/,
          'ISO8601': /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
        };

        const pattern = formats[schema];
        if (!pattern) {
          validate.errors = [{
            keyword: 'dateFormat',
            message: 'date.format',
            params: { format: schema }
          }];
          return false;
        }

        if (!pattern.test(data)) {
          validate.errors = [{
            keyword: 'dateFormat',
            message: 'date.format',
            params: { format: schema }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // dateGreater: 日期必须大于指定日期
    ajv.addKeyword({
      keyword: 'dateGreater',
      type: 'string',
      schemaType: 'string',
      validate: function validate(schema, data) {
        const dataDate = new Date(data);
        const compareDate = new Date(schema);

        if (isNaN(dataDate.getTime()) || isNaN(compareDate.getTime())) {
          validate.errors = [{
            keyword: 'dateGreater',
            message: 'date.greater',
            params: { limit: schema }
          }];
          return false;
        }

        if (dataDate <= compareDate) {
          validate.errors = [{
            keyword: 'dateGreater',
            message: 'date.greater',
            params: { limit: schema }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });

    // dateLess: 日期必须小于指定日期
    ajv.addKeyword({
      keyword: 'dateLess',
      type: 'string',
      schemaType: 'string',
      validate: function validate(schema, data) {
        const dataDate = new Date(data);
        const compareDate = new Date(schema);

        if (isNaN(dataDate.getTime()) || isNaN(compareDate.getTime())) {
          validate.errors = [{
            keyword: 'dateLess',
            message: 'date.less',
            params: { limit: schema }
          }];
          return false;
        }

        if (dataDate >= compareDate) {
          validate.errors = [{
            keyword: 'dateLess',
            message: 'date.less',
            params: { limit: schema }
          }];
          return false;
        }
        return true;
      },
      errors: true
    });
  }
}

module.exports = CustomKeywords;

