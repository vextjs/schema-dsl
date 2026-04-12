// Type definitions for schema-dsl v1.1.8
// Project: https://github.com/vextjs/schema-dsl
// Definitions by: schema-dsl Team

// ========== 核心类型 ==========

/**
 * 错误消息配置（字符串或对象）
 *
 * @description v1.1.5 新增：支持对象格式配置错误代码和消息
 *
 * @example 字符串格式（向后兼容）
 * ```typescript
 * const messages = {
 *   'user.notFound': '用户不存在'
 * };
 * ```
 *
 * @example 对象格式（v1.1.5 新增）
 * ```typescript
 * const messages = {
 *   'account.notFound': {
 *     code: 'ACCOUNT_NOT_FOUND',
 *     message: '账户不存在'
 *   }
 * };
 * ```
 *
 * @since v1.1.5
 */
export type ErrorMessageConfig =
  | string // 向后兼容：'账户不存在'
  | {
      // 新格式：{ code, message }
      /** 错误代码（可选，默认使用 key） */
      code?: string;
      /** 错误消息（必需） */
      message: string;
    };

/**
 * 语言包定义
 *
 * @description 语言包对象，key 为错误代码，value 为错误消息配置
 *
 * @example
 * ```typescript
 * const zhCN: LocaleMessages = {
 *   'user.notFound': '用户不存在',
 *   'account.notFound': {
 *     code: 'ACCOUNT_NOT_FOUND',
 *     message: '账户不存在'
 *   }
 * };
 * ```
 *
 * @since v1.1.5
 */
export interface LocaleMessages {
  [key: string]: ErrorMessageConfig;
}

/**
 * JSON Schema 对象
 *
 * @description JSON Schema draft-07 规范的类型定义
 * @see https://json-schema.org/draft-07/schema
 *
 * @example
 * ```typescript
 * const schema: JSONSchema = {
 *   type: 'object',
 *   properties: {
 *     username: { type: 'string', minLength: 3, maxLength: 32 },
 *     email: { type: 'string', format: 'email' }
 *   },
 *   required: ['username', 'email']
 * };
 * ```
 */
export interface JSONSchema {
  /** 数据类型 */
  type?: string | string[];
  /** 对象属性定义 */
  properties?: Record<string, JSONSchema>;
  /** 必填字段列表 */
  required?: string[];
  /** 字符串/数组最小长度 */
  minLength?: number;
  /** 字符串/数组最大长度 */
  maxLength?: number;
  /** 数字最小值 */
  minimum?: number;
  /** 数字最大值 */
  maximum?: number;
  /** 正则表达式验证 */
  pattern?: string;
  /** 格式验证（email, url, date等） */
  format?: string;
  /** 枚举值 */
  enum?: any[];
  /** 数组项定义 */
  items?: JSONSchema;
  /** 字段标题 */
  title?: string;
  /** 字段描述 */
  description?: string;
  /** 默认值 */
  default?: any;
  /** 示例值 */
  examples?: any[];
  /** 扩展字段 */
  [key: string]: any;
}

/**
 * 验证结果
 *
 * @description validate()方法的返回值类型
 *
 * @example
 * ```typescript
 * const result: ValidationResult = schema.validate({ username: 'test' });
 *
 * if (result.valid) {
 *   console.log('验证通过', result.data);
 * } else {
 *   console.log('验证失败', result.errors);
 * }
 * ```
 */
export interface ValidationResult<T = any> {
  /** 是否验证通过 */
  valid: boolean;
  /** 验证错误列表（仅在valid=false时存在） */
  errors?: ValidationError[];
  /** 验证后的数据（仅在valid=true时存在） */
  data?: T;
}

/**
 * 验证错误
 *
 * @description 详细的验证错误信息
 *
 * @example
 * ```typescript
 * const error: ValidationError = {
 *   message: '用户名至少需要 3 个字符',
 *   path: 'username',
 *   keyword: 'minLength',
 *   params: { limit: 3 }
 * };
 * ```
 */
export interface ValidationError {
  /** 错误消息 */
  message: string;
  /** 错误字段路径（使用点号分隔） */
  path: string;
  /** 验证关键字（min, max, email等） */
  keyword: string;
  /** 验证参数 */
  params?: Record<string, any>;
  /** 错误字段（别名，同path） */
  field?: string;
}

/**
 * 验证选项
 *
 * @description validate() 和 Validator.validate() 的配置选项
 *
 * @example
 * ```typescript
 * const options: ValidateOptions = {
 *   format: true,
 *   locale: 'zh-CN',
 *   messages: {
 *     min: '至少需要 {{#limit}} 个字符'
 *   }
 * };
 *
 * const result = validate(schema, data, options);
 * ```
 */
export interface ValidateOptions {
  /** 是否格式化错误（默认true） */
  format?: boolean;
  /** 动态指定语言（如 'zh-CN', 'en-US', 'ja-JP', 'es-ES', 'fr-FR'） */
  locale?: string;
  /** 自定义错误消息 */
  messages?: ErrorMessages;
  /** 扩展选项 */
  [key: string]: any;
}

/**
 * 错误消息对象
 *
 * @description 自定义错误消息的配置对象
 *
 * @example
 * ```typescript
 * const messages: ErrorMessages = {
 *   min: '至少需要 {{#limit}} 个字符',
 *   max: '最多 {{#limit}} 个字符',
 *   email: '邮箱格式不正确',
 *   required: '这是必填项'
 * };
 *
 * const schema = dsl({ email: 'email!' }, { messages });
 * ```
 */
export interface ErrorMessages {
  /** 最小长度/最小值错误 (v1.0.3+: 推荐使用min代替minLength) */
  min?: string;
  /** 最大长度/最大值错误 (v1.0.3+: 推荐使用max代替maxLength) */
  max?: string;
  /** 最小长度错误 (向后兼容，推荐使用min) */
  minLength?: string;
  /** 最大长度错误 (向后兼容，推荐使用max) */
  maxLength?: string;
  /** 最小值错误 (向后兼容，推荐使用min) */
  minimum?: string;
  /** 最大值错误 (向后兼容，推荐使用max) */
  maximum?: string;
  /** 数组最小长度错误 (向后兼容，推荐使用min) */
  minItems?: string;
  /** 数组最大长度错误 (向后兼容，推荐使用max) */
  maxItems?: string;
  /** 正则表达式验证错误 */
  pattern?: string;
  /** 格式验证错误 */
  format?: string;
  /** 枚举值验证错误 */
  enum?: string;
  /** 邮箱格式错误 */
  email?: string;
  /** URL格式错误 */
  url?: string;
  /** 必填项错误 */
  required?: string;
  /** 类型错误 */
  type?: string;
  /** 自定义错误消息 */
  [key: string]: string | undefined;
}

// ========== DslBuilder 类 ==========

/**
 * DSL Builder 类
 *
 * @description 提供链式API来构建Schema定义
 *
 * @example
 * ```typescript
 * // 基础用法
 * const builder = new DslBuilder('email!');
 * builder.pattern(/custom/).label('邮箱地址');
 *
 * // 链式调用
 * const schema = new DslBuilder('string:3-32!')
 *   .pattern(/^[a-zA-Z0-9_]+$/, '只能包含字母、数字和下划线')
 *   .label('用户名')
 *   .messages({
 *     min: '至少3个字符',
 *     max: '最多32个字符'
 *   })
 *   .toSchema();
 * ```
 */
export class DslBuilder {
  /**
   * 转为纯净 JSON Schema（无内部标记）
   *
   * 与 toSchema() 不同，toJsonSchema() 会自动清理 schema-dsl 内部标记字段
   * （_required、_customMessages、_label、_customValidators、_whenConditions 等下划线前缀字段）
   * 以及非标准验证关键字（exactLength、alphanum、lowercase 等），
   * 返回符合 JSON Schema 标准的纯净对象。
   *
   * 适用场景：
   *   - 生成 OpenAPI 文档（无需下游手动清理）
   *   - 导出给外部系统消费
   *   - 任何需要标准 JSON Schema 的场景
   *
   * @returns 纯净的 JSON Schema 对象（无内部标记）
   * @since v1.2.5
   *
   * @example
   * ```typescript
   * const builder = dsl('string:1-50!');
   * const schema = builder.toJsonSchema();
   * // { type: 'string', minLength: 1, maxLength: 50 }
   * // 注意：不含 _required、_customMessages 等内部字段
   *
   * const enumBuilder = dsl('enum:admin,user,guest!');
   * const enumSchema = enumBuilder.toJsonSchema();
   * // { type: 'string', enum: ['admin', 'user', 'guest'] }
   * ```
   */
  toJsonSchema(): JSONSchema;

  /**
   * 注册自定义类型（供插件使用）
   * @param name - 类型名称
   * @param schema - JSON Schema对象或生成函数
   * @static
   * @since v1.1.0
   *
   * @example
   * ```typescript
   * // 注册自定义类型
   * DslBuilder.registerType('phone-cn', {
   *   type: 'string',
   *   pattern: '^1[3-9]\\d{9}$',
   *   minLength: 11,
   *   maxLength: 11
   * });
   *
   * // 在DSL中使用
   * const schema = dsl({ phone: 'phone-cn!' });
   * const schema2 = dsl({ contact: 'types:email|phone-cn' });
   * ```
   */
  static registerType(
    name: string,
    schema: JSONSchema | (() => JSONSchema),
  ): void;

  /**
   * 检查类型是否已注册
   * @param type - 类型名称
   * @returns 是否已注册
   * @static
   * @since v1.1.0
   *
   * @example
   * ```typescript
   * DslBuilder.hasType('string');     // true (内置)
   * DslBuilder.hasType('phone-cn');   // false (未注册)
   * DslBuilder.registerType('phone-cn', { ... });
   * DslBuilder.hasType('phone-cn');   // true (已注册)
   * ```
   */
  static hasType(type: string): boolean;

  /**
   * 获取所有已注册的自定义类型
   * @returns 自定义类型名称数组
   * @static
   * @since v1.1.0
   *
   * @example
   * ```typescript
   * const types = DslBuilder.getCustomTypes();
   * console.log(types); // ['phone-cn', 'order-id', ...]
   * ```
   */
  static getCustomTypes(): string[];

  /**
   * 清除所有自定义类型（主要用于测试）
   * @static
   * @since v1.1.0
   *
   * @example
   * ```typescript
   * DslBuilder.clearCustomTypes();
   * ```
   */
  static clearCustomTypes(): void;

