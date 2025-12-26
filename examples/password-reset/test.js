/**
 * 密码重置测试示例
 */

const passwordResetSchema = require('./schema');

async function runTests() {
  console.log('========================================');
  console.log('  密码重置验证测试');
  console.log('========================================\n');

  // 测试1：成功案例
  console.log('【测试1】成功案例');
  const validData = {
    newPassword: 'Password123',
    confirmPassword: 'Password123'
  };

  const result1 = await passwordResetSchema.validate(validData, {
    root: validData
  });

  console.log('数据:', validData);
  console.log('结果:', result1.isValid ? '✅ 验证通过' : '❌ 验证失败');
  if (!result1.isValid) {
    console.log('错误:', result1.errors);
  }
  console.log('');

  // 测试2：密码不一致
  console.log('【测试2】密码不一致');
  const invalidData1 = {
    newPassword: 'Password123',
    confirmPassword: 'Different123'
  };

  const result2 = await passwordResetSchema.validate(invalidData1, {
    root: invalidData1,
    abortEarly: false
  });

  console.log('数据:', invalidData1);
  console.log('结果:', result2.isValid ? '✅ 验证通过' : '❌ 验证失败');
  if (!result2.isValid) {
    result2.errors.forEach(err => {
      console.log(`  - ${err.message}`);
    });
  }
  console.log('');

  // 测试3：密码强度不够
  console.log('【测试3】密码强度不够');
  const invalidData2 = {
    newPassword: 'weak',
    confirmPassword: 'weak'
  };

  const result3 = await passwordResetSchema.validate(invalidData2, {
    root: invalidData2,
    abortEarly: false
  });

  console.log('数据:', invalidData2);
  console.log('结果:', result3.isValid ? '✅ 验证通过' : '❌ 验证失败');
  if (!result3.isValid) {
    result3.errors.forEach(err => {
      console.log(`  - ${err.message}`);
    });
  }
  console.log('');

  // 测试4：密码太长
  console.log('【测试4】密码太长');
  const invalidData3 = {
    newPassword: 'A'.repeat(65) + 'a1',
    confirmPassword: 'A'.repeat(65) + 'a1'
  };

  const result4 = await passwordResetSchema.validate(invalidData3, {
    root: invalidData3,
    abortEarly: false
  });

  console.log('数据: { newPassword: "' + invalidData3.newPassword.substring(0, 20) + '...", ... }');
  console.log('结果:', result4.isValid ? '✅ 验证通过' : '❌ 验证失败');
  if (!result4.isValid) {
    result4.errors.forEach(err => {
      console.log(`  - ${err.message}`);
    });
  }
  console.log('');

  console.log('========================================');
  console.log('  测试完成');
  console.log('========================================');
}

// 运行测试
runTests().catch(console.error);


