import { renderTemplate } from './TemplateEngine.js'

/**
 * 消息模板类
 * 委托 TemplateEngine.renderTemplate() 实现（修复 CORE-03）
 * 保持 v1 API 完全兼容（constructor + render + static render + static renderBatch）
 */
export class MessageTemplate {
  private readonly template: string

  constructor(template: string) {
    this.template = template
  }

  /**
   * 渲染模板
   */
  render(context: Record<string, unknown> = {}): string {
    return renderTemplate(this.template, context)
  }

  /**
   * 静态快速渲染
   */
  static render(template: string, context: Record<string, unknown> = {}): string {
    return renderTemplate(template, context)
  }

  /**
   * 批量渲染
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
