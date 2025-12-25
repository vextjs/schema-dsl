// Type definitions for SchemaIO v2.0.1
// Project: https://github.com/schemaio/schemaio
// Definitions by: SchemaIO Team


declare module 'schemaio' {
  // ========== 核心类型 ==========

  /**
   * JSON Schema 对象
   */
  export interface JSONSchema {
    type?: string | string[];
    properties?: Record<string, JSONSchema>;
    required?: string[];
    minLength?: number;
    maxLength?: number;
    minimum?: number;
    maximum?: number;
    pattern?: string;
    format?: string;
    enum?: any[];
    items?: JSONSchema;
    [key: string]: any;
  }

  /**
   * 验证结果
   */
  export interface ValidationResult {
    valid: boolean;
    errors?: ValidationError[];
    data?: any;
  }

  /**
   * 验证错误
   */
  export interface ValidationError {
    message: string;
    path: string;
    keyword: string;
    params?: Record<string, any>;
  }

  /**
   * 错误消息对象
   */
  export interface ErrorMessages {
    min?: string;
    max?: string;
    pattern?: string;
    format?: string;
    enum?: string;
    email?: string;
    url?: string;
    required?: string;
    [key: string]: string | undefined;
  }

  // ========== DslBuilder 类 ==========

  /**
   * DSL Builder 类
   *
   * @example
   * ```typescript
   * const builder = new DslBuilder('email!');
   * builder.pattern(/custom/).label('邮箱地址');
   * ```
   */
  export class DslBuilder {
    constructor(dslString: string);

    /**
     * 添加正则验证
     */
    pattern(regex: RegExp | string, message?: string): this;

    /**
     * 设置字段标签
     */
    label(text: string): this;

    /**
     * 自定义错误消息
     */
    messages(messages: ErrorMessages): this;

    /**
     * 设置描述
     */
    description(text: string): this;

    /**
     * 添加自定义验证器
     */
    custom(validator: (value: any) => boolean | Promise<boolean> | { error: string; message: string }): this;

    /**
     * 条件验证
     */
    when(refField: string, options: {
      is: any;
      then: DslBuilder | JSONSchema;
      otherwise?: DslBuilder | JSONSchema;
    }): this;

    /**
     * 设置默认值
     */
    default(value: any): this;

    /**
     * 转为JSON Schema
     */
    toSchema(): JSONSchema;

    /**
     * 验证数据
     */
    validate(data: any, context?: any): Promise<ValidationResult>;

    /**
     * 用户名验证（自动设置合理约束）
     * @param preset - 预设: 'short'(3-16) | 'medium'(3-32) | 'long'(3-64) | '5-20'等范围字符串
     */
    username(preset?: 'short' | 'medium' | 'long' | string | { minLength?: number; maxLength?: number; allowUnderscore?: boolean; allowNumber?: boolean }): this;

    /**
     * 密码强度验证
     * @param strength - 强度: 'weak' | 'medium' | 'strong' | 'veryStrong'
     */
    password(strength?: 'weak' | 'medium' | 'strong' | 'veryStrong'): this;

    /**
     * 手机号验证
     * @param country - 国家代码: 'cn' | 'us' | 'uk' | 'hk' | 'tw' | 'international'
     */
    phone(country?: 'cn' | 'us' | 'uk' | 'hk' | 'tw' | 'international'): this;
  }

  // ========== String 扩展 ==========

