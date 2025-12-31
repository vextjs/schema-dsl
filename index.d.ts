// Type definitions for schema-dsl v1.0.3
// Project: https://github.com/vextjs/schema-dsl
// Definitions by: schema-dsl Team


declare module 'schema-dsl' {
  // ========== 核心类型 ==========

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
     * 构造函数
     * @param dslString - DSL字符串（如 'email!', 'string:3-32!'）
     * 
     * @example
     * ```typescript
     * const builder = new DslBuilder('email!');
     * const builder2 = new DslBuilder('string:3-32');
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
    custom(validator: (value: any) => boolean | Promise<boolean> | { error: string; message: string }): this;

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
    when(refField: string, options: {
      is: any;
      then: DslBuilder | JSONSchema;
      otherwise?: DslBuilder | JSONSchema;
    }): this;

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
    username(preset?: 'short' | 'medium' | 'long' | string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean }): this;

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
    password(strength?: 'weak' | 'medium' | 'strong' | 'veryStrong'): this;

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
    phone(country?: 'cn' | 'us' | 'uk' | 'hk' | 'tw' | 'international'): this;
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
  global {
    interface String {
      /**
       * 添加正则验证
       * @deprecated TypeScript 用户请使用 dsl(string).pattern()
       */
      pattern(regex: RegExp | string, message?: string): DslBuilder;

      /**
       * 设置字段标签
       * @deprecated TypeScript 用户请使用 dsl(string).label()
       */
      label(text: string): DslBuilder;

      /**
       * 自定义错误消息
       * @deprecated TypeScript 用户请使用 dsl(string).messages()
       */
      messages(messages: ErrorMessages): DslBuilder;

      /**
       * 设置描述
       * @deprecated TypeScript 用户请使用 dsl(string).description()
       */
      description(text: string): DslBuilder;

      /**
       * 自定义验证器
       * @deprecated TypeScript 用户请使用 dsl(string).custom()
       */
      custom(validator: (value: any) => boolean | Promise<boolean> | { error: string; message: string }): DslBuilder;

      /**
       * 条件验证
       * @deprecated TypeScript 用户请使用 dsl(string).when()
       */
      when(refField: string, options: { is: any; then: DslBuilder | JSONSchema; otherwise?: DslBuilder | JSONSchema }): DslBuilder;

      /**
       * 设置默认值
       * @deprecated TypeScript 用户请使用 dsl(string).default()
       */
      default(value: any): DslBuilder;

      /**
       * 转为 JSON Schema
       * @deprecated TypeScript 用户请使用 dsl(string).toSchema()
       */
      toSchema(): JSONSchema;

      /**
       * 用户名验证
       * @deprecated TypeScript 用户请使用 dsl(string).username()
       */
      username(preset?: 'short' | 'medium' | 'long' | string): DslBuilder;

      /**
       * 密码强度验证
       * @deprecated TypeScript 用户请使用 dsl(string).password()
       */
      password(strength?: 'weak' | 'medium' | 'strong' | 'veryStrong'): DslBuilder;

      /**
       * 手机号验证
       * @deprecated TypeScript 用户请使用 dsl(string).phone()
       */
      phone(country?: 'cn' | 'us' | 'uk' | 'hk' | 'tw' | 'international'): DslBuilder;
    }
  }

  // ========== dsl() 函数 ==========

  /**
   * DSL 定义对象
   * 
   * @description 支持多种类型的Schema定义
   */
  export type DslDefinition = string | DslBuilder | {
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
   * @description SchemaIO的核心函数，用于创建Schema定义
   * 
   * @example
   * ```typescript
   * // 1. 字符串：返回 DslBuilder（用于进一步配置）
   * const builder = dsl('email!');
   * builder.label('邮箱地址').messages({ required: '必填' });
   * 
   * // 2. 对象：返回 SchemaIO 实例（用于验证）
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
   * // 4. 验证数据
   * const result = schema.validate({ username: 'test' });
   * ```
   */
  export function dsl(definition: string): DslBuilder;
  export function dsl(definition: Record<string, DslDefinition>, options?: SchemaIOOptions): SchemaIO;
  export function dsl(definition: string | Record<string, DslDefinition>, options?: SchemaIOOptions): DslBuilder | SchemaIO;

  /**
   * SchemaIO 类
   * 
   * @description 编译后的Schema实例，用于数据验证
   * 
   * @example
   * ```typescript
   * const schema = dsl({
   *   username: 'string:3-32!',
   *   email: 'email!'
   * });
   * 
   * // 验证数据
   * const result = schema.validate({ username: 'test', email: 'test@example.com' });
   * 
   * // 快速验证（仅返回true/false）
   * const isValid = schema.fastValidate(data);
   * 
   * // 导出为JSON Schema
   * const jsonSchema = schema.toJsonSchema();
   * 
   * // 导出为数据库Schema
   * const mongoSchema = schema.toMongoDB('users');
   * const mysqlSchema = schema.toMySQL('users');
   * ```
   */
  export class SchemaIO {
    /**
     * 验证数据
     * @param data - 要验证的数据
     * @param options - 验证选项
     * @returns 验证结果
     */
    validate<T = any>(data: any, options?: ValidatorOptions): ValidationResult<T>;

    /**
     * 快速验证（仅返回布尔值）
     * @param data - 要验证的数据
     * @returns 是否通过验证
     */
    fastValidate(data: any): boolean;

    /**
     * 转为JSON Schema
     * @param options - 导出选项
     * @returns JSON Schema对象
     */
    toJsonSchema(options?: { version?: 'draft-04' | 'draft-06' | 'draft-07' }): JSONSchema;

    /**
     * 导出为MongoDB Schema
     * @param collectionName - 集合名称
     * @param options - 导出选项
     * @returns MongoDB Schema定义
     */
    toMongoDB(collectionName: string, options?: { strict?: boolean }): any;

    /**
     * 导出为MySQL Schema
     * @param tableName - 表名
     * @param options - 导出选项
     * @returns MySQL CREATE TABLE语句
     */
    toMySQL(tableName: string, options?: { engine?: string; charset?: string }): string;

    /**
     * 导出为PostgreSQL Schema
     * @param tableName - 表名
     * @param options - 导出选项
     * @returns PostgreSQL CREATE TABLE语句
     */
    toPostgreSQL(tableName: string, options?: any): string;

    /**
     * 清理缓存
     */
    clearCache(): void;

    /**
     * 获取缓存统计
     * @returns 缓存统计信息
     */
    getCacheStats(): { hits: number; misses: number; size: number };

    /**
     * 编译Schema（预热）
     */
    compile(): void;
  }

  /**
   * 全局配置
   * 
   * @description dsl命名空间的全局配置和工具方法
   */
  export namespace dsl {
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
        phone?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>;
        /** 身份证号规则 */
        idCard?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>;
        /** 信用卡号规则 */
        creditCard?: Record<string, { pattern: RegExp; msg?: string }>;
      };
      /** 手机号规则（兼容旧版） */
      phone?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>;
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
     * 条件规则
     * 
     * @description 根据条件选择不同的Schema（JavaScript中使用 dsl.if）
     * 
     * @example
     * ```typescript
     * const schema = dsl({
     *   age: 'number',
     *   license: dsl._if(
     *     (data) => data.age >= 18,
     *     { hasLicense: 'boolean!' },
     *     { hasLicense: 'boolean' }
     *   )
     * });
     * ```
     */
    export const _if: (condition: any, thenSchema: any, elseSchema?: any) => any;

    /**
     * 设置默认语言
     * 
     * @param locale - 语言代码
     * 
     * @example
     * ```typescript
     * dsl.setLocale('zh-CN');
     * dsl.setLocale('en-US');
     * ```
     */
    export function setLocale(locale: string): void;

    /**
     * 获取当前语言
     * 
     * @returns 当前语言代码
     */
    export function getLocale(): string;

    /**
     * 获取可用的语言列表
     * 
     * @returns 语言代码数组
     */
    export function getLocales(): string[];

    /**
     * 添加自定义语言包
     * 
     * @param locale - 语言代码
     * @param messages - 错误消息
     * 
     * @example
     * ```typescript
     * dsl.addMessages('ja-JP', {
     *   required: '必須項目です',
     *   min: '{{#limit}}文字以上必要です'
     * });
     * ```
     */
    export function addMessages(locale: string, messages: ErrorMessages): void;
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
     * @returns 验证结果
     */
    validate<T = any>(schema: JSONSchema, data: any): ValidationResult<T>;

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
   * const result = validate(schema, { email: 'test@example.com' });
   * 
   * if (result.valid) {
   *   console.log('验证通过');
   * }
   * ```
   */
  export function validate<T = any>(schema: JSONSchema | SchemaIO, data: any): ValidationResult<T>;