  /**
   * 构造函数
   * @param dslString - DSL字符串（如 'email!', 'string:3-32!', 'string?', 'types:string|number'）
   *
   * @example 基础类型
   * ```typescript
   * const builder = new DslBuilder('email!');      // 必填邮箱
   * const builder2 = new DslBuilder('string:3-32'); // 可选字符串（默认）
   * const builder3 = new DslBuilder('string?');     // 显式可选字符串
   * const builder4 = new DslBuilder('email?');      // 显式可选邮箱
   * const builder5 = new DslBuilder('types:string|number'); // 联合类型
   * ```
   *
   * @example 必填与可选标记
   * ```typescript
   * new DslBuilder('string!')      // 必填字符串
   * new DslBuilder('string')       // 可选字符串（默认）
   * new DslBuilder('string?')      // 显式可选字符串
   * new DslBuilder('email?')       // 可选邮箱
   * new DslBuilder('string:3-32?') // 可选字符串，长度3-32
   * ```
   *
   * @example 数字类型比较运算符 (v1.1.2+)
   * ```typescript
   * // 范围约束（包括边界值）
   * new DslBuilder('number:0-100')     // 0 <= x <= 100
   * new DslBuilder('number:18-')       // x >= 18
   * new DslBuilder('number:-100')      // x <= 100
   * new DslBuilder('number:100')       // x <= 100
   *
   * // 比较运算符（v1.1.2新增）
   * new DslBuilder('number:>0')        // x > 0 (不包括0)
   * new DslBuilder('number:>=18')      // x >= 18
   * new DslBuilder('number:<100')      // x < 100 (不包括100)
   * new DslBuilder('number:<=100')     // x <= 100
   * new DslBuilder('number:=100')      // x = 100 (精确等于)
   *
   * // 支持小数和负数
   * new DslBuilder('number:>0.5')      // x > 0.5
   * new DslBuilder('number:>-10')      // x > -10
   * new DslBuilder('number:<=99.99')   // x <= 99.99
   *
   * // 配合必填标记
   * new DslBuilder('number:>=18!')     // 必填且 >= 18
   * new DslBuilder('number:>0!')       // 必填且 > 0
   * new DslBuilder('number:>0?')       // 可选且 > 0（当有值时）
   * ```
   */
  constructor(dslString: string);

  /**
   * 添加正则验证
   * @param regex - 正则表达式或字符串
   * @param message - 自定义错误消息
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder
   *   .pattern(/^[a-zA-Z]+$/)
   *   .pattern('^\\d{6}$', '必须是6位数字');
   * ```
   */
  pattern(regex: RegExp | string, message?: string): this;

  /**
   * 设置字段标签
   * @param text - 字段的显示名称
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.label('用户邮箱');
   * ```
   */
  label(text: string): this;

  /**
   * 自定义错误消息
   * @param messages - 错误消息对象
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.messages({
   *   min: '至少{{#limit}}个字符',
   *   required: '这是必填项'
   * });
   * ```
   */
  messages(messages: ErrorMessages): this;

  /**
   * 设置描述
   * @param text - 字段描述文本
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.description('用户的注册邮箱');
   * ```
   */
  description(text: string): this;

  /**
   * 添加自定义验证器
   * @param validator - 验证函数
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.custom((value) => {
   *   return value.includes('@');
   * });
   *
   * // 异步验证
   * builder.custom(async (value) => {
   *   const exists = await checkEmailExists(value);
   *   return !exists;
   * });
   *
   * // 返回错误对象
   * builder.custom((value) => {
   *   if (!value.includes('@')) {
   *     return { error: 'EMAIL_INVALID', message: '邮箱格式不正确' };
   *   }
   *   return true;
   * });
   * ```
   */
  custom(
    validator: (
      value: any,
    ) => boolean | Promise<boolean> | { error: string; message: string },
  ): this;

  /**
   * 条件验证
   * @param refField - 参考字段
   * @param options - 条件选项
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * // 当userType=admin时，email必填
   * dsl({
   *   userType: 'string',
   *   email: 'email'.when('userType', {
   *     is: 'admin',
   *     then: dsl('email!'),
   *     otherwise: dsl('email')
   *   })
   * });
   * ```
   */
  // ⚠️ DEPRECATED: .when() method removed - use dsl.if() instead
  // when(refField: string, options: { is: any; then: DslBuilder | JSONSchema; otherwise?: DslBuilder | JSONSchema; }): this;

  /**
   * 设置默认值
   * @param value - 默认值
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.default('user@example.com');
   * ```
   */
  default(value: any): this;

  /**
   * 转为JSON Schema
   * @returns JSON Schema对象
   *
   * @example
   * ```typescript
   * const schema = builder.toSchema();
   * console.log(schema);
   * // { type: 'string', format: 'email', ... }
   * ```
   */
  toSchema(): JSONSchema;

  /**
   * 验证数据
   * @param data - 要验证的数据
   * @param context - 验证上下文（可选）
   * @returns 验证结果的Promise
   *
   * @example
   * ```typescript
   * const result = await builder.validate({ email: 'test@example.com' });
   * if (result.valid) {
   *   console.log('验证通过');
   * }
   * ```
   */
  validate(data: any, context?: any): Promise<ValidationResult>;

  /**
   * 用户名验证（自动设置合理约束）
   * @param preset - 预设配置
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * // 预设方式
   * builder.username('short');  // 3-16字符
   * builder.username('medium'); // 3-32字符
   * builder.username('long');   // 3-64字符
   *
   * // 范围字符串
   * builder.username('5-20');
   *
   * // 详细配置
   * builder.username({
   *   minLength: 5,
   *   maxLength: 20,
   *   allowUnderscore: true,
   *   allowNumber: true
   * });
   * ```
   */
  username(
    preset?:
      | "short"
      | "medium"
      | "long"
      | string
      | {
          minLength?: number;
          maxLength?: number;
          allowUnderscore?: boolean;
          allowNumber?: boolean;
        },
  ): this;

  /**
   * 密码强度验证
   * @param strength - 密码强度等级
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.password('weak');       // 6+ 字符
   * builder.password('medium');     // 8+ 字符，包含大小写
   * builder.password('strong');     // 10+ 字符，包含大小写+数字
   * builder.password('veryStrong'); // 12+ 字符，包含大小写+数字+特殊字符
   * ```
   */
  password(strength?: "weak" | "medium" | "strong" | "veryStrong"): this;

  /**
   * 手机号验证
   * @param country - 国家代码
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.phone('cn');            // 中国大陆 (11位)
   * builder.phone('us');            // 美国
   * builder.phone('hk');            // 香港
   * builder.phone('tw');            // 台湾
   * builder.phone('international'); // 国际号码
   * ```
   */
  phone(country?: "cn" | "us" | "uk" | "hk" | "tw" | "international"): this;

  /**
   * 设置格式
   * @param format - 格式名称 (email, url, uuid, date, date-time, time, ipv4, ipv6等)
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.format('email');
   * builder.format('uuid');
   * builder.format('date-time');
   * ```
   */
  format(format: string): this;

  /**
   * 手机号别名（phoneNumber是phone的别名）
   * @param country - 国家代码
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.phoneNumber('cn');  // 等同于 phone('cn')
   * ```
   */
  phoneNumber(
    country?: "cn" | "us" | "uk" | "hk" | "tw" | "international",
  ): this;

  /**
   * 身份证验证
   * @param country - 国家代码（目前仅支持 'cn'）
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.idCard('cn');  // 中国身份证18位
   * ```
   */
  idCard(country?: "cn"): this;

  /**
   * URL Slug 验证（只能包含小写字母、数字和连字符）
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.slug();  // my-blog-post, hello-world-123
   * ```
   */
  slug(): this;

  /**
   * 信用卡验证
   * @param type - 卡类型
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.creditCard('visa');
   * builder.creditCard('mastercard');
   * builder.creditCard('amex');
   * ```
   */
  creditCard(
    type?: "visa" | "mastercard" | "amex" | "discover" | "jcb" | "unionpay",
  ): this;

  /**
   * 车牌号验证
   * @param country - 国家代码
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.licensePlate('cn');  // 中国车牌号
   * ```
   */
  licensePlate(country?: "cn" | "us" | "uk"): this;

  /**
   * 邮政编码验证
   * @param country - 国家代码
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.postalCode('cn');  // 中国邮政编码6位
   * builder.postalCode('us');  // 美国邮政编码
   * ```
   */
  postalCode(country?: "cn" | "us" | "uk"): this;

  /**
   * 护照号码验证
   * @param country - 国家代码
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * builder.passport('cn');  // 中国护照号
   * ```
   */
  passport(country?: "cn" | "us" | "uk"): this;

  /**
   * String 最小长度（使用AJV原生minLength）
   * @param n - 最小长度
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').min(3);  // 最少3个字符
   * ```
   */
  min(n: number): this;

  /**
   * String 最大长度（使用AJV原生maxLength）
   * @param n - 最大长度
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').max(32);  // 最多32个字符
   * ```
   */
  max(n: number): this;

  /**
   * String 精确长度
   * @param n - 精确长度
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').length(11);  // 必须是11个字符
   * ```
   */
  length(n: number): this;

  /**
   * String 只能包含字母和数字
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').alphanum();  // 只能是字母和数字
   * ```
   */
  alphanum(): this;

  /**
   * String 不能包含前后空格
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').trim();  // 不能有前后空格
   * ```
   */
  trim(): this;

  /**
   * String 必须是小写
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').lowercase();  // 必须全小写
   * ```
   */
  lowercase(): this;

  /**
   * String 必须是大写
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').uppercase();  // 必须全大写
   * ```
   */
  uppercase(): this;

  /**
   * Number 小数位数限制
   * @param n - 最大小数位数
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('number!').precision(2);  // 最多2位小数
   * ```
   */
  precision(n: number): this;

  /**
   * Number 倍数验证（使用AJV原生multipleOf）
   * @param n - 必须是此数的倍数
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('number!').multiple(5);  // 必须是5的倍数
   * ```
   */
  multiple(n: number): this;

  /**
   * Number 端口号验证（1-65535）
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('integer!').port();  // 必须是有效端口号
   * ```
   */
  port(): this;

  /**
   * Object 要求所有属性都必须存在
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl({ name: 'string', age: 'number' }).requireAll();
   * ```
   */
  requireAll(): this;

  /**
   * Object 严格模式，不允许额外属性
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl({ name: 'string!' }).strict();
   * ```
   */
  strict(): this;

  /**
   * Array 不允许稀疏数组
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('array<string>').noSparse();
   * ```
   */
  noSparse(): this;

  /**
   * Array 必须包含指定元素
   * @param items - 必须包含的元素数组
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('array<string>').includesRequired(['admin', 'user']);
   * ```
   */
  includesRequired(items: any[]): this;

  /**
   * Date 自定义日期格式验证
   * @param fmt - 日期格式（YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY, ISO8601）
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').dateFormat('YYYY-MM-DD');
   * ```
   */
  dateFormat(
    fmt:
      | "YYYY-MM-DD"
      | "YYYY/MM/DD"
      | "DD-MM-YYYY"
      | "DD/MM/YYYY"
      | "ISO8601"
      | string,
  ): this;

  /**
   * Date 必须晚于指定日期
   * @param date - 比较日期
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('date!').after('2024-01-01');
   * ```
   */
  after(date: string): this;

  /**
   * Date 必须早于指定日期
   * @param date - 比较日期
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('date!').before('2025-12-31');
   * ```
   */
  before(date: string): this;

  /**
   * Pattern 域名验证
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').domain();  // example.com, sub.example.com
   * ```
   */
  domain(): this;

  /**
   * Pattern IP地址验证（IPv4或IPv6）
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').ip();  // 192.168.1.1 或 2001:0db8:85a3::8a2e:0370:7334
   * ```
   */
  ip(): this;

  /**
   * Pattern Base64编码验证
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').base64();
   * ```
   */
  base64(): this;

  /**
   * Pattern JWT令牌验证
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').jwt();
   * ```
   */
  jwt(): this;

  /**
   * Pattern JSON字符串验证
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').json();
   * ```
   */
  json(): this;

  /**
   * 日期大于验证
   * @param date - 对比日期
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').dateGreater('2025-01-01');
   * ```
   */
  dateGreater(date: string): this;

  /**
   * 日期小于验证
   * @param date - 对比日期
   * @returns 当前实例（支持链式调用）
   *
   * @example
   * ```typescript
   * dsl('string!').dateLess('2025-12-31');
   * ```
   */
  dateLess(date: string): this;
}

