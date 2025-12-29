/**
 * Markdown 导出器示例
 *
 * 演示如何将 Schema 导出为 Markdown 文档
 */

const { dsl, exporters } = require('../index');

console.log('========== Markdown 导出器示例 ==========\n');

// 示例 1: 简单用户 Schema
console.log('【示例 1】用户注册 API\n');

const userSchema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:18-120',
  role: 'admin|user|guest'
});

const zhMarkdown = exporters.MarkdownExporter.export(userSchema, {
  title: '用户注册 API',
  locale: 'zh-CN',
  includeExample: true
});

console.log(zhMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// 示例 2: 带标签的 Schema
console.log('【示例 2】带标签的产品 Schema\n');

const productSchema = dsl({
  'name': 'string:1-100!'.label('产品名称'),
  'price': 'number:0.01-!'.label('价格'),
  'description': 'string:500'.label('产品描述'),
  'category': 'electronics|clothing|books'.label('类别'),
  'tags': 'array:1-10<string:1-20>'.label('标签')
});

const productMarkdown = exporters.MarkdownExporter.export(productSchema, {
  title: '产品信息 Schema',
  locale: 'zh-CN'
});

console.log(productMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// 示例 3: 英文文档
console.log('【示例 3】英文文档\n');

const enMarkdown = exporters.MarkdownExporter.export(userSchema, {
  title: 'User Registration API',
  locale: 'en-US',
  includeExample: true
});

console.log(enMarkdown);
console.log('\n' + '='.repeat(60) + '\n');

// 示例 4: 日文文档
console.log('【示例 4】日文文档\n');

const jaMarkdown = exporters.MarkdownExporter.export(userSchema, {
  title: 'ユーザー登録 API',
  locale: 'ja-JP',
  includeExample: true
});

console.log(jaMarkdown);

