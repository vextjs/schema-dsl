const { expect } = require('chai');
const MessageTemplate = require('../../../lib/core/MessageTemplate');

describe('MessageTemplate', () => {
  describe('构造函数', () => {
    it('应该创建MessageTemplate实例', () => {
      const template = new MessageTemplate('Hello {{#name}}');
      expect(template).to.be.instanceof(MessageTemplate);
      expect(template.template).to.equal('Hello {{#name}}');
    });

    it('应该处理空模板', () => {
      const template = new MessageTemplate();
      expect(template.template).to.equal('');
    });
  });

  describe('render()', () => {
    it('应该替换单个变量', () => {
      const template = new MessageTemplate('Hello {{#name}}');
      const result = template.render({ name: 'John' });
      expect(result).to.equal('Hello John');
    });

    it('应该替换多个变量', () => {
      const template = new MessageTemplate('{{#label}}长度不能少于{{#limit}}个字符');
      const result = template.render({ label: '用户名', limit: 3 });
      expect(result).to.equal('用户名长度不能少于3个字符');
    });

    it('应该保留未找到的变量', () => {
      const template = new MessageTemplate('{{#label}} is {{#missing}}');
      const result = template.render({ label: 'Username' });
      expect(result).to.equal('Username is {{#missing}}');
    });

    it('应该处理数组值', () => {
      const template = new MessageTemplate('Must be one of: {{#valids}}');
      const result = template.render({ valids: ['A', 'B', 'C'] });
      expect(result).to.equal('Must be one of: A, B, C');
    });

    it('应该处理RegExp值', () => {
      const template = new MessageTemplate('Must match {{#pattern}}');
      const result = template.render({ pattern: /^[a-z]+$/ });
      expect(result).to.equal('Must match /^[a-z]+$/');
    });

    it('应该处理Date值', () => {
      const template = new MessageTemplate('Must be after {{#limit}}');
      const date = new Date('2025-01-01');
      const result = template.render({ limit: date });
      expect(result).to.include('2025-01-01');
    });

    it('应该处理null和undefined', () => {
      const template = new MessageTemplate('{{#label}} {{#missing}}');
      const result = template.render({ label: null });
      expect(result).to.equal('{{#label}} {{#missing}}');
    });
  });

  describe('静态方法', () => {
    it('render() - 应该快速渲染', () => {
      const result = MessageTemplate.render(
        '{{#label}}不能少于{{#limit}}',
        { label: '密码', limit: 8 }
      );
      expect(result).to.equal('密码不能少于8');
    });

    it('renderBatch() - 应该批量渲染', () => {
      const templates = {
        'string.min': '{{#label}}太短',
        'string.max': '{{#label}}太长'
      };
      const context = { label: '用户名' };
      const result = MessageTemplate.renderBatch(templates, context);

      expect(result).to.deep.equal({
        'string.min': '用户名太短',
        'string.max': '用户名太长'
      });
    });
  });
});