// ========== String 扩展 ==========

/**
 * String 扩展全局接口
 *
 * ⚠️ TypeScript 用户注意事项
 *
 * 由于 TypeScript 对全局扩展的类型推导限制，在 .ts 文件中使用链式调用时，
 * 推荐使用 dsl() 函数包裹字符串以获得完整的类型提示：
 *
 * @example
 * ```typescript
 * // ❌ 不推荐：可能缺少类型提示
 * const schema = dsl({
 *   email: 'email!'.label('邮箱')  // TypeScript 可能无法推导
 * });
 *
 * // ✅ 推荐：使用 dsl() 包裹获得完整类型推导
 * const schema = dsl({
 *   email: dsl('email!').label('邮箱').pattern(/custom/)
 * });
 *
 * // ✅ 也可以：先定义再使用
 * const emailField = dsl('email!').label('邮箱');
 * const schema = dsl({ email: emailField });
 *
 * // 📝 JavaScript 用户不受影响，可以直接使用
 * const schema = dsl({
 *   email: 'email!'.label('邮箱')  // JavaScript 中完全正常
 * });
 * ```
 */

// ========== String 扩展说明 ==========

/**
 * ⚠️ String 原型扩展的 TypeScript 限制
 *
 * 本库在运行时扩展了 String.prototype，允许在 JavaScript 中直接链式调用：
 * ```javascript
 * const schema = dsl({ email: 'email!'.label('邮箱') });  // ✅ JavaScript 中完全正常
 * ```
 *
 * 但在 TypeScript 中，为了**避免污染全局 String 类型**（会导致原生方法如 trim() 的类型推断错误），
 * 我们**不提供**全局 String 接口扩展。
 *
 * TypeScript 用户请使用以下方式：
 *
 * @example
 * ```typescript
 * import { dsl } from 'schema-dsl';
 *
 * // ✅ 推荐：使用 dsl() 函数获得完整类型提示
 * const schema = dsl({
 *   email: dsl('email!').label('邮箱').pattern(/custom/)
 * });
 *
 * // ✅ 或者先定义再使用
 * const emailField = dsl('email!').label('邮箱');
 * const schema = dsl({ email: emailField });
 *
 * // ❌ 避免：在 TypeScript 中直接对字符串字面量链式调用
 * // 这在运行时可以工作，但 TypeScript 无法提供类型提示
 * const schema = dsl({
 *   email: 'email!'.label('邮箱')  // TypeScript: 类型错误
 * });
 * ```
 *
 * 📝 说明：
 * - JavaScript 用户不受影响，可以直接使用字符串链式调用
 * - TypeScript 用户应使用 dsl() 函数包裹字符串以获得类型提示
 * - 移除全局 String 扩展是为了防止污染原生 String 方法的类型定义
 */

// ========== dsl() 函数 ==========

/**
 * DSL 定义对象
 *
 * @description 支持多种类型的Schema定义
 */
export type DslDefinition =
  | string
  | DslBuilder
  | {
      [key: string]: DslDefinition;
    };

/**
 * SchemaIO 配置选项
 *
 * @description 用于配置验证器和错误消息的选项
 *
 * @example
 * ```typescript
 * const options: SchemaIOOptions = {
 *   allErrors: true,
 *   messages: {
 *     min: '至少需要 {{#limit}} 个字符',
 *     required: '这是必填项'
 *   },
 *   locale: 'zh-CN'
 * };
 * ```
 */
export interface SchemaIOOptions {
  /** 是否返回所有错误（默认false，只返回第一个） */
  allErrors?: boolean;
  /** 是否启用详细模式 */
  verbose?: boolean;
  /** 自定义错误消息 */
  messages?: ErrorMessages;
  /** 语言代码 */
  locale?: string;
  /** 是否启用缓存 */
  cache?: boolean;
  /** 缓存大小限制 */
  cacheSize?: number;
  /** 扩展选项 */
  [key: string]: any;
}

/**
 * dsl() 函数（主入口）
 *
 * @description schema-dsl 的核心函数，用于创建 Schema 定义
 *
 * @example
 * ```typescript
 * // 1. 字符串：返回 DslBuilder（用于进一步配置）
 * const builder = dsl('email!');
 * builder.label('邮箱地址').messages({ required: '必填' });
 *
 * // 2. 对象：返回 JSON Schema（用于验证）
 * const schema = dsl({
 *   username: 'string:3-32!',
 *   email: 'email!',
 *   age: 'number:18-100'
 * });
 *
 * // 3. 带选项的对象
 * const schema = dsl({
 *   username: 'string:3-32!'
 * }, {
 *   allErrors: true,
 *   messages: {
 *     min: '至少需要 {{#limit}} 个字符'
 *   }
 * });
 *
 * // 4. 验证数据（使用顶层 validate 函数）
 * const result = validate(schema, { username: 'test' });
 * ```
 */
export function dsl(definition: string): DslBuilder;
export function dsl(
  definition: Record<string, DslDefinition>,
  options?: SchemaIOOptions,
): JSONSchema;
export function dsl(
  definition: string | Record<string, DslDefinition>,
  options?: SchemaIOOptions,
): DslBuilder | JSONSchema;

/**
 * 全局配置
 *
 * @description dsl命名空间的全局配置和工具方法
 *
 * @remark 注意：dsl() 返回的是 JSONSchema 对象，不是类实例
 * 验证时使用顶层函数 validate(schema, data) 而非 schema.validate(data)
 */
export namespace dsl {
  /**
   * 条件规则 (if / _if)
   *
   * @description 支持两种方式的条件判断
   *
   * 注意：在 TypeScript 中因为 if 是保留字，请使用 dsl['if'] 或 dsl._if
   *
   * @example TypeScript 用法
   * ```typescript
   * // 使用字符串索引访问
   * const schema = dsl({
   *   isVip: 'boolean',
   *   discount: dsl['if']('isVip', 'number:10-50!', 'number:0-10')
   * });
   *
   * // 或使用 _if 别名
   * const schema2 = dsl({
   *   email: dsl._if(d => d.age >= 18).then('email!').else('email')
   * });
   * ```
   *
   * @example JavaScript 用法
   * ```javascript
   * // JavaScript 中可以直接使用 dsl.if
   * const schema = dsl({
   *   discount: dsl.if('isVip', 'number:10-50!', 'number:0-10')
   * });
   * ```
   */
  export { _if as if };
  export function _if(condition: (data: any) => boolean): ConditionalBuilder;
  export function _if(
    conditionField: string,
    thenSchema: string | DslBuilder | JSONSchema,
    elseSchema?: string | DslBuilder | JSONSchema,
  ): any;

  /**
   * 全局配置
   *
   * @description 配置全局的验证规则和语言包
   *
   * @example
   * ```typescript
   * // 方式 1: 使用 i18n 配置（推荐，v1.0.4+）
   * dsl.config({
   *   i18n: {
   *     locales: {
   *       'zh-CN': { required: '必填' },
   *       'en-US': { required: 'Required' }
   *     }
   *   }
   * });
   *
   * // 方式 2: 使用 locales 配置（向后兼容）
   * dsl.config({
   *   locales: {
   *     'zh-CN': { required: '必填' }
   *   }
   * });
   *
   * // 自定义手机号规则
   * dsl.config({
   *   patterns: {
   *     phone: {
   *       cn: {
   *         pattern: /^1[3-9]\d{9}$/,
   *         min: 11,
   *         max: 11,
   *         key: 'phone.cn'
   *       }
   *     }
   *   }
   * });
   * ```
   */
  export function config(options: {
    /** i18n 配置（推荐，v1.0.4+） */
    i18n?: I18nConfig;
    /** 缓存配置 */
    cache?: CacheConfig;
    /** 自定义验证规则 */
    patterns?: {
      /** 手机号规则 */
      phone?: Record<
        string,
        { pattern: RegExp; min?: number; max?: number; key?: string }
      >;
      /** 身份证号规则 */
      idCard?: Record<
        string,
        { pattern: RegExp; min?: number; max?: number; key?: string }
      >;
      /** 信用卡号规则 */
      creditCard?: Record<string, { pattern: RegExp; msg?: string }>;
    };
    /** 手机号规则（兼容旧版） */
    phone?: Record<
      string,
      { pattern: RegExp; min?: number; max?: number; key?: string }
    >;
    /** 语言包配置（兼容旧版，推荐使用 i18n.locales） */
    locales?: Record<string, ErrorMessages> | string;
  }): void;

  /**
   * 匹配规则
   *
   * @description 根据值匹配不同的Schema定义
   *
   * @example
   * ```typescript
   * const schema = dsl({
   *   userType: 'string',
   *   profile: dsl.match('userType', {
   *     'admin': { role: 'string!', permissions: 'array' },
   *     'user': { bio: 'string' }
   *   })
   * });
   * ```
   */
  export function match(value: any, cases: Record<string, any>): any;

  /**
   * 条件规则 (if)
   *
   * @description 根据条件字段的值选择不同的Schema
   *
   * JavaScript 中使用: `dsl.if(condition, thenSchema, elseSchema)`
   * TypeScript 中使用: `dsl['if'](condition, thenSchema, elseSchema)` 或 `dsl._if(...)`
   *
   * @param condition - 条件字段名
   * @param thenSchema - 条件为 true 时的 Schema
   * @param elseSchema - 条件为 false 时的 Schema（可选）
   *
   * @example
   * ```typescript
   * // TypeScript 中因为 if 是保留字，需要用字符串索引或 _if
   * const schema = dsl({
   *   isVip: 'boolean',
   *   discount: dsl['if']('isVip', 'number:10-50!', 'number:0-10')
   * });
   *
   * // 或者使用 _if 别名
   * const schema2 = dsl({
   *   age: 'number',
   *   license: dsl._if('age', 'boolean!', 'boolean')
   * });
   * ```
   *
   * @example
   * ```javascript
   * // JavaScript 中可以直接使用 dsl.if
   * const schema = dsl({
   *   isVip: 'boolean',
   *   discount: dsl.if('isVip', 'number:10-50!', 'number:0-10')
   * });
   * ```
   */

  /**
   * 便捷验证方法（dsl命名空间别名）
   *
   * @description 与顶层 validate 函数相同
   */
  export const validate: typeof import("./index").validate;

  /**
   * 异步验证方法（dsl命名空间别名）
   *
   * @description 与顶层 validateAsync 函数相同
   */
  export const validateAsync: typeof import("./index").validateAsync;

