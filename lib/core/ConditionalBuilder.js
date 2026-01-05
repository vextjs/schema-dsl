/**
 * ConditionalBuilder - 链式条件构建器
 *
 * 提供流畅的条件判断 API，类似 JavaScript if-else 语句
 *
 * @module lib/core/ConditionalBuilder
 * @version 1.0.0
 *
 * @example
 * // 简单条件 + 错误消息
 * dsl.if((data) => data.age >= 18)
 *   .message('未成年用户不能注册')
 *
 * @example
 * // 多条件 and
 * dsl.if((data) => data.age >= 18)
 *   .and((data) => data.userType === 'admin')
 *   .then('email!')
 *
 * @example
 * // 多条件 or
 * dsl.if((data) => data.age < 18)
 *   .or((data) => data.isBlocked)
 *   .message('不允许注册')
 *
 * @example
 * // elseIf 和 else
 * dsl.if((data) => data.userType === 'admin')
 *   .then('email!')
 *   .elseIf((data) => data.userType === 'vip')
 *   .then('email')
 *   .else(null)
 */

class ConditionalBuilder {
  /**
   * 创建条件构建器实例
   * @private - 不直接调用，使用 dsl.if() 入口
   */
  constructor() {
    this._conditions = [];
    this._elseSchema = undefined;
    this._isConditional = true;
  }

  /**
   * 开始条件判断
   * @param {Function} conditionFn - 条件函数，接收完整数据对象
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * dsl.if((data) => data.age >= 18)
   */
  if(conditionFn) {
    if (typeof conditionFn !== 'function') {
      throw new Error('Condition must be a function');
    }

    this._conditions.push({
      type: 'if',
      condition: conditionFn,
      combinedConditions: [{ op: 'root', fn: conditionFn }]
    });

    return this;
  }

  /**
   * 添加 AND 条件（与前一个条件组合）
   * @param {Function} conditionFn - 条件函数
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * dsl.if((data) => data.age >= 18)
   *   .and((data) => data.userType === 'admin')
   *   .then('email!')
   */
  and(conditionFn) {
    if (typeof conditionFn !== 'function') {
      throw new Error('Condition must be a function');
    }

    const last = this._conditions[this._conditions.length - 1];
    if (!last) {
      throw new Error('.and() must follow .if() or .elseIf()');
    }

    last.combinedConditions.push({ op: 'and', fn: conditionFn });
    return this;
  }

  /**
   * 添加 OR 条件（与前一个条件组合）
   * @param {Function} conditionFn - 条件函数
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * dsl.if((data) => data.age < 18)
   *   .or((data) => data.isBlocked)
   *   .message('不允许注册')
   */
  or(conditionFn) {
    if (typeof conditionFn !== 'function') {
      throw new Error('Condition must be a function');
    }

    const last = this._conditions[this._conditions.length - 1];
    if (!last) {
      throw new Error('.or() must follow .if() or .elseIf()');
    }

    last.combinedConditions.push({ op: 'or', fn: conditionFn });
    return this;
  }

  /**
   * 添加 else-if 分支
   * @param {Function} conditionFn - 条件函数
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * dsl.if((data) => data.userType === 'admin')
   *   .then('email!')
   *   .elseIf((data) => data.userType === 'vip')
   *   .then('email')
   */
  elseIf(conditionFn) {
    if (typeof conditionFn !== 'function') {
      throw new Error('Condition must be a function');
    }

    if (this._conditions.length === 0) {
      throw new Error('.elseIf() must follow .if()');
    }

    this._conditions.push({
      type: 'elseIf',
      condition: conditionFn,
      combinedConditions: [{ op: 'root', fn: conditionFn }]
    });

    return this;
  }

  /**
   * 设置错误消息（支持多语言 key）
t   * 条件为 true 时自动抛出此错误，条件为 false 时通过验证
   *
   * @param {string} msg - 错误消息或多语言 key
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * // 如果是未成年人，抛出错误
   * dsl.if((data) => data.age < 18)
   *   .message('未成年用户不能注册')
   */
  message(msg) {
    if (typeof msg !== 'string') {
      throw new Error('Message must be a string');
    }

    const last = this._conditions[this._conditions.length - 1];
    if (!last) {
      throw new Error('.message() must follow .if() or .elseIf()');
    }

    last.message = msg;
    last.action = 'throw';  // 有 message 就自动 throw
    return this;
  }

  /**
   * 设置满足条件时的 Schema
   * @param {string|Object} schema - DSL 字符串或 Schema 对象
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * dsl.if((data) => data.userType === 'admin')
   *   .then('email!')
   */
  then(schema) {
    const last = this._conditions[this._conditions.length - 1];
    if (!last) {
      throw new Error('.then() must follow .if() or .elseIf()');
    }

    last.then = schema;
    return this;
  }

  /**
   * 设置默认 Schema（所有条件都不满足时）
   * 可选：不写 else 就是不验证
   *
   * @param {string|Object|null} schema - DSL 字符串、Schema 对象或 null
   * @returns {ConditionalBuilder} 当前实例（支持链式调用）
   *
   * @example
   * // else 可选
   * dsl.if((data) => data.userType === 'admin')
   *   .then('email!')  // 不写 else
   *
   * @example
   * // 显式指定 else
   * dsl.if((data) => data.userType === 'admin')
   *   .then('email!')
   *   .else('email')
   */
  else(schema) {
    this._elseSchema = schema;
    return this;
  }

