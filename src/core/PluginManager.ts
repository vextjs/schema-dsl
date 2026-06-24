import { EventEmitter } from 'node:events'
import type { Plugin, HookName, HookFn } from '../types/plugin.js'

/**
 * PluginManager — plugin registration and hook execution.
 *
 * Full v1 compatible API:
 *   - hooks        : public hooks Map; supports any hook name
 *   - EventEmitter compat: on / once / off / emit / removeListener / removeAllListeners
 *   - unhook(name, fn): remove a specific hook handler
 *   - runHook(name, ...args): pass arbitrary args, collect return values
 *   - install(core, name?, opts?): supports named + options install for a single plugin
 *   - install / uninstall pass through context
 *   - has / get / list / clear / size / uninstall (alias)
 */
export class PluginManager extends EventEmitter {
  readonly plugins: Map<string, Plugin> = new Map()

  /**
   * Public hooks Map (v1 compat: pluginManager.hooks.get('hookName')).
   * Supports any string name, not limited to built-in HookName values.
   */
  readonly hooks: Map<string, Array<HookFn>> = new Map()

  /** v1 compat context (passed to plugin install / uninstall). */
  readonly context: { plugins: Map<string, Plugin>; hooks: Map<string, Array<HookFn>> } = {
    plugins: this.plugins,
    hooks: this.hooks,
  }

  /** Per-plugin hook references (used for automatic cleanup on unregister). */
  private readonly _pluginHooks: Map<string, Map<string, Set<HookFn>>> = new Map()

  /** Names whose install hook has already run for this manager instance. */
  private readonly _installedPlugins = new Set<string>()

  private _installedCore: unknown = undefined

  /** Built-in hook names (pre-initialized on construction). */
  private static readonly BUILTIN_HOOKS: ReadonlyArray<HookName> = [
    'beforeParse',
    'afterParse',
    'beforeCompile',
    'afterCompile',
    'beforeValidate',
    'afterValidate',
    'onError',
  ]

  /** Legacy v1 lifecycle hook names. */
  private static readonly LEGACY_HOOKS: ReadonlyArray<string> = [
    'onBeforeRegister',
    'onAfterRegister',
    'onBeforeValidate',
    'onAfterValidate',
    'onBeforeExport',
    'onAfterExport',
    'onBeforeCompile',
    'onAfterCompile',
    'onError',
  ]