  /**
   * 多语言错误快捷方法 (v1.1.1+)
   *
   * @description 统一的多语言错误抛出机制
   *
   * @example
   * ```typescript
   * import { dsl } from 'schema-dsl';
   *
   * // 创建错误
   * const error = dsl.error.create('account.notFound');
   *
   * // 直接抛出
   * dsl.error.throw('account.notFound');
   *
   * // 断言风格
   * dsl.error.assert(account, 'account.notFound');
   * dsl.error.assert(
   *   account.balance >= 100,
   *   'account.insufficientBalance',
   *   { balance: account.balance, required: 100 }
   * );
   * ```
   */
  export const error: {
    /**
     * 创建多语言错误（不抛出）
     *
     * @param code - 错误代码（多语言 key）
     * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
     * @param statusCode - HTTP 状态码
     * @param locale - 语言环境（仅当第2个参数是对象时有效）
     * @returns 错误实例
     *
     * @example 简化语法（v1.1.8+）
     * ```typescript
     * // 直接传语言参数
     * const error = dsl.error.create('account.notFound', 'zh-CN');
     * const error = dsl.error.create('account.notFound', 'en-US', 404);
     * ```
     *
     * @example 标准语法（完全兼容）
     * ```typescript
     * // 带参数对象
     * const error = dsl.error.create('account.notFound', { id: '123' }, 404, 'zh-CN');
     *
     * // 空参数对象
     * const error = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
     * ```
     *
     * @example 全局语言
     * ```typescript
     * Locale.setLocale('zh-CN');
     * const error = dsl.error.create('account.notFound');
     * ```
     *
     * @example 运行时指定语言
     * ```typescript
     * const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
     * const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
     * ```
     */
    create(
      code: string,
      paramsOrLocale?: Record<string, any> | string,
      statusCode?: number,
      locale?: string,
    ): I18nError;

    /**
     * 抛出多语言错误
     *
     * @param code - 错误代码（多语言 key）
     * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
     * @param statusCode - HTTP 状态码
     * @param locale - 语言环境（仅当第2个参数是对象时有效）
     * @throws I18nError
     *
     * @example 简化语法（v1.1.8+）
     * ```typescript
     * // 直接传语言参数
     * dsl.error.throw('account.notFound', 'zh-CN');
     * dsl.error.throw('account.notFound', 'en-US', 404);
     * ```
     *
     * @example 标准语法（完全兼容）
     * ```typescript
     * // 带参数对象
     * dsl.error.throw('account.notFound', { id: '123' }, 404, 'zh-CN');
     *
     * // 空参数对象
     * dsl.error.throw('account.notFound', {}, 404, 'zh-CN');
     * ```
     *
     * @example 全局语言
     * ```typescript
     * Locale.setLocale('zh-CN');
     * dsl.error.throw('account.notFound');
     * ```
     *
     * @example 运行时指定语言
     * ```typescript
     * dsl.error.throw('account.notFound', {}, 404, 'en-US');
     * ```
     */
    throw(
      code: string,
      paramsOrLocale?: Record<string, any> | string,
      statusCode?: number,
      locale?: string,
    ): never;

    /**
     * 断言方法 - 条件不满足时抛错
     *
     * @param condition - 条件表达式
     * @param code - 错误代码（多语言 key）
     * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
     * @param statusCode - HTTP 状态码
     * @param locale - 语言环境（仅当第3个参数是对象时有效）
     * @throws I18nError 条件为 false 时抛出
     *
     * @example 简化语法（v1.1.8+）
     * ```typescript
     * // 直接传语言参数
     * dsl.error.assert(account, 'account.notFound', 'zh-CN');
     * dsl.error.assert(account, 'account.notFound', 'en-US', 404);
     * ```
     *
     * @example 标准语法（完全兼容）
     * ```typescript
     * // 带参数对象
     * dsl.error.assert(account, 'account.notFound', { id: '123' }, 404, 'zh-CN');
     *
     * // 空参数对象
     * dsl.error.assert(account, 'account.notFound', {}, 404, 'zh-CN');
     * ```
     *
     * @example 全局语言
     * ```typescript
     * Locale.setLocale('zh-CN');
     * dsl.error.assert(account, 'account.notFound');
     * ```
     *
     * @example 运行时指定语言
     * ```typescript
     * dsl.error.assert(account, 'account.notFound', {}, 404, 'en-US');
     * ```
     */
    assert(
      condition: any,
      code: string,
      paramsOrLocale?: Record<string, any> | string,
      statusCode?: number,
      locale?: string,
    ): asserts condition;
  };
}

// ========== Validator 类 ==========

/**
 * Validator 选项
 *
 * @description 验证器的配置选项
 */
export interface ValidatorOptions {
  /** 是否返回所有错误 */
  allErrors?: boolean;
  /** 是否启用详细模式 */
  verbose?: boolean;
  /** 自定义格式验证 */
  formats?: Record<string, RegExp | ((value: any) => boolean)>;
  /** 严格模式 */
  strict?: boolean;
  /** 扩展选项 */
  [key: string]: any;
}

/**
 * 验证器类
 *
 * @description 基于ajv的JSON Schema验证器
 *
 * @example
 * ```typescript
 * // 创建验证器
 * const validator = new Validator({ allErrors: true });
 *
 * // 验证数据
 * const schema = dsl({ email: 'email!' }).toJsonSchema();
 * const result = validator.validate(schema, { email: 'test@example.com' });
 *
 * if (result.valid) {
 *   console.log('验证通过');
 * } else {
 *   console.log('错误:', result.errors);
 * }
 *
 * // 获取底层ajv实例
 * const ajv = validator.getAjv();
 * ```
 */
export class Validator {
  /**
   * 构造函数
   * @param options - 验证器选项
   */
  constructor(options?: ValidatorOptions);

  /**
   * 验证数据
   * @param schema - JSON Schema对象
   * @param data - 要验证的数据
   * @param options - 验证选项
   * @returns 验证结果
   *
   * @example
   * ```typescript
   * const validator = new Validator();
   *
   * // 使用默认语言
   * const result1 = validator.validate(schema, data);
   *
   * // 动态指定语言
   * const result2 = validator.validate(schema, data, { locale: 'zh-CN' });
   *
   * // 自定义错误消息
   * const result3 = validator.validate(schema, data, {
   *   locale: 'zh-CN',
   *   messages: { min: '至少{{#limit}}个字符' }
   * });
   * ```
   */
  validate<T = any>(
    schema: JSONSchema,
    data: any,
    options?: ValidateOptions,
  ): ValidationResult<T>;

  /**
   * 获取底层ajv实例
   * @returns ajv实例
   */
  getAjv(): any;

  /**
   * 添加自定义格式
   * @param name - 格式名称
   * @param validator - 验证函数或正则表达式
   *
   * @example
   * ```typescript
   * validator.addFormat('phone-cn', /^1[3-9]\d{9}$/);
   * validator.addFormat('custom', (value) => {
   *   return value.startsWith('prefix-');
   * });
   * ```
   */
  addFormat(name: string, validator: RegExp | ((value: any) => boolean)): void;

  /**
   * 添加自定义关键字
   * @param keyword - 关键字名称
   * @param definition - 关键字定义
   */
  addKeyword(keyword: string, definition: any): void;
}

/**
 * 便捷验证方法（同步）
 *
 * @description 使用默认的单例Validator，无需new
 *
 * @example
 * ```typescript
 * import { dsl, validate } from 'schema-dsl';
 *
 * const schema = dsl({ email: 'email!' });
 *
 * // 基本验证
 * const result1 = validate(schema, { email: 'test@example.com' });
 *
 * // 指定语言
 * const result2 = validate(schema, { email: 'invalid' }, { locale: 'zh-CN' });
 *
 * if (result2.valid) {
 *   console.log('验证通过');
 * } else {
 *   console.log('错误:', result2.errors); // 中文错误消息
 * }
 * ```
 */

/**
 * 全局配置函数
 *
 * @description dsl.config 的顶层导出别名，两种方式等效
 *
 * @example
 * ```typescript
 * import { config } from 'schema-dsl';
 * // 或
 * import { dsl } from 'schema-dsl';
 *
 * // 两种方式都可以
 * config({ i18n: './locales' });
 * dsl.config({ i18n: './locales' });
 * ```
 */
export const config: typeof dsl.config;

export function validate<T = any>(
  schema: JSONSchema | DslBuilder,
  data: any,
  options?: ValidateOptions,
): ValidationResult<T>;

/**
 * 便捷异步验证方法（推荐）
 *
 * @description
 * - 异步验证数据，验证失败时抛出 ValidationError
 * - 推荐在异步场景下使用此方法
 * - 验证成功返回验证后的数据，失败抛出异常
 *
 * @param schema - JSON Schema对象或DslBuilder实例
 * @param data - 要验证的数据
 * @param options - 验证选项（可选）
 * @returns 验证成功返回数据的Promise
 * @throws {ValidationError} 验证失败时抛出
 *
 * @example
 * ```typescript
 * import { dsl, validateAsync, ValidationError } from 'schema-dsl';
 *
 * const schema = dsl({
 *   email: dsl('email!').label('邮箱'),
 *   username: dsl('string:3-32!').label('用户名')
 * });
 *
 * try {
 *   const validData = await validateAsync(schema, {
 *     email: 'test@example.com',
 *     username: 'testuser'
 *   });
 *   console.log('验证通过:', validData);
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     console.log('验证失败:', error.errors);
 *     error.errors.forEach(err => {
 *       console.log(`${err.path}: ${err.message}`);
 *     });
 *   }
 * }
 * ```
 */
export function validateAsync<T = any>(
  schema: JSONSchema | DslBuilder,
  data: any,
  options?: ValidatorOptions,
): Promise<T>;

/**
 * 验证错误类
 *
 * @description 当 validateAsync 验证失败时抛出此错误
 *
 * @example
 * ```typescript
 * import { ValidationError, validateAsync, dsl } from 'schema-dsl';
 *
 * const schema = dsl({
 *   email: dsl('email!').label('邮箱'),
 *   age: dsl('number:18-100').label('年龄')
 * });
 *
 * try {
 *   await validateAsync(schema, { email: 'invalid' });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // 获取所有错误
 *     console.log('错误列表:', error.errors);
 *
 *     // 获取错误数量
 *     console.log('错误数量:', error.errors.length);
 *
 *     // 遍历处理每个字段错误
 *     error.errors.forEach(err => {
 *       console.log(`字段 ${err.path}: ${err.message}`);
 *     });
 *
 *     // 转为 JSON 格式
 *     const json = error.toJSON();
 *     console.log('JSON格式:', json);
 *   }
 * }
 * ```
 */
export class ValidationError extends Error {
  /** 错误名称（固定为 'ValidationError'） */
  readonly name: "ValidationError";

  /** 错误消息 */
  message: string;

  /** 验证错误列表 */
  errors: ValidationError[];

  /**
   * 构造函数
   * @param errors - 验证错误数组
   * @param message - 错误消息（可选）
   */
  constructor(errors: ValidationError[], message?: string);

  /**
   * 转为 JSON 格式
   * @returns JSON 对象
   */
  toJSON(): {
    name: string;
    message: string;
    errors: Array<{
      field: string;
      message: string;
      keyword: string;
      params?: Record<string, any>;
    }>;
  };

  /**
   * 获取指定字段的错误
   * @param field - 字段路径
   * @returns 错误对象或 null
   */
  getFieldError(field: string): ValidationError | null;

  /**
   * 获取所有字段的错误映射
   * @returns 字段错误映射对象
   */
  getFieldErrors(): Record<string, ValidationError>;

  /**
   * 检查指定字段是否有错误
   * @param field - 字段路径
   * @returns 是否有错误
   */
  hasFieldError(field: string): boolean;

  /**
   * 获取错误总数
   * @returns 错误数量
   */
  getErrorCount(): number;
}

