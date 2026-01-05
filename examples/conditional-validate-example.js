/**
 * ConditionalBuilder 快捷验证方法示例
 *
 * 展示 .validate() 和 .check() 方法的使用
 */

const { dsl } = require('../index');

console.log('========================================');
console.log('ConditionalBuilder - 快捷验证方法示例');
console.log('========================================\n');

// ============================================
// 示例1：一行代码验证
// ============================================
console.log('【示例1】一行代码验证');
console.log('----------------------------');

const result1 = dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .validate({ age: 16 });

console.log('验证未成年用户:', result1.valid ? '✅ 通过' : '❌ 失败');
if (!result1.valid) {
  console.log('错误:', result1.errors[0].message);
}

const result2 = dsl.if(d => d.age < 18)
  .message('未成年用户不能注册')
  .validate({ age: 20 });

console.log('验证成年用户:', result2.valid ? '✅ 通过' : '❌ 失败');

// ============================================
// 示例2：复用验证器
// ============================================
console.log('\n【示例2】复用验证器');
console.log('----------------------------');

const ageValidator = dsl.if(d => d.age < 18).message('未成年用户不能注册');

const users = [
  { name: '张三', age: 16 },
  { name: '李四', age: 20 },
  { name: '王五', age: 17 },
  { name: '赵六', age: 25 }
];

users.forEach(user => {
  const result = ageValidator.validate(user);
  console.log(`${user.name}(${user.age}岁):`, result.valid ? '✅ 可以注册' : '❌ 不能注册');
});

// ============================================
// 示例3：.check() 快速判断
// ============================================
console.log('\n【示例3】.check() 快速判断');
console.log('----------------------------');

const canRegister = dsl.if(d => d.age < 18)
  .or(d => d.status === 'blocked')
  .message('不允许注册');

const testUsers = [
  { name: '用户A', age: 16, status: 'active' },
  { name: '用户B', age: 20, status: 'blocked' },
  { name: '用户C', age: 20, status: 'active' }
];

testUsers.forEach(user => {
  const isValid = canRegister.check(user);
  console.log(`${user.name}:`, isValid ? '✅ 允许注册' : '❌ 禁止注册');
});

// ============================================
// 示例4：then/else 动态验证
// ============================================
console.log('\n【示例4】then/else 动态验证');
console.log('----------------------------');

const emailValidator = dsl.if(d => d.userType === 'admin')
  .then('email!')  // 管理员必填
  .else('email');  // 普通用户可选

// 管理员有邮箱
const r1 = emailValidator.validate({
  userType: 'admin',
  email: 'admin@example.com'
});
console.log('管理员有邮箱:', r1.valid ? '✅ 通过' : '❌ 失败');

// 管理员无邮箱
const r2 = emailValidator.validate({
  userType: 'admin',
  email: ''
});
console.log('管理员无邮箱:', r2.valid ? '✅ 通过' : '❌ 失败');

// 普通用户无邮箱
const r3 = emailValidator.validate({
  userType: 'user',
  email: ''
});
console.log('普通用户无邮箱:', r3.valid ? '✅ 通过' : '❌ 失败');

// ============================================
// 示例5：非对象类型验证
// ============================================
console.log('\n【示例5】非对象类型验证');
console.log('----------------------------');

// 验证字符串
const stringValidator = dsl.if(d => typeof d === 'string' && d.includes('@'))
  .then('email!')
  .else('string:1-50');

const r4 = stringValidator.validate('test@example.com');
console.log('邮箱格式:', r4.valid ? '✅ 通过' : '❌ 失败');

const r5 = stringValidator.validate('just a text');
console.log('普通文本:', r5.valid ? '✅ 通过' : '❌ 失败');

// 验证数组
const arrayValidator = dsl.if(d => Array.isArray(d) && d.length > 5)
  .message('数组最多5个元素');

const r6 = arrayValidator.validate([1, 2, 3]);
console.log('3个元素:', r6.valid ? '✅ 通过' : '❌ 失败');

const r7 = arrayValidator.validate([1, 2, 3, 4, 5, 6]);
console.log('6个元素:', r7.valid ? '✅ 通过' : '❌ 失败');
if (!r7.valid) {
  console.log('错误:', r7.errors[0].message);
}

// ============================================
// 示例6：多语言支持
// ============================================
console.log('\n【示例6】多语言支持');
console.log('----------------------------');

const i18nValidator = dsl.if(d => d.age < 18)
  .message('conditional.underAge');

// 中文
const r8 = i18nValidator.validate({ age: 16 }, { locale: 'zh-CN' });
console.log('中文:', r8.valid ? '✅ 通过' : '❌ 失败');
if (!r8.valid) {
  console.log('错误:', r8.errors[0].message);
}

