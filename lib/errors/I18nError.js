/**
 * I18nError - 多语言错误工具类
 *
 * 提供统一的多语言错误抛出机制，支持：
 * - 多语言 key 自动翻译
 * - 参数插值（如 {{field}}, {{limit}}）
 * - 自定义错误代码
 * - Express/Koa 集成
 *
 * @module lib/errors/I18nError
 * @version 1.1.1
 *
 * @example 基础用法
 * const { I18nError } = require('schema-dsl');
 *
 * // 抛出多语言错误
 * throw I18nError.create('error.notFound', { resource: '账户' });
 * // 中文: "找不到账户"
 * // 英文: "Account not found"
 *
 * @example 业务代码中使用
 * function getAccount(id) {
 *   const account = db.findAccount(id);
 *   if (!account) {
 *     throw I18nError.create('account.notFound', { accountId: id });
 *   }
 *   if (account.balance < 100) {
 *     throw I18nError.create('account.insufficientBalance', {
 *       balance: account.balance,
 *       required: 100
 *     });
 *   }
 *   return account;
 * }
 *
 * @example Express 中间件
 * app.use((error, req, res, next) => {
 *   if (error instanceof I18nError) {
 *     return res.status(error.statusCode).json(error.toJSON());
 *   }
 *   next(error);
 * });
 */

const Locale = require('../core/Locale');
const MessageTemplate = require('../core/MessageTemplate');

/**
 * 智能参数识别工具函数
 * @private
 * @param {Object|string} paramsOrLocale - 参数对象 或 语言代码
 * @param {number} statusCode - HTTP 状态码
 * @param {string} locale - 语言环境
 * @returns {Object} 规范化后的参数 { params, statusCode, locale }
 */
function normalizeParams(paramsOrLocale, statusCode, locale) {
  let params = {};
  let actualStatusCode = 400;
  let actualLocale = null;

  if (typeof paramsOrLocale === 'string') {
    // 情况1：第2个参数是字符串 → 视为语言
    actualLocale = paramsOrLocale;
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400;
  } else if (paramsOrLocale && typeof paramsOrLocale === 'object' && !Array.isArray(paramsOrLocale)) {
    // 情况2：第2个参数是对象（非数组）→ 视为参数对象
    params = paramsOrLocale;
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400;
    actualLocale = locale;
  } else {
    // 情况3：第2个参数是 null/undefined/数组 → 使用默认值和后续参数
    actualStatusCode = typeof statusCode === 'number' ? statusCode : 400;
    actualLocale = locale;
  }

  return { params, statusCode: actualStatusCode, locale: actualLocale };
}

/**
 * 多语言错误类
 *
 * @class I18nError
 * @extends Error
 *
 * @property {string} name - 错误名称（固定为 'I18nError'）
 * @property {string} message - 错误消息（已翻译）
 * @property {string} code - 错误代码（多语言 key）
 * @property {Object} params - 错误参数（用于插值）
 * @property {number} statusCode - HTTP 状态码（默认 400）
 * @property {string} locale - 使用的语言环境
 */