/**
 * I18nError - 多语言错误类
 *
 * @version 1.1.1
 *
 * @description 统一的多语言错误抛出机制，支持：
 * - 多语言 key 自动翻译
 * - 参数插值（如 {{#balance}}, {{#required}}）
 * - 自定义错误代码
 * - Express/Koa 集成
 *
 * @example 基础用法
 * ```typescript
 * import { I18nError } from 'schema-dsl';
 *
 * // 直接抛出
 * throw I18nError.create('account.notFound');
 * // 中文: "账户不存在"
 * // 英文: "Account not found"
 * ```
 *
 * @example 带参数
 * ```typescript
 * I18nError.throw('account.insufficientBalance', {
 *   balance: 50,
 *   required: 100
 * });
 * // 输出: "余额不足，当前余额50，需要100"
 * ```
 *
 * @example 断言风格
 * ```typescript
 * function getAccount(id: string) {
 *   const account = db.findAccount(id);
 *   I18nError.assert(account, 'account.notFound');
 *   I18nError.assert(
 *     account.balance >= 100,
 *     'account.insufficientBalance',
 *     { balance: account.balance, required: 100 }
 *   );
 *   return account;
 * }
 * ```
 *
 * @example Express 集成
 * ```typescript
 * app.use((error, req, res, next) => {
 *   if (error instanceof I18nError) {
 *     return res.status(error.statusCode).json(error.toJSON());
 *   }
 *   next(error);
 * });
 * ```
 */
export class I18nError extends Error {
  /** 错误名称（固定为 'I18nError'） */
  readonly name: "I18nError";

  /** 错误消息（已翻译） */
  message: string;

  /** 原始 key（v1.1.5 新增） */
  originalKey: string;

  /** 错误代码（从对象提取或使用 key） */
  code: string;

  /** 错误参数（用于插值） */
  params: Record<string, any>;

  /** HTTP 状态码 */
  statusCode: number;

  /** 使用的语言环境 */
  locale: string;

  /**
   * 构造函数
   * @param code - 错误代码（多语言 key）
   * @param params - 错误参数（用于插值）
   * @param statusCode - HTTP 状态码（默认 400）
   * @param locale - 语言环境（默认使用当前语言）
   */
  constructor(
    code: string,
    params?: Record<string, any>,
    statusCode?: number,
    locale?: string,
  );

  /**
   * 静态工厂方法 - 创建错误（不抛出）
   *
   * @param code - 错误代码
   * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
   * @param statusCode - HTTP 状态码
   * @param locale - 语言环境（仅当第2个参数是对象时有效）
   * @returns 错误实例
   *
   * @example 简化语法（v1.1.8+）
   * ```typescript
   * // 直接传语言参数
   * const error = I18nError.create('account.notFound', 'zh-CN');
   * const error = I18nError.create('account.notFound', 'en-US', 404);
   * ```
   *
   * @example 标准语法（完全兼容）
   * ```typescript
   * // 带参数对象
   * const error = I18nError.create('account.notFound', { id: '123' }, 404, 'zh-CN');
   * ```
   *
   * @example 全局语言
   * ```typescript
   * Locale.setLocale('zh-CN');
   * const error = I18nError.create('account.notFound');
   * // message: "账户不存在"
   * ```
   *
   * @example 运行时指定语言
   * ```typescript
   * const error1 = I18nError.create('account.notFound', {}, 404, 'zh-CN');
   * // message: "账户不存在"
   *
   * const error2 = I18nError.create('account.notFound', {}, 404, 'en-US');
   * // message: "Account not found"
   * ```
   */
  static create(
    code: string,
    paramsOrLocale?: Record<string, any> | string,
    statusCode?: number,
    locale?: string,
  ): I18nError;

  /**
   * 静态工厂方法 - 直接抛出错误
   *
   * @param code - 错误代码
   * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
   * @param statusCode - HTTP 状态码
   * @param locale - 语言环境（仅当第2个参数是对象时有效）
   * @throws I18nError
   *
   * @example 简化语法（v1.1.8+）
   * ```typescript
   * // 直接传语言参数
   * I18nError.throw('account.notFound', 'zh-CN');
   * I18nError.throw('account.notFound', 'en-US', 404);
   * ```
   *
   * @example 标准语法（完全兼容）
   * ```typescript
   * // 带参数对象
   * I18nError.throw('account.notFound', { id: '123' }, 404, 'zh-CN');
   * ```
   *
   * @example 全局语言
   * ```typescript
   * Locale.setLocale('zh-CN');
   * I18nError.throw('account.notFound');
   * ```
   *
   * @example 运行时指定语言
   * ```typescript
   * I18nError.throw('account.notFound', {}, 404, 'en-US');
   * ```
   */
  static throw(
    code: string,
    paramsOrLocale?: Record<string, any> | string,
    statusCode?: number,
    locale?: string,
  ): never;

  /**
   * 断言方法 - 条件不满足时抛错
   *
   * @param condition - 条件表达式
   * @param code - 错误代码
   * @param paramsOrLocale - 错误参数对象 或 语言代码（智能识别，v1.1.8+）
   * @param statusCode - HTTP 状态码
   * @param locale - 语言环境（仅当第3个参数是对象时有效）
   * @throws I18nError 条件为 false 时抛出
   *
   * @example 简化语法（v1.1.8+）
   * ```typescript
   * // 直接传语言参数
   * I18nError.assert(account, 'account.notFound', 'zh-CN');
   * I18nError.assert(account, 'account.notFound', 'en-US', 404);
   * ```
   *
   * @example 标准语法（完全兼容）
   * ```typescript
   * // 带参数对象
   * I18nError.assert(account, 'account.notFound', { id: '123' }, 404, 'zh-CN');
   * ```
   *
   * @example 全局语言
   * ```typescript
   * Locale.setLocale('zh-CN');
   * I18nError.assert(account, 'account.notFound');
   * ```
   *
   * @example 运行时指定语言
   * ```typescript
   * I18nError.assert(account, 'account.notFound', {}, 404, 'en-US');
   * ```
   */
  static assert(
    condition: any,
    code: string,
    paramsOrLocale?: Record<string, any> | string,
    statusCode?: number,
    locale?: string,
  ): asserts condition;

  /**
   * 检查错误是否为指定代码
   * @param code - 错误代码
   * @returns 是否匹配
   */
  is(code: string): boolean;

  /**
   * 转为 JSON 格式（用于 API 响应）
   * @returns JSON 对象
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * // {
   * //   error: 'I18nError',
   * //   originalKey: 'account.notFound',  // v1.1.5 新增
   * //   code: 'ACCOUNT_NOT_FOUND',
   * //   message: '账户不存在',
   * //   params: {},
   * //   statusCode: 400,
   * //   locale: 'zh-CN'
   * // }
   * ```
   *
   * @since v1.1.5 - 新增 originalKey 字段
   */
  toJSON(): {
    error: string;
    originalKey: string; // v1.1.5 新增
    code: string;
    message: string;
    params: Record<string, any>;
    statusCode: number;
    locale: string;
  };

  /**
   * 转为字符串
   * @returns 格式化的错误信息
   */
  toString(): string;
}

/**
 * 获取默认Validator实例（单例）
 *
 * @description 获取全局共享的Validator实例
 *
 * @example
 * ```typescript
 * import { getDefaultValidator } from 'schema-dsl';
 *
 * const validator = getDefaultValidator();
 * validator.addFormat('custom', /pattern/);
 * ```
 */
export function getDefaultValidator(): Validator;

// ========== 导出器 ==========

/**
 * MongoDB 导出器选项
 */
export interface MongoDBExporterOptions {
  /** 严格模式（默认false） */
  strict?: boolean;
  /** 时间戳字段 */
  timestamps?: boolean;
  /** 集合名称 */
  collectionName?: string;
}

/**
 * MongoDB 导出器
 *
 * @description 将JSON Schema导出为MongoDB验证规则
 *
 * @example
 * ```typescript
 * const exporter = new MongoDBExporter({ strict: true });
 * const mongoSchema = exporter.export(jsonSchema);
 *
 * // 生成MongoDB命令
 * const command = exporter.generateCommand('users', jsonSchema);
 * console.log(command);
 * // db.createCollection("users", { validator: { $jsonSchema: {...} } })
 * ```
 */
export class MongoDBExporter {
  /**
   * 构造函数
   * @param options - 导出选项
   */
  constructor(options?: MongoDBExporterOptions);

  /**
   * 导出为MongoDB Schema
   * @param schema - JSON Schema对象
   * @returns MongoDB验证规则
   */
  export(schema: JSONSchema): any;

  /**
   * 生成MongoDB创建集合命令
   * @param collectionName - 集合名称
   * @param schema - JSON Schema对象
   * @returns MongoDB命令字符串
   */
  generateCommand(collectionName: string, schema: JSONSchema): string;
}

/**
 * MySQL 导出器选项
 */
export interface MySQLExporterOptions {
  /** 表名 */
  tableName?: string;
  /** 存储引擎（默认InnoDB） */
  engine?: string;
  /** 字符集（默认utf8mb4） */
  charset?: string;
  /** 排序规则 */
  collation?: string;
}

/**
 * MySQL 导出器
 *
 * @description 将JSON Schema导出为MySQL CREATE TABLE语句
 *
 * @example
 * ```typescript
 * const exporter = new MySQLExporter();
 * const sql = exporter.export(jsonSchema, {
 *   tableName: 'users',
 *   engine: 'InnoDB',
 *   charset: 'utf8mb4'
 * });
 *
 * console.log(sql);
 * // CREATE TABLE `users` (
 * //   `id` INT PRIMARY KEY AUTO_INCREMENT,
 * //   `username` VARCHAR(32) NOT NULL,
 * //   ...
 * // ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 * ```
 */
export class MySQLExporter {
  /**
   * 构造函数
   */
  constructor();

  /**
   * 导出为MySQL CREATE TABLE语句
   * @param schema - JSON Schema对象
   * @param options - 导出选项
   * @returns SQL语句
   */
  export(schema: JSONSchema, options?: MySQLExporterOptions): string;
}

/**
 * PostgreSQL 导出器选项
 */
export interface PostgreSQLExporterOptions {
  /** 表名 */
  tableName?: string;
  /** 模式名 */
  schemaName?: string;
}

/**
 * PostgreSQL 导出器
 *
 * @description 将JSON Schema导出为PostgreSQL CREATE TABLE语句
 *
 * @example
 * ```typescript
 * const exporter = new PostgreSQLExporter();
 * const sql = exporter.export(jsonSchema, {
 *   tableName: 'users',
 *   schemaName: 'public'
 * });
 *
 * console.log(sql);
 * // CREATE TABLE public.users (
 * //   id SERIAL PRIMARY KEY,
 * //   username VARCHAR(32) NOT NULL,
 * //   ...
 * // );
 * ```
 */
export class PostgreSQLExporter {
  /**
   * 构造函数
   */
  constructor();

  /**
   * 导出为PostgreSQL CREATE TABLE语句
   * @param schema - JSON Schema对象
   * @param options - 导出选项
   * @returns SQL语句
   */
  export(schema: JSONSchema, options?: PostgreSQLExporterOptions): string;
}

/**
 * 导出器命名空间
 *
 * @description 统一的导出器访问入口
 *
 * @example
 * ```typescript
 * import { exporters } from 'schema-dsl';
 *
 * const mongoExporter = new exporters.MongoDBExporter();
 * const mysqlExporter = new exporters.MySQLExporter();
 * const pgExporter = new exporters.PostgreSQLExporter();
 * ```
 */

// ========== 工具函数 ==========

/**
 * 类型转换工具
 *
 * @description 提供多种Schema类型之间的转换
 *
 * @example
 * ```typescript
 * // 转换为JSON Schema类型
 * const jsonType = TypeConverter.toJSONSchemaType('email');
 * // { type: 'string', format: 'email' }
 *
 * // 转换为MongoDB类型
 * const mongoType = TypeConverter.toMongoDBType('string');
 * // 'String'
 *
 * // 转换为MySQL类型
 * const mysqlType = TypeConverter.toMySQLType('string', { maxLength: 255 });
 * // 'VARCHAR(255)'
 * ```
 */
