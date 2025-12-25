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
    message: '{{#label}} length must be at least {{#limit}} characters',
    zhCN: '{{#label}}长度不能少于{{#limit}}个字符'
  },
  'max': {
    code: 'TOO_LONG',
    message: '{{#label}} length must be at most {{#limit}} characters',
    zhCN: '{{#label}}长度不能超过{{#limit}}个字符'
  },
  // ajv 实际使用的关键字（映射到简化版本）
  'minLength': {
    code: 'TOO_SHORT',
    message: '{{#label}} length must be at least {{#limit}} characters',
    zhCN: '{{#label}}长度不能少于{{#limit}}个字符'
  },
  'maxLength': {
    code: 'TOO_LONG',
    message: '{{#label}} length must be at most {{#limit}} characters',
    zhCN: '{{#label}}长度不能超过{{#limit}}个字符'
  },
  'email': {
    code: 'INVALID_EMAIL',
    message: '{{#label}} must be a valid email address',
    zhCN: '{{#label}}必须是有效的邮箱地址'
  },
  'url': {
    code: 'INVALID_URL',
    message: '{{#label}} must be a valid URL',
    zhCN: '{{#label}}必须是有效的URL地址'
  },
  'pattern': {
    code: 'INVALID_PATTERN',
    message: '{{#label}} format is invalid',
    zhCN: '{{#label}}格式不正确'
  },
  'format': {
    code: 'INVALID_FORMAT',
    message: '{{#label}} must match format "{{#format}}"',
    zhCN: '{{#label}}格式不正确'
  },
  'required': {
    code: 'REQUIRED',
    message: '{{#label}} is required',
    zhCN: '{{#label}}不能为空'
  },

  // 向后兼容：保留旧格式
  'string.base': {
    code: 'STRING_INVALID_TYPE',
    message: '{{#label}} must be a string',
    zhCN: '{{#label}}必须是字符串类型'
  },
  'string.min': {
    code: 'STRING_TOO_SHORT',
    message: '{{#label}} length must be at least {{#limit}} characters',
    zhCN: '{{#label}}长度不能少于{{#limit}}个字符'
  },
  'string.max': {
    code: 'STRING_TOO_LONG',
    message: '{{#label}} length must be at most {{#limit}} characters',
    zhCN: '{{#label}}长度不能超过{{#limit}}个字符'
  },
  'string.length': {
    code: 'STRING_INVALID_LENGTH',
    message: '{{#label}} length must be exactly {{#limit}} characters',
    zhCN: '{{#label}}长度必须是{{#limit}}个字符'
  },
  'string.email': {
    code: 'STRING_INVALID_EMAIL',
    message: '{{#label}} must be a valid email address',
    zhCN: '{{#label}}必须是有效的邮箱地址'
  },
  'string.uri': {
    code: 'STRING_INVALID_URI',
    message: '{{#label}} must be a valid URI',
    zhCN: '{{#label}}必须是有效的URL地址'
  },
  'string.uuid': {
    code: 'STRING_INVALID_UUID',
    message: '{{#label}} must be a valid UUID',
    zhCN: '{{#label}}必须是有效的UUID'
  },
  'string.ipv4': {
    code: 'STRING_INVALID_IPV4',
    message: '{{#label}} must be a valid IPv4 address',
    zhCN: '{{#label}}必须是有效的IPv4地址'
  },
  'string.ipv6': {
    code: 'STRING_INVALID_IPV6',
    message: '{{#label}} must be a valid IPv6 address',
    zhCN: '{{#label}}必须是有效的IPv6地址'
  },
  'string.hostname': {
    code: 'STRING_INVALID_HOSTNAME',
    message: '{{#label}} must be a valid hostname',
    zhCN: '{{#label}}必须是有效的主机名'
  },
  'string.pattern': {
    code: 'STRING_PATTERN_MISMATCH',
    message: '{{#label}} format is invalid',
    zhCN: '{{#label}}格式不符合要求'
  },
  'string.enum': {
    code: 'STRING_INVALID_ENUM',
    message: '{{#label}} must be one of: {{#valids}}',
    zhCN: '{{#label}}必须是以下值之一: {{#valids}}'
  },

  // ========== 数字类型错误 ==========
  'number.base': {
    code: 'NUMBER_INVALID_TYPE',
    message: '{{#label}} must be a number',
    zhCN: '{{#label}}必须是数字类型'
  },
  'number.min': {
    code: 'NUMBER_TOO_SMALL',
    message: '{{#label}} must be greater than or equal to {{#limit}}',
    zhCN: '{{#label}}不能小于{{#limit}}'
  },
  'number.max': {
    code: 'NUMBER_TOO_LARGE',
    message: '{{#label}} must be less than or equal to {{#limit}}',
    zhCN: '{{#label}}不能大于{{#limit}}'
  },
  'number.integer': {
    code: 'NUMBER_NOT_INTEGER',
    message: '{{#label}} must be an integer',
    zhCN: '{{#label}}必须是整数'
  },
  'number.positive': {
    code: 'NUMBER_NOT_POSITIVE',
    message: '{{#label}} must be a positive number',
    zhCN: '{{#label}}必须是正数'
  },
  'number.negative': {
    code: 'NUMBER_NOT_NEGATIVE',
    message: '{{#label}} must be a negative number',
    zhCN: '{{#label}}必须是负数'
  },

  // ========== 布尔类型错误 ==========
  'boolean.base': {
    code: 'BOOLEAN_INVALID_TYPE',
    message: '{{#label}} must be a boolean',
    zhCN: '{{#label}}必须是布尔类型'
  },

  // ========== 对象类型错误 ==========
  'object.base': {
    code: 'OBJECT_INVALID_TYPE',
    message: '{{#label}} must be an object',
    zhCN: '{{#label}}必须是对象类型'
  },
  'object.min': {
    code: 'OBJECT_TOO_FEW_KEYS',
    message: '{{#label}} must have at least {{#limit}} keys',
    zhCN: '{{#label}}至少需要{{#limit}}个属性'
  },
  'object.max': {
    code: 'OBJECT_TOO_MANY_KEYS',
    message: '{{#label}} must have at most {{#limit}} keys',
    zhCN: '{{#label}}最多只能有{{#limit}}个属性'
  },
  'object.unknown': {
    code: 'OBJECT_UNKNOWN_KEY',
    message: '{{#label}} contains unknown key: {{#key}}',
    zhCN: '{{#label}}包含未知属性: {{#key}}'
  },

  // ========== 数组类型错误 ==========
  'array.base': {
    code: 'ARRAY_INVALID_TYPE',
    message: '{{#label}} must be an array',
    zhCN: '{{#label}}必须是数组类型'
  },
  'array.min': {
    code: 'ARRAY_TOO_FEW_ITEMS',
    message: '{{#label}} must have at least {{#limit}} items',
    zhCN: '{{#label}}至少需要{{#limit}}个元素'
  },
  'array.max': {
    code: 'ARRAY_TOO_MANY_ITEMS',
    message: '{{#label}} must have at most {{#limit}} items',
    zhCN: '{{#label}}最多只能有{{#limit}}个元素'
  },
  'array.length': {
    code: 'ARRAY_INVALID_LENGTH',
    message: '{{#label}} must have exactly {{#limit}} items',
    zhCN: '{{#label}}必须有{{#limit}}个元素'
  },
  'array.unique': {
    code: 'ARRAY_NOT_UNIQUE',
    message: '{{#label}} must contain unique items',
    zhCN: '{{#label}}不能包含重复元素'
  },

  // ========== 日期类型错误 ==========
  'date.base': {
    code: 'DATE_INVALID_TYPE',
    message: '{{#label}} must be a valid date',
    zhCN: '{{#label}}必须是有效的日期'
  },
  'date.min': {
    code: 'DATE_TOO_EARLY',
    message: '{{#label}} must be on or after {{#limit}}',
    zhCN: '{{#label}}不能早于{{#limit}}'
  },
  'date.max': {
    code: 'DATE_TOO_LATE',
    message: '{{#label}} must be on or before {{#limit}}',
    zhCN: '{{#label}}不能晚于{{#limit}}'
  },

  // ========== 通用错误 ==========
  'any.required': {
    code: 'FIELD_REQUIRED',
    message: '{{#label}} is required',
    zhCN: '{{#label}}是必填项'
  },
  'any.invalid': {
    code: 'FIELD_INVALID',
    message: '{{#label}} contains an invalid value',
    zhCN: '{{#label}}包含无效值'
  },
  'any.only': {
    code: 'FIELD_NOT_MATCH',
    message: '{{#label}} must match {{#valids}}',
    zhCN: '{{#label}}必须匹配{{#valids}}'
  },
  'any.unknown': {
    code: 'FIELD_UNKNOWN',
    message: '{{#key}} is not allowed',
    zhCN: '不允许字段{{#key}}'
  },

  // ========== 自定义验证错误 ==========
  'custom.validation': {
    code: 'CUSTOM_VALIDATION_FAILED',
    message: 'Validation failed',
    zhCN: '验证失败'
  }
};

/**
 * 获取错误信息
 * @param {string} type - 错误类型
 * @param {string} [lang='en-US'] - 语言
 * @returns {Object} 错误信息
 */
function getErrorInfo(type, lang = 'en-US') {
  const errorInfo = ERROR_CODES[type];
  if (!errorInfo) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown validation error'
    };
  }

  const message = lang === 'zh-CN' ? errorInfo.zhCN : errorInfo.message;
  return {
    code: errorInfo.code,
    message
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

