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

const ErrorCodes = require("./ErrorCodes");
const MessageTemplate = require("./MessageTemplate");
const Locale = require("./Locale");
const patterns = require("../config/patterns");

class DslBuilder {
  /**
   * schema-dsl 自定义验证关键字集合（非 JSON Schema 标准字段）
   *
   * toJsonSchema() 使用此集合过滤非标准字段，确保输出纯净的 JSON Schema。
   * @private
   * @type {Set<string>}
   */
  static _internalKeys = new Set([
    "exactLength",
    "alphanum",
    "lowercase",
    "uppercase",
    "trim",
    "jsonString",
    "port",
    "requiredAll",
    "strictSchema",
    "noSparse",
    "includesRequired",
    "dateFormat",
    "dateGreater",
    "dateLess",
    "precision",
    "multipleOf",
  ]);

  /**
   * 静态属性：存储用户自定义类型（插件注册）
   * @private
   * @type {Map<string, Object|Function>}
   */
  static _customTypes = new Map();

  /**
   * 注册自定义类型（供插件使用）
   * @param {string} name - 类型名称
   * @param {Object|Function} schema - JSON Schema对象 或 生成函数
   * @throws {Error} 类型名称无效时抛出错误
   *
   * @example
   * // 插件中注册自定义类型
   * DslBuilder.registerType('phone-cn', {
   *   type: 'string',
   *   pattern: '^1[3-9]\\d{9}$'
   * });
   *
   * // 在DSL中使用
   * dsl('phone-cn!')  // ✅ 可用
   * dsl('types:string|phone-cn')  // ✅ 可用
   */
  static registerType(name, schema) {
    if (!name || typeof name !== "string") {
      throw new Error("Type name must be a non-empty string");
    }

    if (
      !schema ||
      (typeof schema !== "object" && typeof schema !== "function")
    ) {
      throw new Error("Schema must be an object or function");
    }

    this._customTypes.set(name, schema);
  }

  /**
   * 检查类型是否已注册（内置或自定义）
   * @param {string} type - 类型名称
   * @returns {boolean}
   *
   * @example
   * DslBuilder.hasType('string')  // true (内置)
   * DslBuilder.hasType('phone-cn')  // false (未注册)
   *
   * DslBuilder.registerType('phone-cn', { ... });
   * DslBuilder.hasType('phone-cn')  // true (已注册)
   */
  static hasType(type) {
    // 检查自定义类型
    if (this._customTypes.has(type)) {
      return true;
    }

    // 检查内置类型
    const builtInTypes = [
      "string",
      "number",
      "integer",
      "boolean",
      "object",
      "array",
      "null",
      "email",
      "url",
      "uuid",
      "date",
      "datetime",
      "time",
      "ipv4",
      "ipv6",
      "binary",
      "objectId",
      "hexColor",
      "macAddress",
      "cron",
      "slug",
      "alphanum",
      "lower",
      "upper",
      "json",
      "port",
      "phone",
      "idCard",
      "creditCard",
      "licensePlate",
      "postalCode",
      "passport",
      "any",
    ];

    return builtInTypes.includes(type);
  }

  /**
   * 获取所有已注册的自定义类型
   * @returns {Array<string>}
   */
  static getCustomTypes() {
    return Array.from(this._customTypes.keys());
  }

  /**
   * 清除所有自定义类型（主要用于测试）
   */
  static clearCustomTypes() {
    this._customTypes.clear();
  }