  constructor() {
    super()
    this.setMaxListeners(0)
    for (const name of [...PluginManager.BUILTIN_HOOKS, ...PluginManager.LEGACY_HOOKS]) {
      this._ensureHook(name)
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Core API
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Register a plugin.
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
    if (this.plugins.has(plugin.name)) {
      throw new Error(`[schema-dsl] Plugin "${plugin.name}" is already registered`)
    }

    this._runHookSync('onBeforeRegister', plugin)

    this.plugins.set(plugin.name, plugin)

    // Auto-register hooks declared by the plugin
    if (plugin.hooks) {
      for (const [hookName, fn] of Object.entries(plugin.hooks)) {
        if (fn) {
          this._addPluginHook(plugin.name, hookName, fn)
        }
      }
    }

    this._runHookSync('onAfterRegister', plugin)
    this.emit('plugin:registered', plugin)
    return this
  }

  /**
   * Add a hook callback (supports any name, not limited to built-in HookName).
   */
  hook(name: string, fn: HookFn): this {
    this._ensureHook(name)
    this.hooks.get(name)!.push(fn)
    return this
  }

  /**
   * Remove a specific hook handler (v1 compat: unhook).
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
   * Run the specified hook.
   * - Args are passed directly to each handler (v1 compat: runHook(name, arg1, arg2, ...)).
   * - Returns an array of all handler return values.
   * - If a handler throws, emits 'hook:error' and runs onError (does not interrupt remaining handlers).
   */
  async runHook(name: string, ...args: unknown[]): Promise<unknown[]> {
    const list = this.hooks.get(name)
    if (!list || list.length === 0) return []

    const results: unknown[] = []
    for (const fn of list) {
      try {
        const result = await fn(...args)
        results.push(result)
      } catch (error) {
        const payload = { hookName: name, handler: fn, error }
        this.emit('hook:error', payload)
        this._runHookSync('onError', error, { hookName: name, handler: fn })
      }
    }
    return results
  }

  /**
   * Install plugins.
   *
   * Supports two call forms (v1 compat):
   *   install(core)                       — install all registered plugins
   *   install(core, pluginName, options?) — install the named plugin, merging plugin.options + options
   */
  install(core: unknown, pluginName?: string, extraOptions?: Record<string, unknown>): this {
    this._installedCore = core

    if (pluginName !== undefined) {
      // Install the named plugin
      const plugin = this.plugins.get(pluginName)
      if (!plugin) {
        throw new Error(`[schema-dsl] Plugin "${pluginName}" is not registered`)
      }
      this._installPlugin(core, plugin, extraOptions)
    } else {
      // Install all plugins
      for (const plugin of this.plugins.values()) {
        this._installPlugin(core, plugin, extraOptions)
      }
    }
    return this
  }

  private _installPlugin(core: unknown, plugin: Plugin, extraOptions?: Record<string, unknown>): void {
    if (this._installedPlugins.has(plugin.name)) return

    const mergedOptions = { ...(plugin.options ?? {}), ...(extraOptions ?? {}) }
    try {
      plugin.install?.(core, mergedOptions, this.context)
      this._installedPlugins.add(plugin.name)
      this.emit('plugin:installed', plugin)
    } catch (error) {
      this.emit('plugin:error', { plugin, error })
      const msg = error instanceof Error ? error.message : String(error)
      throw new Error(`[schema-dsl] Failed to install plugin "${plugin.name}": ${msg}`)
    }
  }

  /**
   * Unregister a plugin (v2 primary method).
   * - Automatically cleans up all hooks registered by this plugin.
   * - Emits 'plugin:uninstalled' event.
   */
  unregister(name: string, coreInstance?: unknown): this {
    const plugin = this.plugins.get(name)
    if (!plugin) return this

    const effectiveCore = coreInstance === undefined ? this._installedCore : coreInstance

    if (typeof plugin.uninstall === 'function') {
      try {
        plugin.uninstall(effectiveCore, this.context)
      } catch (error) {
        this.emit('plugin:error', { plugin, error })
        const msg = error instanceof Error ? error.message : String(error)
        throw new Error(`[schema-dsl] Failed to uninstall plugin "${name}": ${msg}`)
      }
    }

    // Clean up hooks registered by this plugin
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

    this.plugins.delete(name)
    this._installedPlugins.delete(name)

    this.emit('plugin:uninstalled', plugin)
    return this
  }

  // ─────────────────────────────────────────────────────────────────────
  // v1 Compat API
  // ─────────────────────────────────────────────────────────────────────

  /** v1 compat: check whether a plugin is registered. */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /** v1 compat: get a single plugin or the full plugins Map. */
  get(name?: string): Plugin | Map<string, Plugin> | undefined {
    if (name === undefined) return this.plugins
    return this.plugins.get(name)
  }

  /** v1 compat: list all plugin metadata. */
  list(): Array<{ name: string; version?: string; description?: string }> {
    return Array.from(this.plugins.values()).map(p => ({
      name: p.name,
      ...(p.version !== undefined ? { version: p.version } : {}),
      ...(p.description !== undefined ? { description: p.description } : {}),
    }))
  }

  /** v1 compat: clear all plugins (including hook cleanup). */
  clear(coreInstance?: unknown): this {
    for (const name of Array.from(this.plugins.keys())) {
      try {
        this.unregister(name, coreInstance)
      } catch {
        // v1 behavior: clear() ignores individual plugin uninstall errors and continues
      }
    }
    this.plugins.clear()
    this._pluginHooks.clear()
    this._installedPlugins.clear()
    // Clear all custom hooks (keep built-in pre-initialized entries but empty their handler arrays)
    for (const [, list] of this.hooks) {
      list.length = 0
    }
    this.emit('plugins:cleared')
    return this
  }

  /** v1 compat: uninstall a plugin (alias for unregister). */
  uninstall(name: string, coreInstance?: unknown): this {
    return this.unregister(name, coreInstance)
  }

  get pluginCount(): number {
    return this.plugins.size
  }

  /** v1 compat: plugin count (alias for pluginCount). */
  get size(): number {
    return this.plugins.size
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────

  private _ensureHook(name: string): void {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, [])
    }
  }

  private _addPluginHook(pluginName: string, hookName: string, fn: HookFn): void {
    this._ensureHook(hookName)
    this.hooks.get(hookName)!.push(fn)

    // Record the mapping (for cleanup on unregister)
    if (!this._pluginHooks.has(pluginName)) {
      this._pluginHooks.set(pluginName, new Map())
    }
    const pluginMap = this._pluginHooks.get(pluginName)!
    if (!pluginMap.has(hookName)) {
      pluginMap.set(hookName, new Set())
    }
    pluginMap.get(hookName)!.add(fn)
  }

  private _runHookSync(name: string, ...args: unknown[]): void {
    const list = this.hooks.get(name)
    if (!list || list.length === 0) return

    for (const handler of list) {
      try {
        handler(...args)
      } catch (error) {
        this.emit('hook:error', { hookName: name, handler, error })
      }
    }
  }
}
