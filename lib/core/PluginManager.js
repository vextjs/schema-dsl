/**
 * 插件管理器
 * 
 * @description SchemaIO 插件系统的核心类，负责插件的注册、加载和生命周期管理
 * @module lib/core/PluginManager
 * @version 2.2.0
 */

const EventEmitter = require('events');

/**
 * 插件生命周期钩子
 * @typedef {Object} PluginHooks
 * @property {Function} onBeforeRegister - 注册前钩子
 * @property {Function} onAfterRegister - 注册后钩子
 * @property {Function} onBeforeValidate - 验证前钩子
 * @property {Function} onAfterValidate - 验证后钩子
 * @property {Function} onError - 错误处理钩子
 */

/**
 * 插件配置
 * @typedef {Object} PluginConfig
 * @property {string} name - 插件名称（必填）
 * @property {string} version - 插件版本
 * @property {string} description - 插件描述
 * @property {Function} install - 插件安装函数（必填）
 * @property {Function} [uninstall] - 插件卸载函数
 * @property {PluginHooks} [hooks] - 生命周期钩子
 * @property {Object} [options] - 插件选项
 */

class PluginManager extends EventEmitter {
  constructor() {
    super();
    
    /**
     * 已注册的插件
     * @type {Map<string, PluginConfig>}
     */
    this.plugins = new Map();
    
    /**
     * 钩子函数集合
     * @type {Map<string, Array<Function>>}
     */
    this.hooks = new Map();
    
    /**
     * 插件上下文
     * @type {Object}
     */
    this.context = {
      plugins: this.plugins,
      hooks: this.hooks
    };
    
    // 初始化钩子
    this._initializeHooks();
  }

  /**
   * 初始化默认钩子
   * @private
   */
  _initializeHooks() {
    const defaultHooks = [
      'onBeforeRegister',
      'onAfterRegister',
      'onBeforeValidate',
      'onAfterValidate',
      'onError',
      'onBeforeExport',
      'onAfterExport',
      'onBeforeCompile',
      'onAfterCompile'
    ];

    defaultHooks.forEach(hookName => {
      this.hooks.set(hookName, []);
    });
  }

