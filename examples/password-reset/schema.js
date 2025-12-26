/**
 * 密码重置Schema定义
 * 使用DSL语法定义
 */

const { dsl } = require('../../index');
const Locale = require('../../lib/core/Locale');

// 设置中文
Locale.setLocale('zh-CN');

// 使用DSL定义密码重置Schema
const passwordResetSchema = dsl({
  // 新密码：8-64字符
  newPassword: 'string:8-64!',

  // 确认密码：必填
  confirmPassword: 'string:8-64!'
});

// 注意：ref功能需要在validate时手动检查
// 因为DSL目前不直接支持ref，这是一个简化示例

module.exports = passwordResetSchema;


