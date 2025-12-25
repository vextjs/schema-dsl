/**
 * DSL Builder - 统一的Schema构建器
 *
 * 支持链式调用扩展DSL功能
 *
 * @module lib/core/DslBuilder
 * @version 2.0.0
 *
 * @example
 * // 简单使用
 * const schema = dsl('email!');
 *
 * // 链式扩展
 * const schema = dsl('email!')
 *   .pattern(/custom/)
 *   .messages({ 'string.pattern': '格式不正确' })
 *   .label('邮箱地址');
 */

const ErrorCodes = require('./ErrorCodes');
const MessageTemplate = require('./MessageTemplate');
const Locale = require('./Locale');
const patterns = require('../config/patterns');

class DslBuilder {
  /**
   * 创建 DslBuilder 实例
   * @param {string} dslString - DSL字符串，如 'string:3-32!' 或 'email!'
   */
  constructor(dslString) {
    if (!dslString || typeof dslString !== 'string') {
      throw new Error('DSL string is required');
    }

    // 解析DSL字符串
    const trimmed = dslString.trim();

    // 特殊处理：array!数字 → array:数字 + 必填
    // 例如：array!1-10 → array:1-10!
    let processedDsl = trimmed;
    if (/^array![\d-]/.test(trimmed)) {
      processedDsl = trimmed.replace(/^array!/, 'array:') + '!';
    }

    this._required = processedDsl.endsWith('!');
    const dslWithoutRequired = this._required ? processedDsl.slice(0, -1) : processedDsl;

    // 简单解析为基础Schema（避免循环依赖）
    this._baseSchema = this._parseSimple(dslWithoutRequired);

    // 扩展属性
    this._customMessages = {};
    this._label = null;
    this._customValidators = [];
    this._description = null;
    this._whenConditions = [];
  }

