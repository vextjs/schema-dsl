/**
 * schema-dsl 多语言错误处理完整示例
 *
 * 展示如何动态配置多语言来使用 dsl.error.throw('account.notFound')
 *
 * @version 1.1.5+
 * @author schema-dsl Team
 */

const { dsl, Locale } = require('schema-dsl');

// ============================================================
// 第一步：配置语言包
// ============================================================

console.log('📚 步骤1：配置多语言包\n');

// 方式1：使用 Locale.addLocale() 添加单个语言
Locale.addLocale('zh-CN', {
  // 字符串格式（向后兼容）
  'user.notFound': '用户不存在',

  // 对象格式（v1.1.5+ 推荐）- 统一数字错误码
  'account.notFound': {
    code: 40001,
    message: '账户不存在'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '余额不足，当前余额{{#balance}}元，需要{{#required}}元'
  },
  'order.notPaid': {
    code: 50001,
    message: '订单未支付'
  },
  'permission.denied': {
    code: 40003,
    message: '您没有权限执行此操作'
  }
});

Locale.addLocale('en-US', {
  'user.notFound': 'User not found',

  'account.notFound': {
    code: 40001,  // 相同的数字码
    message: 'Account not found'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: 'Insufficient balance: current {{#balance}}, required {{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: 'Order not paid'
  },
  'permission.denied': {
    code: 40003,
    message: 'Permission denied'
  }
});

Locale.addLocale('ja-JP', {
  'user.notFound': 'ユーザーが見つかりません',

  'account.notFound': {
    code: 40001,
    message: 'アカウントが見つかりません'
  },
  'account.insufficientBalance': {
    code: 40002,
    message: '残高不足: 現在{{#balance}}、必要{{#required}}'
  },
  'order.notPaid': {
    code: 50001,
    message: '注文が未払いです'
  },
  'permission.denied': {
    code: 40003,
    message: 'アクセス権限がありません'
  }
});

// 方式2：批量配置（使用 dsl.config）
dsl.config({
  i18n: {
    'zh-CN': {
      'payment.failed': {
        code: 50002,
        message: '支付失败：{{#reason}}'
      }
    },
    'en-US': {
      'payment.failed': {
        code: 50002,
        message: 'Payment failed: {{#reason}}'
      }
    }
  }
});

console.log('✅ 语言包配置完成\n');

// ============================================================
// 第二步：设置默认语言
// ============================================================

console.log('📚 步骤2：设置默认语言\n');

Locale.setLocale('zh-CN');
console.log(`✅ 默认语言设置为: ${Locale.getLocale()}\n`);

// ============================================================
// 第三步：使用 dsl.error 抛出多语言错误
// ============================================================

console.log('📚 步骤3：使用 dsl.error 抛出多语言错误\n');

// 3.1 使用默认语言（全局语言）
console.log('--- 3.1 使用默认语言（全局语言）---');
try {
  dsl.error.throw('account.notFound');
} catch (error) {
  console.log('错误码:', error.code);           // 40001
  console.log('原始Key:', error.originalKey);   // 'account.notFound'
  console.log('错误消息:', error.message);      // '账户不存在'
  console.log('语言:', error.locale);           // 'zh-CN'
  console.log('状态码:', error.statusCode);     // 400
  console.log();
}

// 3.2 运行时指定语言（推荐用于API）⭐
console.log('--- 3.2 运行时指定语言（英文）---');
try {
  dsl.error.throw('account.notFound', {}, 404, 'en-US');
} catch (error) {
  console.log('错误码:', error.code);           // 40001
  console.log('原始Key:', error.originalKey);   // 'account.notFound'
  console.log('错误消息:', error.message);      // 'Account not found'
  console.log('语言:', error.locale);           // 'en-US'
  console.log();
}

// 3.3 带参数的错误消息
console.log('--- 3.3 带参数的错误消息（中文）---');
try {
  dsl.error.throw('account.insufficientBalance', {
    balance: 50,
    required: 100
  }, 400, 'zh-CN');
} catch (error) {
  console.log('错误消息:', error.message);
  // '余额不足，当前余额50元，需要100元'
  console.log('参数:', error.params);
  console.log();
}

console.log('--- 3.4 带参数的错误消息（英文）---');
try {
  dsl.error.throw('account.insufficientBalance', {
    balance: 50,
    required: 100
  }, 400, 'en-US');
} catch (error) {
  console.log('错误消息:', error.message);
  // 'Insufficient balance: current 50, required 100'
  console.log();
}

// ============================================================
// 第四步：使用 dsl.error.create（创建但不抛出）
// ============================================================

console.log('📚 步骤4：使用 dsl.error.create（创建但不抛出）\n');

const error1 = dsl.error.create('account.notFound', {}, 404, 'zh-CN');
console.log('中文错误:', error1.message);

const error2 = dsl.error.create('account.notFound', {}, 404, 'en-US');
console.log('英文错误:', error2.message);

const error3 = dsl.error.create('account.notFound', {}, 404, 'ja-JP');
console.log('日文错误:', error3.message);
console.log();

// ============================================================
// 第五步：使用 dsl.error.assert（断言方式）
// ============================================================

console.log('📚 步骤5：使用 dsl.error.assert（断言方式）\n');

// 模拟数据
const account = null;
const user = { role: 'user' };

