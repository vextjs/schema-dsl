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
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object} params - 错误参数（用于插值）
   * @param {number} statusCode - HTTP 状态码（默认 400）
   * @param {string} locale - 语言环境（默认使用当前语言）
   */
  constructor(code, params = {}, statusCode = 400, locale = null) {
    // 获取翻译后的消息模板
    const actualLocale = locale || Locale.getLocale();
    const template = Locale.getMessage(code, {}, actualLocale);

    // 使用 MessageTemplate 进行参数插值
    const messageTemplate = new MessageTemplate(template);
    const message = messageTemplate.render(params || {});

    super(message);

    this.name = 'I18nError';
    this.code = code;
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
   * @param {Object} params - 错误参数
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（可选，不传则使用全局语言）
   * @returns {I18nError} 错误实例
   *
   * @example
   * // 创建错误（不抛出）
   * const error = I18nError.create('error.notFound', { resource: '用户' });
   *
   * @example
   * // 直接抛出
   * throw I18nError.create('error.notFound', { resource: '用户' });
   *
   * @example
   * // 运行时指定语言
   * const error = I18nError.create('error.notFound', {}, 404, 'en-US');
   */
  static create(code, params = {}, statusCode = 400, locale = null) {
    return new I18nError(code, params, statusCode, locale);
  }

  /**
   * 静态工厂方法 - 快速抛出错误
   *
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object} params - 错误参数
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（可选，不传则使用全局语言）
   * @throws {I18nError} 直接抛出错误
   *
   * @example
   * I18nError.throw('error.notFound', { resource: '用户' });
   * // 等同于：throw I18nError.create('error.notFound', { resource: '用户' });
   *
   * @example
   * // 运行时指定语言
   * I18nError.throw('error.notFound', {}, 404, 'en-US');
   */
  static throw(code, params = {}, statusCode = 400, locale = null) {
    throw new I18nError(code, params, statusCode, locale);
  }

  /**
   * 断言方法 - 条件不满足时抛错
   *
   * @param {boolean} condition - 条件表达式
   * @param {string} code - 错误代码（多语言 key）
   * @param {Object} params - 错误参数
   * @param {number} statusCode - HTTP 状态码
   * @param {string} locale - 语言环境（可选，不传则使用全局语言）
   * @throws {I18nError} 条件为 false 时抛出错误
   *
   * @example
   * I18nError.assert(account, 'account.notFound', { accountId: id });
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
  static assert(condition, code, params = {}, statusCode = 400, locale = null) {
    if (!condition) {
      throw new I18nError(code, params, statusCode, locale);
    }
  }

  /**
   * 检查错误是否为指定代码
   *
   * @param {string} code - 错误代码
   * @returns {boolean} 是否匹配
   *
   * @example
   * try {
   *   // ...
   * } catch (error) {
   *   if (error instanceof I18nError && error.is('account.notFound')) {
   *     // 处理账户不存在的情况
   *   }
   * }
   */
  is(code) {
    return this.code === code;
  }

  /**
   * 转换为 JSON 格式（用于 API 响应）
   *
   * @returns {Object} JSON 对象
   * @returns {string} return.error - 错误名称
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
   * //   code: 'account.notFound',
   * //   message: '找不到账户',
   * //   params: { accountId: '123' },
   * //   statusCode: 404,
   * //   locale: 'zh-CN'
   * // }
   */
  toJSON() {
    return {
      error: this.name,
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

