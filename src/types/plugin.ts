/**
 * Built-in hook names (pipeline execution phases).
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
 * Hook function type (accepts arbitrary arguments; compatible with v1 custom hook names).
 */
export type HookFn = (...args: unknown[]) => unknown | Promise<unknown>

/**
 * Hook context (passed to built-in hooks).
 */
export interface HookContext {
  /** Current hook phase. */
  hook: HookName
  /** Data being processed. */
  data?: unknown
  /** DSL definition. */
  schema?: unknown
  /** Additional metadata. */
  meta?: Record<string, unknown>
}

/**
 * Plugin interface (backwards-compatible with v1).
 */
export interface Plugin {
  /** Plugin name. */
  name: string
  /** Plugin version. */
  version?: string
  /** Plugin description. */
  description?: string
  /** Plugin options (passed as the second argument to install). */
  options?: Record<string, unknown>
  /** Plugin hook map (supports arbitrary hook names for v1 compatibility). */
  hooks?: Record<string, HookFn>
  /** Install method. */
  install?(core: unknown, options?: unknown, context?: unknown): void
  /** Uninstall method (optional). */
  uninstall?(core?: unknown, context?: unknown): void
}

/**
 * PluginManager configuration.
 */
export interface PluginManagerOptions {
  /** Whether hooks are executed asynchronously (default true). */
  async?: boolean
}