export class TypeConverter {
  /**
   * 转换为JSON Schema类型
   * @param simpleType - 简单类型名称
   * @returns JSON Schema类型对象
   */
  static toJSONSchemaType(simpleType: string): JSONSchema;

  /**
   * 转换为MongoDB类型
   * @param jsonSchemaType - JSON Schema类型
   * @returns MongoDB类型字符串
   */
  static toMongoDBType(jsonSchemaType: string): string;

  /**
   * 转换为MySQL类型
   * @param jsonSchemaType - JSON Schema类型
   * @param constraints - 约束条件
   * @returns MySQL类型字符串
   */
  static toMySQLType(
    jsonSchemaType: string,
    constraints?: Record<string, any>,
  ): string;

  /**
   * 转换为PostgreSQL类型
   * @param jsonSchemaType - JSON Schema类型
   * @param constraints - 约束条件
   * @returns PostgreSQL类型字符串
   */
  static toPostgreSQLType(
    jsonSchemaType: string,
    constraints?: Record<string, any>,
  ): string;

  /**
   * 规范化属性名
   * @param name - 原属性名
   * @param style - 命名风格
   * @returns 规范化后的属性名
   *
   * @example
   * ```typescript
   * TypeConverter.normalizePropertyName('userName', 'snake_case');
   * // 'user_name'
   *
   * TypeConverter.normalizePropertyName('user_name', 'camelCase');
   * // 'userName'
   * ```
   */
  static normalizePropertyName(
    name: string,
    style?: "snake_case" | "camelCase",
  ): string;

  /**
   * 将format转换为正则表达式
   * @param format - 格式名称
   * @returns 正则表达式字符串或null
   */
  static formatToRegex(format: string): string | null;

  /**
   * 合并Schema
   * @param base - 基础Schema
   * @param override - 覆盖Schema
   * @returns 合并后的Schema
   */
  static mergeSchemas(base: JSONSchema, override: JSONSchema): JSONSchema;

  /**
   * 提取约束条件
   * @param schema - JSON Schema对象
   * @returns 约束条件对象
   */
  static extractConstraints(schema: JSONSchema): Record<string, any>;
}

/**
 * Schema 辅助工具
 *
 * @description 提供Schema的基础操作方法
 *
 * @example
 * ```typescript
 * // 合并Schema
 * const merged = SchemaHelper.merge(schema1, schema2);
 *
 * // 克隆Schema
 * const cloned = SchemaHelper.clone(schema);
 * ```
 */
export class SchemaHelper {
  /**
   * 合并多个Schema
   * @param schema1 - 第一个Schema
   * @param schema2 - 第二个Schema
   * @returns 合并后的Schema
   */
  static merge(schema1: JSONSchema, schema2: JSONSchema): JSONSchema;

  /**
   * 克隆Schema
   * @param schema - 要克隆的Schema
   * @returns 克隆的Schema副本
   */
  static clone(schema: JSONSchema): JSONSchema;
}

/**
 * Schema 工具类 (v2.0.1+)
 *
 * @description 提供高级Schema操作和工具方法
 *
 * @example
 * ```typescript
 * // 创建可复用的Schema片段
 * const addressFragment = SchemaUtils.reusable(() => ({
 *   city: 'string!',
 *   street: 'string!',
 *   zip: 'string'
 * }));
 *
 * // 创建Schema库
 * const library = SchemaUtils.createLibrary({
 *   user: () => ({ username: 'string!', email: 'email!' }),
 *   address: addressFragment
 * });
 *
 * // 使用Schema库
 * const schema = dsl({
 *   user: library.user(),
 *   address: library.address()
 * });
 * ```
 */
export class SchemaUtils {
  /**
   * 创建可复用的Schema片段
   * @param factory - Schema工厂函数
   * @returns 可复用的工厂函数
   */
  static reusable<T>(factory: () => T): () => T;

  /**
   * 创建Schema片段库
   * @param fragments - Schema片段对象
   * @returns Schema库对象
   */
  static createLibrary<T extends Record<string, () => any>>(fragments: T): T;

  /**
   * 合并多个Schema
   * @param schemas - 要合并的Schema数组
   * @returns 合并后的Schema
   */
  static merge(...schemas: JSONSchema[]): JSONSchema;

  /**
   * 扩展Schema
   * @param baseSchema - 基础Schema
   * @param extensions - 扩展字段
   * @returns 扩展后的Schema
   */
  static extend(
    baseSchema: JSONSchema,
    extensions: Record<string, any>,
  ): JSONSchema;

  /**
   * 挑选Schema的部分字段
   * @param schema - 原Schema
   * @param fields - 要挑选的字段列表
   * @returns 新Schema
   *
   * @example
   * ```typescript
   * const userSchema = dsl({
   *   username: 'string!',
   *   email: 'email!',
   *   password: 'string!',
   *   age: 'number'
   * });
   *
   * const loginSchema = SchemaUtils.pick(userSchema, ['username', 'password']);
   * ```
   */
  static pick(schema: JSONSchema, fields: string[]): JSONSchema;

  /**
   * 排除Schema的部分字段
   * @param schema - 原Schema
   * @param fields - 要排除的字段列表
   * @returns 新Schema
   *
   * @example
   * ```typescript
   * const publicUserSchema = SchemaUtils.omit(userSchema, ['password']);
   * ```
   */
  static omit(schema: JSONSchema, fields: string[]): JSONSchema;

  /**
   * 创建带性能监控的Validator
   * @param validator - 原Validator实例
   * @returns 包装后的Validator
   */
  static withPerformance(validator: Validator): Validator;

  /**
   * 批量验证
   * @param schema - JSON Schema对象
   * @param dataArray - 数据数组
   * @param validator - Validator实例
   * @returns 批量验证结果
   *
   * @example
   * ```typescript
   * const results = SchemaUtils.validateBatch(
   *   schema,
   *   [data1, data2, data3],
   *   validator
   * );
   *
   * console.log(results.summary);
   * // {
   * //   total: 3,
   * //   valid: 2,
   * //   invalid: 1,
   * //   duration: 15,
   * //   averageTime: 5
   * // }
   * ```
   */
  static validateBatch(
    schema: JSONSchema,
    dataArray: any[],
    validator: Validator,
  ): {
    results: Array<{ index: number; valid: boolean; errors: any; data: any }>;
    summary: {
      total: number;
      valid: number;
      invalid: number;
      duration: number;
      averageTime: number;
    };
  };

  /**
   * 检查嵌套深度
   * @param schema - JSON Schema对象
   * @param maxDepth - 最大深度（默认10）
   * @returns 检查结果
   */
  static validateNestingDepth(
    schema: JSONSchema,
    maxDepth?: number,
  ): {
    valid: boolean;
    depth: number;
    path: string;
    message: string;
  };

  /**
   * 导出为Markdown文档
   * @param schema - JSON Schema对象
   * @param options - 导出选项
   * @returns Markdown字符串
   */
  static toMarkdown(
    schema: JSONSchema,
    options?: { title?: string; locale?: string },
  ): string;

  /**
   * 导出为HTML文档
   * @param schema - JSON Schema对象
   * @param options - 导出选项
   * @returns HTML字符串
   */
  static toHTML(schema: JSONSchema, options?: { title?: string }): string;

  /**
   * 克隆Schema
   * @param schema - 要克隆的Schema
   * @returns Schema副本
   */
  static clone(schema: JSONSchema): JSONSchema;
}

// ========== 错误代码 ==========

/**
 * 错误代码常量
 *
 * @description 预定义的错误代码和消息
 *
 * @example
 * ```typescript
 * import { ErrorCodes } from 'schema-dsl';
 *
 * console.log(ErrorCodes.min);
 * // { code: 'MIN_LENGTH', message: 'Must be at least {{#limit}} characters', zhCN: '至少需要 {{#limit}} 个字符' }
 *
 * console.log(ErrorCodes.email);
 * // { code: 'INVALID_EMAIL', message: 'Invalid email format', zhCN: '邮箱格式不正确' }
 * ```
 */
export const ErrorCodes: {
  /** 最小长度/最小值错误 */
  min: { code: string; message: string; zhCN: string };
  /** 最大长度/最大值错误 */
  max: { code: string; message: string; zhCN: string };
  /** 邮箱格式错误 */
  email: { code: string; message: string; zhCN: string };
  /** URL格式错误 */
  url: { code: string; message: string; zhCN: string };
  /** 正则表达式验证错误 */
  pattern: { code: string; message: string; zhCN: string };
  /** 必填项错误 */
  required: { code: string; message: string; zhCN: string };
  /** 类型错误 */
  type: { code: string; message: string; zhCN: string };
  /** 枚举值错误 */
  enum: { code: string; message: string; zhCN: string };
};

// ========== 多语言 ==========

/**
 * 多语言支持
 *
 * @description 提供国际化支持的工具类
 *
 * @example
 * ```typescript
 * import { Locale } from 'schema-dsl';
 *
 * // 设置语言
 * Locale.setLocale('zh-CN');
 *
 * // 获取当前语言
 * console.log(Locale.getLocale()); // 'zh-CN'
 *
 * // 添加自定义语言包
 * Locale.addLocale('ja-JP', {
 *   required: '必須項目です',
 *   min: '{{#limit}}文字以上必要です'
 * });
 *
 * // 获取可用语言列表
 * console.log(Locale.getAvailableLocales()); // ['zh-CN', 'en-US', 'ja-JP', ...]
 * ```
 */
export class Locale {
  /**
   * 设置当前语言
   * @param lang - 语言代码
   */
  static setLocale(
    lang: "en-US" | "zh-CN" | "ja-JP" | "fr-FR" | "es-ES" | string,
  ): void;

  /**
   * 获取当前语言
   * @returns 语言代码
   */
  static getLocale(): string;

  /**
   * 添加语言包
   * @param locale - 语言代码
   * @param messages - 错误消息
   */
  static addLocale(locale: string, messages: ErrorMessages): void;

  /**
   * 设置当前语言包的消息
   * @param messages - 错误消息
   */
  static setMessages(messages: ErrorMessages): void;

  /**
   * 获取错误消息
   * @param type - 错误类型
   * @param customMessages - 自定义消息（可选）
   * @returns 错误消息字符串
   */
  static getMessage(type: string, customMessages?: ErrorMessages): string;

  /**
   * 获取可用的语言列表
   * @returns 语言代码数组
   */
  static getAvailableLocales(): string[];
}

// ========== JSONSchemaCore 类 ==========

/**
 * JSON Schema 核心类
 *
 * @description 对 JSON Schema 进行封装，提供验证和操作方法
 *
 * @example
 * ```typescript
 * const core = new JSONSchemaCore({
 *   type: 'string',
 *   minLength: 3,
 *   maxLength: 32
 * });
 *
 * const result = core.validate('test');
 * console.log(result.valid); // true
 * ```
 */
export class JSONSchemaCore {
  /**
   * 构造函数
   * @param schema - JSON Schema 对象
   */
  constructor(schema: JSONSchema);

  /**
   * 验证数据
   * @param data - 要验证的数据
   * @returns 验证结果
   */
  validate<T = any>(data: any): ValidationResult<T>;

  /**
   * 获取 JSON Schema 对象
   * @returns JSON Schema
   */
  toJsonSchema(): JSONSchema;
}

// ========== ErrorFormatter 类 ==========

