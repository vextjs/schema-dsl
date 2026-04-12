import type { Plugin, HookName, HookFn } from '../types/plugin.js'

/**
 * PluginManager — 插件注册与钩子执行
 *
 * v1 完全兼容 API：
 *   - hooks        : 公开的钩子 Map，支持任意钩子名称
 *   - on(event, cb): 事件监听（plugin:registered / plugin:uninstalled / hook:error）
 *   - unhook(name, fn): 移除指定钩子
 *   - runHook(name, ...args): 传入任意参数，收集返回值
 *   - install(core, name?, opts?): 支持按名称 + 选项安装单个插件
 *   - has / get / list / clear / size / uninstall（别名）
 */
export class PluginManager {
  private readonly _plugins: Map<string, Plugin> = new Map()

  /**
   * 公开钩子 Map（v1 compat: pluginManager.hooks.get('hookName')）
   * 支持任意字符串名称，不限于内置 HookName
   */
  readonly hooks: Map<string, Array<HookFn>> = new Map()

  /** 事件监听器 Map（plugin:registered / plugin:uninstalled / hook:error）*/
  private readonly _events: Map<string, Array<(...args: unknown[]) => void>> = new Map()

  /** 每个插件注册的钩子引用（用于 unregister 时自动清理）*/
  private readonly _pluginHooks: Map<string, Map<string, Set<HookFn>>> = new Map()

  private _installedCore: unknown = undefined

  /** 内置钩子名称（预初始化）*/
  private static readonly BUILTIN_HOOKS: ReadonlyArray<HookName> = [
    'beforeParse',
    'afterParse',
    'beforeCompile',
    'afterCompile',
    'beforeValidate',
    'afterValidate',
    'onError',
  ]