// 英文
const r9 = i18nValidator.validate({ age: 16 }, { locale: 'en-US' });
console.log('英文:', r9.valid ? '✅ 通过' : '❌ 失败');
if (!r9.valid) {
  console.log('错误:', r9.errors[0].message);
}

// ============================================
// 示例7：实际业务场景
// ============================================
console.log('\n【示例7】实际业务场景 - 用户注册');
console.log('----------------------------');

// 创建多个验证器
const validators = {
  age: dsl.if(d => d.age < 18)
    .message('未成年用户不能注册'),

  email: dsl.if(d => d.userType === 'admin')
    .then('email!')
    .else('email'),

  phone: dsl.if(d => d.userType === 'vip')
    .then('string:11!')
    .else(null)
};

// 验证用户
function validateUser(userData) {
  console.log(`\n验证用户: ${userData.username}`);

  // 年龄检查
  if (!validators.age.check(userData)) {
    console.log('❌ 年龄验证失败');
    return false;
  }

  // 邮箱检查
  const emailResult = validators.email.validate(userData);
  if (!emailResult.valid) {
    console.log('❌ 邮箱验证失败:', emailResult.errors[0].message);
    return false;
  }

  // 手机号检查
  const phoneResult = validators.phone.validate(userData);
  if (!phoneResult.valid) {
    console.log('❌ 手机号验证失败:', phoneResult.errors[0].message);
    return false;
  }

  console.log('✅ 所有验证通过');
  return true;
}

// 测试数据
const userData1 = {
  username: 'admin1',
  age: 25,
  userType: 'admin',
  email: 'admin@example.com'
};

const userData2 = {
  username: 'user1',
  age: 16,
  userType: 'user',
  email: ''
};

validateUser(userData1);
validateUser(userData2);

// ============================================
// 示例8：异步验证 - .validateAsync()
// ============================================
console.log('\n【示例8】异步验证 - .validateAsync()');
console.log('----------------------------');

async function asyncRegister() {
  const ageValidator = dsl.if(d => d.age < 18)
    .message('未成年用户不能注册');

  // 验证通过
  try {
    const data1 = await ageValidator.validateAsync({ age: 20, name: '张三' });
    console.log('✅ 验证通过:', data1.name);
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
  }

  // 验证失败
  try {
    await ageValidator.validateAsync({ age: 16, name: '李四' });
  } catch (error) {
    console.log('❌ 验证失败:', error.message);
  }
}

asyncRegister();

// ============================================
// 示例9：断言验证 - .assert()
// ============================================
console.log('\n【示例9】断言验证 - .assert()');
console.log('----------------------------');

function createUser(userData) {
  try {
    // 断言验证，失败直接抛错
    dsl.if(d => d.age < 18)
      .message('未成年用户不能注册')
      .assert(userData);

    dsl.if(d => !d.email || d.email.length === 0)
      .message('邮箱不能为空')
      .assert(userData);

    console.log(`✅ 用户 ${userData.name} 创建成功`);
    return { success: true, user: userData };
  } catch (error) {
    console.log(`❌ 用户 ${userData.name} 创建失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

createUser({ name: '张三', age: 20, email: 'zhangsan@example.com' });
createUser({ name: '李四', age: 16, email: 'lisi@example.com' });
createUser({ name: '王五', age: 20, email: '' });

// ============================================
// 示例10：Express 中间件场景（模拟）
// ============================================
console.log('\n【示例10】Express 中间件场景（模拟）');
console.log('----------------------------');

// 模拟 Express 中间件
async function checkPermission(req, res, next) {
  try {
    await dsl.if(d => d.role !== 'admin' && d.role !== 'moderator')
      .message('权限不足')
      .validateAsync(req.user);

    console.log('✅ 权限验证通过');
    next();
  } catch (error) {
    console.log('❌ 权限不足:', error.message);
    res.status = 403;
    res.error = error.message;
  }
}

// 模拟请求
const mockReq1 = { user: { name: 'admin', role: 'admin' } };
const mockReq2 = { user: { name: 'user', role: 'user' } };
const mockRes = { status: 200, error: null };
const mockNext = () => console.log('   继续处理请求...');

(async () => {
  console.log('请求1 - 管理员:');
  await checkPermission(mockReq1, mockRes, mockNext);

  console.log('请求2 - 普通用户:');
  await checkPermission(mockReq2, mockRes, mockNext);
})();

console.log('\n========================================');
console.log('示例运行完成！');
console.log('========================================');

