/**
 * 错误码定义
 *
 * 定义所有内置的错误码和默认错误消息
 * v2.0.1: 支持简化格式（无类型前缀）
 *
 * @module lib/core/ErrorCodes
 */

const ERROR_CODES = {
  // ========== 字符串类型错误 ==========
  // v2.0.1: 简化格式（推荐，用户友好）
  'min': {
    code: 'TOO_SHORT',
    message: '{{#label}} length must be at least {{#limit}} characters'
  },
  'max': {
    code: 'TOO_LONG',
    message: '{{#label}} length must be at most {{#limit}} characters'
  },
  // ajv 实际使用的关键字（映射到简化版本）
  'minLength': {
    code: 'TOO_SHORT',
    message: '{{#label}} length must be at least {{#limit}} characters'
  },
  'maxLength': {
    code: 'TOO_LONG',
    message: '{{#label}} length must be at most {{#limit}} characters'
  },
  'email': {
    code: 'INVALID_EMAIL',
    message: '{{#label}} must be a valid email address'
  },
  'url': {
    code: 'INVALID_URL',
    message: '{{#label}} must be a valid URL'
  },
  'pattern': {
    code: 'INVALID_PATTERN',
    message: '{{#label}} format is invalid'
  },
  'format': {
    code: 'INVALID_FORMAT',
    message: '{{#label}} must match format "{{#format}}"'
  },
  'required': {
    code: 'REQUIRED',
    message: '{{#label}} is required'
  },

  // Formats (Standardized)
  'format.email': {
    code: 'INVALID_EMAIL',
    message: '{{#label}} must be a valid email address'
  },
  'format.url': {
    code: 'INVALID_URL',
    message: '{{#label}} must be a valid URL'
  },
  'format.uuid': {
    code: 'INVALID_UUID',
    message: '{{#label}} must be a valid UUID'
  },
  'format.ipv4': {
    code: 'INVALID_IPV4',
    message: '{{#label}} must be a valid IPv4 address'
  },
  'format.ipv6': {
    code: 'INVALID_IPV6',
    message: '{{#label}} must be a valid IPv6 address'
  },
  'string.hostname': {
    code: 'STRING_INVALID_HOSTNAME',
    message: '{{#label}} must be a valid hostname'
  },
  'string.pattern': {
    code: 'STRING_PATTERN_MISMATCH',
    message: '{{#label}} format is invalid'
  },
  'string.enum': {
    code: 'STRING_INVALID_ENUM',
    message: '{{#label}} must be one of: {{#valids}}'
  },

  // ========== 数字类型错误 ==========
  'number.base': {
    code: 'NUMBER_INVALID_TYPE',
    message: '{{#label}} must be a number'
  },
  'number.min': {
    code: 'NUMBER_TOO_SMALL',
    message: '{{#label}} must be greater than or equal to {{#limit}}'
  },
  'number.max': {
    code: 'NUMBER_TOO_LARGE',
    message: '{{#label}} must be less than or equal to {{#limit}}'
  },
  'number.integer': {
    code: 'NUMBER_NOT_INTEGER',
    message: '{{#label}} must be an integer'
  },
  'number.positive': {
    code: 'NUMBER_NOT_POSITIVE',
    message: '{{#label}} must be a positive number'
  },
  'number.negative': {
    code: 'NUMBER_NOT_NEGATIVE',
    message: '{{#label}} must be a negative number'
  },

  // ========== 布尔类型错误 ==========
  'boolean.base': {
    code: 'BOOLEAN_INVALID_TYPE',
    message: '{{#label}} must be a boolean'
  },

  // ========== 对象类型错误 ==========
  'object.base': {
    code: 'OBJECT_INVALID_TYPE',
    message: '{{#label}} must be an object'
  },
  'object.min': {
    code: 'OBJECT_TOO_FEW_KEYS',
    message: '{{#label}} must have at least {{#limit}} keys'
  },
  'object.max': {
    code: 'OBJECT_TOO_MANY_KEYS',
    message: '{{#label}} must have at most {{#limit}} keys'
  },
  'object.unknown': {
    code: 'OBJECT_UNKNOWN_KEY',
    message: '{{#label}} contains unknown key: {{#key}}'
  },

  // ========== 数组类型错误 ==========
  'array.base': {
    code: 'ARRAY_INVALID_TYPE',
    message: '{{#label}} must be an array'
  },
  'array.min': {
    code: 'ARRAY_TOO_FEW_ITEMS',
    message: '{{#label}} must have at least {{#limit}} items'
  },
  'array.max': {
    code: 'ARRAY_TOO_MANY_ITEMS',
    message: '{{#label}} must have at most {{#limit}} items'
  },
  'array.length': {
    code: 'ARRAY_INVALID_LENGTH',
    message: '{{#label}} must have exactly {{#limit}} items'
  },
  'array.unique': {
    code: 'ARRAY_NOT_UNIQUE',
    message: '{{#label}} must contain unique items'
  },

  // ========== 日期类型错误 ==========
  'date.base': {
    code: 'DATE_INVALID_TYPE',
    message: '{{#label}} must be a valid date'
  },
  'date.min': {
    code: 'DATE_TOO_EARLY',
    message: '{{#label}} must be on or after {{#limit}}'
  },
  'date.max': {
    code: 'DATE_TOO_LATE',
    message: '{{#label}} must be on or before {{#limit}}'
  },

  // ========== 通用错误 ==========
  'type': {
    code: 'INVALID_TYPE',
    message: '{{#label}} must be of type {{#expected}}'
  },
  'any.required': {
    code: 'FIELD_REQUIRED',
    message: '{{#label}} is required'
  },
  'any.invalid': {
    code: 'FIELD_INVALID',
    message: '{{#label}} contains an invalid value'
  },
  'any.only': {
    code: 'FIELD_NOT_MATCH',
    message: '{{#label}} must match {{#valids}}'
  },
  'any.unknown': {
    code: 'FIELD_UNKNOWN',
    message: '{{#key}} is not allowed'
  },

  // ========== 自定义验证错误 ==========
  'custom.validation': {
    code: 'CUSTOM_VALIDATION_FAILED',
    message: 'Validation failed'
  }
};

/**
 * 获取错误信息
 * @param {string} type - 错误类型
 * @returns {Object} 错误信息
 */
function getErrorInfo(type) {
  const errorInfo = ERROR_CODES[type];
  if (!errorInfo) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown validation error'
    };
  }

  return {
    code: errorInfo.code,
    message: errorInfo.message
  };
}

/**
 * 获取所有错误码
 * @returns {Object} 所有错误码
 */
function getAllErrorCodes() {
  return ERROR_CODES;
}

module.exports = {
  ERROR_CODES,
  getErrorInfo,
  getAllErrorCodes
};

