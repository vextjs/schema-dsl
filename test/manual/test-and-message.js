/**
 * 测试 .and() 后可以调用 .message() 功能
 */

const { dsl } = require('../../index');

console.log('=== 测试 .and() 独立消息功能 ===\n');

// 测试1: 账户存在，余额不足
console.log('测试1: 账户存在，余额不足');
const amount = 100;
const account = { tradable_credits: 50 };

try {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.tradable_credits < amount)
    .message('INSUFFICIENT_TRADABLE_CREDITS')
    .assert(account);

  console.log('✅ 验证通过（不应该发生）\n');
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
  console.log('期望: INSUFFICIENT_TRADABLE_CREDITS');
  console.log('匹配:', error.message === 'INSUFFICIENT_TRADABLE_CREDITS' ? '✅' : '❌');
  console.log();
}

// 测试2: 账户不存在
console.log('测试2: 账户不存在');
try {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.tradable_credits < amount)
    .message('INSUFFICIENT_TRADABLE_CREDITS')
    .assert(null);

  console.log('✅ 验证通过（不应该发生）\n');
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
  console.log('期望: ACCOUNT_NOT_FOUND');
  console.log('匹配:', error.message === 'ACCOUNT_NOT_FOUND' ? '✅' : '❌');
  console.log();
}

// 测试3: 账户存在且余额充足
console.log('测试3: 账户存在且余额充足');
const account3 = { tradable_credits: 150 };
try {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.tradable_credits < amount)
    .message('INSUFFICIENT_TRADABLE_CREDITS')
    .assert(account3);

  console.log('✅ 验证通过');
  console.log();
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
  console.log('不应该有错误\n');
}

// 测试4: 多个 .and() 条件
console.log('测试4: 多个 .and() 条件');
const account4 = { tradable_credits: 50, status: 'inactive' };
try {
  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.status !== 'active')
    .message('ACCOUNT_INACTIVE')
    .and(d => d.tradable_credits < amount)
    .message('INSUFFICIENT_TRADABLE_CREDITS')
    .assert(account4);

  console.log('✅ 验证通过（不应该发生）\n');
} catch (error) {
  console.log('❌ 捕获错误:', error.message);
  console.log('期望: ACCOUNT_INACTIVE (第一个失败的条件)');
  console.log('匹配:', error.message === 'ACCOUNT_INACTIVE' ? '✅' : '❌');
  console.log();
}

console.log('=== 测试完成 ===');

