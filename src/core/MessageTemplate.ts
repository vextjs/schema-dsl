import { renderTemplate } from './TemplateEngine.js'

/**
 * MessageTemplate — wraps a template string for rendering.
 * Delegates to TemplateEngine.renderTemplate() (fix CORE-03).
 * Maintains full v1 API compatibility (constructor + render + static render + static renderBatch).
 */
export class MessageTemplate {
  private readonly template: string

  constructor(template: string) {
    this.template = template
  }

  /**
   * Render the template with the given context.
   */
  render(context: Record<string, unknown> = {}): string {
    return renderTemplate(this.template, context)
  }

  /**
   * Statically render a template string with the given context.
   */
  static render(template: string, context: Record<string, unknown> = {}): string {
    return renderTemplate(template, context)
  }

  /**
   * Statically render multiple templates in batch.
   */
  static renderBatch(
    templates: Record<string, string>,
    context: Record<string, unknown> = {}
  ): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, tmpl] of Object.entries(templates)) {
      result[key] = renderTemplate(tmpl, context)
    }
    return result
  }
}
