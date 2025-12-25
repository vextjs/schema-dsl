/**
 * 错误码定义 v2.0.1
 *
 * 简化的错误代码系统（无类型前缀）
 * 使用方式: .messages({ 'min': '自定义消息', 'pattern': '格式不正确' })
 *
 * @module lib/core/ErrorCodes
 */

const ERROR_CODES = {
  // ========== 长度/范围约束 ==========
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
  'length': {
    code: 'INVALID_LENGTH',
    message: '{{#label}} length must be exactly {{#limit}} characters',
    zhCN: '{{#label}}长度必须是{{#limit}}个字符'
  },

  // ========== 格式验证 ==========
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
  'uuid': {
    code: 'INVALID_UUID',
    message: '{{#label}} must be a valid UUID',
    zhCN: '{{#label}}必须是有效的UUID'
  },
  'ipv4': {
    code: 'INVALID_IPV4',
    message: '{{#label}} must be a valid IPv4 address',
    zhCN: '{{#label}}必须是有效的IPv4地址'
  },
  'ipv6': {
    code: 'INVALID_IPV6',
    message: '{{#label}} must be a valid IPv6 address',
    zhCN: '{{#label}}必须是有效的IPv6地址'
  },
  'hostname': {
    code: 'INVALID_HOSTNAME',
    message: '{{#label}} must be a valid hostname',
    zhCN: '{{#label}}必须是有效的主机名'
  },
  'date': {
    code: 'INVALID_DATE',
    message: '{{#label}} must be a valid date',
    zhCN: '{{#label}}必须是有效的日期'
  },

  // ========== 模式验证 ==========
  'pattern': {
    code: 'INVALID_PATTERN',
    message: '{{#label}} format is invalid',
    zhCN: '{{#label}}格式不正确'
  },
  'enum': {
    code: 'INVALID_ENUM',
    message: '{{#label}} must be one of: {{#valids}}',
    zhCN: '{{#label}}必须是以下值之一: {{#valids}}'
  },

  // ========== 必填/类型 ==========
  'required': {
    code: 'REQUIRED',
    message: '{{#label}} is required',
    zhCN: '{{#label}}不能为空'
  },
  'type': {
    code: 'INVALID_TYPE',
    message: '{{#label}} must be a valid type',
    zhCN: '{{#label}}类型不正确'
  },

  // ========== 数字验证 ==========
  'integer': {
    code: 'NOT_INTEGER',
    message: '{{#label}} must be an integer',
    zhCN: '{{#label}}必须是整数'
  },
  'positive': {
    code: 'NOT_POSITIVE',
    message: '{{#label}} must be a positive number',
    zhCN: '{{#label}}必须是正数'
  },
  'negative': {
    code: 'NOT_NEGATIVE',
    message: '{{#label}} must be a negative number',
    zhCN: '{{#label}}必须是负数'
  },

  // ========== 数组验证 ==========
  'unique': {
    code: 'NOT_UNIQUE',
    message: '{{#label}} must contain unique items',
    zhCN: '{{#label}}不能包含重复元素'
  },

  // ========== 对象验证 ==========
  'unknown': {
    code: 'UNKNOWN_KEY',
    message: '{{#label}} contains unknown key: {{#key}}',
    zhCN: '{{#label}}包含未知属性: {{#key}}'
  },

  // ========== 自定义验证 ==========
  'custom': {
    code: 'CUSTOM_VALIDATION_FAILED',
    message: 'Validation failed',
    zhCN: '验证失败'
  },
  'invalid': {
    code: 'INVALID_VALUE',
    message: '{{#label}} contains an invalid value',
    zhCN: '{{#label}}包含无效值'
  }
};

/**
 * 获取错误信息
 * @param {string} type - 错误类型（简化格式，无类型前缀）
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

