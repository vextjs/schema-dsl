/**
 * 统一模板引擎
 *
 * 合并 v1 MessageTemplate.render() 与 ErrorFormatter._interpolate() 两套逻辑，
 * 修复 CORE-03 模板注入漏洞（单次替换，避免替换结果被二次展开）。
 *
 * 支持两种占位符格式：
 *   {{#key}}  ← v1 locale 文件全部使用此格式，必须兼容
 *   {key}     ← v2 新增消息模板推荐格式
 */

/**
 * 渲染模板字符串，将占位符替换为 params 中对应的值。
 *
 * @param template - 模板字符串，如 "{{#label}} 长度必须至少 {{#min}} 个字符"
 * @param params   - 替换参数对象
 * @returns        渲染后的字符串；无对应 key 时原样保留占位符（便于调试）
 *
 * @example
 * renderTemplate('{{#label}} is required', { label: 'Email' })
 * // → 'Email is required'
 *
 * renderTemplate('{field} must be {min}~{max}', { field: 'age', min: 18, max: 65 })
 * // → 'age must be 18~65'
 */
export function renderTemplate(template: string, params: Record<string, unknown>): string {
  // 使用单次 replace 遍历，避免替换后的值被二次展开（CORE-03 修复）
  // 正则匹配两种格式：{{#key}} 和 {key}
  return template.replace(/\{\{#([^}]+)\}\}|\{([^}]+)\}/g, (match, k1: string | undefined, k2: string | undefined) => {
    const key = k1 ?? k2
    if (key !== undefined && key in params) {
      const val = params[key]
      if (val === null) return 'null'
      if (val === undefined) return match
      if (Array.isArray(val)) return val.join(', ')
      if (val instanceof RegExp) return val.toString()
      if (val instanceof Date) return val.toISOString()
      return String(val)
    }
    return match // 无对应 key 时原样保留
  })
}