/**
 * 错误格式化器
 *
 * @description 格式化 ajv 验证错误为友好的错误消息
 *
 * @example
 * ```typescript
 * const formatter = new ErrorFormatter();
 * const errors = formatter.format(ajvErrors, { locale: 'zh-CN' });
 * ```
 */
export class ErrorFormatter {
  /**
   * 格式化错误
   * @param errors - ajv 错误数组
   * @param options - 格式化选项
   * @returns 格式化后的错误数组
   */
  format(errors: any[], options?: { locale?: string }): ValidationError[];
}

// ========== MessageTemplate 类 ==========

/**
 * 消息模板类
 *
 * @description 处理错误消息模板和变量替换
 *
 * @example
 * ```typescript
 * const template = new MessageTemplate('至少需要{{#limit}}个字符');
 * const message = template.render({ limit: 3 });
 * console.log(message); // "至少需要3个字符"
 * ```
 */
export class MessageTemplate {
  /**
   * 构造函数
   * @param template - 消息模板字符串
   */
  constructor(template: string);

  /**
   * 渲染模板
   * @param variables - 模板变量
   * @returns 渲染后的消息
   */
  render(variables: Record<string, any>): string;

  /**
   * 静态渲染方法
   * @param template - 消息模板
   * @param variables - 模板变量
   * @returns 渲染后的消息
   */
  static render(template: string, variables: Record<string, any>): string;
}

// ========== CacheManager 类 ==========

/**
 * 缓存管理器选项
 */
export interface CacheManagerOptions {
  /** 最大缓存条目数 */
  maxSize?: number;
  /** 缓存过期时间（毫秒） */
  ttl?: number;
}

/**
 * 缓存管理器
 *
 * @description LRU 缓存管理器，用于缓存编译后的 Schema
 *
 * @example
 * ```typescript
 * const cache = new CacheManager({ maxSize: 1000, ttl: 60000 });
 *
 * // 设置缓存
 * cache.set('key', value);
 *
 * // 获取缓存
 * const value = cache.get('key');
 *
 * // 清空缓存
 * cache.clear();
 * ```
 */
export class CacheManager {
  /**
   * 构造函数
   * @param options - 缓存选项
   */
  constructor(options?: CacheManagerOptions);

  /**
   * 缓存选项
   */
  options: CacheManagerOptions;

  /**
   * 设置缓存
   * @param key - 缓存键
   * @param value - 缓存值
   */
  set(key: string, value: any): void;

  /**
   * 获取缓存
   * @param key - 缓存键
   * @returns 缓存值或 undefined
   */
  get(key: string): any | undefined;

  /**
   * 检查缓存是否存在
   * @param key - 缓存键
   * @returns 是否存在
   */
  has(key: string): boolean;

  /**
   * 删除缓存
   * @param key - 缓存键
   */
  delete(key: string): void;

  /**
   * 清空所有缓存
   */
  clear(): void;

  /**
   * 获取缓存统计信息
   * @returns 统计信息对象
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    evictions: number;
  };
}

// ========== PluginManager 类 ==========

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 安装方法 */
  install(core: any, options?: any, context?: any): void;
  /** 卸载方法（可选） */
  uninstall?(core: any, context?: any): void;
}

/**
 * 插件管理器
 *
 * @description 管理验证库的插件系统
 *
 * @example
 * ```typescript
 * const pluginManager = new PluginManager();
 *
 * // 注册插件
 * pluginManager.register({
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   install(core) {
 *     // 安装逻辑
 *   }
 * });
 *
 * // 安装插件
 * pluginManager.install(schemaCore);
 *
 * // 获取插件
 * const plugin = pluginManager.get('my-plugin');
 * ```
 */
export class PluginManager {
  /**
   * 构造函数
   */
  constructor();

  /**
   * 注册插件
   * @param plugin - 插件对象
   */
  register(plugin: Plugin): void;

  /**
   * 安装所有插件
   * @param core - 核心对象
   * @param options - 安装选项
   */
  install(core: any, options?: any): void;

  /**
   * 获取插件
   * @param name - 插件名称
   * @returns 插件对象或 undefined
   */
  get(name: string): Plugin | undefined;

  /**
   * 卸载插件
   * @param name - 插件名称
   */
  uninstall(name: string): void;

  /**
   * 列出所有插件
   * @returns 插件名称数组
   */
  list(): string[];

  /**
   * 清空所有插件
   */
  clear(): void;
}

// ========== MarkdownExporter 类 ==========

/**
 * Markdown 导出器选项
 */
export interface MarkdownExporterOptions {
  /** 文档标题 */
  title?: string;
  /** 语言（zh-CN, en-US等） */
  locale?: string;
  /** 是否包含示例数据 */
  includeExamples?: boolean;
}

/**
 * Markdown 导出器
 *
 * @description 将 JSON Schema 导出为 Markdown 文档
 *
 * @example
 * ```typescript
 * const exporter = new MarkdownExporter();
 * const markdown = exporter.export(schema, {
 *   title: '用户注册 API',
 *   locale: 'zh-CN',
 *   includeExamples: true
 * });
 *
 * console.log(markdown);
 * // # 用户注册 API
 * //
 * // ## 字段列表
 * // | 字段名 | 类型 | 必填 | 约束 | 说明 |
 * // |--------|------|------|------|------|
 * // | username | 字符串 | ✅ | 长度: 3-32 | - |
 * ```
 */
export class MarkdownExporter {
  /**
   * 构造函数
   */
  constructor();

  /**
   * 导出为 Markdown
   * @param schema - JSON Schema 对象
   * @param options - 导出选项
   * @returns Markdown 字符串
   */
  export(schema: JSONSchema, options?: MarkdownExporterOptions): string;

  /**
   * 静态导出方法
   * @param schema - JSON Schema 对象
   * @param options - 导出选项
   * @returns Markdown 字符串
   */
  static export(schema: JSONSchema, options?: MarkdownExporterOptions): string;
}

// ========== CustomKeywords 类 ==========

/**
 * 自定义关键字
 *
 * @description 扩展 ajv 的自定义验证关键字
 *
 * @example
 * ```typescript
 * // 添加自定义关键字通常通过 Validator 的 addKeyword 方法
 * const validator = new Validator();
 * const ajv = validator.getAjv();

// ========== dsl.config 选项 ==========

/**
 * i18n 配置选项
 *
 * @description 支持三种配置方式（v1.2.3 新增 localesPath 对象形态 + 递归子目录）
 *
 * @example
 * ```typescript
 * // 方式1: 直接传字符串路径（支持递归子目录，v1.2.3+）
 * dsl.config({
 *   i18n: './locales'
 * });
 *
 * // 方式2: 传入语言包对象
 * dsl.config({
 *   i18n: {
 *     'zh-CN': { required: '必填' },
 *     'en-US': { required: 'Required' }
 *   }
 * });
 *
 * // 方式3: 含 localesPath 的对象（v1.2.3 修复真正生效）
 * dsl.config({
 *   i18n: { localesPath: './i18n/labels' }
 * });
 * ```
 */
export type I18nConfig =
  | string
  | Record<string, ErrorMessages>
  | { localesPath: string };

/**
 * 缓存配置选项（v2.3.0+）
 */
export interface CacheConfig {
  /** 最大缓存条目数 */
  maxSize?: number;
  /** 缓存过期时间（毫秒） */
  ttl?: number;
}

/**
 * dsl.config() 配置选项（v2.3.0+）
 *
 * @description 全局配置选项，包括多语言和缓存设置
 *
 * @example
 * ```typescript
 * // 配置多语言
 * dsl.config({
 *   i18n: {
 *     locales: {
 *       'zh-CN': { 'username': '用户名' },
 *       'en-US': { 'username': 'Username' }
 *     }
 *   }
 * });
 *
 * // 配置缓存
 * dsl.config({
 *   cache: {
 *     maxSize: 5000,
 *     ttl: 60000
 *   }
 * });
 *
 * // 同时配置多个选项
 * dsl.config({
 *   i18n: { locales: {...} },
 *   cache: { maxSize: 5000 },
 *   patterns: {
 *     phone: { cn: /^1[3-9]\d{9}$/ }
 *   }
 * });
 * ```
 */
export interface DslConfigOptions {
  /** i18n 配置 */
  i18n?: I18nConfig;
  /** 缓存配置 */
  cache?: CacheConfig;
  /** 自定义验证规则扩展 */
  patterns?: {
    /** 手机号验证规则 */
    phone?: Record<string, RegExp>;
    /** 身份证验证规则 */
    idCard?: Record<string, RegExp>;
    /** 信用卡验证规则 */
    creditCard?: Record<string, RegExp>;
  };
  /** 向后兼容：手机号验证规则（推荐使用 patterns.phone） */
  phone?: Record<string, RegExp>;
}

// ========== exporters 对象 ==========

/**
 * 导出器集合
 *
 * @description 包含所有导出器的对象
 *
 * @example
 * ```typescript
 * import { exporters } from 'schema-dsl';
 *
 * // 使用 MongoDB 导出器
 * const mongoSchema = exporters.MongoDBExporter.export(schema);
 *
 * // 使用 MySQL 导出器
 * const mysqlDDL = new exporters.MySQLExporter().export(schema, { tableName: 'users' });
 * ```
 */
export const exporters: {
  MongoDBExporter: typeof MongoDBExporter;
  MySQLExporter: typeof MySQLExporter;
  PostgreSQLExporter: typeof PostgreSQLExporter;
  MarkdownExporter: typeof MarkdownExporter;
};

// ========== String 扩展控制 ==========

/**
 * 安装 String 扩展
 *
 * @description 将DSL方法添加到String.prototype，使字符串支持链式调用
 *
 * @example
 * ```typescript
 * import { installStringExtensions } from 'schema-dsl';
 *
 * // 安装扩展
 * installStringExtensions();
 *
 * // 现在可以在字符串上使用DSL方法
 * const schema = dsl({
 *   email: 'email!'.label('邮箱地址').messages({ required: '必填' })
 * });
 * ```
 */
export function installStringExtensions(): void;

/**
 * 卸载 String 扩展
 *
 * @description 从String.prototype移除DSL方法
 *
 * @example
 * ```typescript
 * import { uninstallStringExtensions } from 'schema-dsl';
 *
 * // 卸载扩展
 * uninstallStringExtensions();
 *
 * // 字符串不再支持DSL方法
 * ```
 */
export function uninstallStringExtensions(): void;

// ========== 默认导出 ==========

// ========== 验证器扩展 ==========

/**
 * 自定义关键字
 *
 * @description 扩展ajv的自定义验证关键字
 *
 * @example
 * ```typescript
 * import { CustomKeywords, Validator } from 'schema-dsl';
 *
 * const validator = new Validator();
 * const ajv = validator.getAjv();
 * CustomKeywords.registerAll(ajv);
 * ```
 */
export const CustomKeywords: {
  /**
   * 注册所有自定义关键字到ajv实例
   * @param ajv - ajv实例
   */
  registerAll(ajv: any): void;

  /**
   * 注册元数据关键字
   * @param ajv - ajv实例
   */
  registerMetadataKeywords(ajv: any): void;

  /**
   * 注册字符串验证器
   * @param ajv - ajv实例
   */
  registerStringValidators(ajv: any): void;

  /**
   * 注册数字验证器
   * @param ajv - ajv实例
   */
  registerNumberValidators(ajv: any): void;

  /**
   * 注册对象验证器
   * @param ajv - ajv实例
   */
  registerObjectValidators(ajv: any): void;

  /**
   * 注册数组验证器
   * @param ajv - ajv实例
   */
  registerArrayValidators(ajv: any): void;

  /**
   * 注册日期验证器
   * @param ajv - ajv实例
   */
  registerDateValidators(ajv: any): void;
};

