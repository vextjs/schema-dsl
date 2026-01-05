/**
 * ConditionalBuilder 非对象类型示例
 *
 * 展示如何直接验证字符串、数组、布尔值等非对象类型
 */

const { dsl, validate } = require('../index');

console.log('========================================');
console.log('ConditionalBuilder - 非对象类型示例');
console.log('========================================\n');

// ============================================
// 示例1：直接验证字符串
// ============================================
console.log('【示例1】直接验证字符串');
console.log('----------------------------');

const stringSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:1-50');

const r1 = validate(stringSchema, 'test@example.com');
console.log('✅ 邮箱格式:', r1.valid ? '验证通过' : '验证失败');

const r2 = validate(stringSchema, 'just a text');
console.log('✅ 普通文本:', r2.valid ? '验证通过' : '验证失败');

// ============================================
// 示例2：直接验证数组
// ============================================
console.log('\n【示例2】直接验证数组');
console.log('----------------------------');

const arraySchema = dsl.if((data) => Array.isArray(data) && data.length > 5)
  .message('数组最多5个元素');

const r3 = validate(arraySchema, [1, 2, 3]);
console.log('✅ 3个元素:', r3.valid ? '验证通过' : '验证失败');

const r4 = validate(arraySchema, [1, 2, 3, 4, 5, 6]);
console.log('❌ 6个元素:', r4.valid ? '验证通过' : '验证失败');
if (!r4.valid) {
  console.log('   错误:', r4.errors[0].message);
}

// ============================================
// 示例3：直接验证数字
// ============================================
console.log('\n【示例3】直接验证数字');
console.log('----------------------------');

const numberSchema = dsl.if((data) => typeof data === 'number' && data < 0)
  .message('不允许负数')
  .else(null); // 不需要额外验证

const r5 = validate(numberSchema, 10);
console.log('✅ 正数:', r5.valid ? '验证通过' : '验证失败');

const r6 = validate(numberSchema, -5);
console.log('❌ 负数:', r6.valid ? '验证通过' : '验证失败');
if (!r6.valid) {
  console.log('   错误:', r6.errors[0].message);
}

// ============================================
// 示例4：字符串类型判断（邮箱或手机号）
// ============================================
console.log('\n【示例4】自动识别邮箱或手机号');
console.log('----------------------------');

const contactSchema = dsl.if((data) => typeof data === 'string' && data.includes('@'))
  .then('email!')
  .else('string:11!');

const r7 = validate(contactSchema, 'user@example.com');
console.log('✅ 邮箱:', r7.valid ? '验证通过' : '验证失败');

const r8 = validate(contactSchema, '13800138000');
console.log('✅ 手机号:', r8.valid ? '验证通过' : '验证失败');

const r9 = validate(contactSchema, 'invalid');
console.log('❌ 无效输入:', r9.valid ? '验证通过' : '验证失败');
if (!r9.valid) {
  console.log('   错误:', r9.errors[0].message);
}

// ============================================
// 示例5：复杂条件组合
// ============================================
console.log('\n【示例5】字符串长度 + 内容组合判断');
console.log('----------------------------');

const complexSchema = dsl.if((data) => typeof data === 'string' && data.length > 20)
  .and((data) => data.includes('@'))
  .then('email!')
  .else('string:1-50');

const r10 = validate(complexSchema, 'short');
console.log('✅ 短字符串:', r10.valid ? '验证通过' : '验证失败');

const r11 = validate(complexSchema, 'this-is-a-long-email@example.com');
console.log('✅ 长邮箱:', r11.valid ? '验证通过' : '验证失败');

const r12 = validate(complexSchema, 'this is a very long string without at symbol');
console.log('✅ 长文本（无@）:', r12.valid ? '验证通过' : '验证失败');

// ============================================
// 示例6：边界值处理
// ============================================
console.log('\n【示例6】边界值处理');
console.log('----------------------------');

const boundarySchema = dsl.if((data) => data === null || data === undefined || data === '')
  .message('值不能为空');

const r13 = validate(boundarySchema, 'valid value');
console.log('✅ 有效值:', r13.valid ? '验证通过' : '验证失败');

const r14 = validate(boundarySchema, '');
console.log('❌ 空字符串:', r14.valid ? '验证通过' : '验证失败');
if (!r14.valid) {
  console.log('   错误:', r14.errors[0].message);
}

console.log('\n========================================');
console.log('示例运行完成！');
console.log('========================================');