  /**
   * 注册插件
   * 
   * @param {PluginConfig} plugin - 插件配置
   * @throws {Error} 插件配置无效时抛出错误
   * 
   * @example
   * ```javascript
   * const pluginManager = new PluginManager();
   * 
   * pluginManager.register({
   *   name: 'custom-validator',
   *   version: '1.0.0',
   *   install(schemaio, options) {
   *     // 安装逻辑
   *   }
   * });
   * ```
   */
  register(plugin) {
    // 验证插件配置
    this._validatePlugin(plugin);

    const { name } = plugin;

    // 检查插件是否已注册
    if (this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" is already registered`);
    }

    // 触发注册前钩子
    this._runHook('onBeforeRegister', plugin);

    // 注册插件
    this.plugins.set(name, plugin);

    // 注册插件的钩子
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        this.hook(hookName, plugin.hooks[hookName]);
      });
    }

    // 触发注册后钩子
    this._runHook('onAfterRegister', plugin);

    // 触发事件
    this.emit('plugin:registered', plugin);

    return this;
  }

  /**
   * 验证插件配置
   * @private
   * @param {PluginConfig} plugin - 插件配置
   * @throws {Error} 配置无效时抛出错误
   */
  _validatePlugin(plugin) {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Plugin must be an object');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid name');
    }

    if (!plugin.install || typeof plugin.install !== 'function') {
      throw new Error('Plugin must have an install function');
    }
  }

  /**
   * 安装插件
   * 
   * @param {Object} schemaio - SchemaIO 实例
   * @param {string} [pluginName] - 插件名称（可选，如果不指定则安装所有插件）
   * @param {Object} [options] - 安装选项
   * 
   * @example
   * ```javascript
   * // 安装单个插件
   * pluginManager.install(schemaio, 'custom-validator', { strict: true });
   * 
   * // 安装所有插件
   * pluginManager.install(schemaio);
   * ```
   */
  install(schemaio, pluginName, options = {}) {
    if (!pluginName) {
      // 安装所有插件
      this.plugins.forEach((plugin, name) => {
        this._installPlugin(schemaio, plugin, options);
      });
      return this;
    }

    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    this._installPlugin(schemaio, plugin, options);
    return this;
  }

  /**
   * 安装单个插件
   * @private
   * @param {Object} schemaio - SchemaIO 实例
   * @param {PluginConfig} plugin - 插件配置
   * @param {Object} options - 安装选项
   */
  _installPlugin(schemaio, plugin, options = {}) {
    try {
      // 合并选项
      const pluginOptions = { ...plugin.options, ...options };

      // 执行安装函数
      plugin.install(schemaio, pluginOptions, this.context);

      // 触发事件
      this.emit('plugin:installed', plugin);
    } catch (error) {
      this.emit('plugin:error', { plugin, error });
      throw new Error(`Failed to install plugin "${plugin.name}": ${error.message}`);
    }
  }

  /**
   * 卸载插件
   * 
   * @param {string} pluginName - 插件名称
   * @param {Object} schemaio - SchemaIO 实例
   * 
   * @example
   * ```javascript
   * pluginManager.uninstall('custom-validator', schemaio);
   * ```
   */
  uninstall(pluginName, schemaio) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    // 执行卸载函数（如果有）
    if (plugin.uninstall && typeof plugin.uninstall === 'function') {
      try {
        plugin.uninstall(schemaio, this.context);
      } catch (error) {
        this.emit('plugin:error', { plugin, error });
        throw new Error(`Failed to uninstall plugin "${pluginName}": ${error.message}`);
      }
    }

    // 移除插件的钩子
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach(hookName => {
        this.unhook(hookName, plugin.hooks[hookName]);
      });
    }

    // 从注册表中移除
    this.plugins.delete(pluginName);

    // 触发事件
    this.emit('plugin:uninstalled', plugin);

    return this;
  }

  /**
   * 注册钩子函数
   * 
   * @param {string} hookName - 钩子名称
   * @param {Function} handler - 钩子处理函数
   * 
   * @example
   * ```javascript
   * pluginManager.hook('onBeforeValidate', (schema, data) => {
   *   console.log('Before validation:', schema, data);
   * });
   * ```
   */
  hook(hookName, handler) {
    if (typeof handler !== 'function') {
      throw new Error('Hook handler must be a function');
    }

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push(handler);
    return this;
  }

  /**
   * 移除钩子函数
   * 
   * @param {string} hookName - 钩子名称
   * @param {Function} handler - 钩子处理函数
   */
  unhook(hookName, handler) {
    if (!this.hooks.has(hookName)) {
      return this;
    }

    const handlers = this.hooks.get(hookName);
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    return this;
  }

  /**
   * 运行钩子
   * 
   * @param {string} hookName - 钩子名称
   * @param {...any} args - 钩子参数
   * @returns {Promise<any[]>} 钩子返回值数组
   * 
   * @example
   * ```javascript
   * const results = await pluginManager.runHook('onBeforeValidate', schema, data);
   * ```
   */
  async runHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return [];
    }

    const handlers = this.hooks.get(hookName);
    const results = [];

    for (const handler of handlers) {
      try {
        const result = await handler(...args);
        results.push(result);
      } catch (error) {
        this.emit('hook:error', { hookName, handler, error });
        // 运行错误钩子
        this._runHook('onError', error, { hookName, handler });
      }
    }

    return results;
  }

  /**
   * 同步运行钩子（不等待异步）
   * @private
   * @param {string} hookName - 钩子名称
   * @param {...any} args - 钩子参数
   */
  _runHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) {
      return;
    }

    const handlers = this.hooks.get(hookName);
    handlers.forEach(handler => {
      try {
        handler(...args);
      } catch (error) {
        this.emit('hook:error', { hookName, handler, error });
      }
    });
  }

  /**
   * 获取已注册的插件
   * 
   * @param {string} [pluginName] - 插件名称（可选）
   * @returns {PluginConfig|Map<string, PluginConfig>} 插件配置或插件集合
   * 
   * @example
   * ```javascript
   * // 获取单个插件
   * const plugin = pluginManager.get('custom-validator');
   * 
   * // 获取所有插件
   * const allPlugins = pluginManager.get();
   * ```
   */
  get(pluginName) {
    if (pluginName) {
      return this.plugins.get(pluginName);
    }
    return this.plugins;
  }

  /**
   * 检查插件是否已注册
   * 
   * @param {string} pluginName - 插件名称
   * @returns {boolean} 是否已注册
   */
  has(pluginName) {
    return this.plugins.has(pluginName);
  }

  /**
   * 获取插件列表
   * 
   * @returns {Array<{name: string, version: string, description: string}>} 插件列表
   * 
   * @example
   * ```javascript
   * const pluginList = pluginManager.list();
   * console.log(pluginList);
   * // [
   * //   { name: 'custom-validator', version: '1.0.0', description: '...' },
   * //   { name: 'custom-format', version: '1.0.0', description: '...' }
   * // ]
   * ```
   */
  list() {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version || 'unknown',
      description: plugin.description || ''
    }));
  }

  /**
   * 清空所有插件
   * 
   * @param {Object} schemaio - SchemaIO 实例
   */
  clear(schemaio) {
    // 卸载所有插件
    Array.from(this.plugins.keys()).forEach(name => {
      try {
        this.uninstall(name, schemaio);
      } catch (error) {
        // 忽略卸载错误
      }
    });

    // 清空注册表
    this.plugins.clear();
    
    // 清空钩子
    this.hooks.forEach(handlers => handlers.length = 0);

    this.emit('plugins:cleared');
    return this;
  }

  /**
   * 获取插件数量
   * 
   * @returns {number} 插件数量
   */
  get size() {
    return this.plugins.size;
  }
}

module.exports = PluginManager;