class I18nError extends Error {
  /**
   * 构造函数
   * @param {string} key - 错误代码（多语言 key）
   * @param {Object} params - 错误参数（用于插值）
   * @param {number} statusCode - HTTP 状态码（默认 400）
   * @param {string} locale - 语言环境（默认使用当前语言）
   * @version 1.1.5 - 支持对象格式配置
   */
  constructor(key, params = {}, statusCode = 400, locale = null) {
    // 获取语言环境
    const actualLocale = locale || Locale.getLocale();

    // 获取消息配置（v1.1.5: 返回对象 { code, message }）
    const messageConfig = Locale.getMessage(key, {}, actualLocale);

    // 判断返回类型（向后兼容）
    let errorCode, template;
    if (typeof messageConfig === 'object' && messageConfig.code && messageConfig.message) {
      // 对象格式：提取 code 和 message
      errorCode = messageConfig.code;
      template = messageConfig.message;
    } else if (typeof messageConfig === 'string') {
      // 字符串格式（向后兼容）
      errorCode = key;
      template = messageConfig;
    } else {
      // 降级处理
      errorCode = key;
      template = key;
    }

    // 使用 MessageTemplate 进行参数插值
    const messageTemplate = new MessageTemplate(template);
    const message = messageTemplate.render(params || {});

    super(message);

    this.name = 'I18nError';
    this.originalKey = key;           // v1.1.5 新增：保留原始 key
    this.code = errorCode;            // v1.1.5 修改：从对象提取或使用 key
    this.params = params || {};
    this.statusCode = statusCode;
    this.locale = actualLocale;

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, I18nError);
    }
  }

  /**
   * 静态工厂方法 - 创建并抛出错误
   *
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object|string} paramsOrLocale - 错误参数对象 或 语言代码（智能识别）
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（仅当第2个参数是对象时有效）
   * @returns {I18nError} 错误实例
   *
   * @example
   * // 方式1：简化语法（直接传语言）
   * const error = I18nError.create('account.notFound', 'zh-CN');
   * const error = I18nError.create('account.notFound', 'en-US', 404);
   *
   * @example
   * // 方式2：标准语法（带参数对象）
   * const error = I18nError.create('account.notFound', { userId: '123' }, 404, 'zh-CN');
   *
   * @example
   * // 方式3：省略参数（使用全局语言）
   * const error = I18nError.create('account.notFound');
   *
   * @example
   * // 直接抛出
   * throw I18nError.create('error.notFound', { resource: '用户' });
   *
   * @example
   * // 运行时指定语言
   * const error = I18nError.create('error.notFound', {}, 404, 'en-US');
   */
  static create(code, paramsOrLocale, statusCode, locale) {
    const { params, statusCode: actualStatusCode, locale: actualLocale } = normalizeParams(paramsOrLocale, statusCode, locale);
    return new I18nError(code, params, actualStatusCode, actualLocale);
  }

  /**
   * 静态工厂方法 - 快速抛出错误
   *
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object|string} paramsOrLocale - 错误参数对象 或 语言代码（智能识别）
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（仅当第2个参数是对象时有效）
   * @throws {I18nError} 直接抛出错误
   *
   * @example
   * // 方式1：简化语法（直接传语言）
   * I18nError.throw('account.notFound', 'zh-CN');
   * I18nError.throw('account.notFound', 'en-US', 404);
   *
   * @example
   * // 方式2：标准语法（带参数对象）
   * I18nError.throw('account.notFound', { userId: '123' }, 404, 'zh-CN');
   *
   * @example
   * // 方式3：省略参数（使用全局语言）
   * I18nError.throw('account.notFound');
   *
   * @example
   * I18nError.throw('error.notFound', { resource: '用户' });
   * // 等同于：throw I18nError.create('error.notFound', { resource: '用户' });
   *
   * @example
   * // 运行时指定语言
   * I18nError.throw('error.notFound', {}, 404, 'en-US');
   */
  static throw(code, paramsOrLocale, statusCode, locale) {
    const { params, statusCode: actualStatusCode, locale: actualLocale } = normalizeParams(paramsOrLocale, statusCode, locale);
    throw new I18nError(code, params, actualStatusCode, actualLocale);
  }

  /**
   * 断言方法 - 条件不满足时抛错
   *
   * @param {boolean} condition - 条件表达式
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object|string} paramsOrLocale - 错误参数对象 或 语言代码（智能识别）
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（仅当第3个参数是对象时有效）
   * @throws {I18nError} 条件为 false 时抛出错误
   *
   * @example
   * // 方式1：简化语法（直接传语言）
   * I18nError.assert(account, 'account.notFound', 'zh-CN');
   * I18nError.assert(account, 'account.notFound', 'en-US', 404);
   *
   * @example
   * // 方式2：标准语法（带参数对象）
   * I18nError.assert(account, 'account.notFound', { accountId: id }, 404, 'zh-CN');
   * // 等同于：if (!account) throw I18nError.create('account.notFound', { accountId: id });
   *
   * @example
   * I18nError.assert(
   *   account.balance >= 100,
   *   'account.insufficientBalance',
   *   { balance: account.balance, required: 100 }
   * );
   *
   * @example
   * // 运行时指定语言
   * I18nError.assert(account, 'account.notFound', {}, 404, 'en-US');
   */
  static assert(condition, code, paramsOrLocale, statusCode, locale) {
    if (!condition) {
      const { params, statusCode: actualStatusCode, locale: actualLocale } = normalizeParams(paramsOrLocale, statusCode, locale);
      throw new I18nError(code, params, actualStatusCode, actualLocale);
    }
  }

  /**
   * 检查错误是否为指定代码
   *
   * @param {string} codeOrKey - 错误代码或原始 key
   * @returns {boolean} 是否匹配
   *
   * @example
   * try {
   *   // ...
   * } catch (error) {
   *   if (error instanceof I18nError && error.is('account.notFound')) {
   *     // 处理账户不存在的情况
   *   }
   *
   *   // v1.1.5: 也可以用 code 判断
   *   if (error instanceof I18nError && error.is('ACCOUNT_NOT_FOUND')) {
   *     // 也能匹配
   *   }
   * }
   */
  is(codeOrKey) {
    // v1.1.5: 同时比较 code 和 originalKey（向后兼容）
    return this.code === codeOrKey || this.originalKey === codeOrKey;
  }

  /**
   * 转换为 JSON 格式（用于 API 响应）
   *
   * @returns {Object} JSON 对象
   * @returns {string} return.error - 错误名称
   * @returns {string} return.originalKey - 原始 key（v1.1.5 新增）
   * @returns {string} return.code - 错误代码
   * @returns {string} return.message - 错误消息（已翻译）
   * @returns {Object} return.params - 错误参数
   * @returns {number} return.statusCode - 状态码
   * @returns {string} return.locale - 语言环境
   *
   * @example
   * const json = error.toJSON();
   * res.status(error.statusCode).json(json);
   * // {
   * //   error: 'I18nError',
   * //   originalKey: 'account.notFound',  // v1.1.5 新增
   * //   code: 'ACCOUNT_NOT_FOUND',
   * //   message: '找不到账户',
   * //   params: { accountId: '123' },
   * //   statusCode: 404,
   * //   locale: 'zh-CN'
   * // }
   */
  toJSON() {
    return {
      error: this.name,
      originalKey: this.originalKey,  // v1.1.5 新增
      code: this.code,
      message: this.message,
      params: this.params,
      statusCode: this.statusCode,
      locale: this.locale
    };
  }

  /**
   * 转换为字符串
   *
   * @returns {string} 格式化的错误信息
   *
   * @example
   * console.log(error.toString());
   * // "I18nError [account.notFound]: 找不到账户"
   */
  toString() {
    return `${this.name} [${this.code}]: ${this.message}`;
  }
}

module.exports = I18nError;