  /**
   * 简单解析DSL字符串（避免循环依赖）
   * @private
   * @param {string} dsl - DSL字符串（不含!）
   * @returns {Object} JSON Schema对象
   */
  _parseSimple(dsl) {
    // 处理数组类型：array:1-10 或 array<string>
    if (dsl.startsWith('array')) {
      const schema = { type: 'array' };

      // 匹配：array:min-max<itemType> 或 array:constraint<itemType> 或 array<itemType>
      const arrayMatch = dsl.match(/^array(?::([^<]+?))?(?:<(.+)>)?$/);

      if (arrayMatch) {
        const [, constraint, itemType] = arrayMatch;

        // 解析约束
        if (constraint) {
          const trimmedConstraint = constraint.trim();

          if (trimmedConstraint.includes('-')) {
            // 范围约束: min-max, min-, -max
            const [min, max] = trimmedConstraint.split('-').map(v => v.trim());
            if (min) schema.minItems = parseInt(min, 10);
            if (max) schema.maxItems = parseInt(max, 10);
          } else {
            // 单个值 = 最大值
            schema.maxItems = parseInt(trimmedConstraint, 10);
          }
        }

        // 解析元素类型
        if (itemType) {
          schema.items = this._parseSimple(itemType.trim());
        }

        return schema;
      }
    }

    // 处理枚举
    if (dsl.includes('|') && !dsl.includes(':')) {
      return {
        type: 'string',
        enum: dsl.split('|').map(v => v.trim())
      };
    }

    // 处理类型:约束格式
    const colonIndex = dsl.indexOf(':');
    let type, constraint;

    if (colonIndex === -1) {
      type = dsl;
      constraint = '';
    } else {
      type = dsl.substring(0, colonIndex);
      constraint = dsl.substring(colonIndex + 1);
    }

    // 特殊处理 phone:country
    if (type === 'phone') {
      const country = constraint || 'cn';
      const config = patterns.phone[country];
      if (!config) throw new Error(`Unsupported country: ${country}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        minLength: config.min,
        maxLength: config.max,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 特殊处理 idCard:country
    if (type === 'idCard') {
      const country = constraint || 'cn';
      const config = patterns.idCard[country.toLowerCase()];
      if (!config) throw new Error(`Unsupported country for idCard: ${country}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        minLength: config.min,
        maxLength: config.max,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 特殊处理 creditCard:type
    if (type === 'creditCard') {
      const cardType = constraint || 'visa';
      const config = patterns.creditCard[cardType.toLowerCase()];
      if (!config) throw new Error(`Unsupported credit card type: ${cardType}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 特殊处理 licensePlate:country
    if (type === 'licensePlate') {
      const country = constraint || 'cn';
      const config = patterns.licensePlate[country.toLowerCase()];
      if (!config) throw new Error(`Unsupported country for licensePlate: ${country}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 特殊处理 postalCode:country
    if (type === 'postalCode') {
      const country = constraint || 'cn';
      const config = patterns.postalCode[country.toLowerCase()];
      if (!config) throw new Error(`Unsupported country for postalCode: ${country}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 特殊处理 passport:country
    if (type === 'passport') {
      const country = constraint || 'cn';
      const config = patterns.passport[country.toLowerCase()];
      if (!config) throw new Error(`Unsupported country for passport: ${country}`);
      return {
        type: 'string',
        pattern: config.pattern.source,
        _customMessages: { 'pattern': config.key || config.msg }
      };
    }

    // 获取基础类型
    const schema = this._getBaseType(type);

    // 处理约束
    if (constraint) {
      Object.assign(schema, this._parseConstraint(schema.type, constraint));
    }

    return schema;
  }

  /**
   * 获取基础类型Schema
   * @private
   */
  _getBaseType(type) {
    const typeMap = {
      'string': { type: 'string' },
      'number': { type: 'number' },
      'integer': { type: 'integer' },
      'boolean': { type: 'boolean' },
      'object': { type: 'object' },
      'array': { type: 'array' },
      'null': { type: 'null' },
      'email': { type: 'string', format: 'email' },
      'url': { type: 'string', format: 'uri' },
      'uuid': { type: 'string', format: 'uuid' },
      'date': { type: 'string', format: 'date' },
      'datetime': { type: 'string', format: 'date-time' },
      'time': { type: 'string', format: 'time' },
      'ipv4': { type: 'string', format: 'ipv4' },
      'ipv6': { type: 'string', format: 'ipv6' },
      'binary': { type: 'string', contentEncoding: 'base64' },
      'objectId': { type: 'string', pattern: '^[0-9a-fA-F]{24}$', _customMessages: { 'pattern': 'pattern.objectId' } },
      'hexColor': { type: 'string', pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$', _customMessages: { 'pattern': 'pattern.hexColor' } },
      'macAddress': { type: 'string', pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', _customMessages: { 'pattern': 'pattern.macAddress' } },
      'cron': { type: 'string', pattern: '^(\\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\\*\\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\\*|([0-9]|1[0-9]|2[0-3])|\\*\\/([0-9]|1[0-9]|2[0-3])) (\\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\\*\\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\\*|([1-9]|1[0-2])|\\*\\/([1-9]|1[0-2])) (\\*|([0-6])|\\*\\/([0-6]))$', _customMessages: { 'pattern': 'pattern.cron' } },
      'any': {}
    };

    return typeMap[type] || { type: 'string' };
  }

  /**
   * 解析约束
   * @private
   */
  _parseConstraint(type, constraint) {
    const result = {};

    if (type === 'string' || type === 'number' || type === 'integer') {
      // 范围约束: min-max
      if (constraint.includes('-')) {
        const [min, max] = constraint.split('-').map(v => v.trim());

        if (type === 'string') {
          if (min) result.minLength = parseInt(min);
          if (max) result.maxLength = parseInt(max);
        } else {
          if (min) result.minimum = parseFloat(min);
          if (max) result.maximum = parseFloat(max);
        }
      } else {
        // 单个值
        const value = constraint.trim();
        if (value) {
          if (type === 'string') {
            result.maxLength = parseInt(value);
          } else {
            result.maximum = parseFloat(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * 添加正则表达式验证
   * @param {RegExp|string} regex - 正则表达式
   * @param {string} [message] - 自定义错误消息
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!')
   *   .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
   */
  pattern(regex, message) {
    this._baseSchema.pattern = regex instanceof RegExp ? regex.source : regex;

    if (message) {
      this._customMessages['string.pattern'] = message;
    }

    return this;
  }

  /**
   * 自定义错误消息
   * @param {Object} messages - 错误消息对象
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!')
   *   .messages({
   *     'string.min': '至少{{#limit}}个字符',
   *     'string.max': '最多{{#limit}}个字符'
   *   })
   */
  messages(messages) {
    Object.assign(this._customMessages, messages);
    return this;
  }

  /**
   * 设置字段标签（用于错误消息）
   * @param {string} labelText - 标签文本
   * @returns {DslBuilder}
   *
   * @example
   * dsl('email!').label('邮箱地址')
   */
  label(labelText) {
    this._label = labelText;
    return this;
  }

  /**
   * 添加自定义验证器
   * @param {Function} validatorFn - 验证函数
   * @returns {DslBuilder}
   *
   * 支持多种返回方式：
   * 1. 不返回/返回 undefined → 验证通过
   * 2. 返回 true → 验证通过
   * 3. 返回 false → 验证失败（使用默认消息）
   * 4. 返回字符串 → 验证失败（字符串作为错误消息）
   * 5. 返回对象 { error, message } → 验证失败（自定义错误）
   * 6. 抛出异常 → 验证失败（异常消息作为错误）
   *
   * @example
   * // 方式1: 不返回任何值（推荐）
   * .custom(async (value) => {
   *   const exists = await checkEmailExists(value);
   *   if (exists) return '邮箱已被占用';
   * })
   *
   * // 方式2: 返回错误消息字符串
   * .custom((value) => {
   *   if (value.includes('admin')) return '不能包含敏感词';
   * })
   *
   * // 方式3: 返回错误对象
   * .custom(async (value) => {
   *   const exists = await checkExists(value);
   *   if (exists) {
   *     return { error: 'email.exists', message: '邮箱已被占用' };
   *   }
   * })
   *
   * // 方式4: 抛出异常
   * .custom(async (value) => {
   *   const user = await findUser(value);
   *   if (!user) throw new Error('用户不存在');
   * })
   */
  custom(validatorFn) {
    if (typeof validatorFn !== 'function') {
      throw new Error('Custom validator must be a function');
    }
    this._customValidators.push(validatorFn);
    return this;
  }

  /**
   * 设置描述
   * @param {string} text - 描述文本
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string:3-32!').description('用户登录名')
   */
  description(text) {
    this._description = text;
    return this;
  }


  /**
   * 设置默认值
   * @param {*} value - 默认值
   * @returns {DslBuilder}
   */
  default(value) {
    this._baseSchema.default = value;
    return this;
  }

  /**
   * 转换为 JSON Schema
   * @returns {Object} JSON Schema对象
   */
  toSchema() {
    const schema = { ...this._baseSchema };

    // 添加描述
    if (this._description) {
      schema.description = this._description;
    }

    // 添加自定义消息
    if (Object.keys(this._customMessages).length > 0) {
      schema._customMessages = this._customMessages;
    }

    // 添加标签
    if (this._label) {
      schema._label = this._label;
    }

    // 添加自定义验证器
    if (this._customValidators.length > 0) {
      schema._customValidators = this._customValidators;
    }

    // 添加when条件
    if (this._whenConditions.length > 0) {
      schema._whenConditions = this._whenConditions;
    }

    // 添加必填标记
    schema._required = this._required;

    return schema;
  }

  /**
   * 验证数据
   * @param {*} data - 待验证数据
   * @param {Object} [context] - 验证上下文
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, context = {}) {
    const Validator = require('./Validator');
    const validator = new Validator();
    const schema = this.toSchema();


    return validator.validate(schema, data);
  }

  /**
   * 验证Schema嵌套深度
   * @static
   * @param {Object} schema - Schema对象
   * @param {number} maxDepth - 最大深度（默认3）
   * @returns {Object} { valid, depth, path, message }
   */
  static validateNestingDepth(schema, maxDepth = 3) {
    let maxFound = 0;
    let deepestPath = '';

    function traverse(obj, depth = 0, path = '', isRoot = false) {
      // 更新最大深度（仅当节点是容器时，即包含 properties 或 items）
      // 这样叶子节点（如 string 字段）不会增加嵌套深度
      if (!isRoot && (obj.properties || obj.items)) {
        if (depth > maxFound) {
          maxFound = depth;
          deepestPath = path;
        }
      }

      if (obj && typeof obj === 'object') {
        if (obj.properties) {
          const nextDepth = depth + 1;
          Object.keys(obj.properties).forEach(key => {
            traverse(obj.properties[key], nextDepth, `${path}.${key}`.replace(/^\./, ''), false);
          });
        }
        if (obj.items) {
          // 数组items不增加深度，或者根据需求增加
          // 这里保持原逻辑：数组本身算一层，items内部继续
          traverse(obj.items, depth, `${path}[]`, false);
        }
      }
    }

    traverse(schema, 0, '', true);

    return {
      valid: maxFound <= maxDepth,
      depth: maxFound,
      path: deepestPath,
      message: maxFound > maxDepth
        ? `嵌套深度${maxFound}超过限制${maxDepth}，路径: ${deepestPath}`
        : `嵌套深度${maxFound}符合要求`
    };
  }

  // ========== 默认验证方法 ==========

  /**
   * 设置格式
   * @param {string} format - 格式名称 (email, url, uuid, etc.)
   * @returns {DslBuilder}
   */
  format(format) {
    this._baseSchema.format = format;
    return this;
  }

  /**
   * 手机号别名
   * @param {string} country
   * @returns {DslBuilder}
   */
  phoneNumber(country) {
    return this.phone(country);
  }

  /**
   * 身份证验证
   * @param {string} country - 国家代码 (目前仅支持 'cn')
   * @returns {DslBuilder}
   */
  idCard(country = 'cn') {
    if (country.toLowerCase() !== 'cn') {
      throw new Error(`Unsupported country for idCard: ${country}`);
    }

    // 中国身份证正则 (18位)
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

    // 自动设置长度
    if (!this._baseSchema.minLength) this._baseSchema.minLength = 18;
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 18;

    return this.pattern(pattern)
      .messages({
        'pattern': 'pattern.idCard.cn'
      });
  }

  /**
   * URL Slug 验证
   * @returns {DslBuilder}
   */
  slug() {
    // 只能包含小写字母、数字和连字符，不能以连字符开头或结尾
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    return this.pattern(pattern)
      .messages({
        'pattern': 'pattern.slug'
      });
  }

  /**
   * 用户名验证（自动设置合理约束）
   * @param {string|Object} preset - 预设长度或选项
   *   - '5-20' → 长度5-20
   *   - 'short' → 3-16（短用户名）
   *   - 'medium' → 3-32（中等，默认）
   *   - 'long' → 3-64（长用户名）
   *   - { minLength, maxLength, allowUnderscore, allowNumber }
   * @returns {DslBuilder}
   *
   * @example
   * // 简洁写法（推荐）
   * username: 'string!'.username()              // 自动3-32
   * username: 'string!'.username('5-20')        // 长度5-20
   * username: 'string!'.username('short')       // 短用户名3-16
   * username: 'string!'.username('long')        // 长用户名3-64
   */
  username(preset = 'medium') {
    let minLength, maxLength, allowUnderscore = true, allowNumber = true;

    // 解析预设
    if (typeof preset === 'string') {
      // 字符串范围格式：'5-20'
      const rangeMatch = preset.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        minLength = parseInt(rangeMatch[1], 10);
        maxLength = parseInt(rangeMatch[2], 10);
      }
      // 预设枚举
      else {
        const presets = {
          short: { min: 3, max: 16 },
          medium: { min: 3, max: 32 },
          long: { min: 3, max: 64 }
        };
        const p = presets[preset] || presets.medium;
        minLength = p.min;
        maxLength = p.max;
      }
    }
    // 对象参数
    else if (typeof preset === 'object') {
      minLength = preset.minLength || 3;
      maxLength = preset.maxLength || 32;
      allowUnderscore = preset.allowUnderscore !== false;
      allowNumber = preset.allowNumber !== false;
    }

    // 自动设置长度约束（如果未设置）
    if (!this._baseSchema.minLength) this._baseSchema.minLength = minLength;
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = maxLength;

    // 设置正则验证
    let pattern = '^[a-zA-Z]';
    if (allowUnderscore && allowNumber) {
      pattern += '[a-zA-Z0-9_]*$';
    } else if (allowNumber) {
      pattern += '[a-zA-Z0-9]*$';
    } else {
      pattern += '[a-zA-Z]*$';
    }

    return this.pattern(new RegExp(pattern))
      .messages({
        'pattern': 'pattern.username'
      });
  }

  /**
   * 密码强度验证（自动设置合理约束）
   * @param {string} strength - 强度级别
   * @returns {DslBuilder}
   *
   * @example
   * password: 'string!'.password('strong')  // 自动设置8-64长度
   */
  password(strength = 'medium') {
    const patterns = {
      weak: /.{6,}/,
      medium: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
      strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      veryStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/
    };

    const minLengths = { weak: 6, medium: 8, strong: 8, veryStrong: 10 };

    const pattern = patterns[strength];
    if (!pattern) {
      throw new Error(`Invalid password strength: ${strength}`);
    }

    // 自动设置长度约束
    if (!this._baseSchema.minLength) this._baseSchema.minLength = minLengths[strength];
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 64;

    return this.pattern(pattern)
      .messages({
        'pattern': `pattern.password.${strength}`
      });
  }

  /**
   * 手机号验证（自动设置合理约束）
   * @param {string} country - 国家代码: cn|us|uk|hk|tw|international
   * @returns {DslBuilder}
   *
   * @example
   * phone: 'string!'.phone('cn')      // ✅ 推荐
   * phone: 'number!'.phone('cn')      // ✅ 自动纠正为 string
   */
  phone(country = 'cn') {
    // ✨ 自动纠正类型为 string（手机号不应该是 number）
    if (this._baseSchema.type === 'number' || this._baseSchema.type === 'integer') {
      this._baseSchema.type = 'string';
      // 清理 number 类型的属性
      delete this._baseSchema.minimum;
      delete this._baseSchema.maximum;
    }

    const config = patterns.phone[country];
    if (!config) {
      throw new Error(`Unsupported country: ${country}`);
    }

    // 自动设置长度约束
    if (!this._baseSchema.minLength) this._baseSchema.minLength = config.min;
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = config.max;

    return this.pattern(config.pattern).messages({ 'pattern': config.key });
  }

  /**
   * 信用卡验证
   * @param {string} type - 卡类型: visa|mastercard|amex|discover|jcb|unionpay
   * @returns {DslBuilder}
   */
  creditCard(type = 'visa') {
    const config = patterns.creditCard[type.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported credit card type: ${type}`);
    }

    return this.pattern(config.pattern).messages({ 'pattern': config.key });
  }

  /**
   * 车牌号验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  licensePlate(country = 'cn') {
    const config = patterns.licensePlate[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for licensePlate: ${country}`);
    }
    return this.pattern(config.pattern).messages({ 'pattern': config.key });
  }

  /**
   * 邮政编码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  postalCode(country = 'cn') {
    const config = patterns.postalCode[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for postalCode: ${country}`);
    }
    return this.pattern(config.pattern).messages({ 'pattern': config.key });
  }

  /**
   * 护照号码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  passport(country = 'cn') {
    const config = patterns.passport[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for passport: ${country}`);
    }
    return this.pattern(config.pattern).messages({ 'pattern': config.key });
  }
}

module.exports = DslBuilder;

