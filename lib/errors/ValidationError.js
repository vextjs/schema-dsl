/**
 * ValidationError - 验证错误类
 *
 * 用于 validateAsync() 方法，验证失败时自动抛出
 *
 * @module lib/errors/ValidationError
 * @version 1.0.3
 */

/**
 * 验证错误类
 *
 * @class ValidationError
 * @extends Error
 *
 * @property {string} name - 错误名称（固定为 'ValidationError'）
 * @property {string} message - 错误消息（所有错误的汇总）
 * @property {Array<Object>} errors - 详细错误列表
 * @property {*} data - 原始验证数据
 * @property {number} statusCode - HTTP 状态码（默认 400）
 *
 * @example
 * // 创建错误
 * const errors = [
 *   { path: '/name', message: '字段必填', keyword: 'required' }
 * ];
 * const error = new ValidationError(errors, inputData);
 *
 * @example
 * // 在 Express 中使用
 * app.use((error, req, res, next) => {
 *   if (error instanceof ValidationError) {
 *     return res.status(error.statusCode).json(error.toJSON());
 *   }
 *   next(error);
 * });
 */
class ValidationError extends Error {
  /**
   * 构造函数
   * @param {Array<Object>} errors - 错误列表
   * @param {string} errors[].path - 字段路径（如 '/name'）
   * @param {string} errors[].message - 错误消息
   * @param {string} errors[].keyword - 验证关键字（如 'required', 'format'）
   * @param {Object} errors[].params - 错误参数
   * @param {*} data - 原始数据
   */
  constructor(errors, data) {
    // 生成友好的错误消息
    const messages = errors.map(e => {
      if (e.path) {
        const field = e.path.replace(/^\//, '');
        // 只有字段名非空时才添加前缀
        return field ? `${field}: ${e.message}` : e.message;
      }
      return e.message;
    }).join('; ');

    // 检查是否所有错误都完全没有 path 属性（而不是空路径）
    const hasNoPath = errors.every(e => e.path === undefined || e.path === null);

    // 如果都是无 path 属性的错误，使用简单格式；否则使用标准格式
    super(hasNoPath ? `Validation failed - ${messages}` : `Validation failed: ${messages}`);

    this.name = 'ValidationError';
    this.errors = errors;
    this.data = data;
    this.statusCode = 400;

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * 转换为 JSON 格式（用于 API 响应）
   *
   * @returns {Object} JSON 对象
   * @returns {string} return.error - 错误名称
   * @returns {string} return.message - 错误消息
   * @returns {number} return.statusCode - 状态码
   * @returns {Array<Object>} return.details - 详细错误列表
   *
   * @example
   * const json = error.toJSON();
   * res.status(400).json(json);
   * // {
   * //   error: 'ValidationError',
   * //   message: 'Validation failed: name: 字段必填',
   * //   statusCode: 400,
   * //   details: [...]
   * // }
   */
  toJSON() {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.errors.map(e => ({
        field: e.path ? e.path.replace(/^\//, '') : null,
        message: e.message,
        keyword: e.keyword,
        params: e.params
      }))
    };
  }

  /**
   * 获取指定字段的错误
   *
   * @param {string} field - 字段名称（如 'name' 或 '/name'）
   * @returns {Object|null} 错误对象或 null
   *
   * @example
   * const nameError = error.getFieldError('name');
   * if (nameError) {
   *   console.log('姓名错误:', nameError.message);
   * }
   */
  getFieldError(field) {
    // 规范化字段名（移除前导斜杠）
    const normalizedField = field.replace(/^\//, '');

    // 查找匹配的错误（支持多种路径格式）
    return this.errors.find(e => {
      if (!e.path) return false;
      const errorField = e.path.replace(/^\//, '');
      return errorField === normalizedField;
    }) || null;
  }

  /**
   * 获取所有字段的错误映射
   *
   * @returns {Object} 字段错误映射 { fieldName: errorMessage }
   *
   * @example
   * const fieldErrors = error.getFieldErrors();
   * // { name: '字段必填', email: '邮箱格式错误' }
   */
  getFieldErrors() {
    const result = {};
    this.errors.forEach(e => {
      if (e.path) {
        const field = e.path.replace(/^\//, '');
        if (field) {
          result[field] = e.message;
        }
      }
    });
    return result;
  }

  /**
   * 检查是否包含指定字段的错误
   *
   * @param {string} field - 字段名称
   * @returns {boolean} 是否包含错误
   *
   * @example
   * if (error.hasFieldError('name')) {
   *   console.log('姓名字段有错误');
   * }
   */
  hasFieldError(field) {
    return this.getFieldError(field) !== null;
  }

  /**
   * 获取错误数量
   *
   * @returns {number} 错误数量
   *
   * @example
   * console.log(`共 ${error.getErrorCount()} 个错误`);
   */
  getErrorCount() {
    return this.errors.length;
  }
}

// Support calling without new
const ValidationErrorProxy = new Proxy(ValidationError, {
  apply: function (target, thisArg, argumentsList) {
    return new target(...argumentsList);
  }
});

module.exports = ValidationErrorProxy;