  /**
   * 便捷异步验证方法（推荐）
   *
   * @description
   * - 异步验证数据，验证失败时抛出 ValidationError
   * - 推荐在异步场景下使用此方法
   * - 验证成功返回验证后的数据，失败抛出异常
   *
   * @param schema - JSON Schema对象或SchemaIO实例
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
    schema: JSONSchema | SchemaIO,
    data: any,
    options?: ValidatorOptions
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
    readonly name: 'ValidationError';

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
    static toMySQLType(jsonSchemaType: string, constraints?: Record<string, any>): string;

    /**
     * 转换为PostgreSQL类型
     * @param jsonSchemaType - JSON Schema类型
     * @param constraints - 约束条件
     * @returns PostgreSQL类型字符串
     */
    static toPostgreSQLType(jsonSchemaType: string, constraints?: Record<string, any>): string;

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
    static normalizePropertyName(name: string, style?: 'snake_case' | 'camelCase'): string;

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
    static extend(baseSchema: JSONSchema, extensions: Record<string, any>): JSONSchema;

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
    static validateBatch(schema: JSONSchema, dataArray: any[], validator: Validator): {
      results: Array<{ index: number; valid: boolean; errors: any; data: any }>;
      summary: { total: number; valid: number; invalid: number; duration: number; averageTime: number };
    };