  /**
   * String 扩展全局接口
   * 让字符串直接支持链式调用
   *
   * @example
   * ```typescript
   * const schema = dsl({
   *   email: 'email!'.pattern(/custom/).label('邮箱')
   * });
   * ```
   */
  global {
    interface String {
      pattern(regex: RegExp | string, message?: string): DslBuilder;
      label(text: string): DslBuilder;
      messages(messages: ErrorMessages): DslBuilder;
      description(text: string): DslBuilder;
      custom(validator: (value: any) => boolean | Promise<boolean> | { error: string; message: string }): DslBuilder;
      when(refField: string, options: { is: any; then: DslBuilder | JSONSchema; otherwise?: DslBuilder | JSONSchema }): DslBuilder;
      default(value: any): DslBuilder;
      toSchema(): JSONSchema;
      /** 用户名验证 */
      username(preset?: 'short' | 'medium' | 'long' | string): DslBuilder;
      /** 密码强度验证 */
      password(strength?: 'weak' | 'medium' | 'strong' | 'veryStrong'): DslBuilder;
      /** 手机号验证 */
      phone(country?: 'cn' | 'us' | 'uk' | 'hk' | 'tw' | 'international'): DslBuilder;
    }
  }

  // ========== dsl() 函数 ==========

  /**
   * DSL 定义对象
   */
  export type DslDefinition = string | DslBuilder | {
    [key: string]: DslDefinition;
  };

  /**
   * dsl() 函数
   *
   * @example
   * ```typescript
   * // 字符串：返回 DslBuilder
   * const builder = dsl('email!');
   *
   * // 对象：返回 JSON Schema
   * const schema = dsl({
   *   username: 'string:3-32!',
   *   email: 'email!'
   * });
   * ```
   */
  export function dsl(definition: string): DslBuilder;
  export function dsl(definition: Record<string, DslDefinition>): JSONSchema;
  export function dsl(definition: string | Record<string, DslDefinition>): DslBuilder | JSONSchema;

  /**
   * 全局配置
   */
  export namespace dsl {
    /**
     * 全局配置
     */
    export function config(options: {
      patterns?: {
        phone?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>;
        idCard?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>;
        creditCard?: Record<string, { pattern: RegExp; msg?: string }>;
      };
      phone?: Record<string, { pattern: RegExp; min?: number; max?: number; key?: string }>; // 兼容旧版
      locales?: Record<string, ErrorMessages> | string;
    }): void;

    /**
     * 匹配规则
     */
    export function match(value: any, cases: Record<string, any>): any;

    /**
     * 条件规则
     * (Note: exposed as dsl.if in JavaScript)
     */
    export const _if: (condition: any, thenSchema: any, elseSchema?: any) => any;
  }

  // ========== Validator 类 ==========

  /**
   * Validator 选项
   */
  export interface ValidatorOptions {
    allErrors?: boolean;
    verbose?: boolean;
    [key: string]: any;
  }

  /**
   * 验证器类
   *
   * @example
   * ```typescript
   * const validator = new Validator();
   * const result = validator.validate(schema, data);
   * ```
   */
  export class Validator {
    constructor(options?: ValidatorOptions);
    validate(schema: JSONSchema, data: any): ValidationResult;
    getAjv(): any;
  }

  /**
   * 便捷验证方法（推荐）
   * 使用默认的单例Validator，无需new
   *
   * @example
   * ```typescript
   * import { dsl, validate } from 'schemaio';
   *
   * const schema = dsl({ email: 'email!' });
   * const result = validate(schema, { email: 'test@example.com' });
   * ```
   */
  export function validate(schema: JSONSchema, data: any): ValidationResult;

  /**
   * 获取默认Validator实例（单例）
   *
   * @example
   * ```typescript
   * import { getDefaultValidator } from 'schemaio';
   *
   * const validator = getDefaultValidator();
   * ```
   */
  export function getDefaultValidator(): Validator;

  // ========== 导出器 ==========

  /**
   * MongoDB 导出器
   */
  export class MongoDBExporter {
    constructor(options?: { strict?: boolean });
    export(schema: JSONSchema): any;
    generateCommand(collectionName: string, schema: JSONSchema): string;
  }

  /**
   * MySQL 导出器
   */
  export class MySQLExporter {
    constructor();
    export(schema: JSONSchema, options?: { tableName: string }): string;
  }

  /**
   * PostgreSQL 导出器
   */
  export class PostgreSQLExporter {
    constructor();
    export(schema: JSONSchema, options?: { tableName: string }): string;
  }

