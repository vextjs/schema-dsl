const { dsl } = require('../../index');

console.log('快速验证功能...\n');

// 测试1
try {
  const amount = 100;
  const account = { tradable_credits: 50 };

  dsl.if(d => !d)
    .message('ACCOUNT_NOT_FOUND')
    .and(d => d.tradable_credits < amount)
    .message('INSUFFICIENT_TRADABLE_CREDITS')
    .assert(account);

  console.log('❌ 测试1失败：应该抛错');
  process.exit(1);
} catch (error) {
  if (error.message === 'INSUFFICIENT_TRADABLE_CREDITS') {
    console.log('✅ 测试1通过：正确返回余额不足消息');
  } else {
    console.log('❌ 测试1失败：错误消息不对 -', error.message);
    process.exit(1);
  }
}

// 测试2
try {
  dsl.if(d => !d)
    .message('NOT_FOUND')
    .assert(null);

  console.log('❌ 测试2失败：应该抛错');
  process.exit(1);
} catch (error) {
  if (error.message === 'NOT_FOUND') {
    console.log('✅ 测试2通过：正确返回NOT_FOUND消息');
  } else {
    console.log('❌ 测试2失败：错误消息不对 -', error.message);
    process.exit(1);
  }
}

console.log('\n✅ 所有测试通过！功能正常！');

