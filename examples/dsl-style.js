/**
 * DSL风格API示例 v2.0
 *
 * 演示新的DSL Builder Pattern：
 * - 简单场景：纯字符串DSL
 * - 复杂场景：字符串直接链式调用（✨ 无需 dsl() 包裹）
 */

const { dsl, Validator } = require('../index');

// ========== 1. 简单场景：纯字符串DSL ==========

const simpleSchema = dsl({
  username: 'string:3-32!',    // 必填字符串，长度3-32
  email: 'email!',              // 必填邮箱
  age: 'number:18-120',         // 可选数字，范围18-120
  status: 'active|inactive|pending', // 枚举值
  tags: 'array<string:1-20>',   // 字符串数组，每项长度1-20
});

console.log('========== 简单Schema（纯DSL）==========');
console.log(JSON.stringify(simpleSchema, null, 2));

// ========== 2. 复杂场景：字符串直接链式调用 ✨ ==========

const complexSchema = dsl({
  // ✨ 超简洁！字符串直接调用链式方法，无需 dsl() 包裹
  username: 'string:3-32!'
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'pattern': '只能包含字母、数字和下划线'
    })
    .label('用户名')
    .description('用户登录名'),

  // ✨ 邮箱：直接链式
  email: 'email!'
    .label('邮箱地址')
    .messages({
      'format': '请输入有效的邮箱地址'
    }),

  // ✨ 密码：复杂正则 + 自定义消息
  password: 'string:8-64!'
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
    .messages({
      'min': '密码长度不能少于8位',
      'pattern': '密码必须包含大小写字母和数字'
    })
    .label('密码'),

  // 年龄：简单约束（无需链式）
  age: 'number:18-120',

  // 角色：枚举（无需链式）
  role: 'user|admin|moderator',

  // 嵌套对象：混合使用
  profile: {
    bio: 'string:500',          // 简单：纯DSL
    website: 'url'              // ✨ 也可以链式
      .description('个人主页'),
    avatar: 'url'
      .label('头像URL')
  }
});

console.log('\n========== 复杂Schema（DSL + 链式）==========');
console.log(JSON.stringify(complexSchema, null, 2));

// ========== 3. 验证数据 ==========

const { validate } = require('../index');

const testData = {
  username: 'john_doe',
  email: 'john@example.com',
  password: 'Password123',
  age: 25,
  role: 'user',
  profile: {
    bio: 'Full-stack developer',
    website: 'https://example.com',
    avatar: 'https://example.com/avatar.jpg'
  }
};

console.log('\n========== 验证数据 ==========');
const result = validate(complexSchema, testData);
console.log('验证结果:', result.valid ? '✅ 通过' : '❌ 失败');
if (!result.valid) {
  console.log('错误:', result.errors);
}

// ========== 4. 展示API优势 ==========

console.log('\n========== API对比 ==========');

// v1.0: 需要 dsl() 包裹
console.log('❌ v1.0（需要 dsl()）:');
console.log(`  email: dsl('email!')
    .pattern(/custom/)
    .messages({ 'pattern': '格式不正确' })
    .label('邮箱地址')`);

// v2.0: 字符串直接链式
console.log('\n✅ v2.0（字符串直接链式）:');
console.log(`  email: 'email!'
    .pattern(/custom/)
    .messages({ 'pattern': '格式不正确' })
    .label('邮箱地址')`);

console.log('\n✅ DSL v2.0 示例运行完成！');
console.log('💡 提示：简单字段用纯DSL，复杂字段直接链式调用');
console.log('🎉 特色：字符串直接调用方法，无需 dsl() 包裹！');