  constructor() {
    for (const name of PluginManager.BUILTIN_HOOKS) {
      this.hooks.set(name, [])
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // 核心 API
  // ─────────────────────────────────────────────────────────────────────

  /**
   * 注册插件
   */
  register(plugin: Plugin): this {
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('[schema-dsl] Plugin must be an object')
    }
    if (!plugin.name) {
      throw new Error('[schema-dsl] Plugin must have a valid name')
    }
    if (!plugin.install) {
      throw new Error(`[schema-dsl] Plugin must have an install function`)
    }
    if (this._plugins.has(plugin.name)) {
      throw new Error(`[schema-dsl] Plugin "${plugin.name}" is already registered`)
    }

    this._plugins.set(plugin.name, plugin)

    // 自动注册插件定义的钩子
    if (plugin.hooks) {
      for (const [hookName, fn] of Object.entries(plugin.hooks)) {
        if (fn) {
          this._addPluginHook(plugin.name, hookName, fn)
        }
      }
    }

    this._emit('plugin:registered', plugin)
    return this
  }

  /**
   * 添加钩子回调（支持任意名称，不限于内置 HookName）
   */
  hook(name: string, fn: HookFn): this {
    this._ensureHook(name)
    this.hooks.get(name)!.push(fn)
    return this
  }

  /**
   * 移除指定钩子处理器（v1 compat: unhook）
   */
  unhook(name: string, fn: HookFn): this {
    const list = this.hooks.get(name)
    if (list) {
      const idx = list.indexOf(fn)
      if (idx !== -1) list.splice(idx, 1)
    }
    return this
  }

  /**
   * 运行指定钩子
   * - 参数直接透传给每个 handler（v1 compat: runHook(name, arg1, arg2, ...)）
   * - 返回所有 handler 的返回值数组
   * - handler 抛出错误时，触发 'hook:error' 事件（不中断后续 handler）
   */
  async runHook(name: string, ...args: unknown[]): Promise<unknown[]> {
    const list = this.hooks.get(name)
    if (!list || list.length === 0) return []

    const results: unknown[] = []
    for (const fn of list) {
      try {
        const result = await fn(...args)
        results.push(result)
      } catch (err) {
        this._emit('hook:error', err, name)
      }
    }
    return results
  }

  /**
   * 安装插件
   *
   * 支持两种调用方式（v1 compat）：
   *   install(core)                       — 安装所有已注册插件
   *   install(core, pluginName, options?) — 安装指定插件，合并 plugin.options + options
   */
  install(core: unknown, pluginName?: string, extraOptions?: Record<string, unknown>): this {
    this._installedCore = core

    if (pluginName !== undefined) {
      // 按名称安装指定插件
      const plugin = this._plugins.get(pluginName)
      if (!plugin) {
        throw new Error(`[schema-dsl] Plugin "${pluginName}" is not registered`)
      }
      const mergedOptions = { ...(plugin.options ?? {}), ...(extraOptions ?? {}) }
      try {
        plugin.install?.(core, mergedOptions)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new Error(`[schema-dsl] Failed to install plugin "${plugin.name}": ${msg}`)
      }
    } else {
      // 安装所有插件
      for (const plugin of this._plugins.values()) {
        try {
          plugin.install?.(core, plugin.options)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          throw new Error(`[schema-dsl] Failed to install plugin "${plugin.name}": ${msg}`)
        }
      }
    }
    return this
  }

  /**
   * 卸载插件（v2 主方法）
   * - 自动清理该插件注册的所有钩子
   * - 触发 'plugin:uninstalled' 事件
   */
  unregister(name: string): this {
    const plugin = this._plugins.get(name)
    if (!plugin) return this

    // 清理该插件注册的钩子
    const pluginHookMap = this._pluginHooks.get(name)
    if (pluginHookMap) {
      for (const [hookName, fns] of pluginHookMap) {
        const list = this.hooks.get(hookName)
        if (list) {
          for (const fn of fns) {
            const idx = list.indexOf(fn)
            if (idx !== -1) list.splice(idx, 1)
          }
        }
      }
      this._pluginHooks.delete(name)
    }

    plugin.uninstall?.(this._installedCore)
    this._plugins.delete(name)

    this._emit('plugin:uninstalled', plugin)
    return this
  }

  // ─────────────────────────────────────────────────────────────────────
  // 事件系统（v1 compat: on / emit）
  // ─────────────────────────────────────────────────────────────────────

  /**
   * 监听插件管理器事件
   * 支持事件：'plugin:registered' | 'plugin:uninstalled' | 'hook:error'
   */
  on(event: string, callback: (...args: unknown[]) => void): this {
    if (!this._events.has(event)) {
      this._events.set(event, [])
    }
    this._events.get(event)!.push(callback)
    return this
  }

  // ─────────────────────────────────────────────────────────────────────
  // v1 兼容 API
  // ─────────────────────────────────────────────────────────────────────

  /** v1 compat: 检查插件是否已注册 */
  has(name: string): boolean {
    return this._plugins.has(name)
  }

  /** v1 compat: 获取单个插件或全部插件 Map */
  get(name?: string): Plugin | Map<string, Plugin> | undefined {
    if (name === undefined) return this._plugins
    return this._plugins.get(name)
  }

  /** v1 compat: 列出所有插件元数据 */
  list(): Array<{ name: string; version?: string; description?: string }> {
    return Array.from(this._plugins.values()).map(p => ({
      name: p.name,
      ...(p.version !== undefined ? { version: p.version } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
    }))
  }

  /** v1 compat: 清除所有插件（含钩子清理） */
  clear(): this {
    for (const plugin of this._plugins.values()) {
      plugin.uninstall?.()
    }
    this._plugins.clear()
    this._pluginHooks.clear()
    // 清空所有自定义钩子（保留内置预初始化列表但清空其 handlers）
    for (const [, list] of this.hooks) {
      list.length = 0
    }
    return this
  }

  /** v1 compat: 卸载指定插件（别名 unregister） */
  uninstall(name: string): this {
    return this.unregister(name)
  }

  get pluginCount(): number {
    return this._plugins.size
  }

  /** v1 compat: 插件数量（别名 pluginCount） */
  get size(): number {
    return this._plugins.size
  }

  // ─────────────────────────────────────────────────────────────────────
  // 私有工具方法
  // ─────────────────────────────────────────────────────────────────────

  private _ensureHook(name: string): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, [])
    }
  }

  private _addPluginHook(pluginName: string, hookName: string, fn: HookFn): void {
    this._ensureHook(hookName)
    this.hooks.get(hookName)!.push(fn)

    // 记录映射关系（供 unregister 清理）
    if (!this._pluginHooks.has(pluginName)) {
      this._pluginHooks.set(pluginName, new Map())
    }
    const pluginMap = this._pluginHooks.get(pluginName)!
    if (!pluginMap.has(hookName)) {
      pluginMap.set(hookName, new Set())
    }
    pluginMap.get(hookName)!.add(fn)
  }

  private _emit(event: string, ...args: unknown[]): void {
    const callbacks = this._events.get(event)
    if (callbacks) {
      for (const cb of callbacks) {
        cb(...args)
      }
    }
  }
}