  /**
   * 执行组合条件（内部方法）
   * @private
   * @param {Object} conditionObj - 条件对象
   * @param {*} data - 待验证数据对象
   * @returns {boolean} 条件结果
   */
  _evaluateCondition(conditionObj, data) {
    try {
      let result = false;

      for (let i = 0; i < conditionObj.combinedConditions.length; i++) {
        const combined = conditionObj.combinedConditions[i];

        if (combined.op === 'root') {
          // 第一个条件
          result = combined.fn(data);
        } else if (combined.op === 'and') {
          // AND 组合
          result = result && combined.fn(data);
        } else if (combined.op === 'or') {
          // OR 组合
          result = result || combined.fn(data);
        }
      }

      return result;
    } catch (error) {
      // 条件函数执行出错，视为不满足
      return false;
    }
  }

  /**
   * 转换为 Schema 对象（内部方法）
   * @private
   * @returns {Object} Schema 对象
   */
  toSchema() {
    return {
      _isConditional: true,
      conditions: this._conditions,
      else: this._elseSchema,
      // 保存 _evaluateCondition 方法供 Validator 使用
      _evaluateCondition: this._evaluateCondition.bind(this)
    };
  }

  /**
   * 快捷验证方法 - 返回完整验证结果
   * @param {*} data - 待验证的数据（任意类型）
   * @param {Object} options - 验证选项（可选）
   * @returns {Object} 验证结果 { valid, errors, data }
   *
   * @example
   * // 一行代码验证
   * const result = dsl.if(d => d.age < 18)
   *   .message('未成年')
   *   .validate({ age: 16 });
   *
   * @example
   * // 复用验证器
   * const validator = dsl.if(d => d.age < 18).message('未成年');
   * const r1 = validator.validate({ age: 16 });
   * const r2 = validator.validate({ age: 20 });
   *
   * @example
   * // 非对象类型
   * const result = dsl.if(d => d.includes('@'))
   *   .then('email!')
   *   .validate('test@example.com');
   */
  validate(data, options = {}) {
    const Validator = require('./Validator');
    const validator = new Validator(options);
    return validator.validate(this.toSchema(), data, options);
  }

  /**
   * 异步验证方法 - 失败自动抛出异常
   * @param {*} data - 待验证的数据
   * @param {Object} options - 验证选项（可选）
   * @returns {Promise<*>} 验证通过返回数据，失败抛出异常
   * @throws {ValidationError} 验证失败抛出异常
   *
   * @example
   * // 异步验证，失败自动抛错
   * try {
   *   const data = await dsl.if(d => d.age < 18)
   *     .message('未成年')
   *     .validateAsync({ age: 16 });
   * } catch (error) {
   *   console.log(error.message);  // "未成年"
   * }
   *
   * @example
   * // Express 中间件
   * app.post('/register', async (req, res, next) => {
   *   try {
   *     await dsl.if(d => d.age < 18)
   *       .message('未成年用户不能注册')
   *       .validateAsync(req.body);
   *     // 验证通过，继续处理...
   *   } catch (error) {
   *     next(error);
   *   }
   * });
   */
  async validateAsync(data, options = {}) {
    const Validator = require('./Validator');
    const validator = new Validator(options);
    return validator.validateAsync(this.toSchema(), data, options);
  }

  /**
   * 断言方法 - 同步验证，失败直接抛错
   * @param {*} data - 待验证的数据
   * @param {Object} options - 验证选项（可选）
   * @returns {*} 验证通过返回数据
   * @throws {Error} 验证失败抛出错误
   *
   * @example
   * // 断言验证，失败直接抛错
   * try {
   *   dsl.if(d => d.age < 18)
   *     .message('未成年')
   *     .assert({ age: 16 });
   * } catch (error) {
   *   console.log(error.message);  // "未成年"
   * }
   *
   * @example
   * // 函数中快速断言
   * function registerUser(userData) {
   *   dsl.if(d => d.age < 18)
   *     .message('未成年用户不能注册')
   *     .assert(userData);
   *
   *   // 验证通过，继续处理...
   *   return createUser(userData);
   * }
   */
  assert(data, options = {}) {
    const result = this.validate(data, options);
    if (!result.valid) {
      const error = new Error(result.errors[0].message);
      error.errors = result.errors;
      error.name = 'ValidationError';
      throw error;
    }
    return data;
  }

  /**
   * 快捷检查方法 - 只返回 boolean
   * @param {*} data - 待验证的数据
   * @returns {boolean} 验证是否通过
   *
   * @example
   * // 快速判断
   * const isValid = dsl.if(d => d.age < 18)
   *   .message('未成年')
   *   .check({ age: 16 });
   * // => false
   *
   * @example
   * // 断言场景
   * if (!validator.check(userData)) {
   *   console.log('验证失败');
   * }
   */
  check(data) {
    return this.validate(data).valid;
  }

  /**
   * 静态工厂方法 - dsl.if() 入口
   * @static
   * @param {Function} conditionFn - 条件函数
   * @returns {ConditionalBuilder} 新的构建器实例
   */
  static start(conditionFn) {
    return new ConditionalBuilder().if(conditionFn);
  }
}

module.exports = ConditionalBuilder;