    /**
     * 检查嵌套深度
     * @param schema - JSON Schema对象
     * @param maxDepth - 最大深度（默认10）
     * @returns 检查结果
     */
    static validateNestingDepth(schema: JSONSchema, maxDepth?: number): {
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
    static toMarkdown(schema: JSONSchema, options?: { title?: string; locale?: string }): string;

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
    static setLocale(lang: 'en-US' | 'zh-CN' | 'ja-JP' | 'fr-FR' | 'es-ES' | string): void;

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
   *
   * // 使用 ajv.addKeyword() 添加自定义关键字
   * ```
   */
  export const CustomKeywords: any;

  // ========== dsl.config 选项（v2.3.0+）==========

  /**
   * i18n 配置选项（v2.3.0+）
   */
  export interface I18nConfig {
    /** 语言包目录路径 */
    localesPath?: string;
    /** 直接传入的语言包 */
    locales?: Record<string, ErrorMessages>;
  }

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

  // ========== Express/Koa 中间件 ==========

  /**
   * Express/Koa中间件选项
   * 
   * @description 验证中间件的配置选项
   */
  export interface MiddlewareOptions {
    /** 验证请求体 */
    body?: SchemaIO | JSONSchema;
    /** 验证URL查询参数 */
    query?: SchemaIO | JSONSchema;
    /** 验证URL路径参数 */
    params?: SchemaIO | JSONSchema;
    /** 验证请求头 */
    headers?: SchemaIO | JSONSchema;
    /** 错误处理函数 */
    onError?: (errors: ValidationError[], req: any, res: any, next: any) => void;
  }

  /**
   * Express/Koa验证中间件
   * 
   * @description 创建验证中间件，自动验证请求数据
   * 
   * @example
   * ```typescript
   * import express from 'express';
   * import schema-dsl from 'schema-dsl';
   * 
   * const app = express();
   * app.use(express.json());
   * 
   * // 定义Schema
   * const userSchema = schema-dsl({
   *   username: 'string:3-32!',
   *   email: 'email!',
   *   age: 'number:18-100'
   * });
   * 
   * // 使用中间件
   * app.post('/api/user', 
   *   schema-dsl.middleware({ body: userSchema }),
   *   (req, res) => {
   *     // req.body 已经通过验证
   *     res.json({ success: true, data: req.body });
   *   }
   * );
   * 
   * // 自定义错误处理
   * app.post('/api/user2', 
   *   schema-dsl.middleware({ 
   *     body: userSchema,
   *     onError: (errors, req, res, next) => {
   *       res.status(400).json({
   *         success: false,
   *         errors: errors.map(e => ({
   *           field: e.field,
   *           message: e.message
   *         }))
   *       });
   *     }
   *   }),
   *   (req, res) => {
   *     res.json({ success: true });
   *   }
   * );
   * ```
   */
  export function middleware(options: MiddlewareOptions): (req: any, res: any, next: any) => void;

  // ========== 默认导出 ==========

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
}

