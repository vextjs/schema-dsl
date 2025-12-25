module.exports = {
  required: '{{#label}}不能为空',
  type: '{{#label}}应该是 {{#expected}} 类型，但得到了 {{#actual}}',
  min: '{{#label}}长度至少为 {{#min}}',
  max: '{{#label}}长度最多为 {{#max}}',
  length: '{{#label}}长度必须为 {{#expected}}',
  pattern: '{{#label}}格式不正确',
  enum: '{{#label}}必须是以下值之一: {{#allowed}}',
  custom: '{{#label}}验证失败: {{#message}}',
  circular: '{{#label}}检测到循环引用',
  'max-depth': '超过最大递归深度 ({{#depth}}) at {{#label}}',
  exception: '{{#label}}验证异常: {{#message}}'
};

