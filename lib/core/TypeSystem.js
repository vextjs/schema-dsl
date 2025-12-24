// lib/core/TypeSystem.js

const CONSTANTS = require('../config/constants');

/**
 * 类型系统
 * 管理所有内置类型和自定义类型
 *
 * @class TypeSystem
 */
class TypeSystem {
  constructor() {
    this.types = new Map();
    this.aliases = new Map();
    this._registerBuiltinTypes();
  }

  /**
   * 注册内置类型
   * @private
   */
  _registerBuiltinTypes() {
    // 懒加载内置类型
    this.register('string', () => require('../types/StringType'));
    this.register('number', () => require('../types/NumberType'));
    this.register('boolean', () => require('../types/BooleanType'));
    this.register('date', () => require('../types/DateType'));
    this.register('object', () => require('../types/ObjectType'));
    this.register('array', () => require('../types/ArrayType'));
    this.register('any', () => require('../types/BaseType'));
  }

  /**
   * 注册类型
   * @param {string} name - 类型名称
   * @param {Function|Class} TypeClass - 类型类或懒加载函数
   * @throws {Error} 如果类型名已存在
   */
  register(name, TypeClass) {
    if (this.types.has(name)) {
      throw new Error(`Type '${name}' is already registered`);
    }
    this.types.set(name, TypeClass);
  }

  /**
   * 注销类型
   * @param {string} name - 类型名称
   * @returns {boolean} 是否成功注销
   */
  unregister(name) {
    // 不允许注销内置类型
    const builtinTypes = ['string', 'number', 'boolean', 'date', 'object', 'array', 'any'];
    if (builtinTypes.includes(name)) {
      throw new Error(`Cannot unregister builtin type '${name}'`);
    }
    return this.types.delete(name);
  }

  /**
   * 创建类型实例
   * @param {string} name - 类型名称
   * @param {Object} [options={}] - 类型选项
   * @returns {Object} 类型实例
   * @throws {Error} 如果类型不存在
   */
  create(name, options = {}) {
    // 检查别名
    const actualName = this.aliases.get(name) || name;

    const TypeClass = this.types.get(actualName);
    if (!TypeClass) {
      throw new Error(`Unknown type: ${actualName}`);
    }

    // 如果是懒加载函数，先加载
    const ResolvedTypeClass = typeof TypeClass === 'function' && !TypeClass.prototype
      ? TypeClass()
      : TypeClass;

    return new ResolvedTypeClass(options);
  }

  /**
   * 检查类型是否存在
   * @param {string} name - 类型名称
   * @returns {boolean}
   */
  has(name) {
    const actualName = this.aliases.get(name) || name;
    return this.types.has(actualName);
  }

  /**
   * 获取所有类型名称
   * @returns {Array<string>}
   */
  getTypeNames() {
    return Array.from(this.types.keys());
  }

  /**
   * 注册类型别名
   * @param {string} alias - 别名
   * @param {string} typeName - 实际类型名
   * @throws {Error} 如果类型不存在
   */
  alias(alias, typeName) {
    if (!this.types.has(typeName)) {
      throw new Error(`Cannot create alias '${alias}' for unknown type '${typeName}'`);
    }
    if (this.types.has(alias)) {
      throw new Error(`Alias '${alias}' conflicts with existing type`);
    }
    this.aliases.set(alias, typeName);
  }

  /**
   * 获取类型信息
   * @param {string} name - 类型名称
   * @returns {Object|null} 类型信息
   */
  getTypeInfo(name) {
    const actualName = this.aliases.get(name) || name;
    const TypeClass = this.types.get(actualName);

    if (!TypeClass) {
      return null;
    }

    // 如果是懒加载函数，先加载
    const ResolvedTypeClass = typeof TypeClass === 'function' && !TypeClass.prototype
      ? TypeClass()
      : TypeClass;

    return {
      name: actualName,
      isBuiltin: ['string', 'number', 'boolean', 'date', 'object', 'array', 'any'].includes(actualName),
      isAlias: name !== actualName,
      actualName: actualName,
      constructor: ResolvedTypeClass
    };
  }

  /**
   * 克隆类型系统
   * @returns {TypeSystem} 新的类型系统实例
   */
  clone() {
    const cloned = new TypeSystem();

    // 复制自定义类型（跳过内置类型，因为会自动注册）
    for (const [name, TypeClass] of this.types.entries()) {
      if (!['string', 'number', 'boolean', 'date', 'object', 'array', 'any'].includes(name)) {
        cloned.types.set(name, TypeClass);
      }
    }

    // 复制别名
    for (const [alias, typeName] of this.aliases.entries()) {
      cloned.aliases.set(alias, typeName);
    }

    return cloned;
  }

  /**
   * 清除所有自定义类型和别名
   */
  clear() {
    // 保留内置类型
    const builtinTypes = new Map();
    ['string', 'number', 'boolean', 'date', 'object', 'array', 'any'].forEach(name => {
      if (this.types.has(name)) {
        builtinTypes.set(name, this.types.get(name));
      }
    });

    this.types = builtinTypes;
    this.aliases.clear();
  }
}

module.exports = TypeSystem;

