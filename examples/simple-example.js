/**
 * SchemaIO v2.0.1 - 简洁示例
 *
 * 展示最简洁、最直观的用法
 */

const { dsl, validate, SchemaUtils } = require('../index');

console.log('========== SchemaIO v2.0.1 简洁示例 ==========\n');

// ========== 1. 数组验证 - 超简洁 ==========
console.log('✨ 1. 数组验证');

const articleSchema = dsl({
  title: 'string:5-100!',
  tags: 'array!1-10'  // ✨ 简洁：必填，1-10个元素
});

console.log('验证文章:', validate(articleSchema, {
  title: 'Hello World',
  tags: ['javascript', 'nodejs']
}).valid);
console.log('');

// ========== 2. when条件 - 超直观 ==========
console.log('✨ 2. 条件验证');

const contactSchema = dsl({
  type: 'email|phone',
  contact: dsl.match('type', {
    email: 'email!',
    phone: 'phone:cn!'
  })
});

console.log('验证邮箱:', validate(contactSchema, { type: 'email', contact: 'test@example.com' }).valid);
console.log('验证手机:', validate(contactSchema, { type: 'phone', contact: '13800138000' }).valid);
console.log('');

// ========== 3. 快捷方法 - 不用找正则 ==========
console.log('✨ 3. 快捷方法');

const userSchema = dsl({
  mobile: 'string!'.phoneNumber('cn'),
  id: 'string!'.idCard('cn')
});

console.log('验证快捷方法:', validate(userSchema, {
  mobile: '13800138000',
  id: '110101199003071234'
}).valid);
console.log('');

// ========== 4. Schema复用 - 不重复代码 ==========
console.log('✨ 4. Schema复用');

// 定义一次，到处使用
const emailField = SchemaUtils.reusable(() => dsl('email!'));

const loginForm = dsl({ email: emailField() });
const registerForm = dsl({ email: emailField(), name: 'string!' });

console.log('复用Schema成功');
console.log('');

// ========== 5. Schema合并 - 灵活组合 ==========
console.log('✨ 5. Schema合并');

const baseUser = dsl({ name: 'string!', email: 'email!' });
const withAge = dsl({ age: 'number:18-120' });

const fullUser = SchemaUtils.merge(baseUser, withAge);

console.log('合并后字段:', Object.keys(fullUser.properties));
console.log('');

// ========== 6. 批量验证 - 快50倍 ==========
console.log('✨ 6. 批量验证');

const users = [
  { email: 'user1@example.com' },
  { email: 'invalid' },
  { email: 'user3@example.com' }
];

const { Validator } = require('../index');
const batchResult = SchemaUtils.validateBatch(
  dsl({ email: 'email!' }),
  users,
  new Validator() // 批量验证需要 Validator 实例以复用编译结果
);

console.log('批量验证:', {
  总数: batchResult.summary.total,
  有效: batchResult.summary.valid,
  无效: batchResult.summary.invalid,
  耗时: `${batchResult.summary.duration}ms`
});
console.log('');

// ========== 总结 ==========
console.log('========== 核心理念 ==========');
console.log(`
✨ SchemaIO v2.0.1 三大特点：

1. 简洁
   'array!1-10'           // 一眼看懂
   .phoneNumber('cn')     // 不用找正则

2. 直观
   dsl.match('type', {    // 清晰的条件映射
     email: 'email!',
     phone: 'string:11!'
   })

3. 强大
   SchemaUtils.merge()    // 灵活组合
   validateBatch()        // 快50倍

🎉 简洁 + 直观 + 强大 = 完美验证库！
`);