// 5.1 断言账户存在
console.log('--- 5.1 断言账户存在（中文）---');
try {
  dsl.error.assert(account, 'account.notFound', {}, 404, 'zh-CN');
  console.log('账户存在');
} catch (error) {
  console.log('断言失败:', error.message);
  console.log();
}

// 5.2 断言权限
console.log('--- 5.2 断言权限（英文）---');
try {
  dsl.error.assert(
    user.role === 'admin',
    'permission.denied',
    {},
    403,
    'en-US'
  );
  console.log('权限通过');
} catch (error) {
  console.log('断言失败:', error.message);
  console.log();
}

// ============================================================
// 第六步：错误判断（error.is()）
// ============================================================

console.log('📚 步骤6：错误判断（error.is()）\n');

try {
  dsl.error.throw('account.notFound');
} catch (error) {
  // 方式1：使用 originalKey 判断
  if (error.is('account.notFound')) {
    console.log('✅ 使用 originalKey 判断成功');
  }

  // 方式2：使用数字 code 判断（v1.1.5+）
  if (error.is(40001)) {
    console.log('✅ 使用数字 code 判断成功');
  }
  console.log();
}

// ============================================================
// 第七步：Express/Koa 中的实际应用
// ============================================================

console.log('📚 步骤7：Express/Koa 中的实际应用\n');

// 模拟 Express 请求处理
function expressHandler(req, res) {
  try {
    // 从请求头获取语言
    const locale = req.headers['accept-language'] || 'zh-CN';

    // 模拟业务逻辑
    const account = findAccount(req.params.id);

    // 使用运行时语言抛出错误
    dsl.error.assert(account, 'account.notFound', {}, 404, locale);

    // 检查余额
    dsl.error.assert(
      account.balance >= req.body.amount,
      'account.insufficientBalance',
      {
        balance: account.balance,
        required: req.body.amount
      },
      400,
      locale
    );

    res.json({ success: true, account });
  } catch (error) {
    // 返回多语言错误
    res.status(error.statusCode).json(error.toJSON());
  }
}

// 模拟中文请求
console.log('--- 模拟中文请求 ---');
const req1 = {
  headers: { 'accept-language': 'zh-CN' },
  params: { id: '123' },
  body: { amount: 100 }
};
const res1 = {
  json: (data) => console.log('响应:', JSON.stringify(data, null, 2)),
  status: (code) => ({ json: (data) => {
    console.log(`状态码: ${code}`);
    console.log('响应:', JSON.stringify(data, null, 2));
  }})
};
expressHandler(req1, res1);
console.log();

// 模拟英文请求
console.log('--- 模拟英文请求 ---');
const req2 = {
  headers: { 'accept-language': 'en-US' },
  params: { id: '123' },
  body: { amount: 100 }
};
const res2 = {
  json: (data) => console.log('响应:', JSON.stringify(data, null, 2)),
  status: (code) => ({ json: (data) => {
    console.log(`状态码: ${code}`);
    console.log('响应:', JSON.stringify(data, null, 2));
  }})
};
expressHandler(req2, res2);
console.log();

// ============================================================
// 第八步：前端统一错误处理
// ============================================================

console.log('📚 步骤8：前端统一错误处理示例\n');

// 前端错误处理示例（JavaScript）
const frontendErrorHandler = `
// 前端统一错误处理（使用数字 code）
async function handleRequest() {
  try {
    const response = await fetch('/api/account/123');
    const data = await response.json();
    
    if (!response.ok) {
      throw data;  // 服务端返回的错误对象
    }
    
    return data;
  } catch (error) {
    // 根据数字 code 统一处理，不受语言影响
    switch (error.code) {
      case 40001:  // ACCOUNT_NOT_FOUND
        showNotFoundPage();
        break;
      case 40002:  // INSUFFICIENT_BALANCE
        showTopUpDialog(error.params);
        break;
      case 50001:  // ORDER_NOT_PAID
        showPaymentDialog();
        break;
      default:
        showGenericError(error.message);
    }
  }
}
`;

console.log(frontendErrorHandler);

// ============================================================
// 工具函数
// ============================================================

function findAccount(id) {
  // 模拟查询失败
  return null;
}

// ============================================================
// 总结
// ============================================================

console.log('\n📝 总结\n');
console.log('✅ 1. 使用 Locale.addLocale() 或 dsl.config() 配置语言包');
console.log('✅ 2. 使用 Locale.setLocale() 设置默认语言');
console.log('✅ 3. 使用 dsl.error.throw() 抛出多语言错误');
console.log('✅ 4. 使用 dsl.error.create() 创建错误（不抛出）');
console.log('✅ 5. 使用 dsl.error.assert() 断言式错误处理');
console.log('✅ 6. 使用 error.is() 判断错误类型（支持 key 和 code）');
console.log('✅ 7. API 开发中使用运行时语言（推荐）');
console.log('✅ 8. 前端使用统一的数字 code 处理错误');
console.log('\n🎯 关键点：');
console.log('  - 对象格式支持统一数字错误码（v1.1.5+）');
console.log('  - 运行时语言不改变全局状态（并发安全）');
console.log('  - 完全向后兼容字符串格式');
console.log('  - 多语言共享相同的数字 code');
console.log('\n📖 完整文档：docs/error-handling.md 和 docs/runtime-locale-support.md');
