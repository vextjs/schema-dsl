/**
 * 消息模板引擎
 *
 * 支持模板变量替换，如 {{#label}}, {{#limit}} 等
 *
 * @module lib/core/MessageTemplate
 */

class MessageTemplate {
  /**
   * 创建消息模板实例
   * @param {string} template - 模板字符串
   */
  constructor(template) {
    this.template = template || '';
  }

  /**
   * 渲染模板
   * @param {Object} context - 上下文对象
   * @param {string} [context.label] - 字段标签
   * @param {string} [context.key] - 字段名
   * @param {*} [context.value] - 当前值
   * @param {*} [context.limit] - 限制值
   * @param {Array|string} [context.valids] - 有效值列表
   * @param {RegExp} [context.pattern] - 正则表达式
   * @returns {string} 渲染后的消息
   */
  render(context = {}) {
    let message = this.template;

    // 定义支持的模板格式（按优先级）
    const patterns = [
      /\{\{#(\w+)\}\}/g,  // {{#variable}} - 优先级1（现有格式）
      /\{\{(\w+)\}\}/g,   // {{variable}}  - 优先级2（无井号）
      /\{(\w+)\}/g        // {variable}    - 优先级3（单花括号）
    ];

    // 按优先级依次替换
    for (const pattern of patterns) {
      message = message.replace(pattern, (match, key) => {
        const value = context[key];

        // 特殊处理
        if (value === undefined || value === null) {
          return match; // 保留原样
        }

        // 数组转字符串
        if (Array.isArray(value)) {
          return value.join(', ');
        }

        // RegExp转字符串
        if (value instanceof RegExp) {
          return value.toString();
        }

        // Date转字符串
        if (value instanceof Date) {
          return value.toISOString();
        }

        return String(value);
      });
    }

    return message;
  }

  /**
   * 静态方法：快速渲染
   * @param {string} template - 模板字符串
   * @param {Object} context - 上下文对象
   * @returns {string} 渲染后的消息
   */
  static render(template, context) {
    const instance = new MessageTemplate(template);
    return instance.render(context);
  }

  /**
   * 批量渲染
   * @param {Object} templates - 模板对象 { type: template }
   * @param {Object} context - 上下文对象
   * @returns {Object} 渲染后的消息对象
   */
  static renderBatch(templates, context) {
    const result = {};
    for (const [type, template] of Object.entries(templates)) {
      result[type] = MessageTemplate.render(template, context);
    }
    return result;
  }
}

module.exports = MessageTemplate;