  /**
   * 创建 DslBuilder 实例
   * @param {string} dslString - DSL字符串，如 'string:3-32!' 或 'email!'
   */
  constructor(dslString) {
    if (!dslString || typeof dslString !== "string") {
      throw new Error("DSL string is required");
    }

    // 解析DSL字符串
    const trimmed = dslString.trim();

    // 特殊处理：array!数字 → array:数字 + 必填
    // 例如：array!1-10 → array:1-10!
    let processedDsl = trimmed;
    if (/^array![\d-]/.test(trimmed)) {
      processedDsl = trimmed.replace(/^array!/, "array:") + "!";
    }

    // 🔴 处理必填标记 ! 和可选标记 ?
    // 优先级：! > ?（如果同时存在，! 优先）
    this._required = processedDsl.endsWith("!");
    this._optional = processedDsl.endsWith("?") && !this._required;

    let dslWithoutMarker = processedDsl;
    if (this._required) {
      dslWithoutMarker = processedDsl.slice(0, -1);
    } else if (this._optional) {
      dslWithoutMarker = processedDsl.slice(0, -1);
    }

    // 简单解析为基础Schema（避免循环依赖）
    this._baseSchema = this._parseSimple(dslWithoutMarker);

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
    // 🔴 处理跨类型联合：types:type1|type2|type3
    if (dsl.startsWith("types:")) {
      const typesStr = dsl.substring(6); // 去掉 'types:' 前缀
      const types = typesStr
        .split("|")
        .map((t) => t.trim())
        .filter((t) => t);

      if (types.length === 0) {
        throw new Error("types: requires at least one type");
      }

      if (types.length === 1) {
        // 只有一个类型，直接解析（避免不必要的oneOf）
        return this._parseSimple(types[0]);
      }

      // 多个类型，生成oneOf结构
      return {
        oneOf: types.map((type) => this._parseSimple(type)),
      };
    }

    // 处理数组类型：array:1-10 或 array<string>
    if (dsl.startsWith("array")) {
      const schema = { type: "array" };

      // 匹配：array:min-max<itemType> 或 array:constraint<itemType> 或 array<itemType>
      const arrayMatch = dsl.match(/^array(?::([^<]+?))?(?:<(.+)>)?$/);

      if (arrayMatch) {
        const [, constraint, itemType] = arrayMatch;

        // 解析约束
        if (constraint) {
          const trimmedConstraint = constraint.trim();

          if (trimmedConstraint.includes("-")) {
            // 范围约束: min-max, min-, -max
            const [min, max] = trimmedConstraint
              .split("-")
              .map((v) => v.trim());
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

    // 处理 enum: 前缀的枚举（支持逗号分隔和管道分隔）
    // 例如: enum:a,b,c / enum:admin,user,guest / enum:number:1,2,3 / enum:a|b|c
    if (dsl.startsWith("enum:")) {
      const enumBody = dsl.slice(5); // 'a,b,c' 或 'number:1,2,3' 或 'a|b|c'

      // 检查是否有类型前缀：enum:number:1,2,3
      const colonIdx = enumBody.indexOf(":");
      let enumType = "string";
      let enumValues;

      if (colonIdx !== -1) {
        // enum:type:values
        enumType = enumBody.slice(0, colonIdx);
        enumValues = enumBody.slice(colonIdx + 1);
      } else {
        // enum:values (默认 string)
        enumValues = enumBody;
      }

      // 统一分隔符：逗号 → 管道（_parseEnum 使用管道分隔）
      const normalized = enumValues.includes("|")
        ? enumValues
        : enumValues.replace(/,/g, "|");
      return this._parseEnum(enumType, normalized);
    }

    // 处理简写枚举（管道分隔，无 enum: 前缀）
    // 例如: admin|user|guest / 1|2|3
    if (dsl.includes("|")) {
      let enumType = "string"; // 默认字符串
      let enumValues = dsl;

      if (dsl.includes(":") && !this._isKnownType(dsl.split(":")[0])) {
        // 如果有冒号但不是已知类型（如 string:3-32），不作为枚举
        // 让后续逻辑处理
      } else {
        // 简写形式：value1|value2
        // 自动识别类型
        enumType = this._detectEnumType(enumValues);
      }

      // 如果是枚举，解析值
      if (enumValues.includes("|")) {
        return this._parseEnum(enumType, enumValues);
      }
    }

    // 处理类型:约束格式
    const colonIndex = dsl.indexOf(":");
    let type, constraint;

    if (colonIndex === -1) {
      type = dsl;
      constraint = "";
    } else {
      type = dsl.substring(0, colonIndex);
      constraint = dsl.substring(colonIndex + 1);
    }

    // 特殊处理 phone:country
    if (type === "phone") {
      const country = constraint || "cn";
      const config = patterns.phone[country];
      if (!config) throw new Error(`Unsupported country: ${country}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        minLength: config.min,
        maxLength: config.max,
        _customMessages: { pattern: config.key || config.msg },
      };
    }

    // 特殊处理 idCard:country
    if (type === "idCard") {
      const country = constraint || "cn";
      const config = patterns.idCard[country.toLowerCase()];
      if (!config)
        throw new Error(`Unsupported country for idCard: ${country}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        minLength: config.min,
        maxLength: config.max,
        _customMessages: { pattern: config.key || config.msg },
      };
    }

    // 特殊处理 creditCard:type
    if (type === "creditCard") {
      const cardType = constraint || "visa";
      const config = patterns.creditCard[cardType.toLowerCase()];
      if (!config) throw new Error(`Unsupported credit card type: ${cardType}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        _customMessages: { pattern: config.key || config.msg },
      };
    }

    // 特殊处理 licensePlate:country
    if (type === "licensePlate") {
      const country = constraint || "cn";
      const config = patterns.licensePlate[country.toLowerCase()];
      if (!config)
        throw new Error(`Unsupported country for licensePlate: ${country}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        _customMessages: { pattern: config.key || config.msg },
      };
    }

    // 特殊处理 postalCode:country
    if (type === "postalCode") {
      const country = constraint || "cn";
      const config = patterns.postalCode[country.toLowerCase()];
      if (!config)
        throw new Error(`Unsupported country for postalCode: ${country}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        _customMessages: { pattern: config.key || config.msg },
      };
    }

    // 特殊处理 passport:country
    if (type === "passport") {
      const country = constraint || "cn";
      const config = patterns.passport[country.toLowerCase()];
      if (!config)
        throw new Error(`Unsupported country for passport: ${country}`);
      return {
        type: "string",
        pattern: config.pattern.source,
        _customMessages: { pattern: config.key || config.msg },
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
    // 🔴 优先查询自定义类型（插件注册的）
    if (DslBuilder._customTypes.has(type)) {
      const customSchema = DslBuilder._customTypes.get(type);
      // 如果是函数，调用它生成Schema
      if (typeof customSchema === "function") {
        return customSchema();
      }
      // 否则返回Schema对象的深拷贝（避免污染）
      return JSON.parse(JSON.stringify(customSchema));
    }

    // 🔴 查询内置类型
    const typeMap = {
      string: { type: "string" },
      number: { type: "number" },
      integer: { type: "integer" },
      boolean: { type: "boolean" },
      object: { type: "object" },
      array: { type: "array" },
      null: { type: "null" },
      email: { type: "string", format: "email" },
      url: { type: "string", format: "uri" },
      uuid: { type: "string", format: "uuid" },
      date: { type: "string", format: "date" },
      datetime: { type: "string", format: "date-time" },
      time: { type: "string", format: "time" },
      ipv4: { type: "string", format: "ipv4" },
      ipv6: { type: "string", format: "ipv6" },
      binary: { type: "string", contentEncoding: "base64" },
      objectId: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        _customMessages: { pattern: "pattern.objectId" },
      },
      hexColor: {
        type: "string",
        pattern: "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$",
        _customMessages: { pattern: "pattern.hexColor" },
      },
      macAddress: {
        type: "string",
        pattern: "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$",
        _customMessages: { pattern: "pattern.macAddress" },
      },
      cron: {
        type: "string",
        pattern:
          "^(\\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\\*\\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\\*|([0-9]|1[0-9]|2[0-3])|\\*\\/([0-9]|1[0-9]|2[0-3])) (\\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\\*\\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\\*|([1-9]|1[0-2])|\\*\\/([1-9]|1[0-2])) (\\*|([0-6])|\\*\\/([0-6]))$",
        _customMessages: { pattern: "pattern.cron" },
      },
      slug: {
        type: "string",
        pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        _customMessages: { pattern: "pattern.slug" },
      },
      any: {},
      // v1.0.2 新增类型
      alphanum: { type: "string", alphanum: true },
      lower: { type: "string", lowercase: true },
      upper: { type: "string", uppercase: true },
      json: { type: "string", jsonString: true },
      port: { type: "integer", port: true },
    };

    return typeMap[type] || { type: "string" };
  }

  /**
   * 解析约束
   * @private
   *
   * @example
   * // 比较运算符 (v1.2.0+)
   * _parseConstraint('number', '>0')     // { exclusiveMinimum: 0 }
   * _parseConstraint('number', '>=18')   // { minimum: 18 }
   * _parseConstraint('number', '<100')   // { exclusiveMaximum: 100 }
   * _parseConstraint('number', '<=100')  // { maximum: 100 }
   * _parseConstraint('number', '=100')   // { enum: [100] }
   */
  _parseConstraint(type, constraint) {
    const result = {};

    if (type === "string" || type === "number" || type === "integer") {
      // ========== 比较运算符（v1.1.2新增，仅number/integer，最高优先级）==========
      if (type === "number" || type === "integer") {
        // 1. 大于等于: >=18, >=-10 (支持负数)
        const gteMatch = constraint.match(/^>=(-?\d+(?:\.\d+)?)$/);
        if (gteMatch) {
          result.minimum = parseFloat(gteMatch[1]);
          return result;
        }

        // 2. 小于等于: <=100, <=-10 (支持负数)
        const lteMatch = constraint.match(/^<=(-?\d+(?:\.\d+)?)$/);
        if (lteMatch) {
          result.maximum = parseFloat(lteMatch[1]);
          return result;
        }

        // 3. 大于: >0, >-10 (不包括边界值，支持负数)
        const gtMatch = constraint.match(/^>(-?\d+(?:\.\d+)?)$/);
        if (gtMatch) {
          result.exclusiveMinimum = parseFloat(gtMatch[1]);
          return result;
        }

        // 4. 小于: <100, <-10 (不包括边界值，支持负数)
        const ltMatch = constraint.match(/^<(-?\d+(?:\.\d+)?)$/);
        if (ltMatch) {
          result.exclusiveMaximum = parseFloat(ltMatch[1]);
          return result;
        }

        // 5. 等于: =100, =-10 (支持负数)
        const eqMatch = constraint.match(/^=(-?\d+(?:\.\d+)?)$/);
        if (eqMatch) {
          result.enum = [parseFloat(eqMatch[1])];
          return result;
        }
      }

      // ========== 范围约束: min-max ==========
      if (constraint.includes("-")) {
        const [min, max] = constraint.split("-").map((v) => v.trim());

        if (type === "string") {
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
          if (type === "string") {
            // 🔴 String单值 = 精确长度（常用于验证码、国家代码等）
            result.exactLength = parseInt(value);
          } else {
            // Number单值 = 最大值（符合直觉：不超过某值）
            result.maximum = parseFloat(value);
          }
        }
      }
    }

    return result;
  }

  /**
   * 检查是否为已知类型
   * @private
   */
  _isKnownType(type) {
    const knownTypes = [
      "string",
      "number",
      "integer",
      "boolean",
      "object",
      "array",
      "null",
      "email",
      "url",
      "uuid",
      "date",
      "datetime",
      "time",
      "ipv4",
      "ipv6",
      "binary",
      "objectId",
      "hexColor",
      "macAddress",
      "cron",
      "any",
      "phone",
      "idCard",
      "creditCard",
      "licensePlate",
      "postalCode",
      "passport",
      // v1.0.2 新增
      "alphanum",
      "lower",
      "upper",
      "json",
      "port",
    ];
    return knownTypes.includes(type);
  }

  /**
   * 自动检测枚举类型
   * @private
   */
  _detectEnumType(enumValues) {
    const values = enumValues.split("|").map((v) => v.trim());

    // 检查是否全部为布尔值
    const allBoolean = values.every((v) => v === "true" || v === "false");
    if (allBoolean) return "boolean";

    // 检查是否全部为数字
    const allNumber = values.every((v) => !isNaN(parseFloat(v)) && isFinite(v));
    if (allNumber) return "number";

    // 默认字符串
    return "string";
  }

  /**
   * 解析枚举值
   * @private
   */
  _parseEnum(enumType, enumValues) {
    let values = enumValues.split("|").map((v) => v.trim());

    // 类型转换
    if (enumType === "boolean") {
      values = values.map((v) => {
        if (v === "true") return true;
        if (v === "false") return false;
        throw new Error(
          `Invalid boolean enum value: ${v}. Must be 'true' or 'false'`,
        );
      });
      return { type: "boolean", enum: values };
    } else if (enumType === "number") {
      values = values.map((v) => {
        const num = parseFloat(v);
        if (isNaN(num)) throw new Error(`Invalid number enum value: ${v}`);
        return num;
      });
      return { type: "number", enum: values };
    } else if (enumType === "integer") {
      values = values.map((v) => {
        const num = parseInt(v, 10);
        if (isNaN(num)) throw new Error(`Invalid integer enum value: ${v}`);
        return num;
      });
      return { type: "integer", enum: values };
    } else {
      // 字符串枚举（默认）
      return { type: "string", enum: values };
    }
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
      this._customMessages["string.pattern"] = message;
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
    if (typeof validatorFn !== "function") {
      throw new Error("Custom validator must be a function");
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
   * 输出纯净的 JSON Schema（无内部标记字段）
   *
   * 与 toSchema() 不同，toJsonSchema() 会自动清理所有 schema-dsl 内部标记：
   *   - 下划线前缀字段：_required / _customMessages / _label / _customValidators / _whenConditions
   *   - 自定义验证关键字：exactLength / alphanum / lowercase / uppercase / trim / jsonString /
   *     port / requiredAll / strictSchema / noSparse / includesRequired / dateFormat /
   *     dateGreater / dateLess / precision / multipleOf
   *
   * 返回的对象可直接嵌入 OpenAPI / JSON Schema 等标准文档中，无需下游再做清理。
   *
   * @returns {Object} 纯净的 JSON Schema 对象（符合 JSON Schema 标准）
   *
   * @example
   * const builder = new DslBuilder('string:3-32!');
   * builder.toSchema();     // { type: 'string', minLength: 3, maxLength: 32, _required: true }
   * builder.toJsonSchema(); // { type: 'string', minLength: 3, maxLength: 32 }
   *
   * @example
   * const builder = new DslBuilder('email!');
   * builder.messages({ format: '邮箱格式不正确' });
   * builder.toSchema();     // { type: 'string', format: 'email', _required: true, _customMessages: { format: '...' } }
   * builder.toJsonSchema(); // { type: 'string', format: 'email' }
   *
   * @since v1.2.5
   */
  toJsonSchema() {
    const raw = this.toSchema();
    const cleaned = {};

    for (const key of Object.keys(raw)) {
      // 跳过下划线前缀的内部字段
      if (key.startsWith("_")) continue;

      // 跳过 schema-dsl 自定义验证关键字（非 JSON Schema 标准）
      if (DslBuilder._internalKeys.has(key)) continue;

      cleaned[key] = raw[key];
    }

    return cleaned;
  }

  /**
   * 验证数据
   * @param {*} data - 待验证数据
   * @param {Object} [context] - 验证上下文
   * @returns {Promise<Object>} 验证结果
   */
  async validate(data, context = {}) {
    const Validator = require("./Validator");
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
    let deepestPath = "";

    function traverse(obj, depth = 0, path = "", isRoot = false) {
      // 更新最大深度（仅当节点是容器时，即包含 properties 或 items）
      // 这样叶子节点（如 string 字段）不会增加嵌套深度
      if (!isRoot && (obj.properties || obj.items)) {
        if (depth > maxFound) {
          maxFound = depth;
          deepestPath = path;
        }
      }

      if (obj && typeof obj === "object") {
        if (obj.properties) {
          const nextDepth = depth + 1;
          Object.keys(obj.properties).forEach((key) => {
            traverse(
              obj.properties[key],
              nextDepth,
              `${path}.${key}`.replace(/^\./, ""),
              false,
            );
          });
        }
        if (obj.items) {
          // 数组items不增加深度，或者根据需求增加
          // 这里保持原逻辑：数组本身算一层，items内部继续
          traverse(obj.items, depth, `${path}[]`, false);
        }
      }
    }

    traverse(schema, 0, "", true);

    return {
      valid: maxFound <= maxDepth,
      depth: maxFound,
      path: deepestPath,
      message:
        maxFound > maxDepth
          ? `嵌套深度${maxFound}超过限制${maxDepth}，路径: ${deepestPath}`
          : `嵌套深度${maxFound}符合要求`,
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
  idCard(country = "cn") {
    if (country.toLowerCase() !== "cn") {
      throw new Error(`Unsupported country for idCard: ${country}`);
    }

    // 中国身份证正则 (18位)
    const pattern =
      /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

    // 自动设置长度
    if (!this._baseSchema.minLength) this._baseSchema.minLength = 18;
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 18;

    return this.pattern(pattern).messages({
      pattern: "pattern.idCard.cn",
    });
  }

  /**
   * URL Slug 验证
   * @returns {DslBuilder}
   */
  slug() {
    // 只能包含小写字母、数字和连字符，不能以连字符开头或结尾
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

    return this.pattern(pattern).messages({
      pattern: "pattern.slug",
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
  username(preset = "medium") {
    let minLength,
      maxLength,
      allowUnderscore = true,
      allowNumber = true;

    // 解析预设
    if (typeof preset === "string") {
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
          long: { min: 3, max: 64 },
        };
        const p = presets[preset] || presets.medium;
        minLength = p.min;
        maxLength = p.max;
      }
    }
    // 对象参数
    else if (typeof preset === "object") {
      minLength = preset.minLength || 3;
      maxLength = preset.maxLength || 32;
      allowUnderscore = preset.allowUnderscore !== false;
      allowNumber = preset.allowNumber !== false;
    }

    // 自动设置长度约束（如果未设置）
    if (!this._baseSchema.minLength) this._baseSchema.minLength = minLength;
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = maxLength;

    // 设置正则验证
    let pattern = "^[a-zA-Z]";
    if (allowUnderscore && allowNumber) {
      pattern += "[a-zA-Z0-9_]*$";
    } else if (allowNumber) {
      pattern += "[a-zA-Z0-9]*$";
    } else {
      pattern += "[a-zA-Z]*$";
    }

    return this.pattern(new RegExp(pattern)).messages({
      pattern: "pattern.username",
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
  password(strength = "medium") {
    const patterns = {
      weak: /.{6,}/,
      medium: /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/,
      strong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      veryStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{10,}$/,
    };

    const minLengths = { weak: 6, medium: 8, strong: 8, veryStrong: 10 };

    const pattern = patterns[strength];
    if (!pattern) {
      throw new Error(`Invalid password strength: ${strength}`);
    }

    // 自动设置长度约束
    if (!this._baseSchema.minLength)
      this._baseSchema.minLength = minLengths[strength];
    if (!this._baseSchema.maxLength) this._baseSchema.maxLength = 64;

    return this.pattern(pattern).messages({
      pattern: `pattern.password.${strength}`,
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
  phone(country = "cn") {
    // ✨ 自动纠正类型为 string（手机号不应该是 number）
    if (
      this._baseSchema.type === "number" ||
      this._baseSchema.type === "integer"
    ) {
      this._baseSchema.type = "string";
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

    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * 信用卡验证
   * @param {string} type - 卡类型: visa|mastercard|amex|discover|jcb|unionpay
   * @returns {DslBuilder}
   */
  creditCard(type = "visa") {
    const config = patterns.creditCard[type.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported credit card type: ${type}`);
    }

    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * 车牌号验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  licensePlate(country = "cn") {
    const config = patterns.licensePlate[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for licensePlate: ${country}`);
    }
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * 邮政编码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  postalCode(country = "cn") {
    const config = patterns.postalCode[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for postalCode: ${country}`);
    }
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * 护照号码验证
   * @param {string} country - 国家代码
   * @returns {DslBuilder}
   */
  passport(country = "cn") {
    const config = patterns.passport[country.toLowerCase()];
    if (!config) {
      throw new Error(`Unsupported country for passport: ${country}`);
    }
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  // ========== v1.0.2 新增验证器方法 ==========

  /**
   * String 最小长度（使用AJV原生minLength）
   * @param {number} n - 最小长度
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').min(3)  // 最少3个字符
   */
  min(n) {
    if (this._baseSchema.type !== "string") {
      throw new Error("min() only applies to string type");
    }
    this._baseSchema.minLength = n;
    return this;
  }

  /**
   * String 最大长度（使用AJV原生maxLength）
   * @param {number} n - 最大长度
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').max(32)  // 最多32个字符
   */
  max(n) {
    if (this._baseSchema.type !== "string") {
      throw new Error("max() only applies to string type");
    }
    this._baseSchema.maxLength = n;
    return this;
  }

  /**
   * String 精确长度
   * @param {number} n - 精确长度
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').length(11)  // 必须是11个字符
   */
  length(n) {
    if (this._baseSchema.type !== "string") {
      throw new Error("length() only applies to string type");
    }
    this._baseSchema.exactLength = n;
    return this;
  }

  /**
   * String 只能包含字母和数字
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').alphanum()  // 只能是字母和数字
   */
  alphanum() {
    if (this._baseSchema.type !== "string") {
      throw new Error("alphanum() only applies to string type");
    }
    this._baseSchema.alphanum = true;
    return this;
  }

  /**
   * String 不能包含前后空格
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').trim()  // 不能有前后空格
   */
  trim() {
    if (this._baseSchema.type !== "string") {
      throw new Error("trim() only applies to string type");
    }
    this._baseSchema.trim = true;
    return this;
  }

  /**
   * String 必须是小写
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').lowercase()  // 必须全小写
   */
  lowercase() {
    if (this._baseSchema.type !== "string") {
      throw new Error("lowercase() only applies to string type");
    }
    this._baseSchema.lowercase = true;
    return this;
  }

  /**
   * String 必须是大写
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').uppercase()  // 必须全大写
   */
  uppercase() {
    if (this._baseSchema.type !== "string") {
      throw new Error("uppercase() only applies to string type");
    }
    this._baseSchema.uppercase = true;
    return this;
  }

  /**
   * Number 小数位数限制
   * @param {number} n - 最大小数位数
   * @returns {DslBuilder}
   *
   * @example
   * dsl('number!').precision(2)  // 最多2位小数
   */
  precision(n) {
    if (
      this._baseSchema.type !== "number" &&
      this._baseSchema.type !== "integer"
    ) {
      throw new Error("precision() only applies to number type");
    }
    this._baseSchema.precision = n;
    return this;
  }

  /**
   * Number 倍数验证（使用AJV原生multipleOf）
   * @param {number} n - 必须是此数的倍数
   * @returns {DslBuilder}
   *
   * @example
   * dsl('number!').multiple(5)  // 必须是5的倍数
   */
  multiple(n) {
    if (
      this._baseSchema.type !== "number" &&
      this._baseSchema.type !== "integer"
    ) {
      throw new Error("multiple() only applies to number type");
    }
    this._baseSchema.multipleOf = n;
    return this;
  }

  /**
   * Number 端口号验证（1-65535）
   * @returns {DslBuilder}
   *
   * @example
   * dsl('integer!').port()  // 必须是有效端口号
   */
  port() {
    if (
      this._baseSchema.type !== "number" &&
      this._baseSchema.type !== "integer"
    ) {
      throw new Error("port() only applies to number type");
    }
    this._baseSchema.port = true;
    return this;
  }

  /**
   * Object 要求所有属性都必须存在
   * @returns {DslBuilder}
   *
   * @example
   * dsl({ name: 'string', age: 'number' }).requireAll()
   */
  requireAll() {
    if (this._baseSchema.type !== "object") {
      throw new Error("requireAll() only applies to object type");
    }
    this._baseSchema.requiredAll = true;
    return this;
  }

  /**
   * Object 严格模式，不允许额外属性
   * @returns {DslBuilder}
   *
   * @example
   * dsl({ name: 'string!' }).strict()
   */
  strict() {
    if (this._baseSchema.type !== "object") {
      throw new Error("strict() only applies to object type");
    }
    this._baseSchema.strictSchema = true;
    return this;
  }

  /**
   * Array 不允许稀疏数组
   * @returns {DslBuilder}
   *
   * @example
   * dsl('array<string>').noSparse()
   */
  noSparse() {
    if (this._baseSchema.type !== "array") {
      throw new Error("noSparse() only applies to array type");
    }
    this._baseSchema.noSparse = true;
    return this;
  }

  /**
   * Array 必须包含指定元素
   * @param {Array} items - 必须包含的元素
   * @returns {DslBuilder}
   *
   * @example
   * dsl('array<string>').includesRequired(['admin', 'user'])
   */
  includesRequired(items) {
    if (this._baseSchema.type !== "array") {
      throw new Error("includesRequired() only applies to array type");
    }
    if (!Array.isArray(items)) {
      throw new Error("includesRequired() requires an array parameter");
    }
    this._baseSchema.includesRequired = items;
    return this;
  }

  /**
   * Date 自定义日期格式验证
   * @param {string} fmt - 日期格式（YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY, ISO8601）
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').dateFormat('YYYY-MM-DD')
   */
  dateFormat(fmt) {
    if (this._baseSchema.type !== "string") {
      throw new Error("dateFormat() only applies to string type");
    }
    this._baseSchema.dateFormat = fmt;
    return this;
  }

  /**
   * Date 必须晚于指定日期
   * @param {string} date - 比较日期
   * @returns {DslBuilder}
   *
   * @example
   * dsl('date!').after('2024-01-01')
   */
  after(date) {
    if (this._baseSchema.type !== "string") {
      throw new Error("after() only applies to string type");
    }
    this._baseSchema.dateGreater = date;
    return this;
  }

  /**
   * Date 必须早于指定日期
   * @param {string} date - 比较日期
   * @returns {DslBuilder}
   *
   * @example
   * dsl('date!').before('2025-12-31')
   */
  before(date) {
    if (this._baseSchema.type !== "string") {
      throw new Error("before() only applies to string type");
    }
    this._baseSchema.dateLess = date;
    return this;
  }

  /**
   * Pattern 域名验证
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').domain()
   */
  domain() {
    if (this._baseSchema.type !== "string") {
      throw new Error("domain() only applies to string type");
    }
    const config = patterns.common.domain;
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * Pattern IP地址验证（IPv4或IPv6）
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').ip()
   */
  ip() {
    if (this._baseSchema.type !== "string") {
      throw new Error("ip() only applies to string type");
    }
    const config = patterns.common.ip;
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * Pattern Base64编码验证
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').base64()
   */
  base64() {
    if (this._baseSchema.type !== "string") {
      throw new Error("base64() only applies to string type");
    }
    const config = patterns.common.base64;
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * Pattern JWT令牌验证
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').jwt()
   */
  jwt() {
    if (this._baseSchema.type !== "string") {
      throw new Error("jwt() only applies to string type");
    }
    const config = patterns.common.jwt;
    return this.pattern(config.pattern).messages({ pattern: config.key });
  }

  /**
   * Pattern JSON字符串验证
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').json()
   */
  json() {
    if (this._baseSchema.type !== "string") {
      throw new Error("json() only applies to string type");
    }
    this._baseSchema.jsonString = true;
    return this;
  }

  /**
   * Pattern URL slug验证 (v1.0.3)
   * URL slug只能包含小写字母、数字和连字符
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').slug()  // my-blog-post, hello-world-123
   */
  slug() {
    if (this._baseSchema.type !== "string") {
      throw new Error("slug() only applies to string type");
    }
    this._baseSchema.pattern = "^[a-z0-9]+(?:-[a-z0-9]+)*$";
    this._baseSchema._customMessages = this._baseSchema._customMessages || {};
    this._baseSchema._customMessages["pattern"] = "pattern.slug";
    return this;
  }

  /**
   * 日期大于验证 (v1.0.2)
   * @param {string} date - 对比日期
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').dateGreater('2025-01-01')
   */
  dateGreater(date) {
    this._baseSchema.dateGreater = date;
    return this;
  }

  /**
   * 日期小于验证 (v1.0.2)
   * @param {string} date - 对比日期
   * @returns {DslBuilder}
   *
   * @example
   * dsl('string!').dateLess('2025-12-31')
   */
  dateLess(date) {
    this._baseSchema.dateLess = date;
    return this;
  }
}

module.exports = DslBuilder;