  /**
   * 导出器命名空间
   */
  export namespace exporters {
    export { MongoDBExporter, MySQLExporter, PostgreSQLExporter };
  }

  // ========== 工具函数 ==========

  /**
   * 类型转换工具
   */
  export class TypeConverter {
    static toJSONSchemaType(simpleType: string): JSONSchema;
    static toMongoDBType(jsonSchemaType: string): string;
    static toMySQLType(jsonSchemaType: string, constraints?: Record<string, any>): string;
    static toPostgreSQLType(jsonSchemaType: string, constraints?: Record<string, any>): string;
    static normalizePropertyName(name: string, style?: 'snake_case' | 'camelCase'): string;
    static formatToRegex(format: string): string | null;
    static mergeSchemas(base: JSONSchema, override: JSONSchema): JSONSchema;
    static extractConstraints(schema: JSONSchema): Record<string, any>;
  }

  /**
   * Schema 辅助工具
   */
  export class SchemaHelper {
    static merge(schema1: JSONSchema, schema2: JSONSchema): JSONSchema;
    static clone(schema: JSONSchema): JSONSchema;
  }

  /**
   * Schema 工具类 (v2.0.1)
   */
  export class SchemaUtils {
    /** 创建可复用的Schema片段 */
    static reusable<T>(factory: () => T): () => T;
    /** 创建Schema片段库 */
    static createLibrary<T extends Record<string, () => any>>(fragments: T): T;
    /** 合并多个Schema */
    static merge(...schemas: JSONSchema[]): JSONSchema;
    /** 扩展Schema */
    static extend(baseSchema: JSONSchema, extensions: Record<string, any>): JSONSchema;
    /** 挑选Schema的部分字段 */
    static pick(schema: JSONSchema, fields: string[]): JSONSchema;
    /** 排除Schema的部分字段 */
    static omit(schema: JSONSchema, fields: string[]): JSONSchema;
    /** 创建带性能监控的Validator */
    static withPerformance(validator: Validator): Validator;
    /** 批量验证 */
    static validateBatch(schema: JSONSchema, dataArray: any[], validator: Validator): {
      results: Array<{ index: number; valid: boolean; errors: any; data: any }>;
      summary: { total: number; valid: number; invalid: number; duration: number; averageTime: number };
    };
    /** 检查嵌套深度 */
    static validateNestingDepth(schema: JSONSchema, maxDepth?: number): {
      valid: boolean;
      depth: number;
      path: string;
      message: string;
    };
    /** 导出为Markdown */
    static toMarkdown(schema: JSONSchema, options?: { title?: string; locale?: string }): string;
    /** 导出为HTML */
    static toHTML(schema: JSONSchema, options?: { title?: string }): string;
    /** 克隆Schema */
    static clone(schema: JSONSchema): JSONSchema;
  }

  // ========== 错误代码 ==========

  /**
   * 错误代码常量
   */
  export namespace ErrorCodes {
    const min: { code: string; message: string; zhCN: string };
    const max: { code: string; message: string; zhCN: string };
    const email: { code: string; message: string; zhCN: string };
    const url: { code: string; message: string; zhCN: string };
    const pattern: { code: string; message: string; zhCN: string };
    const required: { code: string; message: string; zhCN: string };
  }

  // ========== 多语言 ==========

  /**
   * 多语言支持
   */
  export class Locale {
    static setLocale(lang: 'en-US' | 'zh-CN' | string): void;
    static getLocale(): string;
    static addLocale(locale: string, messages: ErrorMessages): void;
    static setMessages(messages: ErrorMessages): void;
    static getMessage(type: string, customMessages?: ErrorMessages): string;
    static getAvailableLocales(): string[];
  }

  // ========== String 扩展控制 ==========

  /**
   * 安装 String 扩展
   */
  export function installStringExtensions(): void;

  /**
   * 卸载 String 扩展
   */
  export function uninstallStringExtensions(): void;
}

