/**
 * 内置钩子名称（管线执行阶段）
 */
export type HookName =
  | 'beforeParse'
  | 'afterParse'
  | 'beforeCompile'
  | 'afterCompile'
  | 'beforeValidate'
  | 'afterValidate'
  | 'onError'

/**
 * 钩子函数类型（支持任意参数，兼容 v1 自定义钩子名称）
 */
export type HookFn = (...args: unknown[]) => unknown | Promise<unknown>

/**
 * 钩子上下文（内置钩子传递）
 */
export interface HookContext {
  /** 当前钩子阶段 */
  hook: HookName
  /** 操作的数据 */
  data?: unknown
  /** DSL 定义 */
  schema?: unknown
  /** 附加元数据 */
  meta?: Record<string, unknown>
}

/**
 * 插件接口（向后兼容 v1）
 */
export interface Plugin {
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version?: string
  /** 插件描述 */
  description?: string
  /** 插件选项（传入 install 的第二参数）*/
  options?: Record<string, unknown>
  /** 插件钩子映射（支持任意钩子名称，兼容 v1）*/
  hooks?: Record<string, HookFn>
  /** 安装方法 */
  install?(core: unknown, options?: unknown, context?: unknown): void
  /** 卸载方法（可选）*/
  uninstall?(core?: unknown, context?: unknown): void
}

/**
 * PluginManager 配置
 */
export interface PluginManagerOptions {
  /** 是否异步执行钩子（默认 true）*/
  async?: boolean
}
