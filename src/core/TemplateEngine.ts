/**
 * Unified template engine.
 *
 * Merges the two rendering implementations from v1 — MessageTemplate.render() and
 * ErrorFormatter._interpolate() — into a single pipeline.
 * Fixes the CORE-03 template injection vulnerability (single-pass replacement so that
 * substituted values are never expanded a second time).
 *
 * Supports two placeholder formats:
 *   {{#key}}  ← all v1 locale files use this format (must remain compatible)
 *   {key}     ← recommended format for v2 message templates
 */

/**
 * Render a template string by replacing placeholders with corresponding values from params.
 *
 * @param template - Template string, e.g. "{{#label}} must be at least {{#min}} characters"
 * @param params   - Substitution parameter object
 * @returns          Rendered string; placeholders with no matching key are kept as-is (aids debugging)
 *
 * @example
 * renderTemplate('{{#label}} is required', { label: 'Email' })
 * // → 'Email is required'
 *
 * renderTemplate('{field} must be {min}~{max}', { field: 'age', min: 18, max: 65 })
 * // → 'age must be 18~65'
 */
export function renderTemplate(template: string, params: Record<string, unknown>): string {
  // Single-pass replace — prevents substituted values from being expanded again (CORE-03 fix)
  // Regex matches both formats: {{#key}} and {key}
  return template.replace(/\{\{#([^}]+)\}\}|\{([^}]+)\}/g, (match, k1: string | undefined, k2: string | undefined) => {
    const key = k1 ?? k2
    if (key !== undefined && Object.prototype.hasOwnProperty.call(params, key)) {
      const val = params[key]
      if (val === null) return 'null'
      if (val === undefined) return match
      if (Array.isArray(val)) return val.join(', ')
      if (val instanceof RegExp) return val.toString()
      if (val instanceof Date) return val.toISOString()
      return String(val)
    }
    return match // No matching key — keep placeholder as-is
  })
}
