/**
 * 用户注册Schema定义 v2.0.1
 *
 * 展示所有高级功能：
 * - ✨ String扩展链式调用
 * - 错误消息定制
 * - 字段标签
 * - 多语言支持
 * - 自定义验证器（异步）
 */

const { dsl } = require('../../index');
const Locale = require('../../lib/core/Locale');

// 模拟数据库
const db = {
  users: [
    { username: 'admin', email: 'admin@example.com', phone: '13800138000' }
  ]
};

/**
 * 检查用户名是否已存在
 */
async function checkUsernameExists(username) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const exists = db.users.some(u => u.username === username);
      resolve(exists);
    }, 100);
  });
}

/**
 * 检查邮箱是否已存在
 */
async function checkEmailExists(email) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const exists = db.users.some(u => u.email === email);
      resolve(exists);
    }, 100);
  });
}

/**
 * 检查手机号是否已存在
 */
async function checkPhoneExists(phone) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const exists = db.users.some(u => u.phone === phone);
      resolve(exists);
    }, 100);
  });
}

/**
 * 注册Schema定义（使用 v2.0.1 String扩展）
 */
function createRegisterSchema(lang = 'zh-CN') {
  // 设置语言
  Locale.setLocale(lang);

  return dsl({
    // ✨ 用户名：String扩展 + 自定义验证
    username: 'string:3-32!'
      .pattern(/^[a-zA-Z0-9_]+$/)
      .label('用户名')
      .messages({
        'min': '{{#label}}长度不能少于{{#limit}}个字符',
        'max': '{{#label}}长度不能超过{{#limit}}个字符',
        'pattern': '{{#label}}只能包含字母、数字和下划线'
      })
      .custom(async (value) => {
        const exists = await checkUsernameExists(value);
        if (exists) {
          return { error: 'username.exists', message: '用户名已被占用，请换一个试试' };
        }
        return true;
      }),

    // ✨ 邮箱：String扩展 + 异步验证
    email: 'email!'
      .label('邮箱地址')
      .messages({
        'format.email': '请输入有效的{{#label}}'
      })
      .custom(async (value) => {
        const exists = await checkEmailExists(value);
        if (exists) {
          return { error: 'email.exists', message: '该邮箱已被注册' };
        }
        return true;
      }),

    // ✨ 密码：String扩展 + 复杂正则
    password: 'string:8-64!'
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      .label('密码')
      .messages({
        'min': '{{#label}}长度不能少于{{#limit}}位',
        'max': '{{#label}}长度不能超过{{#limit}}位',
        'pattern': '{{#label}}必须包含大小写字母和数字'
      }),

    // ✨ 确认密码：String扩展
    confirmPassword: 'string!'
      .label('确认密码')
      .messages({
        'password.mismatch': '两次输入的密码不一致'
      })
      .custom((value, context) => {
        // 临时实现：手动检查password字段
        if (context && context.password && value !== context.password) {
          return { error: 'password.mismatch', message: '两次输入的密码不一致' };
        }
        return true;
      })
      .required(),

    // ✨ 手机号：String扩展 + 异步验证
    phone: 'string:11!'
      .pattern(/^1[3-9]\d{9}$/)
      .label('手机号')
      .messages({
        'pattern': '请输入正确的{{#label}}格式'
      })
      .custom(async (value) => {
        const exists = await checkPhoneExists(value);
        if (exists) {
          return { error: 'phone.exists', message: '该手机号已被注册' };
        }
        return true;
      }),

    // 简单字段：纯DSL
    agreeTerms: 'boolean!'
  });
}

module.exports = {
  createRegisterSchema,
  db,
  checkUsernameExists,
  checkEmailExists,
  checkPhoneExists
};

