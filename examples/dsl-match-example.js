/**
 * DSL Match 语法示例 (v2.1.0)
 *
 * 展示如何使用 dsl.match 和 dsl.if 进行条件验证
 */

const { dsl, validate } = require('../index');
const fs = require('fs');

function log(msg) {
  console.log(msg);
  fs.appendFileSync('dsl-match-output.txt', msg + '\n');
}

log('Start example...');

log('========== DSL Match 语法示例 ==========\n');

// 1. 基本用法：根据类型验证格式
log('✨ 1. 基本用法');

const contactSchema = dsl({
  contactType: 'email|phone',

  // 根据 contactType 的值决定 contact 的验证规则
  contact: dsl.match('contactType', {
    email: 'email!',
    phone: 'string:11!',
    _default: 'string'
  })
});

const data1 = { contactType: 'email', contact: 'test@example.com' };
log('Email验证: ' + (validate(contactSchema, data1).valid ? '✅ 通过' : '❌ 失败'));

const data2 = { contactType: 'phone', contact: '13800138000' };
log('Phone验证: ' + (validate(contactSchema, data2).valid ? '✅ 通过' : '❌ 失败'));

const data3 = { contactType: 'phone', contact: '123456789012' }; // 12位，超过11
log('错误验证: ' + (validate(contactSchema, data3).valid ? '✅ 通过' : '❌ 失败'));
log('');


// 2. 处理中文和特殊字符
log('✨ 2. 中文和特殊字符');

const discountSchema = dsl({
  level: 'string',

  discount: dsl.match('level', {
    '普通用户': 'number:0-5',
    'VIP-1':   'number:0-20',
    '100':     'number:0-50'
  })
});

log('普通用户: ' + validate(discountSchema, { level: '普通用户', discount: 3 }).valid);
log('VIP-1: ' + validate(discountSchema, { level: 'VIP-1', discount: 15 }).valid);
log('');


// 3. dsl.if 简单条件
log('✨ 3. dsl.if 简单条件');

const vipSchema = dsl({
  isVip: 'boolean',
  // 如果是VIP，折扣0-50，否则0-10
  discount: dsl.if('isVip', 'number:0-50', 'number:0-10')
});

log('VIP折扣: ' + validate(vipSchema, { isVip: true, discount: 40 }).valid);
log('非VIP折扣: ' + validate(vipSchema, { isVip: false, discount: 40 }).valid); // false
log('');