// ========== 常量 ==========

/**
 * SchemaIO 配置常量
 *
 * @description 所有魔法数字和配置项的统一定义
 *
 * @example
 * ```typescript
 * import { CONSTANTS } from 'schema-dsl';
 *
 * console.log(CONSTANTS.VALIDATION.MAX_RECURSION_DEPTH); // 100
 * console.log(CONSTANTS.CACHE.SCHEMA_CACHE.MAX_SIZE);    // 5000
 * ```
 */
export const CONSTANTS: {
  /** 验证配置 */
  VALIDATION: {
    /** 递归深度限制 */
    MAX_RECURSION_DEPTH: number;
    /** 数组大小限制 */
    MAX_ARRAY_SIZE: number;
    /** 字符串长度限制 */
    MAX_STRING_LENGTH: number;
    /** 对象属性数量限制 */
    MAX_OBJECT_KEYS: number;
    /** 验证超时时间（ms） */
    DEFAULT_TIMEOUT: number;
    /** 正则表达式超时（ms） */
    REGEX_TIMEOUT: number;
    /** 自定义验证函数超时（ms） */
    CUSTOM_VALIDATOR_TIMEOUT: number;
    /** 默认选项 */
    DEFAULT_OPTIONS: {
      abortEarly: boolean;
      stripUnknown: boolean;
      convert: boolean;
      presence: string;
      allowUnknown: boolean;
      skipFunctions: boolean;
    };
  };
  /** 缓存配置 */
  CACHE: {
    /** 缓存开关 */
    ENABLED: boolean;
    /** Schema编译缓存 */
    SCHEMA_CACHE: {
      /** 最大缓存条目 */
      MAX_SIZE: number;
      /** 缓存过期时间（ms） */
      TTL: number;
    };
  };
  /** 格式配置 */
  FORMAT: Record<string, any>;
  /** 类型配置 */
  TYPES: Record<string, any>;
  /** 错误配置 */
  ERRORS: Record<string, any>;
};

/**
 * 版本信息
 *
 * @description 当前schema-dsl版本号
 *
 * @example
 * ```typescript
 * import { VERSION } from 'schema-dsl';
 *
 * console.log(`schema-dsl version: ${VERSION}`); // schema-dsl version: 1.0.4
 * ```
 */
export const VERSION: string;

/**
 * 链式条件构建器
 *
 * @description 提供流畅的条件判断 API，类似 JavaScript if-else 语句
 *
 * @example
 * ```typescript
 * import { dsl } from 'schema-dsl';
 *
 * // 简单条件 + 错误消息
 * const schema = dsl({
 *   email: dsl.if((data) => data.age >= 18)
 *     .message('未成年用户不能注册')
 * });
 *
 * // 多条件 and
 * const schema2 = dsl({
 *   email: dsl.if((data) => data.age >= 18)
 *     .and((data) => data.userType === 'admin')
 *     .then('email!')
 * });
 *
 * // 多条件 or
 * const schema3 = dsl({
 *   status: dsl.if((data) => data.age < 18)
 *     .or((data) => data.isBlocked)
 *     .message('不允许注册')
 * });
 * ```
 *
 * @internal
 * 注意：此类不应直接导入使用。请通过 dsl.if() 或 dsl['if']() 返回实例。
 *
 * @example 正确用法
 * ```typescript
 * import { dsl } from 'schema-dsl';
 *
 * // TypeScript
 * const builder = dsl['if'](d => d.age > 18);
 * // 或
 * const builder2 = dsl._if(d => d.age > 18);
 *
 * // JavaScript
 * const builder3 = dsl.if(d => d.age > 18);
 * ```
 */
export class ConditionalBuilder {
  /**
   * 开始条件判断
   * @param condition - 条件函数，接收完整数据对象
   * @returns 当前实例（支持链式调用）
   */
  if(condition: (data: any) => boolean): this;

  /**
   * 添加 AND 条件（与前一个条件组合）
   *
   * @version 1.1.1 支持为每个 .and() 条件设置独立的错误消息
   *
   * @param condition - 条件函数
   * @returns 当前实例（支持链式调用）
   *
   * @example 基础用法（传统 AND 逻辑）
   * ```typescript
   * // 所有条件都为 true 才失败
   * dsl.if(d => d.age >= 18)
   *   .and(d => d.userType === 'admin')
   *   .then('email!')
   * ```
   *
   * @example v1.1.0+ 独立消息（推荐）
   * ```typescript
   * // 每个条件都有自己的错误消息
   * dsl.if(d => !d)
   *   .message('ACCOUNT_NOT_FOUND')
   *   .and(d => d.balance < 100)
   *   .message('INSUFFICIENT_BALANCE')
   *   .assert(account);
   *
   * // 工作原理：链式检查模式
   * // - 第一个条件失败 → 返回 'ACCOUNT_NOT_FOUND'
   * // - 第二个条件失败 → 返回 'INSUFFICIENT_BALANCE'
   * // - 所有条件通过 → 验证成功
   * ```
   *
   * @example 多个 .and() 条件
   * ```typescript
   * dsl.if(d => !d)
   *   .message('NOT_FOUND')
   *   .and(d => d.status !== 'active')
   *   .message('INACTIVE')
   *   .and(d => d.balance < 100)
   *   .message('INSUFFICIENT')
   *   .assert(account);
   * // 依次检查，第一个失败的返回其消息
   * ```
   */
  and(condition: (data: any) => boolean): this;

  /**
   * 添加 OR 条件（与前一个条件组合）
   *
   * @version 1.1.1 支持为 .or() 条件设置独立的错误消息
   *
   * @param condition - 条件函数
   * @returns 当前实例（支持链式调用）
   *
   * @example 基础用法
   * ```typescript
   * // 任一条件为 true 就失败
   * dsl.if((data) => data.age < 18)
   *   .or((data) => data.isBlocked)
   *   .message('不允许注册')
   * ```
   *
   * @example v1.1.0+ 独立消息
   * ```typescript
   * dsl.if(d => d.age < 18)
   *   .message('未成年用户不能注册')
   *   .or(d => d.isBlocked)
   *   .message('账户已被封禁')
   *   .assert(data);
   * // 哪个条件为 true 就返回哪个消息
   * ```
   */
  or(condition: (data: any) => boolean): this;

  /**
   * 添加 else-if 分支
   * @param condition - 条件函数
   * @returns 当前实例（支持链式调用）
   */
  elseIf(condition: (data: any) => boolean): this;

  /**
   * 设置错误消息（支持多语言 key）
   *
   * @version 1.1.1 支持为 .and() 和 .or() 条件设置独立消息
   *
   * 条件为 true 时自动抛出此错误
   *
   * @param msg - 错误消息或多语言 key
   * @returns 当前实例（支持链式调用）
   *
   * @example 基础用法
   * ```typescript
   * // 如果是未成年人（条件为true），抛出错误
   * dsl.if((data) => data.age < 18)
   *   .message('未成年用户不能注册')
   * ```
   *
   * @example v1.1.0+ 为 .and() 设置独立消息
   * ```typescript
   * dsl.if((data) => !data)
   *   .message('账户不存在')
   *   .and((data) => data.balance < 100)
   *   .message('余额不足')
   *   .assert(account);
   * // 每个条件都有自己的错误消息
   * ```
   *
   * @example 链式检查模式说明
   * ```typescript
   * // 启用条件：
   * // 1. 使用 .message() 模式（不是 .then()/.else()）
   * // 2. root 条件有 .message()
   * // 3. 有 .and() 条件
   * // 4. 没有 .or() 条件
   *
   * // ✅ 启用链式检查
   * dsl.if(d => !d).message('A').and(d => d < 100).message('B')
   *
   * // ❌ 不启用（有 .or()）
   * dsl.if(d => !d).message('A').and(d => d < 100).or(d => d > 200).message('B')
   * ```
   */
  message(msg: string): this;

  /**
   * 设置满足条件时的 Schema
   * @param schema - DSL 字符串或 Schema 对象
   * @returns 当前实例（支持链式调用）
   */
  then(schema: string | DslBuilder | JSONSchema): this;

  /**
   * 设置默认 Schema（所有条件都不满足时）
   * 可选：不写 else 就是不验证
   * @param schema - DSL 字符串、Schema 对象或 null
   * @returns 当前实例（支持链式调用）
   */
  else(schema: string | DslBuilder | JSONSchema | null): this;

  /**
   * 快捷验证方法 - 返回完整验证结果
   * @param data - 待验证的数据（任意类型）
   * @param options - 验证选项（可选）
   * @returns 验证结果 { valid, errors, data }
   *
   * @example
   * ```typescript
   * // 一行代码验证
   * const result = dsl.if(d => d.age < 18)
   *   .message('未成年')
   *   .validate({ age: 16 });
   *
   * // 复用验证器
   * const validator = dsl.if(d => d.age < 18).message('未成年');
   * const r1 = validator.validate({ age: 16 });
   * const r2 = validator.validate({ age: 20 });
   * ```
   */
  validate<T = any>(data: T, options?: ValidateOptions): ValidationResult<T>;

  /**
   * 异步验证方法 - 失败自动抛出异常
   * @param data - 待验证的数据
   * @param options - 验证选项（可选）
   * @returns 验证通过返回数据，失败抛出异常
   * @throws ValidationError 验证失败抛出异常
   *
   * @example
   * ```typescript
   * // 异步验证，失败自动抛错
   * try {
   *   const data = await dsl.if(d => d.age < 18)
   *     .message('未成年')
   *     .validateAsync({ age: 16 });
   * } catch (error) {
   *   console.log(error.message);
   * }
   *
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
   * ```
   */
  validateAsync<T = any>(data: T, options?: ValidateOptions): Promise<T>;

  /**
   * 断言方法 - 同步验证，失败直接抛错
   * @param data - 待验证的数据
   * @param options - 验证选项（可选）
   * @returns 验证通过返回数据
   * @throws Error 验证失败抛出错误
   *
   * @example
   * ```typescript
   * // 断言验证，失败直接抛错
   * try {
   *   dsl.if(d => d.age < 18)
   *     .message('未成年')
   *     .assert({ age: 16 });
   * } catch (error) {
   *   console.log(error.message);
   * }
   *
   * // 函数中快速断言
   * function registerUser(userData: any) {
   *   dsl.if(d => d.age < 18)
   *     .message('未成年用户不能注册')
   *     .assert(userData);
   *
   *   // 验证通过，继续处理...
   *   return createUser(userData);
   * }
   * ```
   */
  assert<T = any>(data: T, options?: ValidateOptions): T;

  /**
   * 快捷检查方法 - 只返回 boolean
   * @param data - 待验证的数据
   * @returns 验证是否通过
   *
   * @example
   * ```typescript
   * // 快速判断
   * const isValid = dsl.if(d => d.age < 18)
   *   .message('未成年')
   *   .check({ age: 16 });
   * // => false
   *
   * // 断言场景
   * if (!validator.check(userData)) {
   *   console.log('验证失败');
   * }
   * ```
   */
  check(data: any): boolean;
}

/**
 * 默认导出（dsl函数）
 *
 * @example
 * ```typescript
 * import schema-dsl from 'schema-dsl';
 *
 * const schema = schema-dsl({
 *   username: 'string:3-32!',
 *   email: 'email!'
 * });
 * ```
 */
export default dsl;
