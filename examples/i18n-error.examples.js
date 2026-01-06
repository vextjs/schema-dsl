/**
 * I18nError 使用示例
 *
 * 统一的多语言错误抛出机制
 *
 * @version 1.1.1
 */

const { I18nError, dsl, Locale } = require('../index');

console.log('=== I18nError 使用示例 ===\n');

// ========== 1. 基础用法 ==========
console.log('1. 基础用法：');
try {
  throw I18nError.create('account.notFound');
} catch (error) {
  console.log('错误:', error.message); // "账户不存在"
  console.log('代码:', error.code); // "account.notFound"
}

// ========== 2. 带参数的错误 ==========
console.log('\n2. 带参数的错误：');
try {
  throw I18nError.create('account.insufficientBalance', {
    balance: 50,
    required: 100
  });
} catch (error) {
  console.log('错误:', error.message); // "余额不足，当前余额50，需要100"
}

// ========== 3. 使用 throw 方法 ==========
console.log('\n3. 使用 throw 方法（直接抛错）：');
try {
  I18nError.throw('user.noPermission');
} catch (error) {
  console.log('错误:', error.message); // "没有管理员权限"
}

// ========== 4. 使用 assert 断言 ==========
console.log('\n4. 使用 assert 断言：');
const account = { balance: 50 };

try {
  I18nError.assert(account.balance >= 100, 'account.insufficientBalance', {
    balance: account.balance,
    required: 100
  });
} catch (error) {
  console.log('错误:', error.message);
}

// ========== 5. dsl.error 快捷方法 ==========
console.log('\n5. dsl.error 快捷方法：');
try {
  dsl.error.throw('order.notPaid');
} catch (error) {
  console.log('错误:', error.message); // "订单未支付"
}

// ========== 6. 多语言支持 ==========
console.log('\n6. 多语言支持：');
try {
  // 中文
  Locale.setLocale('zh-CN');
  throw I18nError.create('account.notFound');
} catch (error) {
  console.log('中文:', error.message); // "账户不存在"
}

try {
  // 英文
  Locale.setLocale('en-US');
  throw I18nError.create('account.notFound');
} catch (error) {
  console.log('英文:', error.message); // "Account not found"
}

// 恢复中文
Locale.setLocale('zh-CN');

// ========== 7. 实际业务场景 =========
console.log('\n7. 实际业务场景：');

// 场景1：账户验证函数
function getAccount(id) {
  const account = id === '123' ? { id: '123', balance: 50, status: 'active' } : null;

  // 断言账户存在
  I18nError.assert(account, 'account.notFound');

  // 断言账户状态
  I18nError.assert(account.status === 'active', 'account.inactive');

  // 断言余额充足
  I18nError.assert(
    account.balance >= 100,
    'account.insufficientBalance',
    { balance: account.balance, required: 100 }
  );

  return account;
}

try {
  getAccount('123');
} catch (error) {
  console.log('业务错误:', error.message);
  console.log('错误代码:', error.code);
}

// 场景2：与 dsl.if 结合
console.log('\n8. 与 dsl.if 结合使用：');
function validateUser(user) {
  // 使用 dsl.if 进行数据验证
  dsl.if(d => !d)
    .message('user.notFound')
    .and(d => !d.isVerified)
    .message('user.notVerified')
    .assert(user);

  // 使用 I18nError 进行业务逻辑验证
  I18nError.assert(user.role === 'admin', 'user.noPermission');
}

try {
  validateUser({ isVerified: true, role: 'user' });
} catch (error) {
  console.log('验证错误:', error.message);
}

// ========== 9. Express/Koa 中间件 ==========
console.log('\n9. Express/Koa 错误处理：');

// Express 错误处理中间件
function expressErrorHandler(error, req, res, next) {
  if (error instanceof I18nError) {
    return res.status(error.statusCode).json(error.toJSON());
  }
  next(error);
}

// 模拟使用
const mockError = I18nError.create('account.notFound', {}, 404);
const mockRes = {
  status: (code) => {
    console.log('HTTP Status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('Response:', JSON.stringify(data, null, 2));
    return mockRes;
  }
};

expressErrorHandler(mockError, {}, mockRes, () => {});

// ========== 10. 自定义状态码 ==========
console.log('\n10. 自定义状态码：');
try {
  throw I18nError.create('user.notFound', {}, 404);
} catch (error) {
  console.log('状态码:', error.statusCode); // 404
  console.log('错误:', error.message);
}

// ========== 11. 错误检查 ==========
console.log('\n11. 错误类型检查：');
try {
  throw I18nError.create('account.notFound');
} catch (error) {
  if (error instanceof I18nError) {
    console.log('是 I18nError:', true);
    console.log('是账户不存在:', error.is('account.notFound'));
    console.log('是用户不存在:', error.is('user.notFound'));
  }
}

console.log('\n=== 示例完成 ===');

