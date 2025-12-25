module.exports = {
  required: '{{#label}} is required',
  type: '{{#label}} should be {{#expected}}, got {{#actual}}',
  min: '{{#label}} length must be at least {{#min}}',
  max: '{{#label}} length must be at most {{#max}}',
  length: '{{#label}} length must be exactly {{#expected}}',
  pattern: '{{#label}} format is invalid',
  enum: '{{#label}} must be one of: {{#allowed}}',
  custom: '{{#label}} validation failed: {{#message}}',
  circular: 'Circular reference detected at {{#label}}',
  'max-depth': 'Maximum recursion depth ({{#depth}}) exceeded at {{#label}}',
  exception: '{{#label}} validation exception: {{#message}}'
};

